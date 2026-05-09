import { Router } from "express";
import { z } from "zod";
import type { PrismaClient } from "../generated/prisma/client.js";
import { requireAuth, type AuthedRequest } from "../middleware/authMiddleware.js";
import type { AiClients } from "../services/aiClients.js";

const analyzeSchema = z.object({
  reportId: z.string().min(1),
  query: z.string().min(1),
  topK: z.number().min(1).max(20).default(5),
});

const QA_PROMPT = `You are a medical report analysis assistant.
Use only the given context from the uploaded report.
If the answer is not in the report, say that clearly.
Answer in plain language and include brief explanations of medical terms.`;

export const createAnalyzeRouter = ({
  prisma,
  vectorStore,
  aiClients,
}: {
  prisma: PrismaClient;
  vectorStore: {
    search: (queryVector: number[], reportId: string, topK: number) => Promise<{ contexts: string[]; sources: string[] }>;
  };
  aiClients: AiClients;
}) => {
  const router = Router();

  router.post("/", requireAuth, async (req, res) => {
    const parsed = analyzeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const userId = (req as AuthedRequest).user.id;
    const { reportId, query, topK } = parsed.data;
    const report = await prisma.report.findFirst({ where: { id: reportId, userId } });
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    if (report.status !== "ready") {
      return res.status(409).json({ error: "Report not ready" });
    }

    const queryVector = (await aiClients.embed.embed({ inputs: [query] }))[0];
    const found = await vectorStore.search(queryVector, reportId, topK);
    if (found.contexts.length === 0) {
      return res.json({
        answer: "I could not find relevant sections in this report for that question.",
        sources: [],
      });
    }

    const contextBlock = found.contexts.map((chunk) => `- ${chunk}`).join("\n\n");
    const answer = await aiClients.llm.generate({
      system: "You answer only from the provided report context.",
      prompt: `${QA_PROMPT}\n\nContext:\n${contextBlock}\n\nQuestion: ${query}`,
    });

    return res.json({ answer, sources: found.sources });
  });

  return router;
};
