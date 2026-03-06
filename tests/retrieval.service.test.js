test("retrieval service returns contract-shaped response", async () => {
  process.env.ENABLE_EMBEDDING_STUB = "true";
  process.env.VECTOR_BACKEND = "stub";

  const retrieval = await import("../platform-core/api/dist/services/retrieval.js");

  const out = await retrieval.retrieveGroundedContext(
    {
      orgId: "org-1",
      query: "find source chunks",
      topK: 4,
    },
    {
      requestId: "req-1",
      traceId: "550e8400-e29b-41d4-a716-446655440000",
    }
  );

  expect(out.orgId).toBe("org-1");
  expect(out.query).toBe("find source chunks");
  expect(out.topK).toBe(4);
  expect(Array.isArray(out.results)).toBe(true);
  expect(out.traceId).toBe("550e8400-e29b-41d4-a716-446655440000");
  expect(out.requestId).toBe("req-1");
  expect(typeof out.retrievedAt).toBe("string");
});
