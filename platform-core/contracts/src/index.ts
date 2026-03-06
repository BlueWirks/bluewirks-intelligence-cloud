import { z } from "zod";

export const AssetStatusSchema = z.enum([
  "UPLOADED",
  "QUEUED",
  "PROCESSING",
  "INDEXED",
  "FAILED",
]);
export type AssetStatus = z.infer<typeof AssetStatusSchema>;

export const IngestMessageSchema = z.object({
  traceId: z.string().uuid(),
  orgId: z.string().min(1),
  assetId: z.string().min(1),
  assetType: z.string().min(1),
  gcsUri: z.string().regex(/^gs:\/\/.+/, "gcsUri must start with gs://"),
  createdAt: z.string().datetime(),
});
export type IngestMessage = z.infer<typeof IngestMessageSchema>;

export const AssetDocSchema = z.object({
  status: AssetStatusSchema,
  gcsUri: z.string().regex(/^gs:\/\/.+/, "gcsUri must start with gs://"),
  assetType: z.string().min(1),
  createdAt: z.string().datetime(),
  traceId: z.string().uuid(),
});
export type AssetDoc = z.infer<typeof AssetDocSchema>;

export const RunStatusSchema = z.enum(["PROCESSING", "INDEXED", "FAILED"]);
export type RunStatus = z.infer<typeof RunStatusSchema>;

export const RunDocSchema = z.object({
  assetId: z.string().min(1),
  traceId: z.string().uuid(),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().optional(),
  status: RunStatusSchema,
  error: z.string().optional(),
});
export type RunDoc = z.infer<typeof RunDocSchema>;

export const RetryClassificationSchema = z.enum(["transient", "permanent"]);
export type RetryClassification = z.infer<typeof RetryClassificationSchema>;

export const RequiredEnvSchema = z.object({
  GCP_PROJECT: z.string().min(1),
  GCP_REGION: z.string().min(1),
  ASSETS_BUCKET: z.string().min(1),
  INGEST_TOPIC: z.string().min(1),
});

export const TraceabilityMetadataSchema = z.object({
  orgId: z.string().min(1),
  assetId: z.string().min(1),
  chunkId: z.string().min(1),
  assetType: z.string().min(1).optional(),
  gcsUri: z.string().regex(/^gs:\/\/.+/, "gcsUri must start with gs://").optional(),
  sectionId: z.string().min(1).optional(),
  sectionTitle: z.string().min(1).optional(),
  byteOffset: z.number().int().min(0).optional(),
  byteLength: z.number().int().min(0).optional(),
  sourceLabel: z.string().min(1).optional(),
});
export type TraceabilityMetadata = z.infer<typeof TraceabilityMetadataSchema>;

export const CitationSchema = z.object({
  chunkId: z.string().min(1),
  score: z.number().min(0),
  trace: TraceabilityMetadataSchema,
});
export type Citation = z.infer<typeof CitationSchema>;

export const IngestionStatusRequestSchema = z.object({
  orgId: z.string().min(1),
  assetId: z.string().min(1),
});
export type IngestionStatusRequest = z.infer<typeof IngestionStatusRequestSchema>;

export const IngestionStatusLookupRequestSchema = z.object({
  orgId: z.string().min(1),
  assetId: z.string().min(1).optional(),
  traceId: z.string().uuid().optional(),
  requestId: z.string().min(1).optional(),
}).superRefine((value, ctx) => {
  if (!value.assetId && !value.traceId && !value.requestId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one of assetId, traceId, or requestId is required",
      path: ["assetId"],
    });
  }
});
export type IngestionStatusLookupRequest = z.infer<typeof IngestionStatusLookupRequestSchema>;

export const IngestionRunSummarySchema = z.object({
  runId: z.string().min(1),
  status: RunStatusSchema,
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().optional(),
  error: z.string().optional(),
});
export type IngestionRunSummary = z.infer<typeof IngestionRunSummarySchema>;

export const IngestionStatusItemSchema = z.object({
  orgId: z.string().min(1),
  assetId: z.string().min(1),
  traceId: z.string().uuid(),
  status: AssetStatusSchema,
  assetType: z.string().min(1).optional(),
  gcsUri: z.string().regex(/^gs:\/\/.+/, "gcsUri must start with gs://").optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime(),
  embeddingStatus: z.string().min(1).optional(),
  embeddingCount: z.number().int().min(0).optional(),
  latestRun: IngestionRunSummarySchema.optional(),
});
export type IngestionStatusItem = z.infer<typeof IngestionStatusItemSchema>;

export const IngestionStatusLookupResponseSchema = z.object({
  traceId: z.string().uuid(),
  requestId: z.string().min(1).optional(),
  orgId: z.string().min(1),
  lookedUpAt: z.string().datetime(),
  count: z.number().int().min(0),
  items: z.array(IngestionStatusItemSchema),
});
export type IngestionStatusLookupResponse = z.infer<typeof IngestionStatusLookupResponseSchema>;

export const IngestionStatusResponseSchema = z.object({
  orgId: z.string().min(1),
  assetId: z.string().min(1),
  status: AssetStatusSchema,
  traceId: z.string().uuid(),
  updatedAt: z.string().datetime(),
});
export type IngestionStatusResponse = z.infer<typeof IngestionStatusResponseSchema>;

export const RetrievalRequestSchema = z.object({
  orgId: z.string().min(1),
  query: z.string().min(1),
  topK: z.number().int().min(1).max(50).default(8),
  filters: z.record(z.unknown()).optional(),
});
export type RetrievalRequest = z.infer<typeof RetrievalRequestSchema>;

export const RetrievalMatchSchema = z.object({
  chunkId: z.string().min(1),
  score: z.number().min(0),
  content: z.string().optional(),
  trace: TraceabilityMetadataSchema,
});
export type RetrievalMatch = z.infer<typeof RetrievalMatchSchema>;

export const RetrievalResponseSchema = z.object({
  traceId: z.string().uuid(),
  requestId: z.string().min(1).optional(),
  orgId: z.string().min(1),
  query: z.string().min(1),
  topK: z.number().int().min(1),
  retrievedAt: z.string().datetime(),
  resultCount: z.number().int().min(0),
  results: z.array(RetrievalMatchSchema),
});
export type RetrievalResponse = z.infer<typeof RetrievalResponseSchema>;

export const RetrievalDebugRequestSchema = z.object({
  orgId: z.string().min(1),
  query: z.string().min(1),
  topK: z.number().int().min(1).max(50).default(8),
  includeRawMetadata: z.boolean().default(false),
});
export type RetrievalDebugRequest = z.infer<typeof RetrievalDebugRequestSchema>;

export const RetrievalDebugResponseSchema = z.object({
  traceId: z.string().uuid(),
  requestId: z.string().min(1).optional(),
  orgId: z.string().min(1),
  requestedAt: z.string().datetime(),
  retrieval: RetrievalResponseSchema,
  debug: z.object({
    ranking: z.array(z.object({
      index: z.number().int().min(0),
      chunkId: z.string().min(1),
      score: z.number().min(0),
    })),
  }),
});
export type RetrievalDebugResponse = z.infer<typeof RetrievalDebugResponseSchema>;

export const ProcessingMetadataSchema = z.object({
  stage: z.string().min(1),
  status: z.enum(["received", "validated", "retrieved", "assembled", "generated", "failed"]),
  timestamp: z.string().datetime(),
  latencyMs: z.number().int().min(0).optional(),
});
export type ProcessingMetadata = z.infer<typeof ProcessingMetadataSchema>;

export const StrictJsonOutputSchema = z.object({
  answer: z.string().min(1),
  confidence: z.number().min(0).max(1),
  citations: z.array(CitationSchema),
  fields: z.record(z.unknown()).default({}),
}).strict();
export type StrictJsonOutput = z.infer<typeof StrictJsonOutputSchema>;

export const GenerationRequestSchema = z.object({
  traceId: z.string().uuid().optional(),
  orgId: z.string().min(1),
  query: z.string().min(1),
  retrieval: RetrievalResponseSchema,
  promptId: z.string().min(1),
  promptVersion: z.string().min(1),
  modelId: z.string().min(1),
  outputSchemaVersion: z.string().min(1).default("1.0.0"),
});
export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;

export const GroundedGenerationRequestSchema = z.object({
  traceId: z.string().uuid().optional(),
  requestId: z.string().min(1).optional(),
  orgId: z.string().min(1),
  query: z.string().min(1),
  topK: z.number().int().min(1).max(50).default(8),
  promptId: z.string().min(1).default("rag-chat-v1"),
  outputSchemaVersion: z.string().min(1).default("1.0.0"),
});
export type GroundedGenerationRequest = z.infer<typeof GroundedGenerationRequestSchema>;

export const GenerationResponseSchema = z.object({
  traceId: z.string().uuid(),
  requestId: z.string().min(1).optional(),
  orgId: z.string().min(1),
  promptId: z.string().min(1),
  promptVersion: z.string().min(1),
  modelId: z.string().min(1),
  outputSchemaVersion: z.string().min(1),
  output: StrictJsonOutputSchema,
  status: z.enum(["success", "schema_retry", "error"]),
  latencyMs: z.number().int().min(0),
  generatedAt: z.string().datetime(),
  processing: z.array(ProcessingMetadataSchema).default([]),
  retrieval: RetrievalResponseSchema,
});
export type GenerationResponse = z.infer<typeof GenerationResponseSchema>;

export const GroundedGenerationResponseSchema = GenerationResponseSchema;
export type GroundedGenerationResponse = z.infer<typeof GroundedGenerationResponseSchema>;

export const TraceLookupRequestSchema = z.object({
  orgId: z.string().min(1),
  traceId: z.string().uuid().optional(),
  requestId: z.string().min(1).optional(),
  assetId: z.string().min(1).optional(),
}).superRefine((value, ctx) => {
  if (!value.traceId && !value.requestId && !value.assetId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one of traceId, requestId, or assetId is required",
      path: ["traceId"],
    });
  }
});
export type TraceLookupRequest = z.infer<typeof TraceLookupRequestSchema>;

export const TraceLinkAssetSchema = z.object({
  assetId: z.string().min(1),
  traceId: z.string().uuid(),
  status: AssetStatusSchema,
  assetType: z.string().min(1).optional(),
  gcsUri: z.string().regex(/^gs:\/\/.+/, "gcsUri must start with gs://").optional(),
  updatedAt: z.string().datetime(),
});
export type TraceLinkAsset = z.infer<typeof TraceLinkAssetSchema>;

export const TraceLinkRunSchema = z.object({
  runId: z.string().min(1),
  assetId: z.string().min(1),
  traceId: z.string().uuid(),
  status: RunStatusSchema,
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().optional(),
  error: z.string().optional(),
});
export type TraceLinkRun = z.infer<typeof TraceLinkRunSchema>;

export const TraceLookupResponseSchema = z.object({
  traceId: z.string().uuid(),
  requestId: z.string().min(1).optional(),
  orgId: z.string().min(1),
  lookedUpAt: z.string().datetime(),
  assets: z.array(TraceLinkAssetSchema),
  runs: z.array(TraceLinkRunSchema),
  links: z.array(z.object({
    label: z.string().min(1),
    value: z.string().min(1),
  })).default([]),
});
export type TraceLookupResponse = z.infer<typeof TraceLookupResponseSchema>;

export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
  }),
  details: z.array(z.object({
    path: z.string().min(1),
    message: z.string().min(1),
  })).optional(),
  requestId: z.string().min(1).optional(),
  traceId: z.string().uuid().optional(),
  timestamp: z.string().datetime(),
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

export const ErrorCodeSchema = z.enum([
  "VALIDATION_FAILED",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "FORBIDDEN_ORG_SCOPE",
  "FORBIDDEN_ROLE",
  "CONFIG_MISSING",
  "CONFIG_INVALID",
  "DEPENDENCY_UNAVAILABLE",
  "PROVIDER_FAILED",
  "TRANSIENT_RETRY",
  "INTERNAL",
  "NOT_FOUND",
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const IngestionDlqMessageSchema = z.object({
  traceId: z.string().uuid(),
  orgId: z.string().min(1),
  assetId: z.string().min(1),
  assetType: z.string().min(1),
  gcsUri: z.string().regex(/^gs:\/\/.+/, "gcsUri must start with gs://"),
  requestId: z.string().min(1).optional(),
  deliveryAttempt: z.number().int().min(1).optional(),
  retryClassification: RetryClassificationSchema,
  failureCode: ErrorCodeSchema,
  failureMessage: z.string().min(1),
  failedAt: z.string().datetime(),
});
export type IngestionDlqMessage = z.infer<typeof IngestionDlqMessageSchema>;

export const COLLECTIONS = {
  orgs: "orgs",
  assets: "assets",
  runs: "runs",
} as const;
