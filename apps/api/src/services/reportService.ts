import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import type { PrismaClient } from "../generated/prisma/client.js";
import { env } from "../config/env.js";

const reportSelect = {
  id: true,
  filename: true,
  status: true,
  uploadedAt: true,
  summary: true,
  insights: true,
  nextActions: true,
  errorMessage: true,
} as const;

export type ReportRecord = {
  id: string;
  filename: string;
  status: "pending" | "processing" | "ready" | "failed";
  uploadedAt: Date;
  summary: string | null;
  insights: string | null;
  nextActions: string | null;
  errorMessage: string | null;
};

type Worker = {
  enqueue: (job: { reportId: string; userId: string; filePath: string }) => void;
};

type VectorStore = {
  deleteByReportId: (reportId: string) => Promise<void>;
};

type UploadInput = {
  originalname: string;
  buffer: Buffer;
};

export type ReportService = {
  listReports: (userId: string) => Promise<ReportRecord[]>;
  getReport: (userId: string, reportId: string) => Promise<ReportRecord | null>;
  uploadReport: (userId: string, file: UploadInput) => Promise<ReportRecord>;
  deleteReport: (userId: string, reportId: string) => Promise<boolean>;
};

const isPdfFile = (filename: string) => filename.toLowerCase().endsWith(".pdf");

const buildReportFilePath = (userId: string, reportId: string, filename: string) => {
  const userDir = path.join(env.uploadDir, userId);
  const safeName = path.basename(filename);
  const storedName = `${reportId}-${safeName}`;
  return { userDir, safeName, filePath: path.join(userDir, storedName) };
};

const removeIfExists = async (filePath: string) => {
  await fs.rm(filePath, { force: true }).catch(() => null);
};

const deleteVectorsIfPresent = async (vectorStore: VectorStore, reportId: string) => {
  await vectorStore.deleteByReportId(reportId).catch(() => null);
};

export const createReportService = ({
  prisma,
  worker,
  vectorStore,
}: {
  prisma: PrismaClient;
  worker: Worker;
  vectorStore: VectorStore;
}): ReportService => {
  const listReports = async (userId: string) => {
    return prisma.report.findMany({
      where: { userId },
      orderBy: { uploadedAt: "desc" },
      select: reportSelect,
    });
  };

  const getReport = async (userId: string, reportId: string) => {
    return prisma.report.findFirst({
      where: { id: reportId, userId },
      select: reportSelect,
    });
  };

  const uploadReport = async (userId: string, file: UploadInput) => {
    const reportId = crypto.randomUUID();
    const { userDir, safeName, filePath } = buildReportFilePath(userId, reportId, file.originalname);

    if (!isPdfFile(safeName)) {
      throw new Error("Only PDF files are supported");
    }

    await fs.mkdir(userDir, { recursive: true });
    await fs.writeFile(filePath, file.buffer);

    const report = await prisma.report.create({
      data: {
        id: reportId,
        userId,
        filename: safeName,
        storagePath: filePath,
        status: "pending",
      },
      select: reportSelect,
    });

    worker.enqueue({ reportId, userId, filePath });
    return report;
  };

  const deleteReport = async (userId: string, reportId: string) => {
    const report = await prisma.report.findFirst({ where: { id: reportId, userId } });
    if (!report) return false;

    await removeIfExists(report.storagePath);
    await deleteVectorsIfPresent(vectorStore, report.id);
    await prisma.report.delete({ where: { id: report.id } });
    return true;
  };

  return {
    listReports,
    getReport,
    uploadReport,
    deleteReport,
  };
};
