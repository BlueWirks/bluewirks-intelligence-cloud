import React, { useState } from "react";
import {
  Box, Typography, Slider, Button, Paper, LinearProgress,
  ToggleButton, ToggleButtonGroup, Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import PlayArrowIcon from "@mui/icons-material/PlayArrowRounded";
import StopIcon from "@mui/icons-material/StopRounded";
import { PageShell, DataTable, type Column, KpiCard, StatusChip } from "../components";

interface TestResult {
  id: string; target: string; concurrency: number; duration: number; rps: number;
  status: string; avgLatency: number; p99Latency: number; errorRate: number;
  startedAt: string;
}

const MOCK_RESULTS: TestResult[] = [
  { id: "lt-001", target: "API", concurrency: 50, duration: 60, rps: 200, status: "completed", avgLatency: 142, p99Latency: 485, errorRate: 0.3, startedAt: "2025-01-15T10:00Z" },
  { id: "lt-002", target: "Worker", concurrency: 20, duration: 120, rps: 50, status: "completed", avgLatency: 890, p99Latency: 2400, errorRate: 1.2, startedAt: "2025-01-14T14:00Z" },
  { id: "lt-003", target: "API", concurrency: 100, duration: 30, rps: 500, status: "failed", avgLatency: 340, p99Latency: 1200, errorRate: 12.5, startedAt: "2025-01-13T09:00Z" },
];

const resCols: Column<TestResult>[] = [
  { id: "id", label: "Test ID", width: 80, render: (r) => <Typography variant="body2" sx={{ fontFamily: "'Roboto Mono', monospace", fontSize: "0.75rem" }}>{r.id}</Typography> },
  { id: "target", label: "Target", width: 80, render: (r) => <Typography variant="body2">{r.target}</Typography> },
  { id: "conc", label: "Concurrency", width: 100, align: "right", render: (r) => <Typography variant="body2">{r.concurrency}</Typography> },
  { id: "dur", label: "Duration (s)", width: 100, align: "right", render: (r) => <Typography variant="body2">{r.duration}</Typography> },
  { id: "rps", label: "RPS", width: 80, align: "right", render: (r) => <Typography variant="body2">{r.rps}</Typography> },
  { id: "status", label: "Status", width: 100, render: (r) => <StatusChip status={r.status} /> },
  { id: "avg", label: "Avg Latency", width: 100, align: "right", render: (r) => <Typography variant="body2">{r.avgLatency}ms</Typography> },
  { id: "p99", label: "p99", width: 80, align: "right", render: (r) => <Typography variant="body2">{r.p99Latency}ms</Typography> },
  { id: "err", label: "Error %", width: 80, align: "right", render: (r) => (
    <Typography variant="body2" color={r.errorRate > 5 ? "error" : "text.primary"}>{r.errorRate}%</Typography>
  )},
  { id: "started", label: "Started", width: 130, render: (r) => <Typography variant="body2">{new Date(r.startedAt).toLocaleString()}</Typography> },
];

export default function LoadTest() {
  const [target, setTarget] = useState<"API" | "Worker">("API");
  const [concurrency, setConcurrency] = useState(50);
  const [duration, setDuration] = useState(60);
  const [rps, setRps] = useState(200);
  const [running, setRunning] = useState(false);

  return (
    <PageShell title="Load Testing" subtitle="Run load tests against API or Worker endpoints">
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Trigger Panel */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>Configure Test</Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>Target</Typography>
              <ToggleButtonGroup value={target} exclusive onChange={(_, v) => v && setTarget(v)} size="small" fullWidth>
                <ToggleButton value="API">API</ToggleButton>
                <ToggleButton value="Worker">Worker</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">Concurrency: {concurrency}</Typography>
              <Slider value={concurrency} onChange={(_, v) => setConcurrency(v as number)} min={1} max={500} />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">Duration: {duration}s</Typography>
              <Slider value={duration} onChange={(_, v) => setDuration(v as number)} min={10} max={600} step={10} />
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary">Target RPS: {rps}</Typography>
              <Slider value={rps} onChange={(_, v) => setRps(v as number)} min={10} max={2000} step={10} />
            </Box>
            {!running ? (
              <Button variant="contained" size="large" fullWidth startIcon={<PlayArrowIcon />} onClick={() => setRunning(true)}>
                Start Load Test
              </Button>
            ) : (
              <Button variant="outlined" color="error" size="large" fullWidth startIcon={<StopIcon />} onClick={() => setRunning(false)}>
                Stop Test
              </Button>
            )}
          </Paper>
        </Grid>

        {/* Live Gauges */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              {running ? "Live Metrics" : "Last Test Results"}
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 4 }}><KpiCard title="Avg Latency" value="142ms" /></Grid>
              <Grid size={{ xs: 4 }}><KpiCard title="p99 Latency" value="485ms" /></Grid>
              <Grid size={{ xs: 4 }}><KpiCard title="Error Rate" value="0.3%" color="#34A853" /></Grid>
            </Grid>
            {running && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Progress</Typography>
                <LinearProgress variant="determinate" value={35} sx={{ height: 8, borderRadius: 4, mt: 0.5 }} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>21s / {duration}s — 4,200 requests sent</Typography>
              </Box>
            )}
            <Grid container spacing={2}>
              <Grid size={{ xs: 4 }}><KpiCard title="Requests Sent" value="12,000" /></Grid>
              <Grid size={{ xs: 4 }}><KpiCard title="Actual RPS" value="198" /></Grid>
              <Grid size={{ xs: 4 }}><KpiCard title="Throughput" value="2.4 MB/s" /></Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Historical Table */}
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Test History</Typography>
      <DataTable columns={resCols} rows={MOCK_RESULTS} total={MOCK_RESULTS.length} page={0} rowsPerPage={25} rowKey={(r) => r.id} />
    </PageShell>
  );
}
