import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

let prisma: PrismaClient | null = null;

export const createPrismaClient = () => {
  if (!prisma) {
    const connectionString = process.env.DATABASE_URL as string;
    const adapter = new PrismaNeon({ connectionString });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
};
