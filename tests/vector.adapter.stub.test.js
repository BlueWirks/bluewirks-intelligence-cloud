test("vector stub adapter supports upsert/query/delete surface", async () => {
  process.env.VECTOR_BACKEND = "stub";

  const vectorEngine = await import("../platform-core/vector-engine/dist/index.js");
  const adapter = vectorEngine.createVectorIndexAdapter();

  const upsert = await adapter.upsertDocuments([
    {
      id: "org-1:asset-1:chunk-1",
      orgId: "org-1",
      assetId: "asset-1",
      chunkId: "chunk-1",
      embedding: new Array(768).fill(0.1),
      metadata: { orgId: "org-1", assetId: "asset-1" },
    },
  ]);

  expect(upsert.backend).toBe("stub");
  expect(upsert.upsertedCount).toBe(1);

  const matches = await adapter.querySimilar({
    orgId: "org-1",
    embedding: new Array(768).fill(0.1),
    topK: 3,
  });

  expect(Array.isArray(matches)).toBe(true);

  const deleted = await adapter.deleteByAsset({ orgId: "org-1", assetId: "asset-1" });
  expect(deleted.backend).toBe("stub");
});
