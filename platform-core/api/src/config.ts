import { z } from "zod";

const RuntimeConfigSchema = z.object({
  GCP_PROJECT: z.string().min(1),
  GCP_REGION: z.string().min(1),
  ORG_ID: z.string().min(1),
  INTERNAL_API_ENABLED: z.coerce.boolean().default(true),
  INTERNAL_OPERATOR_ROLES: z.string().min(1).default("owner,admin,operator"),
  ENABLE_EMBEDDING_STUB: z.coerce.boolean().default(true),
  VECTOR_BACKEND: z.enum(["stub", "vertex"]).default("stub"),
  VECTOR_SEARCH_ENDPOINT: z.string().optional(),
  DEPLOYED_INDEX_ID: z.string().optional(),
  ENABLE_GROUNDED_GENERATION_STUB: z.coerce.boolean().default(true),
  GENERATION_MODEL: z.string().min(1).default("gemini-2.0-flash"),
  API_PROVIDER_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  API_PROVIDER_RETRY_BASE_MS: z.coerce.number().int().min(50).max(5000).default(200),
}).superRefine((value, ctx) => {
  if (value.VECTOR_BACKEND === "vertex") {
    if (!value.VECTOR_SEARCH_ENDPOINT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["VECTOR_SEARCH_ENDPOINT"],
        message: "VECTOR_SEARCH_ENDPOINT is required when VECTOR_BACKEND=vertex",
      });
    }
    if (!value.DEPLOYED_INDEX_ID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DEPLOYED_INDEX_ID"],
        message: "DEPLOYED_INDEX_ID is required when VECTOR_BACKEND=vertex",
      });
    }
  }
});

export type ApiRuntimeConfig = z.infer<typeof RuntimeConfigSchema>;

export function validateApiRuntimeConfig(source: Record<string, unknown> = process.env): ApiRuntimeConfig {
  return RuntimeConfigSchema.parse(source);
}
