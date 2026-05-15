import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { createAuthRouter } from "./routes/auth.js";
import { createReportsRouter } from "./routes/reports.js";
import { createAnalyzeRouter } from "./routes/analyze.js";
import { createIngestionWorker } from "./workers/ingestionWorker.js";
import { createPrismaClient } from "./services/prisma.js";
import { createVectorStore } from "./services/vectorStore.js";
import { createAiClients } from "./services/aiClients.js";
import { validateEnv } from "./config/env.js";

export const createApp = () => {
  validateEnv();

  const app = express();
  app.use(
    cors({
      origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));

  const prisma = createPrismaClient();
  const vectorStore = createVectorStore();
  const aiClients = createAiClients();
  const worker = createIngestionWorker({ prisma, vectorStore, aiClients });

  app.use("/api/auth", createAuthRouter({ prisma }));
  app.use("/api/reports", createReportsRouter({ prisma, worker, vectorStore }));
  app.use("/api/analyze", createAnalyzeRouter({ prisma, vectorStore, aiClients }));

  app.get("/", (_req, res) => {
    res.json({ status: "ok", message: "Medical Report Analyzer API" });
  });

  return app;
};
