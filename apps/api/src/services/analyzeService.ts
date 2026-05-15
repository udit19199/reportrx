import type { PrismaClient } from "../generated/prisma/client.js";
import type { AiClients } from "./aiClients.js";

const QA_PROMPT = `You are a medical report analysis assistant.
Use only the given context from the uploaded report.
If the answer is not in the report, say that clearly.
Answer in plain language and include brief explanations of medical terms.`;

type VectorStore = {
  search: (queryVector: number[], reportId: string, topK: number) => Promise<{ contexts: string[]; sources: string[] }>;
};

export type AnalyzeQuestionInput = {
  userId: string;
  reportId: string;
  query: string;
  topK?: number;
};

export type AnalyzeService = {
  answerQuestion: (input: AnalyzeQuestionInput) => Promise<{ answer: string; sources: string[] }>;
};

export const createAnalyzeService = ({
  prisma,
  vectorStore,
  aiClients,
}: {
  prisma: PrismaClient;
  vectorStore: VectorStore;
  aiClients: AiClients;
}): AnalyzeService => {
  const answerQuestion = async ({ userId, reportId, query, topK = 5 }: AnalyzeQuestionInput) => {
    const report = await prisma.report.findFirst({ where: { id: reportId, userId } });
    if (!report) {
      return { answer: "", sources: [] };
    }
    if (report.status !== "ready") {
      throw new Error("Report not ready");
    }

    const [queryVector] = await aiClients.embed.embed({ inputs: [query] });
    const found = await vectorStore.search(queryVector, reportId, topK);

    if (found.contexts.length === 0) {
      return {
        answer: "I could not find relevant sections in this report for that question.",
        sources: [],
      };
    }

    const contextBlock = found.contexts.map((chunk) => `- ${chunk}`).join("\n\n");
    const answer = await aiClients.llm.generate({
      system: "You answer only from the provided report context.",
      prompt: `${QA_PROMPT}\n\nContext:\n${contextBlock}\n\nQuestion: ${query}`,
    });

    return { answer, sources: found.sources };
  };

  return { answerQuestion };
};
