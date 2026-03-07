import React, { useState } from "react";
import {
  Box, Card, CardContent, CardActionArea, Typography, Chip, Button,
  Tabs, Tab, TextField, MenuItem, Paper, Divider, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, alpha,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import AddIcon from "@mui/icons-material/AddRounded";
import PlayArrowIcon from "@mui/icons-material/PlayArrowRounded";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunchRounded";
import SaveIcon from "@mui/icons-material/SaveRounded";
import { PageShell, StatusChip } from "../components";

interface App {
  id: string;
  name: string;
  status: string;
  description: string;
  promptId: string;
  dataSources: number;
  updatedAt: string;
  deployedAt?: string;
}

const MOCK_APPS: App[] = [
  { id: "app-1", name: "Media Q&A Bot", status: "deployed", description: "Answers questions about Pro Tools sessions and Unity scenes", promptId: "tpl-1", dataSources: 2, updatedAt: "2025-01-15", deployedAt: "2025-01-14" },
  { id: "app-2", name: "Doc Search Assistant", status: "testing", description: "Searches engineering documentation and runbooks", promptId: "tpl-2", dataSources: 1, updatedAt: "2025-01-15" },
  { id: "app-3", name: "Support Agent", status: "draft", description: "Customer support AI powered by KB articles", promptId: "tpl-4", dataSources: 1, updatedAt: "2025-01-14" },
];

export default function AppBuilder() {
  const [selected, setSelected] = useState<App | null>(null);
  const [tab, setTab] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState<string | null>(null);

  if (selected) {
    return (
      <PageShell
        title={selected.name}
        subtitle={selected.description}
        action={<Button variant="outlined" onClick={() => { setSelected(null); setTab(0); }}>Back</Button>}
      >
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <StatusChip status={selected.status} />
          <Chip label={`Prompt: ${selected.promptId}`} size="small" variant="outlined" />
          <Chip label={`${selected.dataSources} data sources`} size="small" variant="outlined" />
        </Box>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Configure" />
          <Tab label="Test" />
          <Tab label="Deploy" />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 600 }}>
            <TextField label="App Name" size="small" defaultValue={selected.name} fullWidth />
            <TextField label="Description" size="small" defaultValue={selected.description} multiline rows={2} fullWidth />
            <TextField select label="Prompt Template" size="small" defaultValue={selected.promptId} fullWidth>
              <MenuItem value="tpl-1">RAG Chat v1</MenuItem>
              <MenuItem value="tpl-2">Asset Analyzer</MenuItem>
              <MenuItem value="tpl-4">Error Explainer</MenuItem>
            </TextField>
            <TextField
              label="Config (JSON)"
              multiline rows={4} fullWidth size="small"
              defaultValue={JSON.stringify({ maxResults: 5, temperature: 0.7 }, null, 2)}
              sx={{ "& .MuiInputBase-input": { fontFamily: "'Roboto Mono', monospace", fontSize: "0.8125rem" } }}
            />
            <Button variant="contained" startIcon={<SaveIcon />} sx={{ alignSelf: "flex-start" }}>Save</Button>
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ maxWidth: 600 }}>
            <TextField
              label="Test Input"
              multiline rows={3} fullWidth size="small" value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained" startIcon={<PlayArrowIcon />}
              disabled={!testInput.trim()}
              onClick={() => setTestOutput("The Pro Tools demo session contains 8 active tracks: Kick, Snare, Overheads, Bass DI, Guitar L, Guitar R, Vocals, and Master Bus.")}
            >
              Test
            </Button>
            {testOutput && (
              <Paper variant="outlined" sx={{ mt: 2, p: 2 }}>
                <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1 }}>Output</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{testOutput}</Typography>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">1,240ms</Typography>
                  <Typography variant="caption" color="text.secondary">In: 512t · Out: 128t</Typography>
                </Box>
              </Paper>
            )}
          </Box>
        )}

        {tab === 2 && (
          <Box sx={{ maxWidth: 600 }}>
            <Paper variant="outlined" sx={{ p: 2.5, mb: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selected.status === "deployed"
                  ? `Currently deployed since ${selected.deployedAt}`
                  : "This app has not been deployed yet."}
              </Typography>
              <Button
                variant="contained"
                startIcon={<RocketLaunchIcon />}
                color={selected.status === "deployed" ? "warning" : "primary"}
              >
                {selected.status === "deployed" ? "Redeploy" : "Deploy"}
              </Button>
            </Paper>
            <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1 }}>Deployment History</Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              {selected.deployedAt ? (
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <Chip label="deployed" size="small" color="success" />
                  <Typography variant="caption">{selected.deployedAt}</Typography>
                  <Typography variant="caption" color="text.secondary">Initial deployment</Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No deployments yet</Typography>
              )}
            </Paper>
          </Box>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell
      title="AI App Builder"
      subtitle="Compose, test, and deploy AI applications powered by prompts + data"
      action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>New App</Button>}
    >
      <Grid container spacing={2.5}>
        {MOCK_APPS.map((app) => (
          <Grid key={app.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardActionArea onClick={() => setSelected(app)} sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle2">{app.name}</Typography>
                  <StatusChip status={app.status} />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>{app.description}</Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Chip label={`Prompt: ${app.promptId}`} size="small" variant="outlined" />
                  <Chip label={`${app.dataSources} sources`} size="small" variant="outlined" />
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create AI App</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Name" fullWidth size="small" />
            <TextField label="Description" fullWidth size="small" multiline rows={2} />
            <TextField select label="Prompt Template" size="small" fullWidth defaultValue="">
              <MenuItem value="tpl-1">RAG Chat v1</MenuItem>
              <MenuItem value="tpl-2">Asset Analyzer</MenuItem>
            </TextField>
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
