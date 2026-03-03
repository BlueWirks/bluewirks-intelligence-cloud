# Runbook: Ingestion Pipeline

> Operational guide for the BlueWirks ingestion pipeline.

---

## Overview

The ingestion pipeline processes uploaded assets through:
`Pub/Sub message → Worker → Parse → Chunk → Embed → Upsert`

---

## Normal Operation

1. Asset committed via API → Pub/Sub message published
2. Worker picks up message within seconds (Cloud Run auto-scales)
3. Worker parses asset based on `assetType`
4. Content chunked with byte offsets + metadata
5. Embeddings generated via Vertex AI
6. Vectors upserted into Vertex Vector Search
7. `runs/{runId}` written to Firestore

---

## Common Issues

### Worker not processing messages

**Symptoms:** Assets stuck in `pending` state in Firestore.

**Check:**
```bash
# Check worker logs
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="worker"' --limit=20

# Check Pub/Sub subscription
gcloud pubsub subscriptions describe ingestion-sub
```

**Resolution:**
- Verify worker service is deployed and healthy
- Check Pub/Sub subscription is not paused
- Verify IAM: worker SA needs `roles/pubsub.subscriber`

### Embedding failures

**Symptoms:** Run status is `error`, logs show Vertex AI errors.

**Check:**
```bash
gcloud logging read 'jsonPayload.component="embedding"' --limit=10
```

**Resolution:**
- Check Vertex AI API quota
- Verify embedding model availability in region
- Check worker SA has `roles/aiplatform.user`

### Vector upsert failures

**Symptoms:** Embeddings succeed but chunks not searchable.

**Resolution:**
- Verify Vector Search index exists and is deployed
- Check index endpoint health
- Confirm vector dimensions match embedding model output (768 for gemini-embedding-001)

---

## Monitoring

- **Dashboard:** Cloud Monitoring → BlueWirks Ingestion
- **Key metrics:** message age, processing latency, error rate
- **Alerts:** error rate > 5% over 5 min window
