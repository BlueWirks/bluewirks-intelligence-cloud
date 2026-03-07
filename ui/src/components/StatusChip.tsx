import React from "react";
import { Chip, type ChipProps } from "@mui/material";
import { alpha } from "@mui/material/styles";

type Preset =
  | "UPLOADED" | "QUEUED" | "PROCESSING" | "INDEXED" | "FAILED"
  | "draft" | "running" | "completed" | "active" | "paused" | "archived"
  | "deployed" | "testing" | "pending" | "stopped"
  | "uploading" | "indexing" | "indexed" | "failed"
  | "published" | "success"
  | "shared" | "namespace" | "dedicated"
  | "primary" | "failover" | "restoring"
  | "enabled" | "disabled";

const COLORS: Record<string, string> = {
  // Status colors
  UPLOADED: "#9AA0A6", QUEUED: "#8AB4F8", PROCESSING: "#FBBC04", INDEXED: "#34A853", FAILED: "#EA4335",
  draft: "#9AA0A6", running: "#8AB4F8", completed: "#34A853", active: "#34A853",
  paused: "#FBBC04", archived: "#80868B", deployed: "#34A853", testing: "#FBBC04",
  pending: "#9AA0A6", stopped: "#EA4335", uploading: "#8AB4F8", indexing: "#FBBC04",
  indexed: "#34A853", failed: "#EA4335", published: "#34A853", success: "#34A853",
  shared: "#8AB4F8", namespace: "#FBBC04", dedicated: "#34A853",
  primary: "#34A853", failover: "#FBBC04", restoring: "#8AB4F8",
  enabled: "#34A853", disabled: "#9AA0A6",
};

interface Props extends Omit<ChipProps, "color"> {
  status: string;
}

export default function StatusChip({ status, ...rest }: Props) {
  const c = COLORS[status] ?? "#9AA0A6";
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        bgcolor: alpha(c, 0.12),
        color: c,
        fontWeight: 600,
        fontSize: "0.6875rem",
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        ...rest.sx,
      }}
      {...rest}
    />
  );
}
