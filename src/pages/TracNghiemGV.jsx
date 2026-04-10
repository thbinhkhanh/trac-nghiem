import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Select,
  MenuItem,
  IconButton,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Card,
  Tooltip,
  //Radio, 
  //Checkbox,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

import { db } from "../firebase"; // Firestore instance
import { useLocation } from "react-router-dom";

import DeleteIcon from "@mui/icons-material/Delete";
import { useConfig } from "../context/ConfigContext";
import { useTracNghiem } from "../context/TracNghiemContext";

import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SaveIcon from "@mui/icons-material/Save";
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from "@mui/icons-material/Close";

import OpenExamDialog from "../dialog/OpenExamDialog";
import ExamDeleteConfirmDialog from "../dialog/ExamDeleteConfirmDialog";
import ExportDialog from "../dialog/ExportDialog";
import QuestionCard from "../Types/questions/QuestionCard";
import { saveAllQuestions } from "../utils/saveAllQuestions";

import { exportQuestionsToJSON } from "../utils/exportJson_importJson.js";
import { importQuestionsFromJSON } from "../utils/exportJson_importJson.js";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";

export default function TracNghiemGV() {
  const { config, setConfig } = useConfig(); 
  const { config: quizConfig, updateConfig: updateQuizConfig } = useTracNghiem();

  // ⚙️ State cho dialog mở đề
  const [openDialog, setOpenDialog] = useState(false);
  const [docList, setDocList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isEditingNewDoc, setIsEditingNewDoc] = useState(true);
  const location = useLocation();

  // ⚙️ Bộ lọc lớp
  const [filterClass, setFilterClass] = useState("Tất cả");

  // ⚙️ CẤU HÌNH ĐỀ THI – ĐÚNG CHUẨN FIRESTORE
  const savedConfig = JSON.parse(localStorage.getItem("teacherConfig") || "{}");

const [selectedClass, setSelectedClass] = useState(savedConfig.selectedClass || "");
const [schoolYear, setSchoolYear] = useState(savedConfig.schoolYear || "2025-2026");
const [examLetter, setExamLetter] = useState(savedConfig.examLetter || "");
const [dialogExamType, setDialogExamType] = useState("");
const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
const [filterYear, setFilterYear] = useState("Tất cả");
const [semester, setSemester] = useState("Giữa kỳ I");

// ⚙️ Dropdown cố định
const semesters = ["Giữa kỳ I", "Cuối kỳ I", "Giữa kỳ II", "Cả năm"];
const classes = ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"];
const years = ["2025-2026", "2026-2027", "2027-2028", "2028-2029", "2029-2030"];

const fileInputRef = React.useRef(null);
const [fileName, setFileName] = useState("de_trac_nghiem");
const [openExportDialog, setOpenExportDialog] = useState(false); // dialog export


  // ⚙️ Danh sách câu hỏi
  const [questions, setQuestions] = useState([]);

  // ⚙️ Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Hàm upload lên Cloudinary
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "tracnghiem_upload"); // preset unsigned
    formData.append("folder", "questions"); // 🔹 folder muốn lưu

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/dxzpfljv4/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || "Upload hình thất bại");
    }

    const data = await response.json();
    return data.secure_url; // URL hình đã upload
  };


  useEffect(() => {
    const savedId = localStorage.getItem("deTracNghiemId");
    if (savedId) {
      updateQuizConfig({ deTracNghiem: savedId });
    }
  }, []);

  useEffect(() => {
    const fetchInitialQuiz = async () => {
      try {
        // Luôn đọc config từ CONFIG/config
        const cfgRef = doc(db, "CONFIG", "config");
        const cfgSnap = await getDoc(cfgRef);

        if (!cfgSnap.exists()) {
          console.warn("Không tìm thấy CONFIG/config");
          setQuestions([]);
          return;
        }

        const cfgData = cfgSnap.data() || {};

        // 🔹 Lấy id đề
        const docId = cfgData.deTracNghiem || null;

        if (!docId) {
          console.warn("Không có deTracNghiem trong config");
          setQuestions([]);
          return;
        }

        // 🔹 CHỈ DÙNG 1 COLLECTION
        const quizRef = doc(db, "NGANHANG_DE", docId);
        const quizSnap = await getDoc(quizRef);

        if (!quizSnap.exists()) {
          console.warn("Không tìm thấy đề:", docId);
          setQuestions([]);
          return;
        }

        const data = quizSnap.data();
        const list = Array.isArray(data.questions) ? data.questions : [];

        // 🔹 Đồng bộ state
        setQuestions(list);
        setSelectedClass(data.class || "");
        setSemester(data.semester || "");
        setSchoolYear(data.schoolYear || "");
        setExamLetter(data.examLetter || "");

        // 🔹 Lưu localStorage
        localStorage.setItem("teacherQuiz", JSON.stringify(list));
        localStorage.setItem(
          "teacherConfig",
          JSON.stringify({
            selectedClass: data.class || "",
            semester: data.semester || "",
            schoolYear: data.schoolYear || "",
            examLetter: data.examLetter || "",
          })
        );
      } catch (err) {
        console.error("❌ Lỗi load đề:", err);
        setQuestions([]);
      }
    };

    fetchInitialQuiz();
  }, [location?.state?.school]);



// -----------------------
// Load dữ liệu khi mount
// -----------------------
useEffect(() => {
  try {
    // Load config
    const cfg = JSON.parse(localStorage.getItem("teacherConfig") || "{}");

    if (cfg?.selectedClass) setSelectedClass(cfg.selectedClass);
    if (cfg?.schoolYear) setSchoolYear(cfg.schoolYear);
    if (cfg?.examLetter) setExamLetter(cfg.examLetter);

    // Load quiz
    const saved = JSON.parse(localStorage.getItem("teacherQuiz") || "[]");

    if (Array.isArray(saved) && saved.length) {
      const fixed = saved.map(q => {
        switch (q.type) {
          case "image":
            return {
              ...q,
              options: Array.from({ length: 4 }, (_, i) => q.options?.[i] || ""),
              correct: Array.isArray(q.correct) ? q.correct : [],
            };
          case "truefalse":
            return {
              ...q,
              options: q.options || ["Đúng", "Sai"],
              correct: q.correct || ["Đúng"],
            };
          case "sort":
          case "matching":
            return { ...q };
          default:
            return {
              ...q,
              type: "sort",
              options: q.options || ["", "", "", ""],
              correct: q.options ? q.options.map((_, i) => i) : [],
              pairs: [],
            };
        }
      });

      setQuestions(fixed);
    } else {
      setQuestions([createEmptyQuestion()]);
    }
  } catch (err) {
    console.error("❌ Không thể load dữ liệu:", err);
    setQuestions([createEmptyQuestion()]);
  }
}, []);



  // 🔹 Lưu config vào localStorage khi thay đổi
  useEffect(() => {
    const cfg = {
      selectedClass,
      semester,
      schoolYear,
      examLetter,
    };
    localStorage.setItem("teacherConfig", JSON.stringify(cfg));
  }, [selectedClass, semester, schoolYear, examLetter]);



  // -----------------------
  // Xử lý câu hỏi
  // -----------------------
  const createEmptyQuestion = () => ({
    id: `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title: "",
    question: "",             // nội dung câu hỏi
    option: "",               // riêng cho fillblank (câu hỏi có [...])
    type: "single",           // mặc định: 1 lựa chọn
    options: ["", "", "", ""],// luôn có mảng options
    score: 0.5,
    correct: [],              // đáp án đúng
    sortType: "fixed",        // cho loại sort
    pairs: [],                // cho loại matching
    answers: [],              // cho loại fillblank
    questionImage: ""         // cho loại image
  });

  // Hàm dùng để reorder khi kéo thả (nếu dùng sau)
  function reorder(list, startIndex, endIndex) {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  }

  const handleCreateNewQuiz = () => {
    // Xóa đề đang chọn
    setSelectedDoc(null);

    // Reset câu hỏi về 1 câu trống
    const emptyQ = createEmptyQuestion();
    setQuestions([emptyQ]);

    // Đặt trạng thái là đề mới
    setIsEditingNewDoc(true);

    // Reset các thông tin còn sử dụng
    setSelectedClass("");
    setSemester("");
    setSchoolYear("");
    setExamLetter("");
  };


  const handleAddQuestion = () => setQuestions((prev) => [...prev, createEmptyQuestion()]);

  const handleDeleteQuestion = (index) => {
    if (window.confirm(`Bạn có chắc muốn xóa câu hỏi ${index + 1}?`)) {
      setQuestions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateQuestionAt = (index, patch) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const isQuestionValid = (q) => {
    if (!q.question?.trim()) return false;  // câu trả lời hoặc nội dung
    if (q.score <= 0) return false;

    if (q.type === "sort") {
      const nonEmptyOpts = (q.options || []).filter((o) => o?.trim());
      return nonEmptyOpts.length >= 2;
    }

    if (q.type === "matching") {
      const pairs = q.pairs || [];
      return pairs.length > 0 && pairs.every(p => p.left?.trim() && p.right?.trim());
    }

    if (q.type === "single") {
      return q.options?.some((o) => o.trim()) && q.correct?.length === 1;
    }

    if (q.type === "multiple") {
      return q.options?.some((o) => o.trim()) && q.correct?.length > 0;
    }

    if (q.type === "truefalse") {
      const opts = q.options || [];
      const correct = q.correct || [];
      return opts.length > 0 && opts.some(o => o?.trim()) && correct.length === opts.length;
    }

    if (q.type === "image") {
      const hasImage = q.options?.some(o => o); 
      const hasAnswer = q.correct?.length > 0;
      return hasImage && hasAnswer;
    }

    if (q.type === "fillblank") {
      // ít nhất 1 từ để điền (options) và câu hỏi có ít nhất 1 chỗ trống [...]
      const hasOptions = q.options?.some(o => o?.trim());
      const hasBlanks = q.option?.includes("[...]"); // lưu ý dùng q.option thay vì q.question
      return hasOptions && hasBlanks;
    }

    return false; // fallback cho các type chưa xử lý
  };

  function extractMatchingCorrect(pairs) {
    const correct = {};
    pairs.forEach((p) => {
      correct[p.left.trim()] = p.right.trim();
    });
    return correct;
  }

  // --- Hàm mở dialog và fetch danh sách document ---
 // Mở dialog với mặc định loại đề "Bài tập tuần"
  const handleOpenDialog = () => {
    setSelectedDoc(null);
    setFilterClass("Tất cả"); // reset về "Tất cả"
    
    const defaultType = "bt";       // mặc định Bài tập tuần
    fetchQuizList(defaultType);      // load danh sách đề
  };


  // 🔹 Hàm lấy danh sách đề trong Firestore
  const fetchQuizList = async () => {
    setLoadingList(true);
    setFilterClass("Tất cả");

    try {
      const colRef = collection(db, "NGANHANG_DE");
      const snap = await getDocs(colRef);

      const docs = snap.docs.map((d) => ({
        id: d.id,
        name: d.id,
        collection: "NGANHANG_DE",
        ...d.data(),
      }));

      setDocList(docs);
      if (docs.length > 0) setSelectedDoc(docs[0].id);

    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách đề:", err);
      setSnackbar({
        open: true,
        message: "❌ Không thể tải danh sách đề!",
        severity: "error",
      });
    } finally {
      setLoadingList(false);
      setOpenDialog(true);
    }
  };


  // 🔹 Hàm mở đề được chọn
  const handleOpenSelectedDoc = async () => {
    if (!selectedDoc) {
      setSnackbar({
        open: true,
        message: "Vui lòng chọn một đề trước khi mở.",
        severity: "warning",
      });
      return;
    }

    setOpenDialog(false);

    try {
      // ✅ CHỈ DÙNG 1 COLLECTION
      const docRef = doc(db, "NGANHANG_DE", selectedDoc);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setSnackbar({
          open: true,
          message: "❌ Không tìm thấy đề này!",
          severity: "error",
        });
        return;
      }

      const data = docSnap.data();

      // 🔹 Chuẩn hóa câu hỏi
      const fixedQuestions = (data.questions || []).map((q) => {
        if (q.type === "image") {
          return {
            ...q,
            options: Array.from({ length: 4 }, (_, i) => q.options?.[i] || ""),
            correct: Array.isArray(q.correct) ? q.correct : [],
          };
        }
        return q;
      });

      // 🔹 Cập nhật state chính
      setQuestions(fixedQuestions);
      setSelectedClass(data.class || "");
      setSemester(data.semester || "");
      setSchoolYear(data.schoolYear || "");
      setExamLetter(data.examLetter || "");

      // 🔹 Lưu context
      updateQuizConfig({ deTracNghiem: selectedDoc });
      localStorage.setItem("deTracNghiemId", selectedDoc);

      // 🔹 Lưu localStorage cấu hình GV
      localStorage.setItem(
        "teacherConfig",
        JSON.stringify({
          selectedClass: data.class,
          semester: data.semester,
          schoolYear: data.schoolYear,
          examLetter: data.examLetter,
        })
      );

      localStorage.setItem("teacherQuiz", JSON.stringify(fixedQuestions));

      // 🔹 Ghi CONFIG chung (nếu cần đồng bộ hệ khác)
      try {
        const configRef = doc(db, "CONFIG", "config");
        await setDoc(
          configRef,
          {
            deTracNghiem: selectedDoc,
          },
          { merge: true }
        );
      } catch (err) {
        console.error("❌ Lỗi khi ghi CONFIG:", err);
      }

      setIsEditingNewDoc(false);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: `❌ Lỗi khi mở đề: ${err.message}`,
        severity: "error",
      });
    }
  };


  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      createEmptyQuestion(),
    ]);
  };

  const handleDeleteSelectedDoc = () => {
    if (!selectedDoc) {
      setSnackbar({
        open: true,
        message: "Vui lòng chọn một đề trước khi xóa.",
        severity: "warning",
      });
      return;
    }

    setOpenDialog(false);       // đóng dialog danh sách đề
    setOpenDeleteDialog(true);  // mở dialog xác nhận xóa
  };

  const confirmDeleteSelectedDoc = async () => {
    setOpenDeleteDialog(false);

    try {
      const docToDelete = docList.find(d => d.id === selectedDoc);
      if (!docToDelete) return;

      // 🔹 Xóa đúng collection của document
      await deleteDoc(doc(db, docToDelete.collection, docToDelete.id));

      const updatedList = docList.filter(d => d.id !== docToDelete.id);
      setDocList(updatedList);
      updateQuizConfig({ quizList: updatedList });
      setSelectedDoc(null);

      // 🔹 Kiểm tra có phải đề đang mở không (KHÔNG còn subject)
      const isCurrentQuizDeleted =
        selectedClass === docToDelete?.class &&
        semester === docToDelete?.semester &&
        schoolYear === docToDelete?.schoolYear &&
        examLetter === docToDelete?.examLetter;

      if (isCurrentQuizDeleted) {
        setQuestions([createEmptyQuestion()]);
        updateQuizConfig({ deTracNghiem: null });
      }

      setSnackbar({
        open: true,
        message: "🗑️ Đã xóa đề thành công!",
        severity: "success",
      });
    } catch (err) {
      console.error("❌ Lỗi khi xóa đề:", err);
      setSnackbar({
        open: true,
        message: `❌ Lỗi khi xóa đề: ${err.message}`,
        severity: "error",
      });
    }
  };


  useEffect(() => {
    // Ưu tiên lấy từ context nếu có
    const contextDocId = quizConfig?.deTracNghiem;

    // Nếu không có trong context, thử lấy từ localStorage
    const storedDocId = localStorage.getItem("deTracNghiemId");

    const docId = contextDocId || storedDocId || null;

    if (docId) {
      setSelectedDoc(docId);
      setIsEditingNewDoc(false); // có đề → không phải đề mới
    } else {
      setIsEditingNewDoc(true); // không có đề → là đề mới
    }
  }, []);


  const handleImageChange = async (qi, oi, file) => {
    try {
      // Tạo formData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "tracnghiem_upload"); // preset unsigned
      formData.append("folder", "questions"); // folder trong Cloudinary

      // Upload
      const response = await fetch("https://api.cloudinary.com/v1_1/dxzpfljv4/image/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload hình thất bại");

      const data = await response.json();
      const imageUrl = data.secure_url;

      // Cập nhật question.options với URL
      const newOptions = [...questions[qi].options];
      newOptions[oi] = imageUrl;
      updateQuestionAt(qi, { options: newOptions });

    } catch (err) {
      console.error("❌ Lỗi upload hình:", err);
      setSnackbar({
        open: true,
        message: `❌ Upload hình thất bại: ${err.message}`,
        severity: "error",
      });
    }
  };

  const handleSaveAll = () => {
    saveAllQuestions({
      questions,
      db,
      selectedClass,
      semester,
      schoolYear,
      examLetter,
      quizConfig,
      updateQuizConfig,
      setSnackbar,
      setIsEditingNewDoc,
    });
  };

  const deTracNghiem =
    quizConfig.deTracNghiem || localStorage.getItem("deTracNghiemId");

  let displayTitle = "🆕 Đang soạn đề mới";

  if (deTracNghiem) {
    const parts = deTracNghiem.split("_");
    const mon = parts[2] || ""; // Tin học
    const lop = selectedClass || ""; // Lấy từ Select

    displayTitle = `📝 Đề: ${mon} - ${lop}`;
  }

  const handleExportJSON = () => {
    let defaultName = "";

    if (selectedClass || semester || schoolYear || examLetter) {
      const subject = "Tin học";

      const lop = selectedClass || ""; // đã là "Lớp 3"
      const hk = semester === "Cuối kỳ I" ? "HK1" : "HK2";
      const year = schoolYear || "";
      const code = examLetter ? ` (${examLetter.toUpperCase()})` : "";

      defaultName = `Đề ${subject} ${lop} ${hk} ${year}${code}`;
    }

    setFileName(defaultName);
    setOpenExportDialog(true);
  };
  
  const handleConfirmExport = () => {
    setOpenExportDialog(false); // đóng dialog

    let finalName = fileName.trim();

    if (!finalName) {
      setSnackbar({
        open: true,
        message: "❌ Tên file không được để trống",
        severity: "error",
      });
      return;
    }

    // 🔥 Xóa hẳn phần: .json_123456
    finalName = finalName.replace(/\.json_\d+$/, "");

    // 🔥 nếu chưa có .json thì thêm
    if (!finalName.endsWith(".json")) {
      finalName += ".json";
    }

    const result = exportQuestionsToJSON({
      questions,
      fileName: finalName,
    });

    if (result.success) {
      setSnackbar({
        open: true,
        message: "✅ Xuất đề thành công!",
        severity: "success",
      });
    } else {
      setSnackbar({
        open: true,
        message: "❌ Lỗi khi xuất đề!",
        severity: "error",
      });
    }
  };

  const handleImportJSON = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const result = await importQuestionsFromJSON(file);

    if (result.success) {
      setQuestions(result.data);

      setSnackbar({
        open: true,
        message: "✅ Nhập đề thành công!",
        severity: "success",
      });
    } else {
      setSnackbar({
        open: true,
        message: `❌ ${result.error}`,
        severity: "error",
      });
    }

    // reset input để chọn lại file cùng tên vẫn trigger
    e.target.value = "";
  };

  return (
    <Box sx={{ minHeight: "100vh", p: 3, backgroundColor: "#e3f2fd", display: "flex", justifyContent: "center" }}>
      <Card elevation={4} sx={{ width: "100%", maxWidth: 970, p: 3, borderRadius: 3, position: "relative" }}>
        {/* Nút New, Mở đề và Lưu đề */}
        <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 8, left: 8 }}>
          {/* Icon New: soạn đề mới */}
          <Tooltip title="Soạn đề mới">
            <IconButton onClick={handleCreateNewQuiz} sx={{ color: "#1976d2" }}>
              <AddIcon />
            </IconButton>
          </Tooltip>

          {/* Icon mở đề */}
          <Tooltip title="Mở đề">
            <IconButton onClick={fetchQuizList} sx={{ color: "#1976d2" }}>
              <FolderOpenIcon />
            </IconButton>
          </Tooltip>

          {/* Icon lưu đề */}
          <Tooltip title="Lưu đề">
            <IconButton onClick={handleSaveAll} sx={{ color: "#1976d2" }}>
              <SaveIcon />
            </IconButton>
          </Tooltip>

          {/* Export */}
          <Tooltip title="Xuất đề kiểm tra (JSON)">
            <IconButton onClick={handleExportJSON} sx={{ color: "#2e7d32" }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>

          {/* Import */}
          <Tooltip title="Nhập đề kiểm tra (JSON)">
            <IconButton
              onClick={() => fileInputRef.current.click()}
              sx={{ color: "#ed6c02" }}
            >
              <UploadFileIcon />
            </IconButton>
          </Tooltip>

          {/* Input file ẩn */}
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleImportJSON}
          />
        </Stack>

        {/* Tiêu đề */}
        <Typography
          variant="h5"
          fontWeight="bold"
          textAlign="center"
          gutterBottom
          sx={{ textTransform: "uppercase", color: "#1976d2", mt: 3, mb: 1 }}
        >
          Tạo đề kiểm tra
        </Typography>

        <Typography
          variant="subtitle1"
          textAlign="center"
          fontWeight="bold"
          sx={{ color: "text.secondary", mb: 3 }}
        >
          {quizConfig.deTracNghiem || localStorage.getItem("deTracNghiemId")
            ? `📝 Đề: Tin học - ${selectedClass || ""}`
            : "🆕 Đang soạn đề mới"}
        </Typography>


        {/* FORM LỚP / MÔN / HỌC KỲ / NĂM HỌC / ĐỀ */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap">

            {/* ===== LỚP ===== */}
            <FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
              <InputLabel>Lớp</InputLabel>
              <Select
                value={selectedClass || ""}
                onChange={(e) => setSelectedClass(e.target.value)}
                label="Lớp"
              >
                <MenuItem value="">Chọn</MenuItem>
                {classes.map((lop) => (
                  <MenuItem key={lop} value={lop}>{lop}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* ===== HỌC KỲ ===== */}
            <FormControl size="small" sx={{ flex: 1, minWidth: 140 }}>
              <InputLabel>Học kỳ</InputLabel>
              <Select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                label="Học kỳ"
              >
                <MenuItem value="Cuối kỳ I">Học kỳ I</MenuItem>
                <MenuItem value="Cả năm">Học kỳ II</MenuItem>
              </Select>
            </FormControl>

            {/* ===== NĂM HỌC ===== */}
            <FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
              <InputLabel>Năm học</InputLabel>
              <Select
                value={schoolYear || ""}
                onChange={(e) => setSchoolYear(e.target.value)}
                label="Năm học"
              >
                {years.map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* ===== ĐỀ (A/B/C/D) ===== */}
            <FormControl size="small" sx={{ flex: 1, minWidth: 100 }}>
              <InputLabel>Đề</InputLabel>
              <Select
                value={examLetter || ""}
                onChange={(e) => setExamLetter(e.target.value)}
                label="Đề"
              >
                {["A", "B", "C", "D", "E", "F", "G", "H"].map((d) => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </Select>
            </FormControl>

          </Stack>
        </Paper>

        {/* DANH SÁCH CÂU HỎI */}
        <Stack spacing={3}>
          {questions.map((q, qi) => (
            <QuestionCard
              key={q.id || qi}
              q={q}
              qi={qi}
              updateQuestionAt={updateQuestionAt}
              handleDeleteQuestion={handleDeleteQuestion}
              handleImageChange={handleImageChange}
              handleSaveAll={() =>
                saveAllQuestions({
                  questions,
                  db,
                  selectedClass,
                  semester,
                  schoolYear,
                  examLetter,
                  quizConfig,
                  updateQuizConfig,
                  setSnackbar,
                  setIsEditingNewDoc,
                })
              }
            />
          ))}
        </Stack>

        {/* Nút thêm câu hỏi + nút lưu đề */}
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button variant="contained" onClick={addQuestion}>Thêm câu hỏi</Button>
          {/*<Button variant="outlined" color="secondary" onClick={handleSaveAll} disabled={questions.length === 0}>
            Lưu đề
          </Button>*/}
        </Stack>

        {/* DIALOG MỞ ĐỀ */}
        <OpenExamDialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          dialogExamType={dialogExamType}
          setDialogExamType={setDialogExamType}
          filterClass={filterClass}
          setFilterClass={setFilterClass}
          filterYear={filterYear}          // thêm
          setFilterYear={setFilterYear}    // thêm
          classes={classes}
          loadingList={loadingList}
          docList={docList}
          selectedDoc={selectedDoc}
          setSelectedDoc={setSelectedDoc}
          handleOpenSelectedDoc={handleOpenSelectedDoc}
          handleDeleteSelectedDoc={handleDeleteSelectedDoc}
          fetchQuizList={fetchQuizList}
        />

        <ExportDialog
          open={openExportDialog}
          onClose={() => setOpenExportDialog(false)}
          fileName={fileName}
          setFileName={setFileName}
          onConfirm={handleConfirmExport}
        />

        {/* SNACKBAR */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
        
        <ExamDeleteConfirmDialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          onConfirm={confirmDeleteSelectedDoc}
        />

      </Card>
    </Box>
  );
}
