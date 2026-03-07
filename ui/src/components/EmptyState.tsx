import React, { type ReactNode } from "react";
import { Box, Typography, Button } from "@mui/material";
import InboxIcon from "@mui/icons-material/InboxRounded";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 10,
        px: 4,
        textAlign: "center",
      }}
    >
      <Box sx={{ color: "text.disabled", mb: 2, "& svg": { fontSize: 56 } }}>
        {icon ?? <InboxIcon />}
      </Box>
      <Typography variant="h5" sx={{ mb: 0.5 }}>{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mb: 2 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
