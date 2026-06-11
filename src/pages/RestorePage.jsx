import React, { useEffect, useRef, useState } from "react";

import {
  //Dialog,
  //DialogTitle,
  //DialogContent,
  //DialogActions,
  IconButton,
  Button,
  Stack,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Typography,
  Snackbar,
  Alert,
  Divider,
  Box,
  Card,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import RestoreIcon from "@mui/icons-material/Restore";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import RestorePageIcon from "@mui/icons-material/RestorePage";

import {
  doc,
  setDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase";

const BACKUP_KEYS = [
  { key: "HOCSINH", label: "Học sinh" },
  { key: "NGANHANG_DE", label: "Đề KTĐK" },
  { key: "DETHI", label: "Đề thi" },
];

export default function RestorePage({
  open,
  onClose,
  config,
  showSnackbar,
}) {

  const namHocKey = (config?.namHoc || "2025-2026").replace(/-/g, "_");
  const fileInputRef = useRef(null);

  const [restoreOptions, setRestoreOptions] =
    useState({});

  const [disabledOptions, setDisabledOptions] =
    useState({});

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [snackbar, setSnackbar] =
    useState({
      open: false,
      message: "",
      severity: "success",
    });

  // =========================
  // RESET
  // =========================
  useEffect(() => {
    if (open) {
      const checked = {};
      const disabled = {};

      BACKUP_KEYS.forEach(({ key }) => {
        checked[key] = false;
        disabled[key] = true;
      });

      setRestoreOptions(checked);
      setDisabledOptions(disabled);

      setSelectedFile(null);
      setProgress(0);
      setLoading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  // =========================
  // CHECKBOX
  // =========================
  const toggleOption = (key) => {
    setRestoreOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // =========================
  // CHỌN FILE
  // =========================
  const handleFileChange = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      setSelectedFile(file);

      const json = JSON.parse(await file.text());

      const checked = {};
      const disabled = {};

      // =========================
      // HỌC SINH
      // =========================
      const hocSinhKey = Object.keys(json).find(
        key => key.startsWith("DATA_HOCSINH")
      );

      const hasHS =
        hocSinhKey &&
        Object.keys(json[hocSinhKey]).length > 0;

      checked.HOCSINH = !!hasHS;
      disabled.HOCSINH = !hasHS;

      // =========================
      // NGÂN HÀNG ĐỀ
      // =========================
      const hasNGANHANG =
        json.NGANHANG_DE &&
        Object.keys(json.NGANHANG_DE).length > 0;

      checked.NGANHANG_DE = !!hasNGANHANG;
      disabled.NGANHANG_DE = !hasNGANHANG;

      // =========================
      // ĐỀ THI
      // =========================
      const hasDETHI =
        json.DETHI &&
        Object.keys(json.DETHI).length > 0;

      checked.DETHI = !!hasDETHI;
      disabled.DETHI = !hasDETHI;

      setRestoreOptions(checked);
      setDisabledOptions(disabled);

    } catch (err) {
      console.error(err);

      setSnackbar({
        open: true,
        severity: "error",
        message: "❌ File phục hồi không hợp lệ",
      });
    }
  };

  // =========================
  // GHI BATCH
  // =========================
  const commitBatchArray = async (
    operations,
    onProgress
  ) => {

    const CHUNK_SIZE = 450;

    for (
      let i = 0;
      i < operations.length;
      i += CHUNK_SIZE
    ) {

      const chunk = operations.slice(
        i,
        i + CHUNK_SIZE
      );

      const batch = writeBatch(db);

      chunk.forEach((item) => {
        batch.set(item.ref, item.data, {
          merge: true,
        });
      });

      await batch.commit();

      if (onProgress) {
        onProgress(chunk.length);
      }
    }
  };

  // =========================
  // COLLECTION THƯỜNG
  // =========================
  const restoreSimpleCollection =
    async (
      collectionName,
      data,
      onProgress
    ) => {

      const operations = [];

      Object.keys(data).forEach(
        (docId) => {

          operations.push({
            ref: doc(
              db,
              collectionName,
              docId
            ),

            data: data[docId],
          });
        }
      );

      await commitBatchArray(
        operations,
        onProgress
      );
    };

  // =========================
  // ĐẾM DOC
  // =========================
  const countTotalDocs = (
    jsonData,
    selectedKeys
  ) => {

    let total = 0;

    // =========================
    // HỌC SINH
    // =========================
    if (selectedKeys.includes("HOCSINH")) {

      const hocSinhKey = Object.keys(jsonData).find(
        key => key.startsWith("DATA_HOCSINH")
      );

      if (hocSinhKey) {

        Object.values(jsonData[hocSinhKey]).forEach(
          students => {

            total += Object.keys(students).length;

          }
        );

      }
    }

    // =========================
    // NGANHANG_DE
    // =========================
    if (
      selectedKeys.includes(
        "NGANHANG_DE"
      ) &&
      jsonData.NGANHANG_DE
    ) {

      total += Object.keys(
        jsonData.NGANHANG_DE
      ).length;
    }

    // =========================
    // DETHI
    // =========================
    if (
      selectedKeys.includes(
        "DETHI"
      ) &&
      jsonData.DETHI
    ) {

      total += Object.keys(
        jsonData.DETHI
      ).length;
    }

    return total;
  };

  // =========================
  // PHỤC HỒI
  // =========================
  const handleRestore = async () => {

    const selectedKeys = Object.keys(
      restoreOptions
    ).filter((k) => restoreOptions[k]);

    if (!selectedFile) {
      setSnackbar({
        open: true,
        severity: "warning",
        message: "Vui lòng chọn file backup",
      });
      return;
    }

    if (selectedKeys.length === 0) {
      setSnackbar({
        open: true,
        severity: "warning",
        message: "Chọn ít nhất 1 nhóm dữ liệu",
      });
      return;
    }

    try {

      setLoading(true);
      setProgress(0);

      const text = await selectedFile.text();

      const jsonData = JSON.parse(text);

      // =========================
      // ĐẾM TỔNG DOC
      // =========================
      const totalDocs = countTotalDocs(
        jsonData,
        selectedKeys
      );

      let done = 0;
      let lastUpdate = 0;

      const updateProgress = () => {

        const now = Date.now();

        if (now - lastUpdate < 50) return;

        lastUpdate = now;

        setProgress(
          Math.round(
            (done / totalDocs) * 100
          )
        );
      };

      // =========================
      // HỌC SINH (Batch)
      // =========================
      if (selectedKeys.includes("HOCSINH")) {

        const hocSinhKey = Object.keys(jsonData).find(
          key => key.startsWith("DATA_HOCSINH")
        );

        if (hocSinhKey) {

          const operations = [];

          for (const [lop, students] of Object.entries(
            jsonData[hocSinhKey]
          )) {

            for (const [studentId, value] of Object.entries(
              students
            )) {

              operations.push({
                ref: doc(
                  db,
                  hocSinhKey,
                  lop,
                  "STUDENTS",
                  studentId
                ),
                data: value,
              });

            }
          }

          await commitBatchArray(
            operations,
            (count) => {
              done += count;
              updateProgress();
            }
          );
        }
      }

      // =========================
      // NGÂN HÀNG ĐỀ
      // =========================
      if (
        selectedKeys.includes(
          "NGANHANG_DE"
        ) &&
        jsonData.NGANHANG_DE
      ) {

        for (const [docId, value] of Object.entries(
          jsonData.NGANHANG_DE
        )) {

          await setDoc(
            doc(
              db,
              "NGANHANG_DE",
              docId
            ),
            value,
            {
              merge: true,
            }
          );

          done++;

          updateProgress();
        }
      }

      // =========================
      // ĐỀ THI
      // =========================
      if (
        selectedKeys.includes(
          "DETHI"
        ) &&
        jsonData.DETHI
      ) {

        for (const [docId, value] of Object.entries(
          jsonData.DETHI
        )) {

          await setDoc(
            doc(
              db,
              "DETHI",
              docId
            ),
            value,
            {
              merge: true,
            }
          );

          done++;

          updateProgress();
        }
      }

      setProgress(100);

      setSnackbar({
        open: true,
        severity: "success",
        message: "✅ Phục hồi dữ liệu thành công",
      });

      onClose();

    } catch (err) {

      console.error(err);

      setSnackbar({
        open: true,
        severity: "error",
        message: "❌ Lỗi khi phục hồi dữ liệu",
      });

    } finally {

      setLoading(false);

    }
  };

  const hasAnyChecked =
    Object.values(
      restoreOptions
    ).some(Boolean);

  return (
  <>
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: { xs: "90%", sm: "60%" },
          borderRadius: "14px",
          overflow: "hidden",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          boxShadow:
            "0 10px 35px rgba(0,0,0,0.12)",
        }}
      >
        {/* ===== HEADER ===== */}
        <Box
          sx={{
            px: 3,
            py: 2,                 // Đồng bộ py: 2 cho không gian thoáng rộng
            background: "#1976d2",
            color: "#fff",
            position: "relative",  // Làm gốc tọa độ để căn tuyệt đối nút X
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* TITLE - Chỉ dùng duy nhất một thẻ Typography phẳng */}
          <Typography
            sx={{
              fontSize: 17,        // Đồng bộ fontSize: 17 chuẩn theo hệ thống mới
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            Phục hồi dữ liệu
          </Typography>

          {/* CLOSE BUTTON - Căn phải sát viền và tăng vùng bấm chuột */}
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 12,           // Căn phải sát mép viền
              color: "#f1f5f9",
              p: 1,                // Tăng padding lên 1 để vòng tròn hover to, dễ bấm
              "&:hover": {
                backgroundColor: "#fff",
                color: "#ef4444",
              },
              transition: "all 0.2s ease",
            }}
          >
            {/* Sử dụng fontSize="medium" để dấu X to rõ ràng hơn */}
            <CloseIcon fontSize="medium" />
          </IconButton>
        </Box>

        {/* ===== CONTENT ===== */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            bgcolor: "#f8fafc",
          }}
        >
          <Stack spacing={2}>
            {/* CHỌN FILE */}
            <Box
              sx={{
                p: 2,
                borderRadius: "5px",
                bgcolor: "#fff",
                border:
                  "1px solid #e2e8f0",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 700,
                  mb: 1.5,
                  color: "#1e293b",
                }}
              >
                File phục hồi
              </Typography>

              <Button
                variant="outlined"
                startIcon={
                  <UploadFileIcon />
                }
                onClick={() =>
                  fileInputRef.current.click()
                }
                sx={{
                  textTransform:
                    "none",
                  borderRadius:
                    "10px",
                  fontWeight: 600,
                }}
              >
                Chọn file JSON
              </Button>

              <input
                hidden
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={
                  handleFileChange
                }
              />

              {selectedFile && (
                <Typography
                  sx={{
                    mt: 1.5,
                    fontSize: 13,
                    color: "#1976d2",
                    fontWeight: 600,
                    wordBreak:
                      "break-all",
                  }}
                >
                  📄{" "}
                  {
                    selectedFile.name
                  }
                </Typography>
              )}
            </Box>
            {/* DỮ LIỆU SAO LƯU */}
            <Box
              sx={{
                p: 1.8,
                borderRadius: "5px",
                bgcolor: "#fff",
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 700,
                  mb: 1,
                  color: "#1e293b",
                }}
              >
                Dữ liệu phục hồi
              </Typography>

              <Stack spacing={0.5}>
                {[
                  "HOCSINH",
                  "NGANHANG_DE",
                  "DETHI",
                ].map((key) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        checked={restoreOptions[key] || false}
                        disabled={disabledOptions[key]}
                        onChange={() => toggleOption(key)}
                      />
                    }
                    label={
                      BACKUP_KEYS.find(
                        (b) => b.key === key
                      )?.label
                    }
                  />
                ))}
              </Stack>
            </Box>

            {/* PROGRESS */}
            {loading && (
              <Box
                sx={{
                  px: 3,
                  pb: 2,
                  mt: 2,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Box sx={{ width: { xs: "100%", md: "100%" } }}>
                  
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 8,
                      borderRadius: 10,
                    }}
                  />

                  <Typography
                    sx={{
                      mt: 1,
                      textAlign: "center",
                      fontSize: 13,
                    }}
                  >
                    Đang phục hồi... {Math.round(progress)}%
                  </Typography>

                </Box>
              </Box>
            )}

          </Stack>
        </Box>

        {/* ===== ACTIONS ===== */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid #e2e8f0",
            bgcolor: "#fff",
          }}
        >
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{
                minWidth: 110,
                height: 42,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                borderColor: "#cbd5e1",
                color: "#475569",
                background: "#fff",
                "&:hover": {
                  borderColor: "#94a3b8",
                  background: "#f1f5f9",
                },
              }}
            >
              Hủy
            </Button>
            
            <Button
              variant="contained"
              startIcon={<RestoreIcon />}
              onClick={handleRestore}
              disabled={loading || !hasAnyChecked}
              sx={{
                minWidth: 130,
                height: 42,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 700,
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                boxShadow: "0 10px 20px rgba(59,130,246,0.25)",

                "&:hover": {
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  boxShadow: "0 12px 24px rgba(37,99,235,0.35)",
                },

                "&.Mui-disabled": {
                  background: "#93c5fd",
                  color: "#fff",
                },
              }}
            >
              Phục hồi
            </Button>
          </Stack>
        </Box>
      </Card>
    </Box>

    {/* ===== Snackbar ===== */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={() =>
        setSnackbar((s) => ({
          ...s,
          open: false,
        }))
      }
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
    >
      <Alert
        severity={snackbar.severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  </>
);
}