import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  //Radio,
  //RadioGroup,
  //FormControlLabel,
  //Checkbox,
  Stack,
  LinearProgress,
  IconButton,
  Tooltip,
  Snackbar, 
  Alert,
  Divider,
  //TextField,
  //FormControl,
  //Select,
  //MenuItem,
  Card,
} from "@mui/material";
import { doc, getDoc, getDocs, setDoc, collection, updateDoc } from "firebase/firestore";
// Thay cho react-beautiful-dnd
//import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { db } from "../firebase";
import { useContext } from "react";
import { ConfigContext } from "../context/ConfigContext";
import { useStudentQuizContext } from "../context/StudentQuizContext";

import { exportQuizPDF } from "../utils/exportQuizPDF"; 
import { handleSubmitQuiz } from "../utils/submitQuiz";
import { autoSubmitQuiz } from "../utils/autoSubmitQuiz";
//import QuestionOption from "../utils/QuestionOption";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
//import CloseIcon from "@mui/icons-material/Close";
//import CheckCircleIcon from '@mui/icons-material/CheckCircle';
//import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { useLocation, useNavigate } from "react-router-dom";

//import { jsPDF } from "jspdf";
//import html2canvas from "html2canvas";

import IncompleteAnswersDialog from "../dialog/IncompleteAnswersDialog";
import ExitConfirmDialog from "../dialog/ExitConfirmDialog";
import ResultDialog from "../dialog/ResultDialog";

import { getQuestionStatus } from "../utils/questionStatus";
import { useTheme, useMediaQuery } from "@mui/material";
import { buildRuntimeQuestions } from "../utils/buildRuntimeQuestions";

import { renderQuestionByType } from "../Types/Render/renderQuestionByType";

// Hàm shuffle mảng
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function TracNghiem() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizClass, setQuizClass] = useState("");
  const [score, setScore] = useState(0);

  const { quizCache, setQuizCache } = useStudentQuizContext();

  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState(""); 
  const [unansweredQuestions, setUnansweredQuestions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const { config } = useContext(ConfigContext);
  const [saving, setSaving] = useState(false);
  const [openExitConfirm, setOpenExitConfirm] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(0);

  const [hocKi, setHocKi] = useState("");
  const [monHoc, setMonHoc] = useState("");
  const [choXemDiem, setChoXemDiem] = useState(false);
  const [choXemDapAn, setChoXemDapAn] = useState(false);

  const [openResultDialog, setOpenResultDialog] = useState(false);
  const [studentResult, setStudentResult] = useState(null);
  const [fillBlankStatus, setFillBlankStatus] = useState({});
  const [dialogMessage, setDialogMessage] = useState("");

  const [notFoundMessage, setNotFoundMessage] = useState(""); 
  const [selectedExamType, setSelectedExamType] = useState("Giữa kỳ I"); // mặc định
  const [configData, setConfigData] = useState(null);

  const locationState = location.state || {};
  const [studentId, setStudentId] = useState(locationState.studentId || "HS001");
  const [fullname, setFullname] = useState(locationState.fullname || "Test");
  const [lop, setLop] = useState(locationState.lop || "4.1");
  const [selectedWeek, setSelectedWeek] = useState(locationState.selectedWeek || 13);
  const [mon, setMon] = useState(locationState.mon || "Tin học");

  const theme = useTheme();
  const isBelow1024 = useMediaQuery("(max-width:1023px)");
  const [showSidebar, setShowSidebar] = useState(true);

  const studentClass = location.state?.lop || "";
  const [columnRatio, setColumnRatio] = useState({ left: 1, right: 1 });


  const studentInfo = {
    id: studentId,
    name: fullname,
    className: lop,           // giữ key là className
    //school: school || "",
    selectedWeek: selectedWeek || 1,
    mon: mon || config.mon || "Tin học",
  };

// Khi cần lấy lớp học sinh

const studentName = studentInfo.name;
const hocKiDisplay = config?.hocKy || "Cuối kỳ I"; // fallback nếu chưa có config
const monHocDisplay = studentInfo.mon || config?.mon || "Tin học";

// Kiểm tra dữ liệu học sinh
useEffect(() => {
  if (!studentInfo.id || !studentInfo.name || !lop) {
    navigate("/hoc-sinh");
  }
}, [studentInfo.id, studentInfo.name, lop, navigate]);

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

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);

        let docId = null;
        const collectionName = "NGANHANG_DE";
        let hocKiFromConfig = config.hocKy || "Cuối kỳ I";
        let timeLimitMinutes = config.timeLimit ?? 20;

        setTimeLimitMinutes(timeLimitMinutes);
        setChoXemDiem(config.choXemDiem ?? false);
        setChoXemDapAn(config.choXemDapAn ?? false);

        // ================= LẤY LỚP =================
        const studentClass = studentInfo?.className || "";
        const classNumber = studentClass.match(/\d+/)?.[0];

        if (!classNumber) {
          setSnackbar({
            open: true,
            message: "❌ Không xác định được lớp của học sinh!",
            severity: "error",
          });
          setLoading(false);
          return;
        }

        const classLabel = `Lớp ${classNumber}`;

        // ================= TÌM ĐỀ =================
        const deThiSnap = await getDocs(collection(db, "DETHI"));
        const matchedDoc = deThiSnap.docs.find(d =>
          d.id.includes(classLabel)
        );

        if (!matchedDoc) {
          setSnackbar({
            open: true,
            message: `❌ Không tìm thấy đề kiểm tra ${classLabel}!`,
            severity: "warning",
          });
          setLoading(false);
          return;
        }

        docId = matchedDoc.id;

        // ================= FIREBASE =================
        const docSnap = await getDoc(doc(db, collectionName, docId));

        if (!docSnap.exists()) {
          setSnackbar({
            open: true,
            message: "❌ Không tìm thấy đề trắc nghiệm!",
            severity: "error",
          });
          setLoading(false);
          return;
        }

        const data = docSnap.data();

        // ================= INFO =================
        setQuizClass(data.class || "");

        const hocKi = data.semester || hocKiFromConfig;
        const monHoc = data.subject || "";

        setHocKi(hocKi);
        setMonHoc(monHoc);

        window.currentHocKi = hocKi;
        window.currentMonHoc = monHoc;

        // ================= TIME =================
        setTimeLeft(timeLimitMinutes * 60);

        // ================= COLUMN RATIO =================
        const defaultRatio = { left: 1, right: 1 };

        const columnRatio =
          data.columnRatio &&
          typeof data.columnRatio === "object"
            ? {
                left: Number(data.columnRatio.left) || 1,
                right: Number(data.columnRatio.right) || 1,
              }
            : defaultRatio;

        setColumnRatio?.(columnRatio);
        window.currentColumnRatio = columnRatio;

        // ================= QUESTIONS =================
        // ⭐ Đảo thứ tự câu hỏi mỗi lần load
        const shuffledQuestions = shuffleArray([...data.questions]);

        // ⭐ Build runtime (shuffle option bên trong)
        const runtimeQuestions = buildRuntimeQuestions(shuffledQuestions);

        setQuestions(runtimeQuestions);
        setProgress(100);
        setStarted(true);

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
      case "Cả năm": return "CN";
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
  //console.log("🔎 Tổng điểm đề (maxScore):", maxScore);

  const currentQuestion = questions[currentIndex] || null;
  const isEmptyQuestion = currentQuestion?.question === "";

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const handleCloseSnackbar = (event, reason) => { if (reason === "clickaway") return; setSnackbar(prev => ({ ...prev, open: false })); };

  const handleSubmit = () =>
    handleSubmitQuiz({
      studentName,
      studentClass,
      studentInfo,
      setStudentResult,
      setSnackbar,
      setSaving,
      setSubmitted,
      setOpenAlertDialog,
      setUnansweredQuestions,
      setOpenResultDialog,
      questions,
      answers,
      startTime,
      db,
      config,
      getQuestionMax,
      capitalizeName,
      formatTime,
      xuatFileBaiLam: true,
      exportQuizPDF,
  });


const autoSubmit = () => {
  autoSubmitQuiz({
    studentName,
    studentClass,
    studentId,
    studentInfo,
    questions,
    answers,
    startTime,
    db,
    config,
    configData,
    selectedWeek,
    getQuestionMax,

    // state setters
    setSnackbar,
    setSaving,
    setSubmitted,
    setOpenResultDialog,
    setStudentResult,

    // hàm utils
    capitalizeName,
    mapHocKyToDocKey,
    formatTime,
    xuatFileBaiLam: true,
    exportQuizPDF,
  });
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
  const { source, destination } = result;
  if (!destination) return;

  setQuestions((prev) => {
    const updated = [...prev];
    const q = updated[currentIndex];

    let filled = q.filled ? [...q.filled] : [];
    let available = q.availableWords ? [...q.availableWords] : [...(q.shuffledOptions || q.options)];

    /* ===== KÉO TỪ WORDS → BLANK ===== */
    if (source.droppableId === "words" && destination.droppableId.startsWith("blank-")) {
      const blankIndex = Number(destination.droppableId.split("-")[1]);
      const optionObj = available[source.index];
      const wordText = typeof optionObj === "string" ? optionObj : optionObj?.text ?? "";

      while (filled.length <= blankIndex) filled.push("");
      filled[blankIndex] = wordText;

      // xoá từ khỏi availableWords
      available.splice(source.index, 1);
    }

    /* ===== KÉO TỪ BLANK → WORDS ===== */
    if (destination.droppableId === "words" && source.droppableId.startsWith("blank-")) {
      const blankIndex = Number(source.droppableId.split("-")[1]);
      const wordText = filled[blankIndex];
      filled[blankIndex] = "";

      // thêm lại từ vào availableWords
      if (wordText) available.push(wordText);
    }

    updated[currentIndex] = { ...q, filled, availableWords: available };

    setAnswers((prevAns) => ({
      ...prevAns,
      [q.id]: filled,
    }));

    return updated;
  });
};

const showNotFoundDialog = (msg) => {
  setDialogMessage(msg);
  setDialogMode("notFound");
  setOpenResultDialog(true);
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
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{ color: "#1976d2", mb: { xs: 1, sm: -1 }, textAlign: "center" }}
        >
          {loading
            ? "TRẮC NGHIỆM"
            : config?.baiTapTuan
            ? "TRẮC NGHIỆM"
            : config?.kiemTraDinhKi && hocKiDisplay && monHocDisplay
            ? `KTĐK ${hocKiDisplay.toUpperCase()} - ${monHocDisplay.toUpperCase()}`
            : "TRẮC NGHIỆM"}
        </Typography>

        {/* Đồng hồ với vị trí cố định */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mt: 0.5,
            mb: -2,
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
                    maxHeight: 300,
                    objectFit: "contain",
                    borderRadius: 8
                  }}
                />
              </Box>
            )}

            {/* ================RENDER CÂU HỎI=================== */}
            {renderQuestionByType({
              currentQuestion,
              answers,
              submitted,
              started,
              choXemDapAn,
              handleSingleSelect,
              handleMultipleSelect,
              setAnswers,
              reorder,
              handleDragEnd,
            })}
          
          </Box>
        )}

        {/* Nút điều hướng luôn cố định ở đáy Paper */}
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

        {notFoundMessage && (
          <Card
            sx={{
              bgcolor: "#ffebee",
              border: "1px solid #f44336",
              p: 2,
              mb: 2,
              width: "60%",    // chiếm 50% chiều rộng
              mx: "auto",      // căn giữa ngang
              mt: 4            // optional: thêm khoảng cách từ trên
            }}
          >
            <Typography
              sx={{ color: "#d32f2f", fontWeight: "bold", fontSize: "1.5rem", textAlign: "center" }}
            >
              {notFoundMessage}
            </Typography>
          </Card>
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
                const status = getQuestionStatus({
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

            <Button
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
            </Button>
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

      {/* Dialog xáchiển thị kết quả */}
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
