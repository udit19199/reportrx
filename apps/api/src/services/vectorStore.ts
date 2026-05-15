import { DataType, MilvusClient } from "@zilliz/milvus2-sdk-node";
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

const collectionName = env.milvusCollection;

const getAddress = () => {
  const isLocalAddress = env.milvusAddress.includes("localhost") || env.milvusAddress.includes("127.0.0.1");
  return isLocalAddress ? env.milvusDb : env.milvusAddress;
};

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

export const createVectorStore = () => {
  let client: MilvusClient | null = null;

  const getClient = () => {
    if (!client) {
      client = new MilvusClient({ address: getAddress() });
    }
    return client;
  };

  const ensureCollection = async () => {
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
    await getClient().deleteEntities({
      collection_name: collectionName,
      expr: `report_id == \"${escapeFilterValue(reportId)}\"`,
    });
  };

  return { upsert, search, deleteByReportId };
};
