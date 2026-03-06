# Runbook: Phase 4 Production Hardening

## Scope
Operational hardening for API + Worker reliability without architecture changes.

## Deployment
1. Build images using existing Cloud Build configs.
2. Deploy API and Worker with validated env vars.
3. Verify `/health`, ingestion smoke, retrieval smoke, grounded generation smoke.

## Rollback
1. Identify last known-good image tags.
2. Redeploy both services to prior tags.
3. Re-run smoke scripts.
4. Validate logs show no spike in `status=failed` events.

## Incident triage checklist
1. Identify impacted stage: upload, commit, ingest, embed, index, retrieval, generation.
2. Query logs by `traceId` and `requestId`.
3. Check internal operator endpoints:
   - `/v1/internal/ingestion/status`
   - `/v1/internal/retrieval/debug`
   - `/v1/internal/trace/lookup`
4. Confirm retry classification (`transient` vs `permanent`).
5. If retries exhausted, inspect DLQ topic payloads.

## Failure playbooks

### Pub/Sub / worker retries
- Worker marks `retryStatus=RETRY_SCHEDULED` for transient errors.
- Delivery retries continue until `WORKER_RETRY_MAX_ATTEMPTS`.
- Final failures mark asset `FAILED` and optionally publish DLQ message when enabled.

### Embedding/vector provider failures
- Transient provider failures are retried with exponential backoff.
- Persistent provider failures are recorded with failure code and surfaced via internal status endpoints.

### API retrieval/generation failures
- API retries provider/dependency failures according to `API_PROVIDER_MAX_RETRIES` and `API_PROVIDER_RETRY_BASE_MS`.
- Failures return strict JSON error envelope with code/message/request identifiers.

## DLQ strategy (application-side ready)
- Enable with:
  - `ENABLE_WORKER_DLQ_PUBLISH=true`
  - `INGEST_DLQ_TOPIC=<topic-name>`
- DLQ payload includes: orgId, assetId, traceId, retry classification, failure code/message, failedAt.

### Cloud follow-up steps (if infra wiring deferred)
1. Create DLQ topic: `gcloud pubsub topics create <dlq-topic>`
2. Grant worker SA pubsub publisher on DLQ topic.
3. Optionally configure subscription dead-letter policy for primary ingestion subscription.

## IAM least-privilege baseline
- API SA:
  - Pub/Sub publisher on ingest topic
  - Storage object sign URL capabilities (bucket scoped)
  - Firestore read/write scoped to app collections
- Worker SA:
  - Pub/Sub subscriber on ingestion subscription
  - Firestore read/write scoped to app collections
  - Vertex AI user access for embedding/generation/index operations
  - Pub/Sub publisher on DLQ topic (if DLQ enabled)

## Alert-worthy markers
- `stage=pipeline status=failed`
- `stage=retry status=scheduled` sustained spikes
- `stage=dlq status=published`
- `stage=contract_validation status=failed`
- Any `severity=ERROR` rate > baseline over 5 minutes

## Release checklist reference
- `docs/release-readiness-checklist.md`
