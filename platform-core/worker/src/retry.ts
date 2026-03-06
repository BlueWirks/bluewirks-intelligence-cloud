type RetryClassification = "transient" | "permanent";
type ErrorCode =
  | "VALIDATION_FAILED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "FORBIDDEN_ORG_SCOPE"
  | "FORBIDDEN_ROLE"
  | "CONFIG_MISSING"
  | "CONFIG_INVALID"
  | "DEPENDENCY_UNAVAILABLE"
  | "PROVIDER_FAILED"
  | "TRANSIENT_RETRY"
  | "INTERNAL"
  | "NOT_FOUND";

export function classifyWorkerError(error: unknown): { classification: RetryClassification; code: ErrorCode } {
  const message = String((error as any)?.message || error || "").toLowerCase();
  const code = Number((error as any)?.code || 0);

  if (message.includes("zod") || message.includes("invalid") || message.includes("schema")) {
    return { classification: "permanent", code: "VALIDATION_FAILED" };
  }

  if (message.includes("forbidden") || message.includes("permission") || code === 403) {
    return { classification: "permanent", code: "FORBIDDEN" };
  }

  if (
    message.includes("timeout") ||
    message.includes("deadline") ||
    message.includes("temporar") ||
    message.includes("unavailable") ||
    message.includes("econnreset") ||
    message.includes("rate limit") ||
    code === 429 ||
    code === 503 ||
    code === 504
  ) {
    return { classification: "transient", code: "TRANSIENT_RETRY" };
  }

  if (message.includes("vertex") || message.includes("vector") || message.includes("provider")) {
    return { classification: "transient", code: "PROVIDER_FAILED" };
  }

  return { classification: "permanent", code: "INTERNAL" };
}

export function shouldRetry(input: {
  attempt: number;
  maxAttempts: number;
  classification: RetryClassification;
}): boolean {
  if (input.classification !== "transient") {
    return false;
  }

  return input.attempt < input.maxAttempts;
}

export function computeBackoffMs(attempt: number, baseDelayMs: number): number {
  return baseDelayMs * Math.pow(2, Math.max(0, attempt - 1));
}
