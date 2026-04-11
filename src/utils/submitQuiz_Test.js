export const handleSubmitQuiz = async ({
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
  capitalizeName,
  formatTime,
  xuatFileBaiLam,
  exportQuizPDF,
}) => {
  try {
    const hocKi = window.currentHocKi || "Giữa kỳ I";
    const monHoc = "Tin học";

    /* ===== KIỂM TRA CÂU CHƯA LÀM ===== */
    const unanswered = questions.filter(q => {
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
      return false;
    });

    if (unanswered.length > 0) {
      setUnansweredQuestions(
        unanswered.map(q => questions.findIndex(i => i.id === q.id) + 1)
      );
      setOpenAlertDialog(true);
      return;
    }

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

      else if (q.type === "image") {
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

        if (isCorrect) total += q.score ?? 1;
      }

      else if (q.type === "sort") {
        let userOrder = Array.isArray(rawAnswer) ? rawAnswer : [];
        const options = Array.isArray(q.options) ? q.options : [];
        const correctTexts = Array.isArray(q.correctTexts) ? q.correctTexts : [];

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

        if (
          userTexts.length === correctNorm.length &&
          userTexts.every((t, i) => t === correctNorm[i])
        ) {
          total += q.score ?? 1;
        }
      }

      else if (q.type === "matching") {
        let userAnswer = Array.isArray(rawAnswer) ? rawAnswer : [];
        const correct = Array.isArray(q.correct) ? q.correct : [];

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
        const correct = Array.isArray(q.correct) ? q.correct : [];

        if (
          user.length === correct.length &&
          user.every((v, i) => String(v ?? "").trim() === String(correct[i] ?? "").trim())
        ) {
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

    /* ===== PDF ===== */
    if (xuatFileBaiLam) {
      const quizTitle = `KTĐK ${hocKi.toUpperCase()} - ${monHoc.toUpperCase()}`;

      exportQuizPDF(
        {}, // ❌ không còn studentInfo
        "", // ❌ không còn lớp
        questions,
        answers,
        total,
        durationStr,
        quizTitle
      );
    }

    /* ===== KẾT QUẢ ===== */
    setStudentResult({
      diem: total,
    });

    setOpenResultDialog(true);

  } catch (err) {
    console.error("❌ Lỗi khi xử lý bài làm:", err);
    setSnackbar({
      open: true,
      message: "❌ Lỗi khi nộp bài",
      severity: "error",
    });
  } finally {
    setSaving(false);
  }
};