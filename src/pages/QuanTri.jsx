import React, { useState, useEffect, useContext } from "react";
import {
  Box, Typography, Card, Stack, Select, MenuItem, FormControl, InputLabel,
  Button, TextField, IconButton, Checkbox, Snackbar, Alert, Dialog, DialogContent
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import CloseIcon from "@mui/icons-material/Close";

import { ConfigContext } from "../context/ConfigContext";
import { StudentContext } from "../context/StudentContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function QuanTri() {
  const account = localStorage.getItem("account") || "";
  const isLamVanBen = account === "TH Lâm Văn Bền";

  const { classData, setClassData } = useContext(StudentContext);
  const { config, setConfig } = useContext(ConfigContext); // ✅ dùng context mới

  const [firestorePassword, setFirestorePassword] = useState("");
  const [openChangePw, setOpenChangePw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSemester, setSelectedSemester] = useState(config.hocKy || "Cuối kỳ I");
  const [addingClass, setAddingClass] = useState(false);
  const [newClass, setNewClass] = useState("");
  const [timeInput, setTimeInput] = useState(config.timeLimit || 20);

  // ===== Fetch mật khẩu Firestore =====
  useEffect(() => {
    const fetchPassword = async () => {
      try {
        const snap = await getDoc(doc(db, "MATKHAU", "lvb"));
        if (snap.exists()) setFirestorePassword(snap.data().pass || "1");
      } catch (err) {
        console.error("Lỗi lấy mật khẩu Firestore:", err);
      }
    };
    fetchPassword();
  }, []);

  // ===== Fetch lớp & config =====
  useEffect(() => {
  const fetchData = async () => {
    try {
      // 🔹 Lấy config chung từ CONFIG/config
      const snapConfig = await getDoc(doc(db, "CONFIG", "config"));
      if (snapConfig.exists()) {
        const data = snapConfig.data();

        // ✅ cập nhật context
        setConfig({
          choXemDapAn: data.choXemDapAn ?? false,
          choXemDiem: data.choXemDiem ?? false,
          hocKy: data.hocKy ?? "Cuối kỳ I",
          timeLimit: data.timeLimit ?? 20,
          xuatFileBaiLam: data.xuatFileBaiLam ?? true,
        });

        setSelectedSemester(data.hocKy ?? "Cuối kỳ I");
        setTimeInput(data.timeLimit ?? 20);
      }

      // 🔹 Lấy danh sách lớp từ LAMVANBEN/lop
      const lopSnap = await getDoc(doc(db, "LAMVANBEN", "lop"));
      const classList = (lopSnap.data()?.list || []).sort();
      setClasses(classList);
      setSelectedClass((prev) => prev || classList[0] || "");
    } catch (err) {
      console.error("❌ Lỗi fetch lớp hoặc config:", err);
    }
  };

  fetchData();
}, [setConfig]);

  // ===== Cập nhật config =====
  const updateConfigField = async (field, value) => {
    await setConfig({ [field]: value }); // ✅ dùng setConfig context
    if (field === "lop") setSelectedClass(value);
    if (field === "hocKy") setSelectedSemester(value);
    if (field === "timeLimit") setTimeInput(value);
    if (field === "namHoc") ;
  };

  // ===== Thêm / xóa lớp =====
  const handleAddClass = async () => {
    const cls = newClass.trim().toUpperCase();
    if (!cls || classes.includes(cls)) return alert("Lớp đã tồn tại!");
    const updated = [...classes, cls].sort();
    setClasses(updated);
    setSelectedClass(cls);
    updateConfigField("lop", cls);
    await setDoc(doc(db, "LAMVANBEN", "lop"), { list: updated }, { merge: true });
    setNewClass("");
    setAddingClass(false);
  };

  const handleDeleteClass = async () => {
    const updated = classes.filter((c) => c !== selectedClass).sort();
    setClasses(updated);
    const nextClass = updated[0] || "";
    setSelectedClass(nextClass);
    updateConfigField("lop", nextClass);
    await setDoc(doc(db, "LAMVANBEN", "lop"), { list: updated }, { merge: true });
  };

  const handleTimeLimitChange = (value) => {
    const v = Math.max(1, Number(value));
    setTimeInput(v);
    updateConfigField("timeLimit", v);
  };

  // ===== Đổi mật khẩu =====
  const handleChangePassword = async () => {
    if (!newPw.trim()) return setPwError("❌ Mật khẩu mới không được để trống!");
    if (newPw !== confirmPw) return setPwError("❌ Mật khẩu nhập lại không khớp!");

    try {
      // Chọn document theo account
      const docId = account === "TH Lâm Văn Bền" ? "lvb" : "admin";

      await setDoc(doc(db, "MATKHAU", docId), { pass: newPw }, { merge: true });

      setOpenChangePw(false);
      setNewPw("");
      setConfirmPw("");
      setPwError("");

      setSnackbar({ open: true, message: "✅ Đổi mật khẩu thành công!", severity: "success" });
    } catch (err) {
      console.error(err);
      setPwError("❌ Lỗi khi lưu mật khẩu!");
      setSnackbar({ open: true, message: "❌ Lỗi khi lưu mật khẩu!", severity: "error" });
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#e3f2fd", pt: 3, display: "flex", justifyContent: "center" }}>
      <Stack spacing={2} sx={{ width: { xs: "95%", sm: "350px" } }}>
        <Card elevation={6} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight="bold" color="primary" textAlign="center" mb={2}>
            CẤU HÌNH HỆ THỐNG
          </Typography>

          <Box display="flex" justifyContent="center" alignItems="center" mb={2} gap={1}>
            <Typography fontWeight="bold">{account || "Chưa đăng nhập"}</Typography>
            <IconButton sx={{ color: "orange" }} onClick={() => setOpenChangePw(true)}>
              <VpnKeyIcon />
            </IconButton>
          </Box>

          <Stack spacing={2}>
            {/* Năm học */}
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel id="namHoc-label">Năm học</InputLabel>
              <Select
                labelId="namHoc-label"
                value={config.namHoc || "2025-2026"}
                onChange={(e) => updateConfigField("namHoc", e.target.value)}
                label="Năm học"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const start = 2025 + i;
                  const end = start + 1;
                  const value = `${start}-${end}`;
                  return <MenuItem key={value} value={value}>{value}</MenuItem>;
                })}
              </Select>
            </FormControl>
            
            {/* Học kỳ */}
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel id="hocKy-label">Học kỳ</InputLabel>
              <Select
                labelId="hocKy-label"
                value={selectedSemester}
                onChange={(e) => updateConfigField("hocKy", e.target.value)}
                label="Học kỳ"
              >
                <MenuItem value="Giữa kỳ I">Giữa kỳ I</MenuItem>
                <MenuItem value="Cuối kỳ I">Cuối kỳ I</MenuItem>
                <MenuItem value="Giữa kỳ II">Giữa kỳ II</MenuItem>
                <MenuItem value="Cả năm">Cả năm</MenuItem>
              </Select>
            </FormControl>

            {/* Lớp */}
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl size="small" sx={{ flex: 1 }} variant="outlined">
                <InputLabel id="lop-label">Lớp</InputLabel>
                <Select
                  labelId="lop-label"
                  value={selectedClass}
                  onChange={(e) => updateConfigField("lop", e.target.value)}
                  label="Lớp"
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls} value={cls}>{cls}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton sx={{ color: "green" }} onClick={() => setAddingClass(true)}><Add /></IconButton>
              <IconButton sx={{ color: "red" }} onClick={handleDeleteClass}><Delete /></IconButton>
            </Stack>

            {addingClass && (
              <Stack direction="row" spacing={1}>
                <TextField size="small" label="Tên lớp" value={newClass} onChange={(e) => setNewClass(e.target.value)} fullWidth />
                <Button variant="contained" size="small" sx={{ bgcolor: "green" }} onClick={handleAddClass}>Lưu</Button>
                <Button size="small" onClick={() => setAddingClass(false)}>Hủy</Button>
              </Stack>
            )}

            {/* Thời gian */}
            <Box display="flex" alignItems="center" gap={1}>
              <Typography sx={{ minWidth: 140 }}>Thời gian làm bài (phút)</Typography>
              <TextField
                type="number"
                size="small"
                value={timeInput}
                onChange={(e) => handleTimeLimitChange(e.target.value)}
                inputProps={{ min: 1, style: { width: 60, textAlign: "center" } }}
              />
            </Box>

            {/* Checkboxes */}
            <Box ml={4} mt={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Checkbox checked={config.choXemDiem} onChange={(e) => updateConfigField("choXemDiem", e.target.checked)} />
                <Typography>Cho xem điểm</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Checkbox checked={config.choXemDapAn} onChange={(e) => updateConfigField("choXemDapAn", e.target.checked)} />
                <Typography>Cho xem đáp án</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Checkbox checked={config.xuatFileBaiLam} onChange={(e) => updateConfigField("xuatFileBaiLam", e.target.checked)} />
                <Typography>Xuất file bài làm</Typography>
              </Box>
            </Box>
          </Stack>
        </Card>
      </Stack>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>

      {/* Dialog đổi mật khẩu */}
      <Dialog open={openChangePw} onClose={() => setOpenChangePw(false)} disableEscapeKeyDown maxWidth="xs" fullWidth>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#1976d2", color: "#fff", px: 2, py: 1.2 }}>
          <Typography variant="subtitle1" fontWeight="bold">ĐỔI MẬT KHẨU</Typography>
          <IconButton onClick={() => setOpenChangePw(false)} sx={{ color: "#fff" }}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <DialogContent>
          <Stack spacing={2}>
            <TextField label="Mật khẩu mới" type="password" fullWidth size="small" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            <TextField label="Nhập lại mật khẩu" type="password" fullWidth size="small" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
            {pwError && <Typography color="error" fontWeight={600}>{pwError}</Typography>}
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button onClick={() => setOpenChangePw(false)}>Hủy</Button>
              <Button variant="contained" onClick={handleChangePassword}>Lưu</Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
