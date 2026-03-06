import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.string().default("8080"),
  INTERNAL_API_ENABLED: z.coerce.boolean().default(true),
  INTERNAL_OPERATOR_ROLES: z.string().default("owner,admin,operator"),
  ENABLE_GROUNDED_GENERATION_STUB: z.coerce.boolean().default(true),
  API_PROVIDER_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  API_PROVIDER_RETRY_BASE_MS: z.coerce.number().int().min(50).max(5000).default(200),
  GENERATION_MODEL: z.string().default("gemini-2.0-flash"),
  ENABLE_EMBEDDING_STUB: z.coerce.boolean().default(true),

  // Single-tenant guardrail
  ORG_ID: z.string().min(1),

  // GCP
  GCP_PROJECT: z.string().min(1),
  GCP_REGION: z.string().min(1),
  VECTOR_BACKEND: z.enum(["stub", "vertex"]).default("stub"),
  VECTOR_SEARCH_ENDPOINT: z.string().optional(),
  DEPLOYED_INDEX_ID: z.string().optional(),
  ASSETS_BUCKET: z.string().optional(),
  INGEST_TOPIC: z.string().optional()
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);
