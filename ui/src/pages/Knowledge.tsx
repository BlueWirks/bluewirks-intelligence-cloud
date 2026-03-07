import React, { useState } from "react";
import {
  Box, Card, CardContent, CardActionArea, Typography, Chip, Button,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, ToggleButton, ToggleButtonGroup, Divider, alpha,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import AddIcon from "@mui/icons-material/AddRounded";
import ViewModuleIcon from "@mui/icons-material/ViewModuleRounded";
import ViewListIcon from "@mui/icons-material/ViewListRounded";
import StorageIcon from "@mui/icons-material/StorageRounded";
import UploadIcon from "@mui/icons-material/UploadFileRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import { PageShell, StatusChip, DataTable, type Column, EmptyState } from "../components";

interface Workspace { id: string; name: string; description: string; documentCount: number; totalChunks: number; createdAt: string; updatedAt: string; }
interface Doc { id: string; filename: string; contentType: string; status: string; chunkCount: number; uploadedAt: string; indexedAt?: string; }

const MOCK_WS: Workspace[] = [
  { id: "ws-1", name: "Media Asset Library", description: "Pro Tools sessions and Unity scene exports", documentCount: 42, totalChunks: 1_240, createdAt: "2025-01-05", updatedAt: "2025-01-15" },
  { id: "ws-2", name: "Engineering Docs", description: "Technical documentation and runbooks", documentCount: 28, totalChunks: 876, createdAt: "2025-01-08", updatedAt: "2025-01-14" },
  { id: "ws-3", name: "Customer Support KB", description: "FAQ, troubleshooting guides, and support articles", documentCount: 56, totalChunks: 1_296, createdAt: "2025-01-02", updatedAt: "2025-01-15" },
];

const MOCK_DOCS: Doc[] = [
  { id: "doc-1", filename: "demo_session.json", contentType: "application/json", status: "indexed", chunkCount: 24, uploadedAt: "2025-01-14", indexedAt: "2025-01-14" },
  { id: "doc-2", filename: "scene_export.json", contentType: "application/json", status: "indexed", chunkCount: 18, uploadedAt: "2025-01-13", indexedAt: "2025-01-13" },
  { id: "doc-3", filename: "architecture.pdf", contentType: "application/pdf", status: "indexing", chunkCount: 0, uploadedAt: "2025-01-15" },
];

const docCols: Column<Doc>[] = [
  { id: "file", label: "Filename", render: (r) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.filename}</Typography> },
  { id: "type", label: "Content Type", width: 160, render: (r) => <Chip label={r.contentType} size="small" variant="outlined" /> },
  { id: "status", label: "Status", width: 100, render: (r) => <StatusChip status={r.status} /> },
  { id: "chunks", label: "Chunks", width: 80, align: "right", render: (r) => <Typography variant="body2">{r.chunkCount || "—"}</Typography> },
  { id: "uploaded", label: "Uploaded", width: 110, render: (r) => <Typography variant="body2">{r.uploadedAt}</Typography> },
  { id: "indexed", label: "Indexed", width: 110, render: (r) => <Typography variant="body2">{r.indexedAt ?? "—"}</Typography> },
  { id: "actions", label: "", width: 48, align: "right", render: () => <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton> },
];

export default function Knowledge() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Workspace | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  if (selected) {
    return (
      <PageShell
        title={selected.name}
        subtitle={selected.description}
        action={
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" onClick={() => setSelected(null)}>Back</Button>
            <Button variant="contained" startIcon={<UploadIcon />}>Upload Document</Button>
          </Box>
        }
      >
        <DataTable columns={docCols} rows={MOCK_DOCS} total={MOCK_DOCS.length} page={0} rowsPerPage={25} rowKey={(r) => r.id} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Knowledge Workspaces"
      subtitle="Manage curated document collections for RAG retrieval"
      action={
        <Box sx={{ display: "flex", gap: 1 }}>
          <ToggleButtonGroup size="small" value={view} exclusive onChange={(_, v) => v && setView(v)}>
            <ToggleButton value="grid"><ViewModuleIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="list"><ViewListIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>New Workspace</Button>
        </Box>
      }
    >
      <Grid container spacing={2.5}>
        {MOCK_WS.map((ws) => (
          <Grid key={ws.id} size={view === "grid" ? { xs: 12, sm: 6, md: 4 } : { xs: 12 }}>
            <Card>
              <CardActionArea onClick={() => setSelected(ws)} sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha("#1A73E8", 0.1), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <StorageIcon sx={{ color: "#1A73E8" }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.25 }}>{ws.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>{ws.description}</Typography>
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                      <Typography variant="caption"><strong>{ws.documentCount}</strong> docs</Typography>
                      <Typography variant="caption"><strong>{ws.totalChunks.toLocaleString()}</strong> chunks</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Knowledge Workspace</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Name" fullWidth size="small" />
            <TextField label="Description" fullWidth size="small" multiline rows={2} />
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
