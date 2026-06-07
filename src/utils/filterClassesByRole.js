import { doc, getDoc } from "firebase/firestore";

/**
 * Lọc danh sách lớp theo quyền user (theo năm học)
 * @param {Object} params
 * @param {FirebaseFirestore} params.db
 * @param {string} params.account - tài khoản đăng nhập
 * @param {string[]} params.allClasses - danh sách lớp gốc
 * @returns {Promise<string[]>}
 */
export const filterClassesByRole = async ({ db, account, allClasses }) => {
  // ADMIN: full quyền
  if (account === "Admin") return allClasses;

  try {
    const snap = await getDoc(doc(db, "CONFIG", "config"));
    const data = snap.exists() ? snap.data() : {};

    // 🔥 TỰ ĐỘNG LẤY NĂM HỌC HIỆN TẠI
    const namHoc = (data.namHoc || "2025-2026").replaceAll("-", "_");

    // 🔥 CHỈ LẤY PERMISSION THEO NĂM HỌC
    const permByYear = data.class_permissions?.[namHoc] || {};

    // quyền của user trong năm học đó
    const userPerm = permByYear?.[account] || {};

    // chỉ lấy các lớp được tick true
    const allowedClasses = allClasses.filter((lop) => userPerm?.[lop]);

    return allowedClasses;
  } catch (err) {
    console.error("filterClassesByRole error:", err);
    return [];
  }
};