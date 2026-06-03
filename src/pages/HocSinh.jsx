import React, { useState, useEffect, useContext } from "react";

/* =======================
   React Router
======================= */
import { useNavigate } from "react-router-dom";

/* =======================
   MUI Components
======================= */
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Card,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Paper,
} from "@mui/material";

/* =======================
   MUI Icons
======================= */
import SchoolIcon from "@mui/icons-material/School";
import HistoryIcon from "@mui/icons-material/History";
import GroupsIcon from "@mui/icons-material/Groups";

/* =======================
   Context
======================= */
import { ConfigContext } from "../context/ConfigContext";

/* =======================
   Firebase
======================= */
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

/* =======================
   Components
======================= */
import ResultDialog from "../dialog/ResultDialog";
// ✅ Chỉ còn 1 trường
const SCHOOL_LIST = ["TH Lâm Văn Bền"];

export default function HocSinh() {
  const navigate = useNavigate();
  const { config, setConfig } = useContext(ConfigContext);

  /* =======================
    FORM / SELECTION STATE
  ======================= */
  const [school, setSchool] = useState("TH Lâm Văn Bền"); // mặc định
  const [lop, setLop] = useState("4A");
  const [khoi, setKhoi] = useState("Khối 4");
  const [hocKi, setHocKi] = useState("");

  // const [fullname, setFullname] = useState("");
  // const [errorMsg, setErrorMsg] = useState("")

  /* =======================
    DATA STATE
  ======================= */
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);

  /* =======================
    UI STATE
  ======================= */
  const [showAll, setShowAll] = useState(false);

  /* =======================
    RESULT DIALOG STATE
  ======================= */
  const [openResultDialog, setOpenResultDialog] = useState(false);
  const [resultData, setResultData] = useState(null);
 
  // 🔹 Lọc lớp theo khối
  useEffect(() => {
    const soKhoi = khoi.replace("Khối ", "");
    const filtered = classes.filter(cl => cl.startsWith(soKhoi));
    setFilteredClasses(filtered);
    //setLop("");
  }, [khoi, classes]);

  useEffect(() => {
    if (!lop) return;

    const key = `hs_recent_${lop}`;
    const stored = JSON.parse(localStorage.getItem(key) || "[]");

    setRecentStudents(stored);
  }, [lop]);

  const convertToId = (name = "") =>
    "_" +
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_");
      
  const handleStudentClick = async (student) => {
    try {
      const namHocRaw = config?.namHoc || "2025_2026";
      const namHoc = namHocRaw.replaceAll("-", "_");
      const hocKy = config?.hocKy || "Cuối năm";
      const lop = student.lop || "4A";

      const studentKey = (student.id || "")
        .trim()
        .replace(/_$/, "");

      // ==========================
      // 🔥 RECENT (MOVE LÊN TRƯỚC)
      // ==========================
      const key = `hs_recent_${lop}`;
      const stored = JSON.parse(localStorage.getItem(key) || "[]");

      const updated = [
        student,
        ...stored.filter((s) => s.id !== student.id),
      ].slice(0, 4);

      localStorage.setItem(key, JSON.stringify(updated));
      setRecentStudents(updated);

      // ==========================
      // FIRESTORE CHECK
      // ==========================
      const examRef = doc(
        db,
        `DATA_KTDK_${namHoc}`,
        hocKy,
        lop,
        studentKey
      );

      const examSnap = await getDoc(examRef);

      if (examSnap.exists()) {
        const data = examSnap.data();

        setResultData({
          ...data,
          lop: lop,
          hoTen: student.hoTen,
        });

        setOpenResultDialog(true);
        return;
      }

      // ==========================
      // UPDATE CONFIG
      // ==========================
      setConfig((prev) => ({
        ...prev,
        lop,
        mon: prev?.mon || "Tin học",
      }));

      // ==========================
      // NAVIGATE
      // ==========================
      navigate("/tracnghiem", {
        state: {
          school,
          fullname: student.hoTen,
          lop,
        },
      });

    } catch (err) {
      console.error("🔥 ERROR FULL:", err);
      alert("Không kiểm tra được trạng thái bài làm.");
    }
  };

  // 🔹 Fetch danh sách lớp 
  useEffect(() => {
  const fetchClasses = async () => {
    try {
      const namHocRaw = config?.namHoc || "2025-2026";
      const namHocKey = namHocRaw.replaceAll("-", "_");

      console.log("📘 config.namHoc =", config?.namHoc);
      console.log("📘 namHocRaw =", namHocRaw);
      console.log("📘 namHocKey (Firestore doc) =", namHocKey);

      const lopRef = doc(db, "DANHSACH_LOP", namHocKey);
      const lopSnap = await getDoc(lopRef);

      console.log("📦 Firestore exists =", lopSnap.exists());
      console.log("📦 raw data =", lopSnap.data());

      const classList = lopSnap.exists()
        ? lopSnap.data().list || []
        : [];

      console.log("📚 classList trước sort =", classList);

      classList.sort((a, b) => a.localeCompare(b));

      console.log("📚 classList sau sort =", classList);

      setClasses(classList);

      setLop((prev) => prev || classList[0] || "");
    } catch (err) {
      console.error("❌ Lỗi fetch lớp theo năm học:", err);
      setClasses([]);
    }
  };

  fetchClasses();
}, [config?.namHoc]);

  useEffect(() => {
    const soKhoi = khoi.replace("Khối ", "");
    const filtered = classes.filter(cl => cl.startsWith(soKhoi));

    setFilteredClasses(filtered);

    // chỉ reset lớp, KHÔNG auto chọn lớp đầu
    //setLop("");
    setStudents([]);
  }, [khoi, classes]);

  useEffect(() => {
    if (!lop) return;
    fetchStudentsByClass(lop);
  }, [lop]);

  const namHocRaw = config?.namHoc || "2025-2026";
  const namHoc = namHocRaw.replaceAll("-", "_");

  const fetchStudentsByClass = async (classKey) => {
    try {
      if (!classKey) return;

      const snap = await getDocs(
        collection(
          db,
          `DS_HOCSINH_${namHoc}`,
          classKey,
          "STUDENTS"
        )
      );

      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      const getTenSortKey = (hoTen = "") =>
        hoTen.trim().split(/\s+/).reverse().join(" ");

      const compareVietnameseName = (a, b) => {
        const pa = (a.hoTen || "").trim().split(/\s+/).reverse();
        const pb = (b.hoTen || "").trim().split(/\s+/).reverse();

        const len = Math.max(pa.length, pb.length);

        for (let i = 0; i < len; i++) {
          const wa = pa[i] || "";
          const wb = pb[i] || "";

          const cmp = wa.localeCompare(wb, "vi", {
            sensitivity: "base",
            numeric: true,
          });

          if (cmp !== 0) return cmp;
        }

        return 0;
      };

      list.sort(compareVietnameseName);

      setStudents(list);
    } catch (err) {
      console.error("❌ Lỗi load học sinh:", err);
      setStudents([]);
    }
  };

  const handleStart = () => {
    if (!fullname.trim()) {
      setErrorMsg("❌ Vui lòng nhập Họ và tên!");
    } else if (!lop) {
      setErrorMsg("❌ Vui lòng chọn lớp!");
    } else {
      setErrorMsg("");
      setConfig(prev => ({ ...prev, lop, mon: prev.mon || "Tin học" }));
      navigate("/tracnghiem", { state: { school, fullname, lop } });
    }
  };

  const columnCount = 5;
  const rowsPerColumn = Math.ceil(
    students.length / columnCount
  );

  const columns = Array.from(
    { length: columnCount },
    (_, colIndex) =>
      students
        .slice(
          colIndex * rowsPerColumn,
          (colIndex + 1) * rowsPerColumn
        )
        .map((student, index) => ({
          ...student,
          displayIndex:
            colIndex * rowsPerColumn +
            index +
            1,
        }))
  );

  return (
  <Box
    sx={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      background:
        "linear-gradient(to bottom, #e3f2fd, #bbdefb)",
      pt: 3,
      px: 3,
      fontFamily:
        '"Segoe UI","Arial","Helvetica","Noto Sans","sans-serif"',
    }}
  >
    <Paper
      elevation={6}
      sx={{
        p: 4,
        borderRadius: 3,
        width: "100%",
        maxWidth: 1420,
        bgcolor: "#fff",
        minHeight: 650,
      }}
    >
      {/* TIÊU ĐỀ */}
      <Box
        sx={{
          textAlign: "center",
          mb: 2,
        }}
      >
        <Typography
          sx={{
            color: "#1976d2",
            fontSize: 26,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          {config?.examType === "on_tap"
            ? `ÔN TẬP - ${(config?.hocKy || "").toUpperCase()}`
            : `KTĐK - ${(config?.hocKy || "").toUpperCase()}`}
        </Typography>
      </Box>

      {/* KHỐI + LỚP */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
          mt: 1,
          mb: 4,
        }}
      >
        <FormControl
          size="small"
          sx={{ minWidth: 120 }}
        >
          <InputLabel>Khối</InputLabel>

          <Select
            value={khoi}
            label="Khối"
            onChange={(e) =>
              setKhoi(e.target.value)
            }
          >
            {[
              "Khối 1",
              "Khối 2",
              "Khối 3",
              "Khối 4",
              "Khối 5",
            ].map((k) => (
              <MenuItem
                key={k}
                value={k}
              >
                {k}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          sx={{ minWidth: 120 }}
        >
          <InputLabel>Lớp</InputLabel>

          <Select
            value={lop}
            label="Lớp"
            onChange={(e) => {
              const newClass =
                e.target.value;

              setLop(newClass);

              fetchStudentsByClass(
                newClass
              );
            }}
          >
            {filteredClasses.map(
              (cl) => (
                <MenuItem
                  key={cl}
                  value={cl}
                >
                  {cl}
                </MenuItem>
              )
            )}
          </Select>
        </FormControl>
      </Box>

      {/* GẦN ĐÂY */}
      {!showAll && (
        <Box
          sx={{
            width: "100%",
            maxWidth: 1200,
            mx: "auto",
            mb: 4,
          }}
        >
          {/* HEADER */}
          <Typography
            sx={{
              fontSize: 24,
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            Học sinh gần đây
          </Typography>

          <Typography
            sx={{
              fontSize: 14,
              color: "#64748b",
              mt: 0.5,
              mb: 3,
            }}
          >
            Truy cập nhanh học sinh vừa thao tác
          </Typography>

          {/* LIST */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },

              gap: 2.5,

              overflowX: { xs: "visible", sm: "auto" },
              overflowY: "visible",

              pb: 1,

              // chỉ scroll ngang trên desktop
              scrollSnapType: { xs: "none", sm: "x mandatory" },

              "&::-webkit-scrollbar": {
                height: 8,
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#cbd5e1",
                borderRadius: 999,
              },
            }}
          >
            {recentStudents.map((student, index) => (
              <Paper
                key={student.id}
                onClick={() => handleStudentClick(student)}
                elevation={0}
                sx={{
                  flexShrink: 0,

                  width: { xs: "100%", sm: 260 },
                  minWidth: { xs: "100%", sm: 260 },

                  borderRadius: "30px",
                  cursor: "pointer",
                  overflow: "hidden",
                  position: "relative",

                  border: "1px solid rgba(226,232,240,.9)",
                  background: "linear-gradient(180deg,#ffffff,#f8fbff)",
                  boxShadow: "0 8px 28px rgba(15,23,42,.06)",
                  transition: ".25s ease",

                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 18px 40px rgba(37,99,235,.16)",
                    borderColor: "#93c5fd",
                  },

                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 6,
                    background:
                      index % 2 === 0
                        ? "linear-gradient(90deg,#2563eb,#60a5fa)"
                        : "linear-gradient(90deg,#7c3aed,#a78bfa)",
                  },
                }}
              >
                <Box sx={{ p: 2.5, textAlign: "center" }}>
                  
                  {/* ICON */}
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: "24px",
                      mx: "auto",
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        index % 2 === 0
                          ? "linear-gradient(135deg,#2563eb,#60a5fa)"
                          : "linear-gradient(135deg,#7c3aed,#a78bfa)",
                      boxShadow: "0 14px 30px rgba(37,99,235,.22)",
                    }}
                  >
                    <SchoolIcon sx={{ color: "#fff", fontSize: 34 }} />
                  </Box>

                  {/* NAME */}
                  <Typography
                    sx={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#0f172a",
                      minHeight: 48,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >                   
                    {student.hoTen.toUpperCase()}
                  </Typography>

                  {/* CLASS */}
                  <Typography
                    sx={{
                      mt: 1,
                      fontSize: 13,
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Học sinh lớp {lop}
                  </Typography>

                  {/* CTA */}
                  <Box
                    sx={{
                      mt: 2.5,
                      py: 1.2,
                      borderRadius: "16px",
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#2563eb",
                      background: "#eff6ff",
                      transition: ".2s",

                      "&:hover": {
                        background: "#dbeafe",
                      },
                    }}
                  >
                    Bắt đầu làm bài
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>

          {/* BUTTON */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              mt: 3,
            }}
          >
            <Box
              onClick={() => {
                if (!lop) return;
                setShowAll(true);
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 3,
                py: 1.6,
                borderRadius: "18px",
                cursor: lop ? "pointer" : "not-allowed",
                background: lop
                  ? "linear-gradient(135deg,#eff6ff,#f8fbff)"
                  : "#e5e7eb",
                border: "1px solid #dbeafe",
                boxShadow: "0 8px 22px rgba(37,99,235,.12)",
                opacity: lop ? 1 : 0.5,
                pointerEvents: lop ? "auto" : "none",
              }}
            >
              <GroupsIcon sx={{ color: "#2563eb", fontSize: 28 }} />

              <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#2563eb" }}>
                Xem toàn bộ lớp
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* TOÀN BỘ LỚP */}
      {showAll && (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr", // 📱 1 cột trên điện thoại
                sm: "repeat(5, 1fr)", // 💻 desktop giữ 5 cột
              },
              gap: 2,
              alignItems: "start",
            }}
          >
            {columns.map((column, colIndex) => (
              <Box
                key={colIndex}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {column.map((student) => (
                  <Paper
                    key={student.id}
                    elevation={3}
                    onClick={() => handleStudentClick(student)}
                    sx={{
                      p: 2,
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: ".2s",

                      "&:hover": {
                        transform: "scale(1.03)",
                      },
                    }}
                  >
                    <Typography sx={{ fontWeight: 500, fontSize: 16 }}>
                      {student.displayIndex}. {student.hoTen.toUpperCase()}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            ))}
          </Box>

          {/* NÚT QUAY LẠI */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              mt: 4,
            }}
          >
            <Box
              onClick={() => setShowAll(false)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 3,
                py: 1.6,
                borderRadius: "18px",
                cursor: "pointer",
                background: "linear-gradient(135deg,#eff6ff,#f8fbff)",
                border: "1px solid #dbeafe",
              }}
            >
              <HistoryIcon sx={{ color: "#2563eb", fontSize: 28 }} />

              <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#2563eb" }}>
                Chế độ xem: Gần đây
              </Typography>
            </Box>
          </Box>
        </>
      )}

      <ResultDialog
        open={openResultDialog}
        onClose={() => setOpenResultDialog(false)}
        dialogMode="success"
        dialogMessage=""
        studentResult={
          config?.choXemDiem
            ? resultData
            : { ...resultData, lyThuyet: undefined }
        }
        choXemDiem={config?.choXemDiem ?? false}
        configData={config}
        convertPercentToScore={(v) => v}
      />
    </Paper>
  </Box>
);
}
