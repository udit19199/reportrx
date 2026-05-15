import type { PrismaClient } from "../generated/prisma/client.js";
import type { AiClients } from "../services/aiClients.js";
import type { VectorPayload } from "../services/vectorStore.js";
import { createIngestionProcessor, type IngestionJob } from "../services/reportIngestion.js";

type WorkerDeps = {
  prisma: PrismaClient;
  vectorStore: {
    upsert: (items: Array<{ id: string; vector: number[]; payload: VectorPayload }>) => Promise<void>;
  };
  aiClients: AiClients;
};

export const createIngestionWorker = (deps: WorkerDeps) => {
  const processor = createIngestionProcessor(deps);
  const queue: IngestionJob[] = [];
  let running = false;

  const enqueue = (job: IngestionJob) => {
    queue.push(job);
    void run();
  };

  const run = async () => {
    if (running) return;
    running = true;

    while (queue.length > 0) {
      const job = queue.shift();
      if (!job) break;
      await processor.processJob(job);
    }

    running = false;
  };

  return { enqueue };
};
