import React, { useState } from "react";
import {
  Box, Typography, TextField, MenuItem, Button, Paper, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AddIcon from "@mui/icons-material/AddRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import { PageShell, DataTable, type Column } from "../components";

interface CustomMetric { name: string; metricType: string; aggregation: string; filter: string; createdAt: string; }

const MOCK_SERIES = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  value: +(Math.random() * 200 + 100).toFixed(1),
}));

const MOCK_METRICS: CustomMetric[] = [
  { name: "api_p99_latency", metricType: "latency", aggregation: "p99", filter: '{"service": "api"}', createdAt: "2025-01-10" },
  { name: "worker_throughput", metricType: "throughput", aggregation: "sum", filter: '{"service": "worker"}', createdAt: "2025-01-11" },
  { name: "embed_error_rate", metricType: "error_rate", aggregation: "avg", filter: '{"step": "embed"}', createdAt: "2025-01-12" },
];

const metricCols: Column<CustomMetric>[] = [
  { id: "name", label: "Name", render: (r) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.name}</Typography> },
  { id: "type", label: "Metric Type", width: 120, render: (r) => <Chip label={r.metricType} size="small" variant="outlined" /> },
  { id: "agg", label: "Aggregation", width: 100, render: (r) => <Typography variant="body2">{r.aggregation}</Typography> },
  { id: "filter", label: "Filter", render: (r) => <Typography variant="body2" sx={{ fontFamily: "'Roboto Mono', monospace", fontSize: "0.75rem" }}>{r.filter}</Typography> },
  { id: "created", label: "Created", width: 100, render: (r) => <Typography variant="body2">{r.createdAt}</Typography> },
  { id: "actions", label: "", width: 48, align: "right", render: () => <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton> },
];

export default function Metrics() {
  const [metricType, setMetricType] = useState("latency");
  const [percentile, setPercentile] = useState("p99");
  const [createOpen, setCreateOpen] = useState(false);

  const stats = { min: 102.3, max: 298.7, avg: 187.4, current: 241.2 };

  return (
    <PageShell title="Custom Trace Metrics" subtitle="Define and visualize custom observability metrics backed by Cloud Trace">
      <Grid container spacing={3}>
        {/* Metric Explorer */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>Metric Explorer</Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <TextField type="datetime-local" label="Start" size="small" InputLabelProps={{ shrink: true }} />
              <TextField type="datetime-local" label="End" size="small" InputLabelProps={{ shrink: true }} />
              <TextField select label="Type" size="small" value={metricType} onChange={(e) => setMetricType(e.target.value)} sx={{ width: 140 }}>
                <MenuItem value="latency">Latency</MenuItem>
                <MenuItem value="throughput">Throughput</MenuItem>
                <MenuItem value="error_rate">Error Rate</MenuItem>
              </TextField>
              <TextField select label="Percentile" size="small" value={percentile} onChange={(e) => setPercentile(e.target.value)} sx={{ width: 100 }}>
                {["p50", "p90", "p95", "p99"].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
              <Button variant="contained" size="small">Query</Button>
            </Box>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={MOCK_SERIES}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#80868B" />
                <YAxis tick={{ fontSize: 11 }} stroke="#80868B" />
                <Tooltip contentStyle={{ background: "#161822", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="value" stroke="#1A73E8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <Box sx={{ display: "flex", gap: 4, mt: 2 }}>
              {Object.entries(stats).map(([k, v]) => (
                <Box key={k}>
                  <Typography variant="caption" color="text.secondary">{k.toUpperCase()}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{v}ms</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Custom Metrics */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle2">Custom Metrics</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>Create</Button>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {MOCK_METRICS.map((m) => (
                <Paper key={m.name} variant="outlined" sx={{ p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{m.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{m.metricType} · {m.aggregation}</Typography>
                  </Box>
                  <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>
                </Paper>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create Custom Metric</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Name" size="small" fullWidth />
            <TextField select label="Metric Type" size="small" fullWidth defaultValue="latency">
              <MenuItem value="latency">Latency</MenuItem>
              <MenuItem value="throughput">Throughput</MenuItem>
              <MenuItem value="error_rate">Error Rate</MenuItem>
            </TextField>
            <TextField select label="Aggregation" size="small" fullWidth defaultValue="avg">
              {["avg", "sum", "count", "min", "max", "p50", "p90", "p95", "p99"].map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>
            <TextField label="Filter (JSON)" size="small" fullWidth multiline rows={2} />
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
