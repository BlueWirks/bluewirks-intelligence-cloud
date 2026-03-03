# Runbook: Operations

> General operational guide for BlueWirks Intelligence Cloud.

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
Push to main → Cloud Build trigger → Build container → Push to Artifact Registry → Cloud Deploy release
```

### Manual Deploy (emergency)

```bash
# API
gcloud run deploy api --image=REGION-docker.pkg.dev/PROJECT/repo/api:TAG --region=REGION

# Worker
gcloud run deploy worker --image=REGION-docker.pkg.dev/PROJECT/repo/worker:TAG --region=REGION
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

1. Update asset status in Firestore to `pending`
2. Publish a new Pub/Sub message with the asset ID
3. Monitor worker logs for processing

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
