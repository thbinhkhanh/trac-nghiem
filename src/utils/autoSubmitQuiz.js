import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
//import { exportQuizPDF } from "./utils/exportQuizPDF";

export const autoSubmitQuiz = async ({
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
  answers,
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
}) => {
  try {
    if (studentName === "Test") {
      setSnackbar({
        open: true,
        message: "Đây là trang test",
        severity: "info",
      });
      return;
    }

    const kiemTraDinhKi = config?.kiemTraDinhKi === true;
    const hocKiConfig = configData.hocKy || "UNKNOWN";
    const hocKiKey = mapHocKyToDocKey(hocKiConfig);

    if (!studentClass || !studentName) {
      setSnackbar({
        open: true,
        message: "Thiếu thông tin học sinh",
        severity: "info",
      });
      return;
    }
    
    // --- Tính điểm ---
    setSaving(true);

    let total = 0;
    questions.forEach(q => {
      const rawAnswer = answers[q.id];

      if (q.type === "single") {
        const ua = Number(rawAnswer);
        if (Array.isArray(q.correct) ? q.correct.includes(ua) : q.correct === ua)
          total += q.score ?? 1;

      } else if (q.type === "multiple" || q.type === "image") {
        const userSet = new Set(Array.isArray(rawAnswer) ? rawAnswer : []);
        const correctSet = new Set(
          Array.isArray(q.correct) ? q.correct : [q.correct]
        );
        if (
          userSet.size === correctSet.size &&
          [...correctSet].every(x => userSet.has(x))
        )
          total += q.score ?? 1;

      } else if (q.type === "sort") {
        const defaultOrder = q.options.map((_, idx) => idx);
        const userOrder =
          Array.isArray(rawAnswer) && rawAnswer.length > 0
            ? rawAnswer
            : defaultOrder;

        const userTexts = userOrder.map(idx => q.options[idx]);
        const correctTexts = Array.isArray(q.correctTexts) ? q.correctTexts : [];

        const isCorrect =
          userTexts.length === correctTexts.length &&
          userTexts.every((t, i) => t === correctTexts[i]);

        if (isCorrect) total += q.score ?? 1;
      } else if (q.type === "matching") {
          const correctArray = Array.isArray(q.correct) ? q.correct : [];
          const userArray = Array.isArray(rawAnswer) ? rawAnswer : [];

          const isCorrect =
            userArray.length > 0 &&
            userArray.length === correctArray.length &&
            userArray.every((val, i) => val === correctArray[i]);

          if (isCorrect) total += q.score ?? 1;
        } else if (q.type === "truefalse") {
        const userArray = Array.isArray(rawAnswer) ? rawAnswer : [];
        const correctArray = Array.isArray(q.correct) ? q.correct : [];

        if (userArray.length === correctArray.length) {
          const isAllCorrect = userArray.every((val, i) => {
            const originalIdx = Array.isArray(q.initialOrder)
              ? q.initialOrder[i]
              : i;
            return val === correctArray[originalIdx];
          });
          if (isAllCorrect) total += q.score ?? 1;
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

    setSubmitted(true);

    // --- Tính thời gian ---
    const durationSec = (config?.timeLimit ?? configData?.timeLimit ?? 0) * 60;

    const durationStr = formatTime(durationSec);

    // --- PDF cho KTDK ---
    const hocKi = window.currentHocKi || "GKI";
    const monHoc = "Tin học";

    if (configData?.kiemTraDinhKi === true) {
      const quizTitle = `KTĐK ${hocKi.toUpperCase()} - ${monHoc.toUpperCase()}`;

      exportQuizPDF(
        studentInfo,
        studentInfo.className,
        questions,
        answers,
        total,
        durationStr,
        quizTitle
      );
    }

    // ===== HIỂN THỊ KẾT QUẢ =====
    setStudentResult({
      hoVaTen: capitalizeName(studentName),
      lop: studentClass,
      lyThuyet: total,
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
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

    const namHocKey = (config?.namHoc || "2025-2026").replace(/-/g, "_");

    const classKey = (studentClass || "")
      .replace(/\./g, "_")
      .replace(/\s+/g, "_");

    const studentDocId =
      String(studentId).startsWith("HS")
        ? normalizeName(studentName)
        : studentId;

    // =========================
    // MAP HỌC KỲ
    // =========================
    const hkMap = {
      "Giữa kỳ I": "gki",
      "Cuối kỳ I": "cki",
      "Giữa kỳ II": "gkii",
      "Cuối năm": "cn",
    };

    const hkKey = hkMap[configData?.hocKy || "Cuối kỳ I"] || "cki";

    // =========================
    // LOẠI BÀI (KTĐK / ÔN TẬP)
    // =========================
    const typeMap = {
      ktdk: "Ktdk",
      ontap: "Ontap",
    };

    const typeKey =
      typeMap[(configData?.examType || config?.examType || "").toLowerCase()] ||
      "Ktdk";

    // =========================
    // DOC ROOT MỚI
    // =========================
    const docRef = doc(
      db,
      `DATA_HOCSINH_${namHocKey}`,
      classKey,
      "STUDENTS",
      studentDocId
    );

    const docSnap = await getDoc(docRef);

    const ngayLam = new Date().toLocaleDateString("vi-VN");

    // =========================
    // DATA UPDATE THEO CẤU TRÚC MỚI
    // =========================
    const fieldPath = `${typeKey}.${hkKey}`;

    if (docSnap.exists()) {
      const oldData = docSnap.data();

      const oldScore = oldData?.[typeKey]?.[hkKey]?.lyThuyet ?? 0;

      const soLanLam =
        oldData?.[typeKey]?.[hkKey]?.soLanLam
          ? oldData[typeKey][hkKey].soLanLam + 1
          : 1;

      await updateDoc(docRef, {
        [`${fieldPath}.lyThuyet`]: total > oldScore ? total : oldScore,
        [`${fieldPath}.ngayKiemTra`]: ngayLam,
        [`${fieldPath}.thoiGianLamBai`]: durationStr,
        [`${fieldPath}.soLanLam`]: soLanLam,

        hoTen: capitalizeName(studentName),
        lop: studentClass,
        mon: "Tin học",
        updatedAt: Date.now(),
      });

    } else {
      await setDoc(docRef, {
        hoTen: capitalizeName(studentName),
        lop: studentClass,
        khoi: classKey.charAt(0), // nếu bạn cần khối
        mon: "Tin học",
        updatedAt: Date.now(),

        [typeKey]: {
          [hkKey]: {
            lyThuyet: total,
            ngayKiemTra: ngayLam,
            thoiGianLamBai: durationStr,
            soLanLam: 1,
            mucDat: "",
            nhanXet: "",
            thucHanh: "",
            tongCong: null,
          },
        },
      });
    }

  } catch (err) {
    console.error("❌ Lỗi khi lưu điểm:", err);
  } finally {
    setSaving(false);
  }
};

