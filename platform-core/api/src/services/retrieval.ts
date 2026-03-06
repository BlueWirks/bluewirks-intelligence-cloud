import crypto from "crypto";
import {
  RetrievalRequestSchema,
  RetrievalResponseSchema,
  type RetrievalRequest,
  type RetrievalResponse,
  type TraceabilityMetadata,
} from "@bluewirks/contracts";
import { createEmbeddingService, createVectorIndexAdapter } from "@bluewirks/vector-engine";
import { classifyProviderError, withRetry } from "./retry.js";

const SERVICE = process.env.API_SERVICE_NAME || "api";
const embeddingService = createEmbeddingService() as any;
const vectorAdapter = createVectorIndexAdapter() as any;

function logStage(entry: {
  severity?: "INFO" | "WARNING" | "ERROR";
  stage: string;
  status: string;
  orgId: string;
  requestId?: string;
  traceId: string;
  [key: string]: unknown;
}) {
  const { severity = "INFO", ...rest } = entry;
  console.log(JSON.stringify({
    severity,
    service: SERVICE,
    timestamp: new Date().toISOString(),
    ...rest,
  }));
}

function toTraceabilityMetadata(
  orgId: string,
  chunkId: string,
  metadata: Record<string, unknown>
): TraceabilityMetadata {
  return {
    orgId,
    assetId: typeof metadata.assetId === "string" ? metadata.assetId : "unknown-asset",
    chunkId,
    assetType: typeof metadata.assetType === "string" ? metadata.assetType : undefined,
    gcsUri: typeof metadata.gcsUri === "string" ? metadata.gcsUri : undefined,
    sectionId: typeof metadata.sectionId === "string" ? metadata.sectionId : undefined,
    sectionTitle: typeof metadata.sectionTitle === "string" ? metadata.sectionTitle : undefined,
    sourceLabel: typeof metadata.sourceLabel === "string" ? metadata.sourceLabel : undefined,
    byteOffset: typeof metadata.byteOffset === "number" ? metadata.byteOffset : undefined,
    byteLength: typeof metadata.byteLength === "number" ? metadata.byteLength : undefined,
  };
}

export async function retrieveGroundedContext(
  input: RetrievalRequest,
  context?: { requestId?: string; traceId?: string }
): Promise<RetrievalResponse> {
  const traceId = context?.traceId ?? crypto.randomUUID();
  let body: RetrievalRequest;

  try {
    body = RetrievalRequestSchema.parse(input);
  } catch (error) {
    logStage({
      severity: "ERROR",
      stage: "contract_validation",
      status: "failed",
      orgId: typeof (input as any)?.orgId === "string" ? (input as any).orgId : "unknown-org",
      requestId: context?.requestId,
      traceId,
      error: String(error),
    });
    throw error;
  }

  logStage({
    stage: "retrieval_request_received",
    status: "received",
    orgId: body.orgId,
    requestId: context?.requestId,
    traceId,
    topK: body.topK,
  });

  const maxRetries = Number(process.env.API_PROVIDER_MAX_RETRIES || "2");
  const baseDelayMs = Number(process.env.API_PROVIDER_RETRY_BASE_MS || "200");

  const queryEmbedding = await withRetry(
    async () => embeddingService.embedText(body.query, {
      orgId: body.orgId,
      requestId: context?.requestId,
      traceId,
      modelId: process.env.EMBEDDING_MODEL || "gemini-embedding-001",
    }),
    {
      maxRetries,
      baseDelayMs,
      classify: classifyProviderError,
      onRetry: ({ attempt, delayMs, error }) => {
        logStage({
          severity: "WARNING",
          stage: "query_embedding_retry",
          status: "retrying",
          orgId: body.orgId,
          requestId: context?.requestId,
          traceId,
          attempt,
          delayMs,
          reason: String(error),
        });
      },
    }
  );

  logStage({
    stage: "query_embedding_completed",
    status: "completed",
    orgId: body.orgId,
    requestId: context?.requestId,
    traceId,
    embeddingDimensions: Array.isArray(queryEmbedding) ? queryEmbedding.length : 0,
  });

  const results = await withRetry(
    async () => vectorAdapter.querySimilar({
      orgId: body.orgId,
      embedding: queryEmbedding,
      topK: body.topK,
      requestId: context?.requestId,
      traceId,
    }),
    {
      maxRetries,
      baseDelayMs,
      classify: classifyProviderError,
      onRetry: ({ attempt, delayMs, error }) => {
        logStage({
          severity: "WARNING",
          stage: "vector_query_retry",
          status: "retrying",
          orgId: body.orgId,
          requestId: context?.requestId,
          traceId,
          attempt,
          delayMs,
          reason: String(error),
        });
      },
    }
  );

  logStage({
    stage: "vector_query_completed",
    status: "completed",
    orgId: body.orgId,
    requestId: context?.requestId,
    traceId,
    resultCount: Array.isArray(results) ? results.length : 0,
  });

  const response = RetrievalResponseSchema.parse({
    traceId,
    requestId: context?.requestId,
    orgId: body.orgId,
    query: body.query,
    topK: body.topK,
    retrievedAt: new Date().toISOString(),
    resultCount: results.length,
    results: results.map((result: any) => ({
      chunkId: result.chunkId,
      score: result.score,
      content: result.content,
      trace: toTraceabilityMetadata(body.orgId, result.chunkId, result.metadata ?? {}),
    })),
  });

  logStage({
    stage: "retrieval_completed",
    status: "completed",
    orgId: body.orgId,
    requestId: context?.requestId,
    traceId,
    resultCount: response.resultCount,
  });

  return response;
}
