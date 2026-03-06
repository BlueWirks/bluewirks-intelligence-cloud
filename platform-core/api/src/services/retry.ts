export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  classify: (error: unknown) => "transient" | "permanent";
  onRetry?: (input: { attempt: number; delayMs: number; error: unknown }) => void;
}

export function classifyProviderError(error: unknown): "transient" | "permanent" {
  const message = String((error as any)?.message || error || "").toLowerCase();
  const code = Number((error as any)?.code || 0);

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
    return "transient";
  }

  return "permanent";
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      const classification = options.classify(error);
      if (classification === "permanent" || attempt >= options.maxRetries) {
        throw error;
      }

      attempt += 1;
      const delayMs = options.baseDelayMs * Math.pow(2, attempt - 1);
      options.onRetry?.({ attempt, delayMs, error });
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
