import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import type { PrismaClient } from "../generated/prisma/client.js";
import { env } from "../config/env.js";
import type { AiClients } from "../services/aiClients.js";
import type { VectorPayload } from "../services/vectorStore.js";

type Job = {
  reportId: string;
  userId: string;
  filePath: string;
};

type WorkerDeps = {
  prisma: PrismaClient;
  vectorStore: {
    upsert: (items: Array<{ id: string; vector: number[]; payload: VectorPayload }>) => Promise<void>;
  };
  aiClients: AiClients;
};

const SUMMARY_PROMPT = `You are a medical report analysis assistant.
Use only the given context from the uploaded report.
If the answer is not in the report, say that clearly.

Provide a structured summary with sections:
- Key Findings
- Abnormal Values (if any)
- Diagnoses/Impressions
- Questions to Ask Your Doctor
Include a brief layperson explanation after each section.`;

export const createIngestionWorker = ({ prisma, vectorStore, aiClients }: WorkerDeps) => {
  const queue: Job[] = [];
  let running = false;

  const enqueue = (job: Job) => {
    queue.push(job);
    void run();
  };

  const run = async () => {
    if (running) return;
    running = true;
    while (queue.length > 0) {
      const job = queue.shift();
      if (!job) break;
      await processJob(job);
    }
    running = false;
  };

  const processJob = async (job: Job) => {
    await prisma.report.update({
      where: { id: job.reportId },
      data: { status: "processing" },
    });

    try {
      const chunks = await parsePdf(job.filePath);
      const embeddings = await aiClients.embed.embed({ inputs: chunks.map((c) => c.text) });

      const items = embeddings.map((vector, index) => ({
        id: randomUUID(),
        vector,
        payload: {
          report_id: job.reportId,
          text: chunks[index].text,
          page: chunks[index].page,
          section: chunks[index].section,
        },
      }));

      await vectorStore.upsert(items);

      const summary = await generateSummary(chunks.map((c) => c.text));

      await prisma.report.update({
        where: { id: job.reportId },
        data: { status: "ready", summary },
      });
    } catch (error) {
      await prisma.report.update({
        where: { id: job.reportId },
        data: { status: "failed" },
      });
    }
  };

  const parsePdf = async (filePath: string) => {
    const fileData = await fs.readFile(filePath);
    const response = await fetch("https://api.llamaparse.com/v1/parsing", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.llamaParseKey}`,
      },
      body: (() => {
        const form = new FormData();
        form.append("file", new Blob([fileData]), path.basename(filePath));
        form.append("output_format", "markdown");
        form.append("include_page_numbers", "true");
        return form;
      })(),
    });

    if (!response.ok) {
      throw new Error("LlamaParse failed");
    }

    const data = (await response.json()) as { pages: Array<{ page: number; text: string }> };
    return data.pages.flatMap((page) => chunkMarkdown(page.text, page.page));
  };

  const chunkMarkdown = (text: string, page: number) => {
    const maxChars = 1200;
    const overlap = 200;
    const chunks: Array<{ text: string; page: number; section: string }> = [];
    let start = 0;
    let section = "";

    const lines = text.split("\n");
    const normalized = lines
      .map((line) => {
        if (line.startsWith("#")) {
          section = line.replace(/^#+\s*/, "").trim();
        }
        return line;
      })
      .join("\n");

    while (start < normalized.length) {
      const end = Math.min(start + maxChars, normalized.length);
      const slice = normalized.slice(start, end).trim();
      if (slice) {
        chunks.push({ text: slice, page, section });
      }
      start = end - overlap;
      if (start < 0) start = 0;
    }

    return chunks;
  };

  const generateSummary = async (contexts: string[]) => {
    const contextBlock = contexts.map((chunk) => `- ${chunk}`).join("\n\n");
    return aiClients.llm.generate({
      system: "You answer only from the provided report context.",
      prompt: `${SUMMARY_PROMPT}\n\nContext:\n${contextBlock}`,
      maxTokens: 900,
    });
  };

  const ensureUploadDir = async () => {
    await fs.mkdir(env.uploadDir, { recursive: true });
  };

  ensureUploadDir().catch(() => null);

  return { enqueue };
};
