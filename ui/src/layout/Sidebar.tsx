import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Box, Divider, IconButton, Tooltip, alpha,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/DashboardRounded";
import InventoryIcon from "@mui/icons-material/Inventory2Rounded";
import ChatIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import TimelineIcon from "@mui/icons-material/TimelineRounded";
import PsychologyIcon from "@mui/icons-material/PsychologyRounded";
import EditNoteIcon from "@mui/icons-material/EditNoteRounded";
import ScienceIcon from "@mui/icons-material/ScienceRounded";
import SmartToyIcon from "@mui/icons-material/SmartToyRounded";
import BoltIcon from "@mui/icons-material/BoltRounded";
import PaidIcon from "@mui/icons-material/PaidRounded";
import InsightsIcon from "@mui/icons-material/InsightsRounded";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActiveRounded";
import PublicIcon from "@mui/icons-material/PublicRounded";
import CloudUploadIcon from "@mui/icons-material/CloudUploadRounded";
import WebhookIcon from "@mui/icons-material/WebhookRounded";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweepRounded";
import EventRepeatIcon from "@mui/icons-material/EventRepeatRounded";
import SpeedIcon from "@mui/icons-material/SpeedRounded";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import ApartmentIcon from "@mui/icons-material/ApartmentRounded";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesomeRounded";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightIcon from "@mui/icons-material/ChevronRightRounded";
import { BRAND } from "../theme";

interface Props {
  width: number;
  collapsed: boolean;
  aiFocusNav: boolean;
  onToggleAiFocusNav: () => void;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: "Core Platform",
    items: [
      { label: "Dashboard", path: "/", icon: <DashboardIcon /> },
      { label: "Assets", path: "/assets", icon: <InventoryIcon /> },
      { label: "Chat", path: "/chat", icon: <ChatIcon /> },
      { label: "Ingestion", path: "/ingestion", icon: <TimelineIcon /> },
    ],
  },
  {
    title: "AI Studio",
    items: [
      { label: "Knowledge", path: "/knowledge", icon: <PsychologyIcon /> },
      { label: "Prompt Studio", path: "/prompt-studio", icon: <EditNoteIcon /> },
      { label: "A/B Eval", path: "/prompt-eval", icon: <ScienceIcon /> },
      { label: "App Builder", path: "/app-builder", icon: <SmartToyIcon /> },
      { label: "Workflows", path: "/workflows", icon: <BoltIcon /> },
    ],
  },
  {
    title: "Infrastructure",
    items: [
      { label: "Cost", path: "/cost", icon: <PaidIcon /> },
      { label: "Metrics", path: "/metrics", icon: <InsightsIcon /> },
      { label: "Anomaly", path: "/anomaly", icon: <NotificationsActiveIcon /> },
      { label: "Failover", path: "/failover", icon: <PublicIcon /> },
      { label: "BQ Export", path: "/export", icon: <CloudUploadIcon /> },
      { label: "Webhooks", path: "/webhooks", icon: <WebhookIcon /> },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "DLQ Replay", path: "/dlq", icon: <DeleteSweepIcon /> },
      { label: "Retention", path: "/retention", icon: <EventRepeatIcon /> },
      { label: "Load Test", path: "/load-test", icon: <SpeedIcon /> },
      { label: "RBAC Roles", path: "/rbac", icon: <AdminPanelSettingsIcon /> },
      { label: "Tenants", path: "/tenants", icon: <ApartmentIcon /> },
    ],
  },
];

const AI_FOCUS_PATHS = new Set([
  "/",
  "/chat",
  "/knowledge",
  "/prompt-studio",
  "/prompt-eval",
  "/app-builder",
  "/workflows",
]);

export default function Sidebar({ width, collapsed, aiFocusNav, onToggleAiFocusNav, onToggle }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const visibleSections = aiFocusNav
    ? SECTIONS
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => AI_FOCUS_PATHS.has(item.path)),
        }))
        .filter((section) => section.items.length > 0)
    : SECTIONS;

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width,
          boxSizing: "border-box",
          transition: "width 0.25s cubic-bezier(.4,0,.2,1)",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: collapsed ? 1.5 : 2.5,
          py: 2,
          minHeight: 64,
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <Box
          component="img"
          src="/bluewirks.svg"
          alt="BW"
          sx={{
            width: 32,
            height: 32,
            flexShrink: 0,
            filter: "drop-shadow(0 2px 8px rgba(26,115,232,0.3))",
          }}
        />
        {!collapsed && (
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: `linear-gradient(135deg, ${BRAND.blue[300]} 0%, ${BRAND.blue[500]} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
            }}
          >
            BlueWirks
          </Typography>
        )}
      </Box>

      <Divider sx={{ mx: 1 }} />

      {/* Nav sections */}
      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", py: 1 }}>
        {visibleSections.map((section) => (
          <React.Fragment key={section.title}>
            {!collapsed && (
              <Typography
                variant="overline"
                sx={{
                  px: 2.5,
                  pt: 2,
                  pb: 0.5,
                  display: "block",
                  color: "text.disabled",
                  fontSize: "0.625rem",
                }}
              >
                {section.title}
              </Typography>
            )}
            <List disablePadding>
              {section.items.map((item) => {
                const active = isActive(item.path);
                const btn = (
                  <ListItemButton
                    key={item.path}
                    selected={active}
                    onClick={() => navigate(item.path)}
                    sx={{
                      justifyContent: collapsed ? "center" : "flex-start",
                      px: collapsed ? 1 : 1.5,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        justifyContent: "center",
                        minWidth: collapsed ? "unset" : 36,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && <ListItemText primary={item.label} />}
                  </ListItemButton>
                );
                return collapsed ? (
                  <Tooltip key={item.path} title={item.label} placement="right" arrow>
                    {btn}
                  </Tooltip>
                ) : (
                  btn
                );
              })}
            </List>
          </React.Fragment>
        ))}
      </Box>

      {/* Collapse toggle */}
      <Divider sx={{ mx: 1 }} />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1, py: 1 }}>
        <Tooltip title={aiFocusNav ? "Switch to full navigation" : "Switch to AI-only navigation"}>
          <IconButton onClick={onToggleAiFocusNav} size="small" sx={{ color: aiFocusNav ? "primary.main" : "text.secondary" }}>
            <AutoAwesomeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <IconButton onClick={onToggle} size="small" sx={{ color: "text.secondary" }}>
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
    </Drawer>
  );
}
