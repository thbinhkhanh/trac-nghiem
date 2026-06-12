import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportKTDK = async (students, className, term = "CKI", subject = "Tin học", namHoc) => {
  if (!students || students.length === 0) {
    alert("❌ Không có dữ liệu học sinh để xuất!");
    return;
  }

  const termMap = {
    GKI: "Giữa kì I",
    CKI: "Cuối kì I",
    GKII: "Giữa kì II",
    CN: "Cuối năm",
  };
  const termLabel = termMap[term] || term;
  const subjectLabel =
    subject?.toLowerCase() === "công nghệ"
      ? "CÔNG NGHỆ"
      : "TIN HỌC";

  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("KTĐK", {
      pageSetup: {
        paperSize: 9,
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          top: 0.5,
          bottom: 0.5,
          left: 0.5,
          right: 0.5,
          header: 0.3,
          footer: 0.3,
        },
      },
    });

    // 🔹 Tiêu đề trường
    const schoolRow = sheet.addRow(["TRƯỜNG TH LÂM VĂN BỀN"]);
    schoolRow.font = { bold: true, size: 12 };
    sheet.mergeCells(`A1:G1`);

    schoolRow.alignment = {
      horizontal: "left",
      vertical: "middle",   // ✅ thêm cái này
    };

    schoolRow.height = 35;

    // 🔹 Tiêu đề chính
    const titleRow = sheet.addRow([`MÔN ${subjectLabel} - LỚP ${className}`]);
    titleRow.font = { bold: true, size: 14, color: { argb: "FF0D47A1" } };
    sheet.mergeCells(`A2:G2`);

    titleRow.alignment = {
      horizontal: "center",
      vertical: "middle",   // ✅ quan trọng
    };

    titleRow.height = 35;

    // 🔹 Dòng học kỳ & năm học
    const subRow = sheet.addRow([`${termLabel} – NH: ${namHoc}`]);
    subRow.font = { italic: true, size: 12 };
    sheet.mergeCells(`A3:G3`);

    subRow.alignment = {
      horizontal: "center",
      vertical: "middle",   // ✅ thêm luôn
    };

    subRow.height = 35;
    sheet.addRow([]);

    // 🔹 Header
    const header = [
      "STT",
      "HỌ VÀ TÊN",
      "LÍ THUYẾT",
      "THỰC HÀNH",
      "TỔNG CỘNG",
      "MỨC ĐẠT",
      "NHẬN XÉT",
    ];
    const headerRow = sheet.addRow(header);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.height = 35;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1976D2" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // 🔹 Dữ liệu
    students.forEach((s, idx) => {
      const row = sheet.addRow([
        idx + 1,
        String(s.hoVaTen ?? "").toUpperCase(),
        s.lyThuyet ?? "",
        s.thucHanh ?? "",
        s.tongCong ?? "",
        s.mucDat ?? "",
        s.nhanXet ?? "",
      ]);

      row.height = 35; // cố định chiều cao cho tất cả các dòng

      row.eachCell((cell, col) => {
        cell.font = { size: 12 };
        cell.alignment = {
          vertical: "middle",
          horizontal: col === 2 || col === 7 ? "left" : "center",
          wrapText: true,
          indent: col === 2 || col === 7 ? 1 : 0,
        };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // 🔹 Độ rộng cột
    sheet.columns = [
      { width: 6 },
      { width: 35 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 45 },
    ];

    // 💾 Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `${subject}_${term}_${className}.xlsx`);
  } catch (err) {
    console.error("❌ Lỗi khi xuất Excel:", err);
    alert("Xuất danh sách KTĐK thất bại!");
  }
};
