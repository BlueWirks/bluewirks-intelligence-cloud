# Architecture

> BlueWirks Intelligence Cloud — system architecture overview.

---

## High-Level Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────────┐
│  Client App  │──────▶│  Cloud Run   │──────▶│  Firestore (org,     │
│  (web / CLI) │       │  API         │       │   assets, threads,   │
└──────────────┘       └──────┬───────┘       │   runs)              │
                              │               └──────────────────────┘
                              │ Pub/Sub
                              ▼
                       ┌──────────────┐
                       │  Cloud Run   │
                       │  Worker      │
                       └──────┬───────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      ┌──────────────┐ ┌───────────┐  ┌──────────────┐
      │ Vertex AI    │ │  GCS      │  │ Vertex       │
      │ Embeddings   │ │  Buckets  │  │ Vector Search│
      └──────────────┘ └───────────┘  └──────────────┘
```

---

## Auth + Org Boundary

- **Firebase Auth** with Google sign-in
- Custom claims: `org_id`, `role`
- Middleware enforces:
  - Token validity
  - `org_id === ORG_ID` (single-tenant initially)
  - Role-based access controls

---

## Signed URL Upload Flow

1. Client requests signed URL from API
2. Client uploads asset via signed URL to GCS
3. Client commits asset (API) → Firestore update + Pub/Sub publish

---

## Ingestion Pipeline (Worker)

1. Worker pulls ingestion message from Pub/Sub
2. Parses asset by `assetType` (Pro Tools session, Unity scene, docs, etc.)
3. Applies chunking strategy (byte offsets + metadata)
4. Generates embeddings via Vertex AI (`gemini-embedding-001`)
5. Upserts vectors into Vertex Vector Search index
6. Writes `runs/{runId}` with prompt/version/model config for audit

---

## RAG Chat

1. Retrieve top-k chunks (role + org filtered)
2. Build prompt with:
   - Context chunk metadata
   - Strict JSON schema
   - `promptId + promptVersion`
3. Gemini generates structured response
4. Validate schema; if invalid → retry with stricter constraints
5. Store message + citations in Firestore threads

---

## Key Principles

- **Org isolation** at every layer
- **Least privilege IAM** per service account
- **Structured JSON outputs** with schema validation
- **Prompt versioning** for governance and reproducibility
- **Observability-first** design
