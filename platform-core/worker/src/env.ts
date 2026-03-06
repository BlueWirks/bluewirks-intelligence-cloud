import { z } from "zod";

const WorkerEnvSchema = z.object({
  PORT: z.string().default("8080"),
  WORKER_SERVICE_NAME: z.string().default("worker"),
  GCP_PROJECT: z.string().min(1),
  GCP_REGION: z.string().min(1),
  ASSETS_BUCKET: z.string().min(1),
  INGEST_TOPIC: z.string().min(1),
  EMBEDDING_MODEL: z.string().default("gemini-embedding-001"),
  VECTOR_BACKEND: z.enum(["stub", "vertex"]).default("stub"),
  WORKER_RETRY_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(5),
  WORKER_RETRY_BASE_DELAY_MS: z.coerce.number().int().min(50).max(10000).default(500),
  INGEST_DLQ_TOPIC: z.string().optional(),
  ENABLE_WORKER_DLQ_PUBLISH: z.coerce.boolean().default(false),
});

export type WorkerEnv = z.infer<typeof WorkerEnvSchema>;

export function validateWorkerEnv(source: Record<string, unknown> = process.env): WorkerEnv {
  return WorkerEnvSchema.parse(source);
}
