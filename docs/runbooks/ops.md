# Runbook: Operations

> General operational guide for BlueWirks Intelligence Cloud.

Project and region are fixed for this release candidate:
- Project: `bluewirks-intelligence-cloud`
- Region: `us-central1`

---

## Service Health Checks

### API

```bash
curl https://api-<hash>-uc.a.run.app/health
# Expected: { "status": "ok", "version": "..." }
```

### Worker

Worker health is inferred from Pub/Sub message processing rate and error logs.

```bash
# Check recent worker activity
gcloud logging read 'resource.labels.service_name="worker"' --limit=10 --format=json
```

---

## Deployment

### CI/CD Pipeline

```
Push to main → Cloud Build trigger → Build/test → Artifact Registry images → Cloud Run deploy
```

### Manual deploy (emergency)

Required runtime env prerequisites (verify before deploy):

```bash
# API required
test -n "$GCP_PROJECT" && test -n "$GCP_REGION" && test -n "$ORG_ID"

# Worker required
test -n "$GCP_PROJECT" && test -n "$GCP_REGION" && test -n "$ASSETS_BUCKET" && test -n "$INGEST_TOPIC"
```

```bash
# API
gcloud run deploy api --image=us-central1-docker.pkg.dev/bluewirks-intelligence-cloud/bluewirks/api:v0.1.0 --region=us-central1 \
	--set-env-vars GCP_PROJECT=bluewirks-intelligence-cloud,GCP_REGION=us-central1,ORG_ID=$ORG_ID

# Worker
gcloud run deploy worker --image=us-central1-docker.pkg.dev/bluewirks-intelligence-cloud/bluewirks/worker:v0.1.0 --region=us-central1 \
	--set-env-vars GCP_PROJECT=bluewirks-intelligence-cloud,GCP_REGION=us-central1,ASSETS_BUCKET=$ASSETS_BUCKET,INGEST_TOPIC=$INGEST_TOPIC
```

---

## Common Operations

### Rotate service account keys

```bash
gcloud iam service-accounts keys create key.json --iam-account=SA_EMAIL
# Update in Secret Manager, redeploy services
```

### Check Pub/Sub backlog

```bash
gcloud pubsub subscriptions describe ingestion-sub --format='value(numUndeliveredMessages)'
```

### Force re-ingestion of an asset

1. Set `assets/{assetId}.status` to `QUEUED` or republish a commit message with same `assetId`.
2. Publish a new ingestion message with same `orgId/assetId`.
3. Monitor worker logs for `stage=parse/chunk/embed/index` transitions.

---

## Cost Monitoring

- **Budget alerts** configured via Terraform (when enabled)
- **Cloud Billing** dashboard for real-time spend
- **Key cost drivers:** Vertex AI API calls, Vector Search hosting, Cloud Run compute

---

## Incident Escalation

1. Check Cloud Error Reporting for new errors
2. Review Cloud Logging for root cause
3. Follow relevant runbook (ingestion, chat)
4. If unresolved, escalate to engineering lead

---

## Phase 4 hardening references

- `docs/runbooks/phase4-production-hardening.md`
- `docs/runbooks/env-reference.md`
- `docs/release-readiness-checklist.md`
