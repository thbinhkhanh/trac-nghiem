import React, { useState, useEffect, useContext } from "react";

// =========================
// MUI COMPONENTS
// =========================
import {
  Box,
  Typography,
  Card,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  TextField,
  IconButton,
  Checkbox,
  Snackbar,
  Alert,
  Dialog,
  DialogContent,
  Tooltip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid
} from "@mui/material";

import { useNavigate } from "react-router-dom";

// =========================
// ICONS
// =========================
import { Add, Delete } from "@mui/icons-material";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import CloseIcon from "@mui/icons-material/Close";

// =========================
// CONTEXT
// =========================
import { ConfigContext } from "../context/ConfigContext";
import { StudentContext } from "../context/StudentContext";

// =========================
// FIREBASE
// =========================
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

// =========================
// PAGES / COMPONENTS
// =========================
import BackupPage from "./BackupPage";
import RestorePage from "./RestorePage";
import AssignClassDialog from "../dialog/AssignClassDialog";

export default function QuanTri() {
  const navigate = useNavigate();
  // =========================
  // ACCOUNT
  // =========================
  const account = localStorage.getItem("account") || "";
  const isLamVanBen = account === "TH Lâm Văn Bền";

  // =========================
  // CONTEXT
  // =========================
  const { classData, setClassData } = useContext(StudentContext);
  const { config, setConfig } = useContext(ConfigContext);
  const namHocKey = config.namHoc || "2025-2026";

  // =========================
  // STATE - PASSWORD
  // =========================
  const [firestorePassword, setFirestorePassword] = useState("");
  const [openChangePw, setOpenChangePw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");

  const isAdmin = account === "Admin";
  const [openAssign, setOpenAssign] = useState(false);

  // =========================
  // STATE - SNACKBAR
  // =========================
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // =========================
  // STATE - CLASS / SEMESTER
  // =========================
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSemester, setSelectedSemester] = useState(
    config.hocKy || "Cuối kỳ I"
  );
  const [examType, setExamType] = useState(
    config.examType || "ktdk"
  );

  const [addingClass, setAddingClass] = useState(false);
  const [newClass, setNewClass] = useState("");

  // =========================
  // STATE - CONFIG
  // =========================
  const [timeInput, setTimeInput] = useState(
    config.timeLimit || 20
  );

  // =========================
  // STATE - BACKUP / RESTORE
  // =========================
  const [openBackup, setOpenBackup] = useState(false);
  const [openRestore, setOpenRestore] = useState(false);

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
        // =========================
        // 🔹 LẤY CONFIG
        // =========================
        const snapConfig = await getDoc(doc(db, "CONFIG", "config"));

        if (snapConfig.exists()) {
          const data = snapConfig.data();

          setConfig({
            choXemDapAn: data.choXemDapAn ?? false,
            choXemDiem: data.choXemDiem ?? false,
            hocKy: data.hocKy ?? "Cuối kỳ I",
            timeLimit: data.timeLimit ?? 20,
            xuatFileBaiLam: data.xuatFileBaiLam ?? true,
            khoaHeThong: data.khoaHeThong ?? false,
            examType: data.examType ?? "ktdk",
            giaoDien: data.giaoDien ?? "dang_nhap",
            namHoc: data.namHoc ?? "2025-2026", // 👈 thêm nếu chưa có
          });

          setSelectedSemester(data.hocKy ?? "Cuối kỳ I");
          setExamType(data.examType ?? "ktdk");
          setTimeInput(data.timeLimit ?? 20);
        }

        // =========================
        // 🔥 LẤY LỚP THEO NĂM HỌC MỚI
        // =========================
        const namHocKey = snapConfig.exists()
          ? (snapConfig.data()?.namHoc || "2025-2026").replaceAll("-", "_")
          : "2025_2026";

        const lopRef = doc(db, "DANHSACH_LOP", namHocKey);
        const lopSnap = await getDoc(lopRef);

        const classList = lopSnap.exists()
          ? (lopSnap.data().list || []).sort()
          : [];

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
    // 1. update context local
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));

    // 2. update UI state phụ
    if (field === "lop") setSelectedClass(value);
    if (field === "hocKy") setSelectedSemester(value);
    if (field === "timeLimit") setTimeInput(value);
    if (field === "examType") setExamType(value);

    // 3. update Firestore
    await setDoc(
      doc(db, "CONFIG", "config"),
      {
        [field]: value,
      },
      { merge: true }
    );
  };

  // ===== Thêm / xóa lớp =====
  const handleAddClass = async () => {
    if (!newClass.trim()) return;

    const input = newClass.toUpperCase().replace(/\s+/g, "");
    let generatedClasses = [];

    const parts = input.split(",");

    for (let part of parts) {

      // ===== CASE 1: Dãy chữ cái – ví dụ 3A->3K =====
      let matchLetter = part.match(/^(\d+)([A-Z])->(\d+)?([A-Z])$/);
      if (matchLetter) {
        const grade = matchLetter[1];
        const start = matchLetter[2].charCodeAt(0);
        const end = matchLetter[4].charCodeAt(0);

        if (start > end) continue;

        for (let c = start; c <= end; c++) {
          generatedClasses.push(`${grade}${String.fromCharCode(c)}`);
        }
        continue;
      }

      // ===== CASE 2: Dãy số – ví dụ 4.1->4.6 =====
      let matchNumber = part.match(/^(\d+)\.(\d+)->(\d+)\.(\d+)$/);
      if (matchNumber) {
        const grade = matchNumber[1];
        const start = Number(matchNumber[2]);
        const end = Number(matchNumber[4]);

        if (start > end) continue;

        for (let i = start; i <= end; i++) {
          generatedClasses.push(`${grade}.${i}`);
        }
        continue;
      }

      // ===== CASE 3: 1 lớp đơn =====
      if (/^\d+(\.\d+|[A-Z])$/.test(part)) {
        generatedClasses.push(part);
      }
    }

    if (generatedClasses.length === 0) {
      alert("❌ Định dạng không hợp lệ!");
      return;
    }

    // Loại trùng
    const uniqueNew = generatedClasses.filter(c => !classes.includes(c));

    if (uniqueNew.length === 0) {
      alert("⚠️ Các lớp đã tồn tại!");
      return;
    }

    const updated = [...classes, ...uniqueNew].sort();

    setClasses(updated);
    setSelectedClass(uniqueNew[0]);
    updateConfigField("lop", uniqueNew[0]);

    // =========================
    // 🔥 CHỈ THAY PHẦN NÀY
    // =========================
    const namHocRaw = config?.namHoc || "2025-2026";
    const namHocKey = namHocRaw.replaceAll("-", "_");

    await setDoc(
      doc(db, "DANHSACH_LOP", namHocKey),
      { list: updated },
      { merge: true }
    );

    setNewClass("");
    setAddingClass(false);
  };


  const handleDeleteClass = async () => {
    const updated = classes.filter((c) => c !== selectedClass).sort();

    setClasses(updated);

    const nextClass = updated[0] || "";
    setSelectedClass(nextClass);
    updateConfigField("lop", nextClass);

    // =========================
    // 🔥 LƯU THEO NĂM HỌC
    // =========================
    const namHocRaw = config?.namHoc || "2025-2026";
    const namHocKey = namHocRaw.replaceAll("-", "_");

    await setDoc(
      doc(db, "DANHSACH_LOP", namHocKey),
      { list: updated },
      { merge: true }
    );
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
  <Box
    sx={{
      minHeight: "100vh",
      background: "#f1f5f9",
      py: 3,
      px: 0.5,
      display: "flex",
      justifyContent: "center",
      fontFamily: '"Roboto","Inter","Arial",sans-serif',
    }}
  >
    <Box
      sx={{
        width: "100%",
        maxWidth: 700,
      }}
    >
      {!openBackup && !openRestore && !openAssign && (
        <Card
          elevation={0}
          sx={{
            borderRadius: "14px",
            overflow: "hidden",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 35px rgba(0,0,0,0.12)",
          }}
        >

          {/* ===== HEADER ===== */}
          <Box 
            sx={{ 
              px: 3, 
              py: 2,                 // Tăng padding dọc lên 2 cho thoáng rộng và đồng bộ
              background: "#1976d2", 
              color: "#fff",
              position: "relative",  // Làm gốc tọa độ để căn tuyệt đối nút X
              display: "flex",
              alignItems: "center"
            }}
          >
            {/* TITLE - Chỉ dùng duy nhất một thẻ Typography phẳng */}
            <Typography sx={{ fontSize: 17, fontWeight: 700 }}>
              Cấu hình hệ thống
            </Typography>

            {/* CLOSE BUTTON - Căn phải sát mép và tăng kích thước vùng bấm */}
            <IconButton
              onClick={() => navigate("/dashboard")}
              sx={{
                position: "absolute",
                right: 12,           // Căn phải sát viền giống các component trước
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
          <Box sx={{ px: 3, py: 2.5 }}>
            <Grid container spacing={2}>

              {/* ================= LEFT COLUMN ================= */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={2}>

                  {/* NĂM HỌC */}
                  <FormControl fullWidth size="small">
                    <InputLabel>Năm học</InputLabel>
                    <Select
                      value={config.namHoc || "2025-2026"}
                      label="Năm học"
                      onChange={(e) =>
                        updateConfigField("namHoc", e.target.value)
                      }
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const start = 2025 + i;
                        const end = start + 1;
                        const value = `${start}-${end}`;

                        return (
                          <MenuItem key={value} value={value}>
                            {value}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>

                  {/* HỌC KỲ */}
                  <FormControl fullWidth size="small">
                    <InputLabel>Học kỳ</InputLabel>
                    <Select
                      value={selectedSemester}
                      label="Học kỳ"
                      onChange={(e) =>
                        updateConfigField("hocKy", e.target.value)
                      }
                    >
                      <MenuItem value="Giữa kỳ I">Giữa kỳ I</MenuItem>
                      <MenuItem value="Cuối kỳ I">Cuối kỳ I</MenuItem>
                      <MenuItem value="Giữa kỳ II">Giữa kỳ II</MenuItem>
                      <MenuItem value="Cuối năm">Cuối năm</MenuItem>
                    </Select>
                  </FormControl>

                  {/* LỚP */}
                  <Box
                    sx={{
                      p: 1.6,
                      borderRadius: "5px",
                      bgcolor: "#fff",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1.5,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#1e293b",
                        }}
                      >
                        Quản lý lớp
                      </Typography>

                      {isAdmin && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={async () => {
                            try {
                              const namHocKey =
                                (config?.namHoc || "2025-2026").replaceAll("-", "_");

                              const lopRef = doc(db, "DANHSACH_LOP", namHocKey);
                              const lopSnap = await getDoc(lopRef);

                              const classList = lopSnap.exists()
                                ? (lopSnap.data().list || []).sort()
                                : [];

                              setClasses(classList); // 🔥 update mới nhất
                              setSelectedClass(classList[0] || "");
                            } catch (err) {
                              console.error("❌ Reload classes lỗi:", err);
                            }

                            setOpenAssign(true);
                          }}
                          sx={{
                            textTransform: "none",
                            borderRadius: "4px",
                            fontWeight: 700,
                          }}
                        >
                          Phân quyền lớp
                        </Button>
                      )}
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <FormControl size="small" fullWidth>
                        <InputLabel>Lớp</InputLabel>
                        <Select
                          value={selectedClass}
                          label="Lớp"
                          onChange={(e) =>
                            updateConfigField("lop", e.target.value)
                          }
                        >
                          {classes.map((cls) => (
                            <MenuItem key={cls} value={cls}>
                              {cls}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Tooltip title="Thêm lớp">
                        <IconButton
                          onClick={() => setAddingClass(true)}
                          sx={{ color: "#fff", bgcolor: "#22c55e" }}
                        >
                          <Add />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Xóa lớp">
                        <IconButton
                          onClick={handleDeleteClass}
                          sx={{ color: "#fff", bgcolor: "#ef4444" }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Stack>

                    {addingClass && (
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        mt={1.5}
                      >
                        <TextField
                          size="small"
                          label="Tên lớp"
                          value={newClass}
                          onChange={(e) => setNewClass(e.target.value)}
                          fullWidth
                        />

                        <Button variant="contained" onClick={handleAddClass}>
                          Lưu
                        </Button>

                        <Button onClick={() => setAddingClass(false)}>
                          Hủy
                        </Button>
                      </Stack>
                    )}
                  </Box>

                  {/* GIAO DIỆN */}
                  <Box sx={{ p: 1.6, bgcolor: "#fff", border: "1px solid #e2e8f0" }}>
                    <Typography fontWeight={700}>Giao diện</Typography>

                    <RadioGroup
                      row
                      value={config.giaoDien || "dang_nhap"}
                      onChange={(e) =>
                        updateConfigField("giaoDien", e.target.value)
                      }
                    >
                      <FormControlLabel value="dang_nhap" control={<Radio />} label="Đăng nhập" />
                      <FormControlLabel value="the_ten" control={<Radio />} label="Thẻ tên" />
                    </RadioGroup>
                  </Box>

                  {/* LOẠI ĐỀ */}
                  <Box sx={{ p: 1.6, bgcolor: "#fff", border: "1px solid #e2e8f0" }}>
                    <Typography fontWeight={700}>Loại đề</Typography>

                    <RadioGroup
                      row
                      value={config.examType || "ktdk"}
                      onChange={(e) =>
                        updateConfigField("examType", e.target.value)
                      }
                    >
                      <FormControlLabel value="ktdk" control={<Radio />} label="KTĐK" />
                      <FormControlLabel value="on_tap" control={<Radio />} label="Ôn tập" />
                    </RadioGroup>
                  </Box>

                </Stack>
              </Grid>

              {/* ================= RIGHT COLUMN ================= */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={2}>
                  {/* ===== THỜI GIAN (ĐÃ DI CHUYỂN XUỐNG CUỐI CỘT TRÁI) ===== */}
                  <Box sx={{ p: 1.6, bgcolor: "#fff", border: "1px solid #e2e8f0" }}>
                    <Typography fontWeight={700}>Thời gian làm bài</Typography>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <TextField
                        type="number"
                        size="small"
                        value={timeInput}
                        onChange={(e) =>
                          handleTimeLimitChange(e.target.value)
                        }
                        inputProps={{
                          min: 1,
                          style: { width: 65, textAlign: "center" },
                        }}
                      />
                      <Typography>phút</Typography>
                    </Stack>
                  </Box>
                  
                  {/* HIỂN THỊ KẾT QUẢ */}
                  <Box sx={{ p: 1.6, bgcolor: "#fff", border: "1px solid #e2e8f0" }}>
                    <Typography fontWeight={700}>Hiển thị kết quả</Typography>

                    <Stack spacing={0.5}>
                      {[
                        ["choXemDiem", "Cho xem điểm"],
                        ["choXemDapAn", "Cho xem đáp án"],
                        ["xuatFileBaiLam", "Xuất file bài làm"],
                      ].map(([key, label]) => (
                        <Box
                          key={key}
                          onClick={() => updateConfigField(key, !config[key])}
                          sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                        >
                          <Checkbox
                            checked={config[key] || false}
                            onChange={(e) =>
                              updateConfigField(key, e.target.checked)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Typography>{label}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  {/* HỆ THỐNG */}
                  <Box sx={{ p: 1.6, bgcolor: "#fff", border: "1px solid #e2e8f0" }}>
                    <Typography fontWeight={700}>Hệ thống</Typography>
                    <Box
                      onClick={() =>
                        updateConfigField("khoaHeThong", !config.khoaHeThong)
                      }
                      sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                    >
                      <Checkbox
                        checked={config.khoaHeThong || false}
                        onChange={(e) =>
                          updateConfigField("khoaHeThong", e.target.checked)
                        }
                      />
                      <Typography fontWeight={700} color="#ef4444">
                        Khóa hệ thống
                      </Typography>
                    </Box>
                  </Box>              
                </Stack>
              </Grid>
            </Grid>
            
            <Box
              sx={{
                mt: 3,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  width: "100%",
                  maxWidth: 300, // 👈 giảm chiều rộng tổng thể
                }}
              >
                <Button
                  variant="contained"
                  onClick={() => setOpenBackup(true)}
                  sx={{
                    flex: 1, // 👈 chia đều nhưng không full quá rộng
                    textTransform: "none",
                    borderRadius: "12px",
                    py: 0.8,
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    boxShadow: "none",
                  }}
                >
                  Sao lưu
                </Button>

                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setOpenRestore(true)}
                  sx={{
                    flex: 1,
                    textTransform: "none",
                    borderRadius: "12px",
                    py: 0.8,
                    fontWeight: 700,
                    fontSize: "0.85rem",
                  }}
                >
                  Phục hồi
                </Button>
              </Stack>
            </Box>
          </Box>
        </Card>
      )}

      {/* Backup */}
      {openBackup && (
        <BackupPage
          open={openBackup}
          onClose={() => setOpenBackup(false)}
          config={config}
        />
      )}

      {/* Restore */}
      {openRestore && (
        <RestorePage
          open={openRestore}
          onClose={() => setOpenRestore(false)}
          config={config}
          showSnackbar={setSnackbar}
        />
      )}
    </Box>

    {/* Snackbar */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert severity={snackbar.severity} variant="filled">
        {snackbar.message}
      </Alert>
    </Snackbar>

    {/* Dialog phân quyền */}
    {openAssign && (
      <AssignClassDialog
        open={openAssign}
        onClose={() => setOpenAssign(false)}
        classes={classes}
      />
    )}

  </Box>
);
}
