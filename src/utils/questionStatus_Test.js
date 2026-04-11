export function getQuestionStatus_Test({
  question,
  userAnswer,
  submitted = false,
}) {
  /* ===============================
   * 1️⃣ CHƯA LÀM (CHỈ ÁP DỤNG KHI CHƯA NỘP)
   * =============================== */
  const isUnanswered = () => {
    if (userAnswer === undefined || userAnswer === null) return true;

    switch (question.type) {
      case "single":
        return userAnswer === "";

      case "multiple":
      case "image":
        return !Array.isArray(userAnswer) || userAnswer.length === 0;

      case "fillblank":
        return (
          !Array.isArray(userAnswer) ||
          userAnswer.every(v => !v || v.trim() === "")
        );

      case "sort":
        return !Array.isArray(userAnswer) || userAnswer.length === 0;

      case "matching": {
        if (!Array.isArray(userAnswer)) return true;

        // 🔥 chỉ coi là chưa làm nếu tất cả đều rỗng/null/undefined
        const empty = userAnswer.every(v =>
          v === undefined || v === null || v === ""
        );

        return empty;
      }

      case "truefalse": {
        const defaultOrder = question.options.map((_, i) => i);
        return (
          Array.isArray(userAnswer) &&
          JSON.stringify(userAnswer) === JSON.stringify(defaultOrder)
        );
      }

      default:
        return false;
    }
  };

  // 🔑 CHỈ coi là unanswered KHI CHƯA NỘP
  if (!submitted && isUnanswered()) return "unanswered";

  /* ===============================
   * 2️⃣ ĐÃ LÀM – CHƯA NỘP
   * =============================== */
  if (!submitted) return "answered";

  /* ===============================
   * 3️⃣ SAU KHI NỘP → ĐÚNG / SAI
   * =============================== */
  let isCorrect = false;

  switch (question.type) {
    case "single": {
      const ua = Number(userAnswer);
      isCorrect = Array.isArray(question.correct)
        ? question.correct.includes(ua)
        : question.correct === ua;
      break;
    }

    case "multiple":
    case "image": {
      const userSet = new Set(userAnswer);
      const correctSet = new Set(
        Array.isArray(question.correct)
          ? question.correct
          : [question.correct]
      );

      isCorrect =
        userSet.size === correctSet.size &&
        [...correctSet].every(v => userSet.has(v));
      break;
    }

    case "truefalse": {
      const ua = Array.isArray(userAnswer) ? userAnswer : [];
      const ca = Array.isArray(question.correct) ? question.correct : [];

      isCorrect =
        ua.length === ca.length &&
        ua.every((val, i) => {
          const originalIdx = question.initialOrder?.[i] ?? i;
          return val === ca[originalIdx];
        });
      break;
    }

    case "fillblank": {
      const ua = Array.isArray(userAnswer) ? userAnswer : [];
      const ca = question.options || [];

      isCorrect =
        ua.length === ca.length &&
        ca.every((opt, i) =>
          ua[i]?.trim().toLowerCase() ===
          opt.text?.trim().toLowerCase()
        );
      break;
    }

    case "sort": {
      const ua = Array.isArray(userAnswer) ? userAnswer : [];

      // 🔥 QUAN TRỌNG: chưa làm thì KHÔNG CHẤM
      if (ua.length === 0) {
        isCorrect = false;
        break;
      }

      const correctOrder = Array.isArray(question.correctOrder)
        ? question.correctOrder
        : [];

      const isSameOrder =
        correctOrder.length > 0 &&
        ua.length === correctOrder.length &&
        ua.every((v, i) => v === correctOrder[i]);

      if (isSameOrder) {
        isCorrect = true;
        break;
      }

      const userTexts = ua.map(i => question.options?.[i]);

      const correctTexts = Array.isArray(question.correctTexts)
        ? question.correctTexts
        : [];

      isCorrect =
        userTexts.length === correctTexts.length &&
        userTexts.every((t, i) => t === correctTexts[i]);

      break;
    }

    case "matching": {
      const ua = Array.isArray(userAnswer) ? userAnswer : [];
      const ca = Array.isArray(question.correct) ? question.correct : [];

      if (ua.length === 0) {
        isCorrect = false;
        break;
      }

      isCorrect =
        ua.length === ca.length &&
        ua.every((v, i) => v === ca[i]);

      break;
    }
  }

  return isCorrect ? "correct" : "wrong";
}