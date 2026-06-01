import React, { useState, useEffect } from "react";
import {
  Box, Paper, Typography, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, IconButton, Stack, Tooltip, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Button
} from "@mui/material";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, writeBatch, deleteDoc } from "firebase/firestore";
import { Delete, DeleteForever, FileDownload } from "@mui/icons-material";
import { exportKetQuaExcel } from "../utils/exportKetQuaExcel";
import CloseIcon from "@mui/icons-material/Close";
import ConfirmDialog from "../dialog/ConfirmDialog";
import { syncLamVanBenToKTDK } from "../utils/syncLamVanBenToKTDK";
import { syncMasterHocSinh } from "../utils/syncMasterHocSinh";
import SyncIcon from "@mui/icons-material/Sync";

export default function TongHopKQ() {
  // =========================
  // STATE - FILTER / SELECTION
  // =========================
  const [classesList, setClassesList] = useState([]);
  const [selectedLop, setSelectedLop] = useState("");
  const [selectedMon, setSelectedMon] = useState("Tin học");
  const [hocKi, setHocKi] = useState("");
  const [config, setConfig] = useState(null);

  const [syncing, setSyncing] = useState(false);
  
  // =========================
  // STATE - DATA
  // =========================
  const [results, setResults] = useState([]);
  const [loai, setLoai] = useState("ktdk"); // ktdk | ontap

  // =========================
  // STATE - LOADING
  // =========================
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // =========================
  // STATE - SNACKBAR
  // =========================
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // =========================
  // STATE - DIALOG
  // =========================
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogContent, setDialogContent] = useState("");
  const [dialogAction, setDialogAction] = useState(null);

  // =========================
  // CONSTANTS
  // =========================

  const namHoc =
    config?.namHoc ||
    config?.schoolYear ||
    "2025-2026";

  const examType =
    config?.examType ||
    "ktdk";

  const namHocKey = namHoc.replace(/-/g, "_");

  const folder =
    loai === "ktdk"
      ? `DATA_KTDK_${namHocKey}`
      : `DATA_ONTAP_${namHocKey}`;
  
  useEffect(() => {
    const fetchConfig = async () => {
      const snap = await getDoc(doc(db, "CONFIG", "config"));
      if (snap.exists()) {
        setConfig(snap.data());
      }
    };

    fetchConfig();
  }, []);

  const handleSyncHocSinh = async () => {
    try {
      setSyncing(true);

      await syncMasterHocSinh({
        db,
        namHoc: "2025-2026",
        hocKy: hocKi || "Cuối năm", // ✅ lấy state hocKi, fallback Cuối năm
      });

      setSnackbarSeverity("success");
      setSnackbarMessage("✅ Đồng bộ danh sách học sinh thành công!");
      setSnackbarOpen(true);

      loadResults?.(); // optional safety
    } catch (err) {
      console.error("SYNC HOC SINH ERROR:", err);

      setSnackbarSeverity("error");
      setSnackbarMessage("❌ Đồng bộ thất bại!");
      setSnackbarOpen(true);
    } finally {
      setSyncing(false);
    }
  };

  /*const handleSyncData = () => {
    openConfirmDialog(
      "Đồng bộ dữ liệu",
      "Bạn có chắc muốn đồng bộ LAMVANBEN → DATA KTDK? Dữ liệu có thể bị ghi đè!",
      async () => {
        try {
          setSyncing(true);

          await syncLamVanBenToKTDK({
            db,
            namHoc: "2025-2026",
          });

          setSnackbarSeverity("success");
          setSnackbarMessage("✅ Đồng bộ dữ liệu thành công!");
          setSnackbarOpen(true);
        } catch (err) {
          console.error(err);
          setSnackbarSeverity("error");
          setSnackbarMessage("❌ Đồng bộ thất bại!");
          setSnackbarOpen(true);
        } finally {
          setSyncing(false);
        }
      }
    );
  };*/

  // 🔹 Lấy học kỳ từ CONFIG/config
  useEffect(() => {
    const fetchHocKi = async () => {
      try {
        const configRef = doc(db, "CONFIG", "config"); 
        const configSnap = await getDoc(configRef);
        const hocKiValue = configSnap.exists() ? configSnap.data().hocKy : "GKI";
        setHocKi(hocKiValue);
      } catch (err) {
        console.error("❌ Lỗi khi lấy học kỳ:", err);
        setHocKi("GKI");
      }
    };
    fetchHocKi();
  }, []);


  // Lấy danh sách lớp
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const lopSnap = await getDoc(doc(db, "LAMVANBEN", "lop"));

        const classList = lopSnap.exists()
          ? lopSnap.data().list ?? []
          : [];

        classList.sort((a, b) => a.localeCompare(b));

        setClassesList(classList);
        setSelectedLop(classList[0] || "");
      } catch (err) {
        console.error("Lỗi load lớp:", err);
      }
    };

    fetchClasses();
  }, []);

  // Load kết quả
  const loadResults = async () => {
    if (!selectedLop || !hocKi || !loai) return;

    setLoading(true);

    try {
      const colRef = collection(db, `${folder}/${hocKi}/${selectedLop}`);
      const snapshot = await getDocs(colRef);

      if (snapshot.empty) {
        setResults([]);
        setSnackbarSeverity("warning");
        setSnackbarMessage(`Không tìm thấy kết quả cho lớp ${selectedLop}`);
        setSnackbarOpen(true);
        setLoading(false);
        return;
      }

      let data = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();

        let ngayHienThi = "";
        if (d.ngayKiemTra?.seconds) {
          ngayHienThi = new Date(d.ngayKiemTra.seconds * 1000).toLocaleDateString("vi-VN");
        } else if (typeof d.ngayKiemTra === "string") {
          ngayHienThi = d.ngayKiemTra;
        }
        
        return {
          docId: docSnap.id,
          ...d,
          soLanLam: d.soLanLam ?? "",   // ⭐ THÊM DÒNG NÀY
          ngayHienThi,
        };
      });

      const compareVietnameseName = (a, b) => {
        const namePartsA = a.hoVaTen?.trim().split(" ").reverse() || [];
        const namePartsB = b.hoVaTen?.trim().split(" ").reverse() || [];
        const len = Math.max(namePartsA.length, namePartsB.length);

        for (let i = 0; i < len; i++) {
          const partA = (namePartsA[i] || "").toLowerCase();
          const partB = (namePartsB[i] || "").toLowerCase();
          const cmp = partA.localeCompare(partB, "vi");
          if (cmp !== 0) return cmp;
        }
        return 0;
      };

      data.sort(compareVietnameseName);

      const numberedData = data.map((item, idx) => ({
        stt: idx + 1,
        ...item,
      }));

      setResults(numberedData);
    } catch (err) {
      console.error("❌ Lỗi khi load kết quả:", err);
      setResults([]);
      setSnackbarSeverity("error");
      setSnackbarMessage("❌ Lỗi khi load kết quả!");
      setSnackbarOpen(true);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadResults();
  }, [selectedLop, hocKi, loai]);

  // Xóa lớp
  const handleDeleteClass = () => {
    openConfirmDialog(
      "Xóa kết quả lớp",
      `⚠️ Bạn có chắc muốn xóa kết quả của lớp ${selectedLop}?\nHành động này không thể hoàn tác!`,
      async () => {
        try {
          const colRef = collection(db, `${folder}/${hocKi}/${selectedLop}`);
          const snapshot = await getDocs(colRef);
          if (snapshot.empty) {
            setSnackbarSeverity("warning");
            setSnackbarMessage(`Không có dữ liệu để xóa cho lớp ${selectedLop}!`);
            setSnackbarOpen(true);
            return;
          }
          const batch = writeBatch(db);
          snapshot.docs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
          setResults([]);
          setSnackbarSeverity("success");
          setSnackbarMessage("✅ Đã xóa kết quả của lớp thành công!");
          setSnackbarOpen(true);
        } catch (err) {
          console.error("❌ Lỗi khi xóa lớp:", err);
          setSnackbarSeverity("error");
          setSnackbarMessage("❌ Xóa lớp thất bại!");
          setSnackbarOpen(true);
        }
      }
    );
  };

  // Xóa toàn trường
  const handleDeleteSchoolBySemester = () => {
    openConfirmDialog(
      "Xóa toàn trường",
      `⚠️ Bạn có chắc muốn xóa kết quả của toàn trường?\nHành động này không thể hoàn tác!`,
      async () => {
        try {
          const hocKyRef = doc(db, folder, hocKi);
          const hocKySnap = await getDoc(hocKyRef);
          if (!hocKySnap.exists()) {
            setSnackbarSeverity("warning");
            setSnackbarMessage(`Không có dữ liệu ${hocKi} để xóa!`);
            setSnackbarOpen(true);
            return;
          }
          await deleteDoc(hocKyRef);
          setResults([]);
          setSnackbarSeverity("success");
          setSnackbarMessage(`✅ Đã xóa kết quả ${hocKi} của TOÀN TRƯỜNG`);
          setSnackbarOpen(true);
        } catch (err) {
          console.error("❌ Firestore: Xóa toàn trường thất bại:", err);
          setSnackbarSeverity("error");
          setSnackbarMessage("❌ Lỗi khi xóa toàn trường!");
          setSnackbarOpen(true);
        }
      }
    );
  };

  // Xuất Excel
  const handleExportExcel = () => {
    openConfirmDialog(
      "Xuất Excel",
      `Bạn có muốn xuất kết quả lớp ${selectedLop} ra file Excel không?`,
      () => {
        try {
          if (!results || results.length === 0) {
            setSnackbarSeverity("error");
            setSnackbarMessage("Không có dữ liệu để xuất Excel!");
            setSnackbarOpen(true);
            return;
          }
          exportKetQuaExcel(results, selectedLop, selectedMon, hocKi);
          setSnackbarSeverity("success");
          setSnackbarMessage("✅ Xuất file Excel thành công!");
          setSnackbarOpen(true);
        } catch (err) {
          console.error("❌ Lỗi xuất Excel:", err);
          setSnackbarSeverity("error");
          setSnackbarMessage("❌ Không thể xuất file Excel!");
          setSnackbarOpen(true);
        }
      }
    );
  };

  const openConfirmDialog = (title, content, onConfirm) => {
    setDialogTitle(title);
    setDialogContent(content);
    setDialogAction(() => onConfirm);
    setDialogOpen(true);
  };

  const snackbarStyleMap = {
    success: { backgroundColor: "#2e7d32", color: "#fff", fontWeight: "bold" },
    error: { backgroundColor: "#d32f2f", color: "#fff", fontWeight: "bold" },
    warning: { backgroundColor: "#ed6c02", color: "#fff", fontWeight: "bold" },
    info: { backgroundColor: "#0288d1", color: "#fff", fontWeight: "bold" },
  };

  const circleIconStyle = {
    bgcolor: "white",
    boxShadow: 1,
    p: 0.5,
    width: 35,
    height: 35,
    "& svg": { fontSize: 20 },
    "&:hover": { bgcolor: "primary.light", color: "white" },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#f1f5f9",
        pt: 3,
        px: 2,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Paper sx={{ p: 4, borderRadius: 3, width: "100%", maxWidth: 700, bgcolor: "white" }} elevation={6}>
        <Box
          sx={{
            position: "relative",
            mb: 2,
          }}
        >
          {/* ICONS – luôn căn trái */}
          <Box sx={{ display: "flex", alignItems: "center", mt: -2, ml: -2 }}>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Xuất Excel">
                <IconButton
                  onClick={handleExportExcel}
                  sx={{
                    ...circleIconStyle,
                    color: "primary.main",
                  }}
                >
                  <FileDownload />
                </IconButton>
              </Tooltip>

              <Tooltip title="Xóa lớp">
                <IconButton
                  onClick={handleDeleteClass}
                  disabled={deleting}
                  sx={{
                    ...circleIconStyle,
                    color: "error.main",
                    "&:hover": {
                      bgcolor: "error.main",
                      color: "#fff",
                    },
                  }}
                >
                  <Delete />
                </IconButton>
              </Tooltip>

              <Tooltip title="Xóa toàn trường theo học kỳ">
                <IconButton
                  onClick={handleDeleteSchoolBySemester}
                  disabled={deleting}
                  sx={{
                    ...circleIconStyle,
                    color: "#d32f2f",
                    "&:hover": {
                      bgcolor: "#d32f2f",
                      color: "#fff",
                    },
                  }}
                >
                  <DeleteForever />
                </IconButton>
              </Tooltip>

              {/*<Tooltip title="Đồng bộ dữ liệu">
                <IconButton
                  onClick={handleSyncData}
                  disabled={syncing}
                  sx={{
                    ...circleIconStyle,
                    color: "secondary.main",
                    "&:hover": {
                      bgcolor: "secondary.main",
                      color: "#fff",
                    },
                  }}
                >
                  <SyncIcon />
                </IconButton>
              </Tooltip>*/}
            </Stack>

            <Tooltip title="Đồng bộ danh sách học sinh">
              <IconButton
                onClick={handleSyncHocSinh}
                disabled={syncing}
                sx={{
                  ...circleIconStyle,
                  color: "secondary.main",
                  "&:hover": {
                    bgcolor: "secondary.main",
                    color: "#fff",
                  },
                }}
              >
                <SyncIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* TIÊU ĐỀ – căn giữa như mẫu */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 3,
            }}
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{
                color: "#1976d2",
                mt: 1,
                textAlign: "center",
              }}
            >
              KẾT QUẢ KIỂM TRA
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "nowrap", justifyContent: "center" }}>
          <TextField
            select
            label="Lớp"
            value={selectedLop}
            onChange={(e) => setSelectedLop(e.target.value)}
            size="small"
            sx={{ width: 80 }}
          >
            {classesList.map(lop => <MenuItem key={lop} value={lop}>{lop}</MenuItem>)}
          </TextField>

          {/*<TextField
            select
            label="Môn"
            value={selectedMon}
            onChange={(e) => setSelectedMon(e.target.value)}
            size="small"
            sx={{ width: 130 }}
          >
            {["Tin học", "Công nghệ"].map(mon => <MenuItem key={mon} value={mon}>{mon}</MenuItem>)}
          </TextField>*/}

          <TextField
            select
            label="Học kỳ"
            value={hocKi}                 // ✅ giá trị mặc định lấy từ config
            onChange={(e) => setHocKi(e.target.value)} // ✅ chỉ đổi state cục bộ
            size="small"
            sx={{ width: 130 }}
          >
            <MenuItem value="Giữa kỳ I">Giữa kỳ I</MenuItem>
            <MenuItem value="Cuối kỳ I">Cuối kỳ I</MenuItem>
            <MenuItem value="Giữa kỳ II">Giữa kỳ II</MenuItem>
            <MenuItem value="Cuối năm">Cuối năm</MenuItem>
          </TextField>

          <TextField
            select
            label="Loại"
            value={loai}
            onChange={(e) => setLoai(e.target.value)}
            size="small"
            sx={{ width: 130 }}
          >
            <MenuItem value="ktdk">KTĐK</MenuItem>
            <MenuItem value="ontap">Ôn tập</MenuItem>
          </TextField>
          
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <TableContainer component={Paper} sx={{ boxShadow: "none", minWidth: 700 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: "#1976d2", color: "#fff", textAlign: "center", width: 50 }}>STT</TableCell>
                    <TableCell sx={{ bgcolor: "#1976d2", color: "#fff", textAlign: "center", width: 200 }}>Họ và tên</TableCell>

                    <TableCell sx={{ bgcolor: "#1976d2", color: "#fff", textAlign: "center", width: 70 }}>Điểm</TableCell>
                    {loai === "ontap" && ( // ⭐ thêm điều kiện
                      <TableCell sx={{ bgcolor: "#1976d2", color: "#fff", textAlign: "center", width: 80 }}>
                        Số lần
                      </TableCell>
                    )}
                    <TableCell sx={{ bgcolor: "#1976d2", color: "#fff", textAlign: "center", width: 70 }}>Thời gian</TableCell>
                    <TableCell sx={{ bgcolor: "#1976d2", color: "#fff", textAlign: "center", width: 100 }}>Ngày</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    const filtered = results.filter(
                      r => r.diem !== "" && r.diem !== null && r.diem !== undefined
                    );

                    const displayData =
                      filtered.length > 0
                        ? filtered.map((item, idx) => ({
                            ...item,
                            stt: idx + 1, // ✅ đánh lại STT sau khi lọc
                          }))
                        : Array.from({ length: 5 }, (_, i) => ({
                            stt: i + 1,
                            hoVaTen: "",
                            diem: "",
                            thoiGianLamBai: "",
                            ngayHienThi: "",
                          }));

                    return displayData.map(r => (
                      <TableRow key={r.stt}>
                        <TableCell sx={{ px: 1, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)" }}>
                          {r.stt}
                        </TableCell>

                        <TableCell sx={{ px: 1, textAlign: "left", border: "1px solid rgba(0,0,0,0.12)" }}>
                          {r.hoVaTen}
                        </TableCell>

                        <TableCell sx={{ px: 1, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)", fontWeight: "bold" }}>
                          {r.diem}
                        </TableCell>

                        {loai === "ontap" && (
                          <TableCell
                            sx={{
                              px: 1,
                              textAlign: "center",
                              border: "1px solid rgba(0,0,0,0.12)",
                            }}
                          >
                            {r.soLanLam}
                          </TableCell>
                        )}

                        <TableCell sx={{ px: 1, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)" }}>
                          {r.thoiGianLamBai}
                        </TableCell>

                        <TableCell sx={{ px: 1, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)" }}>
                          {r.ngayHienThi}
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

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
              ...snackbarStyleMap[snackbarSeverity],

              // ✅ ÉP MÀU ICON
              "& .MuiAlert-icon": {
                color: "#fff",
              },
            }}
          >
            {snackbarMessage}
          </Alert>

        </Snackbar>


      </Paper>
      
      <ConfirmDialog
        open={dialogOpen}
        title={dialogTitle}
        content={dialogContent}
        onClose={() => setDialogOpen(false)}
        onConfirm={() => {
          setDialogOpen(false);
          setTimeout(() => {
            if (dialogAction) dialogAction();
          }, 0);
        }}
      />


    </Box>

    
  );
}
