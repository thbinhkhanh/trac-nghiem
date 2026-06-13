import {
  collection,
  getDocs,
  doc,
  writeBatch,
} from "firebase/firestore";

// =========================
// GENERATE CLASS LIST
// =========================
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
// LIMIT CONCURRENCY HELPER
// =========================
const runWithLimit = async (items, limit, handler) => {
  const queue = [...items];

  const workers = new Array(limit).fill(null).map(async () => {
    while (queue.length) {
      const item = queue.shift();
      await handler(item);
    }
  });

  await Promise.all(workers);
};

// =========================
// CHUNK ARRAY
// =========================
const chunkArray = (arr, size) => {
  const result = [];

  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }

  return result;
};

// =========================
// MAIN SYNC FUNCTION
// =========================
export const syncMasterHocSinh = async ({ db, namHoc, hocKy }) => {
  try {
    const namHocKey = (namHoc || "2025-2026").replace(/-/g, "_");
    const safeHocKy = hocKy || "Cuối năm";

    const sourceRoot = `DATA_KTDK_${namHocKey}`;
    const classList = generateClassList();

    await runWithLimit(classList, 3, async (classKey) => {
      try {
        const snap = await getDocs(
          collection(db, sourceRoot, safeHocKy, classKey)
        );

        if (snap.empty) return;

        const writes = [];

        snap.docs.forEach((docItem) => {
          const data = docItem.data();

          const ref = doc(
            db,
            `DS_HOCSINH_${namHocKey}`,
            classKey,
            "STUDENTS",
            docItem.id // giữ nguyên ID học sinh
          );

          writes.push({
            ref,
            data: {
              hoTen: data.hoVaTen || data.hoTen || "",
              khoi: classKey.charAt(0),
              lop: data.lop || classKey,
              updatedAt: Date.now(),
            },
          });
        });

        // Batch tối đa 500 document
        const batches = chunkArray(writes, 500);

        for (const batchItems of batches) {
          const batch = writeBatch(db);

          batchItems.forEach(({ ref, data }) => {
            batch.set(ref, data, { merge: true });
          });

          await batch.commit();
        }

      } catch (err) {
        console.warn("⚠️ skip class:", classKey, err.message);
      }
    });

  } catch (err) {
    console.error("❌ SYNC MASTER ERROR:", err);
  }
};