import { z } from "zod";

function parseEnvBooleanValue(value: unknown): unknown {
  if (value === undefined || typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "") return undefined;
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }

  return value;
}

const envBoolean = (defaultValue: boolean) =>
  z.preprocess(parseEnvBooleanValue, z.boolean()).default(defaultValue);

const EnvSchema = z.object({
  PORT: z.string().default("8080"),
  INTERNAL_API_ENABLED: envBoolean(true),
  INTERNAL_OPERATOR_ROLES: z.string().default("owner,admin,operator"),
  ENABLE_GROUNDED_GENERATION_STUB: envBoolean(true),
  API_PROVIDER_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  API_PROVIDER_RETRY_BASE_MS: z.coerce.number().int().min(50).max(5000).default(200),
  GENERATION_MODEL: z.string().default("gemini-2.0-flash"),
  ENABLE_EMBEDDING_STUB: envBoolean(true),

  // Single-tenant guardrail
  ORG_ID: z.string().min(1),

  // GCP
  GCP_PROJECT: z.string().min(1),
  GCP_REGION: z.string().min(1),
  VECTOR_BACKEND: z.enum(["stub", "vertex"]).default("stub"),
  VECTOR_SEARCH_ENDPOINT: z.string().optional(),
  DEPLOYED_INDEX_ID: z.string().optional(),
  ASSETS_BUCKET: z.string().optional(),
  INGEST_TOPIC: z.string().optional(),

  // Scale-Next features (default off)
  ENABLE_SCALE_FEATURES: envBoolean(false),

  // Tooling
  ENABLE_VISION_OCR: envBoolean(false),
  GOOGLE_VISION_API_KEY: z.string().optional(),
  TOOL_PERMISSION_OVERRIDES: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);
