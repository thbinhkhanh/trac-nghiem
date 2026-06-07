import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Checkbox,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
  Tooltip,
  FormControlLabel,
  Switch,
} from "@mui/material";

import { useContext } from "react";
import { ConfigContext } from "../context/ConfigContext";
import CloseIcon from "@mui/icons-material/Close";
import { Add, Delete, Edit, Lock } from "@mui/icons-material";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import DeleteClassesConfirmDialog from "./DeleteClassesConfirmDialog";

const USERS = ["Ngọc Tuyết", "Lê Nhàn"];

export default function AssignClassDialog({
  open,
  onClose,
  classes = [],
}) {
  const [user, setUser] = useState("Ngọc Tuyết");
  const [selected, setSelected] = useState({});

  const [newClass, setNewClass] = useState("");
  const [classList, setClassList] = useState([]);

  const [namHoc, setNamHoc] = useState("2025_2026");
  const [lockedBy, setLockedBy] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { config } = useContext(ConfigContext);

  
  // Trạng thái bật/tắt chế độ chỉnh sửa lớp
  const [editMode, setEditMode] = useState(false);

  // INIT CLASS LIST
  useEffect(() => {
    setClassList(classes);
  }, [classes]);

  // LOAD CONFIG + PERMISSION + LOCK
  const loadData = async () => {
    const snap = await getDoc(doc(db, "CONFIG", "config"));
    const data = snap.exists() ? snap.data() : {};

    const currentYear = (data.namHoc || "2025-2026").replaceAll("-", "_");
    setNamHoc(currentYear);

    // Nếu ở chế độ chỉnh sửa lớp, clear selected để người dùng tích chọn lớp cần xóa
    if (editMode) {
      setSelected({});
    } else {
      const permByYear = data.class_permissions?.[currentYear] || {};
      setSelected(permByYear[user] || {});
    }

    // BUILD LOCK MAP (class -> user)
    const lockMap = {};
    const permByYear = data.class_permissions?.[currentYear] || {};
    Object.entries(permByYear).forEach(([u, classes]) => {
      Object.keys(classes || {}).forEach((lop) => {
        if (classes[lop]) {
          lockMap[lop] = u;
        }
      });
    });

    setLockedBy(lockMap);
  };

  useEffect(() => {
    if (!open) return;
    loadData();
  }, [open, user, editMode]);

  // Đóng dialog và reset chế độ chỉnh sửa
  const handleCloseDialog = () => {
    setEditMode(false);
    onClose();
  };

  // ADD CLASS - ĐÃ SỬA LỖI GHI FIRESTORE
  const handleAddClass = async () => {
    const value = newClass.trim().toUpperCase();
    if (!value) return;

    if (classList.includes(value)) {
      alert("Lớp đã tồn tại!");
      return;
    }

    const updated = [...classList, value].sort();

    try {
      // Lấy trực tiếp thông tin cấu hình năm học mới nhất từ database nhằm tránh lỗi bất đồng bộ state
      const snap = await getDoc(doc(db, "CONFIG", "config"));
      const data = snap.exists() ? snap.data() : {};
      const currentYear = (data.namHoc || "2025-2026").replaceAll("-", "_");

      // Thực hiện ghi trực tiếp lên Firestore document tương ứng với năm học
      await setDoc(
        doc(db, "DANHSACH_LOP", currentYear),
        { list: updated },
        { merge: true }
      );

      // Cập nhật lại giao diện hiển thị tại chỗ
      setClassList(updated);
      setNewClass("");
      console.log("Ghi Firestore thành công cho năm học:", currentYear);
    } catch (error) {
      console.error("Lỗi khi thêm lớp: ", error);
      alert("Không thể lưu lớp mới vào hệ thống dữ liệu!");
    }
  };

  // GROUP CLASS
  const groups = classList.reduce((acc, lop) => {
    const k = String(lop).match(/^\d+/)?.[0] || "Khác";
    acc[k] = acc[k] || [];
    acc[k].push(lop);
    return acc;
  }, {});

  // TOGGLE CLASS
  const toggleClass = (lop) => {
    if (!editMode) {
      const isLockedByOther = lockedBy[lop] && lockedBy[lop] !== user;
      if (isLockedByOther) return;
    }

    setSelected((prev) => ({
      ...prev,
      [lop]: !prev[lop],
    }));
  };

  // TOGGLE GROUP
  const toggleGroup = (group) => {
    const allSelected = group.every((l) => selected[l]);

    setSelected((prev) => {
      const newState = { ...prev };

      group.forEach((l) => {
        if (!editMode) {
          const isLockedByOther = lockedBy[l] && lockedBy[l] !== user;
          if (!isLockedByOther) {
            newState[l] = !allSelected;
          }
        } else {
          newState[l] = !allSelected;
        }
      });

      return newState;
    });
  };

  // DELETE CLASS
  const handleDeleteClasses = async () => {
    const toDelete = Object.keys(selected).filter((lop) => selected[lop]);

    if (toDelete.length === 0) {
      alert("Chưa chọn lớp để xóa!");
      return;
    }

    const updated = classList.filter((l) => !toDelete.includes(l));

    const snap = await getDoc(doc(db, "CONFIG", "config"));
    const data = snap.exists() ? snap.data() : {};

    const perm = data.class_permissions || {};
    const yearPerm = perm[namHoc] || {};

    // Xóa lớp khỏi phân quyền của tất cả giáo viên
    Object.keys(yearPerm).forEach((u) => {
      toDelete.forEach((l) => {
        if (yearPerm[u]) delete yearPerm[u][l];
      });
    });

    perm[namHoc] = yearPerm;

    await setDoc(
      doc(db, "CONFIG", "config"),
      { class_permissions: perm },
      { merge: true }
    );

    await setDoc(
      doc(db, "DANHSACH_LOP", namHoc),
      { list: updated },
      { merge: true }
    );

    setClassList(updated);
    setSelected({});
    await loadData(); // Tải lại bản đồ khóa mới
  };

  // SAVE PERMISSION
  const save = async () => {
    if (editMode) {
      handleCloseDialog();
      return;
    }

    const snap = await getDoc(doc(db, "CONFIG", "config"));
    const data = snap.exists() ? snap.data() : {};

    const perm = data.class_permissions || {};
    if (!perm[namHoc]) perm[namHoc] = {};

    const conflict = Object.entries(selected).some(([lop, val]) => {
      if (!val) return false;
      const owner = lockedBy[lop];
      return owner && owner !== user;
    });

    if (conflict) {
      alert("Có lớp đã được giáo viên khác giữ!");
      return;
    }

    perm[namHoc][user] = selected;

    await setDoc(
      doc(db, "CONFIG", "config"),
      { class_permissions: perm },
      { merge: true }
    );

    handleCloseDialog();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        scroll="paper"
        sx={{
          "& .MuiDialog-container": {
            alignItems: "flex-start",
            paddingTop: 5,
          },
        }}
        PaperProps={{
          sx: {
            height: "75vh",
            borderRadius: "14px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "#f8fafc",
          },
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            px: 3,
            py: 1.5,
            background: "#1976d2",
            color: "#fff",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              fontSize={16}
              fontWeight={700}
              display="flex"
              alignItems="center"
              gap={1}
            >
              🔐 Quản lý phân quyền ({config?.namHoc || "2025-2026"})
            </Typography>

            <IconButton onClick={handleCloseDialog} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* CONTENT */}
        <DialogContent sx={{ flex: 1, px: 3, py: 2 }}>
          
          {/* THANH CHUYỂN CHẾ ĐỘ CHỈNH SỬA / PHÂN QUYỀN - ĐÃ THAY THẾ STRONG ĐỂ FIX PHÔNG CHỮ */}
          <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#fff", p: 1, borderRadius: 2, border: "1px dashed #ccc" }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#1976d2", fontFamily: "inherit" }}>
              Chế độ hiện tại:{" "}
              <Box component="span" sx={{ fontWeight: 800, color: editMode ? "#ed6c02" : "#1976d2", ml: 0.5 }}>
                {editMode ? "CHỈNH SỬA LỚP" : "PHÂN QUYỀN"}
              </Box>
            </Typography>
            <FormControlLabel
              control={
                <Switch 
                  checked={editMode} 
                  onChange={(e) => setEditMode(e.target.checked)}
                  color="primary"
                />
              }
              label={<Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "inherit" }}>Chỉnh sửa lớp</Typography>}
            />
          </Box>

          {/* CHỌN GIÁO VIÊN (Ẩn đi khi ở chế độ chỉnh sửa lớp) */}
          {!editMode && (
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Giáo viên</InputLabel>
              <Select
                value={user}
                label="Giáo viên"
                onChange={(e) => setUser(e.target.value)}
              >
                {USERS.map((u) => (
                  <MenuItem key={u} value={u}>
                    {u}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Ô THÊM LỚP & NÚT XÓA - GIỮ MÀU GỐC CỦA BẠN */}
          {editMode && (
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <TextField
                size="small"
                label="Thêm lớp"
                value={newClass}
                onChange={(e) => setNewClass(e.target.value)}
                fullWidth
                onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
              />

              <Tooltip title="Thêm lớp">
                <IconButton
                  onClick={handleAddClass}
                  sx={{
                    color: "#fff",
                    bgcolor: "#22c55e",
                    "&:hover": {
                      bgcolor: "#16a34a",
                    },
                  }}
                >
                  <Add />
                </IconButton>
              </Tooltip>

              <Tooltip title="Xóa lớp">
                <IconButton
                  onClick={() => {
                    const hasSelected = Object.keys(selected).some(l => selected[l]);
                    if (!hasSelected) {
                      alert("Vui lòng tích chọn lớp muốn xóa ở danh sách bên dưới!");
                      return;
                    }
                    setConfirmOpen(true);
                  }}
                  sx={{
                    color: "#fff",
                    bgcolor: "#ef4444",
                    "&:hover": {
                      bgcolor: "#dc2626",
                    },
                  }}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            </Stack>
          )}

          {/* GRID DANH SÁCH LỚP */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            {Object.entries(groups).map(([k, group]) => (
              <Box
                key={k}
                sx={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 2,
                  background: "#fff",
                }}
              >
                {/* GROUP HEADER */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    bgcolor: "#f1f5f9",
                    px: 1,
                    py: 0.5,
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={group.length > 0 && group.every((l) => selected[l])}
                    onChange={() => toggleGroup(group)}
                  />

                  <Typography fontWeight={700}>Khối {k}</Typography>
                </Box>

                {/* ITEMS */}
                <Box sx={{ p: 1 }}>
                  {group.map((lop) => {
                    const isLockedByOther = lockedBy[lop] && lockedBy[lop] !== user;
                    const isDisabled = editMode ? false : isLockedByOther;

                    return (
                      <Box
                        key={lop}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          opacity: isDisabled ? 0.5 : 1,
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={!!selected[lop]}
                          disabled={isDisabled}
                          onChange={() => toggleClass(lop)}
                        />

                        <Typography fontSize={14}>
                          {lop}
                          {!editMode && isLockedByOther && (
                            <span style={{ color: "red", marginLeft: 6, fontSize: 12 }}>
                              ({lockedBy[lop]})
                            </span>
                          )}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>

        {/* FOOTER */}
        <DialogActions
          sx={{
            px: 3,
            pb: 2,
            justifyContent: "flex-end",
            gap: 1.5,
          }}
        >
          <Button
            variant="outlined"
            onClick={handleCloseDialog}
            sx={{
              minWidth: 110,
              height: 42,
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Hủy
          </Button>

          <Button
            variant="contained"
            onClick={save}
            sx={{
              minWidth: 130,
              height: 42,
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 700,
              background: "linear-gradient(135deg, #1976d2, #42a5f5)",
              boxShadow: "0 10px 20px rgba(25,118,210,0.25)",
              "&:hover": {
                background: "linear-gradient(135deg, #1565c0, #1976d2)",
              },
            }}
          >
            {editMode ? "Hoàn tất" : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteClassesConfirmDialog
        open={confirmOpen}
        selectedCount={Object.keys(selected).filter((lop) => selected[lop]).length}
        selectedClasses={Object.keys(selected).filter((lop) => selected[lop])}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          await handleDeleteClasses();
        }}
      />
    </>
  );
}