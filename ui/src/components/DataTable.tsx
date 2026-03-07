import React, { type ReactNode } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TablePagination, Box, Typography, Skeleton,
} from "@mui/material";

export interface Column<T> {
  id: string;
  label: string;
  width?: number | string;
  align?: "left" | "center" | "right";
  render: (row: T, index: number) => ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  page?: number;
  rowsPerPage?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rpp: number) => void;
  emptyMessage?: string;
  rowKey?: (row: T, index: number) => string;
}

export default function DataTable<T>({
  columns, rows, loading, page = 0, rowsPerPage = 25, total,
  onPageChange, onRowsPerPageChange, emptyMessage = "No data", rowKey,
}: Props<T>) {
  if (loading) {
    return (
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((c) => (
                  <TableCell key={c.id} sx={{ width: c.width }}>{c.label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell key={c.id}><Skeleton /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  if (rows.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">{emptyMessage}</Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.id} align={c.align} sx={{ width: c.width }}>{c.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={rowKey ? rowKey(row, idx) : idx}>
                {columns.map((c) => (
                  <TableCell key={c.id} align={c.align}>{c.render(row, idx)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {total != null && onPageChange && (
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => onPageChange(p)}
          onRowsPerPageChange={(e) => onRowsPerPageChange?.(parseInt(e.target.value))}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{ borderTop: 1, borderColor: "divider" }}
        />
      )}
    </Paper>
  );
}
