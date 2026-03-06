test("contracts validate retrieval and generation payloads", async () => {
  const contracts = await import("../platform-core/contracts/dist/index.js");

  const retrieval = contracts.RetrievalRequestSchema.parse({
    orgId: "org-1",
    query: "where is the source?",
    topK: 5,
  });

  expect(retrieval.orgId).toBe("org-1");
  expect(retrieval.topK).toBe(5);

  const groundedReq = (contracts.GroundedGenerationRequestSchema || contracts.GenerationRequestSchema).parse({
    orgId: "org-1",
    query: "summarize sources",
    topK: 3,
    promptId: "rag-chat-v1",
    outputSchemaVersion: "1.0.0",
  });

  expect(groundedReq.orgId).toBe("org-1");

  const generation = contracts.GenerationResponseSchema.parse({
    traceId: "550e8400-e29b-41d4-a716-446655440000",
    requestId: "req-1",
    orgId: "org-1",
    promptId: "rag-chat",
    promptVersion: "v1",
    modelId: "gemini-2.0-flash",
    outputSchemaVersion: "1.0.0",
    output: {
      answer: "ok",
      confidence: 0.9,
      citations: [
        {
          chunkId: "c1",
          score: 0.8,
          trace: {
            orgId: "org-1",
            assetId: "asset-1",
            chunkId: "c1",
          },
        },
      ],
      fields: {},
    },
    status: "success",
    latencyMs: 12,
    generatedAt: new Date().toISOString(),
    processing: [
      { stage: "retrieval", status: "retrieved", timestamp: new Date().toISOString() },
      { stage: "generation", status: "generated", timestamp: new Date().toISOString() },
    ],
    retrieval: {
      traceId: "550e8400-e29b-41d4-a716-446655440000",
      requestId: "req-1",
      orgId: "org-1",
      query: "where is the source?",
      topK: 5,
      retrievedAt: new Date().toISOString(),
      resultCount: 1,
      results: [
        {
          chunkId: "c1",
          score: 0.8,
          content: "hello",
          trace: {
            orgId: "org-1",
            assetId: "asset-1",
            chunkId: "c1",
          },
        },
      ],
    },
  });

  expect(generation.output.answer).toBe("ok");

  const ingestionLookup = (contracts.IngestionStatusLookupRequestSchema || contracts.IngestionStatusRequestSchema).parse({
    orgId: "org-1",
    assetId: "asset-1",
  });
  expect(ingestionLookup.orgId).toBe("org-1");

  if (contracts.RetrievalDebugRequestSchema) {
    const retrievalDebug = contracts.RetrievalDebugRequestSchema.parse({
      orgId: "org-1",
      query: "debug retrieval",
      topK: 3,
      includeRawMetadata: true,
    });
    expect(retrievalDebug.includeRawMetadata).toBe(true);
  }

  if (contracts.TraceLookupRequestSchema) {
    const traceLookup = contracts.TraceLookupRequestSchema.parse({
      orgId: "org-1",
      traceId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(traceLookup.orgId).toBe("org-1");
  }
});
