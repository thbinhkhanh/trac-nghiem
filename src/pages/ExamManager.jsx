import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  Stack,
  IconButton,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import { ChevronRight, ChevronLeft } from "@mui/icons-material";
import { collection, getDocs, setDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

export default function ExamManager() {
  // ===== STATE =====
  const [examList, setExamList] = useState([]);          // danh sách đề
  const [selectedExam, setSelectedExam] = useState([]);  // đề đã chọn
  const [pendingExam, setPendingExam] = useState(null);
  const [pendingSelectedExam, setPendingSelectedExam] = useState(null);
  const [selectedExamToDelete, setSelectedExamToDelete] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // ===== LOAD DANH SÁCH ĐỀ =====
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const folder = "TRACNGHIEM_LVB"; // ✅ chỉ LVB
        const snap = await getDocs(collection(db, folder));

        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setExamList(list);
      } catch (err) {
        console.error("Lỗi lấy đề:", err);
      }
    };

    fetchExams();
  }, []);

  // ===== LOAD ĐỀ ĐÃ CHỌN =====
  useEffect(() => {
    const fetchSelectedExams = async () => {
      try {
        const folder = "DETHI_LVB"; // ✅ chỉ LVB
        const snap = await getDocs(collection(db, folder));

        const list = snap.docs.map((d) => ({
          id: d.id,
          tenDe: d.data().name || d.id,
        }));

        setSelectedExam(list);
      } catch (err) {
        console.error("Lỗi lấy đề đã chọn:", err);
      }
    };

    fetchSelectedExams();
  }, []);

  // ===== ADD TO FIRESTORE =====
  const addExamToFirestore = async (ex) => {
    try {
      const folder = "DETHI_LVB"; // ✅ chỉ LVB
      const ref = doc(db, folder, ex.tenDe || ex.id);
      await setDoc(ref, { name: ex.tenDe || ex.id });
    } catch (err) {
      console.error("Lỗi lưu đề:", err);
    }
  };

  // ===== DELETE FROM FIRESTORE =====
  const removeExamFromFirestore = async (ex) => {
    try {
      const folder = "DETHI_LVB"; // ✅ chỉ LVB
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
      const folder = "TRACNGHIEM_LVB"; // ✅ chỉ LVB
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

    // 3. Tìm lớp (ví dụ: "Lớp 4")
    const classPart = parts.find(p => p.toLowerCase().includes("lớp")) || "";
    const classNumber = classPart.match(/\d+/)?.[0] || "";

    // 4. Tìm môn (giả sử môn là phần không phải "Lớp" và không phải CKI)
    const subjectPart = parts.find(
      p => !p.toLowerCase().includes("lớp") && !p.toLowerCase().includes("cki")
    ) || "";

    // 5. Tìm ký hiệu đề (A, B, ...) trong ngoặc
    const match = examName.match(/\(([^)]+)\)/);
    const examLetter = match ? match[1] : "";

    // 6. Kết hợp lại: "Môn Lớp (Đề X)"
    return `${subjectPart.trim()} ${classNumber} ${examLetter ? `(Đề ${examLetter})` : ""}`.trim();
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

        <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
          {/* ===================== DANH SÁCH ĐỀ ===================== */}
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight="bold" sx={{ mb: 1 }}>
              Danh sách đề
            </Typography>

            <Box
              sx={{
                maxHeight: 450,
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
                      px: 2,
                      py: 1,
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
                      px: 2,
                      py: 1,
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
