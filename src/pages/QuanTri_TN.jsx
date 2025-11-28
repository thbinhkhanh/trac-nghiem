import React, { useState, useEffect, useContext } from "react";
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
} from "@mui/material";
import { Add, Delete, Close, ChevronRight, ChevronLeft } from "@mui/icons-material";

import { ConfigContext } from "../context/ConfigContext";
import { StudentContext } from "../context/StudentContext";
import { doc, getDoc, getDocs, setDoc, collection, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import CloseIcon from "@mui/icons-material/Close";

export default function QuanTri() {
  const account = localStorage.getItem("account") || "";
  const isLamVanBen = account === "TH Lâm Văn Bền";
  const isAdmin = account === "Admin";

  const { classData, setClassData } = useContext(StudentContext);

  const [openChangePw, setOpenChangePw] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");

  const [firestorePassword, setFirestorePassword] = useState("");

  // ===== Lâm Văn Bền: state local =====
  const [configLocal, setConfigLocal] = useState({
    mon: "Tin học",
    lop: "",
    hocKy: "Giữa kỳ I",
    choXemDiem: false,
    xuatFileBaiLam: false,
    choXemDapAn: false,
    truyCap_BinhKhanh: false,
    truyCap_LamVanBen: false,
  });

  useEffect(() => {
  const fetchPassword = async () => {
    try {
      let docId = "ADMIN";
      if (account === "TH Lâm Văn Bền") docId = "LVB";
      else if (account === "TH Bình Khánh") docId = "BK";

      const snap = await getDoc(doc(db, "MATKHAU", docId));
      if (snap.exists()) {
        setFirestorePassword(snap.data().pass || "1");
      }
    } catch (err) {
      console.error("Lỗi lấy mật khẩu Firestore:", err);
    }
  };

  fetchPassword();
}, [account]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [subject, setSubject] = useState("Tin học");
  const [selectedSemester, setSelectedSemester] = useState("Giữa kỳ I");
  const [addingClass, setAddingClass] = useState(false);
  const [newClass, setNewClass] = useState("");

  // ===== Người dùng khác: context =====
  const configContext = useContext(ConfigContext);
  const configOther = configContext?.config || {};
  const setConfigOther = configContext?.setConfig || (() => {});

  // ===== Thời gian =====
  const [timeInput, setTimeInput] = useState(1);

  // ===== Sắp xếp lớp =====
  const sortClasses = (list) => {
    return [...list].sort((a, b) => {
      const matchA = a.match(/(\d+)([A-Z]+)/);
      const matchB = b.match(/(\d+)([A-Z]+)/);
      if (!matchA || !matchB) return a.localeCompare(b);
      const [numA, charA] = [parseInt(matchA[1]), matchA[2]];
      const [numB, charB] = [parseInt(matchB[1]), matchB[2]];
      if (numA !== numB) return numA - numB;
      return charA.localeCompare(charB);
    });
  };

  // ===== Fetch data =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isLamVanBen) {
          const docRef = doc(db, "LAMVANBEN", "config");
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            setConfigLocal({
              mon: data.mon ?? "Tin học",
              lop: data.lop ?? "",
              hocKy: data.hocKy ?? "Giữa kỳ I",
              choXemDiem: data.choXemDiem ?? false,
              choXemDapAn: data.choXemDapAn ?? false,
              xuatFileBaiLam: data.xuatFileBaiLam ?? false,
              truyCap_BinhKhanh: data.truyCap_BinhKhanh ?? false,
              truyCap_LamVanBen: data.truyCap_LamVanBen ?? false,
            });
            setSelectedClass(data.lop ?? "");
            setSubject(data.mon ?? "Tin học");
            setSelectedSemester(data.hocKy ?? "Giữa kỳ I");
            setTimeInput(data.timeLimit ?? 1);
          }

          const lopRef = doc(db, "LAMVANBEN", "lop");
          const lopSnap = await getDoc(lopRef);
          let classList = lopSnap.exists() ? lopSnap.data().list ?? [] : [];
          classList = sortClasses(classList);
          setClasses(classList);
          setSelectedClass((prev) => prev || classList[0] || "");
        } else {
          let classList = classData?.length ? classData : [];
          if (!classList.length) {
            const snapshot = await getDocs(collection(db, "DANHSACH"));
            classList = snapshot.docs.map((doc) => doc.id);
            setClassData(classList);
          }
          classList = sortClasses(classList);
          setClasses(classList);
          setSelectedClass(configOther.lop || classList[0] || "");
          setSubject(configOther.mon || "Tin học");
          setSelectedSemester(configOther.hocKy || "Giữa kỳ I");
          setTimeInput(configOther.timeLimit ?? 1);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [account, classData, setClassData, configOther]);

  // ===== Update field =====
  const updateConfigField = async (field, value) => {
    if (isLamVanBen) {
      setConfigLocal((prev) => ({ ...prev, [field]: value }));
      try {
        await setDoc(doc(db, "LAMVANBEN", "config"), { [field]: value }, { merge: true });
      } catch (err) {
        console.error(err);
      }
    } else {
      setConfigOther((prev) => ({ ...prev, [field]: value }));
      try {
        await setDoc(doc(db, "CONFIG", "config"), { [field]: value }, { merge: true });
      } catch (err) {
        console.error(err);
      }
    }

    if (field === "lop") setSelectedClass(value);
    if (field === "mon") setSubject(value);
    if (field === "hocKy") setSelectedSemester(value);
    if (field === "timeLimit") setTimeInput(value);
  };

  // ===== Thêm / Xóa lớp =====
  const handleAddClass = async () => {
    const className = newClass.trim().toUpperCase();
    if (!className || classes.includes(className)) return alert("Lớp đã tồn tại!");
    const updatedClasses = sortClasses([...classes, className]);
    setClasses(updatedClasses);
    setSelectedClass(className);
    updateConfigField("lop", className);
    if (isLamVanBen) await setDoc(doc(db, "LAMVANBEN", "lop"), { list: updatedClasses }, { merge: true });
    setNewClass("");
    setAddingClass(false);
  };

  const handleDeleteClass = async () => {
    const updatedClasses = classes.filter((c) => c !== selectedClass);
    setClasses(sortClasses(updatedClasses));
    const nextClass = updatedClasses[0] || "";
    setSelectedClass(nextClass);
    updateConfigField("lop", nextClass);
    if (isLamVanBen) await setDoc(doc(db, "LAMVANBEN", "lop"), { list: updatedClasses }, { merge: true });
  };

  const handleTimeLimitChange = (value) => {
    const v = Math.max(1, Number(value));
    setTimeInput(v);
    updateConfigField("timeLimit", v);
  };

  const handleChangePassword = async () => {
    if (oldPw !== firestorePassword) {
      setPwError("❌ Mật khẩu cũ không đúng!");
      return;
    }
    if (!newPw.trim()) {
      setPwError("❌ Mật khẩu mới không được để trống!");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("❌ Mật khẩu nhập lại không khớp!");
      return;
    }

    try {
      let docId = "ADMIN";
      if (account === "TH Lâm Văn Bền") docId = "LVB";
      else if (account === "TH Bình Khánh") docId = "BK";

      const ref = doc(db, "MATKHAU", docId);
      await setDoc(ref, { pass: newPw }, { merge: true });

      // ⭐ Cập nhật password trong state để lần sau kiểm tra đúng
      setFirestorePassword(newPw);

      setPwError("");
      setOpenChangePw(false);

      setSnackbar({
        open: true,
        message: "✅ Đổi mật khẩu thành công!",
        severity: "success",
      });

      setOldPw("");
      setNewPw("");
      setConfirmPw("");

    } catch (err) {
      console.error("❌ Lỗi lưu mật khẩu Firestore:", err);
      setPwError("❌ Lỗi khi lưu mật khẩu!");

      setSnackbar({
        open: true,
        message: "❌ Lỗi khi lưu mật khẩu!",
        severity: "error",
      });
    }
  };

  // ===== Đề thi =====
  const [examList, setExamList] = useState([]);       // tất cả đề
  const [selectedExam, setSelectedExam] = useState([]); // mảng đề đã chọn
  const [pendingExam, setPendingExam] = useState(null); // tạm highlight
  const [pendingSelectedExam, setPendingSelectedExam] = useState(null);


  // Load danh sách đề thi từ Firestore
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const folder = isLamVanBen ? "TRACNGHIEM_LVB" : "TRACNGHIEM_BK";
        const ref = collection(db, folder);
        const snap = await getDocs(ref);

        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setExamList(list);
      } catch (e) {
        console.error("❌ Lỗi lấy đề thi Firestore:", e);
      }
    };

    fetchExams();
  }, [account, isLamVanBen]);

// Fetch đề đã chọn khi tải trang
  useEffect(() => {
    const fetchSelectedExams = async () => {
      try {
        const folder = account === "TH Lâm Văn Bền" ? "DETHI_LVB" : "DETHI_BK";
        const ref = collection(db, folder);
        const snap = await getDocs(ref);

        // Lấy danh sách tên đề đã lưu
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          tenDe: doc.data().name || doc.id
        }));

        setSelectedExam(list);
      } catch (err) {
        console.error("Lỗi fetch đề đã chọn Firestore:", err);
      }
    };

    fetchSelectedExams();
  }, [account]);

  // Thêm đề vào Firestore (chỉ lưu tên đề)
  const addExamToFirestore = async (ex) => {
    try {
      const folder = account === "TH Lâm Văn Bền" ? "DETHI_LVB" : "DETHI_BK";
      // Lưu document ID đúng tên đề, chỉ lưu tên đề thôi
      const ref = doc(db, folder, ex.tenDe || ex.id);
      await setDoc(ref, { name: ex.tenDe || ex.id });
    } catch (err) {
      console.error("Lỗi lưu đề Firestore:", err);
    }
  };

  // Xóa đề khỏi Firestore
  const removeExamFromFirestore = async (ex) => {
    try {
      const folder = account === "TH Lâm Văn Bền" ? "DETHI_LVB" : "DETHI_BK";
      const ref = doc(db, folder, ex.tenDe || ex.id);
      await deleteDoc(ref);
    } catch (err) {
      console.error("Lỗi xóa đề Firestore:", err);
    }
  };

  // state để lưu đề được chọn (dùng để xóa / highlight)
  const [selectedExamToDelete, setSelectedExamToDelete] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleDeleteExam = async () => {
    if (!selectedExamToDelete) {
      alert("Vui lòng chọn một đề trước khi xóa!");
      return;
    }

    const confirmDelete = window.confirm(
      `❗ Bạn có chắc muốn xóa đề: ${selectedExamToDelete.tenDe || selectedExamToDelete.id}?`
    );
    if (!confirmDelete) return;

    try {
      // 🔹 Lấy thư mục đề đúng theo trường
      const folder = isLamVanBen ? "TRACNGHIEM_LVB" : "TRACNGHIEM_BK";

      // 🔹 Xóa trên Firestore
      await deleteDoc(doc(db, folder, selectedExamToDelete.id));

      // 🔹 Xóa khỏi danh sách hiển thị
      const updatedList = examList.filter((d) => d.id !== selectedExamToDelete.id);
      setExamList(updatedList);

      // 🔹 Nếu đề đang nằm trong bảng "Đề đã chọn" → gỡ ra luôn
      setSelectedExam((prev) => prev.filter((e) => e.id !== selectedExamToDelete.id));
      await removeExamFromFirestore(selectedExamToDelete);

      // Reset chọn
      setSelectedExamToDelete(null);

      setSnackbar({
        open: true,
        message: "🗑️ Xóa đề thành công!",
        severity: "success",
      });

    } catch (err) {
      console.error("❌ Lỗi khi xóa đề:", err);
      alert("❌ Không thể xóa đề: " + err.message);
    }
  };



  const renderConfig = isLamVanBen ? configLocal : configOther;

  return (
  <Box
    sx={{
      minHeight: "100vh",
      backgroundColor: "#e3f2fd",
      pt: 3,
      display: "flex",
      justifyContent: "center",
    }}
  >
    <Stack
      direction={{ xs: "column", sm: "row" }} // responsive: cột trên điện thoại
      spacing={2}
      sx={{ width: { xs: "95%", sm: "75%" }, maxWidth: 1200, mx: "auto" }}
    >
      {/* ========================== CỘT TRÁI: CẤU HÌNH ========================== */}
      <Card
        elevation={6}
          sx={{
            p: 3,
            borderRadius: 3,
            flex: 2,
            //height: 600,       // chiều cao cố định, áp dụng cho cả mobile
            //minHeight: 500,    // tối thiểu
            height: { xs: 600, sm: 600 },
            minHeight: { xs: 600, sm: 500 },
          }}
        >
          <Typography
            variant="h6"
            fontWeight="bold"
            color="primary"
            gutterBottom
            sx={{ textAlign: "center", mb: 3 }}
          >
            CẤU HÌNH HỆ THỐNG
          </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
            gap: 1,
          }}
        >
          <Typography
            variant="subtitle1"
            color="textSecondary"
            sx={{ fontWeight: "bold" }}
          >
            {account || "Chưa đăng nhập"}
          </Typography>

          <IconButton
            size="small"
            sx={{ color: "orange" }}
            onClick={() => setOpenChangePw(true)}
          >
            <VpnKeyIcon fontSize="medium" />
          </IconButton>
        </Box>

        <Stack spacing={2}>
          {/* Học kỳ */}
          <FormControl fullWidth size="small">
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

          {/* Môn */}
          <FormControl fullWidth size="small">
            <InputLabel id="mon-label">Môn</InputLabel>
            <Select
              labelId="mon-label"
              value={subject}
              onChange={(e) => updateConfigField("mon", e.target.value)}
              label="Môn"
            >
              <MenuItem value="Tin học">Tin học</MenuItem>
              <MenuItem value="Công nghệ">Công nghệ</MenuItem>
            </Select>
          </FormControl>

          {/* Lớp */}
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel id="lop-label">Lớp</InputLabel>
              <Select
                labelId="lop-label"
                value={selectedClass}
                onChange={(e) => updateConfigField("lop", e.target.value)}
                label="Lớp"
              >
                {classes.map((cls) => (
                  <MenuItem key={cls} value={cls}>
                    {cls}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <IconButton
              sx={{ color: "green" }}
              onClick={() => setAddingClass(true)}
            >
              <Add />
            </IconButton>

            <IconButton sx={{ color: "red" }} onClick={handleDeleteClass}>
              <Delete />
            </IconButton>
          </Stack>

          {addingClass && (
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                label="Tên lớp"
                value={newClass}
                onChange={(e) => setNewClass(e.target.value)}
                fullWidth
              />
              <Button
                variant="contained"
                size="small"
                sx={{ bgcolor: "green" }}
                onClick={handleAddClass}
              >
                Lưu
              </Button>
              <Button size="small" onClick={() => setAddingClass(false)}>
                Hủy
              </Button>
            </Stack>
          )}

          {/* Thời gian */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ minWidth: 140 }}>
              Thời gian làm bài (phút)
            </Typography>
            <TextField
              type="number"
              size="small"
              value={timeInput}
              onChange={(e) => handleTimeLimitChange(e.target.value)}
              inputProps={{ min: 1, style: { width: 60, textAlign: "center" } }}
            />
          </Box>

          {/* Checkboxes */}
          <Box sx={{ ml: 4, mt: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Checkbox
                checked={renderConfig.choXemDiem || false}
                onChange={(e) => updateConfigField("choXemDiem", e.target.checked)}
              />
              <Typography>Cho xem điểm</Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Checkbox
                checked={renderConfig.choXemDapAn || false}
                onChange={(e) =>
                  updateConfigField("choXemDapAn", e.target.checked)
                }
              />
              <Typography>Cho xem đáp án</Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Checkbox
                checked={renderConfig.xuatFileBaiLam || false}
                onChange={(e) =>
                  updateConfigField("xuatFileBaiLam", e.target.checked)
                }
              />
              <Typography>Xuất file bài làm</Typography>
            </Box>
          </Box>


          {/* Nhóm truy cập – CHỈ HIỂN THỊ KHI LÀ ADMIN */}
          {isAdmin && (
            <Box sx={{ mt: 1, ml: 4 }}>
              <Typography sx={{ fontWeight: "bold", mb: 1 }}>
                Cho phép truy cập:
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Checkbox
                  checked={renderConfig.truyCap_BinhKhanh || false}
                  onChange={(e) =>
                    updateConfigField("truyCap_BinhKhanh", e.target.checked)
                  }
                />
                <Typography>TH Bình Khánh</Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Checkbox
                  checked={renderConfig.truyCap_LamVanBen || false}
                  onChange={(e) =>
                    updateConfigField("truyCap_LamVanBen", e.target.checked)
                  }
                />
                <Typography>TH Lâm Văn Bền</Typography>
              </Box>
            </Box>
          )}


        </Stack>
      </Card>

      {/* ========================== CỘT PHẢI: 2 BẢNG ĐỀ THI ========================== */}
      <Card
        elevation={6}
        sx={{
          p: 3,
          borderRadius: 3,
          flex: 5,
          minHeight: { xs: "auto", sm: 500 },
          maxHeight: { xs: "auto", sm: 600 },
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          color="primary"
          gutterBottom
          sx={{ textAlign: "center", mb: 3 }}
        >
          ĐỀ KIỂM TRA
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ width: "100%" }}
        >
          {/* ===== BẢNG 1: Danh sách đề ===== */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Danh sách đề
            </Typography>

            {/* Danh sách đề có scroll */}
            <Box
              sx={{
                maxHeight: { xs: 200, sm: 450 },
                overflowY: "auto",
                border: "1px solid #ccc",
                borderRadius: 2,
                mb: 1,
              }}
            >
              {examList.length === 0 ? (
                <Typography sx={{ p: 2, color: "gray" }}>
                  Không có đề
                </Typography>
              ) : (
                examList.map((ex) => (
                  <Stack
                    key={ex.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      px: 2,
                      py: 1,
                      height: 30,
                      cursor: "pointer",
                      backgroundColor:
                        selectedExamToDelete?.id === ex.id
                          ? "#ffebee"
                          : pendingExam?.id === ex.id
                          ? "#bbdefb"
                          : "transparent",
                      "&:hover": { background: "#e3f2fd" },
                      borderRadius: 1,
                      mb: 0, // bỏ khoảng trắng giữa các dòng
                    }}
                    onClick={() => setSelectedExamToDelete(ex)}
                    onMouseEnter={() => setPendingExam(ex)}
                    onMouseLeave={() => setPendingExam(null)}
                  >
                    <Typography variant="subtitle1">
                      {ex.tenDe || ex.id}
                    </Typography>

                    <IconButton
                      color="primary"
                      size="small"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setSelectedExam((prev) => {
                          if (!prev) return [ex];
                          if (prev.some((e) => e.id === ex.id)) return prev;
                          return [...prev, ex];
                        });
                        await addExamToFirestore(ex);
                        setPendingExam(null);
                      }}
                    >
                      <ChevronRight />
                    </IconButton>
                  </Stack>
                ))
              )}
            </Box>

            {/* Nút xóa đề */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Button
                variant="contained"
                sx={{ 
                  maxWidth: 200, 
                  width: "100%", 
                  bgcolor: "primary.main",   // nền xanh
                  "&:hover": { bgcolor: "primary.dark" } // màu hover
                }}
                onClick={handleDeleteExam}
              >
                Xóa đề đã chọn
              </Button>
            </Box>
          </Box>

          {/* ===== BẢNG 2: Đề đã chọn ===== */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Đề đã chọn để kiểm tra
            </Typography>

            <Box
              sx={{
                maxHeight: { xs: 200, sm: 400 },
                overflowY: "auto",
                border: "1px solid #ccc",
                borderRadius: 2,
              }}
            >
              {selectedExam && selectedExam.length > 0 ? (
                selectedExam.map((ex) => (
                  <Stack
                    key={ex.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      px: 2,
                      py: 1,
                      height: 30,
                      borderBottom: "1px solid #eee",
                      backgroundColor:
                        ex.id === pendingSelectedExam?.id
                          ? "#bbdefb"
                          : "transparent",
                      "&:hover": { background: "#e3f2fd" },
                    }}
                    onMouseEnter={() => setPendingSelectedExam(ex)}
                    onMouseLeave={() => setPendingSelectedExam(null)}
                  >
                    <Typography variant="subtitle1">{ex.tenDe || ex.id}</Typography>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={async () => {
                        setSelectedExam((prev) =>
                          prev.filter((e) => e.id !== ex.id)
                        );
                        await removeExamFromFirestore(ex);
                      }}
                    >
                      <ChevronLeft />
                    </IconButton>
                  </Stack>
                ))
              ) : (
                <Typography sx={{ p: 2, color: "textSecondary" }}>
                  Chưa chọn đề
                </Typography>
              )}
            </Box>
          </Box>
        </Stack>
      </Card>
    </Stack>

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

    <Dialog
      open={openChangePw}
      onClose={(event, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") return;
        setOpenChangePw(false);
      }}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "#fff", // ❌ đổi nền trắng
          boxShadow: 6,
        },
      }}
    >
      {/* Thanh tiêu đề */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#1976d2",
          color: "#fff",
          px: 2,
          py: 1.2,
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: "bold", fontSize: "1.1rem", letterSpacing: 0.5 }}
        >
          ĐỔI MẬT KHẨU
        </Typography>
        <IconButton
          onClick={() => setOpenChangePw(false)}
          sx={{ color: "#fff", p: 0.6 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Nội dung */}
      <DialogContent sx={{ mt: 1, bgcolor: "#fff" }}> {/* nền trắng */}
        <Stack spacing={2} sx={{ pl: 2.5, pr: 2.5 }}>
          <TextField
            label="Mật khẩu cũ"
            type="password"
            fullWidth
            size="small"
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
          />
          <TextField
            label="Mật khẩu mới"
            type="password"
            fullWidth
            size="small"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
          <TextField
            label="Nhập lại mật khẩu"
            type="password"
            fullWidth
            size="small"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
          />

          {pwError && (
            <Typography color="error" sx={{ fontWeight: 600 }}>
              {pwError}
            </Typography>
          )}

          <Stack direction="row" justifyContent="flex-end" spacing={1} mt={1}>
            <Button onClick={() => setOpenChangePw(false)}>Hủy</Button>
            <Button variant="contained" onClick={handleChangePassword}>
              Lưu
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>



  </Box>
);


}
