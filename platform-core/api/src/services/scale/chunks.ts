import { firestore } from "../firestore.js";
import { COLLECTIONS } from "@bluewirks/contracts";
import type {
  ChunkVisualizeRequest, ChunkVisualizeResponse,
  ChunkOverlapItem,
} from "@bluewirks/contracts";

const now = () => new Date().toISOString();
const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_OVERLAP = 200;

export async function visualizeChunks(
  input: ChunkVisualizeRequest,
  context?: { requestId?: string },
): Promise<ChunkVisualizeResponse> {
  // Read asset doc to get chunk metadata
  const assetRef = firestore
    .collection(COLLECTIONS.orgs).doc(input.orgId)
    .collection(COLLECTIONS.assets).doc(input.assetId);
  const assetDoc = await assetRef.get();

  if (!assetDoc.exists) {
    throw new Error("Asset not found");
  }

  const asset = assetDoc.data()!;
  const embeddingCount = (asset.embeddingCount as number) || 0;

  // Build chunk overlap visualization from stored metadata
  const chunks: ChunkOverlapItem[] = [];
  for (let i = 0; i < embeddingCount; i++) {
    const byteOffset = i * (DEFAULT_CHUNK_SIZE - DEFAULT_OVERLAP);
    chunks.push({
      chunkId: `s0-chunk-${i}`,
      content: `[chunk ${i} content — retrieve from vector store for full text]`,
      byteOffset,
      byteLength: DEFAULT_CHUNK_SIZE,
      overlapPrev: i === 0 ? 0 : DEFAULT_OVERLAP,
      overlapNext: i === embeddingCount - 1 ? 0 : DEFAULT_OVERLAP,
    });
  }

  return {
    orgId: input.orgId,
    assetId: input.assetId,
    chunkCount: embeddingCount,
    chunkSize: DEFAULT_CHUNK_SIZE,
    overlap: DEFAULT_OVERLAP,
    chunks,
    analyzedAt: now(),
  };
}
