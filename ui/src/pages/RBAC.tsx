import React, { useState } from "react";
import {
  Box, Typography, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Checkbox, FormControlLabel, Paper,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import AddIcon from "@mui/icons-material/AddRounded";
import ShieldIcon from "@mui/icons-material/ShieldRounded";
import { PageShell, DataTable, type Column } from "../components";

const PERM_GROUPS: Record<string, string[]> = {
  Assets: ["assets.read", "assets.write", "assets.delete"],
  Chat: ["chat.read", "chat.write"],
  Retrieval: ["retrieval.query"],
  Generation: ["generation.invoke"],
  Ingestion: ["ingestion.trigger", "ingestion.cancel"],
  Admin: ["admin.roles", "admin.tenants", "admin.export"],
  Scale: ["scale.cost", "scale.metrics", "scale.anomaly", "scale.failover", "scale.loadtest", "scale.webhooks"],
};

interface Role {
  name: string; description: string; permissions: string[];
  system: boolean; createdAt: string;
}

const MOCK_ROLES: Role[] = [
  { name: "admin", description: "Full platform access", permissions: Object.values(PERM_GROUPS).flat(), system: true, createdAt: "2025-01-01" },
  { name: "operator", description: "Operational access without admin", permissions: ["assets.read", "assets.write", "chat.read", "chat.write", "retrieval.query", "generation.invoke", "ingestion.trigger", "scale.cost", "scale.metrics"], system: true, createdAt: "2025-01-01" },
  { name: "viewer", description: "Read-only access", permissions: ["assets.read", "chat.read", "retrieval.query", "scale.cost", "scale.metrics"], system: true, createdAt: "2025-01-01" },
  { name: "ml-engineer", description: "AI/ML pipeline access", permissions: ["assets.read", "retrieval.query", "generation.invoke", "ingestion.trigger", "scale.metrics"], system: false, createdAt: "2025-01-10" },
];

const roleCols: Column<Role>[] = [
  { id: "name", label: "Role", render: (r) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <ShieldIcon sx={{ fontSize: 18, color: r.system ? "#8AB4F8" : "#BDC1C6" }} />
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.name}</Typography>
      {r.system && <Chip label="System" size="small" variant="outlined" color="info" />}
    </Box>
  )},
  { id: "desc", label: "Description", render: (r) => <Typography variant="body2">{r.description}</Typography> },
  { id: "perms", label: "Permissions", render: (r) => (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {r.permissions.length <= 5
        ? r.permissions.map((p) => <Chip key={p} label={p} size="small" variant="outlined" />)
        : <>
            {r.permissions.slice(0, 4).map((p) => <Chip key={p} label={p} size="small" variant="outlined" />)}
            <Chip label={`+${r.permissions.length - 4} more`} size="small" />
          </>
      }
    </Box>
  )},
  { id: "created", label: "Created", width: 100, render: (r) => <Typography variant="body2">{r.createdAt}</Typography> },
];

export default function RBAC() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());

  const togglePerm = (p: string) => setSelectedPerms((prev) => {
    const next = new Set(prev);
    next.has(p) ? next.delete(p) : next.add(p);
    return next;
  });

  return (
    <PageShell
      title="Role-Based Access Control"
      subtitle="Define roles and assign granular permissions"
      action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>Create Role</Button>}
    >
      <DataTable columns={roleCols} rows={MOCK_ROLES} total={MOCK_ROLES.length} page={0} rowsPerPage={25} rowKey={(r) => r.name} />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Role</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Role Name" size="small" fullWidth />
            <TextField label="Description" size="small" fullWidth multiline rows={2} />
            <Typography variant="overline" color="text.secondary">Permissions</Typography>
            <Grid container spacing={2}>
              {Object.entries(PERM_GROUPS).map(([group, perms]) => (
                <Grid key={group} size={{ xs: 12, sm: 6 }}>
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>{group}</Typography>
                    {perms.map((p) => (
                      <FormControlLabel
                        key={p}
                        control={<Checkbox size="small" checked={selectedPerms.has(p)} onChange={() => togglePerm(p)} />}
                        label={<Typography variant="body2" sx={{ fontSize: "0.75rem" }}>{p}</Typography>}
                        sx={{ display: "block", ml: 0, my: -0.25 }}
                      />
                    ))}
                  </Paper>
                </Grid>
              ))}
            </Grid>
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
