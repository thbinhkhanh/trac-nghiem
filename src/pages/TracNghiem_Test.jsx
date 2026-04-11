import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  Stack,
  LinearProgress,
  IconButton,
  Tooltip,
  Snackbar, 
  Alert,
  Divider,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel, Card,
} from "@mui/material";
import { doc, getDoc, getDocs, setDoc, collection, updateDoc } from "firebase/firestore";
// Thay cho react-beautiful-dnd
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { db } from "../firebase";
import { useContext } from "react";
import { ConfigContext } from "../context/ConfigContext";
import { exportQuizPDF } from "../utils/exportQuizPDF"; 
import QuestionOption from "../utils/QuestionOption";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

//import CheckCircleIcon from '@mui/icons-material/CheckCircle';
//import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ExitConfirmDialog from "../dialog/ExitConfirmDialog";
import ImageZoomDialog from "../dialog/ImageZoomDialog";
import IncompleteAnswersDialog from "../dialog/IncompleteAnswersDialog";


import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

import { getQuestionStatus_Test } from "../utils/questionStatus_Test";
import { useTheme, useMediaQuery } from "@mui/material";

// Hàm shuffle mảng
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function TracNghiem_Test() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizClass, setQuizClass] = useState("");
  const [score, setScore] = useState(0);

  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [unansweredQuestions, setUnansweredQuestions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const { config } = useContext(ConfigContext);
  const [selectedYear, setSelectedYear] = useState(config?.namHoc || "2025-2026");
  const [saving, setSaving] = useState(false);
  const [openExitConfirm, setOpenExitConfirm] = useState(false);

  const [zoomImage, setZoomImage] = useState(null);

  const location = useLocation();
  //const { studentId, studentName, studentClass, selectedWeek, mon } = location.state || {};
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(0);

  const [hocKi, setHocKi] = useState(config?.hocKy || "Cuối kỳ I");
  const [monHoc, setMonHoc] = useState("");
  const [choXemDiem, setChoXemDiem] = useState(false);
  const [choXemDapAn, setChoXemDapAn] = useState(false);
  const xuatFileBaiLam = config?.xuatFileBaiLam ?? true;

  const [openResultDialog, setOpenResultDialog] = useState(false);
  const [studentResult, setStudentResult] = useState(null);
  const [fillBlankStatus, setFillBlankStatus] = useState({});

  const [examList, setExamList] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [complete, setComplete] = useState(false); // thêm dòng này
  const [examType, setExamType] = useState("kt"); // "bt" | "kt"

  const theme = useTheme();
  const isBelow1024 = useMediaQuery("(max-width:1023px)");
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Lấy trường từ tài khoản đăng nhập
  const account = localStorage.getItem("account") || "";
  const school = account === "TH Lâm Văn Bền" ? account : "TH Bình Khánh";

  // Lấy lớp từ tên đề
  const detectedClass = selectedExam?.match(/Lớp\s*(\d+)/)?.[1] || "Test";

  const extractClassFromExam = (name = "") => {
  const str = name.toLowerCase();

  // "lớp 3"
  let match = str.match(/lớp\s*(\d+)/i);
  if (match) return match[1];

  // "tin học 3", "toán 4"
  match = str.match(/(tin học|toán|tiếng việt|anh văn|khoa học)\s*(\d+)/i);
  if (match) return match[2];

  // fallback: số đầu tiên trong chuỗi
  match = str.match(/\b(\d{1,2})\b/);
  if (match) return match[1];

  return "Test";
};

// Gán thông tin mặc định theo yêu cầu
  const studentInfo = {
    name: "Nguyễn Văn A",
    class: detectedClass,
    school: school
  };

  // Đồng bộ thời gian
  useEffect(() => {
    if (config?.timeLimit) setTimeLeft(config.timeLimit * 60);
  }, [config?.timeLimit]);

  useEffect(() => {
    if (started && !startTime) {
      setStartTime(Date.now());
    }
  }, [started, startTime]);

  // Timer
  useEffect(() => {
    if (!started || submitted) return; // <-- thêm !started
    if (timeLeft <= 0) {
      autoSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft, submitted]);


  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleMatchSelect = (questionId, leftIndex, rightIndex) => {
    setAnswers(prev => {
      const prevAns = prev[questionId] ?? [];
      const newAns = [...prevAns];
      newAns[leftIndex] = rightIndex;
      return { ...prev, [questionId]: newAns };
    });
  };

    // ⭐ RESET TOÀN BỘ SAU KHI CHỌN ĐỀ MỚI
  useEffect(() => {
    if (!selectedExam) return;

    // Reset các state liên quan
    setAnswers({});
    setCurrentIndex(0);
    setComplete(false);
    setSubmitted(false);       // reset trạng thái đã nộp
    setStarted(false);
    setScore(0);
    setTimeLeft(0);
    setStartTime(null);        // reset thời gian bắt đầu
    setQuestions([]);
    setProgress(0);
    setLoading(true);
    setOpenResultDialog(false);
    setStudentResult(null);
    setFillBlankStatus({});

  }, [selectedExam]);

  // Hàm shuffleUntilDifferent: đảo mảng cho đến khi khác ít nhất 1 phần tử so với gốc
  function shuffleUntilDifferent(items) {
    if (!Array.isArray(items) || items.length === 0) return items;
    let shuffled = [...items];
    let attempts = 0;
    do {
      shuffled = shuffleArray([...items]);
      attempts++;
    } while (
      shuffled.every((item, idx) => item.idx === items[idx].idx) &&
      attempts < 100
    );
    return shuffled;
  }

  function buildRuntimeQuestions(rawQuestions = []) {
    // 🔥 1. SHUFFLE THỨ TỰ CÂU HỎI
    let saved = shuffleArray([...rawQuestions]);

    const loadedQuestions = saved.map((q, index) => {
      const questionId = q.id ?? `q_${index}`;
      const questionText =
        typeof q.question === "string" ? q.question.trim() : "";

      const rawType = (q.type || "").toString().trim().toLowerCase();
      const type = [
        "sort",
        "matching",
        "single",
        "multiple",
        "image",
        "truefalse",
        "fillblank",
      ].includes(rawType)
        ? rawType
        : null;

      if (!type) return null;

      // ================= MATCHING =================
      if (type === "matching") {
        const pairs = Array.isArray(q.pairs) ? q.pairs : [];
        if (pairs.length === 0) return null;

        const leftOptions = pairs.map((p, idx) => {
          if (p.leftImage && p.leftImage.url) {
            return {
              type: "image",
              url: p.leftImage.url,
              name: p.leftImage.name || `img-${idx}`,
            };
          }

          if (
            typeof p.left === "string" &&
            /^https?:\/\//i.test(p.left.trim())
          ) {
            return {
              type: "image",
              url: p.left.trim(),
              name: `img-${idx}`,
            };
          }

          return p.left ?? "";
        });

        const rightOriginal = pairs.map((p, idx) => ({
          opt: p.right,
          idx,
        }));

        const processedRight =
          q.sortType === "shuffle"
            ? shuffleUntilDifferent(rightOriginal)
            : rightOriginal;

        const indexMap = {};
        processedRight.forEach((item, newIndex) => {
          indexMap[item.idx] = newIndex;
        });

        const correct = leftOptions.map((_, i) => indexMap[i]);

        return {
          ...q,
          id: questionId,
          type,
          question: questionText,
          image: q.image ?? null,
          leftOptions,
          rightOptions: processedRight.map(i => i.opt),
          correct,
          score: q.score ?? 1,
        };
      }

      // ================= SORT =================
      if (type === "sort") {
        const options =
          Array.isArray(q.options) && q.options.length > 0
            ? [...q.options]
            : ["", "", "", ""];

        const indexed = options.map((opt, idx) => ({ opt, idx }));

        const processed =
          q.sortType === "shuffle"
            ? shuffleUntilDifferent(indexed)
            : indexed;

        return {
          ...q,
          id: questionId,
          type,
          question: questionText,
          image: q.image ?? null,
          options: processed.map(i => i.opt),
          initialSortOrder: options.map((_, i) => i),
          correctTexts: options,
          score: q.score ?? 1,
        };
      }

      // ================= SINGLE / MULTIPLE =================
      if (type === "single" || type === "multiple") {
        const options =
          Array.isArray(q.options) && q.options.length > 0
            ? q.options.map(opt => {
                if (typeof opt === "string") {
                  if (/^https?:\/\/.*\.(png|jpg|jpeg|gif)$/i.test(opt)) {
                    return { text: "", image: opt };
                  }
                  return { text: opt, image: null };
                }
                if (typeof opt === "object") {
                  return {
                    text: opt.text ?? "",
                    image: opt.image ?? null,
                  };
                }
                return { text: "", image: null };
              })
            : [
                { text: "", image: null },
                { text: "", image: null },
                { text: "", image: null },
                { text: "", image: null },
              ];

        const indexed = options.map((opt, idx) => ({ opt, idx }));
        const shouldShuffle =
          q.sortType === "shuffle" || q.shuffleOptions === true;

        const processed = shouldShuffle
          ? shuffleArray(indexed)
          : indexed;

        return {
          ...q,
          id: questionId,
          type,
          question: questionText,
          image: q.image ?? null,
          options,
          displayOrder: processed.map(i => i.idx),
          correct: Array.isArray(q.correct)
            ? q.correct.map(Number)
            : typeof q.correct === "number"
            ? [q.correct]
            : [],
          score: q.score ?? 1,
        };
      }

      // ================= IMAGE =================
      if (type === "image") {
        const options =
          Array.isArray(q.options) && q.options.length > 0
            ? q.options
            : ["", "", "", ""];

        return {
          ...q,
          id: questionId,
          type,
          question: questionText,
          image: q.image ?? null,
          options,
          displayOrder: shuffleArray(options.map((_, idx) => idx)),
          correct: Array.isArray(q.correct) ? q.correct : [],
          score: q.score ?? 1,
        };
      }

      // ================= TRUE / FALSE =================
      if (type === "truefalse") {
        const options =
          Array.isArray(q.options) && q.options.length >= 2
            ? [...q.options]
            : ["Đúng", "Sai"];

        const indexed = options.map((opt, idx) => ({ opt, idx }));
        const processed =
          q.sortType === "shuffle" ? shuffleArray(indexed) : indexed;

        return {
          ...q,
          id: questionId,
          type,
          question: questionText,
          image: q.image ?? null,
          options: processed.map(i => i.opt),
          initialOrder: processed.map(i => i.idx),
          correct:
            Array.isArray(q.correct) && q.correct.length === options.length
              ? q.correct
              : options.map(() => ""),
          score: q.score ?? 1,
        };
      }

      // ================= FILL BLANK =================
      if (type === "fillblank") {
        const options = Array.isArray(q.options) ? q.options : [];

        return {
          ...q,
          id: questionId,
          type,
          question: questionText,
          image: q.image ?? null,
          option: q.option,
          options,
          shuffledOptions: shuffleArray([...options]),
          score: q.score ?? 1,
        };
      }

      return null;
    }).filter(Boolean);

    // ================= VALIDATE =================
    return loadedQuestions.filter(q => {
      if (q.type === "matching")
        return q.question.trim() && q.leftOptions.length && q.rightOptions.length;
      if (q.type === "sort")
        return q.question.trim() && q.options.length;
      if (["single", "multiple", "image"].includes(q.type))
        return q.question.trim() && q.options.length;
      if (q.type === "truefalse")
        return q.question.trim() && q.options.length >= 2;
      if (q.type === "fillblank")
        return q.question.trim() && q.options.length;
      return false;
    });
  }
  
  useEffect(() => {
    const fetchQuestions = async () => {
        try {
        setLoading(true);
        let prog = 0;

        let docId = null;
        const collectionName = "NGANHANG_DE";

        let hocKiFromConfig = "";
        let monHocFromConfig = "";
        let timeLimitMinutes = 0; // ⬅ để lưu thời gian

        // 🔹 Lấy config dựa vào trường
        
            // 🔹 Trường khác, lấy config từ CONFIG/config
            const configRef = doc(db, "CONFIG", "config");
            const configSnap = await getDoc(configRef);
            prog += 30;
            setProgress(prog);

            if (!configSnap.exists()) {
            setSnackbar({ open: true, message: "❌ Không tìm thấy config!", severity: "error" });
            setLoading(false);
            return;
            }

            const configData = configSnap.data();
            hocKiFromConfig = configData.hocKy || "";
            monHocFromConfig = configData.mon || "";
            timeLimitMinutes = configData.timeLimit ?? 0;   // ⬅ lấy timeLimit
            setTimeLimitMinutes(timeLimitMinutes);
            setChoXemDiem(configData.choXemDiem ?? false);
            setChoXemDapAn(configData.choXemDapAn ?? false);
            
        

        // 🔹 Lấy docId theo đề được chọn từ dropdown (áp dụng cho mọi trường)
            if (!selectedExam) {
                //setSnackbar({ open: true, message: "Vui lòng chọn đề!", severity: "warning" });
                setLoading(false);
            return;
            }

            docId = selectedExam;

        // 🔹 Set thời gian làm bài (giây)
        setTimeLeft(timeLimitMinutes * 60);

        // 🔹 Lấy dữ liệu đề
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        prog += 30;
        setProgress(prog);

        if (!docSnap.exists()) {
            setSnackbar({ open: true, message: "❌ Không tìm thấy đề trắc nghiệm!", severity: "error" });
            setLoading(false);
            return;
        }

        const data = docSnap.data();
        setQuizClass(data.class || "");

        // 🔹 Lấy học kỳ và môn học từ đề nếu có, ưu tiên config
        const hocKiFromDoc = data.semester || hocKiFromConfig;
        const monHocFromDoc = data.subject || monHocFromConfig;

        setHocKi(hocKiFromDoc);
        setMonHoc(monHocFromDoc);

        // 🔹 Lưu tạm để submit + xuất PDF
        window.currentHocKi = hocKiFromDoc;
        window.currentMonHoc = monHocFromDoc;

        // --- Xử lý câu hỏi ---
        // --- Xử lý câu hỏi ---
        const runtimeQuestions = buildRuntimeQuestions(data.questions);
        setQuestions(runtimeQuestions);
        
        setProgress(100);
        setStarted(true);

        //============================
        //Chấm Sort không tương tác
        /*setAnswers(prev => {
          const next = { ...prev };

          runtimeQuestions.forEach(q => {
            if (q.type === "sort" && Array.isArray(q.initialSortOrder)) {
              if (!Array.isArray(next[q.id])) {
                next[q.id] = [...q.initialSortOrder]; // ✅ clone mảng
              }
            }
          });

          return next;
        });*/

        } catch (err) {
        console.error("❌ Lỗi khi load câu hỏi:", err);
        setQuestions([]);
        } finally {
        setLoading(false);
        }
    };

    fetchQuestions();
  }, [selectedExam]);

  const fetchQuizList = async () => {
    try {
      const colRef = collection(db, "NGANHANG_DE");
      const snap = await getDocs(colRef);

      const exams = snap.docs.map(d => d.id);

      setExamList(exams);

      // Chỉ set selectedExam khi CHƯA có hoặc đề cũ không còn tồn tại
      setSelectedExam(prev =>
        prev && exams.includes(prev) ? prev : exams[0] || ""
      );

    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách đề:", err);
      setSnackbar({
        open: true,
        message: "❌ Không thể tải danh sách đề!",
        severity: "error",
      });
    }
  };

  useEffect(() => {
    fetchQuizList();
  }, []);

  const formatQuizTitle = (examName = "") => {
    if (!examName) return "";

    // Bỏ prefix quiz_
    let name = examName.startsWith("quiz_") ? examName.slice(5) : examName;
    const parts = name.split("_");

    // ===== LỚP =====
    const classPart = parts.find(p => p.toLowerCase().includes("lớp")) || "";
    const classNumber = classPart.match(/\d+/)?.[0] || "";

    // ===== MÔN =====
    let subjectPart = "";
    for (let i = parts.indexOf(classPart) + 1; i < parts.length; i++) {
      const p = parts[i];
      if (
        !p.toLowerCase().includes("cki") &&
        !p.toLowerCase().includes("cn") &&
        !/\d{2}-\d{2}/.test(p)
      ) {
        subjectPart = p;
        break;
      }
    }

    // ===== PHÂN BIỆT BT / KT =====
    const lastPart = parts[parts.length - 1];

    // 👉 BÀI TẬP TUẦN (kết thúc bằng số)
    if (/^\d+$/.test(lastPart)) {
      return `${subjectPart} ${classNumber} – Tuần ${lastPart}`.trim();
    }

    // 👉 KIỂM TRA ĐỊNH KỲ
    let extraPart = "";
    for (let i = parts.indexOf(classPart) + 1; i < parts.length; i++) {
      const p = parts[i];
      if (p.toLowerCase().includes("cki") || p.toLowerCase() === "cn") {
        extraPart = p.toUpperCase();
        break;
      }
    }

    const match = examName.match(/\(([^)]+)\)/);
    const examLetter = match ? match[1] : "";

    return `${subjectPart} ${classNumber}${extraPart ? ` - ${extraPart}` : ""}${examLetter ? ` (${examLetter})` : ""}`.trim();
  };
  
  const studentClass = studentInfo.class;
  const studentName = studentInfo.name;

  // Hàm chuyển chữ đầu thành hoa
  const capitalizeName = (name = "") =>
    name
      .toLowerCase()
      .split(" ")
      .filter(word => word.trim() !== "")
      .map(word => word[0].toUpperCase() + word.slice(1))
      .join(" ");

  // Sử dụng:
  const hoVaTen = capitalizeName(studentName);

  // Ví dụ:
  //console.log(capitalizeName("thái phạm")); // "Thái Phạm"


  const currentQuestion = questions[currentIndex] || null;
  const isEmptyQuestion = currentQuestion?.question === "";

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const handleCloseSnackbar = (event, reason) => { if (reason === "clickaway") return; setSnackbar(prev => ({ ...prev, open: false })); };

  const handleSubmit = async () => {
    if (!studentClass || !studentName) {
      setSnackbar({ open: true, message: "Thiếu thông tin học sinh", severity: "info" });
      return;
    }

    // Kiểm tra câu chưa trả lời
    const unanswered = questions.filter(q => {
      const userAnswer = answers[q.id];
      if (q.type === "single") {
        return userAnswer === undefined || userAnswer === null || userAnswer === "";
      }
      if (q.type === "multiple" || q.type === "image") {
        return !Array.isArray(userAnswer) || userAnswer.length === 0;
      }
      if (q.type === "truefalse") {
        return !Array.isArray(userAnswer) || userAnswer.length !== q.options.length;
      }
      return false;
    });

    if (unanswered.length > 0) {
      setUnansweredQuestions(unanswered.map(q => questions.findIndex(item => item.id === q.id) + 1));
      setOpenAlertDialog(true);
      return;
    }

    try {
      setSaving(true);

      // Tính điểm thô
      let total = 0;
      questions.forEach(q => {
        const rawAnswer = answers[q.id];

        if (q.type === "single") {
          const ua = Number(rawAnswer);
          if (Array.isArray(q.correct) ? q.correct.includes(ua) : q.correct === ua) total += q.score ?? 1;

        } else if (q.type === "multiple" || q.type === "image") {
          const userSet = new Set(
            (Array.isArray(rawAnswer) ? rawAnswer : []).map(Number)
          );

          const correctSet = new Set(
            (Array.isArray(q.correct) ? q.correct : [q.correct]).map(Number)
          );

          if (
            userSet.size === correctSet.size &&
            [...correctSet].every(x => userSet.has(x))
          ) {
            total += q.score ?? 1;
          }
        }
        else if (q.type === "sort") {
          // 👉 nếu không kéo, dùng thứ tự ban đầu
          const order =
            Array.isArray(rawAnswer) && rawAnswer.length > 0
              ? rawAnswer
              : q.initialOrder ?? q.options.map((_, i) => i);

          const userTexts = order.map(idx => q.options[idx]);
          const correctTexts = Array.isArray(q.correctTexts) ? q.correctTexts : [];

          const isCorrect =
            userTexts.length === correctTexts.length &&
            userTexts.every((t, i) => t === correctTexts[i]);

          if (isCorrect) total += q.score ?? 1;

        } else if (q.type === "matching") {
          const userArray =
            Array.isArray(rawAnswer) && rawAnswer.length > 0
              ? rawAnswer
              : q.initialOrder ?? q.correct?.map((_, i) => i);

          const correctArray = Array.isArray(q.correct) ? q.correct : [];

          const isCorrect =
            userArray.length === correctArray.length &&
            userArray.every((val, i) => val === correctArray[i]);

          if (isCorrect) total += q.score ?? 1;
        } else if (q.type === "truefalse") {
          const userArray = Array.isArray(rawAnswer) ? rawAnswer : [];
          const correctArray = Array.isArray(q.correct) ? q.correct : [];

          if (userArray.length === correctArray.length) {
            const isAllCorrect = userArray.every((val, i) => {
              const originalIdx = Array.isArray(q.initialOrder) ? q.initialOrder[i] : i;
              return val === correctArray[originalIdx];
            });

            if (isAllCorrect) {
              total += q.score ?? 1;
            }
          }
        } else if (q.type === "fillblank") {
          const userAnswers = Array.isArray(rawAnswer) ? rawAnswer : [];
          const correctAnswers = Array.isArray(q.options) ? q.options : [];

          if (userAnswers.length === correctAnswers.length) {
            const isAllCorrect = correctAnswers.every((correct, i) => {
              if (!userAnswers[i] || !correct || typeof correct.text !== "string")
                return false;

              return (
                String(userAnswers[i]).trim().toLowerCase() ===
                correct.text.trim().toLowerCase()
              );
            });

            if (isAllCorrect) total += q.score ?? 1;
          }
        }
      });

      setScore(total);
      setSubmitted(true);
      
      // ⏱ Tính thời gian làm bài
      const durationSec = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      const durationStr = formatTime(durationSec);

      // Tạo biến chứa tiêu đề hiển thị
      const hocKi = window.currentHocKi || "GKI";
      const monHoc = window.currentMonHoc || "Không rõ";

      // Tạo tiêu đề PDF
      const quizTitle = `KTĐK${hocKi ? ` ${hocKi.toUpperCase()}` : ""}${monHoc ? ` - ${monHoc.toUpperCase()}` : ""}`;

      // Gọi export PDF
      //exportQuizPDF(studentInfo, quizClass, questions, answers, total, durationStr, quizTitle);
      // ⬅️ Chỉ xuất file nếu được bật
      if (xuatFileBaiLam === true) {
        exportQuizPDF(studentInfo, quizClass, questions, answers, total, durationStr, quizTitle);
      }

      // Ngày theo định dạng Việt Nam
      const ngayKiemTra = new Date().toLocaleDateString("vi-VN");

      const normalizeName = (name) =>
        name.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d").replace(/Đ/g, "D")
            .toLowerCase().trim()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "");

      setStudentResult({
        hoVaTen: capitalizeName(studentName),
        lop: studentClass,
        diem: total,
      });
      setOpenResultDialog(true);

    } catch (err) {
      console.error("❌ Lỗi khi lưu điểm:", err);
    } finally {
      setSaving(false);
    }
  };

  const autoSubmit = async () => {
    if (!studentClass || !studentName) {
      setSnackbar({ open: true, message: "Thiếu thông tin học sinh", severity: "info" });
      return;
    }

    try {
      setSaving(true);

      // Tính điểm thô
      let total = 0;
      questions.forEach(q => {
        const rawAnswer = answers[q.id];

        if (q.type === "single") {
          const ua = Number(rawAnswer);
          if (Array.isArray(q.correct) ? q.correct.includes(ua) : q.correct === ua) total += q.score ?? 1;

        } else if (q.type === "multiple" || q.type === "image") {
          const userSet = new Set(
            (Array.isArray(rawAnswer) ? rawAnswer : []).map(Number)
          );

          const correctSet = new Set(
            (Array.isArray(q.correct) ? q.correct : [q.correct]).map(Number)
          );

          if (
            userSet.size === correctSet.size &&
            [...correctSet].every(x => userSet.has(x))
          ) {
            total += q.score ?? 1;
          }
        }
        else if (q.type === "sort") {
          // 👉 nếu không kéo, dùng thứ tự ban đầu
          const order =
            Array.isArray(rawAnswer) && rawAnswer.length > 0
              ? rawAnswer
              : q.initialOrder ?? q.options.map((_, i) => i);

          const userTexts = order.map(idx => q.options[idx]);
          const correctTexts = Array.isArray(q.correctTexts) ? q.correctTexts : [];

          const isCorrect =
            userTexts.length === correctTexts.length &&
            userTexts.every((t, i) => t === correctTexts[i]);

          if (isCorrect) total += q.score ?? 1;

        } else if (q.type === "matching") {
          const userArray =
            Array.isArray(rawAnswer) && rawAnswer.length > 0
              ? rawAnswer
              : q.initialOrder ?? q.correct?.map((_, i) => i);

          const correctArray = Array.isArray(q.correct) ? q.correct : [];

          const isCorrect =
            userArray.length === correctArray.length &&
            userArray.every((val, i) => val === correctArray[i]);

          if (isCorrect) total += q.score ?? 1;
        } else if (q.type === "truefalse") {
          const userArray = Array.isArray(rawAnswer) ? rawAnswer : [];
          const correctArray = Array.isArray(q.correct) ? q.correct : [];

          if (userArray.length === correctArray.length) {
            const isAllCorrect = userArray.every((val, i) => {
              const originalIdx = Array.isArray(q.initialOrder) ? q.initialOrder[i] : i;
              return val === correctArray[originalIdx];
            });

            if (isAllCorrect) {
              total += q.score ?? 1;
            }
          }
        } else if (q.type === "fillblank") {
          const userAnswers = Array.isArray(rawAnswer) ? rawAnswer : [];
          const correctAnswers = Array.isArray(q.options) ? q.options : [];

          if (userAnswers.length === correctAnswers.length) {
            const isAllCorrect = correctAnswers.every((correct, i) => {
              if (!userAnswers[i] || !correct || typeof correct.text !== "string")
                return false;

              return (
                String(userAnswers[i]).trim().toLowerCase() ===
                correct.text.trim().toLowerCase()
              );
            });

            if (isAllCorrect) total += q.score ?? 1;
          }
        }
      });

      setScore(total);
      setSubmitted(true);
      
      // ⏱ Tính thời gian làm bài
      const durationSec = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      const durationStr = formatTime(durationSec);

      // Tạo biến chứa tiêu đề hiển thị
      const hocKi = window.currentHocKi || "GKI";
      const monHoc = window.currentMonHoc || "Không rõ";

      // Tạo tiêu đề PDF
      const quizTitle = `KTĐK${hocKi ? ` ${hocKi.toUpperCase()}` : ""}${monHoc ? ` - ${monHoc.toUpperCase()}` : ""}`;

      // Gọi export PDF
      //exportQuizPDF(studentInfo, quizClass, questions, answers, total, durationStr, quizTitle);
      // ⬅️ Chỉ xuất file nếu được bật
      if (xuatFileBaiLam === true) {
        exportQuizPDF(studentInfo, quizClass, questions, answers, total, durationStr, quizTitle);
      }

      // Ngày theo định dạng Việt Nam
      const ngayKiemTra = new Date().toLocaleDateString("vi-VN");

      const normalizeName = (name) =>
        name.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d").replace(/Đ/g, "D")
            .toLowerCase().trim()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "");

      setStudentResult({
        hoVaTen: capitalizeName(studentName),
        lop: studentClass,
        diem: total,
      });
      setOpenResultDialog(true);

    } catch (err) {
      console.error("❌ Lỗi khi lưu điểm:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => currentIndex < questions.length - 1 && setCurrentIndex(currentIndex + 1);
  const handlePrev = () => currentIndex > 0 && setCurrentIndex(currentIndex - 1);

  const convertPercentToScore = (percent) => {
    if (percent === undefined || percent === null) return "?";
    const raw = percent / 10;
    const decimal = raw % 1;
    if (decimal < 0.25) return Math.floor(raw);
    if (decimal < 0.75) return Math.floor(raw) + 0.5;
    return Math.ceil(raw);
  };

  useEffect(() => {
    if (config.timeLimit) setTimeLeft(config.timeLimit * 60);
  }, [config.timeLimit]);

  function reorder(list, startIndex, endIndex) {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  }

  // Giả sử bạn đang dùng useState để lưu đáp án

// Single: luôn lưu là số index
const handleSingleSelect = (questionId, optionIndex) => {
  // Đảm bảo là number (tránh trường hợp optionIndex là string)
  const idx = Number(optionIndex);
  setAnswers(prev => ({ ...prev, [questionId]: idx }));
};

// Multiple: lưu là mảng số
const handleMultipleSelect = (questionId, optionIndex, checked) => {
  const idx = Number(optionIndex);
  setAnswers(prev => {
    const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
    const next = checked
      ? Array.from(new Set([...current, idx]))
      : current.filter(x => x !== idx);
    return { ...prev, [questionId]: next };
  });
};

const handleDragEnd = (result) => {
  const { source, destination, draggableId } = result;
  if (!destination) return;

  setQuestions((prev) => {
    const updated = [...prev];
    const q = updated[currentIndex];

    let filled = q.filled ? [...q.filled] : [];

    // Kéo từ words vào blank
    if (destination.droppableId.startsWith("blank-") && source.droppableId === "words") {
      const blankIndex = Number(destination.droppableId.split("-")[1]);
      const word = draggableId.replace("word-", "");
      while (filled.length <= blankIndex) filled.push("");
      filled[blankIndex] = word;
    }

    // Kéo từ blank ra words
    if (destination.droppableId === "words" && source.droppableId.startsWith("blank-")) {
      const blankIndex = Number(source.droppableId.split("-")[1]);
      filled[blankIndex] = ""; // ô blank trở về rỗng
    }

    updated[currentIndex] = { ...q, filled };

    // ✅ Cập nhật luôn answers để chấm điểm
    setAnswers((prevAns) => ({
      ...prevAns,
      [q.id]: filled
    }));

    return updated;
  });
};

const normalizeValue = (val) => {
  if (typeof val === "object") {
    if (val.image) return String(val.image).trim();
    if (val.text) return val.text.trim();
  }
  if (typeof val === "string") {
    return val.trim();
  }
  return String(val).trim();
};

const questionCircleStyle = {
  width: { xs: 34, sm: 38 },
  height: { xs: 34, sm: 38 },
  borderRadius: "50%",
  minWidth: 0,
  fontSize: "0.85rem",
  fontWeight: 600,
  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  transition: "all 0.2s ease",
};

const handleExit = () => {
  if (submitted) {
    navigate(-1);
  } else {
    setOpenExitConfirm(true);
  }
};

const sidebarConfig = React.useMemo(() => {
  // < 1024px → ẨN sidebar
  if (isBelow1024) return null;

  // ≥ 1024px → sidebar 5 ô số
  return {
    width: 260,
    cols: 5,
  };
}, [isBelow1024]);

const hasSidebar = sidebarConfig && questions.length > 0;
const isSidebarVisible = hasSidebar && showSidebar;

return (
  <Box
    id="quiz-container"
    sx={{
      minHeight: "100vh",
      background: "linear-gradient(to bottom, #e3f2fd, #bbdefb)",
      pt: { xs: 2, sm: 3 },
      px: { xs: 1, sm: 2 },
    }}
  >
    {/* ================= WRAPPER ================= */}
    <Box
      sx={{
        display: "flex",
        gap: 3,
        width: "100%",
        maxWidth: isSidebarVisible ? 1280 : 1000,
        mx: "auto",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "stretch",
      }}
    >
      {/* ================= LEFT CONTENT ================= */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          maxWidth: 1000,
        }}
      >
        <Paper
          sx={{
            p: { xs: 2, sm: 4 },
            borderRadius: 3,
            minHeight: { xs: "auto", sm: 650 },
            display: "flex",
            flexDirection: "column",
            gap: 2,
            position: "relative",
            boxSizing: "border-box",
            backgroundColor: "#fff",
            pb: 3,
          }}
        >
          {/* 🔘 TOGGLE SIDEBAR */}
          {hasSidebar && (
            <Tooltip
              title={
                showSidebar
                  ? "Thu gọn bảng câu hỏi"
                  : "Mở bảng câu hỏi"
              }
            >
              <IconButton
                onClick={() => setShowSidebar((prev) => !prev)}
                sx={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  bgcolor: "#e3f2fd",
                  border: "1px solid #90caf9",
                  "&:hover": { bgcolor: "#bbdefb" },
                  zIndex: 10,
                }}
              >
                {showSidebar ? (
                  <ChevronLeftIcon />
                ) : (
                  <ChevronRightIcon />
                )}
              </IconButton>
            </Tooltip>
          )}
          
          <Box
            sx={{
              p: 1.5,
              border: "2px solid #1976d2",
              borderRadius: 2,
              color: "#1976d2",
              width: "fit-content",
              mb: 2,
              position: { xs: "relative", sm: "absolute" },
              top: { sm: 16 },
              left: { sm: 16 },
              alignSelf: { xs: "flex-start", sm: "auto" },
              bgcolor: { xs: "#fff", sm: "transparent" },
              zIndex: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Tên: {capitalizeName(studentInfo.name)}
            </Typography>
            <Typography variant="subtitle1" fontWeight="bold">
              Lớp: {studentInfo.className} 
            </Typography>
          </Box>

          {/* Tiêu đề */}
          <Box
            sx={{
              width: "60%",
              maxWidth: 350,
              mt: 1,
              mb: 2,
              ml: "auto",
              mr: "auto",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Tiêu đề */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                fontSize: "20px",
                mb: 2,
                mt: -1,
                color: "#1976d2", // màu xanh
              }}
            >
              TEST ĐỀ KIỂM TRA
            </Typography>

            {/* Ô chọn đề */}
            <Stack direction="row" spacing={2} alignItems="center">
              {/* ================= CHỌN ĐỀ ================= */}
              <FormControl fullWidth size="small" sx={{ width: 220 }}>
                <InputLabel id="exam-select-label">Chọn đề</InputLabel>

                <Select
                  labelId="exam-select-label"
                  value={selectedExam}
                  label="Chọn đề"
                  onChange={(e) => {
                    setSelectedExam(e.target.value); // 👈 đổi đề → useEffect tự chạy
                  }}
                >
                  {examList.map((exam) => (
                    <MenuItem key={exam} value={exam}>
                      {formatQuizTitle(exam)}
                    </MenuItem>
                  ))}
                </Select>

              </FormControl>
            </Stack>
          </Box>

          {/* Đồng hồ với vị trí cố định */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mt: 0.5,
              mb: 0,
              minHeight: 40, // giữ khoảng trống luôn
              width: "100%",
            }}
          >
            {/* Nội dung đồng hồ chỉ hiển thị khi started && !loading */}
            {started && !loading && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 3,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor: "#fff", // tùy chỉnh nếu muốn nền
                }}
              >
                <AccessTimeIcon sx={{ color: "#d32f2f" }} />
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "#d32f2f" }}>
                  {formatTime(timeLeft)}
                </Typography>
              </Box>
            )}

            {/* Đường gạch ngang màu xám nhạt luôn hiển thị */}
            <Box
              sx={{
                width: "100%",
                height: 1,
                bgcolor: "#e0e0e0", // màu xám nhạt
                mt: 0,
              }}
            />
          </Box>


          {/* Loading */}
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 1, width: "100%" }}>
              <Box sx={{ width: { xs: "60%", sm: "30%" } }}>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 3, borderRadius: 3 }} />
                <Typography variant="body2" sx={{ mt: 0.5, textAlign: "center" }}>
                  🔄 Đang tải... {progress}%
                </Typography>
              </Box>
            </Box>
          )}

          {!loading && currentQuestion && (
            <Box key={currentQuestion.id || currentIndex}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                <strong>Câu {currentIndex + 1}:</strong>{" "}
                <span
                  dangerouslySetInnerHTML={{
                    __html: (currentQuestion.question || "").replace(/^<p>|<\/p>$/g, "")
                  }}
                />
              </Typography>

              {currentQuestion.image && (
                <Box sx={{ width: "100%", textAlign: "center", mb: 2 }}>
                  <img
                    src={currentQuestion.image}
                    alt="question"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 150,
                      objectFit: "contain",
                      borderRadius: 8
                    }}
                  />
                </Box>
              )}

              {/* SORT */}
              {currentQuestion.type === "sort" && (
                <Box sx={{ mt: 0 }}>
                  {currentQuestion.questionImage && (
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      <Box
                        sx={{
                          maxHeight: 150,          // 🔥 chỉnh khung nhỏ ở đây
                          maxWidth: "100%",
                          overflow: "hidden",
                          borderRadius: 2,
                          border: "1px solid #ddd", // 🔥 khung hiện rõ
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          bgcolor: "#fafafa",
                        }}
                      >
                        <img
                          src={currentQuestion.questionImage}
                          alt="Hình minh họa"
                          style={{
                            maxHeight: 150,        // 🔥 trùng với Box
                            maxWidth: "100%",
                            objectFit: "contain",
                            cursor: "zoom-in",
                          }}
                          onClick={() => setZoomImage(currentQuestion.questionImage)}
                        />
                      </Box>
                    </Box>
                  )}

                  <DragDropContext
                    onDragEnd={(result) => {
                      if (!result.destination || submitted || !started) return;

                      const currentOrder =
                        answers[currentQuestion.id] ??
                        currentQuestion.options.map((_, idx) => idx);

                      const newOrder = reorder(
                        currentOrder,
                        result.source.index,
                        result.destination.index
                      );

                      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: newOrder }));
                    }}
                  >
                    <Droppable droppableId="sort-options">
                      {(provided) => {
                        const orderIdx =
                          answers[currentQuestion.id] ??
                          currentQuestion.options.map((_, idx) => idx);

                        return (
                          <Stack {...provided.droppableProps} ref={provided.innerRef} spacing={2}>
                            {orderIdx.map((optIdx, pos) => {
                              const optionData = currentQuestion.options[optIdx];
                              const optionText =
                                typeof optionData === "string" ? optionData : optionData.text ?? "";
                              const optionImage =
                                typeof optionData === "object" ? optionData.image ?? null : null;

                              // ✅ So sánh với correctTexts thay vì correct index
                              const correctData = currentQuestion.correctTexts[pos];
                              const isCorrectPos =
                                submitted &&
                                choXemDapAn &&
                                normalizeValue(optionData) === normalizeValue(correctData);

                              return (
                                <Draggable
                                  key={optIdx}
                                  draggableId={String(optIdx)}
                                  index={pos}
                                  isDragDisabled={submitted || !started}
                                >
                                  {(provided, snapshot) => (
                                    <Box
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      sx={{
                                        borderRadius: 1,
                                        bgcolor:
                                          submitted && choXemDapAn
                                            ? isCorrectPos
                                              ? "#c8e6c9" // xanh lá nhạt = đúng
                                              : "#ffcdd2" // đỏ nhạt = sai
                                            : "transparent",
                                        border: "1px solid #90caf9",
                                        cursor: submitted || !started ? "default" : "grab",
                                        boxShadow: "none",
                                        transition: "background-color 0.2s ease, border-color 0.2s ease",
                                        minHeight: 40,
                                        py: 0.5,
                                        px: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        "&:hover": {
                                          borderColor: "#1976d2",
                                          bgcolor: "#f5f5f5",
                                        },
                                      }}
                                    >
                                      {optionImage && (
                                        <Box
                                          component="img"
                                          src={optionImage}
                                          alt={`option-${optIdx}`}
                                          sx={{
                                            maxHeight: 40,
                                            width: "auto",
                                            objectFit: "contain",
                                            borderRadius: 2,
                                            flexShrink: 0,
                                          }}
                                        />
                                      )}

                                      <Typography
                                        variant="body1"
                                        fontWeight="400"
                                        sx={{
                                          userSelect: "none",
                                          fontSize: "1.1rem",
                                          lineHeight: 1.5,
                                          flex: 1,
                                          whiteSpace: "pre-wrap",
                                          "& p": { margin: 0 },
                                        }}
                                        component="div"
                                        dangerouslySetInnerHTML={{ __html: optionText }}
                                      />
                                    </Box>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </Stack>
                        );
                      }}
                    </Droppable>
                  </DragDropContext>
                </Box>
              )}

              {/* MATCH */}
              {currentQuestion.type === "matching" && (
                <Box sx={{ width: "100%" }}>
                  {/* ================= HÌNH MINH HỌA DƯỚI CÂU HỎI ================= */}
                  {currentQuestion.questionImage && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          maxHeight: 150, // 🔥 đổi 100 nếu bạn muốn
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={currentQuestion.questionImage}
                          alt="Hình minh họa"
                          style={{
                            maxHeight: 150,
                            maxWidth: "100%",
                            height: "auto",
                            objectFit: "contain",
                            borderRadius: 8,
                            display: "block",
                            cursor: "zoom-in",
                          }}
                          onClick={() => setZoomImage(currentQuestion.questionImage)}
                        />

                      </Box>
                    </Box>
                  )}

                  {/* ================= MATCHING ================= */}
                  <DragDropContext
                    onDragEnd={(result) => {
                      if (!result.destination || submitted || !started) return;

                      const currentOrder =
                        answers[currentQuestion.id] ??
                        currentQuestion.pairs.map((_, idx) => idx);

                      const newOrder = reorder(
                        currentOrder,
                        result.source.index,
                        result.destination.index
                      );

                      setAnswers((prev) => ({
                        ...prev,
                        [currentQuestion.id]: newOrder,
                      }));
                    }}
                  >
                    <Stack spacing={1.5} sx={{ width: "100%", px: 1 }}>
                      {currentQuestion.pairs.map((pair, i) => {
                        const optionText = pair.left || "";
                        const optionImage =
                          pair.leftImage?.url || pair.leftIconImage?.url || null;

                        const userOrder =
                          answers[currentQuestion.id] ??
                          currentQuestion.rightOptions.map((_, idx) => idx);

                        const rightIdx = userOrder[i];
                        const rightVal = currentQuestion.rightOptions[rightIdx];
                        const rightText = typeof rightVal === "string" ? rightVal : "";
                        const rightImage =
                          typeof rightVal === "object" ? rightVal?.url : null;

                        const isCorrect =
                          submitted && userOrder[i] === currentQuestion.correct[i];

                        return (
                          <Stack
                            key={i}
                            direction="row"
                            spacing={2}
                            alignItems="stretch"
                            sx={{ minHeight: 50 }}
                          >
                            {/* ================= LEFT ================= */}
                            <Paper
                              sx={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                px: 1,
                                py: 0.5,
                                border: "1px solid #64b5f6",
                                borderRadius: 1,
                                boxShadow: "none",
                              }}
                            >
                              {optionImage && (
                                <Box
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    maxHeight: 40,      // khung tối đa 40
                                    mr: 1,
                                    flexShrink: 0,
                                    overflow: "hidden",
                                  }}
                                >
                                  <img
                                    src={optionImage}
                                    alt={`left-${i}`}
                                    style={{
                                      maxHeight: 40,    // ⭐ QUAN TRỌNG: trùng với Box
                                      width: "auto",
                                      height: "auto",
                                      objectFit: "contain",
                                      borderRadius: 2,
                                      display: "block",
                                    }}
                                  />
                                </Box>
                              )}

                              {optionText && (
                                <Typography
                                  component="div"
                                  sx={{
                                    fontSize: "1.1rem",
                                    flex: 1,
                                    wordBreak: "break-word",
                                    whiteSpace: "pre-wrap",
                                    lineHeight: 1.5,
                                    "& p": { margin: 0 },
                                  }}
                                  dangerouslySetInnerHTML={{ __html: optionText }}
                                />
                              )}
                            </Paper>

                            {/* ================= RIGHT ================= */}
                            <Droppable droppableId={`right-${i}`} direction="vertical">
                              {(provided) => (
                                <Stack
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  sx={{ flex: 1 }}
                                >
                                  <Draggable
                                    key={rightIdx}
                                    draggableId={String(rightIdx)}
                                    index={i}
                                    isDragDisabled={submitted || !started}
                                  >
                                    {(provided) => (
                                      <Paper
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        sx={{
                                          flex: 1,
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1.5,
                                          px: 1,
                                          py: 0.5,
                                          border: "1px solid #90caf9",
                                          borderRadius: 1,
                                          boxShadow: "none",
                                          cursor:
                                            submitted || !started ? "default" : "grab",
                                          bgcolor:
                                            submitted && choXemDapAn
                                              ? isCorrect
                                                ? "#c8e6c9"
                                                : "#ffcdd2"
                                              : "transparent",
                                          transition:
                                            "background-color 0.2s ease, border-color 0.2s ease",
                                          "&:hover": {
                                            borderColor: "#1976d2",
                                            bgcolor: "#f5f5f5",
                                          },
                                        }}
                                      >
                                        {rightImage && (
                                          <Box
                                            sx={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              maxHeight: 40,
                                              mr: 1,
                                              flexShrink: 0,
                                            }}
                                          >
                                            <img
                                              src={rightImage}
                                              alt={`right-${rightIdx}`}
                                              style={{
                                                maxHeight: 40,
                                                width: "auto",
                                                height: "auto",
                                                objectFit: "contain",
                                                borderRadius: 2,
                                                display: "block",
                                              }}
                                            />
                                          </Box>
                                        )}

                                        {rightText && (
                                          <Typography
                                            component="div"
                                            sx={{
                                              fontSize: "1.1rem",
                                              flex: 1,
                                              wordBreak: "break-word",
                                              whiteSpace: "pre-wrap",
                                              lineHeight: 1.5,
                                              "& p": { margin: 0 },
                                            }}
                                            dangerouslySetInnerHTML={{
                                              __html: rightText,
                                            }}
                                          />
                                        )}
                                      </Paper>
                                    )}
                                  </Draggable>
                                  {provided.placeholder}
                                </Stack>
                              )}
                            </Droppable>
                          </Stack>
                        );
                      })}
                    </Stack>
                  </DragDropContext>
                </Box>
              )}

              {/* 1. Single */}
              {currentQuestion.type === "single" && (
                <Stack spacing={2}>
                  {/* Hình minh họa câu hỏi nếu có */}
                  {currentQuestion.questionImage && (
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      {/* 🔲 KHUNG ẢNH */}
                      <Box
                        sx={{
                          maxHeight: 150,          // 🔥 chỉnh nhỏ khung tại đây
                          maxWidth: "100%",
                          overflow: "hidden",
                          borderRadius: 1,
                          border: "1px solid #ddd",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          bgcolor: "#fafafa",
                        }}
                      >
                        <img
                          src={currentQuestion.questionImage}
                          alt="Hình minh họa"
                          style={{
                            maxHeight: 150,        // 🔥 trùng với khung
                            maxWidth: "100%",
                            height: "auto",
                            objectFit: "contain",
                            borderRadius: 4,
                            cursor: "zoom-in",
                          }}
                          onClick={() => setZoomImage(currentQuestion.questionImage)}
                        />
                      </Box>
                    </Box>
                  )}
                  {currentQuestion.displayOrder.map((optIdx) => {
                    const selected = answers[currentQuestion.id] === optIdx;

                    const correctArray = Array.isArray(currentQuestion.correct)
                      ? currentQuestion.correct
                      : [currentQuestion.correct];

                    const isCorrect = submitted && correctArray.includes(optIdx);
                    const isWrong = submitted && selected && !correctArray.includes(optIdx);

                    const handleSelect = () => {
                      if (submitted || !started) return;
                      handleSingleSelect(currentQuestion.id, optIdx);
                    };

                    // Lấy dữ liệu option
                    const optionData = currentQuestion.options[optIdx];
                    const optionText =
                      typeof optionData === "object" && optionData.text
                        ? optionData.text
                        : typeof optionData === "string"
                        ? optionData
                        : "";
                    const optionImage =
                      typeof optionData === "object" && optionData.image
                        ? optionData.image
                        : null;

                    return (
                      <Paper
                        key={optIdx}
                        onClick={handleSelect}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          borderRadius: 1,
                          cursor: submitted || !started ? "default" : "pointer",
                          bgcolor:
                            submitted && choXemDapAn
                              ? isCorrect
                                ? "#c8e6c9"
                                : isWrong
                                ? "#ffcdd2"
                                : "transparent"   // 👈 nền mặc định trong suốt
                              : "transparent",
                          border: "1px solid #90caf9",
                          minHeight: 40,
                          py: 0.5,
                          px: 1,
                          boxShadow: "none",          // 👈 bỏ đổ bóng
                          transition: "background-color 0.2s ease, border-color 0.2s ease",
                          "&:hover": {
                            borderColor: "#1976d2",
                            bgcolor: "#f5f5f5",       // 👈 highlight khi hover
                          },
                        }}
                      >
                        {/* Radio button */}
                        <Radio checked={selected} onChange={handleSelect} sx={{ mr: 1 }} />

                        {/* Hình option nếu có */}
                        {optionImage && (
                          <Box
                            component="img"
                            src={optionImage}
                            alt={`option-${optIdx}`}
                            sx={{
                              maxHeight: 40,
                              maxWidth: "auto",
                              objectFit: "contain",
                              borderRadius: 2,
                              flexShrink: 0,
                            }}
                          />
                        )}

                        {/* Text option */}
                        <Typography
                          variant="body1"
                          sx={{
                            userSelect: "none",
                            fontSize: "1.1rem",
                            lineHeight: 1.5,
                            flex: 1,
                            whiteSpace: "pre-wrap",
                            "& p": { margin: 0 },
                          }}
                          component="div"
                          dangerouslySetInnerHTML={{ __html: optionText }}
                        />
                      </Paper>
                    );
                  })}
                </Stack>
              )}

              {/* 2. Multiple */}
              {currentQuestion.type === "multiple" && (
                <Stack spacing={2}>
                  {/* Hình minh họa câu hỏi nếu có */}
                  {currentQuestion.questionImage && (
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      {/* 🔲 KHUNG ẢNH */}
                      <Box
                        sx={{
                          maxHeight: 150,        // 🔥 khung nhỏ lại
                          maxWidth: "100%",
                          overflow: "hidden",
                          borderRadius: 1,
                          border: "1px solid #ddd",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "#fafafa",
                        }}
                      >
                        <img
                          src={currentQuestion.questionImage}
                          alt="Hình minh họa"
                          style={{
                            maxHeight: 150,      // 🔥 ảnh co theo khung
                            maxWidth: "100%",
                            height: "auto",
                            objectFit: "contain",
                            borderRadius: 8,
                            cursor: "zoom-in",
                          }}
                          onClick={() => setZoomImage(currentQuestion.questionImage)}
                        />
                      </Box>
                    </Box>
                  )}

                  {currentQuestion.displayOrder.map((optIdx) => {
                    const optionData = currentQuestion.options[optIdx];
                    const optionText = optionData.text ?? "";
                    const optionImage = optionData.image ?? null;

                    const userAns = answers[currentQuestion.id] || [];
                    const checked = userAns.includes(optIdx);

                    const isCorrect =
                      submitted && currentQuestion.correct.includes(optIdx);
                    const isWrong =
                      submitted && checked && !currentQuestion.correct.includes(optIdx);

                    const handleSelect = () => {
                      if (submitted || !started) return;
                      handleMultipleSelect(currentQuestion.id, optIdx, !checked);
                    };

                    return (
                      <Paper
                        key={optIdx}
                        onClick={handleSelect}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          borderRadius: 1,
                          cursor: submitted || !started ? "default" : "pointer",
                          bgcolor:
                            submitted && choXemDapAn
                              ? isCorrect
                                ? "#c8e6c9"
                                : isWrong
                                ? "#ffcdd2"
                                : "transparent"   // 👈 nền mặc định trong suốt
                              : "transparent",
                          border: "1px solid #90caf9",
                          minHeight: 40,
                          py: 0.5,
                          px: 1,
                          gap: 1,
                          boxShadow: "none",          // 👈 bỏ đổ bóng
                          transition: "background-color 0.2s ease, border-color 0.2s ease",
                          "&:hover": {
                            borderColor: "#1976d2",
                            bgcolor: "#f5f5f5",       // 👈 highlight khi hover
                          },
                        }}
                      >
                        {/* Checkbox */}
                        <Checkbox
                          checked={checked}
                          onChange={handleSelect}
                          sx={{ mr: 1 }}
                        />

                        {/* Hình option nếu có */}
                        {optionImage && (
                          <Box
                            component="img"
                            src={optionImage}
                            alt={`option-${optIdx}`}
                            sx={{
                              maxHeight: 40,
                              maxWidth: 40,
                              objectFit: "contain",
                              borderRadius: 2,
                              flexShrink: 0,
                            }}
                          />
                        )}

                        {/* Text option */}
                        <Typography
                          variant="body1"
                          sx={{
                            userSelect: "none",
                            fontSize: "1.1rem",
                            lineHeight: 1.5,
                            flex: 1,
                            whiteSpace: "pre-wrap",
                            "& p": { margin: 0 },
                          }}
                          component="div"
                          dangerouslySetInnerHTML={{ __html: optionText }}
                        />
                      </Paper>
                    );
                  })}
                </Stack>
              )}

              {/* TRUE / FALSE */}
              {currentQuestion.type === "truefalse" && (
                <>
                  {/* 🖼️ ẢNH MINH HỌA CÂU HỎI */}
                  {currentQuestion.questionImage && (
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
                      <Box
                        sx={{
                          maxHeight: 100,           // 🔥 GIẢM NHỎ HƠN
                          maxWidth: "85%",         // 🔥 gọn thêm
                          overflow: "hidden",
                          borderRadius: 1,
                          border: "1px solid #ddd",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          bgcolor: "#fafafa",
                        }}
                      >
                        <img
                          src={currentQuestion.questionImage}
                          alt="Hình minh họa"
                          style={{
                            maxHeight: "100px",     // 🔥 khớp khung
                            maxWidth: "100%",
                            width: "auto",
                            height: "auto",
                            objectFit: "contain",
                            cursor: "zoom-in",
                          }}
                          onClick={() => setZoomImage(currentQuestion.questionImage)}
                        />
                      </Box>
                    </Box>
                  )}


                  {/* ✅ OPTIONS – GIỮ NGUYÊN CHIỀU CAO GỐC */}
                  {currentQuestion.options.map((opt, i) => {
                    const userAns = answers[currentQuestion.id] || [];
                    const selected = userAns[i] ?? "";

                    const originalIdx = Array.isArray(currentQuestion.initialOrder)
                      ? currentQuestion.initialOrder[i]
                      : i;

                    const correctArray = Array.isArray(currentQuestion.correct)
                      ? currentQuestion.correct
                      : [];

                    const correctVal = correctArray[originalIdx] ?? "";

                    const showResult = submitted && choXemDapAn;
                    const isCorrect = showResult && selected === correctVal;
                    const isWrong = showResult && selected !== "" && selected !== correctVal;

                    const optionText =
                      typeof opt === "string" ? opt : opt?.text ?? "";

                    const optionImage =
                      typeof opt === "object" ? opt?.image ?? null : null;

                    return (
                      <Paper
                        key={i}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          borderRadius: 1,
                          minHeight: 40,
                          py: 0.5,
                          px: 1,
                          bgcolor: isCorrect
                            ? "#c8e6c9"
                            : isWrong
                            ? "#ffcdd2"
                            : "transparent",
                          border: "1px solid #90caf9",
                          boxShadow: "none",
                        }}
                      >
                        {optionImage && (
                          <Box
                            component="img"
                            src={optionImage}
                            alt={`truefalse-${i}`}
                            sx={{
                              maxHeight: 40,
                              objectFit: "contain",
                              borderRadius: 2,
                              flexShrink: 0,
                            }}
                          />
                        )}

                        <Typography
                          component="div"
                          sx={{
                            userSelect: "none",
                            fontSize: "1.1rem",
                            lineHeight: 1.5,
                            flex: 1,
                            whiteSpace: "pre-wrap",
                            "& p": { margin: 0 },
                          }}
                          dangerouslySetInnerHTML={{ __html: optionText }}
                        />

                        <FormControl size="small" sx={{ width: 90 }}>
                          <Select
                            value={selected}
                            onChange={(e) => {
                              if (submitted || !started) return;
                              const val = e.target.value;
                              setAnswers((prev) => {
                                const arr = Array.isArray(prev[currentQuestion.id])
                                  ? [...prev[currentQuestion.id]]
                                  : Array(currentQuestion.options.length).fill("");
                                arr[i] = val;
                                return { ...prev, [currentQuestion.id]: arr };
                              });
                            }}
                            sx={{
                              height: 32,
                              fontSize: "0.95rem",
                              "& .MuiSelect-select": { py: 0.5 },
                            }}
                          >
                            <MenuItem value="Đ">Đúng</MenuItem>
                            <MenuItem value="S">Sai</MenuItem>
                          </Select>
                        </FormControl>
                      </Paper>
                    );
                  })}
                </>
              )}


              {/* IMAGE MULTIPLE */}
              {currentQuestion.type === "image" && (
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  gap={2}
                  flexWrap="wrap"
                  justifyContent="center"
                  alignItems="center"
                >
                  {currentQuestion.displayOrder.map((optIdx) => {
                    const option = currentQuestion.options[optIdx];

                    // ✅ ẢNH = option.text
                    const imageUrl =
                      typeof option === "string"
                        ? option
                        : option?.text ?? "";

                    if (!imageUrl) return null;

                    const userAns = answers[currentQuestion.id] || [];
                    const checked = userAns.includes(optIdx);

                    const isCorrect =
                      submitted && currentQuestion.correct.includes(optIdx);
                    const isWrong =
                      submitted && checked && !currentQuestion.correct.includes(optIdx);

                    return (
                      <Paper
                        key={optIdx}
                        onClick={() => {
                          if (submitted || !started) return;
                          handleMultipleSelect(
                            currentQuestion.id,
                            optIdx,
                            !checked
                          );
                        }}
                        sx={{
                          width: 150,
                          height: 180,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 1,
                          border: "1px solid #90caf9",
                          cursor: submitted || !started ? "default" : "pointer",
                          bgcolor:
                            submitted && choXemDapAn
                              ? isCorrect
                                ? "#c8e6c9"
                                : isWrong
                                ? "#ffcdd2"
                                : "transparent"
                              : "transparent",
                        }}
                      >
                        {/* ✅ IMAGE */}
                        <img
                          src={imageUrl}
                          alt={`option-${optIdx}`}
                          style={{
                            width: "50%",          // 🔥 chiếm 75% chiều rộng khung
                            height: "auto",        // 🔥 giữ tỉ lệ ảnh
                            maxHeight: "100%",     // không tràn khung
                            objectFit: "contain",
                            marginBottom: 6,
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />

                        {/* ✅ CHECKBOX */}
                        <Checkbox
                          checked={checked}
                          disabled={submitted || !started}
                        />
                      </Paper>
                    );
                  })}
                </Stack>
              )}

              {/* FILLBLANK */}
              {currentQuestion.type === "fillblank" && (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Stack spacing={2}>
                    {/* ======================= HÌNH MINH HỌA ======================= */}
                    {currentQuestion.questionImage && (
                      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                        <Box
                          sx={{
                            maxHeight: 150,
                            maxWidth: "100%",
                            overflow: "hidden",
                            borderRadius: 2,
                            border: "1px solid #ddd",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            bgcolor: "#fafafa",
                          }}
                        >
                          <img
                            src={currentQuestion.questionImage}
                            alt="Hình minh họa"
                            style={{
                              maxHeight: 150,
                              maxWidth: "100%",
                              objectFit: "contain",
                              cursor: "zoom-in",
                            }}
                            onClick={() => setZoomImage(currentQuestion.questionImage)}
                          />
                        </Box>
                      </Box>
                    )}

                    {/* ======================= CÂU HỎI + CHỖ TRỐNG ======================= */}
                    <Box
                      sx={{
                        width: "100%",
                        lineHeight: 1.6,
                        fontSize: "1.1rem",
                        fontFamily: "Roboto, Arial, sans-serif",
                      }}
                    >
                      {currentQuestion.option.split("[...]").map((part, idx) => (
                        <span key={idx}>

                          {/* Text */}
                          <Typography
                            component="span"
                            variant="body1"
                            sx={{
                              mr: 0.5,
                              fontSize: "1.1rem",
                              "& p, & div": { display: "inline", margin: 0 },
                            }}
                            dangerouslySetInnerHTML={{ __html: part }}
                          />

                          {/* Blank */}
                          {idx < currentQuestion.option.split("[...]").length - 1 && (
                            <Droppable droppableId={`blank-${idx}`} direction="horizontal">
                              {(provided) => {
                                const userWord = currentQuestion.filled?.[idx] ?? "";
                                // ✅ đáp án đúng nằm trong options[idx].text
                                const correctObj = currentQuestion.options?.[idx];
                                const correctWord =
                                  typeof correctObj === "string"
                                    ? correctObj
                                    : correctObj?.text ?? "";

                                const color =
                                  submitted && userWord
                                    ? userWord.trim().toLowerCase() ===
                                      correctWord.trim().toLowerCase()
                                      ? "green"
                                      : "red"
                                    : "#000";
                                return (
                                  <Box
                                    component="span"
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    sx={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      minWidth: 80,
                                      px: 1,
                                      border: "1px dashed #90caf9",
                                      borderRadius: 1,
                                      fontSize: "1.1rem",
                                      color,
                                    }}
                                  >
                                    {userWord && (
                                      <Draggable
                                        draggableId={`filled-${idx}`}
                                        index={0}
                                        isDragDisabled={submitted || !started}
                                      >
                                        {(prov) => (
                                          <Paper
                                            ref={prov.innerRef}
                                            {...prov.draggableProps}
                                            {...prov.dragHandleProps}
                                            sx={{
                                              px: 2,
                                              py: 0.5,
                                              bgcolor: "#e3f2fd",
                                              cursor: "grab",
                                              minHeight: 30,
                                              border: "1px solid #90caf9",
                                              boxShadow: "none",
                                              color,
                                            }}
                                          >
                                            {userWord}
                                          </Paper>
                                        )}
                                      </Draggable>
                                    )}
                                    {provided.placeholder}
                                  </Box>
                                );
                              }}
                            </Droppable>
                          )}
                        </span>
                      ))}
                    </Box>

                    {/* ======================= KHU VỰC THẺ TỪ ======================= */}
                    <Box sx={{ mt: 2, textAlign: "left" }}>
                      <Typography
                        sx={{
                          mb: 1,
                          fontWeight: "bold",
                          fontSize: "1.1rem",
                          fontFamily: "Roboto, Arial, sans-serif",
                        }}
                      >
                        Các từ cần điền:
                      </Typography>

                      <Droppable droppableId="words" direction="horizontal">
                        {(provided) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 1,
                              minHeight: 50,
                              maxHeight: 80,
                              p: 1,
                              border: "1px solid #90caf9",
                              borderRadius: 2,
                              bgcolor: "white",
                              overflowY: "auto",
                            }}
                          >
                            {(currentQuestion.shuffledOptions || currentQuestion.options)
                              .filter(o => !(currentQuestion.filled ?? []).includes(o.text))
                              .map((word, idx) => (
                                <Draggable
                                  key={word.text}
                                  draggableId={`word-${word.text}`}
                                  index={idx}
                                  isDragDisabled={submitted || !started}
                                >
                                  {(prov) => (
                                    <Paper
                                      ref={prov.innerRef}
                                      {...prov.draggableProps}
                                      {...prov.dragHandleProps}
                                      elevation={0}
                                      sx={{
                                        px: 2,
                                        py: 0.5,
                                        bgcolor: "#e3f2fd",
                                        cursor: "grab",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minHeight: 30,
                                        fontFamily: "Roboto, Arial, sans-serif",
                                        fontSize: "1.1rem",
                                        border: "1px solid #90caf9",
                                        boxShadow: "none",
                                        "&:hover": {
                                          bgcolor: "#bbdefb",
                                        },
                                      }}
                                    >
                                      {word.text}
                                    </Paper>
                                  )}
                                </Draggable>
                              ))}

                            {provided.placeholder}
                          </Box>
                        )}
                      </Droppable>
                    </Box>


                  </Stack>
                </DragDropContext>
              )}            
            </Box>
          )}

          {/* Nút điều hướng và bắt đầu/nộp bài */}
          <Box sx={{ flexGrow: 1 }} />
          {started && !loading && (
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                mt: 2,
                pt: 2,
                mb: { xs: "20px", sm: "5px" },
                borderTop: "1px solid #e0e0e0",
              }}
            >
              {/* ===== CÂU TRƯỚC ===== */}
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handlePrev}
                disabled={currentIndex === 0}
                sx={{
                  width: 150,
                  bgcolor: currentIndex === 0 ? "#e0e0e0" : "#bbdefb",
                  borderRadius: 1,
                  color: "#0d47a1",
                  "&:hover": {
                    bgcolor: currentIndex === 0 ? "#e0e0e0" : "#90caf9",
                  },
                }}
              >
                Câu trước
              </Button>

              {/* ===== CÂU SAU / NỘP BÀI ===== */}
              {currentIndex < questions.length - 1 ? (
                <Button
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNext}
                  sx={{
                    width: 150,
                    bgcolor: "#bbdefb",
                    borderRadius: 1,
                    color: "#0d47a1",
                    "&:hover": { bgcolor: "#90caf9" },
                  }}
                >
                  Câu sau
                </Button>
              ) : (
                // ✅ CHỈ HIỆN KHI SIDEBAR KHÔNG HIỂN THỊ
                !isSidebarVisible && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={submitted || isEmptyQuestion}
                    sx={{
                      width: 150,
                      borderRadius: 1,
                    }}
                  >
                    Nộp bài
                  </Button>
                )
              )}
            </Stack>
            )}            
          </Paper>      
        </Box>          

        {/* ================= RIGHT SIDEBAR ================= */}
        {isSidebarVisible && (
          <Box
            sx={{
              width: sidebarConfig.width,   // 260 / auto
              flexShrink: 0,
              display: { xs: "none", md: "block" },
            }}
          >
            <Card
              sx={{
                p: 2,
                borderRadius: 2,
                position: sidebarConfig.width === 260 ? "sticky" : "static",
                top: 24,
              }}
            >
              <Typography
                fontWeight="bold"
                textAlign="center"
                mb={2}
                fontSize="1.1rem"
                color="#0d47a1"
                sx={{
                  userSelect: "none",        // ✅ CHẶN BÔI ĐEN
                  cursor: "default",
                }}
              >
                Câu hỏi
              </Typography>

              <Divider sx={{ mt: -1, mb: 3, bgcolor: "#e0e0e0" }} />
  
              {/* ===== GRID Ô SỐ ===== */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${sidebarConfig.cols}, 1fr)`,
                  gap: 1.2,
                  justifyItems: "center",
                  mb: !submitted ? 8 : 0,
                }}
              >
                {questions.map((q, index) => {
                  const status = getQuestionStatus_Test({
                    question: q,
                    userAnswer: answers[q.id],
                    submitted,
                  });
  
                  const active = currentIndex === index;
  
                  let bgcolor = "#eeeeee";
                  let border = "1px solid transparent";
                  let textColor = "#0d47a1";
  
                  if (!submitted && status === "answered") bgcolor = "#bbdefb";
  
                  if (submitted) {
                    if (status === "correct") bgcolor = "#c8e6c9";
                    else if (status === "wrong") bgcolor = "#ffcdd2";
                    else {
                      bgcolor = "#fafafa";
                      border = "1px dashed #bdbdbd";
                    }
                  }
  
                  if (active) {
                    border = "2px solid #9e9e9e";
                    textColor = "#616161";
                  }
  
                  return (
                    <IconButton
                      key={q.id}
                      onClick={() => setCurrentIndex(index)}
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        bgcolor,
                        color: textColor,
                        border,
                        boxShadow: "none",
                      }}
                    >
                      {index + 1}
                    </IconButton>
                  );
                })}
              </Box>
  
              {!submitted && (
                <Button fullWidth variant="contained" onClick={handleSubmit}>
                  Nộp bài
                </Button>
              )}
  
              {/*<Button
                fullWidth
                variant="outlined"
                color="error"
                sx={{ mt: submitted ? 8 : 1.5 }}
                onClick={() => {
                  if (submitted) navigate(-1);
                  else setOpenExitConfirm(true);
                }}
              >
                Thoát
              </Button>*/}
            </Card>
          </Box>
        )}

        {/* Dialog câu chưa làm */}
        <IncompleteAnswersDialog
          open={openAlertDialog}
          onClose={() => setOpenAlertDialog(false)}
          unansweredQuestions={unansweredQuestions}
        />

        {/* Dialog xác nhận thoát */}
        <ExitConfirmDialog
          open={openExitConfirm}
          onClose={() => setOpenExitConfirm(false)}
        />

        <Dialog
          open={openResultDialog}
          onClose={(event, reason) => {
            if (reason === "backdropClick" || reason === "escapeKeyDown") return;
            setOpenResultDialog(false);
          }}
          disableEscapeKeyDown
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              p: 0,
              bgcolor: "#e3f2fd",
              boxShadow: "0 4px 12px rgba(33, 150, 243, 0.15)",
            },
          }}
        >

          {/* Header với nền màu full width */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              p: 0.75,
              bgcolor: "#90caf9",
              borderRadius: "12px 12px 0 0", // bo 2 góc trên
              mb: 2,
            }}
          >
            <Box
              sx={{
                bgcolor: "#42a5f5",
                color: "#fff",
                borderRadius: "50%",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 1.5,
                fontWeight: "bold",
                fontSize: 18,
              }}
            >
              🎉
            </Box>

            <DialogTitle
              sx={{
                p: 0,
                fontWeight: "bold",
                color: "#0d47a1",
                fontSize: 20,
              }}
            >
              Kết quả
            </DialogTitle>
          </Box>

          {/* Nội dung */}
          <DialogContent sx={{ textAlign: "center", px: 3, pb: 3 }}>
            <Typography
              sx={{ fontSize: 18, fontWeight: "bold", color: "#0d47a1", mb: 1 }}
            >
              {studentResult?.hoVaTen?.toUpperCase()}
            </Typography>

            <Typography sx={{ fontSize: 17, color: "#1565c0", mb: 1 }}>
              <strong>Lớp: </strong>
              <span style={{ fontWeight: "bold" }}>{studentResult?.lop}</span>
            </Typography>

            {/* Nếu cho xem điểm */}
            {choXemDiem ? (
              <Typography
                sx={{
                  fontSize: 17,
                  fontWeight: 700,
                  mt: 1,
                }}
              >
                <span style={{ color: "#1565c0" }}>Điểm:</span>&nbsp;
                <span style={{ color: "red" }}>{studentResult?.diem}</span>
              </Typography>
            ) : (
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "red",
                  mt: 2,
                  textAlign: "center",
                }}
              >
                ĐÃ HOÀN THÀNH BÀI KIỂM TRA
              </Typography>
            )}
          </DialogContent>

          {/* Nút OK */}
          <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
            <Button
              variant="contained"
              onClick={() => setOpenResultDialog(false)}
              sx={{
                px: 4,
                borderRadius: 2,
                bgcolor: "#42a5f5",
                color: "#fff",
                "&:hover": { bgcolor: "#1e88e5" },
                fontWeight: "bold",
              }}
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>

        <ImageZoomDialog
          open={Boolean(zoomImage)}
          imageSrc={zoomImage}
          onClose={() => setZoomImage(null)}
        />
        
        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
    
}
