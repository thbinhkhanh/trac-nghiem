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

  let name = examName.startsWith("quiz_")
    ? examName.slice(5)
    : examName;

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
  const years = [
    "2025-2026",
    "2026-2027",
    "2027-2028",
    "2028-2029",
    "2029-2030",
  ];

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
          boxShadow:
            "0 10px 35px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* ===== HEADER ===== */}
      <Box
        sx={{
          px: 3,
          py: 1.4,
          background: "#1976d2",
          color: "#fff",
          flexShrink: 0,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography
            sx={{
              fontSize: 17,
              fontWeight: 700,
            }}
          >
            Danh sách đề kiểm tra
          </Typography>

          <IconButton
            onClick={onClose}
            sx={{
              color: "#fff",
              bgcolor:
                "rgba(255,255,255,0.12)",

              "&:hover": {
                bgcolor:
                  "rgba(255,255,255,0.2)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* ===== FILTER ===== */}
      <Box
        sx={{
          px: 3,
          pt: 2.5,
          pb: 2,
          flexShrink: 0,
        }}
      >
        <Stack
          direction="row"
          spacing={2}
        >
          {/* LỚP */}
          <FormControl
            size="small"
            fullWidth
          >
            <Typography
              variant="body2"
              sx={{
                mb: 0.7,
                fontWeight: 600,
                color: "#475569",
              }}
            >
              Lớp
            </Typography>

            <Select
              value={filterClass}
              onChange={(e) =>
                setFilterClass(
                  e.target.value
                )
              }
              sx={{
                bgcolor: "#fff",
                borderRadius: "5px",

                "& .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor:
                      "#dbe2ea",
                  },

                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor:
                      "#1976d2",
                    borderWidth: 2,
                  },
              }}
            >
              <MenuItem value="Tất cả">
                Tất cả
              </MenuItem>

              {classes.map((lop) => (
                <MenuItem
                  key={lop}
                  value={lop}
                >
                  {lop}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* NĂM HỌC */}
          <FormControl
            size="small"
            fullWidth
          >
            <Typography
              variant="body2"
              sx={{
                mb: 0.7,
                fontWeight: 600,
                color: "#475569",
              }}
            >
              Năm học
            </Typography>

            <Select
              value={filterYear}
              onChange={(e) =>
                setFilterYear(
                  e.target.value
                )
              }
              sx={{
                bgcolor: "#fff",
                borderRadius: "5px",

                "& .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor:
                      "#dbe2ea",
                  },

                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor:
                      "#1976d2",
                    borderWidth: 2,
                  },
              }}
            >
              <MenuItem value="Tất cả">
                Tất cả
              </MenuItem>

              {years.map((y) => (
                <MenuItem
                  key={y}
                  value={y}
                >
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* ===== CONTENT ===== */}
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
            borderRadius: "5px",
            bgcolor: "#fff",
            border:
              "1px solid #e2e8f0",
            p: 1.2,

            "&::-webkit-scrollbar": {
              width: 6,
            },

            "&::-webkit-scrollbar-thumb":
              {
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
                justifyContent:
                  "center",
              }}
            >
              <Typography color="text.secondary">
                ⏳ Đang tải danh sách
                đề...
              </Typography>
            </Box>
          ) : docList.length === 0 ? (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
                color: "#94a3b8",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                }}
              >
                Không có đề nào
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {docList
                .filter((doc) =>
                  filterClass ===
                  "Tất cả"
                    ? true
                    : doc.class ===
                      filterClass
                )
                .filter((doc) =>
                  filterYear ===
                  "Tất cả"
                    ? true
                    : getExamYearFromId(
                        doc.id
                      ) === filterYear
                )
                .map((doc) => {
                  const isSelected =
                    selectedDoc ===
                    doc.id;

                  return (
                    <Box
                      key={doc.id}
                      onClick={() =>
                        setSelectedDoc(
                          doc.id
                        )
                      }
                      onDoubleClick={() =>
                        handleOpenSelectedDoc(
                          doc.id
                        )
                      }
                      sx={{
                        p: 1.6,
                        borderRadius:
                          "5px",
                        cursor: "pointer",
                        transition:
                          ".18s",

                        border:
                          isSelected
                            ? "2px solid #1976d2"
                            : "1px solid #e2e8f0",

                        bgcolor:
                          isSelected
                            ? "#f0f7ff"
                            : "#fff",

                        "&:hover": {
                          bgcolor:
                            "#f8fbff",
                          borderColor:
                            "#90caf9",
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
                            color:
                              "#1e293b",
                            lineHeight: 1.5,
                          }}
                        >
                          {formatExamTitle(
                            doc.id
                          )}
                        </Typography>

                        {/* RADIO */}
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius:
                              "50%",

                            border:
                              isSelected
                                ? "5px solid #1976d2"
                                : "2px solid #cbd5e1",

                            transition:
                              ".2s",
                            flexShrink: 0,
                          }}
                        />
                      </Stack>
                    </Box>
                  );
                })}
            </Stack>
          )}
        </Box>
      </DialogContent>

      {/* ===== FOOTER ===== */}
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 1,
          justifyContent:
            "space-between",
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

        <Stack
          direction="row"
          spacing={1.5}
        >
          <Button
            variant="contained"
            disabled={!selectedDoc}
            onClick={() =>
              handleOpenSelectedDoc(
                selectedDoc
              )
            }
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

          <Button
            variant="contained"
            color="error"
            disabled={!selectedDoc}
            onClick={
              handleDeleteSelectedDoc
            }
            sx={{
              textTransform: "none",
              borderRadius: "12px",
              px: 3,
              fontWeight: 700,
              boxShadow: "none",
            }}
          >
            Xóa đề
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default OpenExamDialog;