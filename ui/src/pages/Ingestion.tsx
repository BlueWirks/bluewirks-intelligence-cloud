import React from "react";
import {
  Box, Typography, Chip, IconButton, Tooltip, Stepper, Step, StepLabel,
  StepConnector, Paper, alpha,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorIcon from "@mui/icons-material/ErrorOutlineRounded";
import HourglassIcon from "@mui/icons-material/HourglassEmptyRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopyRounded";
import { PageShell, StatusChip, DataTable, type Column } from "../components";

interface Run {
  runId: string;
  assetId: string;
  traceId: string;
  status: string;
  startedAt: string;
  duration: string;
  error?: string;
}

const PIPELINE_STEPS = ["Upload", "Pub/Sub", "Worker", "Parse", "Chunk", "Embed", "Vector Upsert", "Indexed"];
const STEP_COUNTS = [42, 42, 40, 40, 38, 38, 37, 37];
const STEP_ERRORS = [0, 0, 2, 0, 2, 0, 1, 0];

const MOCK_RUNS: Run[] = [
  { runId: "run-1a2b3c", assetId: "ast-3f2e7a", traceId: "d4e5f6a7-b8c9-0d1e", status: "INDEXED", startedAt: "2m ago", duration: "14.2s" },
  { runId: "run-4d5e6f", assetId: "ast-8c1b04", traceId: "a1b2c3d4-e5f6-7890", status: "PROCESSING", startedAt: "4m ago", duration: "—" },
  { runId: "run-7g8h9i", assetId: "ast-a04f22", traceId: "11223344-5566-7788", status: "FAILED", startedAt: "11m ago", duration: "3.1s", error: "ParseError: Invalid JSON at line 42" },
  { runId: "run-j0k1l2", assetId: "ast-7e9d11", traceId: "ffeeddcc-bbaa-9988", status: "PROCESSING", startedAt: "15m ago", duration: "—" },
  { runId: "run-m3n4o5", assetId: "ast-01bcdf", traceId: "abababab-cdcd-efef", status: "INDEXED", startedAt: "22m ago", duration: "11.7s" },
];

const mono = { fontFamily: "'Roboto Mono', monospace", fontSize: "0.8125rem" };

const columns: Column<Run>[] = [
  { id: "runId", label: "Run ID", width: 140, render: (r) => <Typography sx={mono}>{r.runId}</Typography> },
  { id: "assetId", label: "Asset ID", width: 120, render: (r) => <Typography sx={mono}>{r.assetId}</Typography> },
  { id: "traceId", label: "Trace ID", width: 160, render: (r) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Typography sx={mono}>{r.traceId.slice(0, 16)}…</Typography>
      <Tooltip title="Copy"><IconButton size="small" onClick={() => navigator.clipboard.writeText(r.traceId)}><ContentCopyIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
    </Box>
  )},
  { id: "status", label: "Status", width: 120, render: (r) => <StatusChip status={r.status} /> },
  { id: "startedAt", label: "Started", width: 90, render: (r) => <Typography variant="body2">{r.startedAt}</Typography> },
  { id: "duration", label: "Duration", width: 80, render: (r) => <Typography variant="body2">{r.duration}</Typography> },
  { id: "error", label: "Error", render: (r) => r.error ? (
    <Tooltip title={r.error}><Typography variant="body2" color="error" sx={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.error}</Typography></Tooltip>
  ) : <Typography variant="body2" color="text.disabled">—</Typography> },
];

export default function Ingestion() {
  return (
    <PageShell title="Ingestion Pipeline" subtitle="Real-time visibility into the Pub/Sub → Worker → Parse/Chunk/Embed/Upsert pipeline">
      {/* Pipeline DAG Visualization */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>Pipeline Flow</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0, overflow: "auto" }}>
          {PIPELINE_STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 100,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: STEP_ERRORS[i] > 0 ? alpha("#EA4335", 0.1) : alpha("#34A853", 0.1),
                    border: 1,
                    borderColor: STEP_ERRORS[i] > 0 ? alpha("#EA4335", 0.3) : alpha("#34A853", 0.3),
                    mb: 0.75,
                  }}
                >
                  {STEP_ERRORS[i] > 0
                    ? <ErrorIcon sx={{ color: "#EA4335", fontSize: 20 }} />
                    : <CheckCircleIcon sx={{ color: "#34A853", fontSize: 20 }} />}
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.25 }}>{step}</Typography>
                <Typography variant="caption" color="text.secondary">{STEP_COUNTS[i]} ok</Typography>
                {STEP_ERRORS[i] > 0 && (
                  <Typography variant="caption" color="error">{STEP_ERRORS[i]} err</Typography>
                )}
              </Box>
              {i < PIPELINE_STEPS.length - 1 && (
                <Box sx={{ width: 32, height: 2, bgcolor: "divider", flexShrink: 0 }} />
              )}
            </React.Fragment>
          ))}
        </Box>
      </Paper>

      {/* Run Table */}
      <DataTable
        columns={columns}
        rows={MOCK_RUNS}
        total={MOCK_RUNS.length}
        page={0}
        rowsPerPage={25}
        emptyMessage="No ingestion runs yet."
        rowKey={(r) => r.runId}
      />
    </PageShell>
  );
}
