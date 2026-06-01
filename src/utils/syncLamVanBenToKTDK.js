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

export const syncLamVanBenToKTDK = async ({
  db,
  namHoc = "2025-2026",
  sourceHocKy = "Cả năm",
  targetHocKy = "Cuối năm",
}) => {
  try {
    const targetRoot = `DATA_KTDK_${namHoc.replace(/-/g, "_")}`;
    const classList = generateClassList();

    await Promise.all(
      classList.map(async (classKey) => {
        try {
          const studentSnap = await getDocs(
            collection(db, "LAMVANBEN", sourceHocKy, classKey)
          );

          if (studentSnap.empty) return;

          await Promise.all(
            studentSnap.docs.map((studentDoc) => {
              const data = studentDoc.data();

              const targetRef = doc(
                db,
                targetRoot,
                targetHocKy,
                classKey,
                studentDoc.id
              );

              return setDoc(targetRef, data, { merge: true });
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