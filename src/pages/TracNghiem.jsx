// =========================
// ⚛️ REACT
// =========================
import React, { useState, useEffect, useContext, useRef } from "react";

// =========================
// 🎨 MATERIAL UI
// =========================
import {
  Box,
  Paper,
  useTheme,
  useMediaQuery,
  Stack,
  Typography,
  IconButton,
} from "@mui/material";

// =========================
// 🔥 FIREBASE
// =========================
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  updateDoc
} from "firebase/firestore";

import { db } from "../firebase";

// =========================
// 🌐 ROUTER
// =========================
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

// =========================
// 🎯 CONTEXT
// =========================
import { ConfigContext } from "../context/ConfigContext";

// =========================
// 🎨 ICONS
// =========================
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

// =========================
// 💬 DIALOGS
// =========================
import ImageZoomDialog from "../dialog/ImageZoomDialog";
import IncompleteAnswersDialog from "../dialog/IncompleteAnswersDialog";
import ExitConfirmDialog from "../dialog/ExitConfirmDialog";
import ResultDialog from "../dialog/ResultDialog";

// =========================
// 🧩 COMPONENTS
// =========================
import QuizQuestion from "../Types/questions/options/QuizQuestion";

import QuizHeader from "../components/quiz/QuizHeader";
import QuizSidebar from "../components/quiz/QuizSidebar";
import QuizNavigation from "../components/quiz/QuizNavigation";
import QuizLoading from "../components/quiz/QuizLoading";

// =========================
// 🛠️ UTILITIES
// =========================
import { exportQuizPDF } from "../utils/exportQuizPDF";
import { handleSubmitQuiz } from "../utils/submitQuiz";
import { autoSubmitQuiz } from "../utils/autoSubmitQuiz";

import { buildRuntimeQuestions } from "../utils/buildRuntimeQuestions";
import { processQuestions } from "../utils/processQuestions";
import { getQuizDocId } from "../utils/getQuizDocId";
import { useQuizTimer } from "../utils/useQuizTimer";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AccessTimeIcon from "@mui/icons-material/AccessTime"; // ✅ THÊM DÒNG NÀY
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

export default function TracNghiem() {
  //
  // =========================
  // ❓ QUIZ DATA
  // =========================
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const answersRef = useRef({});

  // =========================
  // 📍 QUIZ NAVIGATION
  // =========================
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // =========================
  // ⏱️ TIMER / LOADING
  // =========================
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const [timeLimitMinutes, setTimeLimitMinutes] = useState(0);

  // =========================
  // 🏫 QUIZ INFO
  // =========================
  const [quizClass, setQuizClass] = useState("");
  const [hocKi, setHocKi] = useState("");
  const [monHoc, setMonHoc] = useState("");

  const [selectedExamType, setSelectedExamType] = useState("Giữa kỳ I");

  const [choXemDiem, setChoXemDiem] = useState(false);
  const [choXemDapAn, setChoXemDapAn] = useState(false);

  // =========================
  // 💬 DIALOG STATES
  // =========================
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [openExitConfirm, setOpenExitConfirm] = useState(false);
  const [openResultDialog, setOpenResultDialog] = useState(false);

  const [dialogMode, setDialogMode] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  // =========================
  // 🖼️ IMAGE / UI STATES
  // =========================
  const [zoomImage, setZoomImage] = useState(null);
  const [fillBlankStatus, setFillBlankStatus] = useState({});

  // =========================
  // 📊 RESULT STATES
  // =========================
  const [studentResult, setStudentResult] = useState(null);
  const [unansweredQuestions, setUnansweredQuestions] = useState([]);
  const [notFoundMessage, setNotFoundMessage] = useState("");

  // =========================
  // 🌐 ROUTER
  // =========================
  const location = useLocation();
  const navigate = useNavigate();

  const locationState = location.state || {};

  // =========================
  // 👨‍🎓 STUDENT INFO
  // =========================
  const [studentId] = useState(locationState.studentId || "HS001");
  const [fullname] = useState(locationState.fullname || "Test");
  const [lop] = useState(locationState.lop || "4.1");
  const [selectedWeek] = useState(locationState.selectedWeek || 13);
  const [mon] = useState(locationState.mon || "Tin học");

  // =========================
  // ⚙️ CONFIG
  // =========================
  const { config, setConfig } = useContext(ConfigContext);
  const [configData, setConfigData] = useState(null);

  // =========================
  // 🎨 THEME / RESPONSIVE
  // =========================
  const theme = useTheme();
  const isBelow1024 = useMediaQuery("(max-width:1023px)");

  // =========================
  // 👨‍🎓 DERIVED STUDENT DATA
  // =========================
  const studentInfo = {
    id: studentId,
    name: fullname,
    className: lop,
    selectedWeek: selectedWeek || 1,
    mon: mon || config.mon || "Tin học",
  };

  const studentClass = location.state?.lop || "";
  const studentName = studentInfo.name;
  const hocKiDisplay =
    config?.hocKy || "Cuối kỳ I";

  const monHocDisplay =
    studentInfo.mon || config?.mon || "Tin học";

  const examType = configData?.examType || "ktdk";

  // Kiểm tra dữ liệu học sinh
  useEffect(() => {
    if (!studentId || !fullname || !lop) {
      navigate("/hoc-sinh");
    }
  }, [studentId, fullname, lop, navigate]);

  const handleMatchSelect = (questionId, leftIndex, rightIndex) => {
    setAnswers(prev => {
      const prevAns = prev[questionId] ?? [];
      const newAns = [...prevAns];
      newAns[leftIndex] = rightIndex;
      return { ...prev, [questionId]: newAns };
    });
  };

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const showNotFoundDialog = (msg) => {
    setDialogMessage(msg);
    setDialogMode("notFound");
    setOpenResultDialog(true);
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setProgress(0);

        // ===== CONFIG =====
        const configData = config; // lấy từ context

        setConfigData(configData);

        const hocKiFromConfig = configData.hocKy || "";
        const monHocFromConfig = configData.mon || "";
        const timeLimitMinutes = configData.timeLimit ?? 0;

        setTimeLimitMinutes(timeLimitMinutes);
        setChoXemDiem(configData.choXemDiem ?? false);
        setChoXemDapAn(configData.choXemDapAn ?? false);

        setProgress(30);

        // ===== CLASS =====
        const classNumber = studentInfo.className.match(/\d+/)?.[0];
        if (!classNumber) {
          setSnackbar({
            open: true,
            message: "❌ Không xác định được lớp!",
            severity: "error",
          });
          return;
        }

        const classLabel = `Lớp ${classNumber}`;

        // ===== LẤY DOC ID  =====
        // ================= TỰ TÌM ĐỀ (GIỐNG BẢN CŨ) =================
        const examType = configData?.examType || "ktdk";

        let docId = "";
        let collectionName = "NGANHANG_DE";

        // ================= ÔN TẬP =================
        if (examType === "on_tap") {
          const hocKiMap = {
            "Cuối kỳ I": "CKI",
            "Giữa kỳ I": "GKI",
            "Giữa kỳ II": "GKII",
            "Cuối năm": "CN",
          };

          const hocKiCode = hocKiMap[hocKiFromConfig];

          const namHoc = (configData.namHoc || "2025-2026")
            .split("-")
            .map(y => y.slice(-2))
            .join("-");

          const classNumber = classLabel.match(/\d+/)?.[0];

          docId = `quiz_Lớp ${classNumber}_Tin học_${hocKiCode}_${namHoc}`;
          collectionName = "DE_ONTAP";
        }

        // ================= KTĐK =================
        else {
          const deThiSnap = await getDocs(
            collection(db, "DETHI")
          );

          const hocKiMap = {
            "Cuối kỳ I": "CKI",
            "Giữa kỳ I": "GKI",
            "Giữa kỳ II": "GKII",
            "Cuối năm": "CN",
          };
          
          const hocKiCode = hocKiMap[hocKiFromConfig];
          
          const configSnap = await getDoc(
            doc(db, "CONFIG", "config")
          );

          const configFirestore = configSnap.exists()
            ? configSnap.data()
            : {};

          const namHoc = (configFirestore.namHoc || "2026-2027")
            .split("-")
            .map(y => y.slice(-2))
            .join("-");

          const classNumber = classLabel.match(/\d+/)?.[0];
          const normalizedClass = `Lớp ${classNumber}`;

          console.log("hocKiFromConfig =", hocKiFromConfig);
          console.log("hocKiCode =", hocKiCode);
          console.log("namHoc =", namHoc);

          deThiSnap.docs.forEach(d => {
            console.log("DOC:", d.id);
          });

          const matchedDoc = deThiSnap.docs.find((d) => {
            const id = d.id;

            return (
              id.includes(normalizedClass) &&
              id.includes(hocKiCode) &&
              id.includes(namHoc)
            );
          });

          if (!matchedDoc) {
            setNotFoundMessage(
              `❌ Không tìm thấy đề cho ${classLabel}`
            );

            setLoading(false);
            return;
          }

          docId = matchedDoc.id;
        }

        // ===== LOAD ĐỀ =====
        setTimeLeft(timeLimitMinutes * 60);

        const docSnap = await getDoc(doc(db, collectionName, docId));
        if (!docSnap.exists()) {
          setSnackbar({
            open: true,
            message: "❌ Không tìm thấy đề!",
            severity: "error",
          });
          return;
        }

        setProgress(60);

        const data = docSnap.data();

        setQuizClass(data.class || "");
        setHocKi(data.semester || hocKiFromConfig);
        setMonHoc(data.subject || monHocFromConfig);

        window.currentHocKi = data.semester || hocKiFromConfig;
        window.currentMonHoc = data.subject || monHocFromConfig;

        // ===== QUESTIONS =====
        processQuestions({
          data,
          buildRuntimeQuestions,
          setQuestions,
          setStarted,
          setProgress,
          setAnswers,
        });

      } catch (err) {
        console.error("❌ Lỗi khi load câu hỏi:", err);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

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

  function mapHocKyToDocKey(loaiKT) {
    switch (loaiKT) {
      case "Giữa kỳ I": return "GKI";
      case "Cuối kỳ I": return "CKI";
      case "Giữa kỳ II": return "GKII";
      case "Cuối năm": return "CN";
      default:
        console.warn("❌ Loại kiểm tra không xác định:", loaiKT);
        return "UNKNOWN";
    }
  }

  const getQuestionMax = (q) => {
    // Nếu có scoreTotal thì dùng (tổng sẵn của câu)
    if (typeof q.scoreTotal === "number") return q.scoreTotal;

    // Nếu có per-item score và có danh sách tiểu mục
    if (typeof q.perItemScore === "number") {
      // xác định số tiểu mục theo loại
      const subCount =
        q.type === "truefalse" ? (Array.isArray(q.correct) ? q.correct.length : 0) :
        q.type === "fillblank" ? (Array.isArray(q.options) ? q.options.length : 0) :
        q.type === "matching" ? (Array.isArray(q.correct) ? q.correct.length : 0) :
        q.type === "sort" ? (Array.isArray(q.correctTexts) ? q.correctTexts.length : 0) :
        1;
      return q.perItemScore * subCount;
    }

    // Mặc định: dùng score nếu có, nếu không thì 1
    return typeof q.score === "number" ? q.score : 1;
  };

  const maxScore = questions.reduce((sum, q) => sum + getQuestionMax(q), 0);
  const currentQuestion = questions[currentIndex] || null;
  const isEmptyQuestion = currentQuestion?.question === "";

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const handleCloseSnackbar = (event, reason) => { if (reason === "clickaway") return; setSnackbar(prev => ({ ...prev, open: false })); };

  const handleSubmit = async () => {
  try {
    await handleSubmitQuiz({
      studentName,
      studentClass,
      studentId,
      studentInfo,
      studentResult,
      setStudentResult,
      setSnackbar,
      setSaving,
      setSubmitted,
      setOpenAlertDialog,
      setUnansweredQuestions,
      setOpenResultDialog,
      questions,
      answers: answersRef.current,
      startTime,
      db,
      config,
      configData: config,
      selectedWeek,
      getQuestionMax,
      capitalizeName,
      mapHocKyToDocKey,
      formatTime,
      exportQuizPDF,
    });
  } catch (err) {
    console.error("❌ Submit error:", err);
    setSnackbar({
      open: true,
      message: "❌ Lỗi khi nộp bài",
      severity: "error",
    });
  }
};

  const handleAutoSubmit = async () => {
    await autoSubmitQuiz({
      studentName,
      studentClass,
      studentId,
      studentInfo,
      studentResult,
      setStudentResult,
      setSnackbar,
      setSaving,
      setSubmitted,
      setOpenAlertDialog,
      setUnansweredQuestions,
      setOpenResultDialog,
      questions,
      answers: answersRef.current,
      startTime,
      db,
      config,
      configData,
      selectedWeek,
      getQuestionMax,
      capitalizeName,
      mapHocKyToDocKey,
      formatTime,
      exportQuizPDF,
    });
  };

  const {
    timeLeft,
    setTimeLeft,
    startTime,
    formatTime,
  } = useQuizTimer({
    started,
    submitted,
    initialTime: timeLimitMinutes * 60,
    onTimeUp: handleAutoSubmit,
  });

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

  function reorder(list, startIndex, endIndex) {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  }

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

const ratio = currentQuestion?.columnRatio || { left: 1, right: 1 };

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

const toTitleCase = (str = "") =>
  str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const hasSidebar = sidebarConfig && questions.length > 0;
const isSidebarVisible = hasSidebar && showSidebar;

return (
  <Box
    id="quiz-container"
    sx={{
      minHeight: "100vh",
      background: "#f1f5f9",
      pt: { xs: 2, sm: 3 },
      px: { xs: 1, sm: 2 },

      fontFamily: `
        "Roboto",
        "Inter",
        "Segoe UI",
        "Arial",
        "Noto Sans",
        "Helvetica",
        sans-serif
      `,
    }}
  >
    <Box
      sx={{
        display: "flex",
        gap: 3,
        width: "100%",
        maxWidth: isSidebarVisible ? 1280 : 1000,
        mx: "auto",
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      {/* ===== LEFT ===== */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Paper
          sx={{
            p: 0,
            borderRadius: 3,
            minHeight: 650,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* ================= HEADER ================= */}
          <Box
            sx={{
              px: 3,
              py: 1.5,
              background: "#1976d2",
              color: "#fff",
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              margin: 0,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
            >
              {/* ===== LEFT ===== */}
              <Box
                sx={{
                  minWidth: 200,
                  fontFamily: `"Roboto", "Arial", sans-serif`,
                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                  textRendering: "optimizeLegibility",
                }}
              >
                <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                  {toTitleCase(studentInfo?.name || "Học sinh")}
                </Typography>

                <Typography sx={{ fontSize: 15, opacity: 0.9 }}>
                  Lớp: {studentInfo?.className || "4A"}
                </Typography>
              </Box>

              {/* ===== CENTER (GIỮ DESKTOP, CHỈ MOBILE BREAK LINE NHẸ) ===== */}
              <Box
                sx={{
                  textAlign: "center",
                  flex: 1,
                  fontFamily: `"Roboto", "Arial", sans-serif`,
                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                  textRendering: "optimizeLegibility",
                }}
              >
                {/* 👇 LUÔN 1 HÀNG */}
                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {configData?.examType === "on_tap"
                    ? `ÔN TẬP - ${(configData?.hocKy || "").toUpperCase()}`
                    : `KTĐK - ${(configData?.hocKy || "").toUpperCase()}`}
                </Typography>

                <Typography
                  sx={{
                    fontSize: 15,
                    opacity: 0.9,
                    whiteSpace: "nowrap",
                  }}
                >
                  Năm học: {configData?.namHoc || "2025-2026"}
                </Typography>
              </Box>

              {/* ===== RIGHT (KHÔNG ĐỔI DESKTOP) ===== */}
              <Box
                sx={{
                  minWidth: 160,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 2,
                }}
              >
                {/* ❌ TIMER sẽ KHÔNG render trong header mobile nữa */}
                <Box
                  sx={{
                    display: { xs: "none", md: "flex" }, // 👈 ẩn trên mobile
                    alignItems: "center",
                    gap: 1,
                    px: 2,
                    py: 0.8,
                    bgcolor: "#fff",
                    color: "#d32f2f",
                    borderRadius: 2,
                    fontWeight: 800,
                    fontSize: "1rem",
                    minWidth: 90,
                    justifyContent: "center",
                  }}
                >
                  <AccessTimeIcon sx={{ fontSize: 20 }} />
                  <Typography sx={{ fontWeight: 800 }}>
                    {formatTime(timeLeft)}
                  </Typography>
                </Box>

                <IconButton
                  onClick={() => setShowSidebar((p) => !p)}
                  sx={{
                    display: { xs: "none", md: "flex" }, // 👈 ẨN MOBILE
                    color: "#fff",
                    bgcolor: "rgba(255,255,255,0.15)",
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.25)",
                    },
                  }}
                >
                  {showSidebar ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
              </Box>
            </Stack>
          </Box>

          {/* ================= TIMER OUTSIDE HEADER (MOBILE ONLY) ================= */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" }, // 👈 chỉ mobile
              justifyContent: "center",
              mt: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 0.8,
                bgcolor: "#fff",
                color: "#d32f2f",
                borderRadius: 2,
                fontWeight: 800,
                fontSize: "1rem",
                minWidth: 110,
                justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
              }}
            >
              <AccessTimeIcon sx={{ fontSize: 20 }} />
              <Typography sx={{ fontWeight: 800 }}>
                {formatTime(timeLeft)}
              </Typography>
            </Box>
          </Box>

          {/* ================= CONTENT ================= */}
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            <QuizLoading loading={loading} progress={progress} />

            {!loading && currentQuestion && (
              <QuizQuestion
                currentQuestion={currentQuestion}
                currentIndex={currentIndex}
                answers={answers}
                setAnswers={setAnswers}
                submitted={submitted}
                started={started}
                choXemDapAn={choXemDapAn}
                setZoomImage={setZoomImage}
                handleSingleSelect={handleSingleSelect}
                handleMultipleSelect={handleMultipleSelect}
                handleDragEnd={handleDragEnd}
                reorder={reorder}
                normalizeValue={normalizeValue}
                ratio={ratio}
              />
            )}

            <Box sx={{ flexGrow: 1 }} />

            <QuizNavigation
              started={started}
              loading={loading}
              currentIndex={currentIndex}
              questionsLength={questions.length}
              handlePrev={handlePrev}
              handleNext={handleNext}
              handleSubmit={handleSubmit}
              submitted={submitted}
              isEmptyQuestion={isEmptyQuestion}
              isSidebarVisible={isSidebarVisible}
            />
          </Box>
        </Paper>
      </Box>

      {/* ===== SIDEBAR ===== */}
      {isSidebarVisible && (
        <QuizSidebar
          sidebarConfig={sidebarConfig}
          questions={questions}
          answers={answers}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          submitted={submitted}
          handleSubmit={handleSubmit}
          navigate={navigate}
          setOpenExitConfirm={setOpenExitConfirm}
          choXemDiem={choXemDiem}
          choXemDapAn={choXemDapAn}
        />
      )}
    </Box>

    {/* DIALOGS */}
    <IncompleteAnswersDialog
      open={openAlertDialog}
      onClose={() => setOpenAlertDialog(false)}
      unansweredQuestions={unansweredQuestions}
    />

    <ExitConfirmDialog
      open={openExitConfirm}
      onClose={() => setOpenExitConfirm(false)}
    />

    <ResultDialog
      open={openResultDialog}
      onClose={() => setOpenResultDialog(false)}
      dialogMode={dialogMode}
      dialogMessage={dialogMessage}
      studentResult={studentResult}
      choXemDiem={choXemDiem}
      configData={configData}
      convertPercentToScore={convertPercentToScore}
    />

    <ImageZoomDialog
      open={Boolean(zoomImage)}
      imageSrc={zoomImage}
      onClose={() => setZoomImage(null)}
    />
  </Box>
);

}
