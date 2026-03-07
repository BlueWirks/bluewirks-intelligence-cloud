import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  TextField, Box,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmberRounded";

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  confirmValue?: string; // If set, user must type this to confirm
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  open, title, description, confirmText = "Confirm",
  confirmValue, onConfirm, onCancel, loading,
}: Props) {
  const [typed, setTyped] = useState("");
  const canConfirm = confirmValue ? typed === confirmValue : true;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <WarningAmberIcon color="warning" />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        {confirmValue && (
          <Box>
            <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>
              Type <strong>{confirmValue}</strong> to confirm
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={confirmValue}
              autoFocus
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} variant="text" color="inherit">Cancel</Button>
        <Button
          onClick={() => { onConfirm(); setTyped(""); }}
          variant="contained"
          color="error"
          disabled={!canConfirm || loading}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
