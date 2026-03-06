test("internal operator policy denies non-operator role", async () => {
  process.env.GCP_PROJECT = "bluewirks-intelligence-cloud";
  process.env.GCP_REGION = "us-central1";
  process.env.ORG_ID = "org-1";
  process.env.INTERNAL_OPERATOR_ROLES = "owner,admin,operator";

  const policy = await import("../platform-core/api/dist/middleware/internalPolicy.js");

  const req = { user: { role: "viewer", orgId: "org-1" }, requestId: "req-1" };
  let statusCode = 0;
  let payload = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
      return this;
    },
  };
  let nextCalled = false;

  policy.requireInternalOperatorRole(req, res, () => {
    nextCalled = true;
  });

  expect(statusCode).toBe(403);
  expect(nextCalled).toBe(false);
  expect(payload.error.code).toBe("FORBIDDEN_ROLE");
});

test("internal operator policy allows owner role", async () => {
  process.env.GCP_PROJECT = "bluewirks-intelligence-cloud";
  process.env.GCP_REGION = "us-central1";
  process.env.ORG_ID = "org-1";
  process.env.INTERNAL_OPERATOR_ROLES = "owner,admin,operator";

  const policy = await import("../platform-core/api/dist/middleware/internalPolicy.js");

  const req = { user: { role: "owner", orgId: "org-1" }, requestId: "req-2" };
  const res = {
    status() {
      return this;
    },
    json() {
      return this;
    },
  };

  let nextCalled = false;
  policy.requireInternalOperatorRole(req, res, () => {
    nextCalled = true;
  });

  expect(nextCalled).toBe(true);
});
