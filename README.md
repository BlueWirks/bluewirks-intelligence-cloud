# BlueWirks Intelligence Cloud

> **Cross-industry AI-native knowledge & decision infrastructure** built on Google Cloud—starting with Creator and Ops verticals, designed for production-grade governance, modularity, and scale.

BlueWirks Intelligence Cloud is a reusable, modular **AI infrastructure layer**:

- Ingest messy operational assets (media manifests, scene exports, session exports, docs)
- Extract structured metadata
- Chunk + embed content
- Index in **Vertex Vector Search**
- Serve retrieval-grounded generation via **Vertex-hosted Gemini**
- Deliver **strict, validated JSON outputs** with **citations**, **prompt versioning**, and **run tracking**

**Stage:** pre-seed / early-stage infrastructure startup  
**Mission:** foundational “AI memory + reasoning” layer for real-world teams—creators, agencies, SMBs, and beyond.

---

## Why This Exists

Most “RAG apps” fail in real workflows because they lack:

- Governance (who can see what, why)
- Traceability (which prompt, which model version, which retrieval)
- Observability (latency, error, cost, regressions)
- Modularity (reuse ingestion + vector infra across verticals)

BlueWirks fixes that by treating AI as **infrastructure**, not a UI feature.

---

## Goals

1. **Org boundary enforcement** everywhere (middleware + Firestore rules)
2. **Least-privilege IAM** for API, workers, and CI/CD
3. **Repeatable ingestion pipeline** (Pub/Sub → worker → parse/chunk/embed/upsert)
4. **Strict JSON schemas** for outputs (fail fast, retry with constraints)
5. **Prompt versioning + runbooks** from day one
6. **Cost controls**: Cloud Run scale-to-zero, small corpora, conservative quotas

---

## Why Google Cloud (credit-aligned)

This platform is built to lean into Google Cloud strengths:

- **Vertex AI embeddings** (`gemini-embedding-001`) for retrieval foundations
- **Vertex Vector Search** for scalable semantic lookup
- **Vertex-hosted Gemini** for grounded generation with structured JSON
- **Cloud Run** for serverless APIs and workers (scale-to-zero)
- **Pub/Sub** for ingestion reliability
- **Firestore** for structured org data and audit-friendly state
- **Cloud Logging + Monitoring + Error Reporting** for production observability
- **Cloud Build + Artifact Registry + Cloud Deploy** for reproducible CI/CD

This is not “AI bolted on”; it is an AI-native platform designed to scale workloads and cloud consumption as the business grows.

---

## Repository Structure

```
/docs
  architecture.md
  roadmap.md
  security-model.md
  ai-governance.md
  runbooks/
    ingestion.md
    chat.md
    ops.md

/platform-core
  api/                 # Cloud Run API (upload URL, commit, chat, health)
  worker/              # Cloud Run worker (Pub/Sub ingest -> parse/chunk/embed/upsert)
  ingestion/           # adapters + parsers + normalization
  vector-engine/       # Vertex Vector Search client + metadata conventions
  prompt-engine/       # promptId + versioning + schema validation
  observability/       # structured logging, trace correlation, dashboards

/modules
  creator-hub/         # Pro Tools + Unity ingest; creator workflows
  ops-intelligence/    # SMB/agency ops ingest; decision recommendations
  knowledge-fabric/    # cross-domain contextual memory layer

/infra
  terraform/           # project resources + IAM output + budget modules (off by default)
/fixtures
  pro_tools/           # tiny Pro Tools session export
  unity/               # tiny Unity scene manifest
/unity
  Assets/Editor/BlueWirksSceneExporter.cs
```

---

## Architecture

### Auth + Org Boundary
- Firebase Auth Google sign-in
- Custom claims: `org_id`, `role`
- Middleware enforces:
  - token validity
  - `org_id === ORG_ID` (single tenant initially)
  - role-based access controls

### Signed URL Upload Flow
- Client requests signed URL (API)
- Client uploads asset via signed URL
- Client commits asset (API) → Firestore update + Pub/Sub publish

### Ingestion Pipeline (Worker)
- Worker pulls ingestion message
- Parses asset by `assetType`
- Chunking strategy (byte offsets + metadata)
- Embeddings via Vertex
- Upsert into Vertex Vector Search index
- Writes `runs/{runId}` with prompt/version/model config for audit

### RAG Chat
- Retrieve top-k chunks (role + org filtered)
- Build prompt with:
  - context chunk metadata
  - strict JSON schema
  - `promptId + promptVersion`
- Gemini generates structured response
- Validate schema; if invalid → retry with stricter constraints
- Store message + citations in Firestore threads

---

## Roadmap

### Phase 0 — repo + CI/CD
- [ ] Add LICENSE
- [ ] Base docs
- [ ] Node workspace scaffolding
- [ ] Cloud Build → Artifact Registry → Cloud Deploy pipeline skeleton

### Phase 1 — secure ingestion MVP
- [ ] Org boundary middleware + Firestore rules
- [ ] Storage bucket + signed URL API
- [ ] Asset commit + Pub/Sub publish
- [ ] Worker: parse → chunk → embed → upsert
- [ ] Observability: structured logs + dashboards

### Phase 2 — RAG with governance
- [ ] strict JSON schemas + validation
- [ ] prompt versioning recorded in `runs/{runId}`
- [ ] role-aware retrieval filtering
- [ ] audit-friendly run tracking (retrieval list, prompt version, model config)

### Phase 3 — vertical module value
- [ ] Creator Hub mini experience (fixtures)
- [ ] Ops Intelligence mini experience
- [ ] Knowledge Fabric cross-domain index + retention policies

### Phase 4 — cost + scale
- [ ] budget alerts module (requires user notification channel)
- [ ] log retention tuning
- [ ] quota + capacity profiles per environment

---

## Security & Governance

- Least privilege IAM per service account
- No client-supplied org_id
- Traceable answers via citations + chunk metadata
- Prompt governance: promptId + version recorded per run
- Observability-first logs for ingest + retrieval + generation

---

## Contributing

Early-stage; contributions are handled in phases: core stability → module builds → enterprise readiness.

---

## License

Choose a license (MIT / Apache 2.0 / proprietary). Once decided, add `LICENSE`.
