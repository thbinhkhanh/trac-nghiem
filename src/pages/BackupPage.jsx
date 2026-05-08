import React, { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  Stack,
  Typography,
  Snackbar,
  Alert,
  Divider,
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

export default function BackupPage({ open, onClose }) {
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
    // 📚 Cuối kỳ I + Cả năm
    // =========================
    const examDocs = [
      {
        firestoreName: "Cuối kỳ I",
        backupKey: "Cuoi_ky_I",
      },
      {
        firestoreName: "Cả năm",
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

  const fetchAllBackup = async (
    onProgress,
    selectedCollections
  ) => {
    try {
      const backupData = {};

      if (
        !selectedCollections ||
        selectedCollections.length === 0
      ) {
        return {};
      }

      let progressCount = 0;
      const step = 100 / selectedCollections.length;

      for (const colName of selectedCollections) {

        // =========================
        // 📦 DANH SÁCH LỚP
        // =========================
        if (colName === "LOP") {

          if (!backupData.LAMVANBEN) {
            backupData.LAMVANBEN = {};
          }

          const lopSnap = await getDoc(
            doc(db, "LAMVANBEN", "lop")
          );

          if (lopSnap.exists()) {
            backupData.LAMVANBEN.lop =
              lopSnap.data();
          }
        }

        // =========================
        // 📚 KẾT QUẢ ĐÁNH GIÁ
        // =========================
        else if (colName === "KETQUA") {

          if (!backupData.LAMVANBEN) {
            backupData.LAMVANBEN = {};
          }

          const lopSnap = await getDoc(
            doc(db, "LAMVANBEN", "lop")
          );

          const classCollections =
            lopSnap.exists() &&
            Array.isArray(lopSnap.data().list)
              ? lopSnap.data().list
              : [];

          const examDocs = [
            {
              firestoreName: "Cuối kỳ I",
              backupKey: "Cuoi_ky_I",
            },
            {
              firestoreName: "Cả năm",
              backupKey: "Ca_nam",
            },
          ];

          for (const exam of examDocs) {

            backupData.LAMVANBEN[
              exam.backupKey
            ] = {};

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
        }

        // =========================
        // 📚 NGANHANG_DE
        // =========================
        else if (colName === "NGANHANG_DE") {

          backupData.NGANHANG_DE =
            await backupSimpleCollection(
              "NGANHANG_DE"
            );
        }

        // =========================
        // 📝 DETHI
        // =========================
        else if (colName === "DETHI") {

          backupData.DETHI =
            await backupSimpleCollection(
              "DETHI"
            );
        }

        progressCount += step;

        if (onProgress) {
          onProgress(
            Math.min(
              Math.round(progressCount),
              99
            )
          );
        }
      }

      if (onProgress) onProgress(100);

      return backupData;

    } catch (err) {
      console.error("❌ Lỗi khi backup:", err);
      return {};
    }
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 3,
          bgcolor: "#fff",
          boxShadow:
            "0 4px 12px rgba(33,150,243,0.15)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box
          sx={{
            bgcolor: "#42a5f5",
            color: "#fff",
            borderRadius: "50%",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mr: 1.5,
            fontWeight: "bold",
            fontSize: 18,
          }}
        >
          🗄️
        </Box>

        <DialogTitle
          sx={{
            p: 0,
            fontWeight: "bold",
            color: "#1565c0",
            flex: 1,
          }}
        >
          SAO LƯU DỮ LIỆU
        </DialogTitle>

        <IconButton
          onClick={onClose}
          sx={{
            ml: "auto",
            color: "#f44336",
            "&:hover": {
              bgcolor:
                "rgba(244,67,54,0.1)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent dividers>
        <Stack spacing={1.5}>

          {/* ====== NHÓM 1 ====== */}
          <Typography
            sx={{
              fontSize: "1rem",
              fontWeight: "bold",
              color: "error.main",
            }}
          >
            Học sinh
          </Typography>

          <Box
            sx={{
              ml: 3,
              display: "flex",
              flexDirection: "column",
            }}
          >
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
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* ====== NHÓM 2 ====== */}
          <Typography
            sx={{
              fontSize: "1rem",
              fontWeight: "bold",
              color: "error.main",
            }}
          >
            Ngân hàng đề
          </Typography>

          <Box
            sx={{
              ml: 3,
              display: "flex",
              flexDirection: "column",
            }}
          >
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
                    backupOptions["DETHI"]
                  }
                  onChange={() =>
                    toggleOption("DETHI")
                  }
                />
              }
              label="Đề thi"
            />
          </Box>
        </Stack>
      </DialogContent>

      {loading && (
        <>
          <Box
            sx={{
              width: "50%",
              mx: "auto",
              mt: 3,
            }}
          >
            <LinearProgress
              variant="determinate"
              value={progress}
            />
          </Box>

          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Đang sao lưu... {progress}%
          </Typography>
        </>
      )}

      <DialogActions>
        <Button onClick={onClose}>
          Hủy
        </Button>

        <Button
          variant="contained"
          startIcon={<BackupIcon />}
          onClick={handleBackup}
          disabled={loading}
        >
          Sao lưu
        </Button>
      </DialogActions>
    </Dialog>

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