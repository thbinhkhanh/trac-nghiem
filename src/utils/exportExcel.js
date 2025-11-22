import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { saveAs } from 'file-saver';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const statusMap = { 
  "Hoàn thành tốt": "T", 
  "Hoàn thành": "H", 
  "Chưa hoàn thành": "C", 
  "": "" 
};

export const exportEvaluationToExcel = async (startWeek, endWeek) => {
  const rowsMap = {};
  let sttCounter = 1;

  // 🔹 Lấy dữ liệu từng tuần
  for (let week = startWeek; week <= endWeek; week++) {
    const docRef = doc(db, "DANHGIA", `tuan_${week}`);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) continue;

    const weekData = docSnap.data();

    // 🔹 Mỗi key là "{LỚP}.{MÃHS}" hoặc "4.5_CN.4070235011"
    for (const [key, info] of Object.entries(weekData)) {
      // Tách lớp và mã học sinh
      const parts = key.split(/[._]/); // xử lý cả dấu "." hoặc "_"
      const className = parts.slice(0, -1).join("."); // ghép lại phần đầu → tên lớp
      const maDinhDanh = parts[parts.length - 1]; // phần cuối → mã học sinh

      // 🔹 Nếu học sinh chưa có trong map thì thêm mới
      if (!rowsMap[maDinhDanh]) {
        rowsMap[maDinhDanh] = {
          STT: sttCounter++,
          "MÃ ĐỊNH DANH": maDinhDanh,
          "HỌ VÀ TÊN": info.hoVaTen || "",
          LỚP: className,
        };
      }

      // 🔹 Thêm trạng thái theo tuần
      rowsMap[maDinhDanh][`TUẦN ${week}`] = statusMap[info.status] || "";
    }
  }

  const rows = Object.values(rowsMap);

  // 🧾 Tạo workbook và worksheet
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Đánh giá");

  // 🔹 Header gồm các tuần
  const headerKeys = ["STT", "MÃ ĐỊNH DANH", "HỌ VÀ TÊN", "LỚP"];
  for (let week = startWeek; week <= endWeek; week++) {
    headerKeys.push(`TUẦN ${week}`);
  }

  const headerRow = sheet.addRow(headerKeys);

  // 🔹 Style header
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1976D2" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // 🔹 Ghi dữ liệu học sinh
  rows.forEach(row => {
    const dataRow = sheet.addRow(headerKeys.map(key => row[key] || ""));
    dataRow.eachCell((cell, colNumber) => {
      const key = headerKeys[colNumber - 1];
      cell.alignment = {
        horizontal: key === "HỌ VÀ TÊN" ? "left" : "center",
        vertical: "middle",
      };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // 🔹 Đặt độ rộng cột
  sheet.columns.forEach((column, index) => {
    const key = headerKeys[index];
    if (key === "STT" || key === "LỚP" || key.startsWith("TUẦN")) {
      column.width = 9;
    } else if (key === "MÃ ĐỊNH DANH") {
      column.width = 15;
    } else if (key === "HỌ VÀ TÊN") {
      column.width = 28.5;
    }
  });

  // 💾 Xuất file Excel
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `Đánh giá HS tuần ${startWeek} - ${endWeek}.xlsx`);
};
