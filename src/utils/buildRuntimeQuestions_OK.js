function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildRuntimeQuestions(rawQuestions = []) {
  const saved = shuffleArray([...rawQuestions]);

  const loadedQuestions = saved
    .map((q, index) => {
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
        if (!pairs.length) return null;

        const leftOptions = pairs.map((p, idx) => {
          if (p.leftImage?.url) {
            return {
              type: "image",
              url: p.leftImage.url,
              name: p.leftImage.name || `img-${idx}`,
            };
          }

          if (typeof p.left === "string" && /^https?:\/\//i.test(p.left)) {
            return {
              type: "image",
              url: p.left,
              name: `img-${idx}`,
            };
          }

          return p.left ?? "";
        });

        const rightOriginal = pairs.map((p, idx) => ({
          opt: p.right,
          idx,
        }));

        // 🔥 FIX: shuffle luôn
        const processedRight = shuffleArray(rightOriginal);

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
          Array.isArray(q.options) && q.options.length
            ? [...q.options]
            : ["", "", "", ""];

        const indexed = options.map((opt, idx) => ({ opt, idx }));

        const processed = shuffleArray(indexed);

        return {
          ...q,
          id: questionId,
          type,
          question: questionText,
          image: q.image ?? null,

          options: processed.map(i => i.opt),
          initialSortOrder: processed.map(i => i.idx),
          correctTexts: options,

          score: q.score ?? 1,
        };
      }

      // ================= SINGLE / MULTIPLE =================
      if (type === "single" || type === "multiple") {
        // ===== CHUẨN HOÁ OPTIONS =====
        const options =
          Array.isArray(q.options) && q.options.length
            ? q.options.map(opt => {
                if (typeof opt === "string") {
                  if (/^https?:\/\/.*\.(png|jpg|jpeg|gif)$/i.test(opt)) {
                    return { text: "", image: opt };
                  }
                  return { text: opt, image: null };
                }
                return {
                  text: opt?.text ?? "",
                  image: opt?.image ?? null,
                };
              })
            : [
                { text: "", image: null },
                { text: "", image: null },
                { text: "", image: null },
                { text: "", image: null },
              ];

        // ===== GẮN INDEX GỐC =====
        const indexed = options.map((opt, idx) => ({
          opt,
          idx, // index gốc
        }));

        // ===== SHUFFLE =====
        const shouldShuffle =
          q.sortType === "shuffle" || q.shuffleOptions === true;

        const processed = shouldShuffle
          ? shuffleArray(indexed)
          : indexed;

        // ===== OPTIONS SAU SHUFFLE =====
        const shuffledOptions = processed.map(i => i.opt);

        // ===== CHUẨN HOÁ CORRECT GỐC =====
        const correctRaw = Array.isArray(q.correct)
          ? q.correct.map(Number)
          : typeof q.correct === "number"
          ? [Number(q.correct)]
          : [];

        // ===== 🔥 REMAP CORRECT SAU SHUFFLE =====
        const newCorrect = processed
          .map((item, newIdx) =>
            correctRaw.includes(item.idx) ? newIdx : null
          )
          .filter(v => v !== null);

        return {
          ...q,
          id: questionId,
          type,
          question: questionText,
          image: q.image ?? null,

          // 👉 options đã shuffle đúng
          options: shuffledOptions,

          // 👉 lưu lại mapping nếu cần debug
          displayOrder: processed.map(i => i.idx),

          // 👉 correct đã FIX
          correct: newCorrect,

          score: q.score ?? 1,
        };
      }

      // ================= IMAGE =================
      // ================= IMAGE =================
      if (type === "image") {
        const options =
          Array.isArray(q.options) && q.options.length
            ? q.options
            : ["", "", "", ""];

        // Gắn index gốc
        const indexed = options.map((opt, idx) => ({ opt, idx }));

        // Shuffle
        const processed = shuffleArray(indexed);

        // Remap correct
        const correctRaw = Array.isArray(q.correct)
          ? q.correct.map(Number)
          : [];

        const newCorrect = processed
          .map((item, newIdx) =>
            correctRaw.includes(item.idx) ? newIdx : null
          )
          .filter(v => v !== null);

        return {
          ...q,
          id: questionId,
          type,
          question: questionText,
          image: q.image ?? null,

          // ⭐ OPTIONS ĐÃ SHUFFLE
          options: processed.map(i => i.opt),

          // ⭐ CORRECT ĐÃ REMAP
          correct: newCorrect,

          score: q.score ?? 1,
        };
      }

      // ================= TRUE/FALSE =================
      if (type === "truefalse") {
        const options =
          Array.isArray(q.options) && q.options.length >= 2
            ? [...q.options]
            : ["Đúng", "Sai"];

        const indexed = options.map((opt, idx) => ({ opt, idx }));
        const processed = shuffleArray(indexed);

        return {
          ...q,
          id: questionId,
          type,
          question: questionText,
          image: q.image ?? null,

          options: processed.map(i => i.opt),
          initialOrder: processed.map(i => i.idx),

          correct: Array.isArray(q.correct)
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

          options,
          shuffledOptions: shuffleArray([...options]),

          score: q.score ?? 1,
        };
      }

      return null;
    })
    .filter(Boolean); // 🔥 quan trọng: loại null

  return loadedQuestions;
}