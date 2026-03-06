test("embedding stub adapter returns deterministic vectors", async () => {
  process.env.ENABLE_EMBEDDING_STUB = "true";

  const vectorEngine = await import("../platform-core/vector-engine/dist/index.js");
  const service = vectorEngine.createEmbeddingService();

  const a = await service.embedText("hello world", { orgId: "org-1" });
  const b = await service.embedText("hello world", { orgId: "org-1" });
  const c = await service.embedText("different", { orgId: "org-1" });

  expect(Array.isArray(a)).toBe(true);
  expect(a.length).toBe(768);
  expect(a).toEqual(b);
  expect(a).not.toEqual(c);
});
