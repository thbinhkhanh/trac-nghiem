import React, { useState, useEffect, useContext } from "react";

// ================= MUI =================
import {
  Box,
  Card,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  useMediaQuery,
  InputLabel,
  Snackbar,
  Alert,
} from "@mui/material";

// ================= FIREBASE =================
import { db } from "../firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  writeBatch
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";

// ================= CONTEXT =================
import { StudentContext } from "../context/StudentContext";
import { ConfigContext } from "../context/ConfigContext";
import { StudentKTDKContext } from "../context/StudentKTDKContext";

// ================= ICONS =================
import SaveIcon from "@mui/icons-material/Save";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import PrintIcon from "@mui/icons-material/Print";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import RateReviewIcon from "@mui/icons-material/RateReview";

// ================= UTILS =================
import { exportKTDK } from "../utils/exportKTDK";
import { printKTDK } from "../utils/printKTDK";
import { filterClassesByRole } from "../utils/filterClassesByRole";

import QuanLyNhanXet from "../dialog/QuanLyNhanXet";

export default function NhapdiemKTDK() {
  const navigate = useNavigate();
  const account = localStorage.getItem("account") || "";
  
  const { classData, setClassData, studentData, setStudentData } = useContext(StudentContext);
  const { config, setConfig } = useContext(ConfigContext);
  const namHocKey = (config?.namHoc || "2025-2026").replace(/-/g, "_");
  const { getStudentsForClass, setStudentsForClass } = useContext(StudentKTDKContext);


  // ================= CLASS / DATA STATE =================
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [originalStudents, setOriginalStudents] = useState([]);

  // ================= SUBJECT =================
  const [selectedSubject, setSelectedSubject] = useState(() => config?.mon || "Tin học");

  // ================= UI / RESPONSIVE =================
  const isMobile = useMediaQuery("(max-width: 768px)");

  // ================= DIALOG STATE =================
  const [openLTDialog, setOpenLTDialog] = useState(false);
  const [openNhanXet, setOpenNhanXet] = useState(false);

  // ================= EDITING STATE =================
  const [editingStudent, setEditingStudent] = useState(null);
  const [ltValue, setLtValue] = useState("");
  const [fillThucHanh, setFillThucHanh] = useState("");
  const [fillLyThuyet, setFillLyThuyet] = useState("");

  const [nhanXetData, setNhanXetData] = useState(null);
  
  useEffect(() => {
    if (config?.mon && config.mon !== selectedSubject) {
      setSelectedSubject(config.mon);
    }
  }, [config?.mon]);

  /*useEffect(() => {
    if (config?.lop) setSelectedClass(config.lop);
  }, [config?.lop]);*/

  useEffect(() => {
    if (!config?.namHoc) return;

    const yearKey = config.namHoc.replaceAll("-", "_");

    const savedClass = localStorage.getItem(`selectedClass_${yearKey}`);

    if (savedClass) {
      setSelectedClass(savedClass);
    } else if (config?.lop) {
      setSelectedClass(config.lop);
    }
  }, [config?.lop, config?.namHoc]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const namHocRaw = config?.namHoc || "2025-2026";
        const namHocKey = namHocRaw.replaceAll("-", "_");

        const lopRef = doc(db, "DANHSACH_LOP", namHocKey);
        const lopSnap = await getDoc(lopRef);

        const classList = lopSnap.exists()
          ? lopSnap.data().list || []
          : [];

        classList.sort((a, b) => a.localeCompare(b));

        // =========================
        // 🔐 FILTER THEO ACCOUNT
        // =========================
        const filtered = await filterClassesByRole({
          db,
          account,
          allClasses: classList,
        });

        setClassData(filtered);
        setClasses(filtered);

        // giữ lớp đang chọn nếu còn hợp lệ
        setSelectedClass((prev) => {
          if (prev && filtered.includes(prev)) return prev;
          return filtered[0] || "";
        });

      } catch (err) {
        console.error("❌ Lỗi lấy danh sách lớp:", err);
        setClasses([]);
        setClassData([]);
      }
    };

    fetchClasses();
  }, [config?.namHoc, account]);

 const loadNhanXet = async () => {
     try {
       const col = `NHAN_XET_${namHocKey}`;
       const hocKy = config.hocKy;
 
       const docId = hocKy.includes("Cuối")
        ? "TinHoc_CuoiKy"
        : "TinHoc_GiuaKy";
 
       const snap = await getDoc(doc(db, col, docId));
 
       // =========================
       // 🔥 SAFE NORMALIZER (FIX [object Object])
       // =========================
       const safe = (v) => {
         if (!v) return [];
 
         // array case
         if (Array.isArray(v)) {
           return v.map(i =>
             typeof i === "string"
               ? i
               : (i?.text || i?.value || "")
           ).filter(Boolean);
         }
 
         // object case (Firestore map)
         if (typeof v === "object") {
           return Object.values(v).map(i =>
             typeof i === "string"
               ? i
               : (i?.text || i?.value || "")
           ).filter(Boolean);
         }
 
         return [];
       };
 
       // =========================
       // 🔥 DEFAULT DATA
       // =========================
       if (!snap.exists()) {
         setNhanXetData({
           TỐT: { lyThuyet: [], thucHanh: [] },
           KHÁ: { lyThuyet: [], thucHanh: [] },
           ĐẠT: { lyThuyet: [], thucHanh: [] },
           "CHƯA ĐẠT": { lyThuyet: [], thucHanh: [] },
         });
         return;
       }
 
       const raw = snap.data();
 
       // =========================
       // 🔥 NORMALIZE FIRESTORE → UI FORMAT
       // =========================
       const normalized = {
         TỐT: {
           lyThuyet: safe(raw?.tot?.lyThuyet),
           thucHanh: safe(raw?.tot?.thucHanh),
         },
         KHÁ: {
           lyThuyet: safe(raw?.kha?.lyThuyet),
           thucHanh: safe(raw?.kha?.thucHanh),
         },
         ĐẠT: {
           lyThuyet: safe(raw?.trungbinh?.lyThuyet),
           thucHanh: safe(raw?.trungbinh?.thucHanh),
         },
         "CHƯA ĐẠT": {
           lyThuyet: safe(raw?.yeu?.lyThuyet),
           thucHanh: safe(raw?.yeu?.thucHanh),
         },
       };
 
       setNhanXetData(normalized);
 
     } catch (err) {
       console.error("loadNhanXet error:", err);
     }
   };

  // ------------------------
// 🔹 HÀM SINH NHẬN XÉT TỰ ĐỘNG
// ------------------------
useEffect(() => {
  loadNhanXet();
}, [config.hocKy]);

  // ------------------------
// 🔹 HÀM SINH NHẬN XÉT TỰ ĐỘNG
// ------------------------
const generateNhanXet = (student) => {
  if (!nhanXetData) return student.nhanXet || "";

  const lt = student.lyThuyet;
  const th = student.thucHanh;

  // ❗ nếu thiếu 1 trong 2 điểm → không sinh nhận xét
  if (lt === "" || lt === null || lt === undefined ||
      th === "" || th === null || th === undefined) {
    return student.nhanXet || "";
  }

  const xepLoai = (diem) => {
    const score = Number(diem);

    if (score >= 4.5) return "TỐT";
    if (score >= 3.5) return "KHÁ";
    if (score >= 2.5) return "ĐẠT";
    return "CHƯA ĐẠT";
  };

  const pickRandom = (arr) =>
    Array.isArray(arr) && arr.length
      ? arr[Math.floor(Math.random() * arr.length)]
      : "";

  const loaiLT = xepLoai(lt);
  const loaiTH = xepLoai(th);

  const nxLT = pickRandom(nhanXetData?.[loaiLT]?.lyThuyet || []);
  const nxTH = pickRandom(nhanXetData?.[loaiTH]?.thucHanh || []);

  return nxLT && nxTH
    ? `${nxLT}; ${nxTH}`
    : nxLT || nxTH || "";
};

const mapHocKyToKey = (hocKy) => {
  switch (hocKy) {
    case "Giữa kỳ I":
      return "gki";
    case "Cuối kỳ I":
      return "cki";
    case "Giữa kỳ II":
      return "gkii";
    case "Cuối năm":
    default:
      return "cn";
  }
};

// =========================
// FETCH STUDENTS NEW STRUCTURE
// =========================
const fetchStudentsAndStatus = async () => {
  try {
    const studentsRef = collection(
      db,
      `DATA_HOCSINH_${namHocKey}`,
      selectedClass,
      "STUDENTS"
    );

    const snap = await getDocs(studentsRef);

    if (snap.empty) {
      setStudents([]);
      return;
    }

    // map học kỳ -> key firestore
    const hocKyKeyMap = {
      "Giữa kỳ I": "gki",
      "Cuối kỳ I": "cki",
      "Giữa kỳ II": "gkii",
      "Cuối năm": "cn",
    };

    const hocKyKey = hocKyKeyMap[config?.hocKy] || "cn";

    const list = snap.docs.map((docSnap) => {
      const data = docSnap.data();

      const ktdk = data?.Ktdk?.[hocKyKey] || {};
      const ontap = data?.Ontap?.[hocKyKey] || {};

      return {
        maDinhDanh: docSnap.id,

        hoVaTen: data.hoTen || "",
        lop: data.lop || selectedClass,
        khoi: data.khoi || "",
        mon: data.mon || "",

        // =========================
        // KTDK
        // =========================
        lyThuyet: ktdk.lyThuyet ?? null,
        thucHanh: ktdk.thucHanh ?? null,
        tongCong: ktdk.tongCong ?? null,
        mucDat: ktdk.mucDat ?? "",
        nhanXet: ktdk.nhanXet ?? "",

        // 👇 các cột lịch sử
        mucDat_GKI: data?.Ktdk?.gki?.mucDat ?? "",
        mucDat_CKI: data?.Ktdk?.cki?.mucDat ?? "",
        mucDat_GKII: data?.Ktdk?.gkii?.mucDat ?? "",
        mucDat_CN: data?.Ktdk?.cn?.mucDat ?? "",
      };
    });

    // =========================
    // SORT TIẾNG VIỆT (ĐÚNG TỪ PHẢI QUA TRÁI)
    // =========================
    list.sort((a, b) => {
      const getLastName = (name) =>
        (name || "").trim().split(" ").slice(-1)[0];

      return getLastName(a.hoVaTen).localeCompare(
        getLastName(b.hoVaTen),
        "vi"
      );
    });

    const finalList = list.map((s, i) => ({
      ...s,
      stt: i + 1,
    }));

    setStudents(finalList);
    setOriginalStudents(finalList);
  } catch (err) {
    console.error("❌ Lỗi load DS_HOCSINH:", err);
    setStudents([]);
  }
};

  useEffect(() => {
    fetchStudentsAndStatus();
  }, [selectedClass, config.mon, config.hocKy]);
  
  // Hàm xử lý thay đổi ô bảng
  const handleCellChange = (maDinhDanh, field, value) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.maDinhDanh !== maDinhDanh) return s;

        let updated = { ...s, [field]: value };

        // =========================
        // 🧠 VALIDATE INPUT
        // =========================
        if (field === "lyThuyet" || field === "thucHanh") {
          if (value === "" || value === "." || value === "-") {
            updated[field] = value;
          } else {
            let num;

            if (/^\d{2}$/.test(value)) {
              const first = parseInt(value[0]);
              const second = parseInt(value[1]);
              num = second === 5 ? first + 0.5 : first;
            } else {
              const raw = parseFloat(value);
              if (!isNaN(raw)) {
                const integer = Math.floor(raw);
                const decimal = raw - integer;
                num = decimal === 0.5 ? integer + 0.5 : integer;
              }
            }

            if (num != null && num >= 0 && num <= 5) {
              updated[field] = num;
            }
          }
        }

        // =========================
        // 💬 NHẬN XÉT THỦ CÔNG
        // =========================
        if (field === "nhanXet") {
          updated.nhanXet = value;
          return updated;
        }

        // =========================
        // 🧮 TÍNH TỔNG (LUÔN CHẠY LẠI)
        // =========================
        const lt =
          updated.lyThuyet !== "" && updated.lyThuyet != null
            ? parseFloat(updated.lyThuyet)
            : null;

        const th =
          updated.thucHanh !== "" && updated.thucHanh != null
            ? parseFloat(updated.thucHanh)
            : null;

        updated.tongCong =
          lt != null && th != null && !isNaN(lt) && !isNaN(th)
            ? Math.round(lt + th)
            : null;

        // =========================
        // 🔄 RESET KHI CHƯA ĐỦ ĐIỂM
        // =========================
        if (updated.tongCong == null) {
          updated.mucDat =
            s.dgtx_mucdat && s.dgtx_mucdat !== ""
              ? s.dgtx_mucdat
              : s.mucDat_goc || "";

          updated.nhanXet =
            s.dgtx_nx && s.dgtx_nx.trim() !== ""
              ? s.dgtx_nx
              : s.nhanXet_goc || "";

          return updated;
        }

        // =========================
        // 🌟 MỨC ĐẠT
        // =========================
        if (field !== "mucDat") {
          updated.mucDat =
            updated.tongCong >= 9
              ? "T"
              : updated.tongCong >= 5
              ? "H"
              : "C";
        }

        // =========================
        // 💬 NHẬN XÉT AUTO
        // =========================
        updated.nhanXet = generateNhanXet(updated);

        return updated;
      })
    );
  };

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success", // "success" | "error" | "info" | "warning"
  });

  // ✅ Lưu null nếu rỗng
  const parseOrNull = (val) => {
    if (val === "" || val === null || val === undefined) return null;
    return Number(val);
  };

  const handleSaveAll = async () => {
    if (!students?.length) return;

    try {
      const hocKyKey = mapHocKyToKey(config?.hocKy);

      const batch = writeBatch(db);

      students.forEach((s) => {
        const hsRef = doc(
          db,
          `DATA_HOCSINH_${namHocKey}`,
          selectedClass,
          "STUDENTS",
          s.maDinhDanh
        );

        batch.set(
          hsRef,
          {
            Ktdk: {
              [hocKyKey]: {
                lyThuyet: s.lyThuyet ?? null,
                thucHanh: s.thucHanh ?? null,
                tongCong: s.tongCong ?? null,
                mucDat: s.mucDat ?? "",
                nhanXet: s.nhanXet ?? "",
              },
            },
          },
          { merge: true }
        );
      });

      await batch.commit();

      // cập nhật state local
      setStudents((prev) => [...prev]);

      setSnackbar({
        open: true,
        message: "✅ Lưu thành công!",
        severity: "success",
      });
    } catch (err) {
      console.error("❌ Lỗi lưu KTDK:", err);

      setSnackbar({
        open: true,
        message: "❌ Lỗi khi lưu dữ liệu!",
        severity: "error",
      });
    }
  };

  // Hàm lưu 1 học sinh
  const handleSaveOne = async (student) => {
  if (!student) return;

  const selectedSemester = config.hocKy || "Giữa kỳ I";
  const selectedMon = config.mon || "Tin học";

  // ✅ Mapping đầy đủ giống handleSaveAll
  let termDoc;
  switch (selectedSemester) {
    case "Giữa kỳ I":
      termDoc = "GKI";
      break;
    case "Cuối kỳ I":
      termDoc = "CKI";
      break;
    case "Giữa kỳ II":
      termDoc = "GKII";
      break;
    default:
      termDoc = "CN";
      break;
  }

  const classKey = (selectedClass || "").replace(".", "_");
  const batch = writeBatch(db);
  const hsRef = doc(db, `DATA_${namHocKey}`, classKey, "HOCSINH", student.maDinhDanh);

  // ✅ Helper xử lý rỗng → null
  const toNumberOrNull = (val) =>
    val === "" || val === null || val === undefined
      ? null
      : Number(val);

  // ✅ Data chuẩn hóa giống handleSaveAll
  const ktdkData = {
    [termDoc]: {
      dgtx_gv: student.dgtx_mucdat ?? "",
      dgtx_mucdat: student.dgtx_mucdat ?? "",
      dgtx_nx: "",

      lyThuyet: toNumberOrNull(student.lyThuyet),

      thucHanh: isCongNghe
        ? (student.thucHanh ?? "")
        : toNumberOrNull(student.thucHanh),

      tongCong: toNumberOrNull(student.tongCong),

      mucDat: student.mucDat ?? "",
      nhanXet: student.nhanXet ?? "",
    },
  };

  batch.set(
    hsRef,
    {
      hoVaTen: student.hoVaTen || "",
      stt: student.stt ?? null,
      [isCongNghe ? "CongNghe" : "TinHoc"]: {
        ktdk: ktdkData,
      },
    },
    { merge: true }
  );

  try {
    await batch.commit();

    setSnackbar({
      open: true,
      message: "✅ Cập nhật thành công!",
      severity: "success",
    });
  } catch (err) {
    console.error("❌ Lỗi lưu dữ liệu học sinh:", err);
    setSnackbar({
      open: true,
      message: "❌ Lỗi khi lưu dữ liệu học sinh!",
      severity: "error",
    });
  }
};

  const handleDownload = async () => {
    try {
      await exportKTDK(students, selectedClass, config.hocKy || "Giữa kỳ I", config.mon, config.namHoc);
    } catch (error) {
      console.error("❌ Lỗi khi xuất Excel:", error);
    }
  };

  const columns = ["lyThuyet", "thucHanh", "mucDat", "nhanXet"];
  const handleKeyNavigation = (e, rowIndex, col) => {
    const navigKeys = ["Enter", "ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Tab"];
    if (!navigKeys.includes(e.key)) return; // cho phép nhập bình thường

    e.preventDefault();

    let nextRow = rowIndex;
    let nextCol = columns.indexOf(col);

    if (e.key === "Enter" || e.key === "ArrowDown") {
      nextRow = Math.min(students.length - 1, rowIndex + 1);
    } else if (e.key === "ArrowUp") {
      nextRow = Math.max(0, rowIndex - 1);
    } else if (e.key === "ArrowRight" || e.key === "Tab") {
      if (col === "lyThuyet") {
        nextCol = columns.indexOf("thucHanh");
      } else if (col === "thucHanh") {
        nextCol = columns.indexOf("lyThuyet");
        nextRow = Math.min(students.length - 1, rowIndex + 1);
      } else {
        // các cột khác: đi theo cột bình thường
        nextCol = Math.min(columns.length - 1, nextCol + 1);
      }
    } else if (e.key === "ArrowLeft") {
      if (col === "thucHanh") nextCol = columns.indexOf("lyThuyet");
      else nextCol = Math.max(0, nextCol - 1);
    }

    const nextInput = document.getElementById(`${columns[nextCol]}-${nextRow}`);
    nextInput?.focus();
  };

  const handlePrint = async () => {
    if (!selectedClass) {
      alert("Vui lòng chọn lớp trước khi in!");
      return;
    }
    try {
      await printKTDK(
        students,
        selectedClass,
        config.hocKy || "Giữa kỳ I",
        config.mon,
        config.namHoc // 👈 thêm dòng này
      );
    } catch (err) {
      console.error("❌ Lỗi khi in:", err);
      alert("Lỗi khi in danh sách. Vui lòng thử lại!");
    }
  };

  const handleOpenLTDialog = (student) => {
    setEditingStudent(student);
    setLtValue(student.lyThuyet ?? "");
    setOpenLTDialog(true);
  };

  const handleCloseLTDialog = () => {
    setOpenLTDialog(false);
  };

  const handleUpdateLyThuyet = () => {
    const num = parseFloat(ltValue);
    if (isNaN(num) || num < 0 || num > 5) return;

    setStudents(prev =>
      prev.map(s =>
        s.maDinhDanh === editingStudent.maDinhDanh
          ? { ...s, lyThuyet: num }
          : s
      )
    );

    handleCloseLTDialog();
  };

  const getExtraColumns = () => {
    switch (config.hocKy) {
      case "Cuối kỳ I":
        return ["GKI"];
      case "Giữa kỳ II":
        return ["GKI", "CKI"];
      case "Cuối năm":
        return ["GKI", "CKI", "GKII"];
      default:
        return [];
    }
  };

  const extraColumns = getExtraColumns();

  const readOnlyCellSx = {
    px: 1,
    backgroundColor: "#f5f5f5",
    color: "text.secondary",
    //fontStyle: "italic",
    border: "1px dashed #e0e0e0",
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#e3f2fd", pt: 3 }}>
      <Card
        elevation={6}
        sx={{
          p: 4,
          borderRadius: 3,
          maxWidth: 1420,
          mx: "auto",
          position: "relative"
        }}
      >
        <IconButton
          onClick={() => navigate("/dashboard")}
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            color: "#64748b",
            backgroundColor: "#f1f5f9",
            "&:hover": {
              backgroundColor: "#e2e8f0",
              color: "#ef4444",
            },
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <CloseIcon />
        </IconButton>
        {/* 🟩 Nút Lưu, Tải Excel, In */}
        <Box sx={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 1 }}>
          <Tooltip title="Lưu dữ liệu" arrow>
            <IconButton
              onClick={handleSaveAll}
              sx={{
                color: "primary.main",
                bgcolor: "white",
                boxShadow: 2,
                "&:hover": { bgcolor: "primary.light", color: "white" }
              }}
            >
              <SaveIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Tải xuống Excel" arrow>
            <IconButton
              onClick={handleDownload}
              sx={{
                color: "primary.main",
                bgcolor: "white",
                boxShadow: 2,
                "&:hover": { bgcolor: "primary.light", color: "white" }
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="In danh sách KTĐK" arrow>
            <IconButton
              onClick={handlePrint}
              sx={{
                color: "primary.main",
                bgcolor: "white",
                boxShadow: 2,
                "&:hover": { bgcolor: "primary.light", color: "white" },
              }}
            >
              <PrintIcon fontSize="small" />
            </IconButton>

          </Tooltip>

          <Tooltip title="Làm mới nhận xét" arrow>
            <IconButton
              onClick={() => {
                setStudents((prev) =>
                  prev.map((s) => ({
                    ...s,
                    nhanXet: generateNhanXet(s),
                  }))
                );
              }}
              sx={{
                color: "primary.main",
                bgcolor: "white",
                boxShadow: 2,
                "&:hover": { bgcolor: "primary.light", color: "white" },
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* ✅ NÚT NHẬN XÉT → ĐẶT SAU REFRESH */}
          <Tooltip title="Quản lý nhận xét" arrow>
            <IconButton
              onClick={() => setOpenNhanXet(true)}
              sx={{
                color: "#1976d2",
                bgcolor: "white",
                boxShadow: 2,
                "&:hover": {
                  bgcolor: "#e3f2fd",
                },
              }}
            >
              <RateReviewIcon fontSize="small" />
            </IconButton>
          </Tooltip>

        </Box>

        {/* 🟨 Tiêu đề & Học kỳ hiện tại */}
        <Box sx={{ textAlign: "center", mt: 3, mb: 3 }}>
          <Typography
            variant="h5"
            fontWeight="bold"
            color="primary"
            sx={{ mb: 1 }}
          >
            {`NHẬP ĐIỂM ${config.hocKy?.toUpperCase() || "KTĐK"}`}
          </Typography>
        </Box>

        {/* 🟩 Hàng chọn Lớp – Môn – Học kỳ (3 ô cùng hàng khi mobile) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
            flexWrap: isMobile ? "nowrap" : "wrap",
            overflowX: isMobile ? "auto" : "visible",
            px: isMobile ? 1 : 0,
            mb: 3,
          }}
        >
          {/* Lớp */}
          <FormControl size="small" sx={{ minWidth: 80, flexShrink: 0, mt: 1 }}>
            <InputLabel id="lop-label">Lớp</InputLabel>
            <Select
              labelId="lop-label"
              value={selectedClass}
              label="Lớp"
              //onChange={async (e) => {
              //  const newClass = e.target.value;
              //  setSelectedClass(newClass);
              //  setConfig(prev => ({ ...prev, lop: newClass }));
              //  setStudents([]);
              //  await fetchStudentsAndStatus(newClass);
              //</FormControl>}}
              onChange={async (e) => {
                const newClass = e.target.value;

                setSelectedClass(newClass);
                setConfig(prev => ({ ...prev, lop: newClass }));

                const yearKey = config.namHoc.replaceAll("-", "_");
                localStorage.setItem(`selectedClass_${yearKey}`, newClass);

                setStudents([]);
                await fetchStudentsAndStatus(newClass);
              }}
            >
              {classes.map((cls) => (
                <MenuItem key={cls} value={cls}>
                  {cls}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* 🧾 Bảng học sinh (giữ nguyên định dạng gốc) */}
        <TableContainer
          component={Paper}
          sx={{
            maxHeight: "none",
            overflowY: "visible",
            overflowX: "auto",
          }}
        >

          <Table
            stickyHeader
            size="small"
            sx={{
              tableLayout: "fixed",
              minWidth: 800,
              borderCollapse: "collapse",
              "& td, & th": {
                borderRight: "1px solid #e0e0e0",
                borderBottom: "1px solid #e0e0e0",
              },
              "& th:last-child, & td:last-child": {
                borderRight: "none",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ backgroundColor: "#1976d2", color: "white", width: 50, px: 1, whiteSpace: "nowrap" }}>STT</TableCell>
                <TableCell align="center" sx={{ backgroundColor: "#1976d2", color: "white", width: 220, px: 1, whiteSpace: "nowrap" }}>Họ và tên</TableCell>                                
                <TableCell
                  align="center"
                  sx={{
                    backgroundColor: "#1976d2",
                    color: "white",
                    width: 80,
                    px: 0.5,
                    whiteSpace: "nowrap"
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.3}>
                    <Typography variant="body2" sx={{ color: "white" }}>
                      Lí thuyết
                    </Typography>

                    {/* 🔥 FILL ALL LT */}
                    <FormControl variant="standard" sx={{ minWidth: 16 }}>
                      <Select
                        value={fillLyThuyet}
                        displayEmpty
                        disableUnderline
                        onChange={(e) => {
                          const val = e.target.value;
                          setFillLyThuyet(val);

                          setStudents((prev) =>
                            prev.map((s) => {
                              let updated = { ...s };

                              // reset
                              if (val === "-") {
                                return {
                                  ...s,
                                  lyThuyet: "",
                                  tongCong: null,
                                  mucDat: s.mucDat_goc || s.dgtx_mucdat || "",
                                  nhanXet: s.nhanXet_goc || "",
                                };
                              }

                              updated.lyThuyet = val;

                              const lt = parseFloat(val);
                              const th = parseFloat(s.thucHanh);

                              if (!isNaN(lt) && !isNaN(th)) {
                                updated.tongCong = Math.round(lt + th);

                                updated.mucDat =
                                  updated.tongCong >= 9 ? "T" :
                                  updated.tongCong >= 5 ? "H" : "C";

                                updated.nhanXet = generateNhanXet(updated);
                              }

                              return updated;
                            })
                          );

                          setFillLyThuyet(""); // reset dropdown
                        }}
                        renderValue={() => "▾"}
                        sx={{
                          color: "white",
                          fontSize: 18,
                          "& .MuiSelect-icon": { display: "none" }
                        }}
                      >
                        {["-", 0, 1, 2, 3, 4, 5].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    backgroundColor: "#1976d2",
                    color: "white",
                    width: 80,
                    px: 0.5,
                    whiteSpace: "nowrap"
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.3}>
                    <Typography variant="body2" sx={{ color: "white" }}>
                      Thực hành
                    </Typography>

                    {/* 🔥 NÚT FILL ALL */}
                    <FormControl variant="standard" sx={{ minWidth: 16 }}>
                      <Select
                        value={fillThucHanh}
                        displayEmpty
                        disableUnderline
                        onChange={(e) => {
                          const val = e.target.value;

                          setFillThucHanh(val);

                          setStudents((prev) =>
                            prev.map((s) => {
                              // 🔥 RESET HOÀN TOÀN KHI CHỌN "-"
                              if (val === "-") {
                                return {
                                  ...s,
                                  thucHanh: "",
                                  tongCong: null,
                                  mucDat: s.mucDat_goc || s.dgtx_mucdat || "",
                                  nhanXet: s.nhanXet_goc || "",
                                };
                              }

                              let updated = {
                                ...s,
                                thucHanh: val,
                              };

                              const lt = parseFloat(updated.lyThuyet);
                              const th = parseFloat(val);

                              if (!isNaN(lt) && !isNaN(th)) {
                                updated.tongCong = Math.round(lt + th);

                                updated.mucDat =
                                  updated.tongCong >= 9
                                    ? "T"
                                    : updated.tongCong >= 5
                                    ? "H"
                                    : "C";

                                updated.nhanXet = generateNhanXet(updated);
                              }

                              return updated;
                            })
                          );

                          setFillThucHanh("");
                        }}
                        renderValue={() => "▾"}
                        sx={{
                          color: "white",
                          fontSize: 18,
                          "& .MuiSelect-icon": { display: "none" }
                        }}
                      >
                        {/* 👉 Tuỳ môn */}
                        {["-", 0, 1, 2, 3, 4, 5].map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ backgroundColor: "#1976d2", color: "white", width: 70, px: 1, whiteSpace: "nowrap" }}>
                  Tổng cộng
                </TableCell>

                {/* 🔹 Cột động theo học kỳ */}
                {config.hocKy === "Cuối kỳ I" && (
                  <TableCell align="center" sx={{ backgroundColor: "#1976d2", color: "white", width: 40 }}>
                    GKI
                  </TableCell>
                )}

                {config.hocKy === "Giữa kỳ II" && (
                  <>
                    <TableCell align="center" sx={{ backgroundColor: "#1976d2", color: "white", width: 40 }}>
                      GKI
                    </TableCell>
                    <TableCell align="center" sx={{ backgroundColor: "#1976d2", color: "white", width: 40 }}>
                      CKI
                    </TableCell>
                  </>
                )}

                {config.hocKy === "Cuối năm" && (
                  <>
                    <TableCell align="center" sx={{ backgroundColor: "#1976d2", color: "white", width: 40 }}>
                      GKI
                    </TableCell>
                    <TableCell align="center" sx={{ backgroundColor: "#1976d2", color: "white", width: 40 }}>
                      CKI
                    </TableCell>
                    <TableCell align="center" sx={{ backgroundColor: "#1976d2", color: "white", width: 40 }}>
                      GKII
                    </TableCell>
                  </>
                )}

                <TableCell
                  align="center"
                  sx={{
                    backgroundColor: "#1976d2",
                    color: "white",
                    width: 70,
                    px: 1,
                    whiteSpace: "nowrap"
                  }}
                >
                  {config.hocKy === "Giữa kỳ I"
                    ? "GKI"
                    : config.hocKy === "Cuối kỳ I"
                    ? "CKI"
                    : config.hocKy === "Giữa kỳ II"
                    ? "GKII"
                    : "CN"}
                </TableCell>
                <TableCell align="center" sx={{ backgroundColor: "#1976d2", color: "white", width: 500, px: 1, whiteSpace: "nowrap" }}>Nhận xét</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {students.map((student, idx) => (
                <TableRow key={student.maDinhDanh} hover>
                  <TableCell align="center" sx={{ px: 1 }}>{student.stt}</TableCell>
                  <TableCell align="left" sx={{ px: 1 }}>{(student.hoVaTen || "").toUpperCase()}</TableCell>

                  {/* 🟩 Cột Giáo viên – nhập theo cột, dùng teacher.dgtx */}    
                  {/* 🟨 Cột Lí thuyết */}
                  <TableCell align="center" sx={{ px: 1 }}>
                    <Box
                      sx={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: 1,
                        transition: "all 0.2s ease",

                        "&:hover": {
                          backgroundColor: "#ffffff",
                          boxShadow: "inset 0 0 0 1px #1976d2",
                        },

                        "&:focus-within": {
                          backgroundColor: "#ffffff",
                          boxShadow: "inset 0 0 0 2px #1976d2",
                        },
                      }}
                    >
                      <TextField
                        variant="standard"
                        value={student.lyThuyet ?? ""}
                        onChange={(e) =>
                          handleCellChange(
                            student.maDinhDanh,
                            "lyThuyet",
                            e.target.value
                          )
                        }
                        fullWidth
                        inputProps={{
                          style: {
                            textAlign: "center",
                            padding: "4px 8px",
                          },
                        }}
                        id={`lyThuyet-${idx}`}
                        onKeyDown={(e) =>
                          handleKeyNavigation(e, idx, "lyThuyet")
                        }
                        InputProps={{
                          disableUnderline: true,
                        }}
                      />
                    </Box>
                  </TableCell>
                  {/* 🟨 Cột Thực hành */}
                  <TableCell align="center" sx={{ px: 1 }}>
                    <Box
                      sx={{
                        borderRadius: 1,
                        transition: "all 0.2s ease",

                        "&:hover": {
                          backgroundColor: "#ffffff",
                          boxShadow: "inset 0 0 0 1px #1976d2",
                        },

                        "&:focus-within": {
                          backgroundColor: "#ffffff",
                          boxShadow: "inset 0 0 0 2px #1976d2",
                        },
                      }}
                    >
                      <TextField
                        variant="standard"
                        value={student.thucHanh ?? ""}
                        onChange={(e) =>
                          handleCellChange(
                            student.maDinhDanh,
                            "thucHanh",
                            e.target.value
                          )
                        }
                        fullWidth
                        inputProps={{
                          style: {
                            textAlign: "center",
                            padding: "4px 6px",
                          },
                        }}
                        id={`thucHanh-${idx}`}
                        onKeyDown={(e) =>
                          handleKeyNavigation(e, idx, "thucHanh")
                        }
                        InputProps={{ disableUnderline: true }}
                      />
                    </Box>
                  </TableCell>

                  {/* 🟨 Cột Tổng cộng */}
                  <TableCell align="center" sx={{ px: 1, fontWeight: "bold" }}>
                    {student.tongCong || ""}
                  </TableCell>
                  
                  {/* 🔹 Cột GKI */}
                  {/*{config.hocKy === "Cuối kỳ I" && (
                    <TableCell align="center" sx={{ px: 1 }}>
                      {student.mucDat_GKI || "-"}
                    </TableCell>
                  )}

                  {config.hocKy === "Giữa kỳ II" && (
                    <>
                      <TableCell align="center" sx={{ px: 1 }}>
                        {student.mucDat_GKI || "-"}
                      </TableCell>
                      <TableCell align="center" sx={{ px: 1 }}>
                        {student.mucDat_CKI || "-"}
                      </TableCell>
                    </>
                  )}

                  {config.hocKy === "Cuối năm" && (
                    <>
                      <TableCell align="center" sx={{ px: 1 }}>
                        {student.mucDat_GKI || "-"}
                      </TableCell>
                      <TableCell align="center" sx={{ px: 1 }}>
                        {student.mucDat_CKI || "-"}
                      </TableCell>
                      <TableCell align="center" sx={{ px: 1 }}>
                        {student.mucDat_GKII || "-"}
                      </TableCell>
                    </>
                  )}*/}

                  {config.hocKy === "Cuối kỳ I" && (
                    <TableCell align="center" sx={readOnlyCellSx}>
                      {student.mucDat_GKI || "-"}
                    </TableCell>
                  )}

                  {config.hocKy === "Giữa kỳ II" && (
                    <>
                      <TableCell align="center" sx={readOnlyCellSx}>
                        {student.mucDat_GKI || "-"}
                      </TableCell>
                      <TableCell align="center" sx={readOnlyCellSx}>
                        {student.mucDat_CKI || "-"}
                      </TableCell>
                    </>
                  )}

                  {config.hocKy === "Cuối năm" && (
                    <>
                      <TableCell align="center" sx={readOnlyCellSx}>
                        {student.mucDat_GKI || "-"}
                      </TableCell>
                      <TableCell align="center" sx={readOnlyCellSx}>
                        {student.mucDat_CKI || "-"}
                      </TableCell>
                      <TableCell align="center" sx={readOnlyCellSx}>
                        {student.mucDat_GKII || "-"}
                      </TableCell>
                    </>
                  )}

                  {/* 🟨 Cột Mức đạt */}
                  <TableCell align="center" sx={{ px: 1 }}>
                    <Box
                      sx={{
                        borderRadius: 1,
                        transition: "all 0.2s ease",

                        // 🔥 hover
                        "&:hover": {
                          //backgroundColor: "#f1f8ff",
                          backgroundColor: "#ffffff", // ✅ luôn trắng
                          boxShadow: "inset 0 0 0 1px #1976d2",
                        },

                        // 🔥 focus
                        "&:focus-within": {
                          //backgroundColor: "#e3f2fd",
                          backgroundColor: "#ffffff", // ✅ luôn trắng
                          boxShadow: "inset 0 0 0 2px #1976d2",
                        },

                        // icon dropdown
                        "& .MuiSelect-icon": {
                          opacity: 0,
                          transition: "opacity 0.2s ease",
                        },
                        "&:hover .MuiSelect-icon": {
                          opacity: 1,
                        },
                      }}
                    >
                      <FormControl variant="standard" fullWidth>
                        <Select
                          value={student.mucDat || ""}
                          onChange={(e) =>
                            handleCellChange(
                              student.maDinhDanh,
                              "mucDat",
                              e.target.value
                            )
                          }
                          disableUnderline
                          id={`mucDat-${idx}`}
                          sx={{
                            textAlign: "center",
                            px: 1,

                            "& .MuiSelect-select": {
                              py: "4px",
                              fontSize: "14px",
                              textAlign: "center",
                            },
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const next = document.getElementById(
                                `mucDat-${idx + 1}`
                              );
                              if (next) next.focus();
                            }
                          }}
                        >
                          <MenuItem value="">
                            <em>-</em>
                          </MenuItem>
                          <MenuItem value="T">T</MenuItem>
                          <MenuItem value="H">H</MenuItem>
                          <MenuItem value="C">C</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </TableCell>

                  {/* 🟨 Cột Nhận xét */}
                  <TableCell align="left" sx={{ px: 1 }}>
                    <TextField
                      variant="standard"
                      multiline
                      maxRows={4}
                      fullWidth
                      value={student.nhanXet}
                      onChange={(e) =>
                        handleCellChange(student.maDinhDanh, "nhanXet", e.target.value)
                      }
                      id={`nhanXet-${idx}`}
                      onKeyDown={(e) => handleKeyNavigation(e, idx, "nhanXet")}
                      InputProps={{
                        sx: {
                          paddingLeft: 1,
                          paddingRight: 1,
                          fontSize: "14px",
                          lineHeight: 1.3,
                        },
                        disableUnderline: true,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>
        </TableContainer>
      </Card>

      {/* Snackbar thông báo */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            boxShadow: 3,
            borderRadius: 2,
            fontSize: "0.9rem",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <QuanLyNhanXet
        open={openNhanXet}
        onClose={() => setOpenNhanXet(false)}
      />
    </Box>
  );
}
