import * as XLSX from "xlsx";
import { doc, getDoc, setDoc, writeBatch } from "firebase/firestore";

export const uploadStudents = async ({
  file,
  db,
  namHocKey,
  onProgress,
}) => {
  if (!file || !namHocKey) return;

  const fileName = file.name || "";
  const lop = fileName.replace(/\.[^/.]+$/, "").trim();

  const data = await file.arrayBuffer();
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
      maDinhDanh: r.ma,
      hoVaTen: String(r.ten).toUpperCase(),
      stt: r.stt || null,
      lop,
    }));

  const basePath = `DS_HOCSINH_${namHocKey}`;

  const CHUNK_SIZE = 450; // an toàn Firestore limit 500

  let processed = 0;

  for (let i = 0; i < students.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);

    const chunk = students.slice(i, i + CHUNK_SIZE);

    for (const s of chunk) {
      const ref = doc(
        db,
        basePath,
        lop,
        "STUDENTS",
        s.maDinhDanh
      );

      batch.set(ref, {
        hoVaTen: s.hoVaTen,
        lop: s.lop,
        stt: s.stt,
      });
    }

        await batch.commit();

        processed += chunk.length;

        if (onProgress) {
          onProgress(Math.round((processed / students.length) * 100));
        }
      }

      // ====== GHI DANH SACH LOP ======
      const uniqueLops = [lop]; // lấy từ tên file

      const lopRef = doc(db, "DANHSACH_LOP", namHocKey);

      const snap = await getDoc(lopRef);
      const oldList = snap.exists() ? snap.data().list || [] : [];

      if (!oldList.includes(lop)) {
        await setDoc(lopRef, {
          list: [...oldList, lop],
        });
      }
    };