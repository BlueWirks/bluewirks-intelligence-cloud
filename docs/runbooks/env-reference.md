# Env Reference (Release Candidate)

This file is the single source of truth for runtime env vars used by API and Worker.

## API env matrix

| Variable | Required | Default | Notes |
|---|---:|---|---|
| `PORT` | No | `8080` | Cloud Run container port. |
| `GCP_PROJECT` | Yes | — | Must match `bluewirks-intelligence-cloud`. |
| `GCP_REGION` | Yes | — | Must remain `us-central1`. |
| `ORG_ID` | Yes | — | Single-tenant scope guardrail for current rollout. |
| `INTERNAL_API_ENABLED` | No | `true` | Enables `/v1/internal/*` route family. |
| `INTERNAL_OPERATOR_ROLES` | No | `owner,admin,operator` | Comma-separated internal roles. |
| `ENABLE_EMBEDDING_STUB` | No | `true` | Retrieval embedding provider mode toggle. |
| `VECTOR_BACKEND` | No | `stub` | Allowed: `stub`, `vertex`. |
| `VECTOR_SEARCH_ENDPOINT` | Conditional | — | Required when `VECTOR_BACKEND=vertex`. |
| `DEPLOYED_INDEX_ID` | Conditional | — | Required when `VECTOR_BACKEND=vertex`. |
| `ENABLE_GROUNDED_GENERATION_STUB` | No | `true` | Grounded generation provider mode toggle. |
| `GENERATION_MODEL` | No | `gemini-2.0-flash` | Model for non-stub generation path. |
| `API_PROVIDER_MAX_RETRIES` | No | `2` | Provider retries in API services. |
| `API_PROVIDER_RETRY_BASE_MS` | No | `200` | Exponential backoff base delay. |
| `ASSETS_BUCKET` | No | `bluewirks-hub-assets` (API service fallback) | API signed URL bucket target when unset. |
| `INGEST_TOPIC` | No | `ingest` (API service fallback) | API commit publish topic when unset. |

## Worker env matrix

| Variable | Required | Default | Notes |
|---|---:|---|---|
| `PORT` | No | `8080` | Cloud Run container port. |
| `WORKER_SERVICE_NAME` | No | `worker` | Structured log service label. |
| `GCP_PROJECT` | Yes | — | Must match `bluewirks-intelligence-cloud`. |
| `GCP_REGION` | Yes | — | Must remain `us-central1`. |
| `ASSETS_BUCKET` | Yes | — | Source bucket for ingestion payloads. |
| `INGEST_TOPIC` | Yes | — | Primary ingestion topic. |
| `EMBEDDING_MODEL` | No | `gemini-embedding-001` | Model for worker chunk embeddings. |
| `VECTOR_BACKEND` | No | `stub` | Allowed: `stub`, `vertex`. |
| `WORKER_RETRY_MAX_ATTEMPTS` | No | `5` | Total attempts (initial + retries). |
| `WORKER_RETRY_BASE_DELAY_MS` | No | `500` | Exponential backoff base delay. |
| `ENABLE_WORKER_DLQ_PUBLISH` | No | `false` | Enables app-side DLQ publish on terminal failure. |
| `INGEST_DLQ_TOPIC` | Conditional | — | Required when `ENABLE_WORKER_DLQ_PUBLISH=true`. |

## Compatibility / runtime fallbacks (non-strict)

- `API_SERVICE_NAME` and similar service-name variables are optional runtime logging fallbacks and are not part of strict startup schema validation unless explicitly added to service config schemas.
- `EMBEDDING_MODEL` may be consumed through runtime fallback paths outside strict API startup schema validation.

Deprecated compatibility aliases:
- `ASSET_BUCKET` → use `ASSETS_BUCKET`
- `GCP_LOCATION` → use `GCP_REGION`

These aliases may still be honored in limited fallback paths but are not part of the strict validated env matrix.

## Validation and safety notes

- API startup validates required runtime config and fails fast when invalid.
- Worker startup validates required runtime config and fails fast when invalid.
- Keep `VECTOR_BACKEND=stub` and `ENABLE_GROUNDED_GENERATION_STUB=true` until production provider wiring is complete.
