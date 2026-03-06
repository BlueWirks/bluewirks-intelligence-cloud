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
