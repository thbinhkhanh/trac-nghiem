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
  InputLabel
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";

/* ================== Helpers ================== */

const formatExamTitle = (examName = "") => {
  if (!examName) return "";

  let name = examName.startsWith("quiz_")
    ? examName.slice(5)
    : examName;

  return name.replace(/_/g, " ");
};

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

  dialogExamType,
  setDialogExamType,

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

  fetchQuizList, // 🔥 THÊM
}) => {
  const years = [
    "2025-2026",
    "2026-2027",
    "2027-2028",
    "2028-2029",
    "2029-2030",
  ];

  // 🔥 DEBUG
  console.log("DOC LIST:", docList);

  const filteredDocs = docList
  .filter((doc) => {
    const type = (doc.type || "")
      .toString()
      .toLowerCase()
      .trim();

    const normalized =
      type.includes("ktdk") ||
      type.includes("đề ktđk")
        ? "ktdk"
        : type.includes("on") ||
          type.includes("ôn")
        ? "on_tap"
        : type;

    return normalized === dialogExamType;
  })

  .filter((doc) =>
    filterClass === "Tất cả"
      ? true
      : doc.class === filterClass
  )

  .filter((doc) =>
    filterYear === "Tất cả"
      ? true
      : getExamYearFromId(doc.id) === filterYear
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          height: "82vh",
          borderRadius: "14px",
          overflow: "hidden",
          background: "#f8fafc",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* ===== HEADER ===== */}
      <Box sx={{ px: 3, py: 1.4, bgcolor: "#1976d2", color: "#fff" }}>
        <Stack direction="row" justifyContent="space-between">
          <Typography sx={{ fontSize: 17, fontWeight: 700 }}>
            Danh sách đề kiểm tra
          </Typography>

          <IconButton onClick={onClose} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* ===== FILTER ===== */}
      <Box sx={{ px: 3, pt: 2.5, pb: 2 }}>
        <Stack direction="row" spacing={2}>

          {/* ===== LOẠI ĐỀ ===== */}
          <FormControl size="small" fullWidth>
            <InputLabel>Loại đề</InputLabel>

            <Select
              value={dialogExamType}
              label="Loại đề"
              onChange={(e) => {
                const value = e.target.value;

                setDialogExamType(value);

                // 🔥 FETCH LẠI FIRESTORE
                fetchQuizList(value);
              }}
              sx={{ bgcolor: "#fff" }}
            >
              {/*<MenuItem value="Tất cả">Tất cả</MenuItem>*/}
              <MenuItem value="ktdk">Đề KTĐK</MenuItem>
              <MenuItem value="on_tap">Đề ôn tập</MenuItem>
            </Select>
          </FormControl>

          {/* ===== LỚP ===== */}
          <FormControl size="small" fullWidth>
            <InputLabel>Lớp</InputLabel>

            <Select
              value={filterClass}
              label="Lớp"
              onChange={(e) => setFilterClass(e.target.value)}
              sx={{ bgcolor: "#fff" }}
            >
              <MenuItem value="Tất cả">Tất cả</MenuItem>

              {classes.map((lop) => (
                <MenuItem key={lop} value={lop}>
                  {lop}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* ===== NĂM HỌC ===== */}
          <FormControl size="small" fullWidth>
            <InputLabel>Năm học</InputLabel>

            <Select
              value={filterYear}
              label="Năm học"
              onChange={(e) => setFilterYear(e.target.value)}
              sx={{ bgcolor: "#fff" }}
            >
              <MenuItem value="Tất cả">Tất cả</MenuItem>

              {years.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

        </Stack>
      </Box>

      {/* ================= CONTENT ================= */}
      <DialogContent
        sx={{
          flex: 1,
          overflow: "hidden",
          px: 3,
          pt: 0,
          pb: 2,
        }}
      >
        <Box
          sx={{
            height: "100%",
            overflowY: "auto",
            borderRadius: "10px",
            bgcolor: "#fff",
            border: "1px solid #e2e8f0",
            p: 1.2,

            "&::-webkit-scrollbar": {
              width: 6,
            },

            "&::-webkit-scrollbar-thumb": {
              background: "#cbd5e1",
              borderRadius: 999,
            },
          }}
        >
          {loadingList ? (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography>⏳ Đang tải...</Typography>
            </Box>
          ) : (() => {

            // ================= FILTER =================
            const filteredDocs = docList
              .filter((doc) => {
                const type = (doc.type || "")
                  .toString()
                  .toLowerCase()
                  .trim();

                const normalized =
                  type.includes("ktdk") ||
                  type.includes("đề ktđk")
                    ? "ktdk"
                    : type.includes("on") ||
                      type.includes("ôn")
                    ? "on_tap"
                    : type;

                return normalized === dialogExamType;
              })

              .filter((doc) =>
                filterClass === "Tất cả"
                  ? true
                  : doc.class === filterClass
              )

              .filter((doc) =>
                filterYear === "Tất cả"
                  ? true
                  : getExamYearFromId(doc.id) === filterYear
              );

            const hasDocs = filteredDocs.length > 0;

            // ================= EMPTY =================
            if (!filteredDocs.length) {
              return (
                <Box
                  sx={{
                    height: "100%",
                    minHeight: 260,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    color: "#94a3b8",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 46,
                      mb: 1,
                    }}
                  >
                    📂
                  </Typography>

                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: 16,
                    }}
                  >
                    Hiện chưa có đề nào
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 13,
                      mt: 0.5,
                      color: "#94a3b8",
                    }}
                  >
                    Hãy thử thay đổi bộ lọc hoặc tạo đề mới
                  </Typography>
                </Box>
              );
            }

            // ================= LIST =================
            return (
              <Stack spacing={1}>
                {filteredDocs.map((doc) => {
                  const isSelected =
                    selectedDoc === doc.id;

                  return (
                    <Box
                      key={doc.id}
                      onClick={() =>
                        setSelectedDoc(doc.id)
                      }
                      onDoubleClick={() =>
                        handleOpenSelectedDoc(doc.id)
                      }
                      sx={{
                        p: 1.6,
                        borderRadius: "10px",
                        cursor: "pointer",
                        transition: ".18s",

                        border: isSelected
                          ? "2px solid #1976d2"
                          : "1px solid #e2e8f0",

                        bgcolor: isSelected
                          ? "#f0f7ff"
                          : "#fff",

                        "&:hover": {
                          bgcolor: "#f8fbff",
                          borderColor: "#90caf9",
                        },
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                      >
                        <Typography
                          sx={{
                            flex: 1,
                            fontSize: 15,
                            fontWeight: 500,
                            color: "#1e293b",
                            lineHeight: 1.5,
                          }}
                        >
                          {formatExamTitle(doc.id)}
                        </Typography>

                        {/* radio selected */}
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",

                            border: isSelected
                              ? "5px solid #1976d2"
                              : "2px solid #cbd5e1",

                            transition: ".2s",
                            flexShrink: 0,
                          }}
                        />
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            );
          })()}
        </Box>
      </DialogContent>

      {/* ===== FOOTER ===== */}
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 1,
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            textTransform: "none",
            color: "#64748b",
            fontWeight: 600,
          }}
        >
          Đóng
        </Button>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            color="error"
            disabled={!selectedDoc || filteredDocs.length === 0}
            onClick={handleDeleteSelectedDoc}
            startIcon={<DeleteOutlineIcon />}
            sx={{
              textTransform: "none",
              borderRadius: "12px",
              px: 2.5,
              fontWeight: 700,
            }}
          >
            Xóa đề
          </Button>

          <Button
            variant="contained"
            disabled={!selectedDoc || filteredDocs.length === 0}
            onClick={() =>
              handleOpenSelectedDoc(selectedDoc)
            }
            startIcon={<FolderOpenOutlinedIcon />}
            sx={{
              textTransform: "none",
              borderRadius: "12px",
              px: 3,
              fontWeight: 700,
              boxShadow: "none",
            }}
          >
            Mở đề
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default OpenExamDialog;