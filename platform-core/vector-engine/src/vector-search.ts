import type { EmbeddingResult, VectorSearchResult } from "./types.js";

const INDEX_ENDPOINT = process.env.VECTOR_SEARCH_ENDPOINT || "";
const DEPLOYED_INDEX_ID = process.env.DEPLOYED_INDEX_ID || "";

/**
 * Upserts embedding vectors into Vertex Vector Search.
 */
export async function upsertVectors(
  orgId: string,
  assetId: string,
  embeddings: EmbeddingResult[]
): Promise<void> {
  // TODO Phase 1: Call Vertex Vector Search upsert API
  console.log(JSON.stringify({
    severity: "INFO",
    message: "upsertVectors placeholder",
    orgId,
    assetId,
    vectorCount: embeddings.length,
    indexEndpoint: INDEX_ENDPOINT,
  }));
}

/**
 * Queries Vertex Vector Search for the top-k most similar chunks.
 * Applies org + role filtering via restricts.
 */
export async function queryVectors(
  orgId: string,
  queryEmbedding: number[],
  topK: number = 10
): Promise<VectorSearchResult[]> {
  // TODO Phase 2: Call Vertex Vector Search query API with org restriction
  console.log(JSON.stringify({
    severity: "INFO",
    message: "queryVectors placeholder",
    orgId,
    topK,
    deployedIndexId: DEPLOYED_INDEX_ID,
  }));

  return [];
}
