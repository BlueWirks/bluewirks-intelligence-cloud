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

## Notes

- Budget module is disabled by default to avoid requiring a notification channel
- All resources follow least-privilege IAM
- State should be stored in a GCS backend for team collaboration
