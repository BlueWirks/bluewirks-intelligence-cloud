test("api retry helper retries transient errors then succeeds", async () => {
  const retry = await import("../platform-core/api/dist/services/retry.js");

  let count = 0;
  const result = await retry.withRetry(async () => {
    count += 1;
    if (count < 3) {
      const err = new Error("temporary unavailable");
      err.code = 503;
      throw err;
    }
    return "ok";
  }, {
    maxRetries: 3,
    baseDelayMs: 1,
    classify: retry.classifyProviderError,
  });

  expect(result).toBe("ok");
  expect(count).toBe(3);
});
