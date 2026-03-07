import React, { useState } from "react";
import {
  Box, Typography, Button, Paper, TextField, MenuItem, Switch, Dialog,
  DialogTitle, DialogContent, DialogActions, Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import AddIcon from "@mui/icons-material/AddRounded";
import CalculateIcon from "@mui/icons-material/CalculateRounded";
import { PageShell, DataTable, type Column, KpiCard } from "../components";

interface Threshold { metric: string; operator: string; value: number; window: number; enabled: boolean; updatedAt: string; }

const MOCK_THRESHOLDS: Threshold[] = [
  { metric: "api_p99_latency", operator: "gt", value: 500, window: 5, enabled: true, updatedAt: "2025-01-14" },
  { metric: "worker_error_rate", operator: "gt", value: 5, window: 10, enabled: true, updatedAt: "2025-01-13" },
  { metric: "embed_throughput", operator: "lt", value: 100, window: 15, enabled: false, updatedAt: "2025-01-12" },
];

const thresholdCols: Column<Threshold>[] = [
  { id: "metric", label: "Metric", render: (r) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.metric}</Typography> },
  { id: "op", label: "Operator", width: 80, render: (r) => <Typography variant="body2" sx={{ fontFamily: "'Roboto Mono', monospace" }}>{r.operator}</Typography> },
  { id: "value", label: "Value", width: 80, align: "right", render: (r) => <Typography variant="body2">{r.value}</Typography> },
  { id: "window", label: "Window (min)", width: 110, align: "right", render: (r) => <Typography variant="body2">{r.window}</Typography> },
  { id: "enabled", label: "Enabled", width: 80, render: (r) => <Switch checked={r.enabled} size="small" /> },
  { id: "updated", label: "Updated", width: 100, render: (r) => <Typography variant="body2">{r.updatedAt}</Typography> },
];

export default function Anomaly() {
  const [addOpen, setAddOpen] = useState(false);
  const [baselineResult, setBaselineResult] = useState<boolean>(false);

  return (
    <PageShell
      title="Anomaly Detection"
      subtitle="Configure metric thresholds that trigger alerts when breached"
      action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>Add Threshold</Button>}
    >
      <DataTable
        columns={thresholdCols}
        rows={MOCK_THRESHOLDS}
        total={MOCK_THRESHOLDS.length}
        page={0}
        rowsPerPage={25}
        rowKey={(r) => r.metric}
      />

      {/* Baseline Section */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle2">Baseline Calculation</Typography>
          <Button variant="outlined" startIcon={<CalculateIcon />} onClick={() => setBaselineResult(true)}>Calculate Baseline</Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Calculate statistical baselines for your metrics to set informed thresholds.
        </Typography>
        {baselineResult && (
          <Grid container spacing={2}>
            {[
              { metric: "api_p99_latency", mean: 247, stdDev: 42, samples: 8640 },
              { metric: "worker_error_rate", mean: 1.2, stdDev: 0.8, samples: 8640 },
              { metric: "embed_throughput", mean: 342, stdDev: 56, samples: 8640 },
            ].map((b) => (
              <Grid key={b.metric} size={{ xs: 12, sm: 4 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>{b.metric}</Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Mean</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{b.mean}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Std Dev</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>±{b.stdDev}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Samples</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{b.samples.toLocaleString()}</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Threshold</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Metric" size="small" fullWidth />
            <TextField select label="Operator" size="small" fullWidth defaultValue="gt">
              {["gt", "lt", "gte", "lte"].map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </TextField>
            <TextField label="Value" type="number" size="small" fullWidth />
            <TextField label="Window (minutes)" type="number" size="small" fullWidth defaultValue={5} />
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
