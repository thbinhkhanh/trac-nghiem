import React, { useState, useEffect } from "react";

// =========================
// MUI COMPONENTS
// =========================
import {
  Box,
  Typography,
  Card,
  Stack,
  IconButton,
  Button,
  Snackbar,
  Alert,
  MenuItem,
  InputLabel,
  Checkbox,
  FormControl,
  Select,
} from "@mui/material";

// =========================
// ICONS
// =========================
import {
  ChevronRight,
  ChevronLeft,
} from "@mui/icons-material";

// =========================
// FIREBASE
// =========================
import {
  collection,
  getDoc,
  getDocs,
  deleteDoc,
  setDoc,
  doc,
} from "firebase/firestore";

import { db } from "../firebase";

// =========================
// CONTEXT
// =========================
import { useContext } from "react";
import { ConfigContext } from "../context/ConfigContext";

// =========================
// DIALOGS
// =========================
import DeleteExamDialog from "../dialog/DeleteExamDialog";

// =========================
// UTILITIES
// =========================
//import { exportWordFile } from "../utils/exportWordFile";
import { exportQuestionsToWord } from "../utils/exportQuizWORD";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export default function DeThi() {
 // =========================
  // ACCOUNT
  // =========================
  const account = localStorage.getItem("account") || "";

  // =========================
  // STATE - EXAM DATA
  // =========================
  const [examList, setExamList] = useState([]);
  const [selectedExam, setSelectedExam] = useState([]);
  const [pendingSelectedExam, setPendingSelectedExam] = useState(null);

  // =========================
  // STATE - DELETE EXAM
  // =========================
  const [selectedExamToDelete, setSelectedExamToDelete] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // =========================
  // STATE - COMBINE EXAMS
  // =========================
  const [selectedExamsToCombine, setSelectedExamsToCombine] = useState([]);
  const [selectedExamIds, setSelectedExamIds] = useState([]);

  const [onTapList, setOnTapList] = useState([]);

  const [hoveredExamId, setHoveredExamId] = useState(null);
  const [hoveredSelectedId, setHoveredSelectedId] = useState(null);
  const [hoveredOnTapId, setHoveredOnTapId] = useState(null);
  
  // =========================
  // STATE - SNACKBAR
  // =========================
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // =========================
  // CONTEXT
  // =========================
  const { config } = useContext(ConfigContext);

  // =========================
  // STATE - FILTER
  // =========================
  const [selectedYear, setSelectedYear] = useState(
    config?.namHoc || "2025-2026"
  );

  const getYearKey = (namHoc) => {
    if (!namHoc) return "";
    const [start, end] = namHoc.split("-");
    return `${start.slice(-2)}-${end.slice(-2)}`;
  };


  useEffect(() => {
    const fetchExams = async () => {
      try {
        const snap = await getDocs(collection(db, "NGANHANG_DE"));

        const yearKey = getYearKey(selectedYear);

        const list = snap.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
          }))
          .filter((ex) => ex.id.includes(yearKey));

        setExamList(list);
      } catch (err) {
        console.error("Lỗi lấy danh sách đề:", err);
      }
    };

    fetchExams();
  }, [selectedYear]);

  // Lấy danh sách đề đã chọn
  useEffect(() => {
    const fetchSelected = async () => {
      try {
        const snap = await getDocs(collection(db, "DETHI"));
        const list = snap.docs.map((d) => ({
          id: d.id,
          tenDe: d.data().name || d.id,
        }));

        setSelectedExam(list);
      } catch (err) {
        console.error("Lỗi lấy đề đã chọn:", err);
      }
    };

    fetchSelected();
  }, []);

  /*useEffect(() => {
    const fetchCombinedExams = async () => {
      try {
        const snap = await getDocs(collection(db, "TRACNGHIEM_ONTAP"));

        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setCombinedExams(list); // đổ vào state để hiển thị
      } catch (err) {
        console.error("Lỗi load đề kết hợp:", err);
      }
    };

    fetchCombinedExams();
  }, []);*/


  const addExamToFirestore = async (ex) => {
    try {
      await setDoc(doc(db, "DETHI", ex.id), { name: ex.tenDe || ex.id });
    } catch (err) {
      console.error("Lỗi lưu đề:", err);
    }
  };

  const removeExamFromFirestore = async (ex) => {
    try {
      await deleteDoc(doc(db, "DETHI", ex.id));
    } catch (err) {
      console.error("Lỗi xóa đề đã chọn:", err);
    }
  };

  const handleDeleteExam = () => {
    // Ưu tiên: đã chọn cụ thể -> đang hover -> danh sách kết hợp
    const target =
      selectedExamToDelete ||
      pendingSelectedExam ||
      selectedExamsToCombine[0];

    if (!target?.id) {
      setSnackbar({
        open: true,
        message: "Vui lòng chọn một đề để xóa!",
        severity: "warning",
      });
      return;
    }

    setSelectedExamToDelete(target);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteExam = async () => {
    try {
      await deleteDoc(doc(db, "NGANHANG_DE", selectedExamToDelete.id));

      setExamList((prev) => prev.filter((e) => e.id !== selectedExamToDelete.id));
      setSelectedExam((prev) => prev.filter((e) => e.id !== selectedExamToDelete.id));

      await removeExamFromFirestore(selectedExamToDelete);

      setSelectedExamToDelete(null);
      setOpenDeleteDialog(false);

      setSnackbar({ open: true, message: "🗑️ Đã xóa đề!", severity: "success" });
    } catch (err) {
      console.error("Lỗi xóa đề:", err);
      setSnackbar({
        open: true,
        message: `❌ Lỗi khi xóa đề: ${err.message}`,
        severity: "error",
      });
    }
  };

  const formatExportName = (examName = "") => {
    if (!examName) return "Đề thi";

    // ❌ bỏ (C), (A) nếu đã có ở cuối để tránh double
    let name = examName.replace(/\s*\([A-Z]\)\s*$/, "");

    name = name.replace(/^quiz_/i, "");

    const parts = name.split("_");

    const classPart = parts.find(p => /lớp/i.test(p)) || "";
    const classNumber = classPart.match(/\d+/)?.[0] || "";

    const subject =
      parts.find(
        p =>
          !/lớp/i.test(p) &&
          !/\d{2}-\d{2}/.test(p) &&
          !/\(.*\)/.test(p)
      ) || "Môn";

    const year = parts.find(p => /\d{2}-\d{2}/.test(p)) || "";

    const extra =
      parts.find(p => /cki|ckii|cn/i.test(p)) || "";

    const letterMatch = examName.match(/\(([A-Z])\)/);
    const letter = letterMatch ? letterMatch[1] : "";

    return `Đề ${subject} ${classNumber}${extra ? `_${extra}` : ""}${year ? `_${year}` : ""}${letter ? ` (${letter})` : ""}`
      .replace(/\s+/g, " ")
      .trim();
  };

  // ⭐ HÀM XUẤT FILE WORD ⭐
  const handleExportWord = async () => {
    if (selectedExamIds.length === 0) {
      setSnackbar({
        open: true,
        message: "Vui lòng tick chọn ít nhất một đề để xuất!",
        severity: "warning",
      });
      return;
    }

    try {
      const folder = "NGANHANG_DE";

      for (let examId of selectedExamIds) {
        const snap = await getDoc(doc(db, folder, examId));
        if (!snap.exists()) continue;

        const data = snap.data();
        const questions = Array.isArray(data.questions)
          ? data.questions
          : [];

        if (questions.length === 0) continue;

        // ⭐ dùng đúng hàm exportQuizWORD bạn cung cấp
        await exportQuestionsToWord(
          questions,
          formatExportName(data.tenDe || examId)
        );
      }

      setSnackbar({
        open: true,
        message: `📄 Đã xuất ${selectedExamIds.length} đề Word!`,
        severity: "success",
      });

    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "❌ Lỗi khi xuất file Word",
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

    // 3. Tìm lớp
    const classPart = parts.find(p => p.toLowerCase().includes("lớp")) || "";
    const classNumber = classPart.match(/\d+/)?.[0] || "";

    // 4. Tìm chỉ số lớp trong mảng để lấy môn
    const classIndex = parts.indexOf(classPart);

    // 5. Tìm môn: phần ngay sau lớp (hoặc phần đầu nếu lớp là đầu)
    let subjectPart = "";
    for (let i = classIndex + 1; i < parts.length; i++) {
      // bỏ qua CKI, CKII, CN, năm học cuối, chỉ lấy môn
      const p = parts[i];
      if (!p.toLowerCase().includes("cki") && !p.toLowerCase().includes("cn") && !/\d{2}-\d{2}/.test(p)) {
        subjectPart = p;
        break;
      }
    }

    // 6. Tìm phần mở rộng (CKI/CKII/CN) sau môn và lớp
    let extraPart = "";
    for (let i = classIndex + 1; i < parts.length; i++) {
      const p = parts[i];
      if (p.toLowerCase().includes("cki") || p.toLowerCase() === "cn") {
        extraPart = p.toUpperCase();
        break;
      }
    }

    // 7. Tìm ký hiệu đề (A, B, ...) trong ngoặc
    const match = examName.match(/\(([^)]+)\)/);
    const examLetter = match ? match[1] : "";

    // 8. Kết hợp lại
    return `${subjectPart} ${classNumber}${extraPart ? ` - ${extraPart}` : ""} ${examLetter ? `(${examLetter})` : ""}`.trim();
  };

  const yearKey = getYearKey(selectedYear);
  const filteredSelectedExam = selectedExam.filter(ex =>
    ex.id.includes(yearKey)
  );

  // Hàm sort đề thi sau khi format tên, theo regex
  const sortExamList = (list) => {
    return [...list].sort((a, b) => {
      const regex = /(Công nghệ|Tin học) (\d+)(?: - (CKI|CKII|CN))? ?\(?([A-Z])?\)?/i;

      const titleA = formatExamTitle(a.tenDe || a.id);
      const titleB = formatExamTitle(b.tenDe || b.id);

      const matchA = titleA.match(regex);
      const matchB = titleB.match(regex);

      if (!matchA || !matchB) return 0;

      const [_, subjectA, classA, extraA, letterA] = matchA;
      const [__, subjectB, classB, extraB, letterB] = matchB;

      // 1️⃣ Sắp môn: Công nghệ trước Tin học
      const subjectOrder = ["Công nghệ", "Tin học"];
      const indexA = subjectOrder.indexOf(subjectA);
      const indexB = subjectOrder.indexOf(subjectB);
      if (indexA !== indexB) return indexA - indexB;

      // 2️⃣ Sắp lớp
      if (parseInt(classA) !== parseInt(classB)) return parseInt(classA) - parseInt(classB);

      // 3️⃣ Sắp CKI < CKII < CN
      const extraOrder = ["CKI", "CKII", "CN"];
      const eA = extraOrder.indexOf(extraA || "") === -1 ? 99 : extraOrder.indexOf(extraA || "");
      const eB = extraOrder.indexOf(extraB || "") === -1 ? 99 : extraOrder.indexOf(extraB || "");
      if (eA !== eB) return eA - eB;

      // 4️⃣ Sắp chữ cái đề
      return (letterA || "").localeCompare(letterB || "");
    });
  };

  useEffect(() => {
    const fetchOnTap = async () => {
      try {
        const snap = await getDocs(collection(db, "DE_ONTAP"));

        const yearKey = getYearKey(selectedYear);

        const list = snap.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
          }))
          .filter((ex) => ex.id.includes(yearKey));

        setOnTapList(list);
      } catch (err) {
        console.error("Lỗi lấy đề ôn tập:", err);
      }
    };

    fetchOnTap();
  }, [selectedYear]);

  const handleCreateOnTap = async () => {
    if (selectedExamsToCombine.length === 0) {
      setSnackbar({
        open: true,
        message: "Chưa chọn đề!",
        severity: "warning",
      });
      return;
    }

    try {
      const docId = `ONTAP_${Date.now()}`;

      const docData = {
        createdAt: Date.now(),
        exams: selectedExamsToCombine,
      };

      await setDoc(doc(db, "DE_ONTAP", docId), docData);

      setOnTapList((prev) => [
        ...prev,
        { id: docId, ...docData },
      ]);

      setSnackbar({
        open: true,
        message: "Đã tạo đề ôn tập!",
        severity: "success",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOnTap = async (ex) => {
    try {
      await deleteDoc(doc(db, "DE_ONTAP", ex.id));

      setOnTapList((prev) =>
        prev.filter((x) => x.id !== ex.id)
      );

      setSnackbar({
        open: true,
        message: "Đã xóa đề ôn tập!",
        severity: "success",
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
  <Box
    sx={{
      minHeight: "100vh",
      background: "#f1f5f9",
      px: 2,
      py: 3,
      display: "flex",
      justifyContent: "center",
    }}
  >
    <Card
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: 800,
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        background: "#fff",
        boxShadow: "0 10px 35px rgba(0,0,0,0.06)",
      }}
    >
      {/* ===== HEADER ===== */}
      <Box
        sx={{
          px: 3,
          py: 1.6,
          background: "#1976d2",
          color: "#fff",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
            Quản lý đề kiểm tra
          </Typography>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: "#fff" }}>Năm học</InputLabel>

            <Select
              value={selectedYear}
              label="Năm học"
              onChange={(e) => setSelectedYear(e.target.value)}
              sx={{
                height: 40,
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.12)",
                borderRadius: "10px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.25)",
                },
                "& .MuiSvgIcon-root": { color: "#fff" },
              }}
            >
              <MenuItem value="2025-2026">2025-2026</MenuItem>
              <MenuItem value="2026-2027">2026-2027</MenuItem>
              <MenuItem value="2027-2028">2027-2028</MenuItem>
              <MenuItem value="2028-2029">2028-2029</MenuItem>
              <MenuItem value="2029-2030">2029-2030</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* ===== CONTENT ===== */}
      <Box sx={{ p: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          
          {/* ================= LEFT ================= */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ mb: 1.5, fontWeight: 700, fontSize: 16 }}>
              Ngân hàng đề
            </Typography>

            <Box sx={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
              <Box sx={{ maxHeight: 520, overflowY: "auto", p: 1.2 }}>
                {examList.length === 0 ? (
                  <Box sx={{ py: 8, textAlign: "center", color: "#94a3b8" }}>
                    <Typography fontWeight={600}>Chưa có đề kiểm tra</Typography>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {sortExamList(examList).map((ex) => {
                      const checked = selectedExamIds.includes(ex.id);

                      return (
                        <Box
                          key={ex.id}
                          onClick={() => {
                            setSelectedExamIds((prev) =>
                              prev.includes(ex.id)
                                ? prev.filter((id) => id !== ex.id)
                                : [...prev, ex.id]
                            );

                            setSelectedExamsToCombine((prev) => {
                              const has = prev.some((e) => e.id === ex.id);
                              return has
                                ? prev.filter((e) => e.id !== ex.id)
                                : [...prev, ex];
                            });
                          }}
                          sx={{
                            p: 1.4,
                            borderRadius: "12px",
                            border: checked ? "2px solid #1976d2" : "1px solid #e2e8f0",
                            bgcolor: checked ? "#f0f7ff" : "#fff",
                            position: "relative",
                            "&:hover .deleteIcon": { opacity: 1 },
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1.2}>
                            
                            <Checkbox checked={checked} size="small" />

                            <Typography sx={{ flex: 1, fontSize: 15 }}>
                              {formatExamTitle(ex.tenDe || ex.id)}
                            </Typography>

                            <IconButton
                              size="small"
                              onClick={async (e) => {
                                e.stopPropagation();

                                setSelectedExam((prev) =>
                                  prev.some((e2) => e2.id === ex.id)
                                    ? prev
                                    : [...prev, ex]
                                );

                                await addExamToFirestore(ex);
                              }}
                              sx={{ color: "#1976d2" }}
                            >
                              <ChevronRight />
                            </IconButton>

                            {/* ICON XÓA (ẩn/hiện) */}
                            <IconButton
                              className="deleteIcon"
                              size="small"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await deleteDoc(doc(db, "NGANHANG_DE", ex.id));
                                setExamList((prev) =>
                                  prev.filter((i) => i.id !== ex.id)
                                );
                              }}
                              sx={{
                                opacity: 0,
                                transition: ".2s",
                                color: "#ef4444",
                                position: "absolute",
                                right: 6,
                                top: "50%",
                                transform: "translateY(-50%)",
                              }}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleExportWord}
                sx={{
                  textTransform: "none",
                  borderRadius: "12px",
                  height: 44,
                  fontWeight: 700,
                }}
              >
                Xuất Word
              </Button>
            </Stack>
          </Box>

          {/* ================= RIGHT ================= */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ mb: 1.5, fontWeight: 700, fontSize: 16 }}>
              Đề thi học kỳ
            </Typography>

            <Box sx={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
              <Box sx={{ maxHeight: 520, overflowY: "auto", p: 1.2 }}>
                {filteredSelectedExam.length === 0 ? (
                  <Box sx={{ py: 8, textAlign: "center", color: "#94a3b8" }}>
                    <Typography fontWeight={600}>Chưa chọn đề</Typography>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {filteredSelectedExam.map((ex) => (
                      <Box
                        key={ex.id}
                        onMouseEnter={() => setPendingSelectedExam(ex)}
                        onMouseLeave={() => setPendingSelectedExam(null)}
                        sx={{
                          p: 1.4,
                          borderRadius: "12px",
                          position: "relative",
                          "&:hover .deleteIcon": { opacity: 1 },
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.2}>
                          <Typography sx={{ flex: 1, fontSize: 15 }}>
                            {formatExamTitle(ex.tenDe || ex.id)}
                          </Typography>

                          <IconButton
                            className="deleteIcon"
                            size="small"
                            onClick={async () => {
                              setSelectedExam((prev) =>
                                prev.filter((e) => e.id !== ex.id)
                              );

                              await removeExamFromFirestore(ex);
                            }}
                            sx={{
                              opacity: 0,
                              transition: ".2s",
                              color: "#ef4444",
                            }}
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Box>

            {/* ===== ĐỀ ÔN TẬP (GIỮ NGUYÊN KHUNG) ===== */}
            <Box sx={{ mt: 3 }}>
              <Typography sx={{ mb: 1, fontWeight: 700, fontSize: 16 }}>
                Đề ôn tập
              </Typography>

              <Box
                sx={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  overflow: "hidden",
                  bgcolor: "#fff",
                }}
              >
                <Box sx={{ maxHeight: 300, overflowY: "auto", p: 1.2 }}>
                  {onTapList.length === 0 ? (
                    <Typography sx={{ color: "#94a3b8", p: 2 }}>
                      Chưa có đề ôn tập
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {onTapList.map((ex) => (
                        <Box
                          key={ex.id}
                          sx={{
                            p: 1.2,
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box>
                            <Typography sx={{ fontSize: 14 }}>
                              {ex.id}
                            </Typography>
                          </Box>

                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteOnTap(ex)}
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Box>

              <Button
                variant="contained"
                color="success"
                sx={{ mt: 2, borderRadius: "10px" }}
                onClick={handleCreateOnTap}
              >
                Tạo đề ôn tập
              </Button>
            </Box>
          </Box>
        </Stack>
      </Box>
    </Card>

    {/* ===== SNACKBAR ===== */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={3000}
      onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert severity={snackbar.severity} variant="filled">
        {snackbar.message}
      </Alert>
    </Snackbar>
  </Box>
);
}
