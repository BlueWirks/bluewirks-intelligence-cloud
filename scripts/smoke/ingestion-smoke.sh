#!/usr/bin/env bash
set -euo pipefail

: "${API_BASE_URL:?Set API_BASE_URL}"
: "${ORG_ID:?Set ORG_ID}"
: "${ASSET_ID:?Set ASSET_ID}"
: "${FILENAME:?Set FILENAME}"
: "${CONTENT_TYPE:=application/json}"
: "${AUTH_TOKEN:?Set AUTH_TOKEN}"

SIGNED_PAYLOAD=$(cat <<JSON
{"orgId":"$ORG_ID","assetId":"$ASSET_ID","filename":"$FILENAME","contentType":"$CONTENT_TYPE","assetType":"document"}
JSON
)

SIGNED_RESPONSE=$(curl -sS -X POST "$API_BASE_URL/v1/assets/signed-url" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$SIGNED_PAYLOAD")

echo "signed-url response: $SIGNED_RESPONSE"

GCS_URI=$(echo "$SIGNED_RESPONSE" | python3 -c 'import json,sys; print(json.load(sys.stdin)["upload"]["gcsUri"])')

COMMIT_PAYLOAD=$(cat <<JSON
{"orgId":"$ORG_ID","assetId":"$ASSET_ID","gcsUri":"$GCS_URI","assetType":"document"}
JSON
)

COMMIT_RESPONSE=$(curl -sS -X POST "$API_BASE_URL/v1/assets/commit" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$COMMIT_PAYLOAD")

echo "commit response: $COMMIT_RESPONSE"
