#!/usr/bin/env bash
set -euo pipefail

: "${API_BASE_URL:?Set API_BASE_URL}"
: "${ORG_ID:?Set ORG_ID}"
: "${QUERY:?Set QUERY}"
: "${AUTH_TOKEN:?Set AUTH_TOKEN}"

PAYLOAD=$(cat <<JSON
{"orgId":"$ORG_ID","query":"$QUERY","topK":5}
JSON
)

curl -sS -X POST "$API_BASE_URL/v1/internal/retrieval/debug" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "x-bw-role: operator" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"

echo
