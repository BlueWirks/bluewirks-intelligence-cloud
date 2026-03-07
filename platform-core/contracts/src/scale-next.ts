import { z } from "zod";

// ─── Scale-Next Firestore Collections ───────────────────────────────────────
export const SCALE_COLLECTIONS = {
  dlqMessages: "dlq_messages",
  costRecords: "cost_records",
  retentionPolicies: "retention_policies",
  promptExperiments: "prompt_experiments",
  rbacRoles: "rbac_roles",
  webhooks: "webhooks",
  exportConfigs: "export_configs",
  anomalyThresholds: "anomaly_thresholds",
  aiApps: "ai_apps",
  knowledgeWorkspaces: "knowledge_workspaces",
  knowledgeDocuments: "knowledge_documents",
  promptTemplates: "prompt_templates",
  workflowDefinitions: "workflow_definitions",
  tenantConfigs: "tenant_configs",
  tenantAudit: "tenant_audit",
  loadTests: "load_tests",
} as const;

// ─── Feature 1: Bulk DLQ Replay ────────────────────────────────────────────

export const DlqMessageItemSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  assetId: z.string().min(1),
  assetType: z.string().min(1),
  gcsUri: z.string().regex(/^gs:\/\/.+/),
  failureCode: z.string().min(1),
  failureMessage: z.string().min(1),
  failedAt: z.string().datetime(),
  deliveryAttempt: z.number().int().min(1).optional(),
  traceId: z.string().uuid().optional(),
});
export type DlqMessageItem = z.infer<typeof DlqMessageItemSchema>;

export const DlqListRequestSchema = z.object({
  orgId: z.string().min(1),
  limit: z.number().int().min(1).max(500).default(50),
  cursor: z.string().optional(),
  failureCode: z.string().optional(),
});
export type DlqListRequest = z.infer<typeof DlqListRequestSchema>;

export const DlqListResponseSchema = z.object({
  orgId: z.string().min(1),
  count: z.number().int().min(0),
  items: z.array(DlqMessageItemSchema),
  nextCursor: z.string().optional(),
  queriedAt: z.string().datetime(),
});
export type DlqListResponse = z.infer<typeof DlqListResponseSchema>;

export const DlqReplayRequestSchema = z.object({
  orgId: z.string().min(1),
  messageIds: z.array(z.string().min(1)).min(1).max(100),
});
export type DlqReplayRequest = z.infer<typeof DlqReplayRequestSchema>;

export const DlqReplayResponseSchema = z.object({
  orgId: z.string().min(1),
  replayed: z.number().int().min(0),
  failed: z.number().int().min(0),
  errors: z.array(z.object({
    messageId: z.string().min(1),
    error: z.string().min(1),
  })).default([]),
  replayedAt: z.string().datetime(),
});
export type DlqReplayResponse = z.infer<typeof DlqReplayResponseSchema>;

export const DlqPurgeRequestSchema = z.object({
  orgId: z.string().min(1),
  olderThanDays: z.number().int().min(1).max(365).default(30),
});
export type DlqPurgeRequest = z.infer<typeof DlqPurgeRequestSchema>;

export const DlqPurgeResponseSchema = z.object({
  orgId: z.string().min(1),
  purged: z.number().int().min(0),
  purgedAt: z.string().datetime(),
});
export type DlqPurgeResponse = z.infer<typeof DlqPurgeResponseSchema>;

// ─── Feature 2: Cost Allocation Dashboard ──────────────────────────────────

export const CostSummaryRequestSchema = z.object({
  orgId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(["tenant", "query", "model", "day"]).default("day"),
});
export type CostSummaryRequest = z.infer<typeof CostSummaryRequestSchema>;

export const CostLineItemSchema = z.object({
  groupKey: z.string().min(1),
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  totalTokens: z.number().int().min(0),
  estimatedCostUsd: z.number().min(0),
  requestCount: z.number().int().min(0),
});
export type CostLineItem = z.infer<typeof CostLineItemSchema>;

export const CostSummaryResponseSchema = z.object({
  orgId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.string().min(1),
  items: z.array(CostLineItemSchema),
  totals: CostLineItemSchema,
  generatedAt: z.string().datetime(),
});
export type CostSummaryResponse = z.infer<typeof CostSummaryResponseSchema>;

// ─── Feature 3: Automated Retention ────────────────────────────────────────

export const RetentionPolicySchema = z.object({
  collection: z.string().min(1),
  ttlDays: z.number().int().min(1).max(3650),
  enabled: z.boolean().default(true),
  updatedAt: z.string().datetime(),
  updatedBy: z.string().min(1).optional(),
});
export type RetentionPolicy = z.infer<typeof RetentionPolicySchema>;

export const RetentionListRequestSchema = z.object({
  orgId: z.string().min(1),
});
export type RetentionListRequest = z.infer<typeof RetentionListRequestSchema>;

export const RetentionListResponseSchema = z.object({
  orgId: z.string().min(1),
  policies: z.array(RetentionPolicySchema),
  queriedAt: z.string().datetime(),
});
export type RetentionListResponse = z.infer<typeof RetentionListResponseSchema>;

export const RetentionUpsertRequestSchema = z.object({
  orgId: z.string().min(1),
  collection: z.string().min(1),
  ttlDays: z.number().int().min(1).max(3650),
  enabled: z.boolean().default(true),
});
export type RetentionUpsertRequest = z.infer<typeof RetentionUpsertRequestSchema>;

// ─── Feature 4: A/B Prompt Eval Harness ────────────────────────────────────

export const PromptExperimentStatusSchema = z.enum(["draft", "running", "completed", "failed"]);
export type PromptExperimentStatus = z.infer<typeof PromptExperimentStatusSchema>;

export const PromptVariantSchema = z.object({
  variantId: z.string().min(1),
  promptId: z.string().min(1),
  promptVersion: z.string().min(1),
  label: z.string().min(1),
});
export type PromptVariant = z.infer<typeof PromptVariantSchema>;

export const PromptExperimentSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  name: z.string().min(1),
  status: PromptExperimentStatusSchema,
  variants: z.array(PromptVariantSchema).min(2).max(5),
  testQueries: z.array(z.string().min(1)).min(1).max(50),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});
export type PromptExperiment = z.infer<typeof PromptExperimentSchema>;

export const PromptEvalCreateRequestSchema = z.object({
  orgId: z.string().min(1),
  name: z.string().min(1),
  variants: z.array(PromptVariantSchema).min(2).max(5),
  testQueries: z.array(z.string().min(1)).min(1).max(50),
});
export type PromptEvalCreateRequest = z.infer<typeof PromptEvalCreateRequestSchema>;

export const PromptEvalResultSchema = z.object({
  variantId: z.string().min(1),
  query: z.string().min(1),
  output: z.unknown(),
  latencyMs: z.number().int().min(0),
  tokenCount: z.number().int().min(0),
  score: z.number().min(0).max(1).optional(),
});
export type PromptEvalResult = z.infer<typeof PromptEvalResultSchema>;

export const PromptEvalRunResponseSchema = z.object({
  experimentId: z.string().min(1),
  status: PromptExperimentStatusSchema,
  results: z.array(PromptEvalResultSchema),
  completedAt: z.string().datetime(),
});
export type PromptEvalRunResponse = z.infer<typeof PromptEvalRunResponseSchema>;

// ─── Feature 5: Chunk Overlap Visualizer ───────────────────────────────────

export const ChunkVisualizeRequestSchema = z.object({
  orgId: z.string().min(1),
  assetId: z.string().min(1),
});
export type ChunkVisualizeRequest = z.infer<typeof ChunkVisualizeRequestSchema>;

export const ChunkOverlapItemSchema = z.object({
  chunkId: z.string().min(1),
  content: z.string(),
  byteOffset: z.number().int().min(0),
  byteLength: z.number().int().min(0),
  overlapPrev: z.number().int().min(0),
  overlapNext: z.number().int().min(0),
  embeddingNorm: z.number().optional(),
});
export type ChunkOverlapItem = z.infer<typeof ChunkOverlapItemSchema>;

export const ChunkVisualizeResponseSchema = z.object({
  orgId: z.string().min(1),
  assetId: z.string().min(1),
  chunkCount: z.number().int().min(0),
  chunkSize: z.number().int().min(0),
  overlap: z.number().int().min(0),
  chunks: z.array(ChunkOverlapItemSchema),
  analyzedAt: z.string().datetime(),
});
export type ChunkVisualizeResponse = z.infer<typeof ChunkVisualizeResponseSchema>;

// ─── Feature 6: Custom Trace Metrics ───────────────────────────────────────

export const TraceMetricsRequestSchema = z.object({
  orgId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  metricType: z.enum(["latency", "throughput", "error_rate"]).default("latency"),
  percentile: z.enum(["p50", "p90", "p95", "p99"]).default("p99"),
});
export type TraceMetricsRequest = z.infer<typeof TraceMetricsRequestSchema>;

export const TraceMetricPointSchema = z.object({
  timestamp: z.string().datetime(),
  value: z.number(),
  sampleCount: z.number().int().min(0),
});
export type TraceMetricPoint = z.infer<typeof TraceMetricPointSchema>;

export const TraceMetricsResponseSchema = z.object({
  orgId: z.string().min(1),
  metricType: z.string().min(1),
  percentile: z.string().min(1),
  points: z.array(TraceMetricPointSchema),
  summary: z.object({
    min: z.number(),
    max: z.number(),
    avg: z.number(),
    current: z.number(),
  }),
  queriedAt: z.string().datetime(),
});
export type TraceMetricsResponse = z.infer<typeof TraceMetricsResponseSchema>;

export const CustomMetricDefinitionSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  name: z.string().min(1),
  metricType: z.string().min(1),
  filter: z.record(z.unknown()).default({}),
  aggregation: z.enum(["avg", "sum", "count", "min", "max", "p50", "p90", "p95", "p99"]),
  createdAt: z.string().datetime(),
});
export type CustomMetricDefinition = z.infer<typeof CustomMetricDefinitionSchema>;

export const CustomMetricCreateRequestSchema = z.object({
  orgId: z.string().min(1),
  name: z.string().min(1),
  metricType: z.string().min(1),
  filter: z.record(z.unknown()).default({}),
  aggregation: z.enum(["avg", "sum", "count", "min", "max", "p50", "p90", "p95", "p99"]),
});
export type CustomMetricCreateRequest = z.infer<typeof CustomMetricCreateRequestSchema>;

// ─── Feature 7: RBAC Custom Roles ──────────────────────────────────────────

export const PermissionSchema = z.enum([
  "assets:read", "assets:write", "assets:delete",
  "chat:read", "chat:write",
  "retrieval:read", "retrieval:execute",
  "generation:execute",
  "ingestion:read", "ingestion:write",
  "admin:read", "admin:write",
  "scale:read", "scale:write", "scale:admin",
]);
export type Permission = z.infer<typeof PermissionSchema>;

export const RbacRoleSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  name: z.string().min(1).max(64),
  description: z.string().max(256).optional(),
  permissions: z.array(PermissionSchema).min(1),
  isSystem: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type RbacRole = z.infer<typeof RbacRoleSchema>;

export const RbacRoleCreateRequestSchema = z.object({
  orgId: z.string().min(1),
  name: z.string().min(1).max(64),
  description: z.string().max(256).optional(),
  permissions: z.array(PermissionSchema).min(1),
});
export type RbacRoleCreateRequest = z.infer<typeof RbacRoleCreateRequestSchema>;

export const RbacRoleUpdateRequestSchema = z.object({
  orgId: z.string().min(1),
  roleId: z.string().min(1),
  name: z.string().min(1).max(64).optional(),
  description: z.string().max(256).optional(),
  permissions: z.array(PermissionSchema).min(1).optional(),
});
export type RbacRoleUpdateRequest = z.infer<typeof RbacRoleUpdateRequestSchema>;

export const RbacRoleListResponseSchema = z.object({
  orgId: z.string().min(1),
  roles: z.array(RbacRoleSchema),
  queriedAt: z.string().datetime(),
});
export type RbacRoleListResponse = z.infer<typeof RbacRoleListResponseSchema>;

// ─── Feature 8: Synthetic Load Trigger ─────────────────────────────────────

export const LoadTestStatusSchema = z.enum(["pending", "running", "completed", "stopped", "failed"]);
export type LoadTestStatus = z.infer<typeof LoadTestStatusSchema>;

export const LoadTestTriggerRequestSchema = z.object({
  orgId: z.string().min(1),
  targetService: z.enum(["api", "worker"]),
  concurrency: z.number().int().min(1).max(100).default(10),
  durationSeconds: z.number().int().min(10).max(600).default(60),
  requestsPerSecond: z.number().int().min(1).max(1000).default(10),
});
export type LoadTestTriggerRequest = z.infer<typeof LoadTestTriggerRequestSchema>;

export const LoadTestResultSchema = z.object({
  testId: z.string().min(1),
  orgId: z.string().min(1),
  status: LoadTestStatusSchema,
  targetService: z.string().min(1),
  totalRequests: z.number().int().min(0),
  successCount: z.number().int().min(0),
  errorCount: z.number().int().min(0),
  avgLatencyMs: z.number().min(0),
  p99LatencyMs: z.number().min(0),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});
export type LoadTestResult = z.infer<typeof LoadTestResultSchema>;

// ─── Feature 9: Webhook Configurator ───────────────────────────────────────

export const WebhookEventTypeSchema = z.enum([
  "ingestion.completed", "ingestion.failed",
  "generation.completed", "generation.failed",
  "dlq.message_added", "anomaly.threshold_breached",
  "load_test.completed", "failover.activated",
]);
export type WebhookEventType = z.infer<typeof WebhookEventTypeSchema>;

export const WebhookConfigSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  name: z.string().min(1).max(128),
  url: z.string().url(),
  events: z.array(WebhookEventTypeSchema).min(1),
  enabled: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;

export const WebhookCreateRequestSchema = z.object({
  orgId: z.string().min(1),
  name: z.string().min(1).max(128),
  url: z.string().url(),
  events: z.array(WebhookEventTypeSchema).min(1),
});
export type WebhookCreateRequest = z.infer<typeof WebhookCreateRequestSchema>;

export const WebhookUpdateRequestSchema = z.object({
  orgId: z.string().min(1),
  webhookId: z.string().min(1),
  name: z.string().min(1).max(128).optional(),
  url: z.string().url().optional(),
  events: z.array(WebhookEventTypeSchema).min(1).optional(),
  enabled: z.boolean().optional(),
});
export type WebhookUpdateRequest = z.infer<typeof WebhookUpdateRequestSchema>;

export const WebhookListResponseSchema = z.object({
  orgId: z.string().min(1),
  webhooks: z.array(WebhookConfigSchema),
  queriedAt: z.string().datetime(),
});
export type WebhookListResponse = z.infer<typeof WebhookListResponseSchema>;

export const WebhookTestResponseSchema = z.object({
  webhookId: z.string().min(1),
  statusCode: z.number().int(),
  success: z.boolean(),
  latencyMs: z.number().int().min(0),
  testedAt: z.string().datetime(),
});
export type WebhookTestResponse = z.infer<typeof WebhookTestResponseSchema>;

// ─── Feature 10: BigQuery Export Config ────────────────────────────────────

export const ExportConfigSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  dataset: z.string().min(1),
  table: z.string().min(1),
  sourceCollection: z.string().min(1),
  schedule: z.string().min(1),
  enabled: z.boolean().default(false),
  lastRunAt: z.string().datetime().optional(),
  lastRunStatus: z.enum(["success", "failed", "pending"]).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ExportConfig = z.infer<typeof ExportConfigSchema>;

export const ExportConfigUpsertRequestSchema = z.object({
  orgId: z.string().min(1),
  dataset: z.string().min(1),
  table: z.string().min(1),
  sourceCollection: z.string().min(1),
  schedule: z.string().min(1),
  enabled: z.boolean().default(false),
});
export type ExportConfigUpsertRequest = z.infer<typeof ExportConfigUpsertRequestSchema>;

export const ExportStatusResponseSchema = z.object({
  orgId: z.string().min(1),
  configs: z.array(ExportConfigSchema),
  queriedAt: z.string().datetime(),
});
export type ExportStatusResponse = z.infer<typeof ExportStatusResponseSchema>;

export const ExportTriggerRequestSchema = z.object({
  orgId: z.string().min(1),
  configId: z.string().min(1),
});
export type ExportTriggerRequest = z.infer<typeof ExportTriggerRequestSchema>;

export const ExportTriggerResponseSchema = z.object({
  orgId: z.string().min(1),
  configId: z.string().min(1),
  jobId: z.string().min(1),
  status: z.enum(["triggered", "failed"]),
  triggeredAt: z.string().datetime(),
});
export type ExportTriggerResponse = z.infer<typeof ExportTriggerResponseSchema>;

// ─── Feature 11: Anomaly Detection Config ──────────────────────────────────

export const AnomalyThresholdSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  metric: z.string().min(1),
  operator: z.enum(["gt", "lt", "gte", "lte"]),
  value: z.number(),
  windowMinutes: z.number().int().min(1).max(1440).default(5),
  enabled: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type AnomalyThreshold = z.infer<typeof AnomalyThresholdSchema>;

export const AnomalyThresholdUpsertRequestSchema = z.object({
  orgId: z.string().min(1),
  metric: z.string().min(1),
  operator: z.enum(["gt", "lt", "gte", "lte"]),
  value: z.number(),
  windowMinutes: z.number().int().min(1).max(1440).default(5),
  enabled: z.boolean().default(true),
});
export type AnomalyThresholdUpsertRequest = z.infer<typeof AnomalyThresholdUpsertRequestSchema>;

export const AnomalyThresholdListResponseSchema = z.object({
  orgId: z.string().min(1),
  thresholds: z.array(AnomalyThresholdSchema),
  queriedAt: z.string().datetime(),
});
export type AnomalyThresholdListResponse = z.infer<typeof AnomalyThresholdListResponseSchema>;

export const AnomalyBaselineResponseSchema = z.object({
  orgId: z.string().min(1),
  metrics: z.array(z.object({
    metric: z.string().min(1),
    baselineValue: z.number(),
    stdDev: z.number(),
    sampleCount: z.number().int().min(0),
    windowStart: z.string().datetime(),
    windowEnd: z.string().datetime(),
  })),
  calculatedAt: z.string().datetime(),
});
export type AnomalyBaselineResponse = z.infer<typeof AnomalyBaselineResponseSchema>;

// ─── Feature 12: Cross-Region Failover Trigger ─────────────────────────────

export const FailoverStatusEnumSchema = z.enum(["primary", "failover", "restoring"]);
export type FailoverStatusEnum = z.infer<typeof FailoverStatusEnumSchema>;

export const FailoverStateSchema = z.object({
  orgId: z.string().min(1),
  currentRegion: z.string().min(1),
  primaryRegion: z.string().min(1),
  status: FailoverStatusEnumSchema,
  lastFailoverAt: z.string().datetime().optional(),
  lastRestoredAt: z.string().datetime().optional(),
  queriedAt: z.string().datetime(),
});
export type FailoverState = z.infer<typeof FailoverStateSchema>;

export const FailoverActivateRequestSchema = z.object({
  orgId: z.string().min(1),
  targetRegion: z.string().min(1),
  reason: z.string().min(1).max(256),
});
export type FailoverActivateRequest = z.infer<typeof FailoverActivateRequestSchema>;

export const FailoverActivateResponseSchema = z.object({
  orgId: z.string().min(1),
  previousRegion: z.string().min(1),
  newRegion: z.string().min(1),
  status: FailoverStatusEnumSchema,
  activatedAt: z.string().datetime(),
});
export type FailoverActivateResponse = z.infer<typeof FailoverActivateResponseSchema>;

export const FailoverRegionSchema = z.object({
  region: z.string().min(1),
  available: z.boolean(),
  latencyMs: z.number().int().min(0).optional(),
});
export type FailoverRegion = z.infer<typeof FailoverRegionSchema>;

// ─── Feature 13: AI App Builder ────────────────────────────────────────────

export const AiAppStatusSchema = z.enum(["draft", "testing", "deployed", "archived"]);
export type AiAppStatus = z.infer<typeof AiAppStatusSchema>;

export const AiAppSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  status: AiAppStatusSchema,
  promptId: z.string().min(1).optional(),
  dataSourceIds: z.array(z.string().min(1)).default([]),
  config: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deployedAt: z.string().datetime().optional(),
});
export type AiApp = z.infer<typeof AiAppSchema>;

export const AiAppCreateRequestSchema = z.object({
  orgId: z.string().min(1),
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  promptId: z.string().min(1).optional(),
  dataSourceIds: z.array(z.string().min(1)).default([]),
  config: z.record(z.unknown()).default({}),
});
export type AiAppCreateRequest = z.infer<typeof AiAppCreateRequestSchema>;

export const AiAppUpdateRequestSchema = z.object({
  orgId: z.string().min(1),
  appId: z.string().min(1),
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(512).optional(),
  promptId: z.string().min(1).optional(),
  dataSourceIds: z.array(z.string().min(1)).optional(),
  config: z.record(z.unknown()).optional(),
});
export type AiAppUpdateRequest = z.infer<typeof AiAppUpdateRequestSchema>;

export const AiAppListResponseSchema = z.object({
  orgId: z.string().min(1),
  apps: z.array(AiAppSchema),
  queriedAt: z.string().datetime(),
});
export type AiAppListResponse = z.infer<typeof AiAppListResponseSchema>;

export const AiAppTestRequestSchema = z.object({
  orgId: z.string().min(1),
  appId: z.string().min(1),
  input: z.string().min(1),
});
export type AiAppTestRequest = z.infer<typeof AiAppTestRequestSchema>;

export const AiAppTestResponseSchema = z.object({
  appId: z.string().min(1),
  input: z.string().min(1),
  output: z.unknown(),
  latencyMs: z.number().int().min(0),
  testedAt: z.string().datetime(),
});
export type AiAppTestResponse = z.infer<typeof AiAppTestResponseSchema>;

// ─── Feature 14: Knowledge Workspace ───────────────────────────────────────

export const KnowledgeDocStatusSchema = z.enum(["uploading", "indexing", "indexed", "failed"]);
export type KnowledgeDocStatus = z.infer<typeof KnowledgeDocStatusSchema>;

export const KnowledgeWorkspaceSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  documentCount: z.number().int().min(0).default(0),
  totalChunks: z.number().int().min(0).default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type KnowledgeWorkspace = z.infer<typeof KnowledgeWorkspaceSchema>;

export const KnowledgeDocumentSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  orgId: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  gcsUri: z.string().regex(/^gs:\/\/.+/).optional(),
  status: KnowledgeDocStatusSchema,
  chunkCount: z.number().int().min(0).default(0),
  uploadedAt: z.string().datetime(),
  indexedAt: z.string().datetime().optional(),
});
export type KnowledgeDocument = z.infer<typeof KnowledgeDocumentSchema>;

export const KnowledgeWorkspaceCreateRequestSchema = z.object({
  orgId: z.string().min(1),
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
});
export type KnowledgeWorkspaceCreateRequest = z.infer<typeof KnowledgeWorkspaceCreateRequestSchema>;

export const KnowledgeWorkspaceListResponseSchema = z.object({
  orgId: z.string().min(1),
  workspaces: z.array(KnowledgeWorkspaceSchema),
  queriedAt: z.string().datetime(),
});
export type KnowledgeWorkspaceListResponse = z.infer<typeof KnowledgeWorkspaceListResponseSchema>;

export const KnowledgeUploadRequestSchema = z.object({
  orgId: z.string().min(1),
  workspaceId: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
});
export type KnowledgeUploadRequest = z.infer<typeof KnowledgeUploadRequestSchema>;

export const KnowledgeUploadResponseSchema = z.object({
  documentId: z.string().min(1),
  uploadUrl: z.string().url(),
  gcsUri: z.string().regex(/^gs:\/\/.+/),
  expiresInSeconds: z.number().int(),
});
export type KnowledgeUploadResponse = z.infer<typeof KnowledgeUploadResponseSchema>;

// ─── Feature 15: Prompt Engineering Studio ─────────────────────────────────

export const PromptTemplateStatusSchema = z.enum(["draft", "published", "archived"]);
export type PromptTemplateStatus = z.infer<typeof PromptTemplateStatusSchema>;

export const PromptTemplateSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  systemInstruction: z.string().min(1),
  userTemplate: z.string().min(1),
  modelId: z.string().min(1),
  temperature: z.number().min(0).max(2).default(0.7),
  maxOutputTokens: z.number().int().min(1).max(8192).default(1024),
  outputSchema: z.record(z.unknown()).optional(),
  status: PromptTemplateStatusSchema,
  version: z.number().int().min(1).default(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

export const PromptTemplateCreateRequestSchema = z.object({
  orgId: z.string().min(1),
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  systemInstruction: z.string().min(1),
  userTemplate: z.string().min(1),
  modelId: z.string().min(1).default("gemini-2.0-flash"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxOutputTokens: z.number().int().min(1).max(8192).default(1024),
  outputSchema: z.record(z.unknown()).optional(),
});
export type PromptTemplateCreateRequest = z.infer<typeof PromptTemplateCreateRequestSchema>;

export const PromptTemplateUpdateRequestSchema = z.object({
  orgId: z.string().min(1),
  templateId: z.string().min(1),
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(512).optional(),
  systemInstruction: z.string().min(1).optional(),
  userTemplate: z.string().min(1).optional(),
  modelId: z.string().min(1).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxOutputTokens: z.number().int().min(1).max(8192).optional(),
  outputSchema: z.record(z.unknown()).optional(),
  status: PromptTemplateStatusSchema.optional(),
});
export type PromptTemplateUpdateRequest = z.infer<typeof PromptTemplateUpdateRequestSchema>;

export const PromptTemplateListResponseSchema = z.object({
  orgId: z.string().min(1),
  templates: z.array(PromptTemplateSchema),
  queriedAt: z.string().datetime(),
});
export type PromptTemplateListResponse = z.infer<typeof PromptTemplateListResponseSchema>;

export const PromptTestRequestSchema = z.object({
  orgId: z.string().min(1),
  templateId: z.string().min(1),
  testInput: z.string().min(1),
  context: z.string().optional(),
});
export type PromptTestRequest = z.infer<typeof PromptTestRequestSchema>;

export const PromptTestResponseSchema = z.object({
  templateId: z.string().min(1),
  output: z.unknown(),
  latencyMs: z.number().int().min(0),
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  testedAt: z.string().datetime(),
});
export type PromptTestResponse = z.infer<typeof PromptTestResponseSchema>;

// ─── Feature 16: AI Workflow Automation ────────────────────────────────────

export const WorkflowStatusSchema = z.enum(["draft", "active", "paused", "archived"]);
export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

export const WorkflowTriggerTypeSchema = z.enum(["event", "schedule", "manual", "webhook"]);
export type WorkflowTriggerType = z.infer<typeof WorkflowTriggerTypeSchema>;

export const WorkflowStepSchema = z.object({
  stepId: z.string().min(1),
  type: z.enum(["retrieve", "generate", "transform", "notify", "condition"]),
  config: z.record(z.unknown()),
  next: z.string().optional(),
  onError: z.enum(["stop", "skip", "retry"]).default("stop"),
});
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

export const WorkflowDefinitionSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  triggerType: WorkflowTriggerTypeSchema,
  triggerConfig: z.record(z.unknown()).default({}),
  steps: z.array(WorkflowStepSchema).min(1),
  status: WorkflowStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;

export const WorkflowCreateRequestSchema = z.object({
  orgId: z.string().min(1),
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  triggerType: WorkflowTriggerTypeSchema,
  triggerConfig: z.record(z.unknown()).default({}),
  steps: z.array(WorkflowStepSchema).min(1),
});
export type WorkflowCreateRequest = z.infer<typeof WorkflowCreateRequestSchema>;

export const WorkflowUpdateRequestSchema = z.object({
  orgId: z.string().min(1),
  workflowId: z.string().min(1),
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(512).optional(),
  triggerType: WorkflowTriggerTypeSchema.optional(),
  triggerConfig: z.record(z.unknown()).optional(),
  steps: z.array(WorkflowStepSchema).min(1).optional(),
});
export type WorkflowUpdateRequest = z.infer<typeof WorkflowUpdateRequestSchema>;

export const WorkflowListResponseSchema = z.object({
  orgId: z.string().min(1),
  workflows: z.array(WorkflowDefinitionSchema),
  queriedAt: z.string().datetime(),
});
export type WorkflowListResponse = z.infer<typeof WorkflowListResponseSchema>;

// ─── Feature 17: Multi-Tenant Isolation Controls ───────────────────────────

export const TenantIsolationLevelSchema = z.enum(["shared", "namespace", "dedicated"]);
export type TenantIsolationLevel = z.infer<typeof TenantIsolationLevelSchema>;

export const TenantConfigSchema = z.object({
  tenantId: z.string().min(1),
  orgId: z.string().min(1),
  isolationLevel: TenantIsolationLevelSchema,
  dataPrefix: z.string().min(1),
  allowedRegions: z.array(z.string().min(1)).default([]),
  maxStorageGb: z.number().min(0).optional(),
  maxRequestsPerMinute: z.number().int().min(0).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type TenantConfig = z.infer<typeof TenantConfigSchema>;

export const TenantConfigUpdateRequestSchema = z.object({
  orgId: z.string().min(1),
  tenantId: z.string().min(1),
  isolationLevel: TenantIsolationLevelSchema.optional(),
  allowedRegions: z.array(z.string().min(1)).optional(),
  maxStorageGb: z.number().min(0).optional(),
  maxRequestsPerMinute: z.number().int().min(0).optional(),
});
export type TenantConfigUpdateRequest = z.infer<typeof TenantConfigUpdateRequestSchema>;

export const TenantListResponseSchema = z.object({
  orgId: z.string().min(1),
  tenants: z.array(TenantConfigSchema),
  queriedAt: z.string().datetime(),
});
export type TenantListResponse = z.infer<typeof TenantListResponseSchema>;

export const TenantAuditEntrySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  action: z.string().min(1),
  actor: z.string().min(1),
  details: z.record(z.unknown()).default({}),
  timestamp: z.string().datetime(),
});
export type TenantAuditEntry = z.infer<typeof TenantAuditEntrySchema>;

export const TenantAuditResponseSchema = z.object({
  tenantId: z.string().min(1),
  entries: z.array(TenantAuditEntrySchema),
  queriedAt: z.string().datetime(),
});
export type TenantAuditResponse = z.infer<typeof TenantAuditResponseSchema>;

export const TenantVerifyResponseSchema = z.object({
  tenantId: z.string().min(1),
  isolationLevel: TenantIsolationLevelSchema,
  checks: z.array(z.object({
    check: z.string().min(1),
    passed: z.boolean(),
    details: z.string().optional(),
  })),
  allPassed: z.boolean(),
  verifiedAt: z.string().datetime(),
});
export type TenantVerifyResponse = z.infer<typeof TenantVerifyResponseSchema>;
