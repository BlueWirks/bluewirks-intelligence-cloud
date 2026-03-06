test("internal error envelope helper formats validation details", async () => {
  const zod = await import("zod");
  const errors = await import("../platform-core/api/dist/services/internal-error.js");

  const schema = zod.z.object({ orgId: zod.z.string().min(1) });
  let caught;

  try {
    schema.parse({ orgId: "" });
  } catch (err) {
    caught = err;
  }

  const details = errors.toValidationDetails(caught);
  expect(Array.isArray(details)).toBe(true);
  expect(details.length).toBeGreaterThan(0);

  const envelope = errors.buildInternalErrorEnvelope({
    code: "VALIDATION_FAILED",
    message: "Request body invalid",
    requestId: "req-1",
    details,
  });

  expect(envelope.error.code).toBe("VALIDATION_FAILED");
  expect(envelope.requestId).toBe("req-1");
  expect(Array.isArray(envelope.details)).toBe(true);
});
