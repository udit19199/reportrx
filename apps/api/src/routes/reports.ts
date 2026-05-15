import { Router } from "express";
import multer from "multer";
import type { PrismaClient } from "../generated/prisma/client.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getAuthedUserId } from "./http.js";
import { env } from "../config/env.js";
import { createReportService } from "../services/reportService.js";

type Worker = {
  enqueue: (job: { reportId: string; userId: string; filePath: string }) => void;
};

type VectorStore = {
  deleteByReportId: (reportId: string) => Promise<void>;
};

const upload = multer({
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
});

export const createReportsRouter = ({
  prisma,
  worker,
  vectorStore,
}: {
  prisma: PrismaClient;
  worker: Worker;
  vectorStore: VectorStore;
}) => {
  const router = Router();
  const reportService = createReportService({ prisma, worker, vectorStore });

  router.get("/", requireAuth, async (req, res) => {
    const reports = await reportService.listReports(getAuthedUserId(req));
    return res.json({ reports });
  });

  router.post("/", requireAuth, upload.single("file"), async (req, res) => {
    const userId = getAuthedUserId(req);
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "File is required" });
    }

    try {
      const report = await reportService.uploadReport(userId, {
        originalname: file.originalname,
        buffer: file.buffer,
      });
      return res.status(201).json({ report });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      return res.status(400).json({ error: message });
    }
  });

  router.get("/:id", requireAuth, async (req, res) => {
    const report = await reportService.getReport(getAuthedUserId(req), req.params.id as string);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    return res.json({ report });
  });

  router.delete("/:id", requireAuth, async (req, res) => {
    const deleted = await reportService.deleteReport(getAuthedUserId(req), req.params.id as string);
    if (!deleted) {
      return res.status(404).json({ error: "Report not found" });
    }
    return res.json({ ok: true });
  });

  return router;
};
