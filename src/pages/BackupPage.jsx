import React, { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  //Dialog,
  //DialogActions,
  //DialogContent,
  //DialogTitle,
  FormControlLabel,
  LinearProgress,
  Stack,
  Typography,
  Snackbar,
  Alert,
  Divider,
  Card,
} from "@mui/material";

import BackupIcon from "@mui/icons-material/Backup";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../firebase";

const BACKUP_KEYS = [
  { key: "LOP", label: "Danh sách lớp" },
  { key: "KETQUA", label: "Kết quả đánh giá" },
  { key: "NGANHANG_DE", label: "Đề KTĐK" },
  { key: "DETHI", label: "Đề thi" },
];

export default function BackupPage({ open, onClose, config }) {
  const [backupOptions, setBackupOptions] = useState(
    BACKUP_KEYS.reduce((acc, { key }) => ({
      ...acc,
      [key]: true,
    }), {})
  );

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const toggleOption = (key) => {
    setBackupOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const exportBackupToJson = (data, backupOptions) => {
    if (!data || Object.keys(data).length === 0) return;

    const selectedCollections = Object.keys(backupOptions).filter(
      (k) => backupOptions[k]
    );

    const collectionsName =
      selectedCollections.length === BACKUP_KEYS.length
        ? "full"
        : selectedCollections.join("_");

    const now = new Date();

    const pad = (n) => n.toString().padStart(2, "0");

    const timestamp = `${pad(now.getDate())}-${pad(
      now.getMonth() + 1
    )}-${now
      .getFullYear()
      .toString()
      .slice(-2)} (${pad(now.getHours())}:${pad(
      now.getMinutes()
    )}:${pad(now.getSeconds())})`;

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      {
        type: "application/json",
      }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = `Sao_luu_TracNghiem_LVB_${timestamp}.json`;

    a.click();
  };

  /*const backupLAMVANBEN = async () => {
    const data = {};

    // =========================
    // 📄 Document: lop
    // =========================
    const lopSnap = await getDoc(
      doc(db, "LAMVANBEN", "lop")
    );

    if (lopSnap.exists()) {
      data.lop = lopSnap.data();
    }

    // lấy danh sách lớp động
    const classCollections =
      lopSnap.exists() &&
      Array.isArray(lopSnap.data().list)
        ? lopSnap.data().list
        : [];

    // =========================
    // 📚 Cuối kỳ I + Cuối năm
    // =========================
    const examDocs = [
      {
        firestoreName: "Cuối kỳ I",
        backupKey: "Cuoi_ky_I",
      },
      {
        firestoreName: "Cuối năm",
        backupKey: "Ca_nam",
      },
    ];

    for (const exam of examDocs) {

      backupData.LAMVANBEN[
        exam.backupKey
      ] = {};

      // chạy song song tất cả lớp
      await Promise.all(

        classCollections.map(
          async (className) => {

            const studentsSnap =
              await getDocs(
                collection(
                  db,
                  "LAMVANBEN",
                  exam.firestoreName,
                  className
                )
              );

            if (!studentsSnap.empty) {

              const classData = {};

              studentsSnap.forEach(
                (studentDoc) => {

                  classData[
                    studentDoc.id
                  ] = studentDoc.data();
                }
              );

              backupData.LAMVANBEN[
                exam.backupKey
              ][className] = classData;
            }
          }
        )
      );
    }

    return data;
  };*/

  const backupSimpleCollection = async (collectionName) => {
    const data = {};

    const snap = await getDocs(
      collection(db, collectionName)
    );

    snap.forEach((d) => {
      data[d.id] = d.data();
    });

    return data;
  };

  const fetchAllBackup = async (onProgress, selectedCollections) => {
    const backupData = {};

    const namHocRaw = config?.namHoc || "2025-2026";
    const namHocKey = namHocRaw.replaceAll("-", "_");

    let progress = 0;
    const step = 100 / selectedCollections.length;

    const getClassList = async () => {
      const snap = await getDoc(
        doc(db, "DANHSACH_LOP", namHocKey)
      );
      return snap.exists() ? snap.data().list || [] : [];
    };

    const classList = await getClassList();

    for (const col of selectedCollections) {

      // =========================
      // 📦 DANH SÁCH LỚP + HỌC SINH
      // =========================
      if (col === "LOP") {

        // 1. lớp
        const lopSnap = await getDoc(
          doc(db, "DANHSACH_LOP", namHocKey)
        );

        backupData.DANHSACH_LOP = {
          [namHocKey]: lopSnap.exists()
            ? lopSnap.data()
            : { list: [] }
        };

        // 2. học sinh theo lớp
        backupData.DS_HOCSINH = {
          [namHocKey]: {}
        };

        await Promise.all(
          classList.map(async (lop) => {
            const snap = await getDocs(
              collection(
                db,
                `DS_HOCSINH_${namHocKey}`,
                lop,
                "STUDENTS"
              )
            );

            const data = {};
            snap.forEach(d => {
              data[d.id] = d.data();
            });

            backupData.DS_HOCSINH[namHocKey][lop] = data;
          })
        );
      }

      // =========================
      // 📊 KẾT QUẢ ĐÁNH GIÁ
      // =========================
      else if (col === "KETQUA") {

        backupData.DATA_KTDK = {
          [namHocKey]: {}
        };

        backupData.DATA_ONTAP = {
          [namHocKey]: {}
        };

        const hocKyList = ["Cuối kỳ I", "Cuối năm"];

        await Promise.all(
          hocKyList.map(async (hocKy) => {

            backupData.DATA_KTDK[namHocKey][hocKy] = {};
            backupData.DATA_ONTAP[namHocKey][hocKy] = {};

            await Promise.all(
              classList.map(async (lop) => {

                const ktdkSnap = await getDocs(
                  collection(
                    db,
                    `DATA_KTDK_${namHocKey}`,
                    hocKy,
                    lop
                  )
                );

                const ontapSnap = await getDocs(
                  collection(
                    db,
                    `DATA_ONTAP_${namHocKey}`,
                    hocKy,
                    lop
                  )
                );

                const ktdkData = {};
                ktdkSnap.forEach(d => {
                  ktdkData[d.id] = d.data();
                });

                const ontapData = {};
                ontapSnap.forEach(d => {
                  ontapData[d.id] = d.data();
                });

                backupData.DATA_KTDK[namHocKey][hocKy][lop] = ktdkData;
                backupData.DATA_ONTAP[namHocKey][hocKy][lop] = ontapData;
              })
            );
          })
        );
      }

      // =========================
      // 🧪 NGÂN HÀNG ĐỀ
      // =========================
      else if (col === "NGANHANG_DE") {
        backupData.NGANHANG_DE =
          await backupSimpleCollection("NGANHANG_DE");
      }

      // =========================
      // 📝 ĐỀ THI
      // =========================
      else if (col === "DETHI") {

        backupData.DETHI =
          await backupSimpleCollection("DETHI");
      }

      progress += step;
      onProgress?.(Math.min(progress, 99));
    }

    onProgress?.(100);
    return backupData;
  };

  const handleBackup = async () => {
    const selected = Object.keys(
      backupOptions
    ).filter((k) => backupOptions[k]);

    if (selected.length === 0) {
      setSnackbar({
        open: true,
        severity: "warning",
        message:
          "Vui lòng chọn ít nhất một dữ liệu để sao lưu",
      });

      return;
    }

    try {
      setLoading(true);
      setProgress(0);

      const data = await fetchAllBackup(
        setProgress,
        selected
      );

      exportBackupToJson(data, backupOptions);

      setSnackbar({
        open: true,
        severity: "success",
        message:
          "✅ Sao lưu dữ liệu thành công",
      });

      onClose();

    } catch (err) {
      console.error(err);

      setSnackbar({
        open: true,
        severity: "error",
        message:
          "❌ Lỗi khi sao lưu dữ liệu",
      });

    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

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
          py: 1.6, // 👈 giống Dialog mẫu
          background: "#1976d2",
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
              fontSize: 16,   // 👈 giảm về giống Dialog
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            💾 Sao lưu dữ liệu
          </Typography>

          <IconButton
            onClick={onClose}
            sx={{
              color: "#fff",
              p: 0.5, // 👈 giống Dialog
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
          {/* ===== HỌC SINH ===== */}
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
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      backupOptions["LOP"]
                    }
                    onChange={() =>
                      toggleOption("LOP")
                    }
                  />
                }
                label="Danh sách lớp"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      backupOptions[
                        "KETQUA"
                      ]
                    }
                    onChange={() =>
                      toggleOption(
                        "KETQUA"
                      )
                    }
                  />
                }
                label="Kết quả đánh giá"
              />
            </Stack>
          </Box>

          {/* ===== NGÂN HÀNG ĐỀ ===== */}
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
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      backupOptions[
                        "NGANHANG_DE"
                      ]
                    }
                    onChange={() =>
                      toggleOption(
                        "NGANHANG_DE"
                      )
                    }
                  />
                }
                label="Đề KTĐK"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      backupOptions[
                        "DETHI"
                      ]
                    }
                    onChange={() =>
                      toggleOption(
                        "DETHI"
                      )
                    }
                  />
                }
                label="Đề thi"
              />
            </Stack>
          </Box>

          {/* ===== PROGRESS ===== */}
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
                Đang sao lưu dữ liệu...
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
                {Math.round(progress)}%
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
            startIcon={<BackupIcon />}
            onClick={handleBackup}
            disabled={loading}
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
            Sao lưu
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