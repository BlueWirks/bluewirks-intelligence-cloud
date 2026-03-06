# Release Readiness Checklist (RC Consolidation)

Project and region lock:
- Project: `bluewirks-intelligence-cloud`
- Region: `us-central1`

## 1) Env vars
- [ ] Validate API env vars using `docs/runbooks/env-reference.md`
- [ ] Validate Worker env vars using `docs/runbooks/env-reference.md`
- [ ] API required vars present: `GCP_PROJECT`, `GCP_REGION`, `ORG_ID`
- [ ] Worker required vars present: `GCP_PROJECT`, `GCP_REGION`, `ASSETS_BUCKET`, `INGEST_TOPIC`
- [ ] If `VECTOR_BACKEND=vertex`, ensure `VECTOR_SEARCH_ENDPOINT` and `DEPLOYED_INDEX_ID` are set
- [ ] If `ENABLE_WORKER_DLQ_PUBLISH=true`, ensure `INGEST_DLQ_TOPIC` is set and worker SA can publish

## 2) Build and tests
- [ ] `npm run build`
- [ ] `npm test`

## 3) Smoke scripts
- [ ] `npm run smoke:ingestion`
- [ ] `npm run smoke:retrieval`
- [ ] `npm run smoke:generation`
- [ ] `npm run smoke:internal-auth`

## 4) Deploy API and Worker
- [ ] Build API image with `cloudbuild.api.yaml`
- [ ] Build Worker image with `cloudbuild.worker.yaml`
- [ ] Verify Artifact Registry repo path uses `bluewirks` consistently
- [ ] Deploy API Cloud Run service in `us-central1`
- [ ] Deploy Worker Cloud Run service in `us-central1`

## 5) Verify ingestion path
- [ ] Signed URL response returns upload + `gcsUri`
- [ ] Commit endpoint returns queued/accepted message
- [ ] Worker logs show parse/chunk/embed/index stages
- [ ] Asset status reaches `INDEXED` or terminal `FAILED` with failure code

## 6) Verify retrieval and grounded generation
- [ ] `/v1/internal/retrieval/debug` returns strict JSON contract with trace metadata
- [ ] `/v1/internal/grounded-generation` returns strict JSON output with citations

## 7) Verify internal operator routes
- [ ] `/v1/internal/ingestion/status`
- [ ] `/v1/internal/retrieval/debug`
- [ ] `/v1/internal/trace/lookup`
- [ ] Unauthenticated internal call returns 401 strict error envelope

## 8) DLQ readiness (if enabled)
- [ ] DLQ topic exists
- [ ] Worker SA has Pub/Sub publisher role on DLQ topic
- [ ] Terminal failures produce DLQ messages with trace/failure metadata

## 9) Final sign-off
- [ ] No failing build/tests
- [ ] Runbooks updated and accurate
- [ ] Known follow-ups recorded and accepted
