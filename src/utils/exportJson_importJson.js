export const exportQuestionsToJSON = ({
  questions,
  fileName = "de_trac_nghiem",
}) => {
  try {
    // ✅ Chuẩn hóa FULL dữ liệu (KHÔNG làm mất field)
    const exportData = questions.map((q, index) => ({
      id: q.id || `q_${index + 1}`,

      // Nội dung
      question: q.question || "",
      questionImage: q.questionImage || "",

      // Loại câu hỏi
      type: q.type || "single",

      // Các field chung
      options: q.options || [],
      correct: q.correct || [],
      score: q.score ?? 0.5,

      // 🔥 SORT
      sortType: q.sortType || "fixed",

      // 🔥 MATCHING
      pairs: q.pairs || [],
      columnRatio: q.columnRatio || { left: 1, right: 1 },

      // 🔥 FILL BLANK
      answers: q.answers || [],

      // 🔥 TRUE/FALSE fallback
      // (để tránh mất dữ liệu nếu sau này mở rộng)
    }));

    const jsonString = JSON.stringify(exportData, null, 2);

    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}_${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);

    return { success: true };
  } catch (err) {
    console.error("Export JSON error:", err);
    return { success: false, error: err.message };
  }
};

export const importQuestionsFromJSON = (file) => {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);

          if (!Array.isArray(jsonData)) {
            throw new Error("JSON không đúng format");
          }

          const questions = jsonData.map((q, index) => {
            // 🔥 detect options dạng app1 (string)
            const isStringOptions =
              Array.isArray(q.options) &&
              typeof q.options[0] === "string";

            // 🔥 convert option → object nếu là string (ảnh/text)
            const normalizeOption = (opt) => {
              if (typeof opt === "object" && opt !== null) return opt;

              return {
                text: opt || "",
                image: "",
                formats: {},
              };
            };

            const base = {
              id: q.id || `q_${Date.now()}_${index}`,
              question: q.question || "",
              questionImage: q.questionImage || "",
              type: q.type || "single",

              // 🔥 CHỈ convert khi là string (app1)
              options: isStringOptions
                ? q.options.map(normalizeOption)
                : q.options || [],

              correct: q.correct || [],
              score: q.score ?? 0.5,
            };

            switch (q.type) {
              case "image":
                return {
                  ...base,
                  options: Array.from({ length: 4 }, (_, i) =>
                    normalizeOption(q.options?.[i])
                  ),
                  correct: Array.isArray(q.correct) ? q.correct : [],
                };

              case "truefalse":
                return {
                  ...base,
                  options: base.options?.length
                    ? base.options
                    : [
                        { text: "Đúng", image: "", formats: {} },
                        { text: "Sai", image: "", formats: {} },
                      ],
                  correct: q.correct?.length ? q.correct : ["Đúng"],
                };

              case "matching":
                return {
                  ...base,

                  // 🔥 convert cả left/right nếu là string (ảnh)
                  pairs: (q.pairs || []).map((p) => ({
                    left: normalizeOption(p.left),
                    right: normalizeOption(p.right),
                  })),

                  columnRatio: q.columnRatio || { left: 1, right: 1 },
                };

              case "sort":
                return {
                  ...base,
                  options: base.options?.length
                    ? base.options
                    : [
                        { text: "", image: "", formats: {} },
                        { text: "", image: "", formats: {} },
                        { text: "", image: "", formats: {} },
                        { text: "", image: "", formats: {} },
                      ],
                  correct:
                    q.correct?.length
                      ? q.correct
                      : q.options?.map((_, i) => i) || [],
                  sortType: q.sortType || "fixed",
                };

              case "fillblank":
                return {
                  ...base,
                  options: base.options || [],
                  answers: q.answers || [],
                };

              case "multiple":
              case "single":
              default:
                return {
                  ...base,
                  options: base.options?.length
                    ? base.options
                    : [
                        { text: "", image: "", formats: {} },
                        { text: "", image: "", formats: {} },
                        { text: "", image: "", formats: {} },
                        { text: "", image: "", formats: {} },
                      ],
                  correct: q.correct || [],
                };
            }
          });

          resolve({ success: true, data: questions });
        } catch (parseErr) {
          resolve({
            success: false,
            error: "❌ File JSON không hợp lệ hoặc sai cấu trúc",
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          error: "❌ Không thể đọc file",
        });
      };

      reader.readAsText(file);
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
};