import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Sidebar from "./layout/Sidebar";
import TopBar from "./layout/TopBar";

// ── Page imports (lazy) ──────────────────────────────────────────────────────
const Dashboard    = React.lazy(() => import("./pages/Dashboard"));
const Assets       = React.lazy(() => import("./pages/Assets"));
const Chat         = React.lazy(() => import("./pages/Chat"));
const Ingestion    = React.lazy(() => import("./pages/Ingestion"));
const Knowledge    = React.lazy(() => import("./pages/Knowledge"));
const PromptStudio = React.lazy(() => import("./pages/PromptStudio"));
const PromptEval   = React.lazy(() => import("./pages/PromptEval"));
const AppBuilder   = React.lazy(() => import("./pages/AppBuilder"));
const Workflows    = React.lazy(() => import("./pages/Workflows"));
const Cost         = React.lazy(() => import("./pages/Cost"));
const Metrics      = React.lazy(() => import("./pages/Metrics"));
const Anomaly      = React.lazy(() => import("./pages/Anomaly"));
const Failover     = React.lazy(() => import("./pages/Failover"));
const Export       = React.lazy(() => import("./pages/Export"));
const Webhooks     = React.lazy(() => import("./pages/Webhooks"));
const DLQ          = React.lazy(() => import("./pages/DLQ"));
const Retention    = React.lazy(() => import("./pages/Retention"));
const LoadTest     = React.lazy(() => import("./pages/LoadTest"));
const RBAC         = React.lazy(() => import("./pages/RBAC"));
const Tenants      = React.lazy(() => import("./pages/Tenants"));

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED = 72;

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [aiFocusNav, setAiFocusNav] = useState<boolean>(
    () => localStorage.getItem("bw_ai_focus_nav") !== "false",
  );
  const drawerW = collapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH;

  const toggleAiFocusNav = () => {
    setAiFocusNav((prev) => {
      const next = !prev;
      localStorage.setItem("bw_ai_focus_nav", String(next));
      return next;
    });
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        width={drawerW}
        collapsed={collapsed}
        aiFocusNav={aiFocusNav}
        onToggleAiFocusNav={toggleAiFocusNav}
        onToggle={() => setCollapsed((p) => !p)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${drawerW}px`,
          transition: "margin-left 0.25s cubic-bezier(.4,0,.2,1)",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <TopBar />
        <Box sx={{ flex: 1, p: 3, overflow: "auto" }}>
          <React.Suspense
            fallback={
              <Box sx={{ display: "flex", justifyContent: "center", pt: 10, opacity: 0.4 }}>
                Loading…
              </Box>
            }
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/ingestion" element={<Ingestion />} />
              {/* AI Studio */}
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/prompt-studio" element={<PromptStudio />} />
              <Route path="/prompt-eval" element={<PromptEval />} />
              <Route path="/app-builder" element={<AppBuilder />} />
              <Route path="/workflows" element={<Workflows />} />
              {/* Infrastructure */}
              <Route path="/cost" element={<Cost />} />
              <Route path="/metrics" element={<Metrics />} />
              <Route path="/anomaly" element={<Anomaly />} />
              <Route path="/failover" element={<Failover />} />
              <Route path="/export" element={<Export />} />
              <Route path="/webhooks" element={<Webhooks />} />
              {/* Operations */}
              <Route path="/dlq" element={<DLQ />} />
              <Route path="/retention" element={<Retention />} />
              <Route path="/load-test" element={<LoadTest />} />
              <Route path="/rbac" element={<RBAC />} />
              <Route path="/tenants" element={<Tenants />} />
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </React.Suspense>
        </Box>
      </Box>
    </Box>
  );
}
