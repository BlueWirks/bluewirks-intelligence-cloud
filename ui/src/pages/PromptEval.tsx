import React, { useState } from "react";
import {
  Box, Typography, Button, Chip, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, Tab, Divider, IconButton,
  alpha,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import AddIcon from "@mui/icons-material/AddRounded";
import PlayArrowIcon from "@mui/icons-material/PlayArrowRounded";
import { PageShell, StatusChip, DataTable, type Column } from "../components";

interface Experiment {
  id: string;
  name: string;
  status: string;
  variants: number;
  queries: number;
  createdAt: string;
}

interface EvalResult {
  query: string;
  results: { output: string; latency: number; tokens: number; score?: number }[];
}

const MOCK_EXPS: Experiment[] = [
  { id: "exp-1", name: "RAG Chat temperature sweep", status: "completed", variants: 3, queries: 10, createdAt: "2025-01-14" },
  { id: "exp-2", name: "Scene summary model comparison", status: "running", variants: 2, queries: 5, createdAt: "2025-01-15" },
  { id: "exp-3", name: "Error explanation style test", status: "draft", variants: 2, queries: 8, createdAt: "2025-01-15" },
];

const MOCK_RESULTS: EvalResult[] = [
  { query: "What tracks are in the session?", results: [
    { output: "The session contains 8 tracks including Kick, Snare…", latency: 1200, tokens: 312, score: 0.92 },
    { output: "There are 8 active audio tracks: Kick (mono), Snare…", latency: 1450, tokens: 287, score: 0.88 },
    { output: "8 tracks found. Main tracks: Kick, Snare, OH…", latency: 980, tokens: 198, score: 0.85 },
  ]},
  { query: "Explain the mix bus routing", results: [
    { output: "The mix bus is configured as a stereo aux with…", latency: 1340, tokens: 289, score: 0.90 },
    { output: "Mix bus: stereo aux, compressor + limiter chain…", latency: 1100, tokens: 201, score: 0.86 },
    { output: "The master bus receives all track outputs via…", latency: 1560, tokens: 342, score: 0.91 },
  ]},
];

const VARIANT_LABELS = ["Variant A (t=0.3)", "Variant B (t=0.7)", "Variant C (t=1.0)"];

const expCols: Column<Experiment>[] = [
  { id: "name", label: "Name", render: (r) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.name}</Typography> },
  { id: "status", label: "Status", width: 110, render: (r) => <StatusChip status={r.status} /> },
  { id: "variants", label: "Variants", width: 80, align: "center", render: (r) => <Typography variant="body2">{r.variants}</Typography> },
  { id: "queries", label: "Queries", width: 80, align: "center", render: (r) => <Typography variant="body2">{r.queries}</Typography> },
  { id: "created", label: "Created", width: 110, render: (r) => <Typography variant="body2">{r.createdAt}</Typography> },
];

export default function PromptEval() {
  const [selected, setSelected] = useState<Experiment | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState(0);

  if (selected && selected.status === "completed") {
    return (
      <PageShell
        title={selected.name}
        subtitle="Side-by-side prompt variant evaluation"
        action={<Button variant="outlined" onClick={() => setSelected(null)}>Back to Experiments</Button>}
      >
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <StatusChip status={selected.status} />
            <Chip label={`${selected.variants} variants`} size="small" variant="outlined" />
            <Chip label={`${selected.queries} queries`} size="small" variant="outlined" />
          </Box>
        </Box>

        {/* Aggregate Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {VARIANT_LABELS.slice(0, selected.variants).map((label, i) => (
            <Grid key={i} size={{ xs: 12, sm: 4 }}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="overline" color="text.secondary">{label}</Typography>
                <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mt: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Avg Latency</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{[1270, 1275, 1270][i]}ms</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Avg Tokens</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{[300, 244, 270][i]}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Avg Score</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#34A853" }}>{[0.91, 0.87, 0.88][i]}</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Results Matrix */}
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 240 }}>Test Query</TableCell>
                {VARIANT_LABELS.slice(0, selected.variants).map((l) => (
                  <TableCell key={l} align="center">{l}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {MOCK_RESULTS.map((row, ri) => (
                <TableRow key={ri}>
                  <TableCell><Typography variant="body2">{row.query}</Typography></TableCell>
                  {row.results.slice(0, selected.variants).map((res, ci) => (
                    <TableCell key={ci}>
                      <Typography variant="caption" sx={{ display: "block", mb: 0.5, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {res.output}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Chip label={`${res.latency}ms`} size="small" variant="outlined" />
                        <Chip label={`${res.tokens}t`} size="small" variant="outlined" />
                        {res.score != null && <Chip label={res.score.toFixed(2)} size="small" color="success" variant="outlined" />}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="A/B Prompt Eval"
      subtitle="Side-by-side prompt variant evaluation with quantitative scoring"
      action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>New Experiment</Button>}
    >
      <DataTable
        columns={expCols}
        rows={MOCK_EXPS}
        total={MOCK_EXPS.length}
        page={0}
        rowsPerPage={25}
        rowKey={(r) => r.id}
        emptyMessage="No experiments yet. Create your first A/B eval."
      />

      {/* Clickable row handler — select on click */}
      <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        onClick={() => { /* handled by table row click in real impl */ }}
      />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Experiment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Name" fullWidth size="small" />
            <Typography variant="overline" color="text.secondary">Variants (2 minimum)</Typography>
            <TextField label="Variant A — Prompt ID" size="small" fullWidth />
            <TextField label="Variant B — Prompt ID" size="small" fullWidth />
            <TextField label="Test Queries (one per line)" multiline rows={4} fullWidth size="small" />
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
