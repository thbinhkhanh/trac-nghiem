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
  config,
  showSnackbar,
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

      const json = JSON.parse(await file.text());

      const checked = {};
      const disabled = {};

      // =========================
      // LỚP
      // =========================
      const hasLOP =
        json.DANHSACH_LOP &&
        Object.keys(json.DANHSACH_LOP).length > 0;

      checked.LOP = hasLOP;
      disabled.LOP = !hasLOP;

      // =========================
      // HỌC SINH
      // =========================
      const hasHS =
        json.DS_HOCSINH &&
        Object.keys(json.DS_HOCSINH).length > 0;

      checked.LOP = checked.LOP || hasHS;

      // =========================
      // KẾT QUẢ
      // =========================
      const hasKETQUA =
        json.DATA_KTDK ||
        json.DATA_ONTAP;

      const hasKETQUA_REAL =
        (json.DATA_KTDK &&
          Object.keys(json.DATA_KTDK).length > 0) ||
        (json.DATA_ONTAP &&
          Object.keys(json.DATA_ONTAP).length > 0);

      checked.KETQUA = !!hasKETQUA_REAL;
      disabled.KETQUA = !hasKETQUA_REAL;

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
      const selectedKeys = Object.keys(restoreOptions).filter(
        (k) => restoreOptions[k]
      );

      if (!selectedFile || selectedKeys.length === 0) {
        setSnackbar({
          open: true,
          severity: "warning",
          message: "⚠️ Vui lòng chọn file và dữ liệu cần phục hồi",
        });
        return;
      }

      setLoading(true);
      setProgress(0);

      const json = JSON.parse(await selectedFile.text());
      const namHocKey = (config?.namHoc || "2025-2026").replaceAll("-", "_");

      let done = 0;
      const updateProgress = (step = 1) => {
        done += step;
        setProgress((done / 100) * 100);
      };

      // ================= LỚP =================
      if (selectedKeys.includes("LOP")) {
        await commitBatchArray(
          [
            {
              ref: doc(db, "DANHSACH_LOP", namHocKey),
              data: json.DANHSACH_LOP?.[namHocKey] || {},
            },
          ],
          updateProgress
        );

        const hs = json.DS_HOCSINH?.[namHocKey] || {};
        const ops = [];

        Object.keys(hs).forEach((lop) => {
          Object.keys(hs[lop] || {}).forEach((studentId) => {
            ops.push({
              ref: doc(
                db,
                `DS_HOCSINH_${namHocKey}`,
                lop,
                "STUDENTS",
                studentId
              ),
              data: hs[lop][studentId],
            });
          });
        });

        if (ops.length) {
          await commitBatchArray(ops, updateProgress);
        }
      }

      // ================= KẾT QUẢ =================
      if (selectedKeys.includes("KETQUA")) {
        const ktdk = json.DATA_KTDK?.[namHocKey] || {};
        const ontap = json.DATA_ONTAP?.[namHocKey] || {};

        const ops = [];

        ["Cuối kỳ I", "Cuối năm"].forEach((hk) => {
          Object.keys(ktdk[hk] || {}).forEach((lop) => {
            Object.keys(ktdk[hk][lop] || {}).forEach((id) => {
              ops.push({
                ref: doc(db, `DATA_KTDK_${namHocKey}`, hk, lop, id),
                data: ktdk[hk][lop][id],
              });
            });
          });

          Object.keys(ontap[hk] || {}).forEach((lop) => {
            Object.keys(ontap[hk][lop] || {}).forEach((id) => {
              ops.push({
                ref: doc(db, `DATA_ONTAP_${namHocKey}`, hk, lop, id),
                data: ontap[hk][lop][id],
              });
            });
          });
        });

        if (ops.length) {
          await commitBatchArray(ops, updateProgress);
        }
      }

      // ================= NGÂN HÀNG ĐỀ =================
      if (selectedKeys.includes("NGANHANG_DE")) {
        await restoreSimpleCollection(
          "NGANHANG_DE",
          json.NGANHANG_DE || {},
          updateProgress
        );
      }

      // ================= ĐỀ THI =================
      if (selectedKeys.includes("DETHI")) {
        await restoreSimpleCollection(
          "DETHI",
          json.DETHI || {},
          updateProgress
        );
      }

      // ================= SUCCESS =================
      setProgress(100);

      setSnackbar({
        open: true,
        severity: "success",
        message: "✅ Phục hồi dữ liệu thành công",
      });

      // giữ UI 1000ms để snackbar kịp render
      setTimeout(() => {
        onClose();
      }, 1000);

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
                  border: "1px solid #e2e8f0",
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
                  Đang phục hồi dữ liệu...
                </Typography>

                <LinearProgress
                  variant="indeterminate"
                  sx={{
                    height: 5,
                    borderRadius: 999,
                  }}
                />
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
              sx={{
                textTransform: "none",
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
                textTransform: "none",
                borderRadius: "12px",
                fontWeight: 700,
                boxShadow: "none",
                px: 2.5,
                py: 1,

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