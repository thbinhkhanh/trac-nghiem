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

export default function TongHopKQ() {
  const [classesList, setClassesList] = useState([]);
  const [selectedLop, setSelectedLop] = useState("");
  const [selectedMon, setSelectedMon] = useState("Tin học");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hocKi, setHocKi] = useState(""); 

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogContent, setDialogContent] = useState("");
  const [dialogAction, setDialogAction] = useState(null);

  const folder = "LAMVANBEN"; 

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
        const lopSnap = await getDoc(doc(db, folder, "lop"));
        const classList = lopSnap.exists() ? lopSnap.data().list ?? [] : [];
        classList.sort((a, b) => a.localeCompare(b));
        setClassesList(classList);
        setSelectedLop(classList[0] || "");
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, []);

  // Load kết quả
  const loadResults = async () => {
    if (!selectedLop || !selectedMon || !hocKi) return;
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

      const data = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        let ngayHienThi = "";
        if (d.ngayKiemTra?.seconds) {
          ngayHienThi = new Date(d.ngayKiemTra.seconds * 1000).toLocaleDateString("vi-VN");
        } else if (typeof d.ngayKiemTra === "string") {
          ngayHienThi = d.ngayKiemTra;
        }
        return { docId: docSnap.id, ...d, ngayHienThi };
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

      const numberedData = data.map((item, idx) => ({ stt: idx + 1, ...item }));
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

  useEffect(() => { loadResults(); }, [selectedLop, selectedMon, hocKi]);

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
    setDialogAction(() => () => { setDialogOpen(false); setTimeout(() => onConfirm(), 0); });
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
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(to bottom, #e3f2fd, #bbdefb)", pt: 3, px: 2, display: "flex", justifyContent: "center" }}>
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
            </Stack>
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
            <TableContainer
              component={Paper}
              sx={{
                boxShadow: "none",
                minWidth: 700,        // ⬅️ tổng chiều rộng bảng
                overflowX: "auto",
              }}
            >
              <Table
                size="small"
                sx={{
                  tableLayout: "fixed", // ⬅️ QUAN TRỌNG: ép width theo TableCell
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{ bgcolor: "#1976d2", color: "#fff", textAlign: "center", width: 50 }}
                    >
                      STT
                    </TableCell>

                    <TableCell
                      sx={{ bgcolor: "#1976d2", color: "#fff", textAlign: "center", width: 200 }}
                    >
                      Họ và tên
                    </TableCell>

                    <TableCell
                      sx={{ bgcolor: "#1976d2", color: "#fff", textAlign: "center", width: 70 }}
                    >
                      Điểm
                    </TableCell>

                    <TableCell
                      sx={{ bgcolor: "#1976d2", color: "#fff", textAlign: "center", width: 70 }}
                    >
                      Thời gian
                    </TableCell>

                    <TableCell
                      sx={{ bgcolor: "#1976d2", color: "#fff", textAlign: "center", width: 100 }}
                    >
                      Ngày
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {(results.length > 0
                    ? results
                    : Array.from({ length: 5 }, (_, i) => ({
                        stt: i + 1,
                        hoVaTen: "",
                        diem: "",
                        thoiGianLamBai: "",
                        ngayHienThi: "",
                      }))
                  ).map((r) => (
                    <TableRow key={r.stt}>
                      <TableCell
                        sx={{ px: 1, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)" }}
                      >
                        {r.stt}
                      </TableCell>

                      <TableCell
                        sx={{
                          px: 1,
                          textAlign: "left",
                          border: "1px solid rgba(0,0,0,0.12)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis", // ⬅️ tên dài không phá layout
                        }}
                      >
                        {r.hoVaTen}
                      </TableCell>

                      <TableCell
                        sx={{
                          px: 1,
                          textAlign: "center",
                          border: "1px solid rgba(0,0,0,0.12)",
                          fontWeight: "bold",
                        }}
                      >
                        {r.diem}
                      </TableCell>

                      <TableCell
                        sx={{ px: 1, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)" }}
                      >
                        {r.thoiGianLamBai}
                      </TableCell>

                      <TableCell
                        sx={{ px: 1, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)" }}
                      >
                        {r.ngayHienThi}
                      </TableCell>
                    </TableRow>
                  ))}
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
      
      <Dialog
        open={dialogOpen}
        onClose={(_, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") return;
          setDialogOpen(false);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 3,
            bgcolor: "#fff",
            boxShadow: "0 4px 12px rgba(33,150,243,0.15)",
          },
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
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
            ❓
          </Box>

          <DialogTitle
            sx={{
              p: 0,
              fontWeight: "bold",
              color: "#1565c0",
              flex: 1,
            }}
          >
            {dialogTitle}
          </DialogTitle>

          {/* Nút X */}
          <IconButton
            onClick={() => setDialogOpen(false)}
            sx={{
              ml: "auto",
              color: "#f44336",
              "&:hover": { bgcolor: "rgba(244,67,54,0.1)" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Nội dung */}
        <DialogContent dividers>
          <Typography
            sx={{
              fontSize: 16,
              color: "#333",
              whiteSpace: "pre-line",
              mb: 2, // ⬅️ chỉ tăng khoảng cách text ↔ divider
            }}
          >
            {dialogContent}
          </Typography>
        </DialogContent>


        {/* Actions */}
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={dialogAction}
            sx={{ fontWeight: "bold" }}
          >
            Xác nhận
          </Button>

        </DialogActions>
      </Dialog>


    </Box>

    
  );
}
