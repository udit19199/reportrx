import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { env } from "../config/env.js";
import type { AiClients } from "./aiClients.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import type { VectorPayload } from "./vectorStore.js";

export type IngestionJob = {
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

const STRUCTURED_SUMMARY_SYSTEM = `You are a medical report analysis assistant.
You must output ONLY valid JSON with no markdown formatting, no code blocks, and no extra text.
Use only the given context from the uploaded report.
If the answer is not in the report, say that clearly.

The JSON must have exactly these three string fields:
- summary: A concise 2-4 paragraph overview of the report in plain language. Include key findings, abnormal values, diagnoses/impressions, and any stated recommendations.
- insights: 3-5 bullet points (as a single string with line breaks) highlighting the most important takeaways, risks, or patterns a patient should know about. Use reassuring but factual language.
- nextActions: 3-5 bullet points (as a single string with line breaks) of concrete next steps the patient should consider, such as questions to ask their doctor, follow-up tests, lifestyle changes, or referrals. Be specific and actionable.`;

type StructuredSummary = {
  summary: string;
  insights: string;
  nextActions: string;
};

export const createIngestionProcessor = (deps: WorkerDeps) => {
  const processJob = async (job: IngestionJob) => {
    console.log(`[IngestionWorker] Starting job for report ${job.reportId}`);

    await deps.prisma.report.update({
      where: { id: job.reportId },
      data: { status: "processing", errorMessage: null },
    });

    try {
      const chunks = await parsePdf(job.filePath);
      console.log(`[IngestionWorker] Parsed ${chunks.length} chunks for report ${job.reportId}`);

      if (chunks.length === 0) {
        throw new Error("No text could be extracted from the PDF.");
      }

      const embeddings = await deps.aiClients.embed.embed({
        inputs: chunks.map((chunk) => chunk.text),
      });

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

      await deps.vectorStore.upsert(items);
      console.log(`[IngestionWorker] Upserted ${items.length} vectors for report ${job.reportId}`);

      const { summary, insights, nextActions } = await generateStructuredSummary(
        deps.aiClients,
        chunks.map((chunk) => chunk.text)
      );
      console.log(`[IngestionWorker] Generated structured summary for report ${job.reportId}`);

      await deps.prisma.report.update({
        where: { id: job.reportId },
        data: { status: "ready", summary, insights, nextActions, errorMessage: null },
      });

      console.log(`[IngestionWorker] Completed job for report ${job.reportId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`[IngestionWorker] Failed job for report ${job.reportId}: ${message}`);

      await deps.prisma.report.update({
        where: { id: job.reportId },
        data: { status: "failed", errorMessage: message },
      });
    }
  };

  return { processJob };
};

const parsePdf = async (filePath: string) => {
  const fileData = await fs.readFile(filePath);
  const form = new FormData();
  form.append("file", new Blob([fileData]), path.basename(filePath));
  form.append("output_format", "markdown");
  form.append("include_page_numbers", "true");

  const response = await fetch("https://api.llamaparse.com/v1/parsing", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.llamaParseKey}`,
    },
    body: form,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`LlamaParse failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { pages: Array<{ page: number; text: string }> };
  return data.pages.flatMap((page) => splitMarkdownIntoChunks(page.text, page.page));
};

const splitMarkdownIntoChunks = (text: string, page: number) => {
  const maxChars = 1200;
  const overlap = 200;
  const chunks: Array<{ text: string; page: number; section: string }> = [];
  let start = 0;
  let section = "";

  const normalized = text
    .split("\n")
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

const generateStructuredSummary = async (aiClients: AiClients, contexts: string[]): Promise<StructuredSummary> => {
  const contextBlock = contexts.map((chunk) => `- ${chunk}`).join("\n\n");
  const result = await aiClients.llm.generateJson<StructuredSummary>({
    system: STRUCTURED_SUMMARY_SYSTEM,
    prompt: `Analyze the following medical report content and produce the required JSON fields.\n\nContext:\n${contextBlock}`,
    maxTokens: 1500,
  });

  return {
    summary: result.summary ?? "No summary available.",
    insights: result.insights ?? "No insights available.",
    nextActions: result.nextActions ?? "No next actions available.",
  };
};
