# Ops Intelligence

> SMB/agency ops ingest; decision recommendations.

This module provides operations-specific adapters and decision workflows for agencies, SMBs, and operational teams.

## Capabilities (Phase 3)

- **Document ingestion** — SOPs, process docs, meeting notes
- **Decision recommendation** — structured Q&A to help ops teams make decisions based on ingested knowledge
- **Operational context** — org-specific retrieval for day-to-day queries

## Architecture

```
ops-intelligence/
  src/
    adapters/         # Ops-specific document adapters
    workflows/        # Decision recommendation workflows
    index.ts          # Module exports
```
