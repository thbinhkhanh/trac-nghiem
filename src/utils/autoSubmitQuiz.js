import { doc, setDoc } from "firebase/firestore";

export const autoSubmitQuiz = async ({
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
  capitalizeName,
  formatTime,
  xuatFileBaiLam,
  exportQuizPDF,
  hocKi,
}) => {
  try {
    /* ===== KIỂM TRA THÔNG TIN ===== */
    if (!studentName || !studentClass) {
      setSnackbar({ open: true, message: "Thiếu thông tin học sinh", severity: "error" });
      return;
    }

    if (!hocKi) {
      setSnackbar({
        open: true,
        message: "❌ Thiếu học kỳ (hocKi)",
        severity: "error",
      });
      return;
    }

    const hocKiFinal = hocKi;
    const monHoc = "Tin học";

    /* ===== KIỂM TRA CÂU CHƯA LÀM ===== */
    /*const unanswered = questions.filter(q => {
      const a = answers[q.id];
      if (q.type === "single") return a === undefined || a === null || a === "";
      if (q.type === "multiple") return !Array.isArray(a) || a.length === 0;
      if (q.type === "image") {
        const isSingle = Array.isArray(q.correct) && q.correct.length === 1;
        if (isSingle) return a === undefined || a === null || a.length === 0;
        return !Array.isArray(a) || a.length === 0;
      }
      if (q.type === "truefalse")
        return !Array.isArray(a) || a.length !== q.options.length;
      if (q.type === "fillblank")
        return !Array.isArray(a) || a.some(v => !v);
      // 👉 sort và matching không coi là unanswered
      return false;
    });

    if (unanswered.length > 0) {
      setUnansweredQuestions(
        unanswered.map(q => questions.findIndex(i => i.id === q.id) + 1)
      );
      setOpenAlertDialog(true);
      return;
    }*/

    /* ===== TÍNH ĐIỂM ===== */
    setSaving(true);
    let total = 0;

    questions.forEach(q => {
      const rawAnswer = answers[q.id];

      if (q.type === "single") {
        const ua = Number(rawAnswer);
        const correctArr = Array.isArray(q.correct) ? q.correct : [q.correct];
        if (correctArr.includes(ua)) total += q.score ?? 1;
      }

      else if (q.type === "multiple") {
        const userSet = new Set(Array.isArray(rawAnswer) ? rawAnswer : []);
        const correctSet = new Set(Array.isArray(q.correct) ? q.correct : []);
        if (
          userSet.size === correctSet.size &&
          [...correctSet].every(x => userSet.has(x))
        ) {
          total += q.score ?? 1;
        }
      }

      // Chấm điểm (image)
      else if (q.type === "image") {
        // rawAnswer đã là index GỐC (theo options)
        const userIndexes = Array.isArray(rawAnswer)
          ? rawAnswer.map(Number)
          : [Number(rawAnswer)];

        const correctIndexes = Array.isArray(q.correct)
          ? q.correct.map(Number)
          : [];

        const userSet = new Set(userIndexes.filter(Number.isInteger));
        const correctSet = new Set(correctIndexes.filter(Number.isInteger));

        const isCorrect =
          userSet.size === correctSet.size &&
          [...correctSet].every(i => userSet.has(i));

        if (isCorrect) {
          total += q.score ?? 1;
        }
      }


      else if (q.type === "sort") {
        let userOrder = Array.isArray(rawAnswer) ? rawAnswer : [];
        const options = Array.isArray(q.options) ? q.options : [];
        const correctTexts = Array.isArray(q.correctTexts) ? q.correctTexts : [];

        // Nếu học sinh không trả lời → coi như giữ nguyên thứ tự ban đầu
        if (userOrder.length === 0) {
          userOrder = Array.isArray(q.initialSortOrder)
            ? q.initialSortOrder
            : options.map((_, idx) => idx);
        }
        
        const normalize = s =>
          String(typeof s === "object" && s !== null ? s.text ?? "" : s ?? "")
            .replace(/<[^>]*>/g, "")
            .trim()
            .toLowerCase();

        const userTexts = userOrder.map(idx => normalize(options[idx]));
        const correctNorm = correctTexts.map(normalize);

        const isCorrect =
          userTexts.length === correctNorm.length &&
          userTexts.every((t, i) => t === correctNorm[i]);

        if (isCorrect) total += q.score ?? 1;
      }

      else if (q.type === "matching") {
        let userAnswer = Array.isArray(rawAnswer) ? rawAnswer : [];
        const correct = Array.isArray(q.correct) ? q.correct : [];

        // Nếu học sinh không trả lời → coi như giữ nguyên thứ tự ban đầu
        if (userAnswer.length === 0) {
          userAnswer = correct.map((_, i) => i);
        }

        if (
          userAnswer.length === correct.length &&
          userAnswer.every((v, i) => v === correct[i])
        ) {
          total += q.score ?? 1;
        }
      }

      else if (q.type === "truefalse") {
        const userArray = Array.isArray(rawAnswer) ? rawAnswer : [];
        const correctArray = Array.isArray(q.correct) ? q.correct : [];

        if (userArray.length === correctArray.length) {
          const ok = userArray.every((val, i) => {
            const idx = q.initialOrder?.[i] ?? i;
            return val === correctArray[idx];
          });
          if (ok) total += q.score ?? 1;
        }
      }

      else if (q.type === "fillblank") {
        const user = Array.isArray(rawAnswer) ? rawAnswer : [];
        let correct = Array.isArray(q.correct) ? q.correct : [];

        const normalize = (v) =>
          String(v ?? "")
            .replace(/<[^>]*>/g, "")
            .trim()
            .toLowerCase();

        // 🔥 FIX INDEX (1-based → 0-based)
        if (correct.length && !isNaN(correct[0])) {
          correct = correct.map(i => {
            const opt = q.options?.[Number(i) - 1];
            return opt?.text ?? "";
          });
        }

        const isCorrect =
          user.length === correct.length &&
          user.every((v, i) => normalize(v) === normalize(correct[i]));

        if (isCorrect) {
          total += q.score ?? 1;
        }
      }
    });

    setSubmitted(true);

    /* ===== THỜI GIAN ===== */
    const durationSec = startTime
      ? Math.floor((Date.now() - startTime) / 1000)
      : 0;
    const durationStr = formatTime(durationSec);

    /* ===== XUẤT PDF (NẾU CÓ) ===== */
    if (xuatFileBaiLam) {
      const quizTitle = `KTĐK ${hocKiFinal.toUpperCase()} - ${monHoc.toUpperCase()}`;
      exportQuizPDF(
        studentInfo,
        studentClass,
        questions,
        answers,
        total,
        durationStr,
        quizTitle
      );
    }

    /* ===== KẾT QUẢ ===== */
    setStudentResult({
      hoVaTen: capitalizeName(studentName),
      lop: studentClass,
      diem: total,
    });
    setOpenResultDialog(true);

    /* ===== LƯU FIRESTORE ===== */
    const normalizeName = name =>
      name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .replace(/\s+/g, "_");

    const collectionRoot = "LAMVANBEN";
    const lop = studentClass;
    const docId = normalizeName(studentName);

    const docRef = doc(
      db,
      `${collectionRoot}/${hocKiFinal}/${lop}/${docId}`
    );

    await setDoc(
      docRef,
      {
        hoVaTen: capitalizeName(studentName),
        lop: studentClass,
        mon: monHoc,
        diem: total,
        thoiGianLamBai: durationStr,
        ngayKiemTra: new Date().toLocaleDateString("vi-VN"),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("❌ Lỗi khi lưu điểm:", err);
    setSnackbar({
      open: true,
      message: "❌ Lỗi khi lưu bài làm",
      severity: "error",
    });
  } finally {
    setSaving(false);
  }
};