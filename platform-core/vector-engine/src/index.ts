export { createEmbeddingService, generateEmbeddings } from "./embeddings.js";
export { createVectorIndexAdapter, upsertVectors, queryVectors } from "./vector-search.js";
export type {
	EmbeddingOptions,
	EmbedChunkInput,
	EmbeddingResult,
	EmbeddingService,
	VectorDeleteByAssetInput,
	VectorDeleteByAssetOptions,
	VectorDeleteByAssetResult,
	VectorDocument,
	VectorIndexAdapter,
	VectorQueryInput,
	VectorQueryMatch,
	VectorSearchResult,
	VectorUpsertDocumentsOptions,
	VectorUpsertDocumentsResult,
} from "./types.js";
