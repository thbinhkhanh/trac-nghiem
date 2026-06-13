import * as XLSX from "xlsx";
import {
  doc,
  getDoc,
  setDoc,
  writeBatch,
  collection,
  getDocs,
} from "firebase/firestore";

export const uploadStudents = async ({
  file,
  files,
  db,
  namHocKey,
  onProgress,
}) => {
  if (!namHocKey) return;

  const fileList = files ? Array.from(files) : file ? [file] : [];
  if (!fileList.length) return;

  const basePath = `DATA_HOCSINH_${namHocKey}`;

  const normalizeId = (id) =>
    String(id).replace(/\.0$/, "").trim().replace(/\s+/g, "");

  const normalizeClass = (lop) => String(lop).trim();

  const makeKey = (lop, ma) =>
    `${normalizeClass(lop)}_${normalizeId(ma)}`;

  let allRows = [];
  const allLops = new Set();

  // =========================
  // 1. PARSE EXCEL (UPDATED)
  // =========================
  for (const f of fileList) {
    const path = f.webkitRelativePath || f.name;

    const fileClass = path
      .split("/")
      .pop()
      .replace(/\.[^/.]+$/, "")
      .trim();

    const workbook = XLSX.read(await f.arrayBuffer());
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rows.length) continue;

    rows.forEach((item) => {
      const ma =
        item["Mã học sinh"] ||
        item["MÃ HỌC SINH"] ||
        item.maDinhDanh;

      const ten =
        item["Họ và tên"] ||
        item["HỌ VÀ TÊN"] ||
        item.hoVaTen;

      if (!ma || !ten) return;

      let rawLop =
        item["Lớp"] ||
        item["LỚP"] ||
        item.lop;

      if (!rawLop) rawLop = fileClass;

      const lop = normalizeClass(rawLop);

      allLops.add(lop);

      allRows.push({
        ma: normalizeId(ma),
        ten: String(ten).trim(),
        lop,
        stt:
          item.stt ||
          item["STT"] ||
          item["SỐ THỨ TỰ"] ||
          item["SO THU TU"] ||
          null,
      });
    });
  }

  if (!allRows.length) return;

  // =========================
  // SOURCE SET (Excel)
  // =========================
  const sourceSet = new Set(
    allRows.map((r) => makeKey(r.lop, r.ma))
  );

  // =========================
  // TARGET SET (Firestore)
  // =========================
  const targetSet = new Set();

  for (const lop of allLops) {
    const snap = await getDocs(
      collection(db, basePath, lop, "STUDENTS")
    );

    snap.forEach((docSnap) => {
      targetSet.add(makeKey(lop, docSnap.id));
    });
  }

  // =========================
  // DIFF ONLY NEW
  // =========================
  const missingStudents = allRows.filter(
    (r) => !targetSet.has(makeKey(r.lop, r.ma))
  );

  if (!missingStudents.length) return;

  // =========================
  // STRUCTURE
  // =========================
  const buildStructure = () => ({
    ktdk: {
      gki: { lyThuyet: null, ngayKiemTra: "", thoiGianLamBai: "" },
      cki: { lyThuyet: null, ngayKiemTra: "", thoiGianLamBai: "" },
      gkii: { lyThuyet: null, ngayKiemTra: "", thoiGianLamBai: "" },
      cn: { lyThuyet: null, ngayKiemTra: "", thoiGianLamBai: "" },
    },
    ontap: {
      gki: { lyThuyet: null, ngayKiemTra: "", thoiGianLamBai: "" },
      cki: { lyThuyet: null, ngayKiemTra: "", thoiGianLamBai: "" },
      gkii: { lyThuyet: null, ngayKiemTra: "", thoiGianLamBai: "" },
      cn: { lyThuyet: null, ngayKiemTra: "", thoiGianLamBai: "" },
    },
  });

  // =========================
  // BATCH INSERT
  // =========================
  let done = 0;
  const batchSize = 450;

  for (let i = 0; i < missingStudents.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = missingStudents.slice(i, i + batchSize);

    for (const s of chunk) {
      const ref = doc(
        db,
        basePath,
        s.lop,
        "STUDENTS",
        s.ma
      );

      batch.set(ref, {
        hoTen: s.ten,
        lop: s.lop,
        khoi: s.lop.match(/\d+/)?.[0] || "",
        mon: "Tin học",
        stt: s.stt ? Number(s.stt) : null,
        updatedAt: Date.now(),
        ...buildStructure(),
      });
    }

    await batch.commit();

    done += chunk.length;

    if (onProgress) {
      onProgress(
        Math.round((done / missingStudents.length) * 100)
      );
    }
  }

  // =========================
  // UPDATE CLASS LIST
  // =========================
  const lopRef = doc(db, "DANHSACH_LOP", namHocKey);

  const snap = await getDoc(lopRef);
  const oldList = snap.exists() ? snap.data().list || [] : [];

  const newList = Array.from(
    new Set([...oldList, ...allLops])
  );

  await setDoc(lopRef, { list: newList }, { merge: true });
};