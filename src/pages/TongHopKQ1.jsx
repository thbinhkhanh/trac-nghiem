import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Snackbar, 
  Alert
} from "@mui/material";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, writeBatch, deleteDoc } from "firebase/firestore";
import { Delete, DeleteForever, FileDownload } from "@mui/icons-material";
import { exportKetQuaExcel } from "../utils/exportKetQuaExcel";

export default function TongHopKQ() {
  const [classesList, setClassesList] = useState([]);
  const [selectedLop, setSelectedLop] = useState("");
  const [selectedMon, setSelectedMon] = useState("Tin học");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hocKi, setHocKi] = useState(""); // Học kỳ

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Lấy học kỳ và danh sách lớp từ Firestore
  const username = localStorage.getItem("account") || "";
const folder = username === "TH Lâm Văn Bền" ? "LAMVANBEN" : "BINHKHANH";

// Lấy học kỳ
useEffect(() => {
  const fetchHocKi = async () => {
    try {
      const folder = username === "TH Lâm Văn Bền" ? "LAMVANBEN" : "BINHKHANH";
      console.log("📌 Folder (trường):", folder);

      const configRef = doc(db, folder, "config");
      const configSnap = await getDoc(configRef);

      const hocKiValue = configSnap.exists() ? configSnap.data().hocKy : "GKI";
      setHocKi(hocKiValue);

      console.log("📌 Học kỳ lấy được từ config:", hocKiValue);
    } catch (err) {
      console.error("❌ Lỗi khi lấy học kỳ:", err);
      setHocKi("GKI");
    }
  };

  fetchHocKi();
}, [username]);

// Lấy danh sách lớp
useEffect(() => {
  const fetchClasses = async () => {
    try {
      let classList = [];
      if (folder === "LAMVANBEN") {
        const lopSnap = await getDoc(doc(db, folder, "lop"));
        classList = lopSnap.exists() ? lopSnap.data().list ?? [] : [];
      } else {
        const snapshot = await getDocs(collection(db, "DANHSACH"));
        classList = snapshot.docs.map(doc => doc.id);
      }
      classList.sort((a, b) => a.localeCompare(b));
      setClassesList(classList);
      setSelectedLop(classList[0] || "");
    } catch (err) {
      console.error(err);
    }
  };
  fetchClasses();
}, [folder]);

// Load kết quả
const loadResults = async () => {
  if (!selectedLop || !selectedMon || !hocKi) return;
  setLoading(true);

  try {
    const colRef = collection(db, `${folder}/${hocKi}/${selectedLop}`);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      setResults([]);
      setSnackbarMessage(`❌ Không tìm thấy kết quả cho lớp ${selectedLop}`);
      setSnackbarOpen(true);
      setLoading(false);
      return;
    }

    const data = snapshot.docs.map(docSnap => ({ docId: docSnap.id, ...docSnap.data() }));

    // Hàm sắp xếp tên chuẩn Việt Nam: từ TÊN → TÊN ĐỆM → HỌ
    const compareVietnameseName = (a, b) => {
      const namePartsA = a.hoVaTen.trim().split(" ").reverse();
      const namePartsB = b.hoVaTen.trim().split(" ").reverse();
      const len = Math.max(namePartsA.length, namePartsB.length);

      for (let i = 0; i < len; i++) {
        const partA = (namePartsA[i] || "").toLowerCase();
        const partB = (namePartsB[i] || "").toLowerCase();
        const cmp = partA.localeCompare(partB);
        if (cmp !== 0) return cmp;
      }
      return 0;
    };

    data.sort(compareVietnameseName);

    // Thêm STT
    const numberedData = data.map((item, idx) => ({ stt: idx + 1, ...item }));
    setResults(numberedData);

  } catch (err) {
    console.error("❌ Lỗi khi load kết quả:", err);
    setResults([]);
    setSnackbarMessage("❌ Lỗi khi load kết quả!");
    setSnackbarOpen(true);
  }

  setLoading(false);
};


  useEffect(() => {
    loadResults();
  }, [selectedLop, selectedMon, hocKi]);

  // Xóa toàn bộ lớp
  const handleDeleteClass = async () => {
    const confirmDelete = window.confirm(`Bạn có chắc muốn xóa kết quả ${hocKi} của lớp ${selectedLop}?`);
    if (!confirmDelete) return;

    setResults(Array.from({ length: 5 }, (_, i) => ({
      stt: i + 1,
      hoVaTen: "",
      lop: "",
      mon: "",
      ngayKiemTra: "",
      thoiGianLamBai: "",
      diem: "",
    })));

    setSnackbarMessage("Đã xóa toàn bộ lớp thành công!");
    setSnackbarOpen(true);

    try {
      const colRef = collection(db, `LAMVANBEN/${hocKi}/${selectedLop}`);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));
        await batch.commit();
        console.log(`🔥 Firestore: Xóa lớp ${selectedLop} thành công`);
      }
    } catch (err) {
      console.error("❌ Firestore: Xóa lớp thất bại:", err);
    }
  };

  const handleDeleteSchoolBySemester = async () => {
    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa kết quả ${hocKi} của TOÀN TRƯỜNG?`
    );
    if (!confirmDelete) return;

    try {
      // Xóa document học kỳ ở cấp trường
      await deleteDoc(doc(db, folder, hocKi));

      setResults([]); // reset hiển thị
      setSnackbarMessage(`✅ Đã xóa kết quả ${hocKi} của TOÀN TRƯỜNG`);
      setSnackbarOpen(true);

      console.log(`🔥 Firestore: Xóa toàn trường theo học kỳ ${hocKi} thành công`);
    } catch (err) {
      console.error("❌ Firestore: Xóa toàn trường thất bại:", err);
      setSnackbarMessage("❌ Lỗi khi xóa toàn trường!");
      setSnackbarOpen(true);
    }
  };

  // Xuất Excel
  const handleExportExcel = () => {
    exportKetQuaExcel(results, selectedLop, selectedMon, hocKi);
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(to bottom, #e3f2fd, #bbdefb)", pt: 3, px: 2, display: "flex", justifyContent: "center" }}>
      <Paper sx={{ p: 4, borderRadius: 3, width: "100%", maxWidth: 900, bgcolor: "white" }} elevation={6}>

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Xuất Excel">
              <IconButton onClick={handleExportExcel} color="primary">
                <FileDownload />
              </IconButton>
            </Tooltip>
            <Tooltip title="Xóa lớp">
              <IconButton onClick={handleDeleteClass} color="error" disabled={deleting}>
                <Delete />
              </IconButton>
            </Tooltip>
            {/* Nút xóa toàn trường theo học kỳ */}
            <Tooltip title="Xóa toàn trường theo học kỳ">
              <IconButton onClick={handleDeleteSchoolBySemester} color="error" disabled={deleting}>
                <DeleteForever />
              </IconButton>
            </Tooltip>

          </Stack>

          <Typography variant="h5" fontWeight="bold" sx={{ color: "#1976d2", flexGrow: 1, textAlign: "center" }}>
            KẾT QUẢ KIỂM TRA
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", justifyContent: "center" }}>
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

          <TextField
            select
            label="Môn"
            value={selectedMon}
            onChange={(e) => setSelectedMon(e.target.value)}
            size="small"
            sx={{ width: 130 }}
          >
            {["Tin học", "Công nghệ"].map(mon => <MenuItem key={mon} value={mon}>{mon}</MenuItem>)}
          </TextField>

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
            <MenuItem value="Cả năm">Cả năm</MenuItem>
          </TextField>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <TableContainer component={Paper} sx={{ boxShadow: "none", minWidth: 750 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: "#1976d2", color: "#fff", textAlign: "center", width: 50 }}>STT</TableCell>
                    <TableCell sx={{ bgcolor: "#1976d2", color: "#fff", textAlign: "center", width: 200 }}>Họ và tên</TableCell>
                    <TableCell sx={{ bgcolor: "#1976d2", color: "#fff", textAlign: "center", width: 80 }}>Lớp</TableCell>
                    <TableCell sx={{ bgcolor: "#1976d2", color: "#fff", textAlign: "center", width: 100 }}>Môn</TableCell>
                    <TableCell sx={{ bgcolor: "#1976d2", color: "#fff", textAlign: "center", width: 120 }}>Ngày</TableCell>
                    <TableCell sx={{ bgcolor: "#1976d2", color: "#fff", textAlign: "center", width: 120 }}>Thời gian</TableCell>
                    <TableCell sx={{ bgcolor: "#1976d2", color: "#fff", textAlign: "center", width: 80 }}>Điểm</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(results.length > 0 ? results : Array.from({ length: 5 }, (_, i) => ({
                    stt: i + 1,
                    hoVaTen: "",
                    lop: "",
                    mon: "",
                    ngayKiemTra: "",
                    thoiGianLamBai: "",
                    diem: ""
                  }))).map(r => (
                    <TableRow key={r.stt}>
                      <TableCell sx={{ px: 1, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)" }}>{r.stt}</TableCell>
                      <TableCell sx={{ px: 1, textAlign: "left", border: "1px solid rgba(0,0,0,0.12)" }}>{r.hoVaTen}</TableCell>
                      <TableCell sx={{ px: 1, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)" }}>{r.lop}</TableCell>
                      <TableCell sx={{ px: 1, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)" }}>{r.mon}</TableCell>
                      <TableCell sx={{ px: 1, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)" }}>{r.ngayKiemTra}</TableCell>
                      <TableCell sx={{ px: 1, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)" }}>{r.thoiGianLamBai}</TableCell>
                      <TableCell sx={{ px: 1, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)", fontWeight: "bold" }}>{r.diem}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: "100%" }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>

      </Paper>
    </Box>
  );
}
