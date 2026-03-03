export interface EmbeddingResult {
  chunkId: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

export interface VectorSearchResult {
  chunkId: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface VectorUpsertRequest {
  id: string;
  embedding: number[];
  restricts?: Array<{ namespace: string; allowList: string[] }>;
}
