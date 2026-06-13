import * as XLSX from "xlsx";
import { doc, getDoc, setDoc, writeBatch } from "firebase/firestore";

export const uploadStudents = async ({
  file,
  files,
  db,
  namHocKey,
  onProgress,
}) => {
  if (!namHocKey) return;

  const fileList = files ? Array.from(files) : file ? [file] : [];
  if (fileList.length === 0) return;

  const basePath = `DATA_HOCSINH_${namHocKey}`;

  let totalStudents = 0;
  let processedStudents = 0;

  const allLops = new Set();
  const parsedData = [];

  // =========================
  // 1. PARSE FILE
  // =========================
  for (const f of fileList) {
    const path = f.webkitRelativePath || f.name;
    const fileName = path.split("/").pop();
    const lop = fileName.replace(/\.[^/.]+$/, "").trim();

    allLops.add(lop);

    const data = await f.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      header: ["stt", "ma", "ten"],
      defval: "",
    });

    const rows = jsonData.slice(1);

    const students = rows
      .filter((r) => r.ma && r.ten)
      .map((r) => ({
        maDinhDanh: String(r.ma).trim(),
        hoTen: String(r.ten).trim(),
        stt: r.stt || null,
        lop,
      }));

    parsedData.push({ lop, students });
    totalStudents += students.length;
  }

  if (totalStudents === 0) return;

  // =========================
  // 2. UPLOAD STUDENTS
  // =========================
  for (const group of parsedData) {
    const { lop, students } = group;

    for (let i = 0; i < students.length; i += 450) {
      const batch = writeBatch(db);
      const chunk = students.slice(i, i + 450);

      for (const s of chunk) {
        const ref = doc(
          db,
          basePath,
          lop,
          "STUDENTS",
          s.maDinhDanh
        );

        batch.set(ref, {
          hoTen: s.hoTen,
          lop: s.lop,
          khoi: lop.match(/\d+/)?.[0] || "",
          mon: "Tin học",

          updatedAt: Date.now(),

          // =========================
          // STRUCTURE MỚI
          // =========================
          ktdk: {
            gki: {
              lyThuyet: null,
              ngayKiemTra: "",
              thoiGianLamBai: "",
            },
            cki: {
              lyThuyet: null,
              ngayKiemTra: "",
              thoiGianLamBai: "",
            },
            gkii: {
              lyThuyet: null,
              ngayKiemTra: "",
              thoiGianLamBai: "",
            },
            cn: {
              lyThuyet: null,
              ngayKiemTra: "",
              thoiGianLamBai: "",
            },
          },

          ontap: {
            gki: {
              lyThuyet: null,
              ngayKiemTra: "",
              thoiGianLamBai: "",
            },
            cki: {
              lyThuyet: null,
              ngayKiemTra: "",
              thoiGianLamBai: "",
            },
            gkii: {
              lyThuyet: null,
              ngayKiemTra: "",
              thoiGianLamBai: "",
            },
            cn: {
              lyThuyet: null,
              ngayKiemTra: "",
              thoiGianLamBai: "",
            },
          },
        });
      }

      await batch.commit();

      processedStudents += chunk.length;

      if (onProgress) {
        onProgress(
          Math.round((processedStudents / totalStudents) * 100)
        );
      }
    }
  }

  // =========================
  // 3. UPDATE DANH SÁCH LỚP
  // =========================
  const lopRef = doc(db, "DANHSACH_LOP", namHocKey);

  const snap = await getDoc(lopRef);
  const oldList = snap.exists() ? snap.data().list || [] : [];

  const newList = Array.from(new Set([...oldList, ...allLops]));

  await setDoc(
    lopRef,
    { list: newList },
    { merge: true }
  );
};