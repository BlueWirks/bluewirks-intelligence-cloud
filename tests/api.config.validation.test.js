test("api runtime config validation passes for valid config", async () => {
  const cfg = await import("../platform-core/api/dist/config.js");

  const out = cfg.validateApiRuntimeConfig({
    GCP_PROJECT: "bluewirks-intelligence-cloud",
    GCP_REGION: "us-central1",
    ORG_ID: "org-1",
    INTERNAL_API_ENABLED: "true",
    INTERNAL_OPERATOR_ROLES: "owner,admin,operator",
    ENABLE_EMBEDDING_STUB: "true",
    VECTOR_BACKEND: "stub",
    ENABLE_GROUNDED_GENERATION_STUB: "true",
    API_PROVIDER_MAX_RETRIES: "2",
    API_PROVIDER_RETRY_BASE_MS: "200",
  });

  expect(out.GCP_PROJECT).toBe("bluewirks-intelligence-cloud");
});

test("api runtime config validation fails when vertex backend missing endpoint", async () => {
  const cfg = await import("../platform-core/api/dist/config.js");

  expect(() => cfg.validateApiRuntimeConfig({
    GCP_PROJECT: "bluewirks-intelligence-cloud",
    GCP_REGION: "us-central1",
    ORG_ID: "org-1",
    INTERNAL_API_ENABLED: "true",
    INTERNAL_OPERATOR_ROLES: "owner,admin,operator",
    ENABLE_EMBEDDING_STUB: "false",
    VECTOR_BACKEND: "vertex",
    ENABLE_GROUNDED_GENERATION_STUB: "false",
    API_PROVIDER_MAX_RETRIES: "2",
    API_PROVIDER_RETRY_BASE_MS: "200",
  })).toThrow();
});

test("api runtime config treats string false booleans correctly", async () => {
  const cfg = await import("../platform-core/api/dist/config.js");

  const out = cfg.validateApiRuntimeConfig({
    GCP_PROJECT: "bluewirks-intelligence-cloud",
    GCP_REGION: "us-central1",
    ORG_ID: "org-1",
    INTERNAL_API_ENABLED: "false",
    INTERNAL_OPERATOR_ROLES: "owner,admin,operator",
    ENABLE_EMBEDDING_STUB: "false",
    VECTOR_BACKEND: "stub",
    ENABLE_GROUNDED_GENERATION_STUB: "false",
    API_PROVIDER_MAX_RETRIES: "2",
    API_PROVIDER_RETRY_BASE_MS: "200",
    ENABLE_VISION_OCR: "false",
  });

  expect(out.INTERNAL_API_ENABLED).toBe(false);
  expect(out.ENABLE_EMBEDDING_STUB).toBe(false);
  expect(out.ENABLE_GROUNDED_GENERATION_STUB).toBe(false);
  expect(out.ENABLE_VISION_OCR).toBe(false);
});

test("api runtime config requires OCR key only when vision OCR is true", async () => {
  const cfg = await import("../platform-core/api/dist/config.js");

  expect(() => cfg.validateApiRuntimeConfig({
    GCP_PROJECT: "bluewirks-intelligence-cloud",
    GCP_REGION: "us-central1",
    ORG_ID: "org-1",
    INTERNAL_API_ENABLED: "true",
    INTERNAL_OPERATOR_ROLES: "owner,admin,operator",
    ENABLE_EMBEDDING_STUB: "true",
    VECTOR_BACKEND: "stub",
    ENABLE_GROUNDED_GENERATION_STUB: "true",
    API_PROVIDER_MAX_RETRIES: "2",
    API_PROVIDER_RETRY_BASE_MS: "200",
    ENABLE_VISION_OCR: "true",
  })).toThrow("GOOGLE_VISION_API_KEY is required when ENABLE_VISION_OCR=true");
});
