# Roadmap

> BlueWirks Intelligence Cloud — phased delivery plan.

---

## Phase 0 — Repo + CI/CD

- [ ] Add LICENSE
- [ ] Base docs
- [ ] Node workspace scaffolding
- [ ] Cloud Build → Artifact Registry → Cloud Deploy pipeline skeleton

## Phase 1 — Secure Ingestion MVP

- [ ] Org boundary middleware + Firestore rules
- [ ] Storage bucket + signed URL API
- [ ] Asset commit + Pub/Sub publish
- [ ] Worker: parse → chunk → embed → upsert
- [ ] Observability: structured logs + dashboards

## Phase 2 — RAG with Governance

- [ ] Strict JSON schemas + validation
- [ ] Prompt versioning recorded in `runs/{runId}`
- [ ] Role-aware retrieval filtering
- [ ] Audit-friendly run tracking (retrieval list, prompt version, model config)

## Phase 3 — Vertical Module Value

- [ ] Creator Hub mini experience (fixtures)
- [ ] Ops Intelligence mini experience
- [ ] Knowledge Fabric cross-domain index + retention policies

## Phase 4 — Cost + Scale

- [ ] Budget alerts module (requires user notification channel)
- [ ] Log retention tuning
- [ ] Quota + capacity profiles per environment
