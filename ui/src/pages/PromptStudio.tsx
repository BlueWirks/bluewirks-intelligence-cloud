import React, { useState } from "react";
import {
  Box, Typography, List, ListItemButton, ListItemText, TextField, Chip,
  Button, Divider, Paper, Slider, MenuItem, IconButton, Tooltip, alpha,
} from "@mui/material";
import AddIcon from "@mui/icons-material/AddRounded";
import PlayArrowIcon from "@mui/icons-material/PlayArrowRounded";
import PublishIcon from "@mui/icons-material/PublishRounded";
import SaveIcon from "@mui/icons-material/SaveRounded";
import { PageShell, StatusChip } from "../components";

interface Template {
  id: string;
  name: string;
  version: number;
  model: string;
  status: string;
}

const MOCK_TEMPLATES: Template[] = [
  { id: "tpl-1", name: "RAG Chat v1", version: 3, model: "gemini-2.0-flash", status: "published" },
  { id: "tpl-2", name: "Asset Analyzer", version: 2, model: "gemini-2.0-flash", status: "published" },
  { id: "tpl-3", name: "Scene Summarizer", version: 1, model: "gemini-2.0-flash", status: "draft" },
  { id: "tpl-4", name: "Error Explainer", version: 5, model: "gemini-2.0-flash", status: "published" },
  { id: "tpl-5", name: "Code Reviewer", version: 1, model: "gemini-2.0-flash", status: "draft" },
];

export default function PromptStudio() {
  const [selected, setSelected] = useState<Template>(MOCK_TEMPLATES[0]);
  const [filter, setFilter] = useState("all");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI assistant for the BlueWirks Intelligence Cloud platform. Answer questions based on the provided context chunks. Always cite your sources.");
  const [userTemplate, setUserTemplate] = useState("Context:\n{{context}}\n\nUser question: {{question}}");
  const [temp, setTemp] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [playgroundOpen, setPlaygroundOpen] = useState(true);

  const filteredTemplates = filter === "all" ? MOCK_TEMPLATES : MOCK_TEMPLATES.filter((t) => t.status === filter);

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 128px)", mx: -3, mt: -3 }}>
      {/* ── Template List ────────────────────────────────── */}
      <Box sx={{ width: 280, borderRight: 1, borderColor: "divider", display: "flex", flexDirection: "column" }}>
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle2">Templates</Typography>
          <IconButton size="small"><AddIcon fontSize="small" /></IconButton>
        </Box>
        <Box sx={{ px: 2, pb: 1.5, display: "flex", gap: 0.5 }}>
          {["all", "published", "draft"].map((f) => (
            <Chip key={f} label={f} size="small" variant={filter === f ? "filled" : "outlined"} onClick={() => setFilter(f)} />
          ))}
        </Box>
        <Divider />
        <List sx={{ flex: 1, overflow: "auto" }} disablePadding>
          {filteredTemplates.map((t) => (
            <ListItemButton key={t.id} selected={selected.id === t.id} onClick={() => setSelected(t)}>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Typography variant="body2" sx={{ fontWeight: selected.id === t.id ? 600 : 400 }}>{t.name}</Typography>
                    <Chip label={`v${t.version}`} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.625rem" }} />
                  </Box>
                }
                secondary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                    <StatusChip status={t.status} />
                    <Typography variant="caption" color="text.secondary">{t.model}</Typography>
                  </Box>
                }
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* ── Editor ───────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflow: "auto", p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>{selected.name}</Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
              <StatusChip status={selected.status} />
              <Chip label={`v${selected.version}`} size="small" variant="outlined" />
              <Chip label={selected.model} size="small" variant="outlined" />
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" startIcon={<SaveIcon />} size="small">Save</Button>
            <Button variant="contained" startIcon={<PublishIcon />} size="small" disabled={selected.status === "published"}>Publish</Button>
          </Box>
        </Box>

        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>System Instruction</Typography>
          <TextField
            fullWidth multiline rows={4} value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            sx={{ "& .MuiInputBase-input": { fontFamily: "'Roboto Mono', monospace", fontSize: "0.8125rem" } }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
            ~{systemPrompt.split(/\s+/).length} tokens (estimate)
          </Typography>
        </Box>

        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>User Template</Typography>
          <TextField
            fullWidth multiline rows={4} value={userTemplate}
            onChange={(e) => setUserTemplate(e.target.value)}
            sx={{ "& .MuiInputBase-input": { fontFamily: "'Roboto Mono', monospace", fontSize: "0.8125rem" } }}
          />
        </Box>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="overline" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>Model Configuration</Typography>
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            <Box sx={{ minWidth: 200 }}>
              <TextField select label="Model" size="small" fullWidth value={selected.model}>
                <MenuItem value="gemini-2.0-flash">gemini-2.0-flash</MenuItem>
                <MenuItem value="gemini-1.5-pro">gemini-1.5-pro</MenuItem>
              </TextField>
            </Box>
            <Box sx={{ minWidth: 200 }}>
              <Typography variant="caption" color="text.secondary">Temperature: {temp}</Typography>
              <Slider value={temp} onChange={(_, v) => setTemp(v as number)} min={0} max={2} step={0.1} size="small" />
            </Box>
            <Box sx={{ width: 140 }}>
              <TextField label="Max Tokens" type="number" size="small" value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} />
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* ── Test Playground ──────────────────────────────── */}
      {playgroundOpen && (
        <Box sx={{ width: 340, borderLeft: 1, borderColor: "divider", display: "flex", flexDirection: "column", p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>Test Playground</Typography>
          <TextField
            label="Test Input"
            multiline rows={4} fullWidth size="small" value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained" startIcon={<PlayArrowIcon />} fullWidth
            disabled={!testInput.trim()}
            onClick={() => setTestResult("Based on the context, the Pro Tools session contains 8 active tracks with a 48kHz sample rate…")}
          >
            Run Test
          </Button>
          {testResult && (
            <Paper variant="outlined" sx={{ mt: 2, p: 2, flex: 1, overflow: "auto" }}>
              <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1 }}>Output</Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", fontSize: "0.8125rem" }}>{testResult}</Typography>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: "flex", gap: 2 }}>
                <Typography variant="caption" color="text.secondary">142ms</Typography>
                <Typography variant="caption" color="text.secondary">In: 248t</Typography>
                <Typography variant="caption" color="text.secondary">Out: 89t</Typography>
              </Box>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
}
