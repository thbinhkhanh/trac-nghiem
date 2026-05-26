import { collection, getDocs, query, where } from "firebase/firestore";

export const getQuizDocId = async ({
  db,
  configData,
  classLabel,
  hocKiFromConfig,
  studentInfo,
  setNotFoundMessage,
}) => {
  const hocKiMap = {
    "Cuối kỳ I": "CKI",
    "Giữa kỳ I": "GKI",
    "Giữa kỳ II": "GKII",
    "Cuối năm": "CN",
  };

  const hocKiCode = hocKiMap[hocKiFromConfig];
  const mon = studentInfo.mon;
  const namHoc = configData.namHoc || "25-26";

  // ================= ÔN TẬP =================
  if (configData.onTap) {
    const expectedId = `quiz_${classLabel}_${mon}_${hocKiCode}_${namHoc}`;

    const snap = await getDocs(collection(db, "DE_ONTAP"));

    const found = snap.docs.find((d) => d.id === expectedId);

    if (!found) {
      setNotFoundMessage("❌ Không tìm thấy đề ôn tập");
      return null;
    }

    return {
      docId: found.id,
      collectionName: "DE_ONTAP",
    };
  }

  // ================= KTĐK =================
  if (configData.kiemTraDinhKi) {
    const q = query(
      collection(db, "DETHI"),
      where("class", "==", classLabel),
      where("semester", "==", hocKiCode),
      where("subject", "==", mon)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      setNotFoundMessage("❌ Không tìm thấy đề KTĐK");
      return null;
    }

    const docSnap = snap.docs[0];

    return {
      docId: docSnap.id,
      collectionName: "DETHI",
    };
  }

  setNotFoundMessage("❌ Không xác định loại đề");
  return null;
};