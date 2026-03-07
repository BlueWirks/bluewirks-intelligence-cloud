import React, { useState } from "react";
import {
  Box, Typography, Switch, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, IconButton, Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/AddRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import { PageShell, DataTable, type Column, ConfirmDialog } from "../components";

interface RetentionPolicy {
  collection: string; ttlDays: number; enabled: boolean;
  updatedAt: string; updatedBy: string;
}

const MOCK_POLICIES: RetentionPolicy[] = [
  { collection: "assets", ttlDays: 365, enabled: true, updatedAt: "2025-01-10", updatedBy: "admin@bluewirks.com" },
  { collection: "runs", ttlDays: 90, enabled: true, updatedAt: "2025-01-10", updatedBy: "admin@bluewirks.com" },
  { collection: "chat_threads", ttlDays: 180, enabled: true, updatedAt: "2025-01-12", updatedBy: "ops@bluewirks.com" },
  { collection: "dlq_messages", ttlDays: 30, enabled: true, updatedAt: "2025-01-08", updatedBy: "admin@bluewirks.com" },
  { collection: "cost_records", ttlDays: 730, enabled: false, updatedAt: "2025-01-05", updatedBy: "ops@bluewirks.com" },
];

const retCols: Column<RetentionPolicy>[] = [
  { id: "collection", label: "Collection", render: (r) => <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: "'Roboto Mono', monospace" }}>{r.collection}</Typography> },
  { id: "ttl", label: "TTL (days)", width: 100, align: "right", render: (r) => <Typography variant="body2">{r.ttlDays}</Typography> },
  { id: "enabled", label: "Enabled", width: 80, render: (r) => <Switch checked={r.enabled} size="small" /> },
  { id: "updated", label: "Updated", width: 100, render: (r) => <Typography variant="body2">{r.updatedAt}</Typography> },
  { id: "by", label: "Updated By", width: 180, render: (r) => <Typography variant="body2">{r.updatedBy}</Typography> },
  { id: "actions", label: "", width: 48, align: "right", render: () => <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton> },
];

export default function Retention() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <PageShell
      title="Data Retention Policies"
      subtitle="Configure TTL-based data lifecycle rules per collection"
      action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>Add Policy</Button>}
    >
      <DataTable columns={retCols} rows={MOCK_POLICIES} total={MOCK_POLICIES.length} page={0} rowsPerPage={25} rowKey={(r) => r.collection} />

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Retention Policy</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField select label="Collection" size="small" fullWidth defaultValue="">
              {["assets", "runs", "chat_threads", "dlq_messages", "cost_records", "workspaces", "prompts", "ai_apps", "workflows"].map(
                (c) => <MenuItem key={c} value={c}>{c}</MenuItem>
              )}
            </TextField>
            <TextField label="TTL (days)" type="number" size="small" fullWidth />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
