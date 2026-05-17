// src/dialog/ExamDeleteConfirmDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

const ExamDeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        },
      }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(244, 67, 54, 0.12)",
            }}
          >
            <WarningAmberRoundedIcon
              sx={{
                color: "#f44336",
                fontSize: 22,
              }}
            />
          </Box>

          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 18,
              color: "#d32f2f",
            }}
          >
            Xác nhận xóa
          </Typography>
        </Stack>
      </DialogTitle>

      {/* CONTENT */}
      <DialogContent sx={{ pt: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            lineHeight: 1.7,
            fontSize: 14,
          }}
        >
          Bạn có chắc chắn muốn xóa đề thi này?
          <br />
          Hành động này{" "}
          <Box
            component="span"
            sx={{
              fontWeight: 700,
              color: "#d32f2f",
            }}
          >
            không thể hoàn tác
          </Box>
          .
        </Typography>
      </DialogContent>

      {/* ACTIONS */}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Stack direction="row" spacing={1.5} width="100%">
          <Button
            onClick={onClose}
            variant="outlined"
            fullWidth
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              py: 1,
            }}
          >
            Hủy
          </Button>

          <Button
            onClick={onConfirm}
            variant="contained"
            color="error"
            fullWidth
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              py: 1,
              boxShadow: "none",
            }}
          >
            Xóa
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default ExamDeleteConfirmDialog;