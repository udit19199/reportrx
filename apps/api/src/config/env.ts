const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtExpiresMinutes: toNumber(process.env.JWT_EXPIRES_MINUTES, 30),
  auth0Domain: process.env.AUTH0_DOMAIN ?? "",
  auth0Audience: process.env.AUTH0_AUDIENCE ?? "",
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  maxUploadMb: toNumber(process.env.MAX_UPLOAD_MB, 20),
  aiProvider: process.env.AI_PROVIDER ?? "openai",
  embedProvider: process.env.EMBED_PROVIDER ?? "openai",
  aiModel: process.env.AI_MODEL ?? "gpt-4o-mini",
  embedModel: process.env.EMBED_MODEL ?? "text-embedding-3-large",
  llamaParseKey: process.env.LLAMAPARSE_API_KEY ?? "",
  openAiKey: process.env.OPENAI_API_KEY ?? "",
  aiBaseUrl: process.env.AI_BASE_URL ?? "http://localhost:11434",
  embedBaseUrl: process.env.EMBED_BASE_URL ?? "http://localhost:11434",
  milvusDb: process.env.MILVUS_LITE_DB ?? "milvus_medical_reports.db",
  milvusCollection: process.env.MILVUS_COLLECTION ?? "medical_reports",
  milvusAddress: process.env.MILVUS_ADDRESS ?? "localhost:19530",
  embedDim: toNumber(process.env.EMBED_DIM, 3072),
  cookieSecure: process.env.COOKIE_SECURE === "true",
};

export const validateEnv = () => {
  const missing = [] as string[];

  if (!env.databaseUrl) missing.push("DATABASE_URL");
  if (!env.jwtSecret) missing.push("JWT_SECRET");
  if (!env.auth0Domain) missing.push("AUTH0_DOMAIN");
  if (!env.auth0Audience) missing.push("AUTH0_AUDIENCE");
  if (!env.llamaParseKey) missing.push("LLAMAPARSE_API_KEY");
  if (env.aiProvider.toLowerCase() === "openai" && !env.openAiKey) missing.push("OPENAI_API_KEY");
  if (env.embedProvider.toLowerCase() === "openai" && !env.openAiKey) missing.push("OPENAI_API_KEY");

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${Array.from(new Set(missing)).join(", ")}`);
  }
};
