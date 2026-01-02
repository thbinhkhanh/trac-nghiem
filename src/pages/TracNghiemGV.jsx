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
  Grid,
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
import CloseIcon from "@mui/icons-material/Close";

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
        // Lấy tên trường ưu tiên từ state, fallback localStorage
        // (bỏ qua điều kiện riêng cho TH Lâm Văn Bền)
        const schoolFromState = location?.state?.school;
        const schoolToUse = schoolFromState || localStorage.getItem("school") || "";

        let docId = null;
        const collectionName = "TRACNGHIEM_LVB"; // chỉ dùng collection LVB

        // Lấy config từ Firestore (luôn lấy CONFIG/config)
        const cfgRef = doc(db, "CONFIG", "config");

        const cfgSnap = await getDoc(cfgRef);
        if (!cfgSnap.exists()) {
          console.warn("Không tìm thấy config CONFIG/config");
          setQuestions([]);
          return;
        }

        docId = cfgSnap.data()?.deTracNghiem || null;
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
        localStorage.setItem(
          "teacherConfig",
          JSON.stringify({
            selectedClass: data.class || "",
            selectedSubject: data.subject || "",
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
    title: "",
    question: "",
    type: "single",                // 🟢 mặc định: 1 lựa chọn
    options: ["", "", "", ""],     // 🟢 AUTO 4 lựa chọn
    score: 0.5,
    correct: [],                   // 🟢 chưa chọn đáp án
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

  const handleSaveAll = async () => {
    try {
      // Hàm upload hình
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

      // Chuẩn hóa câu hỏi
      const questionsToSave = await Promise.all(
        questions.map(async (q) => {
          let updatedQ = { ...q };

          if (q.type === "image") {
            const uploadedOptions = await Promise.all(
              (q.options || []).map((opt) => (opt instanceof File ? uploadImage(opt) : opt))
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

          return updatedQ;
        })
      );

      // Lưu local
      localStorage.setItem("teacherQuiz", JSON.stringify(questionsToSave));
      localStorage.setItem(
        "teacherConfig",
        JSON.stringify({ selectedClass, selectedSubject, semester, schoolYear, examLetter })
      );

      if (!selectedClass || !selectedSubject) {
        throw new Error("Vui lòng chọn lớp và môn trước khi lưu");
      }

      // Chỉ dùng TRACNGHIEM_LVB
      const collectionName = "TRACNGHIEM_LVB";

      // Map rút gọn học kỳ
      const semesterMap = {
        "Giữa kỳ I": "GKI",
        "Cuối kỳ I": "CKI",
        "Giữa kỳ II": "GKII",
        "Cả năm": "CN",
      };

      const shortSchoolYear = (year) => {
        const parts = year.split("-");
        return parts.length === 2 ? parts[0].slice(2) + "-" + parts[1].slice(2) : year;
      };

      const docId = `quiz_${selectedClass}_${selectedSubject}_${semesterMap[semester]}_${shortSchoolYear(schoolYear)} (${examLetter})`;
      console.log("📁 Document path:", `${collectionName} / ${docId}`);

      const quizRef = doc(db, collectionName, docId);

      await setDoc(quizRef, {
        class: selectedClass,
        subject: selectedSubject,
        semester,
        schoolYear,
        examLetter,
        questions: questionsToSave,
      });
      
      const configRef = doc(db, "CONFIG", "config");
      await setDoc(
        configRef,
        {
          deTracNghiem: docId, 
        },
        { merge: true } // giữ các field khác nguyên vẹn
      );

      // Cập nhật context nếu là đề mới
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
    setFilterClass("Tất cả"); // reset mỗi lần mở dialog

    try {
      // ✅ Chỉ dùng TRACNGHIEM_LVB
      const collectionName = "TRACNGHIEM_LVB";

      // Lấy tất cả document trong collection
      const colRef = collection(db, collectionName);
      const snap = await getDocs(colRef);

      // Lấy trực tiếp id (tên đề) từ Firestore
      const docs = snap.docs.map((d) => ({
        id: d.id,   // tên đề, ví dụ: quiz_Lớp 4_Tin học
        name: d.id, // có thể dùng name để hiển thị
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
      // 🔹 Chỉ dùng TRACNGHIEM_LVB
      const collectionName = "TRACNGHIEM_LVB";

      const docRef = doc(db, collectionName, selectedDoc);
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

      // Cập nhật context và localStorage
      updateQuizConfig({ deTracNghiem: selectedDoc });
      localStorage.setItem("deTracNghiemId", selectedDoc);
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
      setIsEditingNewDoc(false);

      if (localStorage.getItem("school") === "TH Lâm Văn Bền") {
        const configRef = doc(db, "CONFIG", "config");

        await setDoc(
          configRef,
          {
            //choXemDiem: true,
            //deHocKy: data.semester || "Giữa kỳ I",   // lấy trực tiếp từ document
            //lop: data.class || "3A",                  // lấy trực tiếp từ document
            // mon: data.subject,                      // nếu muốn lưu môn cũng có thể thêm
            //xuatFileBaiLam: true,
            deTracNghiem: selectedDoc,
          },
          { merge: true }
        );

        console.log(
          `✅ Đã ghi deTracNghiem = "${selectedDoc}", deHocKy = "${data.semester}", lop = "${data.class}" vào CONFIG/config`
        );
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
      const collectionName = "TRACNGHIEM_LVB";

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
    const openQuizFromConfig = async () => {
      const docId = config.deTracNghiem || localStorage.getItem("deTracNghiemId");
      if (!docId) {
        setIsEditingNewDoc(true);
        return;
      }

      try {
        const collectionName = "TRACNGHIEM_LVB";
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          console.warn("Không tìm thấy đề:", docId);
          setIsEditingNewDoc(true);
          return;
        }

        const data = docSnap.data();
        setQuestions(data.questions || []);
        setSelectedClass(data.class || "");
        setSelectedSubject(data.subject || "");
        setSemester(data.semester || "");
        setSchoolYear(data.schoolYear || "");
        setExamLetter(data.examLetter || "");
        setSelectedDoc(docId);
        setIsEditingNewDoc(false);

        localStorage.setItem("deTracNghiemId", docId);
        localStorage.setItem("teacherQuiz", JSON.stringify(data.questions || []));
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

        console.log("✅ Đã mở đề:", docId);
      } catch (err) {
        console.error("❌ Lỗi mở đề:", err);
      }
    };

    openQuizFromConfig();
  }, [config.deTracNghiem]);

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
            ? `📝 Đề: ${selectedSubject || ""} - ${selectedClass || ""}`
            : "🆕 Đang soạn đề mới"}
        </Typography>

        {/* FORM LỚP / MÔN / HỌC KỲ / NĂM HỌC / ĐỀ */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Stack
            direction={{ xs: "column", md: "row" }} // xs: điện thoại = column, md+: desktop = row
            spacing={2}
            flexWrap="wrap"
          >
            {/* Lớp */}
            <FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
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

            {/* Môn học */}
            {/*<FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
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
            </FormControl>*/}

            {/* Học kỳ */}
            <FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
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
            <FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
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

            {/* Đề */}
            <FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
              <InputLabel>Đề</InputLabel>
              <Select
                value={examLetter || ""}
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

              {/* ⭐ Hình minh họa bên dưới nội dung câu hỏi */}
              <Box sx={{ mt: -1, mb: 2 }}>
                {q.questionImage ? (
                  <Box sx={{ position: "relative", display: "inline-block" }}>
                    <img
                      src={q.questionImage}
                      alt="question"
                      style={{
                        maxWidth: "100%",
                        maxHeight: 260,
                        objectFit: "contain",
                        borderRadius: 8,
                        border: "1px solid #ccc",
                        marginTop: 8
                      }}
                    />
                    <IconButton
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        backgroundColor: "#fff"
                      }}
                      onClick={() => updateQuestionAt(qi, { questionImage: "" })}
                    >
                      ✕
                    </IconButton>
                  </Box>
                ) : (
                  <Button variant="outlined" component="label">
                    📷 Thêm hình minh họa
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const reader = new FileReader();
                        reader.onload = () => updateQuestionAt(qi, { questionImage: reader.result });
                        reader.readAsDataURL(f);
                      }}
                    />
                  </Button>
                )}
              </Box>


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

                      // 🔹 Thêm loại câu hỏi điền khuyết
                      if (newType === "fillblank") {
                        patch.options = []; // danh sách từ để kéo thả
                        patch.answers = []; // học sinh điền vào ô trống
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

                    {/* 🔹 MenuItem mới cho điền khuyết */}
                    <MenuItem value="fillblank">Điền khuyết</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Điểm"
                  type="number"
                  size="small"
                  value={q.score}
                  inputProps={{ step: 0.5 }}   // tăng/giảm nút mũi tên theo 0.5
                  onChange={(e) => {
                    const v = e.target.value;
                    updateQuestionAt(qi, { score: v === "" ? "" : parseFloat(v) });
                  }}
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
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems="center"
                  >
                    {(q.options || []).map((img, oi) => {
                      const isChecked = q.correct?.includes(oi) || false;

                      return (
                        <Box key={oi} sx={{ position: "relative" }}>
                          <Paper
                            sx={{
                              width: { xs: "80%", sm: 120 },
                              height: { xs: 80, sm: 120 },
                              border: "2px dashed #90caf9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "relative",
                            }}
                          >
                            {img ? (
                              <img
                                src={img}
                                alt={`option-${oi}`}
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "100%",
                                  objectFit: "contain",
                                }}
                              />
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

                            {/* ⭐ Nút X — luôn xuất hiện, dù có hình hay không */}
                            <IconButton
                              size="small"
                              sx={{ position: "absolute", top: 2, right: 2 }}
                              onClick={() => {
                                const newOptions = [...q.options];
                                newOptions.splice(oi, 1); // xoá ô hình
                                updateQuestionAt(qi, { options: newOptions });

                                const newCorrect = (q.correct || []).filter((c) => c !== oi);
                                updateQuestionAt(qi, { correct: newCorrect });
                              }}
                            >
                              ✕
                            </IconButton>
                          </Paper>

                          {/* Checkbox đáp án chỉ hiện khi có hình */}
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

                    {/* Nút thêm ô hình */}
                    <Button
                      variant="outlined"
                      onClick={() => {
                        const newOptions = [...(q.options || []), ""];
                        updateQuestionAt(qi, { options: newOptions });
                      }}
                      sx={{
                        height: 120,
                        width: 120,
                        borderRadius: 2,
                        borderStyle: "dashed",
                      }}
                    >
                      + Thêm hình
                    </Button>
                  </Stack>
                )}

              </Stack>

              {q.type === "fillblank" && (
                <Stack spacing={2}>
                  {/* Ô nhập câu hỏi với [...] */}
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="Nhập câu hỏi với [...] cho chỗ trống"
                    value={q.option || ""}
                    onChange={(e) => updateQuestionAt(qi, { option: e.target.value })}
                  />

                  {/* Danh sách từ cần điền */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
                    Từ cần điền
                  </Typography>

                  <Grid container spacing={1}>
                    {q.options?.map((opt, oi) => (
                      <Grid item xs={12} sm={6} key={oi}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextField
                            value={opt}
                            size="small"
                            fullWidth
                            onChange={(e) => {
                              const newOptions = [...q.options];
                              newOptions[oi] = e.target.value;
                              updateQuestionAt(qi, { options: newOptions });
                            }}
                          />
                          <IconButton
                            onClick={() => {
                              const newOptions = [...q.options];
                              newOptions.splice(oi, 1);
                              updateQuestionAt(qi, { options: newOptions });
                            }}
                          >
                            <RemoveCircleOutlineIcon sx={{ color: "error.main" }} />
                          </IconButton>
                        </Stack>
                      </Grid>
                    ))}

                    {/* Nút thêm từ */}
                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        onClick={() =>
                          updateQuestionAt(qi, { options: [...(q.options || []), ""] })
                        }
                        sx={{
                          height: 40,
                          borderRadius: 2,
                          borderStyle: "dashed",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          px: 2,
                          minWidth: 120
                        }}
                      >
                        + Thêm từ
                      </Button>

                    </Grid>
                  </Grid>

                  {/* 🏷️ Label Preview */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1976d2" }}>
                    Xem trước câu hỏi
                  </Typography>

                  {/* Preview đồng bộ font với Option */}
                  <Box
                    sx={{
                      p: 1,
                      border: "1px dashed #90caf9",
                      borderRadius: 1,
                      minHeight: 50,
                      fontFamily: "Roboto, Arial, sans-serif", // giống font MUI TextField
                      fontSize: "0.875rem", // size giống TextField size="small"
                      lineHeight: 1.5
                    }}
                  >
                    {q.option
                      ? q.option.split("[...]").map((part, i, arr) => (
                          <React.Fragment key={i}>
                            <span>{part}</span>
                            {i < arr.length - 1 && (
                              <Box
                                component="span"
                                sx={{
                                  display: "inline-block",
                                  minWidth: 60,
                                  borderBottom: "2px solid #000",
                                  mx: 0.5
                                }}
                              />
                            )}
                          </React.Fragment>
                        ))
                      : "Câu hỏi chưa có nội dung"}
                  </Box>
                </Stack>
              )}

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
                {/*<Typography sx={{ color: isQuestionValid(q) ? "green" : "red" }}>
                  {isQuestionValid(q) ? "Hợp lệ" : "Chưa hợp lệ"}
                </Typography>*/}

                <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
                  <Tooltip title="Lưu đề">
                    <IconButton onClick={handleSaveAll}>
                      <SaveIcon sx={{ color: "#1976d2" }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={`Xóa câu ${qi + 1}`}>
                    <IconButton onClick={() => handleDeleteQuestion(qi)}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  </Tooltip>
                </Stack>


              </Stack>

            </Paper>
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
              overflow: "hidden", // để borderRadius và icon X hiển thị đúng
            },
          }}
        >
          {/* Thanh tiêu đề với nền gradient xanh và icon X */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "transparent",
              background: "linear-gradient(to right, #1976d2, #42a5f5)", // ⭐ nền xanh gradient
              color: "#fff",
              px: 2,
              py: 1.2,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "bold", fontSize: "1.1rem", letterSpacing: 0.5 }}
            >
              📂 Danh sách đề
            </Typography>

            <IconButton
              onClick={() => setOpenDialog(false)}
              sx={{ color: "#fff", p: 0.6 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Nội dung Dialog */}
          <DialogContent
            dividers
            sx={{
              maxHeight: 350,
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

            {/* Bảng danh sách đề */}
            <Box
              sx={{
                maxHeight: 260,
                overflowY: "auto",
                border: "1px solid #ccc",
                borderRadius: 2,
                mb: 1,
              }}
            >
              {loadingList ? (
                <Typography align="center" sx={{ p: 2, color: "gray" }}>
                  ⏳ Đang tải danh sách đề...
                </Typography>
              ) : docList.length === 0 ? (
                <Typography align="center" sx={{ p: 2, color: "gray" }}>
                  Không có đề nào.
                </Typography>
              ) : (
                docList
                  .filter((doc) =>
                    filterClass === "Tất cả" ? true : doc.class === filterClass
                  )
                  .map((doc) => (
                    <Stack
                      key={doc.id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        px: 2,
                        py: 1,
                        height: 36,
                        cursor: "pointer",
                        borderRadius: 1,
                        backgroundColor:
                          selectedDoc === doc.id ? "#E3F2FD" : "transparent",
                        "&:hover": { backgroundColor: "#f5f5f5" },
                      }}
                      onClick={() => setSelectedDoc(doc.id)}
                      onDoubleClick={() => handleOpenSelectedDoc(doc.id)}
                    >
                      {/*<Typography variant="subtitle1">{doc.id}</Typography>*/}
                      <Typography variant="subtitle1">{formatExamTitle(doc.id)}</Typography>
                    </Stack>
                  ))
              )}
            </Box>
          </DialogContent>

          {/* Các nút hành động */}
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
              disabled={!selectedDoc}
            >
              Mở đề
            </Button>

            <Button
              onClick={handleDeleteSelectedDoc}
              variant="outlined"
              color="error"
              disabled={!selectedDoc}
            >
              Xóa đề
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
