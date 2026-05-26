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

const SystemLockedDialog = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (
          reason === "backdropClick" ||
          reason === "escapeKeyDown"
        ) {
          return;
        }

        onClose();
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
          py: 2,
          color: "#fff",
          background:
            "linear-gradient(135deg, #1976d2, #42a5f5)",
          position: "relative",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            🔒
          </Box>

          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 0.5,
              fontFamily: "inherit",
            }}
          >
            HỆ THỐNG
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
      <DialogContent
        sx={{
          px: 3,
          py: 4,
          textAlign: "center",
        }}
      >
        <Stack
          spacing={2.5}
          alignItems="center"
        >
          {/* ICON */}
          <Box
            sx={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, #ef4444, #dc2626)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 38,
              boxShadow:
                "0 10px 25px rgba(239,68,68,0.35)",
            }}
          >
            🔒
          </Box>

          {/* TITLE */}
          <Typography
            sx={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0f172a",
              lineHeight: 1.3,
              textTransform: "uppercase",
              letterSpacing: 0.3,
              fontFamily: "inherit",
            }}
          >
            Hệ thống đã bị khóa
          </Typography>

          {/* DESCRIPTION */}
          <Typography
            sx={{
              fontSize: 15,
              color: "#64748b",
              maxWidth: 320,
              lineHeight: 1.7,
              fontFamily: "inherit",
            }}
          >
            Hiện tại giáo viên đã khóa hệ thống.
            <br />
            Vui lòng chờ mở khóa để tiếp tục
            làm bài hoặc sử dụng chức năng.
          </Typography>

          {/* BUTTON */}
          <Button
            variant="contained"
            onClick={onClose}
            sx={{
              mt: 1,
              minWidth: 140,
              height: 44,
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: 15,
              background:
                "linear-gradient(135deg, #ef4444, #dc2626)",
              boxShadow:
                "0 10px 20px rgba(239,68,68,0.25)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, #dc2626, #b91c1c)",
              },
            }}
          >
            Đã hiểu
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default SystemLockedDialog;