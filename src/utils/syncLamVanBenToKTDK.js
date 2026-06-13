import {
  collection,
  getDocs,
  doc,
  setDoc
} from "firebase/firestore";

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
// NORMALIZE NAME (MATCH SAFE)
// =========================
const normalizeName = (str = "") =>
  str
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "");

const makeKey = (name, lop) =>
  `${normalizeName(name)}_${normalizeName(lop)}`;

// =========================
// MAIN SYNC (FIXED)
// =========================
export const syncLamVanBenToKTDK = async ({
  db,
  namHoc = "2025-2026",
  targetHocKy = "Cuối kỳ I", // chỉ dùng để đọc source
}) => {
  try {
    const namHocKey = namHoc.replace(/-/g, "_");

    const sourceRoot = `DATA_KTDK_${namHocKey}`;
    const targetRoot = `DS_HOCSINH_${namHocKey}`;

    const classList = generateClassList();

    // 🔥 SOURCE HOÀN TOÀN DÙNG INPUT
    const SOURCE_HK = targetHocKy;

    await Promise.all(
      classList.map(async (classKey) => {
        try {
          // =========================
          // TARGET MAP (BY NAME)
          // =========================
          const targetSnap = await getDocs(
            collection(db, targetRoot, classKey, "STUDENTS")
          );

          const targetMap = new Map();

          targetSnap.docs.forEach((d) => {
            const data = d.data();
            const key = makeKey(data.hoTen || data.hoVaTen, data.lop);
            targetMap.set(key, d.ref);
          });

          if (!targetMap.size) return;

          // =========================
          // SOURCE
          // =========================
          const sourceSnap = await getDocs(
            collection(db, sourceRoot, SOURCE_HK, classKey)
          );

          if (sourceSnap.empty) return;

          await Promise.all(
            sourceSnap.docs.map((studentDoc) => {
              const data = studentDoc.data();

              const key = makeKey(data.hoVaTen, data.lop);
              const targetRef = targetMap.get(key);

              if (!targetRef) return null;

              return setDoc(
                targetRef,
                {
                  hoTen: data.hoVaTen || data.hoTen || "",
                  lop: data.lop || classKey,
                  mon: data.mon || "",
                  khoi: classKey.charAt(0),
                  updatedAt: Date.now(),

                  // 🔥 FIX CỨNG: LUÔN GHI VÀO cki
                  Ktdk: {
                    cki: {
                      lyThuyet: data.lyThuyet ?? null,
                      ngayKiemTra: data.ngayKiemTra || "",
                      thoiGianLamBai: data.thoiGianLamBai || "",
                    }
                  }
                },
                {
                  merge: true // 🔥 KHÔNG MẤT cn
                }
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