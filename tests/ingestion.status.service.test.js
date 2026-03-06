test("ingestion status service returns asset and latest run summary", async () => {
  const svc = await import("../platform-core/api/dist/services/ingestion-status.js");

  const mockAssetDoc = {
    exists: true,
    id: "asset-1",
    data: () => ({
      traceId: "550e8400-e29b-41d4-a716-446655440000",
      status: "INDEXED",
      assetType: "document",
      gcsUri: "gs://bucket/path.txt",
      createdAt: new Date().toISOString(),
      embeddingStatus: "EMBEDDED",
      embeddingCount: 4,
    }),
    updateTime: { toDate: () => new Date("2026-03-06T00:00:00.000Z") },
  };

  const mockRunDocs = [
    {
      id: "run-2",
      data: () => ({
        assetId: "asset-1",
        traceId: "550e8400-e29b-41d4-a716-446655440000",
        status: "INDEXED",
        startedAt: "2026-03-06T00:00:02.000Z",
        finishedAt: "2026-03-06T00:00:03.000Z",
      }),
    },
  ];

  const mockDb = {
    collection: () => ({
      doc: () => ({
        collection: (name) => {
          if (name === "assets") {
            return {
              doc: () => ({ get: async () => mockAssetDoc }),
              where: () => ({ get: async () => ({ docs: [] }) }),
            };
          }
          return {
            where: () => ({ get: async () => ({ docs: mockRunDocs }) }),
          };
        },
      }),
    }),
  };

  const out = await svc.lookupIngestionStatus(
    {
      orgId: "org-1",
      assetId: "asset-1",
    },
    {
      requestId: "req-1",
      traceId: "550e8400-e29b-41d4-a716-446655440000",
    },
    { db: mockDb }
  );

  expect(out.count).toBe(1);
  expect(out.items[0].assetId).toBe("asset-1");
  expect(out.items[0].latestRun.runId).toBe("run-2");
});
