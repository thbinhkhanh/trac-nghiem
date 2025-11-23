import React, { useState, useEffect } from "react";
import { Box, Card, Typography, Stack, CircularProgress, Button } from "@mui/material";
import { db } from "../firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";

export default function KetQua() {
  const [choXemDiem, setChoXemDiem] = useState(false);
  const [studentResult, setStudentResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false); // trạng thái xóa

  useEffect(() => {
    const fetchData = async () => {
      try {
        const configSnap = await getDoc(doc(db, "LAMVANBEN", "config"));
        const configData = configSnap.exists() ? configSnap.data() : {};

        if (configData.choXemDiem) {
          setChoXemDiem(true);

          const studentName = localStorage.getItem("studentName");
          const studentClass = localStorage.getItem("studentClass");
          const hocKi = "GKI";

          if (studentName && studentClass) {
            const normalizeName = studentName
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/đ/g, "d")
              .replace(/Đ/g, "D")
              .toLowerCase()
              .trim()
              .replace(/\s+/g, "_")
              .replace(/[^a-z0-9_]/g, "");

            const docRef = doc(db, `LAMVANBEN/${hocKi}/${studentClass}/${normalizeName}`);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) setStudentResult(docSnap.data());
          }
        } else {
          setChoXemDiem(false);
        }
      } catch (err) {
        console.error(err);
        setChoXemDiem(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!studentResult) return;
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa kết quả này không?");
    if (!confirmDelete) return;

    try {
      setDeleting(true);

      const studentName = studentResult.hoVaTen;
      const studentClass = studentResult.lop;
      const hocKi = "GKI";

      const normalizeName = studentName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      const docRef = doc(db, `LAMVANBEN/${hocKi}/${studentClass}/${normalizeName}`);
      await deleteDoc(docRef);

      alert("Xóa thành công!");
      setStudentResult(null);
    } catch (err) {
      console.error(err);
      alert("Xóa thất bại, vui lòng thử lại.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#e3f2fd",
        display: "flex",
        justifyContent: "center",
        pt: 4,
      }}
    >
      <Box sx={{ width: { xs: "95%", sm: 500 } }}>
        <Card
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 4,
            height: 250,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Stack spacing={2} alignItems="center">
            <Typography variant="h5" fontWeight="bold" color="primary" textAlign="center" sx={{ mb: 3 }}>
              KẾT QUẢ KIỂM TRA
            </Typography>

            {choXemDiem && studentResult ? (
              <Stack spacing={1} alignItems="flex-start" sx={{ width: "100%" }}>
                <Typography>Tên học sinh: {studentResult.hoVaTen}</Typography>
                <Typography>Lớp: {studentResult.lop}</Typography>
                <Typography>Điểm: {studentResult.diem}</Typography>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDelete}
                  disabled={deleting}
                  sx={{ mt: 2 }}
                >
                  {deleting ? "Đang xóa..." : "Xóa kết quả"}
                </Button>
              </Stack>
            ) : (
              <Typography variant="h6" align="center" sx={{ mt: 2 }}>
                Chúc mừng bạn đã hoàn thành bài thi
              </Typography>
            )}
          </Stack>
        </Card>
      </Box>
    </Box>
  );
}
