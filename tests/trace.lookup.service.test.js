test("trace lookup service aggregates assets and runs", async () => {
  const svc = await import("../platform-core/api/dist/services/trace-lookup.js");

  const traceId = "550e8400-e29b-41d4-a716-446655440000";

  const mockAssets = [
    {
      id: "asset-1",
      data: () => ({
        traceId,
        status: "INDEXED",
        assetType: "document",
        gcsUri: "gs://bucket/asset-1.txt",
      }),
      updateTime: { toDate: () => new Date("2026-03-06T00:00:00.000Z") },
    },
  ];

  const mockRuns = [
    {
      id: "run-1",
      data: () => ({
        assetId: "asset-1",
        traceId,
        status: "INDEXED",
        startedAt: "2026-03-06T00:00:01.000Z",
        finishedAt: "2026-03-06T00:00:02.000Z",
      }),
    },
  ];

  const mockDb = {
    collection: () => ({
      doc: () => ({
        collection: (name) => {
          if (name === "assets") {
            return {
              doc: () => ({ get: async () => ({ exists: false }) }),
              where: () => ({ get: async () => ({ docs: mockAssets }) }),
            };
          }
          return {
            where: () => ({ get: async () => ({ docs: mockRuns }) }),
          };
        },
      }),
    }),
  };

  const out = await svc.lookupTrace(
    {
      orgId: "org-1",
      traceId,
    },
    {
      requestId: "req-trace-1",
      traceId,
    },
    { db: mockDb }
  );

  expect(out.assets).toHaveLength(1);
  expect(out.runs).toHaveLength(1);
  expect(out.assets[0].assetId).toBe("asset-1");
});
