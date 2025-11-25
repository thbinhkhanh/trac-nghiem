import { jsPDF } from "jspdf";
import "../fonts/DejaVuSans-normal.js"; // font tiếng Việt

// Convert URL ảnh sang base64
async function getBase64FromUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// Hàm làm tròn điểm giống UI
const convertPercentToScore = (percent) => {
  if (percent === undefined || percent === null) return "?";
  const raw = percent / 10; // quy ra thang điểm 10
  const decimal = raw % 1;
  if (decimal < 0.25) return Math.floor(raw);
  if (decimal < 0.75) return Math.floor(raw) + 0.5;
  return Math.ceil(raw);
};

const capitalizeName = (name) => {
  if (!name) return "";
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)           // tách theo khoảng trắng
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const exportQuizPDF = async (studentInfo, quizClass, questions, answers, total, durationStr, quizTitle ) => {                  
  const pdf = new jsPDF("p", "mm", "a4");
  const margin = 15;
  const lineHeight = 7;
  const lineSpacing = lineHeight * 1.5;
  let y = margin;

  pdf.setFont("DejaVuSans", "normal");

  // ===== HEADER (khung bảng 2 cột) =====
  pdf.setFontSize(12);
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.5);

  const boxHeight = lineSpacing * 4; // tăng chút để thêm trường
  const pageWidth = pdf.internal.pageSize.getWidth();
  pdf.rect(margin, y, pageWidth - 2 * margin, boxHeight);

  // Nội dung cột trái (xanh dương)
  pdf.setTextColor(0, 0, 255);

  // Thêm trường
  if (studentInfo.school) {
    pdf.text(`Trường: ${studentInfo.school}`, margin + 5, y + lineSpacing);
  }

  pdf.text(`Họ tên: ${capitalizeName(studentInfo.name)}`, margin + 5, y + lineSpacing * 2);
  pdf.text(`Lớp: ${studentInfo.class}`, margin + 5, y + lineSpacing * 3);

  // Tính điểm thang 10
  const maxScore = questions.reduce((sum, q) => sum + (q.score ?? 1), 0);
  const percent = maxScore > 0 ? (total / maxScore) * 100 : 0;

  // Nội dung cột phải
  const currentDate = new Date();
  const datePart = currentDate.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  const timePart = currentDate.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" });
  const vnTime = `${datePart} ${timePart}`;

  pdf.text(`Ngày: ${vnTime}`, pageWidth / 2 + 10, y + lineSpacing);
  if (durationStr) {
    pdf.text(`Thời gian: ${durationStr}`, pageWidth / 2 + 10, y + lineSpacing * 2);
  }
  pdf.setTextColor(255, 0, 0);
  pdf.text(`Kết quả: ${total} điểm`, pageWidth / 2 + 10, y + lineSpacing * 3);

  // Tiêu đề căn giữa dưới khung
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 255);

  const titleY = y + boxHeight + lineSpacing;
  // Tiêu đề PDF mới
  pdf.text(
    quizTitle,
    pageWidth / 2,
    titleY,
    { align: "center" }
  );

  pdf.setTextColor(0, 0, 0);
  y += boxHeight + lineSpacing * 2;

  // ===== NỘI DUNG CÂU HỎI =====
  pdf.setFontSize(12);
for (let index = 0; index < questions.length; index++) {
  const q = questions[index];
  if (y > 250) { pdf.addPage(); y = margin; }

  // Câu hỏi
  const questionLines = pdf.splitTextToSize(`Câu ${index + 1}: ${q.question}`, pageWidth - 2 * margin);
  pdf.text(questionLines, margin, y);
  y += questionLines.length * lineHeight;

  switch(q.type) {
    case "single":
      q.options.forEach((opt, i) => {
        const selected = answers[q.id] === i ? "(●)" : "( )";
        const correctArray = Array.isArray(q.correct) ? q.correct : [q.correct];
        const isCorrect = answers[q.id] === i && correctArray.includes(i);

        const optionLines = pdf.splitTextToSize(`${selected} ${opt}`, pageWidth - 2 * margin - 10);
        pdf.text(optionLines, margin + 5, y);

        if (answers[q.id] === i) {
          if (isCorrect) {
            pdf.setTextColor(0, 128, 0);
            pdf.text("✓", margin + 150, y);
          } else {
            pdf.setTextColor(255, 0, 0);
            pdf.text("✗", margin + 150, y);
          }
          pdf.setTextColor(0, 0, 0);
        }
        y += optionLines.length * lineHeight;
      });
      break;

    case "multiple":
      q.options.forEach((opt, i) => {
        const selected = (answers[q.id] || []).includes(i) ? "[x]" : "[ ]";
        const correctArray = Array.isArray(q.correct) ? q.correct : [q.correct];
        const isCorrect = (answers[q.id] || []).includes(i) && correctArray.includes(i);

        const optionLines = pdf.splitTextToSize(`${selected} ${opt}`, pageWidth - 2 * margin - 10);
        pdf.text(optionLines, margin + 5, y);

        if ((answers[q.id] || []).includes(i)) {
          if (isCorrect) {
            pdf.setTextColor(0, 128, 0);
            pdf.text("✓", margin + 150, y);
          } else {
            pdf.setTextColor(255, 0, 0);
            pdf.text("✗", margin + 150, y);
          }
          pdf.setTextColor(0, 0, 0);
        }
        y += optionLines.length * lineHeight;
      });
      break;

    case "truefalse":
      q.options.forEach((opt, i) => {
        const selected = (answers[q.id] || [])[i] || "";
        const isCorrect = selected === q.correct[i];

        const optionLines = pdf.splitTextToSize(`[${selected}] ${opt}`, pageWidth - 2 * margin - 10);
        pdf.text(optionLines, margin + 5, y);

        if (selected) {
          if (isCorrect) {
            pdf.setTextColor(0, 128, 0);
            pdf.text("✓", margin + 150, y);
          } else {
            pdf.setTextColor(255, 0, 0);
            pdf.text("✗", margin + 150, y);
          }
          pdf.setTextColor(0, 0, 0);
        }
        y += optionLines.length * lineHeight;
      });
      break;

    case "matching":
      const ans = answers[q.id] || [];
      q.leftOptions.forEach((left, i) => {
        const rightIdx = ans[i];
        const right = rightIdx !== undefined ? q.rightOptions[rightIdx] : "?";
        const isCorrect = rightIdx === q.correct[i];

        const line = pdf.splitTextToSize(`${left} → ${right}`, pageWidth - 2 * margin - 10);
        pdf.text(line, margin + 5, y);

        if (rightIdx !== undefined) {
          if (isCorrect) {
            pdf.setTextColor(0, 128, 0);
            pdf.text("✓", margin + 150, y);
          } else {
            pdf.setTextColor(255, 0, 0);
            pdf.text("✗", margin + 150, y);
          }
          pdf.setTextColor(0, 0, 0);
        }
        y += line.length * lineHeight;
      });
      break;

    case "sort":
      const userOrder = answers[q.id] || [];
      userOrder.forEach((idx, i) => {
        const isCorrect = idx === q.correct[i];
        const line = pdf.splitTextToSize(`${i + 1}. ${q.options[idx]}`, pageWidth - 2 * margin - 10);
        pdf.text(line, margin + 5, y);

        if (userOrder.length > 0) {
          if (isCorrect) {
            pdf.setTextColor(0, 128, 0);
            pdf.text("✓", margin + 150, y);
          } else {
            pdf.setTextColor(255, 0, 0);
            pdf.text("✗", margin + 150, y);
          }
          pdf.setTextColor(0, 0, 0);
        }
        y += line.length * lineHeight;
      });
      break;

    case "image":
      let x = margin + 5;
      const imgSize = 25;
      for (let i = 0; i < q.options.length; i++) {
        const imgUrl = q.options[i];
        const selected = (answers[q.id] || []).includes(i) ? "[x]" : "[ ]";
        const correctArray = Array.isArray(q.correct) ? q.correct : [q.correct];
        const isCorrect = (answers[q.id] || []).includes(i) && correctArray.includes(i);

        const line = pdf.splitTextToSize(`${selected} Hình ${i + 1}`, pageWidth - 2 * margin - 10);
        pdf.text(line, x, y);

        if ((answers[q.id] || []).includes(i)) {
          if (isCorrect) {
            pdf.setTextColor(0, 128, 0);
            pdf.text("✓", x + imgSize, y);
          } else {
            pdf.setTextColor(255, 0, 0);
            pdf.text("✗", x + imgSize, y);
          }
          pdf.setTextColor(0, 0, 0);
        }

        try {
          const imgBase64 = await getBase64FromUrl(imgUrl);
          pdf.addImage(imgBase64, "JPEG", x, y + 5, imgSize, imgSize);
        } catch (e) {
          pdf.text("(Không tải được ảnh)", x, y + 5);
        }

        x += imgSize + 20;
      }
      y += imgSize + 20;
      break;

    default:
      const defaultLine = pdf.splitTextToSize("Loại câu hỏi không hỗ trợ", pageWidth - 2 * margin - 10);
      pdf.text(defaultLine, margin + 5, y);
      y += defaultLine.length * lineHeight;
  }

  y += 2;
}

  // ===== LƯU FILE =====

  // Tạo mã số duy nhất từ thời gian (hhmmssms)
const now = new Date();
const hh = String(now.getHours()).padStart(2, "0");
const mm = String(now.getMinutes()).padStart(2, "0");
const ss = String(now.getSeconds()).padStart(2, "0");
const ms = String(now.getMilliseconds()).padStart(3, "0");
const code = `${hh}${mm}${ss}${ms}`;

// Ghép tên file: Lớp_HọTên_Code.pdf
const safeName = capitalizeName(studentInfo.name).replace(/\s+/g, "_");
const fileName = `${studentInfo.class}_${safeName}_${code}.pdf`;

pdf.save(fileName);
};