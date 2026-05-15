import { Router } from "express";
import { z } from "zod";
import type { PrismaClient } from "../generated/prisma/client.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import type { AiClients } from "../services/aiClients.js";
import { createAnalyzeService } from "../services/analyzeService.js";
import { getAuthedUserId } from "./http.js";

const analyzeSchema = z.object({
  reportId: z.string().min(1),
  query: z.string().min(1),
  topK: z.number().min(1).max(20).default(5),
});

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
  const analyzeService = createAnalyzeService({ prisma, vectorStore, aiClients });

  router.post("/", requireAuth, async (req, res) => {
    const parsed = analyzeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input" });
    }

    try {
      const data = await analyzeService.answerQuestion({ userId: getAuthedUserId(req), ...parsed.data });
      if (!data.answer) {
        return res.status(404).json({ error: "Report not found" });
      }
      return res.json(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed";
      if (message === "Report not ready") {
        return res.status(409).json({ error: message });
      }
      return res.status(500).json({ error: message });
    }
  });

  return router;
};
