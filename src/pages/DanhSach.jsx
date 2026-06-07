import React, { useState, useEffect, useContext } from "react";

/* =======================
   MUI Components
======================= */
import {
  Box,
  Typography,
  MenuItem,
  Select,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  LinearProgress,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

/* =======================
   MUI Icons
======================= */
import FileUploadIcon from "@mui/icons-material/FileUpload";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import StorageIcon from "@mui/icons-material/Storage";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import CloseIcon from "@mui/icons-material/Close";

/* =======================
   Firebase Firestore
======================= */
import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  onSnapshot,
  updateDoc,
  deleteField,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase";

/* =======================
   Contexts
======================= */
import { StudentContext } from "../context/StudentContext";
import { ConfigContext } from "../context/ConfigContext";

/* =======================
   Utils
======================= */
import { uploadStudents } from "../utils/uploadExcel";
import updateDATAForStudent from "../utils/updateDATAForStudent";
import { filterClassesByRole } from "../utils/filterClassesByRole";

/* =======================
   Components (Dialogs)
======================= */
import EditStudentDialog from "../dialog/EditStudentDialog";
import CreateDataConfirmDialog from "../dialog/CreateDataConfirmDialog";
import DeleteClassesDialog from "../dialog/DeleteClassesDialog";

export default function DanhSach() {
  const navigate = useNavigate();
  const account = localStorage.getItem("account") || "";
  /* =======================
   Context
  ======================= */
  const { studentData, setStudentData, classData, setClassData } = useContext(StudentContext);
  const { config, setConfig } = useContext(ConfigContext);

  const namHocKey = (config?.namHoc || "2025-2026").replace(/-/g, "_");

  /* =======================
    Main Data State
  ======================= */
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedNamHoc, setSelectedNamHoc] = useState(config?.namHoc || "");
  
  const [deleteNamHoc, setDeleteNamHoc] = useState(
    config?.namHoc || "2025-2026"
  );

  /* =======================
    Refs
  ======================= */
  const fileInputRef = React.useRef(null);
  const folderInputRef = React.useRef(null);

  /* =======================
    Upload / Progress State
  ======================= */
  const [ppctReloadKey, setPpctReloadKey] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  /* =======================
    UI Interaction State
  ======================= */
  const [hoveredHS, setHoveredHS] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newMaDinhDanh, setNewMaDinhDanh] = useState("");

  /* =======================
    Dialog / Modal State
  ======================= */
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [confirmDeleteStudent, setConfirmDeleteStudent] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDataDialogOpen, setCreateDataDialogOpen] = useState(false);
  const [deleteClassesOpen, setDeleteClassesOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedClassesToDelete, setSelectedClassesToDelete] = useState([]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  // 🔹 Lấy config realtime (nguồn sự thật duy nhất)
  useEffect(() => {
    const docRef = doc(db, "CONFIG", "config");

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) return;

      const data = docSnap.data();

      const namHoc = data.namHoc || "2025-2026";
      const lop = data.lop || "";

      // ✅ MERGE config – KHÔNG overwrite
      setConfig((prev) => ({
        ...prev,
        namHoc,
        lop,
      }));

      // ✅ sync local state cho UI
      setSelectedNamHoc(namHoc);
      setSelectedClass(lop);
    });

    return () => unsubscribe();
  }, [setConfig]);


  // 🔹 Lấy danh sách lớp
  const fetchClasses = async () => {
  try {
    console.log("📥 [fetchClasses] namHocKey =", namHocKey);
    console.log("👤 account =", account);

    const ref = doc(db, "DANHSACH_LOP", namHocKey);
    const snap = await getDoc(ref);

    console.log("📦 snapshot exists =", snap.exists());

    const raw = snap.exists() ? snap.data()?.list || [] : [];

    console.log("📚 RAW classes =", raw);

    // ✅ lọc rác (QUAN TRỌNG)
    const classListRaw = raw.filter(
      (x) => typeof x === "string" && x.trim() && !x.includes("NHAP")
    );

    console.log("🧹 classListRaw (after filter rác) =", classListRaw);

    // =========================
    // 🔐 PHÂN QUYỀN (debug thêm)
    // =========================
    const filteredByRole = await filterClassesByRole({
      db,
      account,
      allClasses: classListRaw,
    });

    console.log("🔐 filteredByRole =", filteredByRole);

    // ===== SORT LỚP =====
    const classList = [...filteredByRole].sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || 0, 10);
      const numB = parseInt(b.match(/\d+/)?.[0] || 0, 10);

      if (numA !== numB) return numA - numB;

      const letterA = a.replace(/\d+/g, "");
      const letterB = b.replace(/\d+/g, "");

      return letterA.localeCompare(letterB, "vi", {
        sensitivity: "base",
      });
    });

    console.log("✅ FINAL classList =", classList);

    setClasses(classList);
    setClassData(classList);

    if (classList.length > 0) {
      setSelectedClass((prev) =>
        prev && classList.includes(prev)
          ? prev
          : config?.lop && classList.includes(config.lop)
            ? config.lop
            : classList[0]
      );
    } else {
      console.warn("⚠️ classList EMPTY → không có lớp nào hiển thị");
      setSelectedClass("");
    }
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách lớp:", err);
    setClasses([]);
    setClassData([]);
    setSelectedClass("");
  }
};
  
  useEffect(() => {
    fetchClasses();
  }, [namHocKey, config?.lop]);

  //Sort danh sách học sinh
  const compareFullNamesRightToLeft = (a, b) => {
    const partsA = a.hoTen.replace(/\//g, " ").trim().split(/\s+/);
    const partsB = b.hoTen.replace(/\//g, " ").trim().split(/\s+/);

    const len = Math.max(partsA.length, partsB.length);

    for (let i = 1; i <= len; i++) {
      const wordA = partsA[partsA.length - i] || "";
      const wordB = partsB[partsB.length - i] || "";

      const cmp = wordA.localeCompare(wordB, "vi", {
        sensitivity: "base",
      });

      if (cmp !== 0) return cmp;
    }

    return 0;
  };

  useEffect(() => {
    if (!selectedClass || !namHocKey) return;

    const cached = studentData?.[namHocKey]?.[selectedClass];

    if (cached?.length) {
      const sorted = [...cached]
        .sort(compareFullNamesRightToLeft)
        .map((s, i) => ({ ...s, stt: i + 1 }));

      setStudents(sorted);
      return;
    }

    fetchStudents();
  }, [selectedClass, namHocKey]);

  // 🔹 Lấy danh sách học sinh
  const fetchStudents = async () => {
    try {
      const studentsRef = collection(
        db,
        `DS_HOCSINH_${namHocKey}`,
        selectedClass,
        "STUDENTS"
      );

      const snap = await getDocs(studentsRef);

      if (snap.empty) {
        setStudents([]);

        setStudentData((prev) => ({
          ...prev,
          [namHocKey]: {
            ...(prev?.[namHocKey] || {}),
            [selectedClass]: [],
          },
        }));

        return;
      }

      let studentList = snap.docs.map((d) => ({
        maDinhDanh: d.id,
        ...d.data(),
      }));

      studentList = studentList
        .sort(compareFullNamesRightToLeft)
        .map((s, i) => ({ ...s, stt: i + 1 }));

      setStudentData((prev) => ({
        ...prev,
        [namHocKey]: {
          ...(prev?.[namHocKey] || {}),
          [selectedClass]: studentList,
        },
      }));

      setStudents(studentList);
    } catch (err) {
      console.error("❌ Lỗi load students:", err);
      setStudents([]);
    }
  };
 
  const handleClassChange = async (e) => {
    const newClass = e.target.value;

    try {
      await setDoc(
        doc(db, "CONFIG", "config"),
        { lop: newClass },
        { merge: true }
      );
    } catch (err) {
      console.error("❌ Lỗi cập nhật lớp:", err);
    }
  };

  const reloadClasses = async () => {
    const snap = await getDocs(collection(db, `DS_HOCSINH_${namHocKey}`));

    const classList = snap.docs.map((d) => d.id);

    setClasses(classList);
    setClassData(classList);

    // auto chọn lớp vừa upload nếu chưa có
    if (selectedClass && classList.includes(selectedClass)) return;

    if (classList.length > 0) {
      setSelectedClass(classList[0]);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        await uploadStudents({
          file,
          db,
          namHocKey,
          onProgress: (p) => {
            const global = Math.round(((i + p / 100) / files.length) * 100);
            setUploadProgress(global);
          },
        });
      }

      await fetchClasses();
      //await reloadClasses();
      setUploadProgress(100);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);

      // ⚠️ FIX QUAN TRỌNG
      e.target.value = null;
    }
  };

  const handleNamHocChange = async (e) => {
    const newNamHoc = e.target.value;
    try {
      await setDoc(
        doc(db, "CONFIG", "config"),
        { namHoc: newNamHoc },
        { merge: true }
      );
    } catch (err) {
      console.error("❌ Lỗi cập nhật năm học:", err);
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setNewName(student.hoTen);
  };

  const handleOpenAddStudent = () => {
    setIsAdding(true);
    setEditingStudent(null);
    setNewMaDinhDanh("");
    setNewName("");
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setConfirmDialogOpen(true);
  };

  // ===== Thêm học sinh =====
  const handleAddStudent = async () => {
    if (!newMaDinhDanh.trim() || !newName.trim()) return;

    const ma = newMaDinhDanh.trim();
    const ten = newName.trim().toUpperCase();
    const sttMoi = students.length + 1; // STT mới
    const lop = selectedClass; // ví dụ "4.1"

    // 🔹 Đóng dialog ngay
    setIsAdding(false);
    setEditingStudent(null);

    try {
      // 1️⃣ Ghi Firestore DANHSACH với lop + stt
      await setDoc(
        doc(
          db,
          `DS_HOCSINH_${namHocKey}`,
          selectedClass,
          "STUDENTS",
          ma
        ),
        {
          hoTen: ten,
          lop,
          stt: sttMoi,
        },
        { merge: true }
      );

      // 2️⃣ Cập nhật UI ngay
      const updatedStudents = [
        ...students,
        { maDinhDanh: ma, hoTen: ten, stt: sttMoi, lop },
      ];

      setStudents(updatedStudents);

      // 3️⃣ Cập nhật cache StudentContext
      setStudentData((prev) => ({
        ...prev,
        [namHocKey]: {
          ...(prev?.[namHocKey] || {}),
          [selectedClass]: updatedStudents,
        },
      }));

      // 4️⃣ Reset input
      setNewMaDinhDanh("");
      setNewName("");

      // 5️⃣ Cập nhật DATA chạy nền
      await updateDATAForStudent(selectedClass, {
        maDinhDanh: ma,
        hoTen: ten,
        stt: sttMoi,
        lop,
      }, updatedStudents);
    } catch (err) {
      console.error("❌ Lỗi khi thêm học sinh:", err);
    }
  };

  // ===== Chỉnh sửa học sinh =====
  const handleSaveStudent = async () => {
    if (!editingStudent || !newName.trim()) return;

    const ma = editingStudent.maDinhDanh;
    const ten = newName.trim().toUpperCase();

    // 🔹 Đóng dialog ngay
    setIsAdding(false);
    setEditingStudent(null);

    try {
      // 1️⃣ Ghi Firestore DANHSACH
      await updateDoc(
        doc(
          db,
          `DS_HOCSINH_${namHocKey}`,
          selectedClass,
          "STUDENTS",
          ma
        ),
        {
          hoTen: ten,
        }
      );

      // 2️⃣ Cập nhật UI ngay
      const updatedStudents = students.map((s) =>
        s.maDinhDanh === ma ? { ...s, hoTen: ten } : s
      );
      setStudents(updatedStudents);

      // 3️⃣ Cập nhật cache StudentContext
      setStudentData((prev) => ({
        ...prev,
        [namHocKey]: {
          ...(prev?.[namHocKey] || {}),
          [selectedClass]: updatedStudents,
        },
      }));

      // 4️⃣ 🔹 Cập nhật DATA chạy nền
      await updateDATAForStudent(selectedClass, { maDinhDanh: ma, hoTen: ten }, updatedStudents);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật học sinh:", err);
    }
  };

  // ===== Xóa học sinh =====
  const handleDeleteStudent = async (student) => {
    if (!student) return;

    const ma = student.maDinhDanh;

    // 🔹 Đóng dialog ngay nếu đang mở
    setIsAdding(false);
    setEditingStudent(null);

    try {
      // 1️⃣ Xóa trên Firestore DANHSACH
      await deleteDoc(
        doc(
          db,
          `DS_HOCSINH_${namHocKey}`,
          selectedClass,
          "STUDENTS",
          ma
        )
      );

      // 3️⃣ Cập nhật UI ngay
      const updatedStudents = students
        .filter((s) => s.maDinhDanh !== ma)
        .map((s, i) => ({ ...s, stt: i + 1 }));

      setStudents(updatedStudents);

      // 4️⃣ Cập nhật cache StudentContext
      setStudentData((prev) => ({
        ...prev,
        [namHocKey]: {
          ...(prev?.[namHocKey] || {}),
          [selectedClass]: updatedStudents,
        },
      }));

      // 5️⃣ Reset trạng thái hover nếu cần
      setHoveredHS(null);
    } catch (err) {
      console.error("❌ Lỗi khi xóa học sinh:", err);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFolderUploadClick = () => {
    folderInputRef.current?.click();
  };

  const handleDeleteClasses = async (selectedClasses) => {
    try {
      for (const lop of selectedClasses) {

        // =========================
        // XÓA DS_HOCSINH
        // =========================
        const studentsRef = collection(
          db,
          `DS_HOCSINH_${namHocKey}`,
          lop,
          "STUDENTS"
        );

        const studentsSnap = await getDocs(studentsRef);

        let batch = writeBatch(db);

        studentsSnap.forEach((studentDoc) => {
          batch.delete(studentDoc.ref);
        });

        batch.delete(
          doc(
            db,
            `DS_HOCSINH_${namHocKey}`,
            lop
          )
        );

        await batch.commit();

        // =========================
        // XÓA DATA
        // =========================
        const lopKey = lop.replace(/\./g, "_");

        const dataStudentsRef = collection(
          db,
          `DATA_${namHocKey}`,
          lopKey,
          "HOCSINH"
        );

        const dataStudentsSnap = await getDocs(dataStudentsRef);

        batch = writeBatch(db);

        dataStudentsSnap.forEach((studentDoc) => {
          batch.delete(studentDoc.ref);
        });

        batch.delete(
          doc(
            db,
            `DATA_${namHocKey}`,
            lopKey
          )
        );

        await batch.commit();
      }

      // =========================
      // CẬP NHẬT DANH SÁCH LỚP
      // =========================
      const newClasses = classes.filter(
        (c) => !selectedClasses.includes(c)
      );

      await setDoc(
        doc(db, "DANHSACH_LOP", namHocKey),
        {
          list: newClasses,
        }
      );

      setDeleteClassesOpen(false);

      await fetchClasses();

      if (selectedClasses.includes(selectedClass)) {
        setSelectedClass(
          newClasses.length
            ? newClasses[0]
            : ""
        );
      }

      // =========================
      // THÔNG BÁO THÀNH CÔNG
      // =========================
      setSnackbar({
        open: true,
        severity: "success",
        message:
          selectedClasses.length === 1
            ? `Đã xóa lớp ${selectedClasses[0]}`
            : `Đã xóa ${selectedClasses.length} lớp`,
      });

    } catch (err) {
      console.error("❌ Lỗi xóa lớp:", err);

      // =========================
      // THÔNG BÁO LỖI
      // =========================
      setSnackbar({
        open: true,
        severity: "error",
        message: "Xóa lớp thất bại",
      });
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "linear-gradient(to bottom, #e3f2fd, #bbdefb)",
        pt: 3,
        px: 3,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          borderRadius: 3,
          width: "100%",
          maxWidth: 700,
          bgcolor: "white",
          position: "relative",
        }}
      >
        <IconButton
          onClick={() => navigate("/dashboard")}
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 2000, // ✅ thêm cái này
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
        {/* ICON */}
        <Box
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            display: "flex",
            gap: 1,
            zIndex: 1000, // ⭐ QUAN TRỌNG
          }}
        >
          <Tooltip title="Tải file Excel">
            <IconButton
              onClick={handleUploadClick}
              sx={{
                color: "#1976d2",
                bgcolor: "rgba(25,118,210,0.1)",
                "&:hover": {
                  bgcolor: "rgba(25,118,210,0.2)",
                },
              }}
            >
              <FileUploadIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Tải thư mục Excel">
            <IconButton
              onClick={handleFolderUploadClick}
              sx={{
                color: "#2e7d32",
                bgcolor: "rgba(46,125,50,0.1)",
                "&:hover": {
                  bgcolor: "rgba(46,125,50,0.2)",
                },
              }}
            >
              <FolderOpenIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Xóa lớp">
            <IconButton
              onClick={() => setDeleteClassesOpen(true)}
              sx={{
                color: "#d32f2f",
                bgcolor: "rgba(211,47,47,0.1)",
                "&:hover": {
                  bgcolor: "rgba(211,47,47,0.2)",
                },
              }}
            >
              <DeleteSweepIcon />
            </IconButton>
          </Tooltip>

          {/*<Tooltip title="Khởi tạo DATA năm mới">
            <IconButton
              onClick={() => setCreateDataDialogOpen(true)}
              sx={{
                color: "#d32f2f",
                bgcolor: "rgba(211,47,47,0.1)",
                "&:hover": { bgcolor: "rgba(211,47,47,0.2)" },
              }}
            >
              <StorageIcon />
            </IconButton>
          </Tooltip>*/}

        </Box>

        {/* TIÊU ĐỀ */}
        <Box sx={{ textAlign: "center", mt: 3, mb: 3 }}>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ color: "#1976d2" }}
          >
            DANH SÁCH HỌC SINH
          </Typography>
        </Box>

        {/* DROPDOWN */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: 2,
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography fontWeight={500}>Lớp:</Typography>

            <Select
              value={selectedClass}
              onChange={handleClassChange}
              size="small"
              sx={{ width: 80 }}
            >
              {classes.map((cls) => (
                <MenuItem key={cls} value={cls}>
                  {cls}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
        
        {uploading && (
          <Box
            sx={{
              mt: 3,
              mb: 2,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                width: "25%",
                minWidth: 220, // chống quá nhỏ trên màn hình bé
              }}
            >
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{
                  height: 3,
                  borderRadius: 5,
                  bgcolor: "rgba(25,118,210,0.15)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 5,
                  },
                  mb: 1,
                }}
              />
              <Typography fontSize={14} mb={0.5} textAlign="center">
                Đang tải dữ liệu: {uploadProgress}%
              </Typography>
            </Box>
          </Box>
        )}

          <TableContainer
            component={Paper}
            sx={{ boxShadow: "none", border: "1px solid rgba(0,0,0,0.12)", overflowX: "auto" }}
          >
            <Table size="small" sx={{ tableLayout: "fixed", minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{ width: 40, bgcolor: "#1976d2", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}
                  >
                    STT
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ width: 120, bgcolor: "#1976d2", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}
                  >
                    MÃ ĐỊNH DANH
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ width: 220, bgcolor: "#1976d2", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}
                  >
                    HỌ VÀ TÊN
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      bgcolor: "#1976d2",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.4)",
                      whiteSpace: "nowrap",
                      width: 100,
                    }}
                  >
                    ĐIỀU CHỈNH
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {(students.length > 0 ? students : Array.from({ length: 5 })).map((s, index) => (
                  <TableRow
                    key={s?.maDinhDanh || `empty-${index}`}
                    onMouseEnter={() => s && setHoveredHS(s.maDinhDanh)}
                    onMouseLeave={() => setHoveredHS(null)}
                    sx={{
                      "&:hover": {
                        backgroundColor: "rgba(25,118,210,0.05)",
                      },
                    }}
                  >
                    {/* STT */}
                    <TableCell
                      align="center"
                      sx={{ width: 40, border: "1px solid rgba(0,0,0,0.12)", whiteSpace: "nowrap" }}
                    >
                      {s ? s.stt : index + 1}
                    </TableCell>

                    {/* MÃ ĐỊNH DANH */}
                    <TableCell
                      align="center"
                      sx={{ width: 120, border: "1px solid rgba(0,0,0,0.12)", whiteSpace: "nowrap" }}
                    >
                      {!isNaN(s?.maDinhDanh) ? s?.maDinhDanh : ""}
                    </TableCell>

                    {/* HỌ VÀ TÊN */}
                    <TableCell
                      sx={{
                        width: 220,
                        border: "1px solid rgba(0,0,0,0.12)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {s ? s.hoTen.toUpperCase() : ""}
                    </TableCell>

                    {/* ĐIỀU CHỈNH */}
                    <TableCell
                      align="center"
                      sx={{
                        border: "1px solid rgba(0,0,0,0.12)",
                        height: 30,
                      }}
                    >
                      {s && (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 0.5,
                            visibility:
                              hoveredHS === s.maDinhDanh ? "visible" : "hidden",
                          }}
                        >
                          {/* ➕ THÊM */}
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => {
                              setIsAdding(true);
                              setEditingStudent(null);
                              setNewName("");
                              setNewMaDinhDanh("");
                            }}
                          >
                            <PersonAddIcon fontSize="small" />
                          </IconButton>

                          {/* ✏️ SỬA */}
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditStudent(s)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>

                          {/* 🗑️ XOÁ */}
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setStudentToDelete(s);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

            </Table>
          </TableContainer>


      </Paper>

      {/*<input
        type="file"
        ref={fileInputRef}
        hidden
        accept=".xlsx"
        onChange={handleFileChange}
      />*/}
      {/*<input
        type="file"
        ref={fileInputRef}
        hidden
        accept=".xlsx"
        multiple
        webkitdirectory="true"
        onChange={handleFileChange}
      />*/}

      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept=".xlsx"
        multiple
        onChange={handleFileChange}
      />

      <input
        ref={folderInputRef}
        type="file"
        hidden
        multiple
        webkitdirectory=""
        onChange={handleFileChange}
      />

      <EditStudentDialog
        open={isAdding || !!editingStudent || deleteDialogOpen}
        onClose={() => {
          setIsAdding(false);
          setEditingStudent(null);
          setDeleteDialogOpen(false);
        }}
        student={editingStudent || studentToDelete}
        newName={newName}
        setNewName={setNewName}
        newMaDinhDanh={newMaDinhDanh}
        setNewMaDinhDanh={setNewMaDinhDanh}
        isAdding={isAdding}
        onSave={isAdding ? handleAddStudent : handleSaveStudent}
        isConfirm={deleteDialogOpen} // 🔹 bật chế độ xác nhận xóa
        onConfirm={async () => {
          if (studentToDelete) {
            await handleDeleteStudent(studentToDelete);
            setDeleteDialogOpen(false);
            setStudentToDelete(null);
          }
        }}
      />

    <CreateDataConfirmDialog
      open={createDataDialogOpen}
      onClose={() => setCreateDataDialogOpen(false)}
      configData={config}
    />

    <DeleteClassesDialog
      open={deleteClassesOpen}
      onClose={() => setDeleteClassesOpen(false)}
      classes={classes}
      selectedClass={selectedClass}
      deleteNamHoc={deleteNamHoc}
      setDeleteNamHoc={setDeleteNamHoc}
      onDelete={handleDeleteClasses}
    />

    <Snackbar
      open={snackbar.open}
      autoHideDuration={3000}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      onClose={() =>
        setSnackbar((prev) => ({
          ...prev,
          open: false,
        }))
      }
    >
      <Alert
        severity={snackbar.severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>

    </Box>    
  );
}
