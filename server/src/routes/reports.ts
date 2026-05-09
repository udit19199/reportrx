import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import type { PrismaClient } from "../generated/prisma/client.js";
import { requireAuth, type AuthedRequest } from "../middleware/authMiddleware.js";
import { env } from "../config/env.js";

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

  router.get("/", requireAuth, async (req, res) => {
    const userId = (req as AuthedRequest).user.id;
    const reports = await prisma.report.findMany({
      where: { userId },
      orderBy: { uploadedAt: "desc" },
      select: { id: true, filename: true, status: true, uploadedAt: true },
    });
    return res.json({ reports });
  });

  router.post("/", requireAuth, upload.single("file"), async (req, res) => {
    const userId = (req as AuthedRequest).user.id;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "File is required" });
    }

    if (!file.originalname.toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({ error: "Only PDF files are supported" });
    }

    const userDir = path.join(env.uploadDir, userId);
    await fs.mkdir(userDir, { recursive: true });
    const reportId = crypto.randomUUID();
    const storedName = `${reportId}-${file.originalname}`;
    const filePath = path.join(userDir, storedName);
    await fs.writeFile(filePath, file.buffer);

    const report = await prisma.report.create({
      data: {
        id: reportId,
        userId,
        filename: file.originalname,
        storagePath: filePath,
        status: "pending",
      },
    });

    worker.enqueue({ reportId, userId, filePath });

    return res.status(201).json({ report });
  });

  router.get("/:id", requireAuth, async (req, res) => {
    const userId = (req as AuthedRequest).user.id;
    const report = await prisma.report.findFirst({
      where: { id: req.params.id as string, userId },
      select: { id: true, filename: true, status: true, uploadedAt: true, summary: true },
    });
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    return res.json({ report });
  });

  router.delete("/:id", requireAuth, async (req, res) => {
    const userId = (req as AuthedRequest).user.id;
    const report = await prisma.report.findFirst({ where: { id: req.params.id as string, userId } });
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    await fs.rm(report.storagePath, { force: true });
    await vectorStore.deleteByReportId(report.id);
    await prisma.report.delete({ where: { id: report.id } });
    return res.json({ ok: true });
  });

  return router;
};
