const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtExpiresMinutes: toNumber(process.env.JWT_EXPIRES_MINUTES, 30),
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  maxUploadMb: toNumber(process.env.MAX_UPLOAD_MB, 20),
  aiProvider: process.env.AI_PROVIDER ?? "openai",
  embedProvider: process.env.EMBED_PROVIDER ?? "openai",
  aiModel: process.env.AI_MODEL ?? "gpt-4o-mini",
  embedModel: process.env.EMBED_MODEL ?? "text-embedding-3-large",
  llamaParseKey: process.env.LLAMAPARSE_API_KEY ?? "",
  openAiKey: process.env.OPENAI_API_KEY ?? "",
  milvusDb: process.env.MILVUS_LITE_DB ?? "milvus_medical_reports.db",
  milvusCollection: process.env.MILVUS_COLLECTION ?? "medical_reports",
  milvusAddress: process.env.MILVUS_ADDRESS ?? "localhost:19530",
  embedDim: toNumber(process.env.EMBED_DIM, 3072),
  cookieSecure: process.env.COOKIE_SECURE === "true",
};

export const validateEnv = () => {
  const missing = [] as string[];
  if (!env.jwtSecret) missing.push("JWT_SECRET");
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
};
