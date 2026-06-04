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
  { key: "LOP", label: "Danh sách lớp" },
  { key: "KETQUA", label: "Kết quả đánh giá" },
  { key: "NGANHANG_DE", label: "Đề KTĐK" },
  { key: "DETHI", label: "Đề thi" },
];

export default function RestorePage({
  open,
  onClose,
}) {
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

      const text = await file.text();

      const json = JSON.parse(text);

      const checked = {};
      const disabled = {};

      // =========================
      // LAMVANBEN
      // =========================
      const lvb = json.LAMVANBEN || {};

      const hasLOP =
        lvb.lop &&
        Object.keys(lvb.lop).length > 0;

      const hasKETQUA =
        (lvb.Cuoi_ky_I &&
          Object.keys(lvb.Cuoi_ky_I)
            .length > 0) ||
        (lvb.Ca_nam &&
          Object.keys(lvb.Ca_nam)
            .length > 0);

      checked["LOP"] = !!hasLOP;
      disabled["LOP"] = !hasLOP;

      checked["KETQUA"] =
        !!hasKETQUA;

      disabled["KETQUA"] =
        !hasKETQUA;

      // =========================
      // NGANHANG_DE
      // =========================
      const hasNGANHANG =
        json.NGANHANG_DE &&
        Object.keys(json.NGANHANG_DE)
          .length > 0;

      checked["NGANHANG_DE"] =
        !!hasNGANHANG;

      disabled["NGANHANG_DE"] =
        !hasNGANHANG;

      // =========================
      // DETHI
      // =========================
      const hasDETHI =
        json.DETHI &&
        Object.keys(json.DETHI).length >
          0;

      checked["DETHI"] = !!hasDETHI;

      disabled["DETHI"] = !hasDETHI;

      setRestoreOptions(checked);
      setDisabledOptions(disabled);

    } catch (err) {

      console.error(err);

      setSnackbar({
        open: true,
        severity: "error",
        message:
          "❌ File phục hồi không hợp lệ",
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
  // KHÔI PHỤC LAMVANBEN
  // =========================
  const restoreLAMVANBEN = async (
    lvb,
    onProgress
  ) => {

    const operations = [];

    // =========================
    // lop
    // =========================
    if (lvb.lop) {

      operations.push({
        ref: doc(db, "LAMVANBEN", "lop"),
        data: lvb.lop,
      });
    }

    // =========================
    // Cuối kỳ I
    // =========================
    if (lvb.Cuoi_ky_I) {

      Object.keys(lvb.Cuoi_ky_I).forEach(
        (className) => {

          const students =
            lvb.Cuoi_ky_I[className];

          Object.keys(students).forEach(
            (studentId) => {

              operations.push({
                ref: doc(
                  db,
                  "LAMVANBEN",
                  "Cuối kỳ I",
                  className,
                  studentId
                ),

                data:
                  students[studentId],
              });
            }
          );
        }
      );
    }

    // =========================
    // Cuối năm
    // =========================
    if (lvb.Ca_nam) {

      Object.keys(lvb.Ca_nam).forEach(
        (className) => {

          const students =
            lvb.Ca_nam[className];

          Object.keys(students).forEach(
            (studentId) => {

              operations.push({
                ref: doc(
                  db,
                  "LAMVANBEN",
                  "Cuối năm",
                  className,
                  studentId
                ),

                data:
                  students[studentId],
              });
            }
          );
        }
      );
    }

    await commitBatchArray(
      operations,
      onProgress
    );
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
    // LOP
    // =========================
    if (
      selectedKeys.includes("LOP") &&
      jsonData.LAMVANBEN?.lop
    ) {
      total += 1;
    }

    // =========================
    // KETQUA
    // =========================
    if (
      selectedKeys.includes("KETQUA")
    ) {

      const lvb =
        jsonData.LAMVANBEN || {};

      if (lvb.Cuoi_ky_I) {

        Object.keys(
          lvb.Cuoi_ky_I
        ).forEach((className) => {

          total += Object.keys(
            lvb.Cuoi_ky_I[className]
          ).length;
        });
      }

      if (lvb.Ca_nam) {

        Object.keys(
          lvb.Ca_nam
        ).forEach((className) => {

          total += Object.keys(
            lvb.Ca_nam[className]
          ).length;
        });
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
      selectedKeys.includes("DETHI") &&
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

    try {

      const selectedKeys = Object.keys(
        restoreOptions
      ).filter((k) => restoreOptions[k]);

      if (!selectedFile) {

        setSnackbar({
          open: true,
          severity: "warning",
          message:
            "Vui lòng chọn file phục hồi",
        });

        return;
      }

      if (selectedKeys.length === 0) {

        setSnackbar({
          open: true,
          severity: "warning",
          message:
            "Vui lòng chọn dữ liệu cần phục hồi",
        });

        return;
      }

      setLoading(true);

      const text =
        await selectedFile.text();

      const jsonData = JSON.parse(text);

      const totalDocs =
        countTotalDocs(
          jsonData,
          selectedKeys
        );

      let done = 0;

      const updateProgress = (
        amount = 1
      ) => {

        done += amount;

        setProgress(
          Math.min(
            Math.round(
              (done / totalDocs) * 100
            ),
            100
          )
        );
      };

      // =========================
      // LOP
      // =========================
      if (
        selectedKeys.includes("LOP")
      ) {

        await restoreLAMVANBEN(
          {
            lop:
              jsonData.LAMVANBEN?.lop,
          },
          updateProgress
        );
      }

      // =========================
      // KETQUA
      // =========================
      if (
        selectedKeys.includes(
          "KETQUA"
        )
      ) {

        await restoreLAMVANBEN(
          {
            Cuoi_ky_I:
              jsonData.LAMVANBEN
                ?.Cuoi_ky_I,

            Ca_nam:
              jsonData.LAMVANBEN
                ?.Ca_nam,
          },
          updateProgress
        );
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

        await restoreSimpleCollection(
          "NGANHANG_DE",
          jsonData.NGANHANG_DE,
          updateProgress
        );
      }

      // =========================
      // DETHI
      // =========================
      if (
        selectedKeys.includes("DETHI") &&
        jsonData.DETHI
      ) {

        await restoreSimpleCollection(
          "DETHI",
          jsonData.DETHI,
          updateProgress
        );
      }

      setProgress(100);

      setSnackbar({
        open: true,
        severity: "success",
        message:
          "✅ Phục hồi dữ liệu thành công",
      });

      onClose();

    } catch (err) {

      console.error(err);

      setSnackbar({
        open: true,
        severity: "error",
        message:
          "❌ Lỗi khi phục hồi dữ liệu",
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
    <Card
      elevation={0}
      sx={{
        width: "100%",
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
          py: 1.6,
          bgcolor: "#1976d2",
          color: "#fff",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            ♻️ Phục hồi dữ liệu
          </Typography>

          <IconButton
            onClick={onClose}
            sx={{
              color: "#fff",
              p: 0.5,
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
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

          {/* HỌC SINH */}
          <Box
            sx={{
              p: 1.8,
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
                mb: 1,
                color: "#1e293b",
              }}
            >
              Học sinh
            </Typography>

            <Stack spacing={0.5}>
              {[
                "LOP",
                "KETQUA",
              ].map((key) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={
                        restoreOptions[
                          key
                        ] || false
                      }
                      disabled={
                        disabledOptions[
                          key
                        ]
                      }
                      onChange={() =>
                        toggleOption(
                          key
                        )
                      }
                    />
                  }
                  label={
                    BACKUP_KEYS.find(
                      (b) =>
                        b.key ===
                        key
                    )?.label
                  }
                />
              ))}
            </Stack>
          </Box>

          {/* NGÂN HÀNG ĐỀ */}
          <Box
            sx={{
              p: 1.8,
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
                mb: 1,
                color: "#1e293b",
              }}
            >
              Ngân hàng đề
            </Typography>

            <Stack spacing={0.5}>
              {[
                "NGANHANG_DE",
                "DETHI",
              ].map((key) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={
                        restoreOptions[
                          key
                        ] || false
                      }
                      disabled={
                        disabledOptions[
                          key
                        ]
                      }
                      onChange={() =>
                        toggleOption(
                          key
                        )
                      }
                    />
                  }
                  label={
                    BACKUP_KEYS.find(
                      (b) =>
                        b.key ===
                        key
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
                  fontWeight: 600,
                  mb: 1,
                  color: "#1e293b",
                }}
              >
                Đang phục hồi dữ
                liệu...
              </Typography>

              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 999,
                }}
              />

              <Typography
                sx={{
                  mt: 1,
                  fontSize: 13,
                  color: "#64748b",
                  textAlign:
                    "center",
                }}
              >
                {Math.round(
                  progress
                )}
                %
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>

      {/* ===== ACTIONS ===== */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop:
            "1px solid #e2e8f0",
          bgcolor: "#fff",
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          justifyContent="flex-end"
        >
          <Button
            onClick={onClose}
            sx={{
              textTransform:
                "none",
            }}
          >
            Hủy
          </Button>

          <Button
            variant="contained"
            startIcon={
              <RestoreIcon />
            }
            onClick={handleRestore}
            disabled={
              loading ||
              !hasAnyChecked
            }
            sx={{
              textTransform:
                "none",
              borderRadius:
                "12px",
              fontWeight: 700,
              boxShadow: "none",

              "&:hover": {
                boxShadow: "none",
              },
            }}
          >
            Phục hồi
          </Button>
        </Stack>
      </Box>
    </Card>

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