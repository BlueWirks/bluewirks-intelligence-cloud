import React, { useState } from "react";
import {
  Box, Typography, Chip, Button, Paper, alpha, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import PublicIcon from "@mui/icons-material/PublicRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircleRounded";
import WarningIcon from "@mui/icons-material/WarningAmberRounded";
import { PageShell, StatusChip, DataTable, type Column, ConfirmDialog } from "../components";

interface Region { name: string; available: boolean; latency: number; }

const STATE = {
  currentRegion: "us-central1",
  primaryRegion: "us-central1",
  status: "primary" as const,
  lastFailover: "2025-01-10T04:22:00Z",
  lastRestored: "2025-01-10T04:47:00Z",
};

const MOCK_REGIONS: Region[] = [
  { name: "us-central1", available: true, latency: 12 },
  { name: "us-east1", available: true, latency: 34 },
  { name: "europe-west1", available: true, latency: 89 },
  { name: "asia-northeast1", available: false, latency: 142 },
];

const regionCols: Column<Region>[] = [
  { id: "name", label: "Region", render: (r) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.name}</Typography> },
  { id: "available", label: "Available", width: 100, render: (r) => (
    <Chip label={r.available ? "Yes" : "No"} size="small" color={r.available ? "success" : "error"} variant="outlined" />
  )},
  { id: "latency", label: "Latency (ms)", width: 120, align: "right", render: (r) => <Typography variant="body2">{r.latency}ms</Typography> },
];

const STATUS_COLORS: Record<string, string> = { primary: "#34A853", failover: "#FBBC04", restoring: "#8AB4F8" };

export default function Failover() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const c = STATUS_COLORS[STATE.status];

  return (
    <PageShell title="Cross-Region Failover" subtitle="Multi-region status and manual failover operations">
      {/* Region Map / Status Hero */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3, display: "flex", alignItems: "center", gap: 3 }}>
            <Box
              sx={{
                width: 80, height: 80, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                bgcolor: alpha(c, 0.12), border: 2, borderColor: c,
              }}
            >
              <PublicIcon sx={{ fontSize: 40, color: c }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{STATE.currentRegion}</Typography>
                <StatusChip status={STATE.status} />
              </Box>
              <Box sx={{ display: "flex", gap: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Primary Region</Typography>
                  <Typography variant="body2">{STATE.primaryRegion}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Last Failover</Typography>
                  <Typography variant="body2">{new Date(STATE.lastFailover).toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Last Restored</Typography>
                  <Typography variant="body2">{new Date(STATE.lastRestored).toLocaleString()}</Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2, height: "100%", justifyContent: "center" }}>
            <Button variant="contained" color="error" size="large" onClick={() => setConfirmOpen(true)}>
              Activate Failover
            </Button>
            <Button variant="outlined" size="large">
              Restore Primary
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Regions Table */}
      <DataTable columns={regionCols} rows={MOCK_REGIONS} total={MOCK_REGIONS.length} page={0} rowsPerPage={25} rowKey={(r) => r.name} />

      <ConfirmDialog
        open={confirmOpen}
        title="Activate Failover"
        description="This will route all traffic to the failover region. This is a disruptive operation."
        confirmText="Activate Failover"
        confirmValue="us-east1"
        onConfirm={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
      />
    </PageShell>
  );
}
