import React from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Stack,
  Button,
  IconButton,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function ChangePasswordDialog({
  open,
  onClose,
  newPw,
  confirmPw,
  setNewPw,
  setConfirmPw,
  pwError,
  onSave,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: "18px",
          overflow: "hidden",
          background: "#f8fafc",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        },
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          px: 3,
          py: 1.5,
          color: "#fff",
          background: "linear-gradient(135deg, #1976d2, #42a5f5)",
          position: "relative",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              bgcolor: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            🔐
          </Box>

          <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
            Đổi mật khẩu
          </Typography>
        </Stack>

        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 10,
            top: 10,
            color: "#fff",
            bgcolor: "rgba(255,255,255,0.15)",
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* CONTENT */}
      <DialogContent sx={{ px: 3, py: 4 }}>
        <Stack spacing={2.5}>
          <TextField
            label="Mật khẩu mới"
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            fullWidth
          />

          <TextField
            label="Nhập lại mật khẩu"
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            fullWidth
          />

          {/* chỉ hiển thị lỗi từ parent */}
          {pwError && (
            <Typography color="error" sx={{ fontSize: 14 }}>
              {pwError}
            </Typography>
          )}

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={onClose} variant="outlined">
              Hủy
            </Button>

            <Button variant="contained" onClick={onSave}>
              Lưu
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}