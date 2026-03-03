# BlueWirks Intelligence Cloud — Terraform

> Infrastructure as Code for Google Cloud resources.

## Modules

- `project/` — base project setup, APIs, service accounts
- `iam/` — IAM bindings and role assignments
- `budget/` — budget alerts (off by default; requires notification channel)

## Usage

```bash
cd infra/terraform
terraform init
terraform plan -var-file=env/dev.tfvars
terraform apply -var-file=env/dev.tfvars
```

## Acceptance checks after apply

Run these immediately after a successful apply to validate the ingestion slice.

### 1) Signed URL upload path with `api-sa`

Expected object path shape:

`orgs/{orgId}/assets/{assetId}/{filename}`

You can verify with an API call to `/v1/assets/signed-url`, then upload the file with the returned URL and ensure the resulting object path matches the required pattern.

### 2) Publish test Pub/Sub message as `api-sa`

```bash
PROJECT_ID=$(terraform output -raw api_service_account | sed 's/.*@//; s/\.iam\.gserviceaccount\.com//')
TOPIC=$(terraform output -raw ingestion_topic)

gcloud pubsub topics publish "$TOPIC" \
	--project "$PROJECT_ID" \
	--message '{"traceId":"11111111-1111-4111-8111-111111111111","orgId":"dev-org","assetId":"asset-dev-1","assetType":"document","gcsUri":"gs://REPLACE_BUCKET/orgs/dev-org/assets/asset-dev-1/file.txt","createdAt":"2026-03-02T00:00:00.000Z"}'
```

### 3) Verify worker receive + Firestore permissions

- Pull one message from subscription to confirm delivery path:

```bash
SUB=$(terraform output -raw ingestion_subscription)
gcloud pubsub subscriptions pull "$SUB" --limit=1 --auto-ack --project "$PROJECT_ID"
```

- Confirm worker service account can read from Pub/Sub/GCS and write Firestore by checking worker logs and verifying `orgs/{orgId}/assets/{assetId}` and `orgs/{orgId}/runs/{runId}` writes.

## Notes

- Budget module is disabled by default to avoid requiring a notification channel
- All resources follow least-privilege IAM
- State should be stored in a GCS backend for team collaboration
