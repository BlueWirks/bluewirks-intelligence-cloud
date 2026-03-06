test("worker env validation passes for required configuration", async () => {
  const envModule = await import("../platform-core/worker/dist/env.js");

  const out = envModule.validateWorkerEnv({
    GCP_PROJECT: "bluewirks-intelligence-cloud",
    GCP_REGION: "us-central1",
    ASSETS_BUCKET: "bucket",
    INGEST_TOPIC: "ingest",
    VECTOR_BACKEND: "stub",
    WORKER_RETRY_MAX_ATTEMPTS: "5",
    WORKER_RETRY_BASE_DELAY_MS: "500",
    ENABLE_WORKER_DLQ_PUBLISH: "false",
  });

  expect(out.GCP_REGION).toBe("us-central1");
});

test("worker env validation fails without required vars", async () => {
  const envModule = await import("../platform-core/worker/dist/env.js");
  expect(() => envModule.validateWorkerEnv({})).toThrow();
});
