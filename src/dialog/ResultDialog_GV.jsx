import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box,
  Stack,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";

import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import CloseIcon from "@mui/icons-material/Close";

const ResultDialog_GV = ({
  open,
  onClose,
  dialogMode,
  dialogMessage,
  studentResult,
  hasResult,
  choXemDiem,
  configData,
  convertPercentToScore,
}) => {
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const getScore = () => {
    if (configData?.kiemTraDinhKi) {
      return studentResult?.diem ?? "";
    }
    if (configData?.baiTapTuan) {
      return convertPercentToScore(studentResult?.diemTN);
    }
    if (configData?.onTap) {
      return studentResult?.diem ?? "";
    }
    return studentResult?.diem ?? "";
  };

  const studentName =
    (studentResult?.hoVaTen || "Học sinh").trim().normalize("NFC");

  const handleDeleteResult = async () => {
  try {
    const namHocRaw = configData?.namHoc || "2025-2026";
    const namHoc = namHocRaw.replaceAll("-", "_");
    const hocKy = configData?.hocKy || "Cuối năm";
    const lop = studentResult?.lop || "4A";

    const studentKey = (studentResult?.id || studentResult?.hoVaTen || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/_$/, "");

    const ref = doc(
      db,
      `DATA_KTDK_${namHoc}`,
      hocKy,
      lop,
      studentKey
    );

    await deleteDoc(ref);

    setSnackbarMessage("Đã xóa kết quả!");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);

    onClose();

  } catch (err) {
    console.error("❌ Lỗi xóa:", err);
    setSnackbarMessage("Không thể xóa kết quả!");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  }
};

  return (
    <>
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") return;
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
              bgcolor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            🎯
          </Box>

          <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
            KẾT QUẢ
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
      <DialogContent sx={{ px: 3, py: 4, textAlign: "center" }}>
        {dialogMode === "notFound" ? (
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#ef4444" }}>
            {dialogMessage}
          </Typography>
        ) : (
          <Stack spacing={2.5} alignItems="center">
            {/* ICON */}
            <Box
              sx={{
                width: 85,
                height: 85,
                borderRadius: "50%",
                background: "#4caf50",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 36,
              }}
            >
              {hasResult ? "🏆" : "📝"}
            </Box>

            {/* NAME */}
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: 700,
                color: "#0f172a",
                textTransform: "uppercase",
              }}
            >
              {studentName}
            </Typography>

            {/* CLASS */}
            <Typography sx={{ fontSize: 15, color: "#1565c0", fontWeight: 600 }}>
              Lớp: {studentResult?.lop}
            </Typography>

            {/* STATUS */}
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 600,
                color: hasResult ? "#16a34a" : "#dc2626",
              }}
            >
              {hasResult
                ? "Đã hoàn thành bài kiểm tra"
                : "Chưa có kết quả kiểm tra"}
            </Typography>

            {/* SCORE BOX */}
            {hasResult && (
              <Box
                sx={{
                  mt: 1,
                  px: 3,
                  py: 2,
                  borderRadius: "14px",
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  minWidth: 160,
                }}
              >
                <Typography sx={{ fontSize: 13, color: "#64748b" }}>
                  Điểm kiểm tra
                </Typography>

                <Typography
                  sx={{
                    fontSize: 30,
                    fontWeight: 900,
                    color: "#1976d2",
                    minHeight: 40,
                    lineHeight: 1,
                  }}
                >
                  {getScore()}
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                mt: 2,
                display: "flex",
                justifyContent: "center",
              }}
            >
              {hasResult && (
                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Button
                    onClick={() => {
                      setOpenConfirmDelete(true);
                      onClose(); // 👈 QUAN TRỌNG: đóng dialog kết quả
                    }}                    
                    variant="outlined"
                    color="error"
                    size="small"
                    sx={{
                      textTransform: "none",
                      borderRadius: "10px",
                      fontWeight: 600,
                    }}
                  >
                    🗑 Xóa kết quả
                  </Button>
                </Box>
              )}
            </Box>

          </Stack>
        )}
      </DialogContent>
    </Dialog>

    <Dialog
      open={openConfirmDelete}
      onClose={(event, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") return;
        setOpenConfirmDelete(false);
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
          fontFamily:
            '"Segoe UI","Arial","Helvetica","Noto Sans","sans-serif"',
        },
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          px: 3,
          py: 2,
          color: "#fff",
          background: "linear-gradient(135deg, #1976d2, #42a5f5)", // đồng bộ màu app
          position: "relative",
          fontFamily:
            '"Segoe UI","Arial","Helvetica","Noto Sans","sans-serif"',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
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
              fontWeight: 700,
            }}
          >
            ⚠️
          </Box>

          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              fontFamily:
                '"Segoe UI","Arial","Helvetica","Noto Sans","sans-serif"',
            }}
          >
            XÁC NHẬN XÓA
          </Typography>
        </Stack>

        <IconButton
          onClick={() => setOpenConfirmDelete(false)}
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
      <DialogContent
        sx={{
          px: 3,
          py: 4,
          fontFamily:
            '"Segoe UI","Arial","Helvetica","Noto Sans","sans-serif"',
          textAlign: "center",
        }}
      >
        <Stack spacing={2.5} alignItems="center">
          <Typography
            sx={{
              fontSize: 15,
              color: "#64748b",
              fontFamily:
                '"Segoe UI","Arial","Helvetica","Noto Sans","sans-serif"',
              textAlign: "left",
              width: "100%",
              pl: 4, // 👈 lùi trái (spacing MUI)
            }}
          >
            Bạn có chắc chắn muốn xóa kết quả của
          </Typography>

          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 700,
              color: "#0f172a",
              textTransform: "uppercase",
              fontFamily:
                '"Segoe UI","Arial","Helvetica","Noto Sans","sans-serif"',
            }}
          >
            {studentResult?.hoVaTen}
          </Typography>

          <Typography
            sx={{
              fontSize: 13,
              color: "#ef4444",
              fontWeight: 600,
              fontFamily:
                '"Segoe UI","Arial","Helvetica","Noto Sans","sans-serif"',
            }}
          >
            ⚠️ Hành động này không thể hoàn tác
          </Typography>

          {/* BUTTONS */}
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setOpenConfirmDelete(false)}
              sx={{
                minWidth: 110,
                height: 42,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                fontFamily:
                  '"Segoe UI","Arial","Helvetica","Noto Sans","sans-serif"',
              }}
            >
              Hủy
            </Button>

            <Button
              variant="contained"
              color="error"
              onClick={async () => {
                setOpenConfirmDelete(false);
                await handleDeleteResult();
              }}
              sx={{
                minWidth: 140,
                height: 42,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 700,
                background: "linear-gradient(135deg, #1976d2, #42a5f5)",
                boxShadow: "0 10px 20px rgba(25,118,210,0.25)",
                fontFamily:
                  '"Segoe UI","Arial","Helvetica","Noto Sans","sans-serif"',
                "&:hover": {
                  background: "linear-gradient(135deg, #1565c0, #1976d2)",
                },
              }}
            >
              Xóa
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
    
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={3000}
      onClose={() => setSnackbarOpen(false)}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={() => setSnackbarOpen(false)}
        severity={snackbarSeverity}
        sx={{
          width: "100%",
          borderRadius: "8px",
          fontWeight: 600,
          fontFamily:
            '"Segoe UI","Arial","Helvetica","Noto Sans","sans-serif"',

          // nền theo severity (UI giống app bạn)
          background:
            snackbarSeverity === "success"
              ? "linear-gradient(135deg, #16a34a, #22c55e)"
              : snackbarSeverity === "error"
              ? "linear-gradient(135deg, #dc2626, #ef4444)"
              : snackbarSeverity === "warning"
              ? "linear-gradient(135deg, #f59e0b, #f97316)"
              : "linear-gradient(135deg, #2563eb, #60a5fa)",

          color: "#fff",

          // icon trắng
          "& .MuiAlert-icon": {
            color: "#fff",
          },

          // text trắng
          "& .MuiAlert-message": {
            color: "#fff",
          },

          // nút close trắng
          "& .MuiAlert-action": {
            color: "#fff",
          },
        }}
      >
        {snackbarMessage}
      </Alert>
    </Snackbar>

  </>
  );
};

export default ResultDialog_GV;