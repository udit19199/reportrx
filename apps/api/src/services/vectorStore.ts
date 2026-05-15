import { DataType, MilvusClient } from "@zilliz/milvus2-sdk-node";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

export type VectorPayload = {
  report_id: string;
  text: string;
  page?: number;
  section?: string;
};

type SearchResult = {
  contexts: string[];
  sources: string[];
};

type VectorItem = {
  id: string;
  vector: number[];
  payload: VectorPayload;
};

type LocalVectorRecord = VectorItem & {
  createdAt: string;
  updatedAt: string;
};

type LocalVectorStore = {
  collectionName: string;
  embedDim: number;
  records: LocalVectorRecord[];
};

const collectionName = env.milvusCollection;
const isLocalMode = env.milvusAddress.includes("localhost") || env.milvusAddress.includes("127.0.0.1");
const localStorePath = path.resolve(process.cwd(), env.milvusDb);

const getCollectionNames = (collections: unknown): string[] => {
  const payload = collections as {
    collection_names?: string[];
    data?: Array<{ collection_name?: string }>;
  };

  if (Array.isArray(payload.collection_names)) {
    return payload.collection_names;
  }

  if (Array.isArray(payload.data)) {
    return payload.data.map((entry) => entry.collection_name ?? "").filter(Boolean);
  }

  return [];
};

const formatSource = (page?: number, section?: string) => {
  const parts = [] as string[];
  if (page !== undefined && page !== null) {
    parts.push(`p.${page}`);
  }
  if (section) {
    parts.push(section);
  }
  return parts.join(" ") || "report";
};

const escapeFilterValue = (value: string) => value.replace(/"/g, '\\"');

const cosineSimilarity = (left: number[], right: number[]) => {
  const length = Math.min(left.length, right.length);
  if (length === 0) {
    return 0;
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let i = 0; i < length; i += 1) {
    const l = left[i] ?? 0;
    const r = right[i] ?? 0;
    dot += l * r;
    leftNorm += l * l;
    rightNorm += r * r;
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
};

const readLocalStore = async (): Promise<LocalVectorStore> => {
  try {
    const raw = await readFile(localStorePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalVectorStore>;

    if (!parsed || !Array.isArray(parsed.records)) {
      throw new Error("Invalid local vector store");
    }

    return {
      collectionName: parsed.collectionName ?? collectionName,
      embedDim: parsed.embedDim ?? env.embedDim,
      records: parsed.records.filter((record): record is LocalVectorRecord => {
        return Boolean(record?.id && Array.isArray(record.vector) && record.payload?.report_id && record.payload?.text);
      }),
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse local vector store at ${localStorePath}`);
    }

    return {
      collectionName,
      embedDim: env.embedDim,
      records: [],
    };
  }
};

const writeLocalStore = async (store: LocalVectorStore) => {
  await mkdir(path.dirname(localStorePath), { recursive: true });
  await writeFile(localStorePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
};

let localQueue: Promise<unknown> = Promise.resolve();
const withLocalLock = async <T>(task: () => Promise<T>): Promise<T> => {
  const next = localQueue.then(task, task);
  localQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
};

export const createVectorStore = () => {
  let client: MilvusClient | null = null;

  const getClient = () => {
    if (!client) {
      client = new MilvusClient({ address: env.milvusAddress });
    }
    return client;
  };

  const ensureCollection = async () => {
    if (isLocalMode) {
      await withLocalLock(async () => {
        const store = await readLocalStore();
        if (store.collectionName !== collectionName) {
          await writeLocalStore({ ...store, collectionName });
        }
      });
      return;
    }

    const milvus = getClient();
    const collections = await milvus.showCollections();
    const names = getCollectionNames(collections);

    if (!names.includes(collectionName)) {
      await milvus.createCollection({
        collection_name: collectionName,
        fields: [
          { name: "id", data_type: DataType.VarChar, max_length: 64, is_primary_key: true },
          { name: "vector", data_type: DataType.FloatVector, dim: env.embedDim },
          { name: "report_id", data_type: DataType.VarChar, max_length: 64 },
          { name: "text", data_type: DataType.VarChar, max_length: 65535 },
          { name: "page", data_type: DataType.Int64 },
          { name: "section", data_type: DataType.VarChar, max_length: 256 },
        ],
      });

      await milvus.createIndex({
        collection_name: collectionName,
        field_name: "vector",
        index_name: "vector_idx",
        index_type: "AUTOINDEX",
        metric_type: "COSINE",
      });
    }

    await milvus.loadCollectionSync({ collection_name: collectionName });
  };

  const upsert = async (items: VectorItem[]) => {
    await ensureCollection();

    if (isLocalMode) {
      await withLocalLock(async () => {
        const now = new Date().toISOString();
        const store = await readLocalStore();
        const itemMap = new Map(store.records.map((record) => [record.id, record]));

        for (const item of items) {
          itemMap.set(item.id, {
            ...item,
            createdAt: itemMap.get(item.id)?.createdAt ?? now,
            updatedAt: now,
          });
        }

        await writeLocalStore({
          collectionName,
          embedDim: env.embedDim,
          records: Array.from(itemMap.values()),
        });
      });
      return;
    }

    await getClient().insert({
      collection_name: collectionName,
      fields_data: items.map((item) => ({
        id: item.id,
        vector: item.vector,
        report_id: item.payload.report_id,
        text: item.payload.text,
        page: item.payload.page ?? 0,
        section: item.payload.section ?? "",
      })),
    });
  };

  const search = async (queryVector: number[], reportId: string, topK: number): Promise<SearchResult> => {
    await ensureCollection();

    if (isLocalMode) {
      const store = await withLocalLock(async () => readLocalStore());
      const hits = store.records
        .filter((record) => record.payload.report_id === reportId)
        .map((record) => ({
          record,
          score: cosineSimilarity(queryVector, record.vector),
        }))
        .sort((left, right) => right.score - left.score)
        .slice(0, topK);

      return {
        contexts: hits.map((hit) => hit.record.payload.text),
        sources: hits.map((hit) => formatSource(hit.record.payload.page, hit.record.payload.section)),
      };
    }

    const result = await getClient().search({
      collection_name: collectionName,
      data: [queryVector],
      limit: topK,
      output_fields: ["text", "page", "section"],
      expr: `report_id == \"${escapeFilterValue(reportId)}\"`,
      metric_type: "COSINE",
    });

    const hits = result.results ?? [];
    return {
      contexts: hits.map((hit) => hit.text as string),
      sources: hits.map((hit) => formatSource(hit.page as number | undefined, hit.section as string | undefined)),
    };
  };

  const deleteByReportId = async (reportId: string) => {
    await ensureCollection();

    if (isLocalMode) {
      await withLocalLock(async () => {
        const store = await readLocalStore();
        await writeLocalStore({
          ...store,
          records: store.records.filter((record) => record.payload.report_id !== reportId),
        });
      });
      return;
    }

    await getClient().deleteEntities({
      collection_name: collectionName,
      expr: `report_id == \"${escapeFilterValue(reportId)}\"`,
    });
  };

  return { upsert, search, deleteByReportId };
};
