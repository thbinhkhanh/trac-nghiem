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
  Radio, 
  Checkbox,
} from "@mui/material";
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

import { db } from "../firebase"; // Firestore instance

import DeleteIcon from "@mui/icons-material/Delete";
import { useConfig } from "../context/ConfigContext";
import { useTracNghiem } from "../context/TracNghiemContext";

import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SaveIcon from "@mui/icons-material/Save";
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddIcon from '@mui/icons-material/Add';

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

export default function TracNghiemGV() {
  const { config, setConfig } = useConfig(); // 🔹 thêm dòng này
  const { config: quizConfig, updateConfig: updateQuizConfig } = useTracNghiem();

  // ⚙️ State cho dialog mở đề
  const [openDialog, setOpenDialog] = useState(false);
  const [docList, setDocList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isEditingNewDoc, setIsEditingNewDoc] = useState(true);

  // ⚙️ Bộ lọc lớp
  const [filterClass, setFilterClass] = useState("Tất cả");

  // ⚙️ CẤU HÌNH ĐỀ THI – ĐÚNG CHUẨN FIRESTORE
  const savedConfig = JSON.parse(localStorage.getItem("teacherConfig") || "{}");

const [selectedClass, setSelectedClass] = useState(savedConfig.selectedClass || "");
const [selectedSubject, setSelectedSubject] = useState(savedConfig.selectedSubject || "");
const [semester, setSemester] = useState(savedConfig.semester || "");
const [schoolYear, setSchoolYear] = useState(savedConfig.schoolYear || "2025-2026");
const [examLetter, setExamLetter] = useState(savedConfig.examLetter || "");


  // ⚙️ Dropdown cố định
  const semesters = ["Giữa kỳ I", "Cuối kỳ I", "Giữa kỳ II", "Cả năm"];
  const classes = ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"];
  const subjects = ["Tin học", "Công nghệ"];
  const years = ["2025-2026", "2026-2027", "2027-2028", "2028-2029", "2029-2030"];


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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  const fetchInitialQuiz = async () => {
    try {
      const schoolFromState = location?.state?.school;
      const schoolToUse = schoolFromState || localStorage.getItem("school") || "";

      let docId = null;
      let collectionName = "";

      // Chọn config theo trường
      if (schoolToUse === "TH Lâm Văn Bền") {
        const cfgRef = doc(db, "LAMVANBEN", "config");
        const cfgSnap = await getDoc(cfgRef);
        if (!cfgSnap.exists()) {
          console.warn("Không tìm thấy config LAMVANBEN");
          setQuestions([]);
          return;
        }
        docId = cfgSnap.data()?.deTracNghiem || null;
        collectionName = "TRACNGHIEM_LVB";
      } else {
        const cfgRef = doc(db, "CONFIG", "config");
        const cfgSnap = await getDoc(cfgRef);
        if (!cfgSnap.exists()) {
          console.warn("Không tìm thấy CONFIG/config");
          setQuestions([]);
          return;
        }
        docId = cfgSnap.data()?.deTracNghiem || null;
        collectionName = "TRACNGHIEM_BK";
      }

      if (!docId) {
        console.warn("Không có deTracNghiem trong config");
        setQuestions([]);
        return;
      }

      // Lấy document đề
      const quizRef = doc(db, collectionName, docId);
      const quizSnap = await getDoc(quizRef);

      if (!quizSnap.exists()) {
        console.warn("Không tìm thấy đề:", collectionName, docId);
        setQuestions([]);
        return;
      }

      const data = quizSnap.data();
      const list = Array.isArray(data.questions) ? data.questions : [];

      // Đồng bộ trực tiếp state từ document
      setQuestions(list);
      setSelectedClass(data.class || "");
      setSelectedSubject(data.subject || "");
      setSemester(data.semester || "");
      setSchoolYear(data.schoolYear || "");
      setExamLetter(data.examLetter || "");

      // Cập nhật localStorage
      localStorage.setItem("teacherQuiz", JSON.stringify(list));
      localStorage.setItem("teacherConfig", JSON.stringify({
        selectedClass: data.class || "",
        selectedSubject: data.subject || "",
        semester: data.semester || "",
        schoolYear: data.schoolYear || "",
        examLetter: data.examLetter || "",
      }));

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
    if (cfg?.selectedSubject) setSelectedSubject(cfg.selectedSubject);

    // ⭐ Thêm 3 dòng cần thiết
    if (cfg?.semester) setSemester(cfg.semester);
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
      selectedSubject,
      semester,
      schoolYear,
      examLetter,
    };
    localStorage.setItem("teacherConfig", JSON.stringify(cfg));
  }, [selectedClass, selectedSubject, semester, schoolYear, examLetter]);


  // -----------------------
  // Xử lý câu hỏi
  // -----------------------
  const createEmptyQuestion = () => ({
    id: `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    question: "",
    type: "single",        // mặc định
    options: ["", "", "", ""],  // dùng cho tất cả loại (text hoặc image)
    score: 1,
    correct: [],
    sortType: "fixed",
    pairs: [],
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

    // 🔹 Reset tất cả dropdown về null / empty string
    setSelectedClass("");
    setSelectedSubject("");
    setSemester("");
    setSchoolYear("");
    setExamLetter("");

    // 🔹 KHÔNG update context hay localStorage ở đây
    // updateQuizConfig({ deTracNghiem: null });
    // localStorage.setItem(...) → bỏ

    // Khi người dùng bấm "Lưu" mới update context/localStorage
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
    if (!q.question?.trim()) return false;
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
      return q.options.some((o) => o.trim()) && q.correct?.length === 1;
    }

    if (q.type === "multiple") {
      return q.options.some((o) => o.trim()) && q.correct?.length > 0;
    }

    if (q.type === "truefalse") {
      const opts = q.options || [];
      const correct = q.correct || [];
      return opts.length > 0 && opts.some(o => o?.trim()) && correct.length === opts.length;
    }

    if (q.type === "image") {
      // ít nhất 1 hình được upload và ít nhất 1 hình được chọn làm đáp án
      const hasImage = q.options?.some(o => o); 
      const hasAnswer = q.correct?.length > 0;
      return hasImage && hasAnswer;
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

  const handleSaveAll = async () => {
    const invalid = questions
      .map((q, i) => (!isQuestionValid(q) ? `Câu ${i + 1}` : null))
      .filter(Boolean);

    if (invalid.length > 0) {
      setSnackbar({
        open: true,
        message: `❌ Các câu hỏi chưa hợp lệ: ${invalid.join(", ")}`,
        severity: "error",
      });
      return;
    }

    try {
      const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "tracnghiem_upload");

        const response = await fetch(
          "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload",
          { method: "POST", body: formData }
        );

        if (!response.ok) throw new Error("Upload hình thất bại");
        const data = await response.json();
        return data.secure_url;
      };

      const questionsToSave = [];

      for (let q of questions) {
        let updatedQ = { ...q };

        if (q.type === "image") {
          const uploadedOptions = await Promise.all(
            (q.options || []).map(async (opt) => {
              if (opt instanceof File) return await uploadImage(opt);
              return opt;
            })
          );
          updatedQ.options = uploadedOptions;
          updatedQ.correct = updatedQ.correct || [];
        }

        if (q.type === "matching") updatedQ.correct = q.pairs.map((_, i) => i);
        if (q.type === "sort") updatedQ.correct = q.options.map((_, i) => i);
        if (q.type === "single") updatedQ.correct = q.correct?.length ? q.correct : [0];
        if (q.type === "multiple") updatedQ.correct = q.correct || [];
        if (q.type === "truefalse")
          updatedQ.correct =
            q.correct?.length === q.options?.length ? q.correct : q.options.map(() => "");

        questionsToSave.push(updatedQ);
      }

      localStorage.setItem("teacherQuiz", JSON.stringify(questionsToSave));
      const cfg = { selectedClass, selectedSubject, semester };
      localStorage.setItem("teacherConfig", JSON.stringify(cfg));

      if (!selectedClass || !selectedSubject) {
        throw new Error("Vui lòng chọn lớp và môn trước khi lưu");
      }

      // 🔹 Lấy school từ localStorage
      const school = localStorage.getItem("school") || "";
      console.log("🏫 School:", school);

      // 🔹 Chọn collection dựa trên school
      let collectionName;
      if (school === "TH Lâm Văn Bền") {
        collectionName = "TRACNGHIEM_LVB";
      } else {
        collectionName = "TRACNGHIEM_BK";
      }

      // 🔹 Document ID 

      // Map rút gọn học kỳ
      const semesterMap = {
        "Giữa kỳ I": "GKI",
        "Cuối kỳ I": "CKI",
        "Giữa kỳ II": "GKII",
        "Cả năm": "CN",
      };

      // Hàm rút gọn năm học
      const shortSchoolYear = (year) => {
        // ví dụ year = "2026-2027" -> "26-27"
        const parts = year.split("-");
        if (parts.length === 2) {
          return parts[0].slice(2) + "-" + parts[1].slice(2);
        }
        return year;
      };

      // Khi tạo docId
      const docId = `quiz_${selectedClass}_${selectedSubject}_${semesterMap[semester]}_${shortSchoolYear(schoolYear)} (${examLetter})`;


      console.log("📁 Document path:", `${collectionName} / ${docId}`);

      const quizRef = doc(db, collectionName, docId);

      await setDoc(quizRef, {
        class: selectedClass,
        subject: selectedSubject,
        semester,               // ví dụ: "GKI", "CKI", ...
        schoolYear,             // ví dụ: "25-26"
        examLetter,             // ví dụ: "A", "B", ...
        questions: questionsToSave,
      });


      // 🔄 Cập nhật context nếu là đề mới
      const newDoc = { id: docId, class: selectedClass, subject: selectedSubject, semester, questions: questionsToSave };
      const existed = quizConfig.quizList?.some((d) => d.id === docId);
      if (!existed) {
        const updatedList = [...(quizConfig.quizList || []), newDoc];
        updateQuizConfig({ quizList: updatedList });
      }

      setSnackbar({
        open: true,
        message: "✅ Đã lưu thành công!",
        severity: "success",
      });
      setIsEditingNewDoc(false);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: `❌ Lỗi khi lưu đề: ${err.message}`,
        severity: "error",
      });
    }
  };

  // --- Hàm mở dialog và fetch danh sách document ---
  const handleOpenDialog = () => {
    setSelectedDoc(null);
    setFilterClass("Tất cả"); // reset về "Tất cả"
    setOpenDialog(true);
  };

  // 🔹 Hàm lấy danh sách đề trong Firestore
  const fetchQuizList = async () => {
    setLoadingList(true);
    setFilterClass("Tất cả"); // ← reset mỗi khi mở dialog

    try {
      const school = localStorage.getItem("school") || "";
      
      // Chọn collection theo school
      const colName = school === "TH Lâm Văn Bền" ? "TRACNGHIEM_LVB" : "TRACNGHIEM_BK";

      // Lấy tất cả document trong collection
      const colRef = collection(db, colName);
      const snap = await getDocs(colRef);

      // Lấy trực tiếp id (tên đề) từ Firestore
      const docs = snap.docs.map((d) => ({
        id: d.id,           // đây chính là tên đề: quiz_Lớp 4_Tin học
        name: d.id,         // có thể dùng name để hiển thị
        ...d.data(),
      }));

      setDocList(docs);

      // Tự động chọn đề đầu tiên nếu có
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

    try {
      // 🔹 Lấy tên trường từ localStorage
      const school = localStorage.getItem("school") || "";

      // 🔹 Chọn collection dựa trên tài khoản đăng nhập
      const collectionName = school === "TH Lâm Văn Bền" ? "TRACNGHIEM_LVB" : "TRACNGHIEM_BK";

      const docRef = doc(db, collectionName, selectedDoc);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

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

        setQuestions(fixedQuestions);
        setSelectedClass(data.class || "");
        setSelectedSubject(data.subject || "");
        setSemester(data.semester || "");
        setSchoolYear(data.schoolYear || "");
        setExamLetter(data.examLetter || "");
        // Cập nhật context và localStorage để lưu tên đề đã mở
        updateQuizConfig({ deTracNghiem: selectedDoc });
        localStorage.setItem("deTracNghiemId", selectedDoc);

        updateQuizConfig({ deTracNghiem: data });

        localStorage.setItem(
          "teacherConfig",
          JSON.stringify({
            selectedClass: data.class,
            selectedSubject: data.subject,
            semester: data.semester,
            schoolYear: data.schoolYear,
            examLetter: data.examLetter,
          })
        );

        localStorage.setItem("teacherQuiz", JSON.stringify(fixedQuestions));

        setOpenDialog(false);

        try {
          if (school === "TH Lâm Văn Bền") {
            // 🔹 Ghi vào LAMVANBEN/config
            const lvbConfigRef = doc(db, "LAMVANBEN", "config");
            await setDoc(
              lvbConfigRef,
              {
                choXemDiem: true,
                hocKy: "Giữa kỳ I",
                lop: "3A",
                mon: "Tin học",
                xuatFileBaiLam: true,
                deTracNghiem: selectedDoc, // tên đề mở
              },
              { merge: true }
            );
            console.log(`✅ Đã ghi deTracNghiem = "${selectedDoc}" vào LAMVANBEN/config`);
          } else {
            // 🔹 Ghi vào CONFIG/config cho các trường khác
            const configRef = doc(db, "CONFIG", "config");
            await setDoc(
              configRef,
              { deTracNghiem: selectedDoc },
              { merge: true }
            );
            console.log(`✅ Đã ghi deTracNghiem = "${selectedDoc}" vào CONFIG/config`);
          }

          setIsEditingNewDoc(false);
        } catch (err) {
          console.error("❌ Lỗi khi ghi CONFIG:", err);
        }
      } else {
        setSnackbar({
          open: true,
          message: "❌ Không tìm thấy đề này!",
          severity: "error",
        });
      }
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

  const handleDeleteSelectedDoc = async () => {
    if (!selectedDoc) {
      setSnackbar({
        open: true,
        message: "Vui lòng chọn một đề trước khi xóa.",
        severity: "warning",
      });
      return;
    }

    const docToDelete = docList.find(d => d.id === selectedDoc);
    const confirm = window.confirm(
      `❗ Bạn có chắc muốn xóa đề: ${docToDelete?.id || "?"}?`
    );

    setOpenDialog(false);

    if (!confirm) return;

    try {
      // 🔹 Lấy trường học đăng nhập
      const school = localStorage.getItem("school") || "";

      // 🔹 Chọn collection theo trường
      const collectionName = school === "TH Lâm Văn Bền" ? "TRACNGHIEM_LVB" : "TRACNGHIEM_BK";

      await deleteDoc(doc(db, collectionName, selectedDoc));

      const updatedList = docList.filter(d => d.id !== selectedDoc);
      setDocList(updatedList);
      updateQuizConfig({ quizList: updatedList });
      setSelectedDoc(null);

      // 🔄 Nếu đề bị xóa trùng với đề đang mở → reset giao diện
      const isCurrentQuizDeleted =
        selectedClass === docToDelete?.class &&
        selectedSubject === docToDelete?.subject &&
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

  return (
    <Box sx={{ minHeight: "100vh", p: 3, backgroundColor: "#e3f2fd", display: "flex", justifyContent: "center" }}>
      <Card elevation={4} sx={{ width: "100%", maxWidth: 970, p: 3, borderRadius: 3, position: "relative" }}>
        {/* Nút New, Mở đề và Lưu đề */}
        <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 8, left: 8 }}>
          {/* Icon New: soạn đề mới */}
          <IconButton onClick={handleCreateNewQuiz} sx={{ color: "#1976d2" }}>
            <AddIcon />
          </IconButton>

          {/* Icon mở đề */}
          <IconButton onClick={fetchQuizList} sx={{ color: "#1976d2" }}>
            <FolderOpenIcon />
          </IconButton>

          {/* Icon lưu đề */}
          <IconButton onClick={handleSaveAll} sx={{ color: "#1976d2" }}>
            <SaveIcon />
          </IconButton>
        </Stack>

        {/* Tiêu đề */}
        <Typography
          variant="h5"
          fontWeight="bold"
          textAlign="center"
          gutterBottom
          sx={{ textTransform: "uppercase", color: "#1976d2", mb: 1 }}
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
            ? `📝 Đề: ${selectedSubject || ""} - ${selectedClass || ""}`
            : "🆕 Đang soạn đề mới"}
        </Typography>



        {/* FORM LỚP / MÔN / HỌC KỲ / TUẦN */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Stack spacing={2}>
                <Stack direction={{ xs: "row", sm: "row" }} spacing={2}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Lớp</InputLabel>
                  <Select
                    value={selectedClass || ""}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    label="Lớp"
                  >
                    {classes.map((lop) => (
                      <MenuItem key={lop} value={lop}>
                        {lop}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>


                <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Môn học</InputLabel>
                    <Select
                    value={selectedSubject || ""}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    label="Môn học"
                    >
                    {subjects?.map((mon) => (
                        <MenuItem key={mon} value={mon}>
                        {mon}
                        </MenuItem>
                    ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Học kỳ</InputLabel>
                  <Select
                    value={semester || ""}
                    onChange={(e) => setSemester(e.target.value)}
                    label="Học kỳ"
                  >
                    {semesters.map((hk) => (
                      <MenuItem key={hk} value={hk}>
                        {hk}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                
                {/* Năm học */}
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Năm học</InputLabel>
                  <Select
                    value={schoolYear || ""}
                    onChange={(e) => setSchoolYear(e.target.value)}
                    label="Năm học"
                  >
                    {years.map((y) => (
                      <MenuItem key={y} value={y}>
                        {y}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>


                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Đề</InputLabel>
                  <Select
                    value={examLetter || ""}         // state để lưu lựa chọn
                    onChange={(e) => setExamLetter(e.target.value)}
                    label="Đề"
                  >
                    {["A", "B", "C", "D"].map((d) => (
                      <MenuItem key={d} value={d}>
                        {d}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                </Stack>
            </Stack>
            </Paper>


        {/* DANH SÁCH CÂU HỎI */}
        <Stack spacing={3}>
          {questions.map((q, qi) => (
            <Paper key={q.id || qi} elevation={3} sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Câu hỏi {qi + 1}
              </Typography>

              <TextField
                fullWidth
                multiline
                label="Nội dung câu hỏi"
                value={q.question || ""}
                onChange={(e) => updateQuestionAt(qi, { question: e.target.value })}
                sx={{ mb: 2 }}
              />

              <Stack direction={{ xs: "row", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
                <FormControl size="small" sx={{ width: 180 }}>
                  <InputLabel>Loại câu hỏi</InputLabel>
                  <Select
                    value={q.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      let patch = { type: newType };

                      if (newType === "sort") {
                        patch.correct = q.options.map((_, i) => i);
                        patch.pairs = [];
                      }

                      if (newType === "matching") {
                        patch.pairs = q.pairs?.length
                          ? q.pairs
                          : Array.from({ length: 4 }, () => ({ left: "", right: "" }));
                      }

                      if (newType === "single") {
                        patch.correct = q.correct?.length ? q.correct : [0];
                        patch.pairs = [];
                      }

                      if (newType === "multiple") {
                        patch.correct = Array.isArray(q.correct) ? q.correct : [];
                        patch.pairs = [];
                      }

                      if (newType === "image") {
                        patch.options = q.options?.length === 4 ? q.options : ["", "", "", ""];
                        patch.pairs = [];
                        patch.correct = [];
                      }

                      updateQuestionAt(qi, patch);
                    }}
                    label="Loại câu hỏi"
                  >
                    <MenuItem value="truefalse">Đúng – Sai</MenuItem>
                    <MenuItem value="single">Một lựa chọn</MenuItem>
                    <MenuItem value="multiple">Nhiều lựa chọn</MenuItem>                    
                    <MenuItem value="matching">Ghép đôi</MenuItem>                    
                    <MenuItem value="image">Hình ảnh</MenuItem>
                    <MenuItem value="sort">Sắp xếp</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Điểm"
                  type="number"
                  size="small"
                  value={q.score}
                  onChange={(e) => updateQuestionAt(qi, { score: parseFloat(e.target.value) || 1 })}
                  sx={{ width: 80 }}
                />
              </Stack>

              {/* Danh sách đáp án */}
              <Stack spacing={1} sx={{ mb: 2 }}>
                {q.type === "matching" && (
                  <Stack spacing={1}>
                    {q.pairs?.map((pair, pi) => (
                      <Stack key={pi} direction="row" spacing={1} alignItems="center">
                        <TextField
                          label={`A ${pi + 1}`}
                          size="small"
                          value={pair.left}
                          onChange={(e) => {
                            const newPairs = [...q.pairs];
                            newPairs[pi].left = e.target.value;
                            updateQuestionAt(qi, { pairs: newPairs });
                          }}
                          fullWidth
                        />
                        <TextField
                          label={`B ${pi + 1}`}
                          size="small"
                          value={pair.right}
                          onChange={(e) => {
                            const newPairs = [...q.pairs];
                            newPairs[pi].right = e.target.value;
                            updateQuestionAt(qi, { pairs: newPairs });
                          }}
                          fullWidth
                        />

                        {/* 🔹 Icon xóa cặp */}
                        <IconButton
                          onClick={() => {
                            const newPairs = [...q.pairs];
                            newPairs.splice(pi, 1);
                            updateQuestionAt(qi, { pairs: newPairs });
                          }}
                        >
                          <RemoveCircleOutlineIcon sx={{ color: "error.main" }} />
                        </IconButton>
                      </Stack>
                    ))}

                    <Button
                      variant="outlined"
                      onClick={() =>
                        updateQuestionAt(qi, {
                          pairs: [...q.pairs, { left: "", right: "" }],
                        })
                      }
                    >
                      Thêm cặp
                    </Button>
                  </Stack>
                )}


                {(q.type === "sort" || q.type === "single" || q.type === "multiple") && (
                  <Stack spacing={1}>
                    {q.options?.map((opt, oi) => (
                      <Stack key={oi} direction="row" spacing={1} alignItems="center">
                        {/* 🔹 Radio / Checkbox đặt trước TextField */}
                        {q.type === "single" && (
                          <Radio
                            checked={q.correct?.[0] === oi}
                            onChange={() => updateQuestionAt(qi, { correct: [oi] })}
                            size="small"
                          />
                        )}
                        {q.type === "multiple" && (
                          <Checkbox
                            checked={q.correct?.includes(oi)}
                            onChange={(e) => {
                              let corr = [...(q.correct || [])];
                              if (e.target.checked) corr.push(oi);
                              else corr = corr.filter((c) => c !== oi);
                              updateQuestionAt(qi, { correct: corr });
                            }}
                            size="small"
                          />
                        )}

                        {/* 🔹 TextField đáp án */}
                        <TextField
                          value={opt}
                          size="small"
                          multiline
                          fullWidth
                          onChange={(e) => {
                            const newOptions = [...q.options];
                            newOptions[oi] = e.target.value;
                            updateQuestionAt(qi, { options: newOptions });
                          }}
                        />

                        {/* 🔹 Icon xóa đáp án */}
                        <IconButton
                          onClick={() => {
                            const newOptions = [...q.options];
                            newOptions.splice(oi, 1);

                            let newCorrect = [...(q.correct || [])];
                            if (q.type === "single") {
                              newCorrect = newCorrect[0] === oi ? [] : newCorrect;
                            } else {
                              newCorrect = newCorrect
                                .filter((c) => c !== oi)
                                .map((c) => (c > oi ? c - 1 : c));
                            }

                            updateQuestionAt(qi, { options: newOptions, correct: newCorrect });
                          }}
                        >
                          <RemoveCircleOutlineIcon sx={{ color: "error.main" }} />
                        </IconButton>
                      </Stack>
                    ))}

                    <Button
                      variant="outlined"
                      onClick={() => {
                        const newOptions = [...q.options, ""];
                        updateQuestionAt(qi, { options: newOptions });
                      }}
                    >
                      Thêm mục
                    </Button>
                  </Stack>
                )}

                {/* ✅ Chèn “Đúng/Sai” ở đây */}
                {q.type === "truefalse" && (
                  <Stack spacing={1}>
                    {q.options?.map((opt, oi) => (
                      <Stack key={oi} direction="row" spacing={1} alignItems="center">
                        {/* TextField cho option */}
                        <TextField
                          value={opt}
                          size="small"
                          multiline
                          fullWidth
                          onChange={(e) => {
                            const newOptions = [...q.options];
                            newOptions[oi] = e.target.value;
                            updateQuestionAt(qi, { options: newOptions });
                          }}
                        />

                        {/* Dropdown Đúng / Sai, mặc định rỗng, không nhãn */}
                        <FormControl size="small" sx={{ width: 120 }}>
                          <Select
                            value={q.correct?.[oi] || ""}
                            onChange={(e) => {
                              const newCorrect = [...(q.correct || [])];
                              newCorrect[oi] = e.target.value;
                              updateQuestionAt(qi, { correct: newCorrect });
                            }}
                          >
                            <MenuItem value="">Chọn</MenuItem> {/* Mặc định rỗng */}
                            <MenuItem value="Đ">Đúng</MenuItem>
                            <MenuItem value="S">Sai</MenuItem>
                          </Select>
                        </FormControl>

                        {/* Xóa option */}
                        <IconButton
                          onClick={() => {
                            const newOptions = [...q.options];
                            newOptions.splice(oi, 1);

                            const newCorrect = [...(q.correct || [])];
                            newCorrect.splice(oi, 1);

                            updateQuestionAt(qi, { options: newOptions, correct: newCorrect });
                          }}
                        >
                          <RemoveCircleOutlineIcon sx={{ color: "error.main" }} />
                        </IconButton>
                      </Stack>
                    ))}

                    <Button
                      variant="outlined"
                      onClick={() =>
                        updateQuestionAt(qi, {
                          options: [...q.options, ""],
                          correct: [...(q.correct || []), ""], // Thêm dropdown rỗng
                        })
                      }
                    >
                      Thêm mục
                    </Button>
                  </Stack>
                )}

                {q.type === "image" && (
                  <Stack
                    direction={{ xs: "column", sm: "row" }}   // ⭐ đổi direction theo màn hình
                    spacing={2}
                    alignItems="center"
                  >
                    {Array.from({ length: 4 }).map((_, oi) => {
                      const img = q.options?.[oi] || "";
                      const isChecked = q.correct?.includes(oi) || false;

                      return (
                        <Box key={oi} sx={{ position: "relative" }}>
                          <Paper
                            sx={{
                              width: { xs: "100%", sm: 120 },   // ⭐ mobile: full width
                              height: 120,
                              border: "2px dashed #90caf9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "relative",
                            }}
                          >
                            {img ? (
                              <>
                                <img
                                  src={img}
                                  alt={`option-${oi}`}
                                  style={{
                                    maxWidth: "100%",
                                    maxHeight: "100%",
                                    objectFit: "contain",
                                  }}
                                />
                                <IconButton
                                  size="small"
                                  sx={{ position: "absolute", top: 2, right: 2 }}
                                  onClick={() => {
                                    const newOptions = [...q.options];
                                    newOptions[oi] = "";
                                    updateQuestionAt(qi, { options: newOptions });

                                    const newCorrect = (q.correct || []).filter(c => c !== oi);
                                    updateQuestionAt(qi, { correct: newCorrect });
                                  }}
                                >
                                  ✕
                                </IconButton>
                              </>
                            ) : (
                              <label
                                style={{
                                  cursor: "pointer",
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Typography variant="body2" sx={{ textAlign: "center" }}>
                                  Tải hình lên
                                </Typography>
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: "none" }}
                                  onChange={(e) =>
                                    e.target.files?.[0] &&
                                    handleImageChange(qi, oi, e.target.files[0])
                                  }
                                />
                              </label>
                            )}
                          </Paper>

                          {img && (
                            <Checkbox
                              checked={isChecked}
                              onChange={(e) => {
                                let newCorrect = [...(q.correct || [])];
                                if (e.target.checked) newCorrect.push(oi);
                                else newCorrect = newCorrect.filter((c) => c !== oi);

                                updateQuestionAt(qi, { correct: newCorrect });
                              }}
                              sx={{
                                position: "absolute",
                                top: -10,
                                left: -10,
                                bgcolor: "background.paper",
                                borderRadius: "50%",
                              }}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                )}



              </Stack>

              {/* Hàng cuối: Kiểu sắp xếp + Hợp lệ + Xóa câu hỏi */}
              <Stack direction={{ xs: "row", sm: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
                <FormControl size="small" sx={{ width: 150 }}>
                  <InputLabel>Kiểu sắp xếp</InputLabel>
                  <Select
                    value={q.sortType || "fixed"}
                    onChange={(e) => updateQuestionAt(qi, { sortType: e.target.value })}
                    label="Kiểu sắp xếp"
                  >
                    <MenuItem value="fixed">Cố định</MenuItem>
                    <MenuItem value="shuffle">Đảo câu</MenuItem>
                  </Select>
                </FormControl>
                <Typography sx={{ color: isQuestionValid(q) ? "green" : "red" }}>
                  {isQuestionValid(q) ? "Hợp lệ" : "Chưa hợp lệ"}
                </Typography>

                {/* Icon xóa câu hỏi với Tooltip */}
                <Tooltip title={`Xóa câu ${qi + 1}`}>
                  <IconButton onClick={() => handleDeleteQuestion(qi)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </Tooltip>

              </Stack>

            </Paper>
          ))}
        </Stack>

        {/* Nút thêm câu hỏi + nút lưu đề */}
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button variant="contained" onClick={addQuestion}>Thêm câu hỏi</Button>
          <Button variant="outlined" color="secondary" onClick={handleSaveAll} disabled={questions.length === 0}>
            Lưu đề
          </Button>
        </Stack>

        {/* DIALOG MỞ ĐỀ */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: 6,
              bgcolor: "#f9f9f9",
            },
          }}
        >
          <DialogTitle
            sx={{
              textAlign: "center",
              py: 1.2,
              fontWeight: "bold",
              fontSize: "1.1rem",
              background: "linear-gradient(to right, #1976d2, #42a5f5)",
              color: "#fff",
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            }}
          >
            📂 Chọn đề để mở
          </DialogTitle>

          <DialogContent
            dividers
            sx={{
              maxHeight: 320,
              overflowY: "auto",
              px: 2,
              py: 2,
              bgcolor: "#fff",
            }}
          >
            {/* Bộ lọc lớp */}
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ alignSelf: "center" }}>
                Lọc theo lớp:
              </Typography>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="Tất cả">Tất cả</MenuItem>
                  {classes.map((lop) => (
                    <MenuItem key={lop} value={lop}>
                      {lop}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

            </Stack>

            {loadingList ? (
              <Typography align="center" sx={{ py: 4, color: "text.secondary" }}>
                ⏳ Đang tải danh sách đề...
              </Typography>
            ) : docList.length === 0 ? (
              <Typography align="center" sx={{ py: 4, color: "text.secondary" }}>
                Không có đề nào.
              </Typography>
            ) : (
              <Stack spacing={0.5}> {/* giảm khoảng cách giữa các thẻ */}
                {docList
                  .filter((doc) =>
                    filterClass === "Tất cả" ? true : doc.class === filterClass
                  )
                  .map((doc) => (
                    <Box
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc.id)}
                      onDoubleClick={() => handleOpenSelectedDoc(doc.id)}
                      sx={{
                        px: 2,
                        py: 1,
                        border: "1px solid #e0e0e0", // viền xám nhạt
                        borderRadius: 0,             // bỏ bo góc
                        cursor: "pointer",
                        userSelect: "none",
                        bgcolor: "#fff",             // nền trắng
                        "&:hover": {                  // hover nhẹ
                          bgcolor: "#f5f5f5",
                        },
                      }}
                    >
                      <Typography variant="body1" color="text.primary">
                        {doc.id} {/* tên document */}
                      </Typography>
                    </Box>
                  ))}
              </Stack>
            )}
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              pb: 2,
              justifyContent: "center",
              gap: 1.5,
            }}
          >
            <Button
              onClick={() => handleOpenSelectedDoc(selectedDoc)}
              variant="contained"
            >
              Mở đề
            </Button>
            <Button
              onClick={handleDeleteSelectedDoc}
              variant="outlined"
              color="error"
            >
              Xóa đề
            </Button>
            <Button
              onClick={() => setOpenDialog(false)}
              variant="outlined"
            >
              Đóng
            </Button>
          </DialogActions>
        </Dialog>

        {/* SNACKBAR */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>

      </Card>
    </Box>
  );
}
