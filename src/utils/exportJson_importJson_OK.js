export const exportQuestionsToJSON = ({
  questions,
  fileName = "de_trac_nghiem",
}) => {
  try {
    // Chuẩn hóa dữ liệu
    const exportData = questions.map((q, index) => ({
      id: q.id || index + 1,
      question: q.question || "",
      type: q.type,
      options: q.options || [],
      correct: q.correct || [],
    }));

    // Convert JSON
    const jsonString = JSON.stringify(exportData, null, 2);

    // Tạo file download
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}_${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);

    // Trả về success để component xử lý UI
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

          // Chuẩn hóa lại dữ liệu (giống export)
          const questions = jsonData.map((q, index) => ({
            id: q.id || index + 1,
            question: q.question || "",
            type: q.type || "single",
            options: q.options || [],
            correct: q.correct || [],
          }));

          resolve({ success: true, data: questions });
        } catch (parseErr) {
          resolve({
            success: false,
            error: "File JSON không hợp lệ",
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          error: "Không thể đọc file",
        });
      };

      reader.readAsText(file);
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
};