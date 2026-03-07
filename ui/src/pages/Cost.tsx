import React, { useState } from "react";
import {
  Box, Typography, TextField, MenuItem, Button, Paper, Chip, alpha,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PageShell, KpiCard, DataTable, type Column } from "../components";

interface CostLine { group: string; inputTokens: number; outputTokens: number; totalTokens: number; cost: number; requests: number; }

const MOCK_CHART = Array.from({ length: 14 }, (_, i) => ({
  date: `Jan ${i + 1}`,
  tenant: +(Math.random() * 20 + 10).toFixed(2),
  model: +(Math.random() * 15 + 8).toFixed(2),
  query: +(Math.random() * 10 + 5).toFixed(2),
}));

const MOCK_LINES: CostLine[] = [
  { group: "org-acme", inputTokens: 1_240_000, outputTokens: 312_000, totalTokens: 1_552_000, cost: 312.44, requests: 4_200 },
  { group: "org-beta", inputTokens: 890_000, outputTokens: 224_000, totalTokens: 1_114_000, cost: 224.18, requests: 3_100 },
  { group: "org-gamma", inputTokens: 640_000, outputTokens: 161_000, totalTokens: 801_000, cost: 160.85, requests: 2_400 },
  { group: "default", inputTokens: 420_000, outputTokens: 106_000, totalTokens: 526_000, cost: 145.00, requests: 1_800 },
];

const costCols: Column<CostLine>[] = [
  { id: "group", label: "Group", render: (r) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.group}</Typography> },
  { id: "input", label: "Input Tokens", width: 130, align: "right", render: (r) => <Typography variant="body2">{r.inputTokens.toLocaleString()}</Typography> },
  { id: "output", label: "Output Tokens", width: 130, align: "right", render: (r) => <Typography variant="body2">{r.outputTokens.toLocaleString()}</Typography> },
  { id: "total", label: "Total Tokens", width: 130, align: "right", render: (r) => <Typography variant="body2">{r.totalTokens.toLocaleString()}</Typography> },
  { id: "cost", label: "Est. Cost (USD)", width: 140, align: "right", render: (r) => <Typography variant="body2" sx={{ fontWeight: 600 }}>${r.cost.toFixed(2)}</Typography> },
  { id: "reqs", label: "Requests", width: 100, align: "right", render: (r) => <Typography variant="body2">{r.requests.toLocaleString()}</Typography> },
];

export default function Cost() {
  const [groupBy, setGroupBy] = useState("tenant");
  const totalCost = MOCK_LINES.reduce((s, l) => s + l.cost, 0);
  const totalTokens = MOCK_LINES.reduce((s, l) => s + l.totalTokens, 0);
  const totalReqs = MOCK_LINES.reduce((s, l) => s + l.requests, 0);

  return (
    <PageShell title="Cost Allocation" subtitle="AI infrastructure costs broken down by tenant, model, query, or day">
      {/* Controls */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField type="date" label="Start" size="small" defaultValue="2025-01-01" InputLabelProps={{ shrink: true }} />
        <TextField type="date" label="End" size="small" defaultValue="2025-01-15" InputLabelProps={{ shrink: true }} />
        <TextField select label="Group By" size="small" value={groupBy} onChange={(e) => setGroupBy(e.target.value)} sx={{ width: 160 }}>
          <MenuItem value="tenant">Tenant</MenuItem>
          <MenuItem value="model">Model</MenuItem>
          <MenuItem value="query">Query</MenuItem>
          <MenuItem value="day">Day</MenuItem>
        </TextField>
      </Box>

      {/* KPI Strip */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard title="Total Input Tokens" value={MOCK_LINES.reduce((s, l) => s + l.inputTokens, 0).toLocaleString()} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard title="Total Output Tokens" value={MOCK_LINES.reduce((s, l) => s + l.outputTokens, 0).toLocaleString()} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard title="Estimated Cost" value={`$${totalCost.toFixed(2)}`} color="#EA4335" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard title="Request Count" value={totalReqs.toLocaleString()} />
        </Grid>
      </Grid>

      {/* Chart */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>Cost Over Time</Typography>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={MOCK_CHART}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1A73E8" stopOpacity={0.3} /><stop offset="100%" stopColor="#1A73E8" stopOpacity={0} /></linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34A853" stopOpacity={0.3} /><stop offset="100%" stopColor="#34A853" stopOpacity={0} /></linearGradient>
              <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FBBC04" stopOpacity={0.3} /><stop offset="100%" stopColor="#FBBC04" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#80868B" />
            <YAxis tick={{ fontSize: 11 }} stroke="#80868B" />
            <Tooltip contentStyle={{ background: "#161822", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
            <Legend />
            <Area type="monotone" dataKey="tenant" stackId="1" stroke="#1A73E8" fill="url(#g1)" />
            <Area type="monotone" dataKey="model" stackId="1" stroke="#34A853" fill="url(#g2)" />
            <Area type="monotone" dataKey="query" stackId="1" stroke="#FBBC04" fill="url(#g3)" />
          </AreaChart>
        </ResponsiveContainer>
      </Paper>

      {/* Detail Table */}
      <DataTable columns={costCols} rows={MOCK_LINES} total={MOCK_LINES.length} page={0} rowsPerPage={25} rowKey={(r) => r.group} />
    </PageShell>
  );
}
