import type { EmbeddingResult } from "./types.js";

const PROJECT = process.env.GCP_PROJECT || "";
const LOCATION = process.env.GCP_LOCATION || "us-central1";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "gemini-embedding-001";

/**
 * Generates embeddings via Vertex AI for an array of text chunks.
 *
 * Uses the gemini-embedding-001 model (768 dimensions).
 */
export async function generateEmbeddings(
  chunks: Array<{ chunkId: string; content: string; metadata: Record<string, unknown> }>
): Promise<EmbeddingResult[]> {
  // TODO Phase 1: Call Vertex AI Embedding API
  // const { PredictionServiceClient } = await import("@google-cloud/aiplatform");
  // const client = new PredictionServiceClient({ apiEndpoint: `${LOCATION}-aiplatform.googleapis.com` });

  console.log(JSON.stringify({
    severity: "INFO",
    message: "generateEmbeddings placeholder",
    model: EMBEDDING_MODEL,
    chunkCount: chunks.length,
    project: PROJECT,
    location: LOCATION,
  }));

  // Return placeholder embeddings
  return chunks.map((chunk) => ({
    chunkId: chunk.chunkId,
    embedding: new Array(768).fill(0), // placeholder 768-dim vector
    metadata: chunk.metadata,
  }));
}
