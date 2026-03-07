import React, { useState } from "react";
import {
  Box, Button, Chip, IconButton, Tooltip, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, LinearProgress,
  Drawer, Grid, Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/AddRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopyRounded";
import VisibilityIcon from "@mui/icons-material/VisibilityRounded";
import RefreshIcon from "@mui/icons-material/RefreshRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { PageShell, StatusChip, DataTable, type Column, ConfirmDialog, EmptyState } from "../components";

interface Asset {
  id: string;
  assetType: string;
  status: string;
  gcsUri: string;
  traceId: string;
  createdAt: string;
}

// Demo data
const MOCK_ASSETS: Asset[] = [
  { id: "ast-3f2e7a", assetType: "pro_tools_session", status: "INDEXED", gcsUri: "gs://bw-assets/pro_tools/session_3f2.json", traceId: "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f90", createdAt: "2025-01-15T10:32:00Z" },
  { id: "ast-8c1b04", assetType: "unity_scene", status: "PROCESSING", gcsUri: "gs://bw-assets/unity/scene_8c1.json", traceId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", createdAt: "2025-01-15T10:28:00Z" },
  { id: "ast-a04f22", assetType: "doc", status: "FAILED", gcsUri: "gs://bw-assets/docs/report_a04.pdf", traceId: "11223344-5566-7788-99aa-bbccddeeff00", createdAt: "2025-01-15T10:15:00Z" },
  { id: "ast-7e9d11", assetType: "pro_tools_session", status: "QUEUED", gcsUri: "gs://bw-assets/pro_tools/session_7e9.json", traceId: "ffeeddcc-bbaa-9988-7766-554433221100", createdAt: "2025-01-15T10:10:00Z" },
  { id: "ast-01bcdf", assetType: "unity_scene", status: "INDEXED", gcsUri: "gs://bw-assets/unity/scene_01b.json", traceId: "abababab-cdcd-efef-1212-343456567878", createdAt: "2025-01-15T09:55:00Z" },
];

const ASSET_TYPES = ["pro_tools_session", "unity_scene", "doc"];
const mono = { fontFamily: "'Roboto Mono', monospace", fontSize: "0.8125rem" };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const columns: Column<Asset>[] = [
  { id: "id", label: "Asset ID", width: 140, render: (r) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Typography sx={mono}>{r.id}</Typography>
      <Tooltip title="Copy"><IconButton size="small" onClick={() => navigator.clipboard.writeText(r.id)}><ContentCopyIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
    </Box>
  )},
  { id: "type", label: "Type", width: 160, render: (r) => <Chip label={r.assetType} size="small" variant="outlined" /> },
  { id: "status", label: "Status", width: 120, render: (r) => <StatusChip status={r.status} /> },
  { id: "gcs", label: "GCS URI", render: (r) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Typography sx={{ ...mono, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.gcsUri}</Typography>
      <Tooltip title="Copy"><IconButton size="small" onClick={() => navigator.clipboard.writeText(r.gcsUri)}><ContentCopyIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
    </Box>
  )},
  { id: "trace", label: "Trace ID", width: 140, render: (r) => <Typography sx={mono}>{r.traceId.slice(0, 8)}…</Typography> },
  { id: "created", label: "Created", width: 100, render: (r) => (
    <Tooltip title={r.createdAt}><Typography variant="body2">{timeAgo(r.createdAt)}</Typography></Tooltip>
  )},
  { id: "actions", label: "", width: 110, align: "right", render: (r) => (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      <Tooltip title="View detail"><IconButton size="small"><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Re-ingest"><IconButton size="small"><RefreshIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Delete"><IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton></Tooltip>
    </Box>
  )},
];

export default function Assets() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const assets = MOCK_ASSETS.filter((a) => filterStatus === "all" || a.status === filterStatus);

  return (
    <PageShell
      title="Assets"
      subtitle="Upload, commit, and track assets through the ingestion pipeline"
      action={
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setUploadOpen(true)}>
          Upload Asset
        </Button>
      }
    >
      {/* Filter bar */}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        {["all", "UPLOADED", "QUEUED", "PROCESSING", "INDEXED", "FAILED"].map((s) => (
          <Chip
            key={s}
            label={s === "all" ? "All" : s}
            size="small"
            variant={filterStatus === s ? "filled" : "outlined"}
            onClick={() => setFilterStatus(s)}
            sx={filterStatus === s ? {} : { opacity: 0.7 }}
          />
        ))}
      </Box>

      <DataTable
        columns={columns}
        rows={assets}
        total={assets.length}
        page={0}
        rowsPerPage={25}
        emptyMessage="No assets found. Upload your first asset to get started."
        rowKey={(r) => r.id}
      />

      {/* Upload Modal */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Asset</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField select label="Asset Type" defaultValue="" fullWidth size="small">
              {ASSET_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <Button variant="outlined" component="label">
              Select File
              <input type="file" hidden />
            </Button>
            <Typography variant="caption" color="text.secondary">
              Supported: JSON (Pro Tools sessions, Unity scenes), PDF, DOCX
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUploadOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained">Upload & Commit</Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
