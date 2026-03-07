import React, { useState } from "react";
import {
  Box, Typography, Chip, Button, Paper, Stepper, Step, StepLabel,
  TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, Divider, alpha,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import AddIcon from "@mui/icons-material/AddRounded";
import PlayArrowIcon from "@mui/icons-material/PlayArrowRounded";
import PauseIcon from "@mui/icons-material/PauseRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardRounded";
import { PageShell, StatusChip, DataTable, type Column } from "../components";

interface Workflow {
  id: string;
  name: string;
  status: string;
  trigger: string;
  steps: number;
  updatedAt: string;
}

interface WorkflowStep {
  type: string;
  label: string;
  config: string;
}

const MOCK_WORKFLOWS: Workflow[] = [
  { id: "wf-1", name: "Auto-Ingest & Summarize", status: "active", trigger: "event", steps: 4, updatedAt: "2025-01-15" },
  { id: "wf-2", name: "Nightly Export Pipeline", status: "active", trigger: "schedule", steps: 3, updatedAt: "2025-01-14" },
  { id: "wf-3", name: "Support Ticket Handler", status: "draft", trigger: "webhook", steps: 5, updatedAt: "2025-01-13" },
  { id: "wf-4", name: "Anomaly Response Flow", status: "paused", trigger: "event", steps: 3, updatedAt: "2025-01-12" },
];

const MOCK_STEPS: WorkflowStep[] = [
  { type: "retrieve", label: "Fetch Documents", config: '{"workspace": "ws-1", "maxResults": 10}' },
  { type: "generate", label: "Summarize Content", config: '{"promptId": "tpl-1", "temperature": 0.3}' },
  { type: "transform", label: "Extract Metadata", config: '{"fields": ["title", "author", "date"]}' },
  { type: "notify", label: "Send Webhook", config: '{"url": "https://hooks.example.com/ingest", "events": ["completed"]}' },
];

const STEP_COLORS: Record<string, string> = {
  retrieve: "#1A73E8", generate: "#34A853", transform: "#FBBC04", notify: "#EA4335", condition: "#9AA0A6",
};

const TRIGGER_CHIPS: Record<string, { label: string; color: string }> = {
  event: { label: "Event", color: "#1A73E8" },
  schedule: { label: "Schedule", color: "#34A853" },
  webhook: { label: "Webhook", color: "#FBBC04" },
  manual: { label: "Manual", color: "#9AA0A6" },
};

const wfCols: Column<Workflow>[] = [
  { id: "name", label: "Name", render: (r) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.name}</Typography> },
  { id: "status", label: "Status", width: 100, render: (r) => <StatusChip status={r.status} /> },
  { id: "trigger", label: "Trigger", width: 110, render: (r) => {
    const t = TRIGGER_CHIPS[r.trigger];
    return <Chip label={t.label} size="small" sx={{ bgcolor: alpha(t.color, 0.12), color: t.color, fontWeight: 600 }} />;
  }},
  { id: "steps", label: "Steps", width: 70, align: "center", render: (r) => <Typography variant="body2">{r.steps}</Typography> },
  { id: "updated", label: "Updated", width: 110, render: (r) => <Typography variant="body2">{r.updatedAt}</Typography> },
];

export default function Workflows() {
  const [selected, setSelected] = useState<Workflow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  if (selected) {
    return (
      <PageShell
        title={selected.name}
        subtitle={`Trigger: ${selected.trigger} · ${selected.steps} steps`}
        action={
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" onClick={() => setSelected(null)}>Back</Button>
            {selected.status === "active" ? (
              <Button variant="outlined" color="warning" startIcon={<PauseIcon />}>Pause</Button>
            ) : (
              <Button variant="contained" startIcon={<PlayArrowIcon />}>Activate</Button>
            )}
          </Box>
        }
      >
        <Grid container spacing={3}>
          {/* Visual Step Builder */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>Workflow Steps</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {MOCK_STEPS.map((step, i) => (
                  <React.Fragment key={i}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        borderLeft: 3,
                        borderLeftColor: STEP_COLORS[step.type],
                      }}
                    >
                      <Chip
                        label={step.type}
                        size="small"
                        sx={{
                          bgcolor: alpha(STEP_COLORS[step.type], 0.12),
                          color: STEP_COLORS[step.type],
                          fontWeight: 600,
                          textTransform: "uppercase",
                          fontSize: "0.625rem",
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{step.label}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "'Roboto Mono', monospace" }}>
                          {step.config}
                        </Typography>
                      </Box>
                      <Tooltip title="Remove">
                        <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </Paper>
                    {i < MOCK_STEPS.length - 1 && (
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <ArrowForwardIcon sx={{ transform: "rotate(90deg)", color: "text.disabled", fontSize: 18 }} />
                      </Box>
                    )}
                  </React.Fragment>
                ))}
              </Box>
              <Button startIcon={<AddIcon />} sx={{ mt: 2 }} size="small">Add Step</Button>
            </Paper>
          </Grid>

          {/* Trigger Config */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>Trigger Configuration</Typography>
              <TextField select label="Trigger Type" size="small" fullWidth defaultValue={selected.trigger} sx={{ mb: 2 }}>
                <MenuItem value="event">Event</MenuItem>
                <MenuItem value="schedule">Schedule</MenuItem>
                <MenuItem value="webhook">Webhook</MenuItem>
                <MenuItem value="manual">Manual</MenuItem>
              </TextField>
              {selected.trigger === "schedule" && (
                <TextField label="Cron Expression" size="small" fullWidth defaultValue="0 0 * * *" helperText="Every day at midnight" sx={{ mb: 2 }} />
              )}
              {selected.trigger === "event" && (
                <TextField label="Event Type" size="small" fullWidth defaultValue="ingestion.completed" sx={{ mb: 2 }} />
              )}
              {selected.trigger === "manual" && (
                <Button variant="contained" startIcon={<PlayArrowIcon />} fullWidth>Run Now</Button>
              )}
            </Paper>
          </Grid>
        </Grid>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Workflow Automation"
      subtitle="Define multi-step AI workflows with trigger-based execution"
      action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>New Workflow</Button>}
    >
      <DataTable
        columns={wfCols}
        rows={MOCK_WORKFLOWS}
        total={MOCK_WORKFLOWS.length}
        page={0}
        rowsPerPage={25}
        rowKey={(r) => r.id}
      />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Workflow</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Name" fullWidth size="small" />
            <TextField label="Description" fullWidth size="small" multiline rows={2} />
            <TextField select label="Trigger Type" size="small" fullWidth defaultValue="manual">
              <MenuItem value="event">Event</MenuItem>
              <MenuItem value="schedule">Schedule</MenuItem>
              <MenuItem value="webhook">Webhook</MenuItem>
              <MenuItem value="manual">Manual</MenuItem>
            </TextField>
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
