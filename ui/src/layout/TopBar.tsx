import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, Box, Chip, IconButton, Tooltip, alpha,
  InputBase, Dialog, DialogTitle, DialogContent, DialogActions, Button, List,
  ListItem, ListItemIcon, ListItemText,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/SearchRounded";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNoneRounded";
import DarkModeIcon from "@mui/icons-material/DarkModeRounded";
import LightModeIcon from "@mui/icons-material/LightModeRounded";
import AccountCircleIcon from "@mui/icons-material/AccountCircleRounded";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdatesRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesomeRounded";
import TuneIcon from "@mui/icons-material/TuneRounded";
import { useThemeMode } from "../ThemeProvider";
import { BRAND } from "../theme";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/assets": "Assets",
  "/chat": "Chat",
  "/ingestion": "Ingestion Pipeline",
  "/knowledge": "Knowledge Workspaces",
  "/prompt-studio": "Prompt Engineering Studio",
  "/prompt-eval": "A/B Prompt Eval",
  "/app-builder": "AI App Builder",
  "/workflows": "Workflow Automation",
  "/cost": "Cost Allocation",
  "/metrics": "Custom Trace Metrics",
  "/anomaly": "Anomaly Detection",
  "/failover": "Cross-Region Failover",
  "/export": "BigQuery Export",
  "/webhooks": "Webhook Configurator",
  "/dlq": "DLQ Replay",
  "/retention": "Retention Policies",
  "/load-test": "Synthetic Load Testing",
  "/rbac": "RBAC Custom Roles",
  "/tenants": "Multi-Tenant Isolation",
};

export default function TopBar() {
  const { pathname } = useLocation();
  const { mode, toggle } = useThemeMode();
  const label = ROUTE_LABELS[pathname] ?? "BlueWirks";
  const [hintsOpen, setHintsOpen] = useState(false);
  const ONBOARDING_SEEN_KEY = "bw_hints_onboarding_seen";

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_SEEN_KEY) === "true";
    if (!seen) {
      setHintsOpen(true);
      localStorage.setItem(ONBOARDING_SEEN_KEY, "true");
    }
  }, []);

  const pageHint = useMemo(() => {
    if (pathname === "/chat") return "Use retrieved citations + prompt version badges to trust answers and debug quality quickly.";
    if (pathname === "/knowledge") return "Keep workspaces focused by domain; retrieval quality improves when datasets stay clean and scoped.";
    if (pathname === "/prompt-studio") return "Change one variable at a time (system text, temperature, or schema) to isolate prompt impact.";
    if (pathname === "/prompt-eval") return "Run A/B eval with 10+ representative queries before publishing a new prompt version.";
    if (pathname === "/app-builder") return "Deploy only after Test tab outputs are stable, cited, and within latency targets.";
    if (pathname === "/workflows") return "Start simple: retrieve → generate, then add transform/notify once baseline is reliable.";
    return "Start with Knowledge → Prompt Studio → A/B Eval → App Builder for the fastest path to high-quality AI output.";
  }, [pathname]);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        color: "text.primary",
        zIndex: (t) => t.zIndex.drawer - 1,
      }}
    >
      <Toolbar sx={{ gap: 2, minHeight: "56px !important" }}>
        {/* Breadcrumb / Page title */}
        <Typography variant="h5" sx={{ fontWeight: 600, flexShrink: 0 }}>
          {label}
        </Typography>

        <Chip
          label="DEV"
          size="small"
          sx={{
            bgcolor: alpha(BRAND.amber[500], 0.15),
            color: BRAND.amber[500],
            fontWeight: 600,
            fontSize: "0.625rem",
            height: 20,
          }}
        />

        <Chip
          label="SCALE FEATURES"
          size="small"
          sx={{
            bgcolor: alpha(BRAND.blue[500], 0.12),
            color: BRAND.blue[300],
            fontWeight: 600,
            fontSize: "0.625rem",
            height: 20,
          }}
        />

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Search */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: (t) => alpha(t.palette.text.primary, 0.04),
            borderRadius: 2,
            px: 1.5,
            py: 0.3,
            maxWidth: 280,
            border: 1,
            borderColor: "divider",
            "&:focus-within": {
              borderColor: "primary.main",
              bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
            },
            transition: "all 0.2s",
          }}
        >
          <SearchIcon sx={{ fontSize: 18, color: "text.secondary", mr: 1 }} />
          <InputBase
            placeholder="Search… ⌘K"
            sx={{ fontSize: "0.8125rem", flex: 1 }}
          />
        </Box>

        {/* Actions */}
        <Tooltip title="Notifications">
          <IconButton size="small" sx={{ color: "text.secondary" }}>
            <NotificationsNoneIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Usage hints and best practices">
          <IconButton size="small" sx={{ color: "text.secondary" }} onClick={() => setHintsOpen(true)}>
            <TipsAndUpdatesIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={mode === "dark" ? "Light mode" : "Dark mode"}>
          <IconButton size="small" onClick={toggle} sx={{ color: "text.secondary" }}>
            {mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Account">
          <IconButton size="small" sx={{ color: "text.secondary" }}>
            <AccountCircleIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>

      <Dialog open={hintsOpen} onClose={() => setHintsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TipsAndUpdatesIcon sx={{ color: "primary.main" }} />
          How to use BlueWirks for best results
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Recommended workflow</Typography>
          <List dense disablePadding sx={{ mb: 2 }}>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 30 }}><CheckCircleIcon sx={{ fontSize: 18, color: "#34A853" }} /></ListItemIcon>
              <ListItemText primary="1) Build a clean Knowledge workspace (documents grouped by domain)." />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 30 }}><CheckCircleIcon sx={{ fontSize: 18, color: "#34A853" }} /></ListItemIcon>
              <ListItemText primary="2) Create prompt versions in Prompt Studio and test with realistic inputs." />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 30 }}><CheckCircleIcon sx={{ fontSize: 18, color: "#34A853" }} /></ListItemIcon>
              <ListItemText primary="3) Run A/B Prompt Eval before publishing; pick the best latency/quality tradeoff." />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 30 }}><CheckCircleIcon sx={{ fontSize: 18, color: "#34A853" }} /></ListItemIcon>
              <ListItemText primary="4) Deploy in App Builder and validate outputs/citations in Chat." />
            </ListItem>
          </List>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>Pro tips</Typography>
          <List dense disablePadding>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 30 }}><AutoAwesomeIcon sx={{ fontSize: 18, color: "#8AB4F8" }} /></ListItemIcon>
              <ListItemText primary="Use focused, smaller workspaces instead of one giant corpus for better retrieval precision." />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 30 }}><AutoAwesomeIcon sx={{ fontSize: 18, color: "#8AB4F8" }} /></ListItemIcon>
              <ListItemText primary="Keep temperature low for deterministic ops workflows; increase only for creative generation." />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 30 }}><TuneIcon sx={{ fontSize: 18, color: "#FBBC04" }} /></ListItemIcon>
              <ListItemText primary={pageHint} />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHintsOpen(false)} variant="contained">Got it</Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}
