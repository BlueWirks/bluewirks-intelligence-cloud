import React, { useState } from "react";
import {
  Box, Typography, Switch, Button, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, IconButton, Tooltip, Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/AddRounded";
import EditIcon from "@mui/icons-material/EditRounded";
import SendIcon from "@mui/icons-material/SendRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopyRounded";
import { PageShell, DataTable, type Column } from "../components";

const EVENTS = [
  "ingestion.completed", "ingestion.failed", "generation.completed", "generation.failed",
  "dlq.message_added", "anomaly.threshold_breached", "load_test.completed", "failover.activated",
];

interface Webhook { id: string; name: string; url: string; events: string[]; enabled: boolean; createdAt: string; }

const MOCK_WEBHOOKS: Webhook[] = [
  { id: "wh-1", name: "Slack Notifications", url: "https://hooks.slack.com/services/T00/B00/xxx", events: ["ingestion.completed", "ingestion.failed", "dlq.message_added"], enabled: true, createdAt: "2025-01-10" },
  { id: "wh-2", name: "PagerDuty Alerts", url: "https://events.pagerduty.com/v2/enqueue", events: ["anomaly.threshold_breached", "failover.activated"], enabled: true, createdAt: "2025-01-11" },
  { id: "wh-3", name: "Analytics Pipeline", url: "https://analytics.example.com/ingest", events: ["generation.completed", "load_test.completed"], enabled: false, createdAt: "2025-01-12" },
];

const whCols: Column<Webhook>[] = [
  { id: "name", label: "Name", render: (r) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.name}</Typography> },
  { id: "url", label: "URL", render: (r) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Typography variant="body2" sx={{ fontFamily: "'Roboto Mono', monospace", fontSize: "0.75rem", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.url}</Typography>
      <Tooltip title="Copy"><IconButton size="small" onClick={() => navigator.clipboard.writeText(r.url)}><ContentCopyIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
    </Box>
  )},
  { id: "events", label: "Events", render: (r) => (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {r.events.map((e) => <Chip key={e} label={e} size="small" variant="outlined" />)}
    </Box>
  )},
  { id: "enabled", label: "Enabled", width: 80, render: (r) => <Switch checked={r.enabled} size="small" /> },
  { id: "created", label: "Created", width: 100, render: (r) => <Typography variant="body2">{r.createdAt}</Typography> },
  { id: "actions", label: "", width: 120, align: "right", render: () => (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      <Tooltip title="Edit"><IconButton size="small"><EditIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Test"><IconButton size="small" color="primary"><SendIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Delete"><IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton></Tooltip>
    </Box>
  )},
];

export default function Webhooks() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <PageShell
      title="Webhook Configurator"
      subtitle="Configure HTTP webhook endpoints to receive platform events"
      action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>Create Webhook</Button>}
    >
      <DataTable columns={whCols} rows={MOCK_WEBHOOKS} total={MOCK_WEBHOOKS.length} page={0} rowsPerPage={25} rowKey={(r) => r.id} />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Webhook</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Name" size="small" fullWidth />
            <TextField label="URL" size="small" fullWidth placeholder="https://…" />
            <Typography variant="overline" color="text.secondary">Events</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {EVENTS.map((e) => <Chip key={e} label={e} size="small" variant="outlined" clickable />)}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
