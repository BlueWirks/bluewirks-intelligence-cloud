export interface PromptConfig {
  promptId: string;
  promptVersion: string;
  modelId: string;
  temperature: number;
  maxOutputTokens: number;
  systemInstruction: string;
  userTemplate: string;
  outputSchema: Record<string, unknown>;
}

export interface GenerationResult {
  runId: string;
  promptId: string;
  promptVersion: string;
  modelId: string;
  output: unknown;
  citations: Citation[];
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  status: "success" | "schema_retry" | "error";
}

export interface Citation {
  chunkId: string;
  sourceFile: string;
  byteRange: { start: number; end: number };
  score: number;
}
