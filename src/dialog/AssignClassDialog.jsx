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
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

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

  // INIT CLASS LIST
  useEffect(() => {
    setClassList(classes);
  }, [classes]);

  // LOAD CONFIG + PERMISSION + LOCK
  useEffect(() => {
    if (!open) return;

    const load = async () => {
      const snap = await getDoc(doc(db, "CONFIG", "config"));
      const data = snap.exists() ? snap.data() : {};

      const currentYear = (data.namHoc || "2025-2026").replaceAll("-", "_");
      setNamHoc(currentYear);

      // CLASS PERMISSION BY YEAR
      const permByYear = data.class_permissions?.[currentYear] || {};
      setSelected(permByYear[user] || {});

      // BUILD LOCK MAP (class -> user)
      const lockMap = {};

      Object.entries(permByYear).forEach(([u, classes]) => {
        Object.keys(classes || {}).forEach((lop) => {
          if (classes[lop]) {
            lockMap[lop] = u;
          }
        });
      });

      setLockedBy(lockMap);
    };

    load();
  }, [open, user]);

  // ADD CLASS
  const handleAddClass = async () => {
    const value = newClass.trim().toUpperCase();
    if (!value) return;

    if (classList.includes(value)) {
      alert("Lớp đã tồn tại!");
      return;
    }

    const updated = [...classList, value].sort();
    setClassList(updated);
    setNewClass("");

    const snap = await getDoc(doc(db, "CONFIG", "config"));
    const data = snap.exists() ? snap.data() : {};

    const yearKey = namHoc;

    await setDoc(
      doc(db, "DANHSACH_LOP", yearKey),
      { list: updated },
      { merge: true }
    );
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
    const isLockedByOther =
      lockedBy[lop] && lockedBy[lop] !== user;

    if (isLockedByOther) return;

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
        const isLockedByOther =
          lockedBy[l] && lockedBy[l] !== user;

        if (!isLockedByOther) {
          newState[l] = !allSelected;
        }
      });

      return newState;
    });
  };

  // DELETE CLASS
  const handleDeleteClasses = async () => {
    const toDelete = Object.keys(selected).filter(
      (lop) => selected[lop]
    );

    if (toDelete.length === 0) {
      alert("Chưa chọn lớp để xóa!");
      return;
    }

    const updated = classList.filter(
      (l) => !toDelete.includes(l)
    );

    setClassList(updated);
    setSelected({});

    const snap = await getDoc(doc(db, "CONFIG", "config"));
    const data = snap.exists() ? snap.data() : {};

    const perm = data.class_permissions || {};
    const yearPerm = perm[namHoc] || {};

    // remove class from all users
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
  };

  // SAVE PERMISSION
  const save = async () => {
    const snap = await getDoc(doc(db, "CONFIG", "config"));
    const data = snap.exists() ? snap.data() : {};

    const perm = data.class_permissions || {};

    if (!perm[namHoc]) perm[namHoc] = {};

    // OPTIONAL: chặn conflict
    const conflict = Object.entries(selected).some(
      ([lop, val]) => {
        if (!val) return false;
        const owner = lockedBy[lop];
        return owner && owner !== user;
      }
    );

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

    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          <Typography fontSize={16} fontWeight={700}>
            🔐 Phân quyền lớp ({namHoc})
          </Typography>

          <IconButton onClick={onClose} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* CONTENT */}
      <DialogContent sx={{ flex: 1, px: 3, py: 2 }}>
        {/* USER */}
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

        {/* ADD + DELETE */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <TextField
            size="small"
            label="Thêm lớp"
            value={newClass}
            onChange={(e) => setNewClass(e.target.value)}
            fullWidth
          />

          <Button variant="contained" onClick={handleAddClass}>
            Thêm
          </Button>

          <Button
            color="error"
            variant="outlined"
            onClick={handleDeleteClasses}
          >
            Xóa
          </Button>
        </Stack>

        {/* GRID */}
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
                  checked={group.every((l) => selected[l])}
                  onChange={() => toggleGroup(group)}
                />

                <Typography fontWeight={700}>
                  Khối {k}
                </Typography>
              </Box>

              {/* ITEMS */}
              <Box sx={{ p: 1 }}>
                {group.map((lop) => {
                  const isLockedByOther =
                    lockedBy[lop] &&
                    lockedBy[lop] !== user;

                  return (
                    <Box
                      key={lop}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        opacity: isLockedByOther ? 0.5 : 1,
                      }}
                    >
                      <Checkbox
                        size="small"
                        checked={!!selected[lop]}
                        disabled={isLockedByOther}
                        onChange={() => toggleClass(lop)}
                      />

                      <Typography fontSize={14}>
                        {lop}
                        {isLockedByOther && (
                          <span
                            style={{
                              color: "red",
                              marginLeft: 6,
                              fontSize: 12,
                            }}
                          >
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
            onClick={onClose}
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
            Lưu
        </Button>
        </DialogActions>
    </Dialog>
  );
}