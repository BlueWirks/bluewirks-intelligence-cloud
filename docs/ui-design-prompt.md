# BlueWirks Intelligence Cloud — UI/UX Design Prompt

---

You are a Principal Product Designer + Staff Frontend Architect.

Design a **complete, production-grade web dashboard** for **BlueWirks Intelligence Cloud** — an AI-native knowledge & decision infrastructure platform built on Google Cloud. The dashboard is the primary operator and admin interface. It will be reviewed by Google Cloud and investor technical evaluators. Every screen must demonstrate platform maturity, Google Cloud ecosystem fluency, and enterprise readiness.

---

## Platform Context

BlueWirks Intelligence Cloud is a modular AI infrastructure layer that ingests messy operational assets (media manifests, scene exports, session files, documents), extracts structured metadata, chunks and embeds content via Vertex AI, indexes in Vertex Vector Search, and serves retrieval-grounded generation via Vertex-hosted Gemini — all with strict validated JSON outputs, citations, prompt versioning, and run tracking.

**Stack:** TypeScript, Node.js 20, Express, Zod, Firestore, Cloud Run (scale-to-zero), Pub/Sub, GCS, Vertex AI Embeddings (`gemini-embedding-001`), Vertex Vector Search, Vertex Gemini, BigQuery, Cloud Monitoring, Cloud IAM, Eventarc, Cloud Scheduler. Monorepo with npm workspaces.

**Auth:** Firebase Auth with Google sign-in. Custom claims: `org_id`, `role`. Middleware enforces token validity, org boundary, and role-based access. All Scale features gated behind `ENABLE_SCALE_FEATURES` flag and require `requireInternalAuth` + `requireInternalOperatorRole`.

**Org isolation at every layer.** Every API call, every Firestore read, every route handler validates `orgId` scope.

---

## Design System Requirements

- Use **Google Material Design 3** (Material You) as the foundation
- Color palette derived from Google Cloud brand guidelines — cool neutrals, blue-600 primary, green/amber/red for status
- **8px spacing grid**, 4px micro-grid for dense data
- Typography: Google Sans for headings, Roboto for body/data
- Dark mode as default with seamless light mode toggle
- Responsive: optimized for 1440px+ widescreen, functional down to 1024px (no mobile needed — this is an operator console)
- Dense information architecture — maximize data density without sacrificing scanability
- Use Google Cloud Console patterns where applicable: left nav, breadcrumbs, resource detail panes, filter bars, inline actions
- Skeleton loading states, optimistic updates, and error boundaries on every view
- Every table must support: column sort, search/filter, pagination with cursor support, CSV export
- All destructive actions require **confirmation dialogs** with the resource name typed to confirm
- Toast notifications for async operations (Pub/Sub publishes, export triggers, etc.)
- Empty states with clear CTAs — never show a blank page

---

## Global Shell & Navigation

### Left Sidebar (collapsible, 240px expanded / 64px collapsed)

**Core Platform**
- 🏠 Dashboard (overview)
- 📦 Assets (upload, commit, status tracking)
- 💬 Chat (RAG conversation interface)
- 🔍 Ingestion (pipeline monitoring)

**AI Studio** (new — Scale-Next features)
- 🧠 Knowledge Workspaces
- ✏️ Prompt Engineering Studio
- 🧪 A/B Prompt Eval
- 🤖 AI App Builder
- ⚡ Workflow Automation

**Infrastructure** (new — Scale-Next features)
- 📊 Cost Allocation
- 📈 Custom Trace Metrics
- 🔔 Anomaly Detection
- 🌐 Cross-Region Failover
- 📤 BigQuery Export
- 🔄 Webhook Configurator

**Operations** (new — Scale-Next features)
- 🗑️ DLQ Replay
- 📅 Retention Policies
- 🧪 Synthetic Load Testing
- 🔐 RBAC Custom Roles
- 🏢 Multi-Tenant Isolation

**Bottom of sidebar:**
- Org switcher (avatar + org name)
- Settings
- Documentation link

### Top Bar
- Breadcrumb trail
- Environment badge (dev / staging / prod)
- Feature flag indicator (`SCALE FEATURES` badge when enabled)
- Global search (Cmd+K) — searches across assets, apps, templates, workflows, tenants
- Notification bell (webhook delivery status, anomaly alerts, DLQ new items)
- User avatar + role badge

---

## Page-by-Page Specifications

---

### 1. Dashboard (Home)

**Purpose:** Single-pane-of-glass operational overview.

**Layout:** 12-column grid, 4 rows of cards.

**Row 1 — KPI Strip (4 cards):**
| Card | Metric | Source |
|------|--------|--------|
| Assets Indexed | Total count + 7-day trend sparkline | Firestore `assets` collection |
| Ingestion Health | Success rate % (24h) + mini donut | Firestore `runs` collection |
| Active Experiments | Running A/B prompt evals | `prompt_experiments` (status=running) |
| Cost (MTD) | Estimated USD spend + vs last month | `cost_records` aggregation |

**Row 2 — Live Activity (2 panels):**
- **Left (8 cols):** Ingestion Pipeline Timeline — real-time vertical timeline showing recent ingestion jobs with status pills (QUEUED → PROCESSING → INDEXED / FAILED). Clicking expands to run detail.
- **Right (4 cols):** DLQ Alert Panel — count of unresolved DLQ messages, grouped by `failureCode`, with "Replay All" quick action.

**Row 3 — AI Studio Summary (3 cards):**
| Card | Content |
|------|---------|
| Knowledge Workspaces | Count of workspaces + total documents + total chunks |
| Prompt Templates | Published vs draft count, last updated timestamp |
| AI Apps | Deployed vs draft count, last deploy timestamp |

**Row 4 — Infrastructure Health (3 panels):**
- **Failover Status:** Current region badge, primary/failover status, last failover timestamp
- **Anomaly Alerts:** Active threshold breaches (count + severity), link to anomaly config
- **System Metrics:** Mini charts — p99 latency, error rate, throughput (from Custom Trace Metrics)

---

### 2. Assets

**Purpose:** Upload, commit, and track assets through the ingestion pipeline.

**Layout:**
- **Top action bar:** "Upload Asset" button (opens multi-step modal), filter chips (status, assetType, date range)
- **Main table:** Asset list

**Asset Table Columns:**
| Column | Type |
|--------|------|
| Asset ID | Monospace, copyable |
| Asset Type | Chip (pro_tools_session, unity_scene, doc, etc.) |
| Status | Color-coded pill: UPLOADED (gray), QUEUED (blue), PROCESSING (amber), INDEXED (green), FAILED (red) |
| GCS URI | Truncated with copy button |
| Trace ID | UUID link → opens trace detail |
| Created At | Relative time + tooltip with ISO |
| Actions | View detail, Re-ingest, Delete |

**Upload Modal (3 steps):**
1. Select org + asset type + file → Calls `POST /v1/assets/signed-url`
2. Upload progress bar (direct to GCS via signed URL)
3. Commit confirmation → Calls `POST /v1/assets/commit` → Shows trace ID

**Asset Detail Pane (right slide-out):**
- Asset metadata
- Ingestion run history (linked from `runs` subcollection)
- Chunk Overlap Visualizer (calls `POST /v1/scale/chunks/visualize`) — see Feature 5 below

---

### 3. Chat (RAG Interface)

**Purpose:** Retrieval-augmented conversational interface demonstrating Gemini generation quality.

**Layout:** Full-width three-panel: Thread list (left, 280px) | Chat window (center) | Context pane (right, 320px, collapsible)

**Chat Window:**
- Message bubbles with Markdown rendering
- Each AI response shows expandable **Citations** section — each citation shows chunkId, score, source asset, byte offset (from `TraceabilityMetadata`)
- Prompt version badge on each AI response (`promptId` + `promptVersion`)
- "View Trace" link per response → opens observability trace

**Context Pane (right):**
- Retrieved chunks displayed with relevance scores
- Overlapping chunk visualization (heatmap bar showing overlap regions)
- Token count breakdown (input / output / total)
- Latency breakdown (retrieval ms + generation ms)

---

### 4. Ingestion Pipeline Monitor

**Purpose:** Real-time visibility into the Pub/Sub → Worker → Parse/Chunk/Embed/Upsert pipeline.

**Layout:**
- **Pipeline DAG visualization** at top: `Upload → Pub/Sub → Worker → Parse → Chunk → Embed → Vector Upsert → Indexed`
  Each node shows aggregate throughput and error count
- **Run Table** below:

| Column | Content |
|--------|---------|
| Run ID | Link to detail |
| Asset ID | Link to asset |
| Trace ID | UUID, copyable |
| Status | PROCESSING / INDEXED / FAILED with icon |
| Started At | Relative timestamp |
| Duration | Auto-computed from start/finish |
| Error | Truncated message (expand on hover) |

---

### 5. Chunk Overlap Visualizer (Scale Feature)

**API:** `POST /v1/scale/chunks/visualize`

**Purpose:** Visual debugging of chunking strategy per asset.

**Access from:** Asset detail pane → "Visualize Chunks" button

**Layout:**
- **Header:** Asset ID, chunk count, chunk size config, overlap config
- **Main visualization:** Vertical strip for the full document. Each chunk shown as a colored block. Overlap regions shown as darker shaded intersections between adjacent blocks. Interactive — clicking a chunk expands its content, byte offset, byte length, embedding norm.
- **Stats sidebar:** Total chunks, average chunk size, max overlap, embedding norm distribution histogram
- **Schema source:** `ChunkVisualizeResponseSchema` — `chunks[]` array with `byteOffset`, `byteLength`, `overlapPrev`, `overlapNext`, `embeddingNorm`

---

### 6. Knowledge Workspaces (Scale Feature)

**API prefix:** `POST /v1/scale/knowledge/*`

**Purpose:** Manage curated document collections for RAG retrieval.

**Layout:**
- **Grid/List toggle** for workspace cards
- Each workspace card shows: name, description, document count, total chunks, created date, updated date
- Click → Workspace detail page

**Workspace Detail Page:**
- Header: Name, description, edit button
- **Document table:**

| Column | Content |
|--------|---------|
| Filename | With file type icon |
| Content Type | MIME type chip |
| Status | uploading / indexing / indexed / failed |
| Chunk Count | Number |
| Uploaded At | Relative time |
| Indexed At | Relative time (or "—") |
| Actions | Delete |

- **Upload button:** Opens modal → calls `POST /v1/scale/knowledge/:workspaceId/upload` → returns signed URL + document ID → client uploads → status transitions to `indexing`
- **Schema source:** `KnowledgeWorkspaceSchema`, `KnowledgeDocumentSchema`, `KnowledgeUploadResponseSchema`

---

### 7. Prompt Engineering Studio (Scale Feature)

**API prefix:** `POST /v1/scale/prompt-studio/*`

**Purpose:** Create, version, test, and publish prompt templates with full parameter control.

**Layout:** Three-panel editor

**Left Panel (template list, 280px):**
- Filterable by status (draft / published / archived)
- Shows name, version badge, model ID, status pill
- "New Template" button

**Center Panel (editor):**
- **System Instruction** — large textarea with token counter
- **User Template** — large textarea with `{{variable}}` highlighting and token counter
- **Model Configuration:**
  - Model selector: dropdown (default `gemini-2.0-flash`)
  - Temperature: slider 0.0–2.0 (default 0.7)
  - Max Output Tokens: numeric input 1–8192 (default 1024)
  - Output Schema: JSON editor (optional, for structured output mode)
- **Metadata:** Name, description, status dropdown
- Save button → `POST /v1/scale/prompt-studio/:templateId/update` (auto-increments version)
- Publish button → sets status to "published"

**Right Panel (test playground, collapsible):**
- Test Input textarea
- Optional Context textarea
- "Run Test" button → calls `POST /v1/scale/prompt-studio/:templateId/test`
- Response display: output, latency, input tokens, output tokens
- Diff view: compare outputs across versions

**Schema source:** `PromptTemplateSchema`, `PromptTemplateCreateRequestSchema`, `PromptTestRequestSchema`, `PromptTestResponseSchema`

---

### 8. A/B Prompt Eval Harness (Scale Feature)

**API prefix:** `POST /v1/scale/prompt-eval/*`

**Purpose:** Side-by-side prompt variant evaluation with quantitative scoring.

**Layout:**
- **Experiment List:** Table with name, status (draft/running/completed/failed), variant count, query count, created date. Click → detail.
- **Create Experiment Modal:**
  - Name input
  - Variants section: 2–5 variants, each with promptId + promptVersion + label
  - Test Queries: textarea (one per line), 1–50 queries
  - Create → `POST /v1/scale/prompt-eval/create`

**Experiment Detail Page:**
- Header: Name, status badge, variant labels as tabs
- **Results Matrix** (after running): Table where rows = test queries, columns = variants. Each cell shows: output preview (truncated), latency, token count, optional score (0–1)
- **Aggregate Stats per Variant:** Avg latency, avg token count, avg score (if scored)
- "Run Experiment" button → `POST /v1/scale/prompt-eval/:experimentId/run`
- Visual comparison: bar charts overlaying latency + token + score per variant
- **Schema source:** `PromptExperimentSchema`, `PromptEvalResultSchema`, `PromptEvalRunResponseSchema`

---

### 9. AI App Builder (Scale Feature)

**API prefix:** `/v1/scale/apps/*`

**Purpose:** Compose, configure, test, and deploy AI mini-applications powered by prompts + data sources.

**Layout:**
- **App Grid:** Cards with name, status pill (draft/testing/deployed/archived), description, prompt ID, data source count, last updated, deployed date
- Click → App Detail → **Tabbed interface:**

**Tab: Configure**
- App name + description
- Prompt selector (link to Prompt Studio templates)
- Data Source selector (multi-select from Knowledge Workspaces)
- Config JSON editor (free-form key-value for app-specific params)
- Save → `POST /v1/scale/apps/:appId/update`

**Tab: Test**
- Input textarea
- "Test" button → `POST /v1/scale/apps/:appId/test`
- Shows output, latency

**Tab: Deploy**
- Deploy button → `POST /v1/scale/apps/:appId/deploy`
- Deployment history log
- Status transitions: draft → testing → deployed

**Schema source:** `AiAppSchema`, `AiAppCreateRequestSchema`, `AiAppTestRequestSchema`, `AiAppTestResponseSchema`

---

### 10. Workflow Automation (Scale Feature)

**API prefix:** `/v1/scale/workflows/*`

**Purpose:** Define multi-step AI workflows with trigger-based execution.

**Layout:**
- **Workflow List:** Table with name, status (draft/active/paused/archived), trigger type chip (event/schedule/manual/webhook), step count, last updated
- Click → Workflow Editor

**Workflow Editor:**
- **Header:** Name, description, status badge, trigger type selector
- **Visual Step Builder (DAG / flow chart):**
  - Drag-and-drop step nodes
  - Step types: `retrieve`, `generate`, `transform`, `notify`, `condition`
  - Each step node expandable to configure: config JSON, next step connector, onError behavior (stop/skip/retry)
  - Visual connectors between steps
- **Trigger Configuration Panel:**
  - Event: event type selector
  - Schedule: cron expression input with human-readable preview
  - Webhook: auto-generated webhook URL
  - Manual: "Run Now" button
- **Actions:** Save, Activate (`POST /v1/scale/workflows/:id/activate`), Deactivate, Delete
- **Schema source:** `WorkflowDefinitionSchema`, `WorkflowStepSchema`, `WorkflowTriggerTypeSchema`

---

### 11. Cost Allocation Dashboard (Scale Feature)

**API:** `POST /v1/scale/cost/summary`

**Purpose:** Visibility into AI infrastructure costs broken down by tenant, query, model, or day.

**Layout:**
- **Date range picker** (start/end datetime) and **Group By** selector (tenant / query / model / day)
- **KPI Row:** Total input tokens, total output tokens, total estimated cost USD, total request count
- **Main Chart:** Stacked area chart — cost over time, segmented by group key. Recharts or Google Charts.
- **Detail Table:**

| Column | Content |
|--------|---------|
| Group Key | Tenant name / query type / model name / date |
| Input Tokens | Formatted number |
| Output Tokens | Formatted number |
| Total Tokens | Formatted number |
| Estimated Cost (USD) | Currency formatted with 4 decimals |
| Request Count | Formatted number |

- **Schema source:** `CostSummaryRequestSchema`, `CostSummaryResponseSchema`, `CostLineItemSchema`

---

### 12. Custom Trace Metrics (Scale Feature)

**API prefix:** `/v1/scale/metrics/*`

**Purpose:** Define and visualize custom observability metrics backed by Cloud Trace.

**Layout:**

**Left: Metric Explorer**
- Time range picker (start/end)
- Metric type selector: latency / throughput / error_rate
- Percentile selector: p50 / p90 / p95 / p99
- "Query" button → `POST /v1/scale/metrics/traces`
- **Chart:** Time series line chart with min/max/avg/current summary stats below

**Right: Custom Metric Definitions**
- Table of defined custom metrics:

| Column | Content |
|--------|---------|
| Name | Metric name |
| Metric Type | Type tag |
| Aggregation | avg/sum/count/min/max/p50/p90/p95/p99 |
| Filter | JSON preview |
| Created At | Date |
| Actions | Delete |

- "Create Metric" button → modal form → `POST /v1/scale/metrics/custom`
- **Schema source:** `TraceMetricsRequestSchema`, `TraceMetricsResponseSchema`, `CustomMetricDefinitionSchema`

---

### 13. Anomaly Detection Config (Scale Feature)

**API prefix:** `/v1/scale/anomaly/*`

**Purpose:** Configure metric thresholds that trigger alerts when breached.

**Layout:**
- **Thresholds Table:**

| Column | Content |
|--------|---------|
| Metric | Metric name |
| Operator | gt / lt / gte / lte (dropdown) |
| Value | Numeric threshold |
| Window (min) | 1–1440 |
| Enabled | Toggle |
| Updated At | Date |
| Actions | Edit, Delete |

- "Add Threshold" button → inline row editor or modal → `POST /v1/scale/anomaly/thresholds/upsert`
- **Baseline Section:** "Calculate Baseline" button → `POST /v1/scale/anomaly/baseline` — displays metric baselines with standard deviation, sample count, window start/end
- Baseline values help operators set informed thresholds
- **Schema source:** `AnomalyThresholdSchema`, `AnomalyBaselineResponseSchema`

---

### 14. Cross-Region Failover (Scale Feature)

**API prefix:** `/v1/scale/failover/*`

**Purpose:** Observe multi-region status and trigger manual failover operations.

**Layout:**
- **Region Map (hero visual):** World map or simplified Google Cloud region diagram with primary region highlighted in green, failover region(s) in amber/gray. Current active region pulsing.
- **Status Card:** Current region, primary region, status (primary / failover / restoring), last failover timestamp, last restored timestamp
- **Available Regions Table:** Region name, available status (boolean pill), latency (ms) → `POST /v1/scale/failover/regions`
- **Actions:**
  - "Activate Failover" button → confirmation dialog (must enter target region + reason) → `POST /v1/scale/failover/activate`
  - "Deactivate (Restore Primary)" button → `POST /v1/scale/failover/deactivate`
- Destructive action: failover activation requires typing the target region name to confirm
- **Schema source:** `FailoverStateSchema`, `FailoverActivateRequestSchema`, `FailoverRegionSchema`

---

### 15. BigQuery Export Config (Scale Feature)

**API prefix:** `/v1/scale/export/*`

**Purpose:** Configure and trigger Firestore → BigQuery data exports for analytics.

**Layout:**
- **Config Table:**

| Column | Content |
|--------|---------|
| Source Collection | Firestore collection name |
| BigQuery Dataset | Dataset name |
| BigQuery Table | Table name |
| Schedule | Cron expression with human preview |
| Enabled | Toggle |
| Last Run | Timestamp + status pill (success/failed/pending) |
| Actions | Edit, Trigger Now, Delete |

- "Add Export" button → modal form → `POST /v1/scale/export/upsert`
- "Trigger Now" → confirmation → `POST /v1/scale/export/trigger` → toast with job ID
- **Schema source:** `ExportConfigSchema`, `ExportConfigUpsertRequestSchema`, `ExportTriggerResponseSchema`

---

### 16. Webhook Configurator (Scale Feature)

**API prefix:** `/v1/scale/webhooks/*`

**Purpose:** Configure HTTP webhook endpoints to receive platform events.

**Layout:**
- **Webhook Table:**

| Column | Content |
|--------|---------|
| Name | Webhook name |
| URL | Truncated + copy |
| Events | Chip list of subscribed events |
| Enabled | Toggle |
| Created At | Date |
| Actions | Edit, Test, Delete |

- Available events (from `WebhookEventTypeSchema`): `ingestion.completed`, `ingestion.failed`, `generation.completed`, `generation.failed`, `dlq.message_added`, `anomaly.threshold_breached`, `load_test.completed`, `failover.activated`
- "Create Webhook" → modal: name, URL (validated), multi-select events → `POST /v1/scale/webhooks/create`
- "Test" → `POST /v1/scale/webhooks/:id/test` → shows status code, success/fail, latency
- **Schema source:** `WebhookConfigSchema`, `WebhookCreateRequestSchema`, `WebhookTestResponseSchema`

---

### 17. DLQ Replay (Scale Feature)

**API prefix:** `/v1/scale/dlq/*`

**Purpose:** View, replay, and purge failed ingestion messages from the dead letter queue.

**Layout:**
- **Stats Bar:** Total DLQ count, grouped by failure code (bar chart or chips with counts)
- **DLQ Message Table:**

| Column | Content |
|--------|---------|
| Select | Checkbox |
| Message ID | Monospace, copyable |
| Asset ID | Link to asset detail |
| Asset Type | Chip |
| Failure Code | Color-coded chip |
| Failure Message | Truncated, expand on hover |
| Failed At | Relative time |
| Delivery Attempt | Number |
| Trace ID | UUID link |

- **Batch Actions (top bar, appears when rows selected):**
  - "Replay Selected" (max 100) → `POST /v1/scale/dlq/replay` → toast with replayed / failed counts
  - "Replay All (filtered)" → same but all matching current filter
- **Purge Action:** "Purge older than N days" → confirmation dialog → `POST /v1/scale/dlq/purge` → toast with purged count
- Pagination: cursor-based, 50 per page default, configurable
- Filter: by failure code dropdown
- **Schema source:** `DlqMessageItemSchema`, `DlqListRequestSchema`, `DlqReplayResponseSchema`, `DlqPurgeResponseSchema`

---

### 18. Retention Policies (Scale Feature)

**API prefix:** `/v1/scale/retention/*`

**Purpose:** Configure TTL-based data retention per Firestore collection.

**Layout:** Simple table editor
- **Table:**

| Column | Content |
|--------|---------|
| Collection | Firestore collection name (dropdown of known collections) |
| TTL (days) | Numeric input, 1–3650 |
| Enabled | Toggle |
| Updated At | Date |
| Updated By | Actor name |
| Actions | Edit, Delete |

- "Add Policy" → inline row or modal → `POST /v1/scale/retention/upsert`
- Delete → `DELETE /v1/scale/retention/:collection` with confirmation
- **Schema source:** `RetentionPolicySchema`, `RetentionListResponseSchema`, `RetentionUpsertRequestSchema`

---

### 19. Synthetic Load Testing (Scale Feature)

**API prefix:** `/v1/scale/load/*`

**Purpose:** Trigger and monitor synthetic load tests against API or Worker.

**Layout:**
- **Trigger Panel (left):**
  - Target Service: toggle (API / Worker)
  - Concurrency: slider 1–100 (default 10)
  - Duration: slider 10–600 seconds (default 60)
  - Requests/Second: slider 1–1000 (default 10)
  - "Start Test" button → `POST /v1/scale/load/trigger` → returns testId

- **Results Panel (right):**
  - Active test status: real-time poll → `POST /v1/scale/load/status`
  - **Live Gauges:** Total requests, success count, error count, avg latency, p99 latency
  - Progress bar based on duration elapsed
  - "Stop Test" button → `POST /v1/scale/load/stop`
  - **Historical Test Table:**

| Column | Content |
|--------|---------|
| Test ID | Link |
| Target | API/Worker |
| Status | pending/running/completed/stopped/failed |
| Total Requests | Number |
| Success / Error | Fraction |
| Avg Latency (ms) | Number |
| P99 Latency (ms) | Number |
| Started At | Date |
| Completed At | Date |

- **Schema source:** `LoadTestTriggerRequestSchema`, `LoadTestResultSchema`

---

### 20. RBAC Custom Roles (Scale Feature)

**API prefix:** `/v1/scale/rbac/*`

**Purpose:** Define custom roles with granular permission sets.

**Layout:**
- **Roles Table:**

| Column | Content |
|--------|---------|
| Role Name | Name |
| Description | Text |
| Permissions | Chip list (scrollable) |
| System | Boolean badge (system roles are read-only) |
| Created At | Date |
| Actions | Edit, Delete (disabled for system roles) |

- Available permissions (from `PermissionSchema`): `assets:read`, `assets:write`, `assets:delete`, `chat:read`, `chat:write`, `retrieval:read`, `retrieval:execute`, `generation:execute`, `ingestion:read`, `ingestion:write`, `admin:read`, `admin:write`, `scale:read`, `scale:write`, `scale:admin`
- "Create Role" → modal: name (max 64), description (max 256), multi-select permissions (grouped by domain: Assets, Chat, Retrieval, Generation, Ingestion, Admin, Scale) → `POST /v1/scale/rbac/create`
- "Available Permissions" reference → `GET /v1/scale/rbac/permissions`
- System roles (flagged `isSystem: true`) cannot be edited or deleted
- **Schema source:** `RbacRoleSchema`, `RbacRoleCreateRequestSchema`, `PermissionSchema`

---

### 21. Multi-Tenant Isolation Controls (Scale Feature)

**API prefix:** `/v1/scale/tenants/*`

**Purpose:** Manage tenant-level isolation, quotas, and compliance verification.

**Layout:**
- **Tenant Table:**

| Column | Content |
|--------|---------|
| Tenant ID | Monospace |
| Isolation Level | Chip: shared (blue) / namespace (amber) / dedicated (green) |
| Data Prefix | Monospace |
| Allowed Regions | Chip list |
| Max Storage (GB) | Number or "—" |
| Max Req/Min | Number or "—" |
| Updated At | Date |
| Actions | Configure, Audit, Verify |

- **Configure** (slide-out panel): Update isolation level, regions, storage limit, rate limit → `POST /v1/scale/tenants/:tenantId/isolation` — creates audit entry automatically
- **Audit Log** (slide-out): Timeline of changes → `GET /v1/scale/tenants/:tenantId/audit`
  - Each entry shows: action, actor, details JSON, timestamp
- **Verify** button → `POST /v1/scale/tenants/:tenantId/verify` → displays 5 isolation checks:
  1. `data_prefix` — Data prefix configured and unique
  2. `firestore_rules` — Firestore security rules deployed
  3. `storage_isolation` — GCS bucket policies applied
  4. `region_compliance` — Running in allowed regions
  5. `rate_limit` — Rate limiting configuration active

  Each check shows pass/fail badge + detail text. "All Passed" summary badge at top.

- **Schema source:** `TenantConfigSchema`, `TenantIsolationLevelSchema`, `TenantAuditEntrySchema`, `TenantVerifyResponseSchema`

---

## Cross-Cutting UX Patterns

### Error Handling
- Zod validation errors from the API render as inline field errors (red border + message below input)
- 401 → redirect to login
- 403 → "Insufficient permissions" banner with required role info
- 404 → "Resource not found" empty state with back navigation
- 500 → "Something went wrong" with request ID for debugging + "Copy Request ID" button

### Confirmation Dialogs (Destructive Actions)
Required for: DLQ purge, asset delete, role delete, webhook delete, workflow delete, app delete, tenant isolation level change, failover activation, export trigger, retention policy delete. User must type the resource identifier to confirm.

### Audit Trail
- Every mutation on Scale routes automatically logs actor + action + timestamp
- Tenant isolation changes produce explicit audit entries (`TenantAuditEntrySchema`)
- All API responses include `requestId` in headers for trace correlation

### Feature Flag Awareness
- When `ENABLE_SCALE_FEATURES` is `false`: AI Studio, Infrastructure, and Operations nav sections show as locked/disabled with "Scale Features not enabled" tooltip
- When enabled: full access subject to RBAC role permissions

### Realtime Updates
- DLQ message count badge on nav item
- Ingestion pipeline status auto-refreshes every 10s
- Load test results poll every 2s while running
- Anomaly alerts push via webhook → shown in notification bell

---

## Deliverable Requirements

For each page, produce:
1. **High-fidelity wireframe** (annotated with spacing, component names, API call mapping)
2. **Component hierarchy** (React component tree with props)
3. **State management plan** (what goes in server state vs. client state)
4. **API integration map** (which endpoint, request shape, response shape, error cases)
5. **Loading / empty / error states** for every data-dependent section

**Tech stack for frontend:** React 18+, TypeScript, Material UI v6 (MUI), React Query (TanStack Query), React Router v6, Recharts for charts, Monaco Editor for JSON/code editing.

---

## Quality Bar

This dashboard will be evaluated by Google Cloud technical reviewers. It must demonstrate:
- **Enterprise readiness:** RBAC, audit trails, multi-tenant isolation, retention policies
- **Google Cloud fluency:** Native integration with Vertex AI, BigQuery, Cloud Monitoring, Firestore, Pub/Sub, Cloud Run, Eventarc
- **AI-native design:** Prompt engineering, A/B evaluation, knowledge management, workflow automation are first-class citizens — not bolted-on features
- **Operational maturity:** DLQ management, anomaly detection, failover controls, cost visibility, load testing, export pipelines
- **Data density without clutter:** Every pixel earns its place
