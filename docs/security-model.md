# Security Model

> BlueWirks Intelligence Cloud — security & access control design.

---

## Principles

1. **Least privilege** — every service account receives only the permissions it needs
2. **Org boundary enforcement** — no client-supplied `org_id`; always derived from token claims
3. **Defense in depth** — middleware + Firestore rules + IAM roles
4. **Audit trail** — every generation run is recorded with prompt version, model config, and retrieval metadata

---

## Authentication

- **Firebase Auth** with Google sign-in (OAuth 2.0)
- Custom claims set at user provisioning:
  - `org_id` — tenant identifier
  - `role` — `admin` | `member` | `viewer`

## Authorization Layers

### API Middleware

```
Request → verifyIdToken → extractClaims → enforceOrgBoundary → enforceRole → handler
```

- Token must be valid and non-expired
- `org_id` claim must match the configured `ORG_ID`
- Role must meet the minimum required for the endpoint

### Firestore Security Rules

- All reads/writes scoped to `org_id` from auth token
- No wildcard access
- Deny-by-default

### IAM (Google Cloud)

| Service Account          | Roles                                             |
| -------------------------| ------------------------------------------------- |
| `api-sa`                 | Cloud Run Invoker, Firestore User, Storage Creator |
| `worker-sa`              | Pub/Sub Subscriber, Vertex AI User, Storage Viewer |
| `ci-sa`                  | Cloud Build Editor, Artifact Registry Writer       |

---

## Data Protection

- Assets stored in GCS with uniform bucket-level access
- Signed URLs expire after configurable TTL (default 15 min)
- Firestore data encrypted at rest (Google-managed keys)
- No PII stored in vector embeddings

---

## Incident Response

- Cloud Logging for all API + worker activity
- Error Reporting for unhandled exceptions
- Alerting policies for error rate + latency spikes
- Runbooks in `/docs/runbooks/` for common scenarios
