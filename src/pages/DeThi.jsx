import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Card,
  Stack,
  IconButton,
  Button,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { ChevronRight, ChevronLeft } from "@mui/icons-material";
import { collection, getDocs, setDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { ConfigContext } from "../context/ConfigContext";

export default function DeThi() {
  // ===== STATE =====
  const [examList, setExamList] = useState([]);          // danh sách đề
  const [selectedExam, setSelectedExam] = useState([]);  // đề đã chọn
  const [pendingExam, setPendingExam] = useState(null);
  const [pendingSelectedExam, setPendingSelectedExam] = useState(null);
  const [selectedExamToDelete, setSelectedExamToDelete] = useState(null);
  const { config } = useContext(ConfigContext); // lấy năm học từ context
  const [selectedYear, setSelectedYear] = useState(config.namHoc || "2025-2026");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // ===== LOAD DANH SÁCH ĐỀ =====
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const folder = "NGANHANG_DE";
        const snap = await getDocs(collection(db, folder));

        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // lọc theo selectedYear (ví dụ: "_25-26" hoặc "_26-27" trong tên file)
        const yearSuffix = selectedYear.split("-")[0].slice(-2) + "-" + selectedYear.split("-")[1].slice(-2);
        const filtered = list.filter(ex => ex.id.includes(yearSuffix));

        setExamList(filtered);
      } catch (err) {
        console.error("Lỗi lấy đề:", err);
      }
    };

    fetchExams();
  }, [selectedYear]);

  // ===== LOAD ĐỀ ĐÃ CHỌN =====
  useEffect(() => {
    const fetchSelectedExams = async () => {
      try {
        const folder = "DETHI"; // ✅ chỉ LVB
        const snap = await getDocs(collection(db, folder));

        const list = snap.docs.map((d) => ({
          id: d.id,
          tenDe: d.data().name || d.id,
        }));

        // lọc theo selectedYear
        const yearSuffix = selectedYear.split("-")[0].slice(-2) + "-" + selectedYear.split("-")[1].slice(-2);
        const filtered = list.filter(ex => ex.tenDe.includes(yearSuffix));

        setSelectedExam(filtered);
      } catch (err) {
        console.error("Lỗi lấy đề đã chọn:", err);
      }
    };

    fetchSelectedExams();
  }, [selectedYear]);


  // ===== ADD TO FIRESTORE =====
  const addExamToFirestore = async (ex) => {
    try {
      const folder = "DETHI"; // ✅ chỉ LVB
      const ref = doc(db, folder, ex.tenDe || ex.id);
      await setDoc(ref, { name: ex.tenDe || ex.id });
    } catch (err) {
      console.error("Lỗi lưu đề:", err);
    }
  };

  // ===== DELETE FROM FIRESTORE =====
  const removeExamFromFirestore = async (ex) => {
    try {
      const folder = "DETHI"; // ✅ chỉ LVB
      const ref = doc(db, folder, ex.tenDe || ex.id);
      await deleteDoc(ref);
    } catch (err) {
      console.error("Lỗi xóa đề:", err);
    }
  };

  // ===== DELETE EXAM =====
  const handleDeleteExam = async () => {
    if (!selectedExamToDelete) return alert("Chọn đề cần xóa!");

    const shouldDelete = window.confirm(
      `Xóa đề "${selectedExamToDelete.tenDe || selectedExamToDelete.id}"?`
    );
    if (!shouldDelete) return;

    try {
      const folder = "NGANHANG_DE"; // ✅ chỉ LVB
      await deleteDoc(doc(db, folder, selectedExamToDelete.id));

      // cập nhật UI
      setExamList((prev) =>
        prev.filter((it) => it.id !== selectedExamToDelete.id)
      );

      // nếu đề đó đang ở bảng "đề đã chọn" thì xóa luôn
      setSelectedExam((prev) =>
        prev.filter((it) => it.id !== selectedExamToDelete.id)
      );

      await removeExamFromFirestore(selectedExamToDelete);

      setSnackbar({
        open: true,
        message: "Xóa đề thành công!",
        severity: "success",
      });

      setSelectedExamToDelete(null);
    } catch (err) {
      console.error("Lỗi xóa đề:", err);
    }
  };

  // Hàm format tên đề
  const formatExamTitle = (examName = "") => {
    if (!examName) return "";

    // 1. Loại bỏ prefix "quiz_" nếu có
    let name = examName.startsWith("quiz_") ? examName.slice(5) : examName;

    // 2. Tách các phần theo dấu "_"
    const parts = name.split("_");

    // 3. Tìm lớp
    const classPart = parts.find(p => p.toLowerCase().includes("lớp")) || "";
    const classNumber = classPart.match(/\d+/)?.[0] || "";

    // 4. Tìm chỉ số lớp trong mảng để lấy môn
    const classIndex = parts.indexOf(classPart);

    // 5. Tìm môn: phần ngay sau lớp (hoặc phần đầu nếu lớp là đầu)
    let subjectPart = "";
    for (let i = classIndex + 1; i < parts.length; i++) {
      // bỏ qua CKI, CKII, CN, năm học cuối, chỉ lấy môn
      const p = parts[i];
      if (!p.toLowerCase().includes("cki") && !p.toLowerCase().includes("cn") && !/\d{2}-\d{2}/.test(p)) {
        subjectPart = p;
        break;
      }
    }

    // 6. Tìm phần mở rộng (CKI/CKII/CN) sau môn và lớp
    let extraPart = "";
    for (let i = classIndex + 1; i < parts.length; i++) {
      const p = parts[i];
      if (p.toLowerCase().includes("cki") || p.toLowerCase() === "cn") {
        extraPart = p.toUpperCase();
        break;
      }
    }

    // 7. Tìm ký hiệu đề (A, B, ...) trong ngoặc
    const match = examName.match(/\(([^)]+)\)/);
    const examLetter = match ? match[1] : "";

    // 8. Kết hợp lại
    return `${subjectPart} ${classNumber}${extraPart ? ` - ${extraPart}` : ""} ${examLetter ? `(${examLetter})` : ""}`.trim();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#e3f2fd",
        p: 3,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Card
        elevation={6}
        sx={{
          p: 3,
          borderRadius: 3,
          width: "100%",
          maxWidth: 600,
          backgroundColor: "#fff",
          maxHeight: "80vh",       // 👈 giảm chiều cao card
          overflowY: "auto",       // 👈 nếu nội dung vượt → card tự cuộn
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          color="primary"
          textAlign="center"
          sx={{ mt: 1, mb: 3 }}
        >
          QUẢN LÝ ĐỀ KIỂM TRA
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="namHoc-label">Năm học</InputLabel>
            <Select
              labelId="namHoc-label"
              value={selectedYear}
              label="Năm học"
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const start = 2025 + i;
                const end = start + 1;
                const value = `${start}-${end}`;
                return <MenuItem key={value} value={value}>{value}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Box>


        <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
          {/* ===================== DANH SÁCH ĐỀ ===================== */}
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight="bold" sx={{ mb: 1 }}>
              Danh sách đề
            </Typography>

            <Box
              sx={{
                maxHeight: 480,
                overflowY: "auto",
                border: "1px solid #ccc",
                borderRadius: 2,
              }}
            >
              {examList.length === 0 ? (
                <Typography sx={{ p: 2 }}>Không có đề</Typography>
              ) : (
                examList.map((ex) => (
                  <Stack
                    key={ex.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      px: 1,
                      py: 0.5,
                      cursor: "pointer",
                      backgroundColor:
                        selectedExamToDelete?.id === ex.id
                          ? "#ffebee"
                          : pendingExam?.id === ex.id
                          ? "#bbdefb"
                          : "transparent",
                      "&:hover": { background: "#e3f2fd" },
                    }}
                    onClick={() => setSelectedExamToDelete(ex)}
                    onMouseEnter={() => setPendingExam(ex)}
                    onMouseLeave={() => setPendingExam(null)}
                  >
                    {/*<Typography>{ex.tenDe || ex.id}</Typography>*/}
                    <Typography>{formatExamTitle(ex.tenDe || ex.id)}</Typography>

                    <IconButton
                      onClick={async (e) => {
                        e.stopPropagation();
                        setSelectedExam((prev) => {
                          if (prev.some((p) => p.id === ex.id)) return prev;
                          return [...prev, ex];
                        });
                        await addExamToFirestore(ex);
                      }}
                    >
                      <ChevronRight />
                    </IconButton>
                  </Stack>
                ))
              )}
            </Box>

            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 2 }}
              onClick={handleDeleteExam}
            >
              Xóa đề đã chọn
            </Button>
          </Box>

          {/* ===================== ĐỀ ĐÃ CHỌN ===================== */}
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight="bold" sx={{ mb: 1 }}>
              Đề đã chọn để kiểm tra
            </Typography>

            <Box
              sx={{
                maxHeight: 400,
                overflowY: "auto",
                border: "1px solid #ccc",
                borderRadius: 2,
              }}
            >
              {selectedExam.length === 0 ? (
                <Typography sx={{ p: 2 }}>Chưa chọn đề</Typography>
              ) : (
                selectedExam.map((ex) => (
                  <Stack
                    key={ex.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      px: 1,
                      py: 0.5,
                      "&:hover": { background: "#e3f2fd" },
                    }}
                    onMouseEnter={() => setPendingSelectedExam(ex)}
                    onMouseLeave={() => setPendingSelectedExam(null)}
                  >
                    {/*<Typography>{ex.tenDe || ex.id}</Typography>*/}
                    <Typography>{formatExamTitle(ex.tenDe || ex.id)}</Typography>

                    <IconButton
                      color="error"
                      onClick={async () => {
                        setSelectedExam((prev) =>
                          prev.filter((p) => p.id !== ex.id)
                        );
                        await removeExamFromFirestore(ex);
                      }}
                    >
                      <ChevronLeft />
                    </IconButton>
                  </Stack>
                ))
              )}
            </Box>
          </Box>
        </Stack>
      </Card>

      {/* ===== SNACKBAR ===== */}
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
    </Box>
  );
}
