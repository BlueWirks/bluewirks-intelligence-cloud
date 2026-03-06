#!/usr/bin/env bash
set -euo pipefail

# =========================
# BlueWirks release script
# =========================

# Required base settings
: "${PROJECT_ID:=bluewirks-intelligence-cloud}"
: "${REGION:=us-central1}"
: "${ORG_ID:=bluewirks}"

# Core runtime config
: "${ASSETS_BUCKET:=bluewirks-intelligence-cloud-assets}"
: "${INGEST_TOPIC:=ingest-assets}"
: "${GCP_PROJECT:=$PROJECT_ID}"
: "${GCP_REGION:=$REGION}"

# Internal API / operator config
: "${INTERNAL_API_ENABLED:=true}"
: "${INTERNAL_OPERATOR_ROLES:=owner,admin,operator}"

# Retrieval / generation / vector config
: "${VECTOR_BACKEND:=stub}"
: "${ENABLE_EMBEDDING_STUB:=true}"
: "${ENABLE_GROUNDED_GENERATION_STUB:=true}"
: "${GENERATION_MODEL:=gemini-2.0-flash}"

# API retry config
: "${API_PROVIDER_MAX_RETRIES:=2}"
: "${API_PROVIDER_RETRY_BASE_MS:=200}"

# Worker retry / DLQ config
: "${WORKER_RETRY_MAX_ATTEMPTS:=5}"
: "${WORKER_RETRY_BASE_DELAY_MS:=500}"
: "${ENABLE_WORKER_DLQ_PUBLISH:=false}"
: "${INGEST_DLQ_TOPIC:=}"

# Service accounts
: "${API_SA:=bluewirks-api-sa@${PROJECT_ID}.iam.gserviceaccount.com}"
: "${WORKER_SA:=bluewirks-worker-sa@${PROJECT_ID}.iam.gserviceaccount.com}"
: "${PUSH_SA:=bw-pubsub-push@${PROJECT_ID}.iam.gserviceaccount.com}"

# Image repo
: "${AR_REPO:=bluewirks}"
: "${API_IMAGE:=us-central1-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/api:v0.1.0}"
: "${WORKER_IMAGE:=us-central1-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/worker:v0.1.0}"

# Optional behavior flags
: "${RUN_TESTS:=true}"
: "${RUN_SMOKE:=true}"
: "${SETUP_DLQ:=false}"

echo "==> Using project: ${PROJECT_ID}"
echo "==> Using region:  ${REGION}"

# -------------------------
# Helpers
# -------------------------
require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

json_pp() {
  python3 -m json.tool 2>/dev/null || cat
}

require_cmd gcloud
require_cmd curl
require_cmd python3
require_cmd npm

# -------------------------
# Auth / project
# -------------------------
echo "==> Configuring gcloud project"
gcloud config set project "${PROJECT_ID}" >/dev/null

echo "==> Checking gcloud auth"
gcloud auth print-access-token >/dev/null

# -------------------------
# Local verification
# -------------------------
echo "==> Building locally"
npm run build

if [[ "${RUN_TESTS}" == "true" ]]; then
  echo "==> Running tests"
  npm test
fi

# -------------------------
# Optional DLQ setup
# -------------------------
if [[ "${SETUP_DLQ}" == "true" ]]; then
  if [[ -z "${INGEST_DLQ_TOPIC}" ]]; then
    echo "SETUP_DLQ=true but INGEST_DLQ_TOPIC is empty" >&2
    exit 1
  fi

  echo "==> Ensuring DLQ topic exists: ${INGEST_DLQ_TOPIC}"
  gcloud pubsub topics create "${INGEST_DLQ_TOPIC}" || true

  echo "==> Granting worker SA publish access to DLQ"
  gcloud pubsub topics add-iam-policy-binding "${INGEST_DLQ_TOPIC}" \
    --member="serviceAccount:${WORKER_SA}" \
    --role="roles/pubsub.publisher" >/dev/null
fi

# -------------------------
# Build images
# -------------------------
echo "==> Building API image"
gcloud builds submit . --config cloudbuild.api.yaml

echo "==> Building Worker image"
gcloud builds submit . --config cloudbuild.worker.yaml

# -------------------------
# Deploy API
# -------------------------
echo "==> Deploying API"
gcloud run deploy bluewirks-api \
  --image "${API_IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --service-account "${API_SA}" \
  --no-allow-unauthenticated \
  --set-env-vars \
ASSETS_BUCKET="${ASSETS_BUCKET}",INGEST_TOPIC="${INGEST_TOPIC}",GCP_PROJECT="${GCP_PROJECT}",GCP_REGION="${GCP_REGION}",ORG_ID="${ORG_ID}",INTERNAL_API_ENABLED="${INTERNAL_API_ENABLED}",INTERNAL_OPERATOR_ROLES="${INTERNAL_OPERATOR_ROLES}",VECTOR_BACKEND="${VECTOR_BACKEND}",ENABLE_EMBEDDING_STUB="${ENABLE_EMBEDDING_STUB}",ENABLE_GROUNDED_GENERATION_STUB="${ENABLE_GROUNDED_GENERATION_STUB}",GENERATION_MODEL="${GENERATION_MODEL}",API_PROVIDER_MAX_RETRIES="${API_PROVIDER_MAX_RETRIES}",API_PROVIDER_RETRY_BASE_MS="${API_PROVIDER_RETRY_BASE_MS}" \
  >/dev/null

API_URL="$(gcloud run services describe bluewirks-api \
  --region "${REGION}" \
  --format='value(status.url)')"

echo "==> API URL: ${API_URL}"

# -------------------------
# Deploy Worker
# -------------------------
WORKER_ENV_VARS="ASSETS_BUCKET=${ASSETS_BUCKET},INGEST_TOPIC=${INGEST_TOPIC},GCP_PROJECT=${GCP_PROJECT},GCP_REGION=${GCP_REGION},VECTOR_BACKEND=${VECTOR_BACKEND},ENABLE_EMBEDDING_STUB=${ENABLE_EMBEDDING_STUB},WORKER_RETRY_MAX_ATTEMPTS=${WORKER_RETRY_MAX_ATTEMPTS},WORKER_RETRY_BASE_DELAY_MS=${WORKER_RETRY_BASE_DELAY_MS},ENABLE_WORKER_DLQ_PUBLISH=${ENABLE_WORKER_DLQ_PUBLISH}"

if [[ -n "${INGEST_DLQ_TOPIC}" ]]; then
  WORKER_ENV_VARS="${WORKER_ENV_VARS},INGEST_DLQ_TOPIC=${INGEST_DLQ_TOPIC}"
fi

echo "==> Deploying Worker"
gcloud run deploy bluewirks-worker \
  --image "${WORKER_IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --service-account "${WORKER_SA}" \
  --no-allow-unauthenticated \
  --set-env-vars "${WORKER_ENV_VARS}" \
  >/dev/null

WORKER_URL="$(gcloud run services describe bluewirks-worker \
  --region "${REGION}" \
  --format='value(status.url)')"

echo "==> Worker URL: ${WORKER_URL}"

# -------------------------
# Ensure Pub/Sub push auth
# -------------------------
echo "==> Ensuring Pub/Sub push service account exists"
gcloud iam service-accounts create bw-pubsub-push \
  --display-name="BlueWirks PubSub Push" >/dev/null 2>&1 || true

echo "==> Granting push SA invoke access to Worker"
gcloud run services add-iam-policy-binding bluewirks-worker \
  --region "${REGION}" \
  --member="serviceAccount:${PUSH_SA}" \
  --role="roles/run.invoker" >/dev/null

PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"

echo "==> Allowing Pub/Sub to mint OIDC tokens"
gcloud iam service-accounts add-iam-policy-binding "${PUSH_SA}" \
  --member="serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-pubsub.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator" >/dev/null

echo "==> Verifying ingestion subscription exists"
gcloud pubsub subscriptions describe ingest-sub >/dev/null

echo "==> Verifying ingestion subscription topic matches expectation"
SUB_TOPIC="$(gcloud pubsub subscriptions describe ingest-sub --format='value(topic)')"
EXPECTED_TOPIC="projects/${PROJECT_ID}/topics/${INGEST_TOPIC}"

if [[ "${SUB_TOPIC}" != "${EXPECTED_TOPIC}" ]]; then
  echo "Subscription/topic mismatch:" >&2
  echo "  expected: ${EXPECTED_TOPIC}" >&2
  echo "  actual:   ${SUB_TOPIC}" >&2
  exit 1
fi

echo "==> Updating push subscription"
gcloud pubsub subscriptions update ingest-sub \
  --push-endpoint="${WORKER_URL}/" \
  --push-auth-service-account="${PUSH_SA}" >/dev/null

# -------------------------
# Health checks
# -------------------------
TOKEN="$(gcloud auth print-identity-token)"

echo "==> Checking API health"
curl -s -H "Authorization: Bearer ${TOKEN}" "${API_URL}/health" | json_pp

echo "==> Recent Worker logs"
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND resource.labels.service_name="bluewirks-worker"
   AND logName:"run.googleapis.com%2Fstdout"' \
  --project="${PROJECT_ID}" \
  --limit=20 \
  --format='value(textPayload)' || true

# -------------------------
# Smoke tests
# -------------------------
if [[ "${RUN_SMOKE}" == "true" ]]; then
  echo "==> Running ingestion smoke test"
  ASSET_ID="smoke-$(date +%s)"

  SIGNED_JSON="$(
    curl -s -X POST \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"orgId\":\"${ORG_ID}\",\"assetId\":\"${ASSET_ID}\",\"filename\":\"smoke.txt\",\"contentType\":\"text/plain\",\"assetType\":\"document\"}" \
      "${API_URL}/v1/assets/signed-url"
  )"

  echo "${SIGNED_JSON}" | json_pp

  UPLOAD_URL="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["upload"]["url"])' <<< "${SIGNED_JSON}")"
  GCS_URI="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["upload"]["gcsUri"])' <<< "${SIGNED_JSON}")"

  echo "BlueWirks smoke test" > /tmp/bluewirks-smoke.txt

  curl -s -X PUT \
    -H "Content-Type: text/plain" \
    --upload-file /tmp/bluewirks-smoke.txt \
    "${UPLOAD_URL}" >/dev/null

  echo "==> Committing asset"
  curl -s -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"orgId\":\"${ORG_ID}\",\"assetId\":\"${ASSET_ID}\",\"gcsUri\":\"${GCS_URI}\",\"assetType\":\"document\"}" \
    "${API_URL}/v1/assets/commit" | json_pp

  echo "==> Worker logs after ingestion"
  gcloud logging read \
    'resource.type="cloud_run_revision"
     AND resource.labels.service_name="bluewirks-worker"
     AND logName:"run.googleapis.com%2Fstdout"' \
    --project="${PROJECT_ID}" \
    --limit=50 \
    --format='value(textPayload)' || true

  echo "==> Retrieval smoke"
  curl -s -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "x-bw-role: operator" \
    -H "Content-Type: application/json" \
    -d "{\"orgId\":\"${ORG_ID}\",\"query\":\"What is in the smoke document?\",\"topK\":3}" \
    "${API_URL}/v1/internal/retrieval/debug" | json_pp || true

  echo "==> Grounded generation smoke"
  curl -s -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "x-bw-role: operator" \
    -H "Content-Type: application/json" \
    -d "{\"orgId\":\"${ORG_ID}\",\"query\":\"Summarize the indexed smoke document in strict JSON.\",\"topK\":3,\"promptId\":\"rag-chat-v1\",\"outputSchemaVersion\":\"1.0.0\"}" \
    "${API_URL}/v1/internal/grounded-generation" | json_pp || true
fi

echo
echo "==> Release flow complete"
echo "API:    ${API_URL}"
echo "Worker: ${WORKER_URL}"
