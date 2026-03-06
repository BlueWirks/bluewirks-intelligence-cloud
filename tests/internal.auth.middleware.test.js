test("internal auth middleware rejects unauthenticated requests", async () => {
  const middleware = await import("../platform-core/api/dist/middleware/internalAuth.js");

  const req = { user: { isAuthed: false }, requestId: "req-unauth" };
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

  middleware.requireInternalAuth(req, res, () => {
    nextCalled = true;
  });

  expect(statusCode).toBe(401);
  expect(nextCalled).toBe(false);
  expect(payload.error.code).toBe("UNAUTHORIZED");
});

test("internal auth middleware allows authenticated requests", async () => {
  const middleware = await import("../platform-core/api/dist/middleware/internalAuth.js");

  const req = { user: { isAuthed: true }, requestId: "req-auth" };
  const res = {
    status() {
      return this;
    },
    json() {
      return this;
    },
  };
  let nextCalled = false;

  middleware.requireInternalAuth(req, res, () => {
    nextCalled = true;
  });

  expect(nextCalled).toBe(true);
});
