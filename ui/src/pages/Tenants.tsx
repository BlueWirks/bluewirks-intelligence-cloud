import React, { useState } from "react";
import {
  Box, Grid, Typography, Chip, Button, Paper, Drawer, TextField, MenuItem,
  IconButton, Tooltip, Divider, CircularProgress, List, ListItem, ListItemText,
  ListItemIcon, alpha,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/SettingsRounded";
import HistoryIcon from "@mui/icons-material/HistoryRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorIcon from "@mui/icons-material/ErrorRounded";
import VerifiedIcon from "@mui/icons-material/VerifiedRounded";
import { PageShell, StatusChip, DataTable, type Column } from "../components";

interface Tenant {
  id: string; isolationLevel: string; dataPrefix: string;
  regions: string[]; quotas: { rps: number; storage: string }; status: string;
}

const MOCK_TENANTS: Tenant[] = [
  { id: "org-acme", isolationLevel: "full", dataPrefix: "acme_", regions: ["us-central1", "us-east1"], quotas: { rps: 500, storage: "100 GB" }, status: "active" },
  { id: "org-beta", isolationLevel: "shared", dataPrefix: "beta_", regions: ["us-central1"], quotas: { rps: 200, storage: "50 GB" }, status: "active" },
  { id: "org-gamma", isolationLevel: "full", dataPrefix: "gamma_", regions: ["europe-west1"], quotas: { rps: 300, storage: "75 GB" }, status: "provisioning" },
  { id: "org-demo", isolationLevel: "shared", dataPrefix: "demo_", regions: ["us-central1"], quotas: { rps: 50, storage: "10 GB" }, status: "suspended" },
];

const ISOLATION_COLORS: Record<string, string> = { full: "#34A853", shared: "#FBBC04" };

const tenantCols: Column<Tenant>[] = [
  { id: "id", label: "Tenant ID", render: (r) => <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: "'Roboto Mono', monospace" }}>{r.id}</Typography> },
  { id: "isolation", label: "Isolation", width: 100, render: (r) => (
    <Chip label={r.isolationLevel} size="small" sx={{ bgcolor: alpha(ISOLATION_COLORS[r.isolationLevel] || "#8AB4F8", 0.15), color: ISOLATION_COLORS[r.isolationLevel] || "#8AB4F8" }} />
  )},
  { id: "prefix", label: "Data Prefix", width: 100, render: (r) => <Typography variant="body2" sx={{ fontFamily: "'Roboto Mono', monospace", fontSize: "0.8125rem" }}>{r.dataPrefix}</Typography> },
  { id: "regions", label: "Regions", render: (r) => (
    <Box sx={{ display: "flex", gap: 0.5 }}>{r.regions.map((reg) => <Chip key={reg} label={reg} size="small" variant="outlined" />)}</Box>
  )},
  { id: "quotas", label: "Quotas", width: 140, render: (r) => <Typography variant="body2">{r.quotas.rps} RPS · {r.quotas.storage}</Typography> },
  { id: "status", label: "Status", width: 110, render: (r) => <StatusChip status={r.status} /> },
  { id: "actions", label: "", width: 120, align: "right", render: (r) => (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      <Tooltip title="Configure"><IconButton size="small"><SettingsIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Audit Log"><IconButton size="small"><HistoryIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Verify Isolation"><IconButton size="small" color="primary"><VerifiedIcon fontSize="small" /></IconButton></Tooltip>
    </Box>
  )},
];

const ISOLATION_CHECKS = [
  { key: "data_prefix", label: "Data prefix uniqueness", pass: true },
  { key: "firestore_rules", label: "Firestore security rules", pass: true },
  { key: "storage_isolation", label: "GCS bucket isolation", pass: true },
  { key: "region_compliance", label: "Region compliance", pass: true },
  { key: "rate_limit", label: "Rate limit enforcement", pass: false },
];

export default function Tenants() {
  const [verifyOpen, setVerifyOpen] = useState(false);

  return (
    <PageShell
      title="Multi-Tenant Management"
      subtitle="Configure tenant isolation, quotas, and verify compliance"
      action={<Button variant="outlined" startIcon={<VerifiedIcon />} onClick={() => setVerifyOpen(true)}>Verify All Tenants</Button>}
    >
      <DataTable columns={tenantCols} rows={MOCK_TENANTS} total={MOCK_TENANTS.length} page={0} rowsPerPage={25} rowKey={(r) => r.id} />

      {/* Verification Drawer */}
      <Drawer anchor="right" open={verifyOpen} onClose={() => setVerifyOpen(false)} PaperProps={{ sx: { width: 380, p: 3 } }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Isolation Verification</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Running 5 isolation checks across all tenants</Typography>
        <List>
          {ISOLATION_CHECKS.map((check) => (
            <ListItem key={check.key} sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {check.pass
                  ? <CheckCircleIcon sx={{ color: "#34A853" }} />
                  : <ErrorIcon sx={{ color: "#EA4335" }} />
                }
              </ListItemIcon>
              <ListItemText
                primary={check.label}
                secondary={check.pass ? "All tenants pass" : "1 tenant failing — org-demo"}
                slotProps={{ primary: { variant: "body2" }, secondary: { variant: "caption" } }}
              />
            </ListItem>
          ))}
        </List>
        <Divider sx={{ my: 2 }} />
        <Paper sx={{ p: 2, bgcolor: (t) => alpha(t.palette.success.main, 0.08), borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>4 of 5 checks pass</Typography>
          <Typography variant="caption" color="text.secondary">1 action required: Rate limit for org-demo needs enforcement</Typography>
        </Paper>
      </Drawer>
    </PageShell>
  );
}
