test("retrieval debug service returns ranking metadata", async () => {
  process.env.ENABLE_EMBEDDING_STUB = "true";
  process.env.VECTOR_BACKEND = "stub";

  const svc = await import("../platform-core/api/dist/services/retrieval-debug.js");

  const out = await svc.executeRetrievalDebug(
    {
      orgId: "org-1",
      query: "debug query",
      topK: 3,
      includeRawMetadata: true,
    },
    {
      requestId: "req-debug-1",
      traceId: "550e8400-e29b-41d4-a716-446655440000",
    }
  );

  expect(out.orgId).toBe("org-1");
  expect(out.retrieval.traceId).toBe("550e8400-e29b-41d4-a716-446655440000");
  expect(Array.isArray(out.debug.ranking)).toBe(true);
});
