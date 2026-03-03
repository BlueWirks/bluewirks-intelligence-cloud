import { loadPrompt } from "./loader.js";
import { validateOutput } from "./validator.js";
import type { GenerationResult } from "./types.js";

const MAX_RETRIES = 2;

/**
 * Executes a generation run:
 * 1. Load prompt config
 * 2. Build prompt with context
 * 3. Call Gemini
 * 4. Validate output schema
 * 5. Retry if invalid (up to MAX_RETRIES)
 */
export async function executeGeneration(
  promptId: string,
  context: string,
  question: string
): Promise<GenerationResult> {
  const promptConfig = loadPrompt(promptId);
  const runId = crypto.randomUUID();
  const startTime = Date.now();

  let attempt = 0;
  let lastOutput: unknown = null;
  let lastError: string | null = null;

  while (attempt <= MAX_RETRIES) {
    try {
      // TODO Phase 2: Call Vertex AI Gemini with promptConfig
      // const model = vertexAI.getGenerativeModel({ model: promptConfig.modelId });
      // const result = await model.generateContent({ ... });

      // Placeholder response
      lastOutput = {
        answer: "Placeholder — Gemini integration coming in Phase 2",
        citations: [],
        confidence: 0,
      };

      const validation = validateOutput(lastOutput, promptConfig);

      if (validation.valid) {
        return {
          runId,
          promptId: promptConfig.promptId,
          promptVersion: promptConfig.promptVersion,
          modelId: promptConfig.modelId,
          output: lastOutput,
          citations: [],
          inputTokens: 0,
          outputTokens: 0,
          latencyMs: Date.now() - startTime,
          status: attempt > 0 ? "schema_retry" : "success",
        };
      }

      lastError = validation.errors;
      console.warn(JSON.stringify({
        severity: "WARNING",
        message: "Schema validation failed, retrying",
        runId,
        attempt,
        errors: validation.errors,
      }));
    } catch (err) {
      lastError = String(err);
    }

    attempt++;
  }

  return {
    runId,
    promptId: promptConfig.promptId,
    promptVersion: promptConfig.promptVersion,
    modelId: promptConfig.modelId,
    output: lastOutput,
    citations: [],
    inputTokens: 0,
    outputTokens: 0,
    latencyMs: Date.now() - startTime,
    status: "error",
  };
}
