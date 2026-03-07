import React from "react";
import {
  Box, Typography, Card, CardContent, Skeleton, Chip, List,
  ListItem, ListItemText, ListItemIcon, Divider, Paper, alpha,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useQuery } from "@tanstack/react-query";
import InventoryIcon from "@mui/icons-material/Inventory2Rounded";
import SpeedIcon from "@mui/icons-material/SpeedRounded";
import ScienceIcon from "@mui/icons-material/ScienceRounded";
import AttachMoneyIcon from "@mui/icons-material/AttachMoneyRounded";
import StorageIcon from "@mui/icons-material/StorageRounded";
import DescriptionIcon from "@mui/icons-material/DescriptionRounded";
import SmartToyIcon from "@mui/icons-material/SmartToyRounded";
import ShieldIcon from "@mui/icons-material/ShieldRounded";
import WarningAmberIcon from "@mui/icons-material/WarningAmberRounded";
import TimelineIcon from "@mui/icons-material/TimelineRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorIcon from "@mui/icons-material/ErrorOutlineRounded";
import HourglassIcon from "@mui/icons-material/HourglassEmptyRounded";
import { api } from "../api";
import { KpiCard, StatusChip, PageShell } from "../components";

// ── mock helper (for demo mode when API not available) ───────────────────────
function useMock<T>(key: string, data: T) {
  return useQuery({ queryKey: [key], queryFn: () => Promise.resolve(data), staleTime: 60_000 });
}

const MOCK_KPIS = {
  assetsIndexed: 1_247,
  ingestionHealth: 98.6,
  activeExperiments: 3,
  costMtd: 842.47,
};

const MOCK_ACTIVITY = [
  { id: "run-1a", assetId: "ast-3f2", status: "INDEXED", ago: "2m ago" },
  { id: "run-2b", assetId: "ast-8c1", status: "PROCESSING", ago: "4m ago" },
  { id: "run-3c", assetId: "ast-a04", status: "FAILED", ago: "11m ago" },
  { id: "run-4d", assetId: "ast-7e9", status: "QUEUED", ago: "15m ago" },
  { id: "run-5e", assetId: "ast-01b", status: "INDEXED", ago: "22m ago" },
];

const STATUS_ICON: Record<string, React.ReactNode> = {
  INDEXED: <CheckCircleIcon sx={{ color: "#34A853", fontSize: 18 }} />,
  PROCESSING: <HourglassIcon sx={{ color: "#FBBC04", fontSize: 18 }} />,
  FAILED: <ErrorIcon sx={{ color: "#EA4335", fontSize: 18 }} />,
  QUEUED: <HourglassIcon sx={{ color: "#8AB4F8", fontSize: 18 }} />,
};

export default function Dashboard() {
  const kpis = useMock("dashboard-kpis", MOCK_KPIS);
  const activity = useMock("dashboard-activity", MOCK_ACTIVITY);

  return (
    <PageShell title="Dashboard" subtitle="Operational overview — BlueWirks Intelligence Cloud">
      {/* ── KPI Strip ────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Assets Indexed"
            value={kpis.data?.assetsIndexed.toLocaleString() ?? "—"}
            trend={4.2}
            subtitle="vs last 7 days"
            icon={<InventoryIcon />}
            loading={kpis.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Ingestion Health"
            value={kpis.data ? `${kpis.data.ingestionHealth}%` : "—"}
            trend={1.1}
            subtitle="24h success rate"
            icon={<SpeedIcon />}
            color="#34A853"
            loading={kpis.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Active Experiments"
            value={kpis.data?.activeExperiments ?? "—"}
            subtitle="A/B prompt evals running"
            icon={<ScienceIcon />}
            color="#FBBC04"
            loading={kpis.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Cost (MTD)"
            value={kpis.data ? `$${kpis.data.costMtd.toFixed(2)}` : "—"}
            trend={-2.8}
            subtitle="vs last month"
            icon={<AttachMoneyIcon />}
            color="#EA4335"
            loading={kpis.isLoading}
          />
        </Grid>
      </Grid>

      {/* ── Live Activity + DLQ ───────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Ingestion Pipeline Activity</Typography>
              <List disablePadding dense>
                {(activity.data ?? []).map((r) => (
                  <ListItem key={r.id} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>{STATUS_ICON[r.status]}</ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" sx={{ fontFamily: "'Roboto Mono', monospace", fontSize: "0.8125rem" }}>{r.id}</Typography>
                          <StatusChip status={r.status} />
                        </Box>
                      }
                      secondary={`Asset ${r.assetId} · ${r.ago}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>DLQ Alerts</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <WarningAmberIcon sx={{ color: "#FBBC04" }} />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>7</Typography>
                <Typography variant="body2" color="text.secondary">unresolved messages</Typography>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                <Chip label="PARSE_ERROR (3)" size="small" sx={{ bgcolor: alpha("#EA4335", 0.12), color: "#EA4335" }} />
                <Chip label="EMBED_TIMEOUT (2)" size="small" sx={{ bgcolor: alpha("#FBBC04", 0.12), color: "#FBBC04" }} />
                <Chip label="UPSERT_FAIL (2)" size="small" sx={{ bgcolor: alpha("#8AB4F8", 0.12), color: "#8AB4F8" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── AI Studio Summary ──────────────────────────────────── */}
      <Typography variant="subtitle2" sx={{ mb: 1.5, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "0.6875rem" }}>
        AI Studio
      </Typography>
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha("#1A73E8", 0.1), display: "flex", alignItems: "center", justifyContent: "center" }}>
                <StorageIcon sx={{ color: "#1A73E8" }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Knowledge Workspaces</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>4</Typography>
                <Typography variant="caption" color="text.secondary">128 docs · 3,412 chunks</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha("#34A853", 0.1), display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DescriptionIcon sx={{ color: "#34A853" }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Prompt Templates</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>12</Typography>
                <Typography variant="caption" color="text.secondary">9 published · 3 draft</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha("#FBBC04", 0.1), display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SmartToyIcon sx={{ color: "#FBBC04" }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">AI Apps</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>6</Typography>
                <Typography variant="caption" color="text.secondary">4 deployed · 2 draft</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Infrastructure Health ───────────────────────────── */}
      <Typography variant="subtitle2" sx={{ mb: 1.5, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "0.6875rem" }}>
        Infrastructure Health
      </Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <ShieldIcon sx={{ color: "#34A853", fontSize: 18 }} />
                <Typography variant="subtitle2">Failover Status</Typography>
              </Box>
              <Chip label="us-central1" size="small" color="success" sx={{ mb: 1 }} />
              <Typography variant="caption" display="block" color="text.secondary">
                Primary active · Last tested 4h ago
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <WarningAmberIcon sx={{ color: "#FBBC04", fontSize: 18 }} />
                <Typography variant="subtitle2">Anomaly Alerts</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>1</Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                p99 latency threshold breached · 12m ago
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <TimelineIcon sx={{ color: "#1A73E8", fontSize: 18 }} />
                <Typography variant="subtitle2">System Metrics</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">p99 Latency</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>247ms</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Error Rate</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>0.4%</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Throughput</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>1.2k/min</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageShell>
  );
}
