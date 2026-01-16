// src/dialog/OpenExamDialog.jsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Button,
  Stack,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

/* ================== Helpers ================== */

// Format tên đề (KTĐK)
const formatExamTitle = (examName = "") => {
  if (!examName) return "";
  let name = examName.startsWith("quiz_") ? examName.slice(5) : examName;
  return name.replace(/_/g, " ");
};

// Lấy năm học từ ID: "26-27" -> "2026-2027"
const getExamYearFromId = (examId) => {
  const match = examId.match(/(\d{2}-\d{2})/);
  if (!match) return "";
  const [a, b] = match[1].split("-");
  return `20${a}-20${b}`;
};

/* ================== Component ================== */

const OpenExamDialog = ({
  open,
  onClose,
  filterClass,
  setFilterClass,
  filterYear,
  setFilterYear,
  classes,
  loadingList,
  docList,
  selectedDoc,
  setSelectedDoc,
  handleOpenSelectedDoc,
  handleDeleteSelectedDoc,
}) => {
  const years = ["2025-2026", "2026-2027", "2027-2028", "2028-2029", "2029-2030"];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: 6,
          bgcolor: "#f9f9f9",
          overflow: "hidden",
          height: 500, // ✅ GIỐNG MẪU
        },
      }}
    >
      {/* ===== HEADER ===== */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(to right, #1976d2, #42a5f5)",
          color: "#fff",
          px: 2,
          py: 1.2,
        }}
      >
        <Typography sx={{ fontWeight: "bold", fontSize: "1.1rem" }}>
          📂 Danh sách đề
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ===== CONTENT ===== */}
      <DialogContent
        dividers
        sx={{
          px: 2,
          py: 2,
          bgcolor: "#fff",
          display: "flex",
          flexDirection: "column",
          height: 380,
        }}
      >
        {/* ===== FILTER ===== */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          {/* Lọc lớp */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Lọc theo lớp
            </Typography>
            <FormControl size="small" fullWidth>
              <Select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <MenuItem value="Tất cả">Tất cả</MenuItem>
                {classes.map((lop) => (
                  <MenuItem key={lop} value={lop}>
                    {lop}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Năm học */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Năm học
            </Typography>
            <FormControl size="small" fullWidth>
              <Select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <MenuItem value="Tất cả">Tất cả</MenuItem>
                {years.map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Stack>

        {/* ===== LIST ===== */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            border: "1px solid #ccc",
            borderRadius: 2,
          }}
        >
          {loadingList ? (
            <Typography align="center" sx={{ p: 2, color: "gray" }}>
              ⏳ Đang tải danh sách đề...
            </Typography>
          ) : docList.length === 0 ? (
            <Typography align="center" sx={{ p: 2, color: "gray" }}>
              Không có đề nào.
            </Typography>
          ) : (
            docList
              .filter((doc) =>
                filterClass === "Tất cả" ? true : doc.class === filterClass
              )
              .filter((doc) =>
                filterYear === "Tất cả"
                  ? true
                  : getExamYearFromId(doc.id) === filterYear
              )
              .map((doc) => (
                <Stack
                  key={doc.id}
                  direction="row"
                  alignItems="center"
                  sx={{
                    px: 1,
                    py: 0.5,
                    height: 36,
                    cursor: "pointer",
                    borderRadius: 1,
                    backgroundColor:
                      selectedDoc === doc.id ? "#E3F2FD" : "transparent",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                  onClick={() => setSelectedDoc(doc.id)}
                  onDoubleClick={() => handleOpenSelectedDoc(doc.id)}
                >
                  <Typography variant="subtitle1">
                    {formatExamTitle(doc.id)}
                  </Typography>
                </Stack>
              ))
          )}
        </Box>
      </DialogContent>

      {/* ===== ACTIONS ===== */}
      <DialogActions sx={{ justifyContent: "center", gap: 1.5, pb: 2 }}>
        <Button
          variant="contained"
          disabled={!selectedDoc}
          onClick={() => handleOpenSelectedDoc(selectedDoc)}
        >
          Mở đề
        </Button>
        <Button
          variant="outlined"
          color="error"
          disabled={!selectedDoc}
          onClick={handleDeleteSelectedDoc}
        >
          Xóa đề
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OpenExamDialog;
