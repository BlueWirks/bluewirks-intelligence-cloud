import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.string().default("8080"),

  // Single-tenant guardrail (optional)
  ORG_ID: z.string().optional(),

  // GCP
  GCP_PROJECT: z.string().optional(),
  ASSETS_BUCKET: z.string().optional(),
  INGEST_TOPIC: z.string().optional()
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);
