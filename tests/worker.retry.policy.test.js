test("worker retry classification marks transient provider errors as retryable", async () => {
  const retry = await import("../platform-core/worker/dist/retry.js");

  const cls = retry.classifyWorkerError(new Error("vertex provider timeout"));
  const retryAllowed = retry.shouldRetry({
    attempt: 1,
    maxAttempts: 5,
    classification: cls.classification,
  });

  expect(cls.classification).toBe("transient");
  expect(retryAllowed).toBe(true);
});

test("worker retry classification marks validation errors as permanent", async () => {
  const retry = await import("../platform-core/worker/dist/retry.js");

  const cls = retry.classifyWorkerError(new Error("zod invalid schema"));
  const retryAllowed = retry.shouldRetry({
    attempt: 1,
    maxAttempts: 5,
    classification: cls.classification,
  });

  expect(cls.classification).toBe("permanent");
  expect(retryAllowed).toBe(false);
});
