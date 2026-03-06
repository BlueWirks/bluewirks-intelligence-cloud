const { readFileSync } = require("fs");
const { resolve } = require("path");

test("smoke scripts include internal auth and retrieval route checks", () => {
  const retrieval = readFileSync(resolve("scripts/smoke/retrieval-smoke.sh"), "utf-8");
  const generation = readFileSync(resolve("scripts/smoke/grounded-generation-smoke.sh"), "utf-8");
  const auth = readFileSync(resolve("scripts/smoke/internal-auth-smoke.sh"), "utf-8");

  expect(retrieval.includes("/v1/internal/retrieval/debug")).toBe(true);
  expect(generation.includes("/v1/internal/grounded-generation")).toBe(true);
  expect(auth.includes("Expecting 401")).toBe(true);
});
