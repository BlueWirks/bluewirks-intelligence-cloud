import React, { type ReactNode } from "react";
import { Box } from "@mui/material";
import PageHeader from "./PageHeader";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function PageShell({ title, subtitle, action, children }: Props) {
  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", width: "100%" }}>
      <PageHeader title={title} subtitle={subtitle} action={action} />
      {children}
    </Box>
  );
}
