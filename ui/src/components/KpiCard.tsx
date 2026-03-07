import React, { type ReactNode } from "react";
import { Card, CardContent, Typography, Box, Skeleton, alpha } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUpRounded";
import TrendingDownIcon from "@mui/icons-material/TrendingDownRounded";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number; // positive = up, negative = down
  icon?: ReactNode;
  loading?: boolean;
  color?: string;
}

export default function KpiCard({ title, value, subtitle, trend, icon, loading, color }: Props) {
  const trendColor = trend && trend >= 0 ? "#34A853" : "#EA4335";

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
          <Skeleton width={100} height={14} />
          <Skeleton width={80} height={36} sx={{ mt: 1 }} />
          <Skeleton width={120} height={14} sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Typography variant="overline" color="text.secondary">
            {title}
          </Typography>
          {icon && (
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(color ?? "#1A73E8", 0.1),
                color: color ?? "#1A73E8",
                "& svg": { fontSize: 20 },
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
        <Typography variant="h2" sx={{ mt: 1, fontWeight: 700 }}>
          {value}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
          {trend !== undefined && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.25,
                color: trendColor,
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              {trend >= 0 ? <TrendingUpIcon sx={{ fontSize: 14 }} /> : <TrendingDownIcon sx={{ fontSize: 14 }} />}
              {Math.abs(trend)}%
            </Box>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
