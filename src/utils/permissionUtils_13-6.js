const getUserPerm = (permissions, account, namHoc) => {
  return permissions?.[namHoc]?.[account] || {};
};

/**
 * Kiểm tra user có quyền trên 1 lớp không
 */
export const canAccessClass = (
  account,
  className,
  permissions,
  namHoc
) => {
  if (account === "Admin") return true;

  const userPerm = getUserPerm(permissions, account, namHoc);

  return !!userPerm?.[className];
};

/**
 * Lọc danh sách lớp theo quyền user
 */
export const filterClassesByPermission = (
  account,
  classes = [],
  permissions,
  namHoc
) => {
  if (account === "Admin") return classes;

  const userPerm = getUserPerm(permissions, account, namHoc);

  return classes.filter((cls) => !!userPerm?.[cls]);
};

/**
 * Lọc dữ liệu theo quyền lớp
 */
export const filterDataByClassPermission = (
  account,
  data = [],
  permissions,
  namHoc,
  classField = "class"
) => {
  if (account === "Admin") return data;

  const userPerm = getUserPerm(permissions, account, namHoc);

  return data.filter((item) => userPerm?.[item[classField]]);
};

/**
 * Lấy danh sách lớp user được phép
 */
export const getAllowedClasses = (
  account,
  permissions,
  namHoc
) => {
  if (account === "Admin") return null;

  const userPerm = getUserPerm(permissions, account, namHoc);

  return Object.keys(userPerm || {}).filter(
    (cls) => userPerm[cls]
  );
};