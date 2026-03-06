import type { Chunk } from "@bluewirks/ingestion";

export interface WorkerEmbedChunkInput {
  chunkId: string;
  content: string;
  metadata: Record<string, unknown>;
}

export interface WorkerVectorDocument {
  id: string;
  orgId: string;
  assetId: string;
  chunkId: string;
  embedding: number[];
  content?: string;
  metadata: Record<string, unknown>;
}

export function buildEmbeddingInputs(input: {
  orgId: string;
  assetId: string;
  assetType: string;
  gcsUri: string;
  chunks: Chunk[];
}): WorkerEmbedChunkInput[] {
  return input.chunks.map((chunk) => ({
    chunkId: chunk.chunkId,
    content: chunk.content,
    metadata: {
      ...chunk.metadata,
      orgId: input.orgId,
      assetId: input.assetId,
      chunkId: chunk.chunkId,
      assetType: input.assetType,
      gcsUri: input.gcsUri,
      byteOffset: chunk.byteOffset,
      byteLength: chunk.byteLength,
      sourceLabel: `${input.assetType}:${input.assetId}`,
    },
  }));
}

export function buildVectorDocuments(input: {
  orgId: string;
  assetId: string;
  embeddings: Array<{ chunkId: string; embedding: number[]; metadata: Record<string, unknown> }>;
}): WorkerVectorDocument[] {
  return input.embeddings.map((item) => ({
    id: `${input.orgId}:${input.assetId}:${item.chunkId}`,
    orgId: input.orgId,
    assetId: input.assetId,
    chunkId: item.chunkId,
    embedding: item.embedding,
    content: typeof item.metadata.content === "string" ? item.metadata.content : undefined,
    metadata: item.metadata,
  }));
}
