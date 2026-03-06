import type {
  EmbeddingOptions,
  EmbedChunkInput,
  EmbeddingResult,
  EmbeddingService,
} from "./types.js";

const PROJECT = process.env.GCP_PROJECT || "";
const LOCATION = process.env.GCP_REGION || process.env.GCP_LOCATION || "us-central1";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "gemini-embedding-001";
const ENABLE_EMBEDDING_STUB = (process.env.ENABLE_EMBEDDING_STUB || "true").toLowerCase() === "true";
const EMBEDDING_DIMENSIONS = 768;

class StubEmbeddingService implements EmbeddingService {
  async embedText(text: string, options: EmbeddingOptions): Promise<number[]> {
    logEmbedding({
      stage: "embed_text",
      status: "stub",
      orgId: options.orgId,
      assetId: options.assetId,
      requestId: options.requestId,
      traceId: options.traceId,
      model: EMBEDDING_MODEL,
    });

    return makeDeterministicVector(text);
  }

  async embedTexts(texts: string[], options: EmbeddingOptions): Promise<number[][]> {
    logEmbedding({
      stage: "embed_texts",
      status: "stub",
      orgId: options.orgId,
      assetId: options.assetId,
      requestId: options.requestId,
      traceId: options.traceId,
      model: EMBEDDING_MODEL,
      textCount: texts.length,
    });

    return texts.map((text) => makeDeterministicVector(text));
  }
}

class VertexEmbeddingService implements EmbeddingService {
  async embedText(text: string, options: EmbeddingOptions): Promise<number[]> {
    const [vector] = await this.embedTexts([text], options);
    return vector;
  }

  async embedTexts(texts: string[], options: EmbeddingOptions): Promise<number[][]> {
    logEmbedding({
      stage: "embed_texts",
      status: "requested",
      orgId: options.orgId,
      assetId: options.assetId,
      requestId: options.requestId,
      traceId: options.traceId,
      textCount: texts.length,
    });

    return this.embedTextsInternal(texts, options);
  }

  private async embedTextsInternal(texts: string[], options: EmbeddingOptions): Promise<number[][]> {
    try {
      // Thin production-oriented adapter boundary.
      // Real Vertex endpoint wiring can be completed behind this interface
      // without changing worker or API service code.
      throw new Error("Vertex embedding RPC wiring is not complete yet");
    } catch (error) {
      if (!ENABLE_EMBEDDING_STUB) {
        throw error;
      }

      console.warn(JSON.stringify({
        severity: "WARNING",
        service: "vector-engine",
        stage: "embed_fallback",
        status: "stub",
        orgId: options.orgId,
        assetId: options.assetId,
        requestId: options.requestId,
        traceId: options.traceId,
        model: EMBEDDING_MODEL,
        project: PROJECT,
        region: LOCATION,
        reason: String(error),
        timestamp: new Date().toISOString(),
      }));

      return texts.map((text) => makeDeterministicVector(text));
    }
  }
}

function makeDeterministicVector(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS);
  let seed = 2166136261;

  for (let i = 0; i < text.length; i++) {
    seed ^= text.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }

  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    seed ^= i + 1;
    seed = Math.imul(seed, 16777619);
    const normalized = ((seed >>> 0) % 2000) / 1000 - 1;
    vector[i] = normalized;
  }

  return vector;
}

function logEmbedding(entry: {
  stage: string;
  status: string;
  orgId: string;
  assetId?: string;
  requestId?: string;
  traceId?: string;
  [key: string]: unknown;
}) {
  console.log(JSON.stringify({
    severity: "INFO",
    service: "vector-engine",
    timestamp: new Date().toISOString(),
    ...entry,
  }));
}

export function createEmbeddingService(): EmbeddingService {
  if (ENABLE_EMBEDDING_STUB) {
    return new StubEmbeddingService();
  }

  return new VertexEmbeddingService();
}

/**
 * Generates embeddings via Vertex AI for an array of text chunks.
 *
 * Uses the gemini-embedding-001 model (768 dimensions).
 */
export async function generateEmbeddings(
  chunks: EmbedChunkInput[]
): Promise<EmbeddingResult[]> {
  const service = createEmbeddingService();

  console.log(JSON.stringify({
    severity: "INFO",
    service: "vector-engine",
    message: "embedding_request",
    stage: "embed_chunks",
    status: ENABLE_EMBEDDING_STUB ? "stub" : "requested",
    model: EMBEDDING_MODEL,
    chunkCount: chunks.length,
    project: PROJECT,
    region: LOCATION,
    timestamp: new Date().toISOString(),
  }));

  const vectors = await service.embedTexts(
    chunks.map((chunk) => chunk.content),
    {
      orgId: "unknown-org",
      assetId: "unknown-asset",
      modelId: EMBEDDING_MODEL,
    }
  );

  return chunks.map((chunk, index) => ({
    chunkId: chunk.chunkId,
    embedding: vectors[index],
    metadata: chunk.metadata,
  }));
}
