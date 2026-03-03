# Creator Hub

> Pro Tools + Unity ingest; creator workflows.

This module provides creator-specific adapters, workflows, and experiences built on top of the platform-core infrastructure.

## Capabilities (Phase 3)

- **Pro Tools session ingestion** — parse session exports, extract track metadata, chunk audio region notes
- **Unity scene ingestion** — parse scene manifests, extract GameObject hierarchy, chunk component data
- **Creator-specific prompts** — tailored Q&A for creative asset queries
- **Fixture-driven development** — uses `/fixtures/pro_tools/` and `/fixtures/unity/` for testing

## Architecture

```
creator-hub/
  src/
    adapters/         # Pro Tools + Unity format adapters
    workflows/        # Creator-specific ingestion + query workflows
    index.ts          # Module exports
```
