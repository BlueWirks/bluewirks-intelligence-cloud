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

export const RequiredEnvSchema = z.object({
  GCP_PROJECT: z.string().min(1),
  GCP_REGION: z.string().min(1),
  ASSETS_BUCKET: z.string().min(1),
  INGEST_TOPIC: z.string().min(1),
});

export const COLLECTIONS = {
  orgs: "orgs",
  assets: "assets",
  runs: "runs",
} as const;
