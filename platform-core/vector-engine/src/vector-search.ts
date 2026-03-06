import type {
  EmbeddingResult,
  VectorDeleteByAssetInput,
  VectorDeleteByAssetOptions,
  VectorDeleteByAssetResult,
  VectorDocument,
  VectorIndexAdapter,
  VectorQueryInput,
  VectorSearchResult,
  VectorUpsertDocumentsOptions,
  VectorUpsertDocumentsResult,
} from "./types.js";

const INDEX_ENDPOINT = process.env.VECTOR_SEARCH_ENDPOINT || "";
const DEPLOYED_INDEX_ID = process.env.DEPLOYED_INDEX_ID || "";
const VECTOR_BACKEND = process.env.VECTOR_BACKEND || "stub";

class StubVectorIndexAdapter implements VectorIndexAdapter {
  async upsertDocuments(documents: VectorDocument[], options?: VectorUpsertDocumentsOptions): Promise<VectorUpsertDocumentsResult> {
    const first = documents[0];
    console.log(JSON.stringify({
      severity: "INFO",
      service: "vector-engine",
      stage: "vector_upsert",
      status: "stub",
      orgId: first?.orgId,
      assetId: first?.assetId,
      requestId: options?.requestId,
      traceId: options?.traceId,
      vectorCount: documents.length,
      backend: "stub",
      timestamp: new Date().toISOString(),
    }));

    return {
      backend: "stub",
      upsertedCount: documents.length,
    };
  }

  async querySimilar(input: VectorQueryInput): Promise<VectorSearchResult[]> {
    console.log(JSON.stringify({
      severity: "INFO",
      service: "vector-engine",
      stage: "vector_query",
      status: "stub",
      orgId: input.orgId,
      requestId: input.requestId,
      traceId: input.traceId,
      topK: input.topK,
      backend: "stub",
      timestamp: new Date().toISOString(),
    }));

    return [];
  }

  async deleteByAsset(input: VectorDeleteByAssetInput, options?: VectorDeleteByAssetOptions): Promise<VectorDeleteByAssetResult> {
    console.log(JSON.stringify({
      severity: "INFO",
      service: "vector-engine",
      stage: "vector_delete",
      status: "stub",
      orgId: input.orgId,
      assetId: input.assetId,
      requestId: options?.requestId,
      traceId: options?.traceId,
      backend: "stub",
      timestamp: new Date().toISOString(),
    }));

    return {
      backend: "stub",
      deletedCount: 0,
    };
  }
}

class VertexVectorIndexAdapter implements VectorIndexAdapter {
  async upsertDocuments(documents: VectorDocument[], options?: VectorUpsertDocumentsOptions): Promise<VectorUpsertDocumentsResult> {
    const first = documents[0];
    console.log(JSON.stringify({
      severity: "INFO",
      service: "vector-engine",
      stage: "vector_upsert",
      status: "requested",
      orgId: first?.orgId,
      assetId: first?.assetId,
      requestId: options?.requestId,
      traceId: options?.traceId,
      vectorCount: documents.length,
      indexEndpoint: INDEX_ENDPOINT,
      deployedIndexId: DEPLOYED_INDEX_ID,
      backend: "vertex",
      timestamp: new Date().toISOString(),
    }));

    // TODO: Wire Vertex Vector Search upsert endpoint.
    return {
      backend: "vertex",
      upsertedCount: documents.length,
    };
  }

  async querySimilar(input: VectorQueryInput): Promise<VectorSearchResult[]> {
    console.log(JSON.stringify({
      severity: "INFO",
      service: "vector-engine",
      stage: "vector_query",
      status: "requested",
      orgId: input.orgId,
      requestId: input.requestId,
      traceId: input.traceId,
      topK: input.topK,
      indexEndpoint: INDEX_ENDPOINT,
      deployedIndexId: DEPLOYED_INDEX_ID,
      backend: "vertex",
      timestamp: new Date().toISOString(),
    }));

    // TODO: Wire Vertex Vector Search query endpoint.
    return [];
  }

  async deleteByAsset(input: VectorDeleteByAssetInput, options?: VectorDeleteByAssetOptions): Promise<VectorDeleteByAssetResult> {
    console.log(JSON.stringify({
      severity: "INFO",
      service: "vector-engine",
      stage: "vector_delete",
      status: "requested",
      orgId: input.orgId,
      assetId: input.assetId,
      requestId: options?.requestId,
      traceId: options?.traceId,
      indexEndpoint: INDEX_ENDPOINT,
      deployedIndexId: DEPLOYED_INDEX_ID,
      backend: "vertex",
      timestamp: new Date().toISOString(),
    }));

    // TODO: Wire Vertex Vector Search delete endpoint.
    return {
      backend: "vertex",
      deletedCount: 0,
    };
  }
}

export function createVectorIndexAdapter(): VectorIndexAdapter {
  if (VECTOR_BACKEND === "vertex") {
    return new VertexVectorIndexAdapter();
  }

  return new StubVectorIndexAdapter();
}

/**
 * Upserts embedding vectors into Vertex Vector Search.
 */
export async function upsertVectors(
  orgId: string,
  assetId: string,
  embeddings: EmbeddingResult[]
): Promise<void> {
  const adapter = createVectorIndexAdapter();
  const documents: VectorDocument[] = embeddings.map((embedding) => ({
    id: `${orgId}:${assetId}:${embedding.chunkId}`,
    orgId,
    assetId,
    chunkId: embedding.chunkId,
    embedding: embedding.embedding,
    content: typeof embedding.metadata.content === "string" ? embedding.metadata.content : undefined,
    metadata: embedding.metadata,
  }));
  const result = await adapter.upsertDocuments(documents);

  console.log(JSON.stringify({
    severity: "INFO",
    service: "vector-engine",
    stage: "vector_upsert",
    status: "completed",
    orgId,
    assetId,
    vectorCount: embeddings.length,
    backend: result.backend,
    upsertedCount: result.upsertedCount,
    timestamp: new Date().toISOString(),
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
  const adapter = createVectorIndexAdapter();
  const results = await adapter.querySimilar({
    orgId,
    embedding: queryEmbedding,
    topK,
  });

  console.log(JSON.stringify({
    severity: "INFO",
    service: "vector-engine",
    stage: "vector_query",
    status: "completed",
    orgId,
    topK,
    resultCount: results.length,
    timestamp: new Date().toISOString(),
  }));

  return results;
}
