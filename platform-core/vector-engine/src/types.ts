export interface EmbeddingResult {
  chunkId: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

export interface EmbeddingOptions {
  orgId: string;
  assetId?: string;
  requestId?: string;
  traceId?: string;
  modelId?: string;
}

export interface EmbedChunkInput {
  chunkId: string;
  content: string;
  metadata: Record<string, unknown>;
}

export interface EmbeddingService {
  embedText(text: string, options: EmbeddingOptions): Promise<number[]>;
  embedTexts(texts: string[], options: EmbeddingOptions): Promise<number[][]>;
}

export interface VectorDocument {
  id: string;
  orgId: string;
  assetId: string;
  chunkId: string;
  embedding: number[];
  content?: string;
  metadata: Record<string, unknown>;
}

export interface VectorQueryInput {
  orgId: string;
  embedding: number[];
  topK: number;
  requestId?: string;
  traceId?: string;
}

export interface VectorQueryMatch {
  chunkId: string;
  assetId: string;
  orgId: string;
  score: number;
  content?: string;
  metadata: Record<string, unknown>;
}

export interface VectorUpsertDocumentsResult {
  backend: string;
  upsertedCount: number;
}

export interface VectorDeleteByAssetResult {
  backend: string;
  deletedCount: number;
}

export interface VectorUpsertDocumentsOptions {
  requestId?: string;
  traceId?: string;
}

export interface VectorDeleteByAssetOptions {
  requestId?: string;
  traceId?: string;
}

export interface VectorDeleteByAssetInput {
  orgId: string;
  assetId: string;
}

export interface VectorIndexAdapter {
  upsertDocuments(documents: VectorDocument[], options?: VectorUpsertDocumentsOptions): Promise<VectorUpsertDocumentsResult>;
  querySimilar(input: VectorQueryInput): Promise<VectorQueryMatch[]>;
  deleteByAsset(input: VectorDeleteByAssetInput, options?: VectorDeleteByAssetOptions): Promise<VectorDeleteByAssetResult>;
}

// Backward-compatible aliases for Phase 1 wrappers
export type VectorSearchResult = VectorQueryMatch;
