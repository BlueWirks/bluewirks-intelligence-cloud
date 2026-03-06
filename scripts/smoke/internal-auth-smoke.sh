#!/usr/bin/env bash
set -euo pipefail

: "${API_BASE_URL:?Set API_BASE_URL}"
: "${ORG_ID:?Set ORG_ID}"

PAYLOAD=$(cat <<JSON
{"orgId":"$ORG_ID","query":"auth check","topK":3}
JSON
)

echo "Expecting 401 (no auth header):"
curl -sS -o /tmp/bw_internal_auth_smoke.json -w "%{http_code}\n" \
  -X POST "$API_BASE_URL/v1/internal/retrieval/debug" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
cat /tmp/bw_internal_auth_smoke.json
