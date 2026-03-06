test("worker pipeline transforms chunks into embedding and vector documents", async () => {
  const pipeline = await import("../platform-core/worker/dist/pipeline.js");

  const chunks = [
    {
      chunkId: "sec-1-chunk-0",
      content: "alpha",
      byteOffset: 12,
      byteLength: 5,
      metadata: { sectionId: "sec-1", sectionTitle: "Section 1" },
    },
  ];

  const embeddingInputs = pipeline.buildEmbeddingInputs({
    orgId: "org-1",
    assetId: "asset-1",
    assetType: "document",
    gcsUri: "gs://bucket/path/file.txt",
    chunks,
  });

  expect(embeddingInputs).toHaveLength(1);
  expect(embeddingInputs[0].metadata.orgId).toBe("org-1");
  expect(embeddingInputs[0].metadata.assetId).toBe("asset-1");

  const docs = pipeline.buildVectorDocuments({
    orgId: "org-1",
    assetId: "asset-1",
    embeddings: [
      {
        chunkId: embeddingInputs[0].chunkId,
        embedding: [0.1, 0.2, 0.3],
        metadata: embeddingInputs[0].metadata,
      },
    ],
  });

  expect(docs).toHaveLength(1);
  expect(docs[0].id).toBe("org-1:asset-1:sec-1-chunk-0");
  expect(docs[0].orgId).toBe("org-1");
});
