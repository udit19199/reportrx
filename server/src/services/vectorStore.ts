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

export const createVectorStore = () => {
  let client: MilvusClient | null = null;
  const collectionName = env.milvusCollection;

  const getClient = () => {
    if (!client) {
      const isLocalhost = env.milvusAddress.includes("localhost") || env.milvusAddress.includes("127.0.0.1");
      const address = isLocalhost ? env.milvusDb : env.milvusAddress;
      client = new MilvusClient({ address });
    }
    return client;
  };

  const ensureCollection = async () => {
    const c = getClient();
    const collections = await c.showCollections();
    const collectionList = (collections as any).collection_names || (collections as any).data?.map((c: any) => c.collection_name) || [];
    const exists = collectionList.includes(collectionName);
    if (!exists) {
      await c.createCollection({
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
      await c.createIndex({
        collection_name: collectionName,
        field_name: "vector",
        index_name: "vector_idx",
        index_type: "AUTOINDEX",
        metric_type: "COSINE",
      });
    }
    await c.loadCollectionSync({ collection_name: collectionName });
  };

  const upsert = async (items: Array<{ id: string; vector: number[]; payload: VectorPayload }>) => {
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
      expr: `report_id == \"${reportId}\"`,
      metric_type: "COSINE",
    });

    const hits = result.results ?? [];
    const contexts = hits.map((hit) => hit.text as string);
    const sources = hits.map((hit) => {
      const page = hit.page ? `p.${hit.page}` : "";
      const section = hit.section ? ` ${hit.section}` : "";
      return `${page}${section}`.trim() || "report";
    });
    return { contexts, sources };
  };

  const deleteByReportId = async (reportId: string) => {
    await ensureCollection();
    await getClient().deleteEntities({
      collection_name: collectionName,
      expr: `report_id == \"${reportId}\"`,
    });
  };

  return { upsert, search, deleteByReportId };
};
