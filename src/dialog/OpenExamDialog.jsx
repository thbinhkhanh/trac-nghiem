import React, { useEffect, useMemo } from "react";
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

const normalizeYear = (y) => (y || "").toString().trim();

const formatExamTitle = (examName = "") => {
  if (!examName) return "";

  let name = examName.startsWith("quiz_")
    ? examName.slice(5)
    : examName;

  return name.replace(/_/g, " ");
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

  namHoc, // 👈 YEAR HỆ THỐNG (CONFIG)

  classes,
  loadingList,
  docList,

  selectedDoc,
  setSelectedDoc,

  handleOpenSelectedDoc,
  handleDeleteSelectedDoc,

  fetchQuizList,
}) => {

  /* ================== NORMALIZE DOC ================== */
  const normalizedDocs = useMemo(() => {
    const result = (docList || []).map((doc) => {
      const year = (doc.namHoc || doc.schoolYear || doc.year || "").toString().trim();

      return {
        ...doc,
        namHoc: year,
      };
    });

    return result;
  }, [docList]);

  /* ================== FILTER ================== */
  const filteredDocs = useMemo(() => {
    const systemYear = namHoc || "2026-2027";

    const result = normalizedDocs
      .filter((doc) => {
        const type = (doc.type || "").toLowerCase().trim();

        const normalizedType =
          type.includes("ktdk") || type.includes("đề ktđk")
            ? "ktdk"
            : type.includes("on") || type.includes("ôn")
            ? "on_tap"
            : type;

        return normalizedType === dialogExamType;
      })
      .filter((doc) =>
        filterClass === "Tất cả" ? true : doc.class === filterClass
      )
      .filter((doc) => {
        const match =
          filterYear === "Tất cả"
            ? true
            : normalizeYear(doc.namHoc) === normalizeYear(filterYear);

        return match;
      });

    return result;
  }, [normalizedDocs, dialogExamType, filterClass, filterYear, namHoc]);

  /* ================== RESET KHI MỞ DIALOG ================== */
  useEffect(() => {
    if (!open) return;

    const systemYear = namHoc || "2026-2027";

    setDialogExamType("ktdk");
    setFilterClass("Tất cả");
    setFilterYear(systemYear);
    setSelectedDoc(null);
  }, [open, namHoc]);

  const formatExamTitle = (name = "") => {
    if (!name) return "";

    let clean = name.startsWith("quiz_")
      ? name.slice(5)
      : name;

    clean = clean.replace(/_/g, " ");

    const lop = clean.match(/Lớp\s*(\d+)/i)?.[1];
    const ky = clean.match(/\b(CN|CKI|CKII|GK1|GK2|GKI|GKII)\b/i)?.[1];
    const de = clean.match(/\((.*?)\)/)?.[1];

    if (!lop || !ky) return clean;

    return `Tin học ${lop} - ${ky}${de ? ` (${de})` : ""}`;
  };

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

      {/* HEADER */}
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

      {/* FILTER */}
      <Box sx={{ px: 3, pt: 2.5, pb: 2 }}>
        <Stack direction="row" spacing={2}>

          {/* LOẠI ĐỀ */}
          <FormControl size="small" fullWidth>
            <InputLabel>Loại đề</InputLabel>
            <Select
              value={dialogExamType}
              label="Loại đề"
              onChange={(e) => {
                const value = e.target.value;
                setDialogExamType(value);
                fetchQuizList(value);
              }}
              sx={{ bgcolor: "#fff" }}
            >
              <MenuItem value="ktdk">Đề KTĐK</MenuItem>
              <MenuItem value="on_tap">Đề ôn tập</MenuItem>
            </Select>
          </FormControl>

          {/* LỚP */}
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

          {/* NĂM HỌC */}
          <FormControl size="small" fullWidth>
            <InputLabel>Năm học</InputLabel>
            <Select
              value={filterYear}
              label="Năm học"
              onChange={(e) => setFilterYear(e.target.value)}
              sx={{ bgcolor: "#fff" }}
            >
              <MenuItem value="Tất cả">Tất cả</MenuItem>

              {[
                "2025-2026",
                "2026-2027",
                "2027-2028",
                "2028-2029",
                "2029-2030",
              ].map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

        </Stack>
      </Box>

      {/* CONTENT */}
      <DialogContent
        sx={{
          flex: 1,
          overflow: "hidden",
          px: 3,
          pb: 2,
          pt: 0,
        }}
      >
        {/* KHUNG TRẮNG BAO TOÀN BỘ LIST */}
        <Box
          sx={{
            height: "100%",
            bgcolor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            p: 1.2,
            overflowY: "auto",

            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": {
              background: "#cbd5e1",
              borderRadius: 999,
            },
          }}
        >
          {loadingList ? (
            <Typography>⏳ Đang tải...</Typography>
          ) : filteredDocs.length === 0 ? (
            <Typography sx={{ color: "#94a3b8" }}>
              Không có dữ liệu
            </Typography>
          ) : (
            <Stack spacing={1}>
              {filteredDocs.map((doc) => {
                const isSelected = selectedDoc === doc.id;

                return (
                  <Box
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc.id)}
                    onDoubleClick={() => handleOpenSelectedDoc(doc.id)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.6,
                      borderRadius: "6px",
                      cursor: "pointer",
                      border: isSelected
                        ? "2px solid #1976d2"
                        : "1px solid #e2e8f0",
                      bgcolor: isSelected ? "#f0f7ff" : "#fff",
                      transition: "0.15s",

                      "&:hover": {
                        bgcolor: "#f8fbff",
                        borderColor: "#90caf9",
                      },
                    }}
                  >
                    {/* LEFT */}
                    <Box>
                      <Typography sx={{ fontWeight: 500, fontSize: 16 }}>
                        {formatExamTitle(doc.id)}
                      </Typography>
                    </Box>

                    {/* RADIO RIGHT */}
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: isSelected
                          ? "5px solid #1976d2"
                          : "2px solid #cbd5e1",
                        transition: "0.2s",
                        flexShrink: 0,
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </DialogContent>

      {/* FOOTER */}
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          justifyContent: "space-between",
        }}
      >
        {/* LEFT */}
        <Button onClick={onClose}>
          Đóng
        </Button>

        {/* RIGHT */}
        <Stack direction="row" spacing={1.5}>
          <Button
            color="error"
            disabled={!selectedDoc}
            onClick={handleDeleteSelectedDoc}
            startIcon={<DeleteOutlineIcon />}
          >
            Xóa
          </Button>

          <Button
            variant="contained"
            disabled={!selectedDoc}
            onClick={() => handleOpenSelectedDoc(selectedDoc)}
            startIcon={<FolderOpenOutlinedIcon />}
          >
            Mở đề
          </Button>
        </Stack>
      </DialogActions>

    </Dialog>
  );
};

export default OpenExamDialog;