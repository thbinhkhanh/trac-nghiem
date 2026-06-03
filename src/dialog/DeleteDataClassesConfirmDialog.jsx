import React from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Stack,
  Button,
  IconButton,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

export default function DeleteDataClassesConfirmDialog({
  open,
  selectedCount,
  selectedClasses = [],
  onClose,
  onConfirm,
}) {
  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        // chặn đóng bằng backdrop / ESC nếu bạn muốn kiểm soát flow
        if (
          reason === "backdropClick" ||
          reason === "escapeKeyDown"
        ) {
          return;
        }

        onClose?.();
      }}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
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
          background: "linear-gradient(135deg, #ef4444, #f97316)",
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
              fontSize: 18,
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            ❓
          </Box>

          <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
            Xác nhận xóa lớp
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
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.25)",
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* CONTENT */}
      <DialogContent sx={{ px: 4, py: 4 }}>
        <Stack spacing={3}>
          <Typography
            sx={{
              fontSize: 15,
              color: "#334155",
              lineHeight: 1.8,
            }}
          >
            {selectedCount === 1 ? (
              <>
                Bạn có chắc chắn muốn xóa lớp{" "}
                <b>{selectedClasses[0]}</b>?
              </>
            ) : (
              <>
                Bạn có chắc chắn muốn xóa{" "}
                <b>{selectedCount}</b> lớp đã chọn?
              </>
            )}
          </Typography>

          <Typography
            sx={{
              color: "#dc2626",
              fontSize: 14,
              lineHeight: 1.8,
              pl: 1,
            }}
          >
            Thao tác này sẽ xóa toàn bộ dữ liệu bài làm của các lớp đã chọn.
            <br />
            Hành động này không thể hoàn tác.
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                minWidth: 110,
                height: 42,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Hủy
            </Button>

            <Button
              variant="contained"
              onClick={onConfirm}
              sx={{
                minWidth: 140,
                height: 42,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 700,
                background: "linear-gradient(135deg, #ef4444, #f97316)",
                boxShadow: "0 10px 20px rgba(239,68,68,0.25)",
                "&:hover": {
                  background: "linear-gradient(135deg, #dc2626, #ef4444)",
                },
              }}
            >
              Xóa vĩnh viễn
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}