# AI Governance

> BlueWirks Intelligence Cloud — AI governance, prompt management, and traceability.

---

## Why Governance Matters

Production AI systems require:

- **Reproducibility** — same prompt + context → same class of output
- **Traceability** — which prompt version, which model, which context produced a given answer
- **Accountability** — audit log of every generation run
- **Safety** — schema-validated outputs prevent hallucination leakage

---

## Prompt Versioning

Every prompt is identified by:

```json
{
  "promptId": "rag-chat-v1",
  "promptVersion": "1.0.0",
  "modelId": "gemini-2.0-flash",
  "temperature": 0.2,
  "maxOutputTokens": 2048
}
```

Prompts are stored in `/platform-core/prompt-engine/prompts/` and versioned alongside code.

---

## Run Tracking

Each generation creates a `runs/{runId}` document in Firestore:

| Field              | Description                              |
| ------------------- | ---------------------------------------- |
| `runId`            | UUID                                     |
| `promptId`         | Prompt template identifier               |
| `promptVersion`    | Semver of the prompt                     |
| `modelId`          | Model used for generation                |
| `retrievedChunks`  | Array of chunk IDs used as context       |
| `inputTokens`      | Token count for input                    |
| `outputTokens`     | Token count for output                   |
| `latencyMs`        | End-to-end latency                       |
| `status`           | `success` | `schema_retry` | `error`     |
| `createdAt`        | Timestamp                                |

---

## Schema Validation

All AI outputs must conform to a JSON schema:

1. Gemini is instructed to return `responseMimeType: "application/json"`
2. Response is validated against the expected schema
3. If validation fails → retry with stricter constraints (up to 2 retries)
4. If still invalid → mark run as `error`, return graceful fallback

---

## Citations

Every generated response includes:

- `citations[]` — array of `{ chunkId, sourceFile, byteRange, score }`
- Enables end-users to verify AI answers against source material

---

## Responsible AI Practices

- No training on customer data
- Embeddings are task-specific, not general-purpose
- Model outputs are never stored without schema validation
- All prompts reviewed before version bump
