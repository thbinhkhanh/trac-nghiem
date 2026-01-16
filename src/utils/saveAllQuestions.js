import { doc, setDoc } from "firebase/firestore";

export const saveAllQuestions = async ({
  questions,
  db,
  selectedClass,
  semester,
  schoolYear,
  examLetter,
  quizConfig,
  updateQuizConfig,
  setSnackbar,
  setIsEditingNewDoc,
}) => {
  try {
    /* =========================
       1. KIỂM TRA DỮ LIỆU CƠ BẢN
    ========================== */
    if (!selectedClass || !semester || !schoolYear) {
      throw new Error("Vui lòng chọn đầy đủ lớp, học kỳ và năm học");
    }

    const SUBJECT = "Tin học"; // ✅ MÔN CỐ ĐỊNH

    /* =========================
       2. HÀM UPLOAD ẢNH
    ========================== */
    const uploadImage = async (file) => {
      if (!(file instanceof File)) return file;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "tracnghiem_upload");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload",
        { method: "POST", body: formData }
      );

      if (!res.ok) throw new Error("Upload hình ảnh thất bại");

      const data = await res.json();
      return data.secure_url;
    };

    /* =========================
       3. CHUẨN HÓA OPTIONS
    ========================== */
    const normalizeOptions = async (options = []) =>
      Promise.all(
        options.map(async (opt) => {
          if (typeof opt === "string") {
            return { text: opt, formats: {}, image: "" };
          }

          if (opt && typeof opt === "object") {
            let imageUrl = opt.image;
            if (opt.image instanceof File) {
              imageUrl = await uploadImage(opt.image);
            }

            return {
              text: opt.text || "",
              formats: opt.formats || {},
              image: imageUrl || "",
            };
          }

          return { text: "", formats: {}, image: "" };
        })
      );

    /* =========================
       4. CHUẨN HÓA CÂU HỎI
    ========================== */
    const questionsToSave = [];

    for (const q of questions) {
      const updatedQ = { ...q };
      updatedQ.options = await normalizeOptions(q.options);

      switch (q.type) {
        case "image":
          updatedQ.correct = updatedQ.correct || [];
          break;
        case "matching":
          updatedQ.correct = q.pairs?.map((_, i) => i) || [];
          break;
        case "sort":
          updatedQ.correct = updatedQ.options.map((_, i) => i);
          break;
        case "single":
          updatedQ.correct = q.correct?.length ? q.correct : [0];
          break;
        case "multiple":
          updatedQ.correct = q.correct || [];
          break;
        case "truefalse":
          updatedQ.correct =
            q.correct?.length === updatedQ.options.length
              ? q.correct
              : updatedQ.options.map(() => "");
          break;
        case "fillblank":
          // Nếu đã có correct thì giữ nguyên, nếu chưa thì tạo từ options
          updatedQ.correct = q.correct?.length
            ? q.correct
            : updatedQ.options.map(opt => opt.text || "");
          break;
        default:
          updatedQ.correct = [];
      }

      questionsToSave.push(updatedQ);
    }

    /* =========================
       5. TẠO ID ĐỀ – CÓ MÔN TIN HỌC
    ========================== */
    const semesterMap = {
      "Giữa kỳ I": "GKI",
      "Cuối kỳ I": "CKI",
      "Giữa kỳ II": "GKII",
      "Cả năm": "CN",
    };

    const shortSchoolYear = (year) => {
      const [y1, y2] = year.split("-");
      return `${y1.slice(2)}-${y2.slice(2)}`;
    };

    const docId = `quiz_${selectedClass}_${SUBJECT}_${semesterMap[semester]}_${shortSchoolYear(
      schoolYear
    )}${examLetter ? ` (${examLetter})` : ""}`;

    /* =========================
       6. LƯU FIRESTORE
    ========================== */
    const quizRef = doc(db, "NGANHANG_DE", docId);

    await setDoc(quizRef, {
      class: selectedClass,
      subject: SUBJECT, // ✅ LUÔN CÓ MÔN
      semester,
      schoolYear,
      examLetter,
      questions: questionsToSave,
      updatedAt: Date.now(),
    });

    /* =========================
       7. CẬP NHẬT CONFIG CHUNG
    ========================== */
    await setDoc(
      doc(db, "CONFIG", "config"),
      {
        deTracNghiem: docId,
        //tenDe: docId,
      },
      { merge: true }
    );

    /* =========================
       8. CẬP NHẬT CONTEXT
    ========================== */
    const newDoc = {
      id: docId,
      class: selectedClass,
      subject: SUBJECT,
      semester,
      schoolYear,
      examLetter,
    };

    const existed = quizConfig.quizList?.some((d) => d.id === docId);
    if (!existed) {
      updateQuizConfig({
        quizList: [...(quizConfig.quizList || []), newDoc],
      });
    }

    /* =========================
       9. THÔNG BÁO
    ========================== */
    localStorage.setItem("teacherQuiz", JSON.stringify(questionsToSave));

    setSnackbar({
      open: true,
      message: "✅ Đã lưu đề thành công!",
      severity: "success",
    });

    setIsEditingNewDoc(false);
  } catch (err) {
    console.error("❌ Lỗi khi lưu đề:", err);
    setSnackbar({
      open: true,
      message: `❌ Lỗi khi lưu đề: ${err.message}`,
      severity: "error",
    });
  }
};
