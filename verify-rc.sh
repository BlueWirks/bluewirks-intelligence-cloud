#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="bluewirks-intelligence-cloud"
REGION="us-central1"
TOPIC="ingest-assets"
SUB="ingest-sub"

echo "====================================="
echo "BlueWirks RC Verification Starting"
echo "====================================="

echo ""
echo "1️⃣ Setting project"
gcloud config set project $PROJECT_ID >/dev/null

echo "✔ Project set"

echo ""
echo "2️⃣ Checking Cloud Run services"

SERVICES=$(gcloud run services list --region $REGION --format="value(metadata.name)")

echo "$SERVICES" | grep bluewirks-api >/dev/null || { echo "❌ bluewirks-api missing"; exit 1; }
echo "$SERVICES" | grep bluewirks-worker >/dev/null || { echo "❌ bluewirks-worker missing"; exit 1; }

echo "✔ Cloud Run services present"

echo ""
echo "3️⃣ Getting service URLs"

API_URL=$(gcloud run services describe bluewirks-api \
  --region $REGION \
  --format='value(status.url)')

WORKER_URL=$(gcloud run services describe bluewirks-worker \
  --region $REGION \
  --format='value(status.url)')

echo "API URL: $API_URL"
echo "Worker URL: $WORKER_URL"

echo ""
echo "4️⃣ Checking Pub/Sub topic"

gcloud pubsub topics describe $TOPIC >/dev/null

echo "✔ Topic exists"

echo ""
echo "5️⃣ Checking ingestion subscription"

gcloud pubsub subscriptions describe $SUB >/dev/null

SUB_TOPIC=$(gcloud pubsub subscriptions describe $SUB --format="value(topic)")
EXPECTED_TOPIC="projects/$PROJECT_ID/topics/$TOPIC"

if [[ "$SUB_TOPIC" != "$EXPECTED_TOPIC" ]]; then
  echo "❌ Subscription topic mismatch"
  echo "Expected: $EXPECTED_TOPIC"
  echo "Actual:   $SUB_TOPIC"
  exit 1
fi

echo "✔ Subscription attached to correct topic"

echo ""
echo "6️⃣ Checking push endpoint"

PUSH_ENDPOINT=$(gcloud pubsub subscriptions describe $SUB --format="value(pushConfig.pushEndpoint)")

if [[ "$PUSH_ENDPOINT" != "$WORKER_URL/" ]]; then
  echo "❌ Push endpoint mismatch"
  echo "Expected: $WORKER_URL/"
  echo "Actual:   $PUSH_ENDPOINT"
  exit 1
fi

echo "✔ Push endpoint correct"

echo ""
echo "7️⃣ Checking API health"

TOKEN=$(gcloud auth print-identity-token)

HEALTH=$(curl -s -H "Authorization: Bearer $TOKEN" $API_URL/health)

if [[ "$HEALTH" != *'"ok":true'* ]]; then
  echo "❌ API health check failed"
  echo "$HEALTH"
  exit 1
fi

echo "✔ API healthy"

echo ""
echo "8️⃣ Checking worker startup logs"

WORKER_LOG=$(gcloud logging read \
'resource.type="cloud_run_revision"
AND resource.labels.service_name="bluewirks-worker"
AND logName:"run.googleapis.com%2Fstdout"' \
--limit=20 \
--format="value(jsonPayload.message,jsonPayload.stage,jsonPayload.status,textPayload)" || true)

echo "$WORKER_LOG"

echo "$WORKER_LOG" | grep -E "Ingestion message received|Worker listening|startup|ready" >/dev/null || {
  echo "❌ Worker startup log missing"
  exit 1
}

echo "✔ Worker running"

echo ""
echo "9️⃣ Publishing ingestion test event"

TEST_ID="rc-test-$(date +%s)"
TRACE_ID="$(python3 -c 'import uuid; print(uuid.uuid4())')"
CREATED_AT="$(python3 -c 'from datetime import datetime, timezone; print(datetime.now(timezone.utc).isoformat().replace("+00:00","Z"))')"
GCS_URI="gs://bluewirks-intelligence-cloud-assets/rc/${TEST_ID}.txt"

gcloud pubsub topics publish $TOPIC \
--message="{\"traceId\":\"$TRACE_ID\",\"orgId\":\"bluewirks\",\"assetId\":\"$TEST_ID\",\"assetType\":\"document\",\"gcsUri\":\"$GCS_URI\",\"createdAt\":\"$CREATED_AT\"}" >/dev/null

echo "✔ Event published"

sleep 5

echo ""
echo "🔟 Verifying worker processed event"

EVENT_LOG=$(gcloud logging read \
"resource.labels.service_name=\"bluewirks-worker\" AND \"Ingestion message received\"" \
--limit=5 \
--format="value(jsonPayload.message,textPayload)" || true)

echo "$EVENT_LOG"

if [[ -z "$EVENT_LOG" ]]; then
  echo "❌ Worker did not process ingestion event"
  exit 1
fi

echo "✔ Worker received ingestion event"

echo ""
echo "====================================="
echo "✅ BlueWirks RC Verification PASSED"
echo "====================================="
