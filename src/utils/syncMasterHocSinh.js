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

export const syncMasterHocSinh = async ({ db, namHoc, hocKy }) => {
  try {
    // =========================
    // SAFE INPUT
    // =========================
    const namHocKey = (namHoc || "2025-2026").replace(/-/g, "_");
    const safeHocKy = hocKy || "Cuối năm";

    const sourceRoot = `DATA_KTDK_${namHocKey}`;
    const classList = generateClassList();

    // =========================
    // LOOP CLASS
    // =========================
    await Promise.all(
      classList.map(async (classKey) => {
        try {
          const snap = await getDocs(
            collection(db, sourceRoot, safeHocKy, classKey)
          );

          if (snap.empty) return;

          await Promise.all(
            snap.docs.map((docItem) => {
              const data = docItem.data();

              // =========================
              // MASTER PATH (FIXED)
              // DS_HOCSINH_MASTER / class / STUDENTS / studentId
              // =========================
              const ref = doc(
                db,
                "DS_HOCSINH_MASTER",
                classKey,
                "STUDENTS",
                docItem.id
              );

              return setDoc(
                ref,
                {
                  hoTen: data.hoVaTen || data.hoTen || "",
                  khoi: classKey.charAt(0),
                  lop: classKey,
                  updatedAt: new Date().toLocaleDateString("vi-VN"),
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
    console.error("❌ SYNC MASTER ERROR:", err);
  }
};