import { collection, getDocs, doc, setDoc } from "firebase/firestore";

const generateClassList = () => {
  const result = [];
  const addRange = (grade, from, to) => {
    for (let i = from.charCodeAt(0); i <= to.charCodeAt(0); i++) {
      result.push(`${grade}${String.fromCharCode(i)}`);
    }
  };
  addRange("3", "A", "H");
  addRange("4", "A", "G");
  addRange("5", "A", "H");
  return result;
};

// =========================
// TEMPLATE RỖNG CHUẨN
// =========================
const EMPTY_SCORE = {
  lyThuyet: null,
  mucDat: "",
  ngayKiemTra: "",
  nhanXet: "",
  thoiGianLamBai: "",
  thucHanh: null,
  tongCong: null,
};

// =========================
// MAP DATA (CKI / CN)
// =========================
const mapScore = (d = {}) => ({
  hoTen: d.hoVaTen ?? "",   // 👈 PHẢI CÓ
  lyThuyet: d.diem ?? d.lyThuyet ?? null,
  mucDat: d.mucDat ?? "",
  ngayKiemTra: d.ngayKiemTra ?? "",
  nhanXet: d.nhanXet ?? "",
  thoiGianLamBai: d.thoiGianLamBai ?? "",
  thucHanh: d.thucHanh ?? null,
  tongCong: d.tongCong ?? null,
});

export const syncLamVanBenToKTDK = async ({
  db,
  namHoc = "2025-2026",

  sourceHocKy = "Cuối kỳ I",   // → CKI
  sourceHocKy2 = "Cả năm",     // → CN
}) => {
  try {
    const targetRoot = `DS_HOCSINH_${namHoc.replace(/-/g, "_")}`;
    const classList = generateClassList();

    await Promise.all(
      classList.map(async (classKey) => {
        try {
          const colRef = (hk) =>
            collection(db, "LAMVANBEN", hk, classKey);

          // =========================
          // FETCH 2 NGUỒN
          // =========================
          const [snapCKI, snapCN] = await Promise.all([
            getDocs(colRef(sourceHocKy)),
            getDocs(colRef(sourceHocKy2)),
          ]);

          // =========================
          // MAP CKI
          // =========================
          const ckiMap = new Map();
          snapCKI.forEach((docSnap) => {
            ckiMap.set(docSnap.id, mapScore(docSnap.data()));
          });

          // =========================
          // MAP CN
          // =========================
          const cnMap = new Map();
          snapCN.forEach((docSnap) => {
            cnMap.set(docSnap.id, mapScore(docSnap.data()));
          });

          // =========================
          // UNION STUDENTS
          // =========================
          const allIds = new Set([
            ...ckiMap.keys(),
            ...cnMap.keys(),
          ]);

          await Promise.all(
            [...allIds].map((studentId) => {
              const targetRef = doc(
                db,
                targetRoot,
                classKey,
                "STUDENTS",
                studentId
              );

              return setDoc(
                targetRef,
                {
                  hoTen: ckiMap.get(studentId)?.hoTen || cnMap.get(studentId)?.hoTen || "",
                  lop: classKey,
                  stt: null,

                  // =====================
                  // GKI (LUÔN RỖNG)
                  // =====================
                  GKI: { ...EMPTY_SCORE },

                  // =====================
                  // GKII (LUÔN RỖNG)
                  // =====================
                  GKII: { ...EMPTY_SCORE },

                  // =====================
                  // CKI (Cuối kỳ I)
                  // =====================
                  CKI: {
                    ...EMPTY_SCORE,
                    ...(ckiMap.get(studentId) || {}),
                  },

                  // =====================
                  // CN (Cả năm)
                  // =====================
                  CN: {
                    ...EMPTY_SCORE,
                    ...(cnMap.get(studentId) || {}),
                  },
                },
                { merge: true }
              );
            })
          );
        } catch (err) {
          console.warn("skip class:", classKey, err.message);
        }
      })
    );
  } catch (err) {
    console.error("❌ SYNC ERROR:", err);
  }
};