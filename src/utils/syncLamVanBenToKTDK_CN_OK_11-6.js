import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteField
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

export const syncLamVanBenToKTDK = async ({
  db,
  namHoc = "2025-2026",
  targetHocKy = "Cuối năm",
}) => {
  try {
    const namHocKey = namHoc.replace(/-/g, "_");

    const sourceRoot = `DATA_KTDK_${namHocKey}`;
    const targetRoot = `DS_HOCSINH_${namHocKey}`;

    const classList = generateClassList();

    const hocKyMap = {
      "Giữa kỳ I": "gki",
      "Cuối kỳ I": "cki",
      "Giữa kỳ II": "gkii",
      "Cuối năm": "cn",
    };

    const suffix = hocKyMap[targetHocKy] || "cn";

    await Promise.all(
      classList.map(async (classKey) => {
        try {
          const studentSnap = await getDocs(
            collection(db, sourceRoot, targetHocKy, classKey)
          );

          if (studentSnap.empty) return;

          await Promise.all(
            studentSnap.docs.map((studentDoc) => {
              const data = studentDoc.data();

              const targetRef = doc(
                db,
                targetRoot,
                classKey,
                "STUDENTS",
                studentDoc.id
              );

              // =========================
              // DATA CHUNG
              // =========================
              const fixedData = {
                hoTen: data.hoVaTen || data.hoTen || "",
                khoi: classKey.charAt(0),
                lop: data.lop || classKey,
                updatedAt: Date.now(),
                mon: data.mon || "",
              };

              // =========================
              // XÓA CN CŨ
              // =========================
              const cleanOldCn = {
                cn: deleteField(),
              };

              // =========================
              // DATA MỚI (GIỮ NGUYÊN)
              // =========================
              const updateData = {
                Ktdk: {
                  [suffix]: {
                    lyThuyet: data.lyThuyet ?? null,
                    ngayKiemTra: data.ngayKiemTra || "",
                    thoiGianLamBai: data.thoiGianLamBai || "",
                  },
                },

                Ontap: {
                  [suffix]: {
                    lyThuyet: null,
                    ngayKiemTra: "",
                    thoiGianLamBai: "",
                  },
                },
              };

              // =========================
              // WRITE FIRESTORE
              // =========================
              return setDoc(
                targetRef,
                {
                  ...fixedData,
                  ...cleanOldCn,
                  ...updateData,
                },
                {
                  merge: true,
                }
              );
            })
          );
        } catch (err) {
          console.warn("skip class:", classKey, err.message);
        }
      })
    );

    console.log("✅ SYNC DONE");
  } catch (err) {
    console.error("❌ SYNC ERROR:", err);
  }
};