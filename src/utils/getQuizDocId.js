import { collection, getDocs } from "firebase/firestore";

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

  // 2026-2027 -> 26-27
  const namHoc = configData.namHoc
    ? configData.namHoc
        .split("-")
        .map(x => x.slice(-2))
        .join("-")
    : "25-26";

  const classNumber = classLabel.match(/\d+/)?.[0];

  // ================= ÔN TẬP =================
  if (configData.onTap) {
    const snap = await getDocs(
      collection(db, "DE_ONTAP")
    );

    const found = snap.docs.find((d) => {
      const id = d.id;

      return (
        id.includes(`Lớp ${classNumber}`) &&
        id.includes(mon) &&
        id.includes(hocKiCode) &&
        id.includes(namHoc)
      );
    });

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
    const snap = await getDocs(
      collection(db, "DETHI")
    );

    const found = snap.docs.find((d) => {
      const id = d.id;

      return (
        id.includes(`Lớp ${classNumber}`) &&
        id.includes(mon) &&
        id.includes(hocKiCode) &&
        id.includes(namHoc)
      );
    });

    if (!found) {
      setNotFoundMessage("❌ Không tìm thấy đề KTĐK");
      return null;
    }

    return {
      docId: found.id,
      collectionName: "DETHI",
    };
  }

  setNotFoundMessage("❌ Không xác định loại đề");
  return null;
};