# Runbook: RAG Chat

> Operational guide for the BlueWirks RAG chat system.

---

## Overview

RAG chat flow:
`Query → Retrieve top-k chunks → Build prompt → Gemini generation → Schema validation → Response`

---

## Normal Operation

1. User sends chat message via API
2. API retrieves top-k chunks from Vertex Vector Search (org + role filtered)
3. Prompt built with chunk context, JSON schema, and `promptId + promptVersion`
4. Gemini generates structured JSON response
5. Response validated against schema
6. Message + citations stored in Firestore thread
7. `runs/{runId}` recorded for audit

---

## Common Issues

### Poor retrieval quality

**Symptoms:** Responses are off-topic or lack relevant context.

**Check:**
- Review retrieved chunk IDs in `runs/{runId}`
- Test embedding similarity manually
- Check if relevant content was properly ingested

**Resolution:**
- Verify chunking strategy preserves semantic meaning
- Consider adjusting top-k value
- Re-ingest with updated parsing if source format changed

### Schema validation failures

**Symptoms:** Run status is `schema_retry` or `error`.

**Check:**
```bash
gcloud logging read 'jsonPayload.component="prompt-engine" AND jsonPayload.event="schema_validation_failed"' --limit=10
```

**Resolution:**
- Review prompt template for clarity of JSON instructions
- Check if model temperature is too high (recommended: 0.1–0.3)
- Consider simplifying output schema

### High latency

**Symptoms:** Chat responses > 5s.

**Check:**
- Vertex Vector Search query latency
- Gemini generation latency
- Network latency between Cloud Run and Vertex

**Resolution:**
- Reduce top-k if retrieval is slow
- Use streaming responses for perceived latency improvement
- Check Cloud Run instance scaling

---

## Monitoring

- **Dashboard:** Cloud Monitoring → BlueWirks Chat
- **Key metrics:** e2e latency, retrieval latency, generation latency, schema retry rate
- **Alerts:** p95 latency > 8s, error rate > 3%
