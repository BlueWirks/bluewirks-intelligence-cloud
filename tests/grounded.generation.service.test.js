test("grounded generation assembles retrieval and returns strict JSON", async () => {
  process.env.ENABLE_EMBEDDING_STUB = "true";
  process.env.VECTOR_BACKEND = "stub";
  process.env.ENABLE_GROUNDED_GENERATION_STUB = "true";

  const grounded = await import("../platform-core/api/dist/services/grounded-generation.js");

  const out = await grounded.executeGroundedGeneration(
    {
      orgId: "org-1",
      query: "summarize my indexed context",
      topK: 4,
      promptId: "rag-chat-v1",
      outputSchemaVersion: "1.0.0",
    },
    {
      requestId: "req-grounded-1",
      traceId: "550e8400-e29b-41d4-a716-446655440000",
    }
  );

  expect(out.orgId).toBe("org-1");
  expect(out.requestId).toBe("req-grounded-1");
  expect(out.traceId).toBe("550e8400-e29b-41d4-a716-446655440000");
  expect(typeof out.output.answer).toBe("string");
  expect(typeof out.output.confidence).toBe("number");
  expect(Array.isArray(out.output.citations)).toBe(true);
  expect(Array.isArray(out.processing)).toBe(true);
  expect(out.retrieval.orgId).toBe("org-1");
});
