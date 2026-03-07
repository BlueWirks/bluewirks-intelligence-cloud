import React, { useState } from "react";
import {
  Box, Typography, Switch, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, IconButton, Tooltip, Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/AddRounded";
import PlayArrowIcon from "@mui/icons-material/PlayArrowRounded";
import EditIcon from "@mui/icons-material/EditRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import { PageShell, StatusChip, DataTable, type Column, ConfirmDialog } from "../components";

interface ExportConfig {
  id: string; source: string; dataset: string; table: string;
  schedule: string; enabled: boolean; lastRun?: string; lastStatus?: string;
}

const MOCK_EXPORTS: ExportConfig[] = [
  { id: "exp-1", source: "assets", dataset: "analytics", table: "assets_raw", schedule: "0 */6 * * *", enabled: true, lastRun: "2025-01-15T06:00Z", lastStatus: "success" },
  { id: "exp-2", source: "runs", dataset: "analytics", table: "ingestion_runs", schedule: "0 0 * * *", enabled: true, lastRun: "2025-01-15T00:00Z", lastStatus: "success" },
  { id: "exp-3", source: "cost_records", dataset: "billing", table: "cost_daily", schedule: "0 1 * * *", enabled: false, lastRun: "2025-01-14T01:00Z", lastStatus: "failed" },
];

const expCols: Column<ExportConfig>[] = [
  { id: "source", label: "Source Collection", render: (r) => <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: "'Roboto Mono', monospace" }}>{r.source}</Typography> },
  { id: "dataset", label: "BQ Dataset", width: 130, render: (r) => <Typography variant="body2">{r.dataset}</Typography> },
  { id: "table", label: "BQ Table", width: 150, render: (r) => <Typography variant="body2" sx={{ fontFamily: "'Roboto Mono', monospace", fontSize: "0.8125rem" }}>{r.table}</Typography> },
  { id: "schedule", label: "Schedule", width: 140, render: (r) => (
    <Tooltip title={r.schedule}><Chip label={r.schedule} size="small" variant="outlined" /></Tooltip>
  )},
  { id: "enabled", label: "Enabled", width: 80, render: (r) => <Switch checked={r.enabled} size="small" /> },
  { id: "lastRun", label: "Last Run", width: 130, render: (r) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {r.lastStatus && <StatusChip status={r.lastStatus} />}
      <Typography variant="caption">{r.lastRun ? new Date(r.lastRun).toLocaleDateString() : "—"}</Typography>
    </Box>
  )},
  { id: "actions", label: "", width: 120, align: "right", render: () => (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      <Tooltip title="Edit"><IconButton size="small"><EditIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Trigger Now"><IconButton size="small" color="primary"><PlayArrowIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Delete"><IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton></Tooltip>
    </Box>
  )},
];

export default function Export() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <PageShell
      title="BigQuery Export"
      subtitle="Configure and trigger Firestore → BigQuery data exports"
      action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>Add Export</Button>}
    >
      <DataTable columns={expCols} rows={MOCK_EXPORTS} total={MOCK_EXPORTS.length} page={0} rowsPerPage={25} rowKey={(r) => r.id} />

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Export Config</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Source Collection" size="small" fullWidth />
            <TextField label="BigQuery Dataset" size="small" fullWidth />
            <TextField label="BigQuery Table" size="small" fullWidth />
            <TextField label="Schedule (cron)" size="small" fullWidth placeholder="0 0 * * *" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
