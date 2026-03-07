import React, { useState } from "react";
import {
  Box, Typography, Chip, Button, Paper, Checkbox, Tooltip, IconButton, alpha,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import ReplayIcon from "@mui/icons-material/ReplayRounded";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweepRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopyRounded";
import { PageShell, StatusChip, DataTable, type Column, ConfirmDialog, KpiCard } from "../components";

interface DlqMessage {
  id: string; assetId: string; failureCode: string; message: string;
  attempts: number; traceId: string; createdAt: string;
}

const FAILURE_CODES = ["PARSE_ERROR", "EMBED_TIMEOUT", "VECTOR_UPSERT_FAIL", "QUOTA_EXCEEDED"];

const MOCK_MESSAGES: DlqMessage[] = [
  { id: "dlq-001", assetId: "ast-3f8a", failureCode: "PARSE_ERROR", message: "Unsupported file format: .ai", attempts: 3, traceId: "tr-9a1c2b", createdAt: "2025-01-15T08:12Z" },
  { id: "dlq-002", assetId: "ast-7b2c", failureCode: "EMBED_TIMEOUT", message: "Vertex AI embedding call timed out after 30s", attempts: 5, traceId: "tr-4d5e6f", createdAt: "2025-01-15T07:45Z" },
  { id: "dlq-003", assetId: "ast-1e4d", failureCode: "VECTOR_UPSERT_FAIL", message: "Vector Search index unavailable", attempts: 2, traceId: "tr-7g8h9i", createdAt: "2025-01-15T06:30Z" },
  { id: "dlq-004", assetId: "ast-9f1a", failureCode: "PARSE_ERROR", message: "PDF extraction returned empty content", attempts: 4, traceId: "tr-0j1k2l", createdAt: "2025-01-14T22:15Z" },
  { id: "dlq-005", assetId: "ast-2c3d", failureCode: "QUOTA_EXCEEDED", message: "Embedding API daily quota exceeded", attempts: 1, traceId: "tr-3m4n5o", createdAt: "2025-01-14T20:00Z" },
];

export default function DLQ() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<"replay" | "purge" | null>(null);

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => setSelected((prev) => prev.size === MOCK_MESSAGES.length ? new Set() : new Set(MOCK_MESSAGES.map((m) => m.id)));

  const dlqCols: Column<DlqMessage>[] = [
    { id: "select", label: "", width: 40, render: (r) => <Checkbox size="small" checked={selected.has(r.id)} onChange={() => toggle(r.id)} /> },
    { id: "id", label: "Message ID", width: 100, render: (r) => <Typography variant="body2" sx={{ fontFamily: "'Roboto Mono', monospace", fontSize: "0.75rem" }}>{r.id}</Typography> },
    { id: "asset", label: "Asset ID", width: 100, render: (r) => <Typography variant="body2" sx={{ fontFamily: "'Roboto Mono', monospace", fontSize: "0.75rem" }}>{r.assetId}</Typography> },
    { id: "code", label: "Failure Code", width: 160, render: (r) => <StatusChip status={r.failureCode} /> },
    { id: "msg", label: "Message", render: (r) => (
      <Tooltip title={r.message}><Typography variant="body2" sx={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.message}</Typography></Tooltip>
    )},
    { id: "attempts", label: "Attempts", width: 80, align: "center", render: (r) => <Typography variant="body2">{r.attempts}</Typography> },
    { id: "trace", label: "Trace ID", width: 110, render: (r) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography variant="body2" sx={{ fontFamily: "'Roboto Mono', monospace", fontSize: "0.75rem" }}>{r.traceId}</Typography>
        <IconButton size="small" onClick={() => navigator.clipboard.writeText(r.traceId)}><ContentCopyIcon sx={{ fontSize: 14 }} /></IconButton>
      </Box>
    )},
    { id: "created", label: "Created", width: 110, render: (r) => <Typography variant="body2">{new Date(r.createdAt).toLocaleString()}</Typography> },
  ];

  const codeCounts = FAILURE_CODES.map((code) => ({ code, count: MOCK_MESSAGES.filter((m) => m.failureCode === code).length })).filter((c) => c.count > 0);

  return (
    <PageShell title="Dead Letter Queue" subtitle="Inspect, replay, or purge failed ingestion messages">
      {/* Stats Bar */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard title="Total Messages" value={String(MOCK_MESSAGES.length)} color="#EA4335" />
        </Grid>
        <Grid size={{ xs: 6, md: 9 }}>
          <Paper sx={{ p: 2, display: "flex", gap: 1.5, alignItems: "center", height: "100%" }}>
            <Typography variant="body2" sx={{ mr: 1 }}>Failure Codes:</Typography>
            {codeCounts.map((c) => (
              <Chip key={c.code} label={`${c.code} (${c.count})`} size="small" variant="outlined" />
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* Batch Actions */}
      {selected.size > 0 && (
        <Paper sx={{ p: 1.5, mb: 2, display: "flex", gap: 2, alignItems: "center", bgcolor: (t) => alpha(t.palette.primary.main, 0.08) }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{selected.size} selected</Typography>
          <Button size="small" variant="contained" startIcon={<ReplayIcon />} onClick={() => setConfirmAction("replay")}>Replay</Button>
          <Button size="small" variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={() => setConfirmAction("purge")}>Purge</Button>
        </Paper>
      )}

      <DataTable columns={dlqCols} rows={MOCK_MESSAGES} total={MOCK_MESSAGES.length} page={0} rowsPerPage={25} rowKey={(r) => r.id} />

      <ConfirmDialog
        open={confirmAction === "replay"}
        title="Replay Messages"
        description={`Replay ${selected.size} selected message(s) back to the ingestion pipeline?`}
        confirmText="Replay"
        onConfirm={() => { setConfirmAction(null); setSelected(new Set()); }}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === "purge"}
        title="Purge Messages"
        description={`Permanently delete ${selected.size} selected message(s)? This cannot be undone.`}
        confirmText="Purge"
        confirmValue="PURGE"
        onConfirm={() => { setConfirmAction(null); setSelected(new Set()); }}
        onCancel={() => setConfirmAction(null)}
      />
    </PageShell>
  );
}
