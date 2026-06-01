import React, { useState, useEffect, useContext } from "react";

// =========================
// MUI COMPONENTS
// =========================
import {
  Box,
  Typography,
  Card,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  TextField,
  IconButton,
  Checkbox,
  Snackbar,
  Alert,
  Dialog,
  DialogContent,
  Tooltip,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";

// =========================
// ICONS
// =========================
import { Add, Delete } from "@mui/icons-material";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import CloseIcon from "@mui/icons-material/Close";

// =========================
// CONTEXT
// =========================
import { ConfigContext } from "../context/ConfigContext";
import { StudentContext } from "../context/StudentContext";

// =========================
// FIREBASE
// =========================
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

// =========================
// PAGES / COMPONENTS
// =========================
import BackupPage from "./BackupPage";
import RestorePage from "./RestorePage";

export default function QuanTri() {
  // =========================
  // ACCOUNT
  // =========================
  const account = localStorage.getItem("account") || "";
  const isLamVanBen = account === "TH Lâm Văn Bền";

  // =========================
  // CONTEXT
  // =========================
  const { classData, setClassData } = useContext(StudentContext);
  const { config, setConfig } = useContext(ConfigContext);

  // =========================
  // STATE - PASSWORD
  // =========================
  const [firestorePassword, setFirestorePassword] = useState("");
  const [openChangePw, setOpenChangePw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");

  // =========================
  // STATE - SNACKBAR
  // =========================
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // =========================
  // STATE - CLASS / SEMESTER
  // =========================
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSemester, setSelectedSemester] = useState(
    config.hocKy || "Cuối kỳ I"
  );
  const [examType, setExamType] = useState(
    config.examType || "ktdk"
  );

  const [addingClass, setAddingClass] = useState(false);
  const [newClass, setNewClass] = useState("");

  // =========================
  // STATE - CONFIG
  // =========================
  const [timeInput, setTimeInput] = useState(
    config.timeLimit || 20
  );

  // =========================
  // STATE - BACKUP / RESTORE
  // =========================
  const [openBackup, setOpenBackup] = useState(false);
  const [openRestore, setOpenRestore] = useState(false);

  // ===== Fetch mật khẩu Firestore =====
  useEffect(() => {
    const fetchPassword = async () => {
      try {
        const snap = await getDoc(doc(db, "MATKHAU", "lvb"));
        if (snap.exists()) setFirestorePassword(snap.data().pass || "1");
      } catch (err) {
        console.error("Lỗi lấy mật khẩu Firestore:", err);
      }
    };
    fetchPassword();
  }, []);

  // ===== Fetch lớp & config =====
  useEffect(() => {
  const fetchData = async () => {
    try {
      // 🔹 Lấy config chung từ CONFIG/config
      const snapConfig = await getDoc(doc(db, "CONFIG", "config"));
      if (snapConfig.exists()) {
        const data = snapConfig.data();

        // ✅ cập nhật context
        setConfig({
          choXemDapAn: data.choXemDapAn ?? false,
          choXemDiem: data.choXemDiem ?? false,
          hocKy: data.hocKy ?? "Cuối kỳ I",
          timeLimit: data.timeLimit ?? 20,
          xuatFileBaiLam: data.xuatFileBaiLam ?? true,
          khoaHeThong: data.khoaHeThong ?? false,
          examType: data.examType ?? "ktdk",
        });

        setSelectedSemester(data.hocKy ?? "Cuối kỳ I");
        setExamType(data.examType ?? "ktdk");
        setTimeInput(data.timeLimit ?? 20);
      }

      // 🔹 Lấy danh sách lớp từ LAMVANBEN/lop
      const lopSnap = await getDoc(doc(db, "LAMVANBEN", "lop"));
      const classList = (lopSnap.data()?.list || []).sort();
      setClasses(classList);
      setSelectedClass((prev) => prev || classList[0] || "");
    } catch (err) {
      console.error("❌ Lỗi fetch lớp hoặc config:", err);
    }
  };

  fetchData();
}, [setConfig]);

  // ===== Cập nhật config =====
  const updateConfigField = async (field, value) => {
    await setConfig({ [field]: value }); // ✅ dùng setConfig context
    if (field === "lop") setSelectedClass(value);
    if (field === "hocKy") setSelectedSemester(value);
    if (field === "timeLimit") setTimeInput(value);
    if (field === "namHoc") ;
    if (field === "examType") setExamType(value);
  };

  // ===== Thêm / xóa lớp =====
  const handleAddClass = async () => {
    if (!newClass.trim()) return;

    const input = newClass.toUpperCase().replace(/\s+/g, "");
    let generatedClasses = [];

    const parts = input.split(",");

    for (let part of parts) {

      // ===== CASE 1: Dãy chữ cái – ví dụ 3A->3K =====
      let matchLetter = part.match(/^(\d+)([A-Z])->(\d+)?([A-Z])$/);
      if (matchLetter) {
        const grade = matchLetter[1];
        const start = matchLetter[2].charCodeAt(0);
        const end = matchLetter[4].charCodeAt(0);

        if (start > end) continue;

        for (let c = start; c <= end; c++) {
          generatedClasses.push(`${grade}${String.fromCharCode(c)}`);
        }
        continue;
      }

      // ===== CASE 2: Dãy số – ví dụ 4.1->4.6 =====
      let matchNumber = part.match(/^(\d+)\.(\d+)->(\d+)\.(\d+)$/);
      if (matchNumber) {
        const grade = matchNumber[1];
        const start = Number(matchNumber[2]);
        const end = Number(matchNumber[4]);

        if (start > end) continue;

        for (let i = start; i <= end; i++) {
          generatedClasses.push(`${grade}.${i}`);
        }
        continue;
      }

      // ===== CASE 3: 1 lớp đơn =====
      if (/^\d+(\.\d+|[A-Z])$/.test(part)) {
        generatedClasses.push(part);
      }
    }

    if (generatedClasses.length === 0) {
      alert("❌ Định dạng không hợp lệ!");
      return;
    }

    // Loại trùng
    const uniqueNew = generatedClasses.filter(c => !classes.includes(c));

    if (uniqueNew.length === 0) {
      alert("⚠️ Các lớp đã tồn tại!");
      return;
    }

    const updated = [...classes, ...uniqueNew].sort();

    setClasses(updated);
    setSelectedClass(uniqueNew[0]);
    updateConfigField("lop", uniqueNew[0]);

    await setDoc(
      doc(db, "LAMVANBEN", "lop"),
      { list: updated },
      { merge: true }
    );

    setNewClass("");
    setAddingClass(false);
  };


  const handleDeleteClass = async () => {
    const updated = classes.filter((c) => c !== selectedClass).sort();
    setClasses(updated);
    const nextClass = updated[0] || "";
    setSelectedClass(nextClass);
    updateConfigField("lop", nextClass);
    await setDoc(doc(db, "LAMVANBEN", "lop"), { list: updated }, { merge: true });
  };

  const handleTimeLimitChange = (value) => {
    const v = Math.max(1, Number(value));
    setTimeInput(v);
    updateConfigField("timeLimit", v);
  };

  // ===== Đổi mật khẩu =====
  const handleChangePassword = async () => {
    if (!newPw.trim()) return setPwError("❌ Mật khẩu mới không được để trống!");
    if (newPw !== confirmPw) return setPwError("❌ Mật khẩu nhập lại không khớp!");

    try {
      // Chọn document theo account
      const docId = account === "TH Lâm Văn Bền" ? "lvb" : "admin";

      await setDoc(doc(db, "MATKHAU", docId), { pass: newPw }, { merge: true });

      setOpenChangePw(false);
      setNewPw("");
      setConfirmPw("");
      setPwError("");

      setSnackbar({ open: true, message: "✅ Đổi mật khẩu thành công!", severity: "success" });
    } catch (err) {
      console.error(err);
      setPwError("❌ Lỗi khi lưu mật khẩu!");
      setSnackbar({ open: true, message: "❌ Lỗi khi lưu mật khẩu!", severity: "error" });
    }
  };

  return (
  <Box
    sx={{
      minHeight: "100vh",
      background: "#f1f5f9",
      py: 3,
      px: 2,
      display: "flex",
      justifyContent: "center",
      fontFamily:
        '"Roboto","Inter","Arial",sans-serif',
    }}
  >
    <Box
      sx={{
        width: "100%",
        maxWidth: 450,
      }}
    >
      {!openBackup && !openRestore && (
        <Card
          elevation={0}
          sx={{
            borderRadius: "14px",
            overflow: "hidden",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            boxShadow:
              "0 10px 35px rgba(0,0,0,0.12)",
          }}
        >
        {/* ===== HEADER ===== */}
        <Box
          sx={{
            px: 3,
            py: 1.5,
            background: "#1976d2",
            color: "#fff",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                Cấu hình hệ thống
              </Typography>

              {/*<Typography
                sx={{
                  fontSize: 13,
                  opacity: 0.92,
                  mt: 0.3,
                }}
              >
                Quản lý hệ thống kiểm tra
              </Typography>*/}
            </Box>

            <Tooltip title="Đổi mật khẩu">
              <IconButton
                onClick={() =>
                  setOpenChangePw(true)
                }
                sx={{
                  color: "#fff",
                  bgcolor:
                    "rgba(255,255,255,0.12)",

                  "&:hover": {
                    bgcolor:
                      "rgba(255,255,255,0.22)",
                  },
                }}
              >
                <VpnKeyIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* ===== CONTENT ===== */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
          }}
        >
          <Stack spacing={2}>
            {/* ACCOUNT */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: "5px",
                bgcolor: "#fff",
                border:
                  "1px solid #e2e8f0",
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  color: "#64748b",
                  mb: 0.5,
                }}
              >
                Tài khoản đăng nhập
              </Typography>

              <Typography
                sx={{
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
                {account ||
                  "Chưa đăng nhập"}
              </Typography>
            </Box>

            {/* NĂM HỌC */}
            <FormControl
              fullWidth
              size="small"
            >
              <InputLabel>
                Năm học
              </InputLabel>

              <Select
                value={
                  config.namHoc ||
                  "2025-2026"
                }
                label="Năm học"
                onChange={(e) =>
                  updateConfigField(
                    "namHoc",
                    e.target.value
                  )
                }
                sx={{
                  bgcolor: "#fff",
                  borderRadius: "5px",

                  "& .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor:
                        "#dbe2ea",
                    },

                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor:
                        "#1976d2",
                      borderWidth: 2,
                    },
                }}
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => {
                    const start =
                      2025 + i;

                    const end =
                      start + 1;

                    const value = `${start}-${end}`;

                    return (
                      <MenuItem
                        key={value}
                        value={value}
                      >
                        {value}
                      </MenuItem>
                    );
                  }
                )}
              </Select>
            </FormControl>

            {/* HỌC KỲ */}
            <FormControl
              fullWidth
              size="small"
            >
              <InputLabel>
                Học kỳ
              </InputLabel>

              <Select
                value={selectedSemester}
                label="Học kỳ"
                onChange={(e) =>
                  updateConfigField(
                    "hocKy",
                    e.target.value
                  )
                }
                sx={{
                  bgcolor: "#fff",
                  borderRadius: "5px",

                  "& .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor:
                        "#dbe2ea",
                    },

                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor:
                        "#1976d2",
                      borderWidth: 2,
                    },
                }}
              >
                <MenuItem value="Giữa kỳ I">
                  Giữa kỳ I
                </MenuItem>

                <MenuItem value="Cuối kỳ I">
                  Cuối kỳ I
                </MenuItem>

                <MenuItem value="Giữa kỳ II">
                  Giữa kỳ II
                </MenuItem>

                <MenuItem value="Cuối năm">
                  Cuối năm
                </MenuItem>
              </Select>
            </FormControl>

            {/* LỚP */}
            <Box
              sx={{
                p: 1.6,
                borderRadius: "5px",
                bgcolor: "#fff",
                border:
                  "1px solid #e2e8f0",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 700,
                  mb: 1.5,
                  color: "#1e293b",
                }}
              >
                Quản lý lớp
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
              >
                <FormControl
                  size="small"
                  fullWidth
                >
                  <InputLabel>
                    Lớp
                  </InputLabel>

                  <Select
                    value={selectedClass}
                    label="Lớp"
                    onChange={(e) =>
                      updateConfigField(
                        "lop",
                        e.target.value
                      )
                    }
                    sx={{
                      bgcolor: "#fff",
                      borderRadius:
                        "5px",

                      "& .MuiOutlinedInput-notchedOutline":
                        {
                          borderColor:
                            "#dbe2ea",
                        },

                      "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                        {
                          borderColor:
                            "#1976d2",
                          borderWidth: 2,
                        },
                    }}
                  >
                    {classes.map(
                      (cls) => (
                        <MenuItem
                          key={cls}
                          value={cls}
                        >
                          {cls}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>

                <Tooltip title="Thêm lớp">
                  <IconButton
                    onClick={() =>
                      setAddingClass(true)
                    }
                    sx={{
                      color: "#fff",
                      bgcolor: "#22c55e",

                      "&:hover": {
                        bgcolor:
                          "#16a34a",
                      },
                    }}
                  >
                    <Add />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Xóa lớp">
                  <IconButton
                    onClick={
                      handleDeleteClass
                    }
                    sx={{
                      color: "#fff",
                      bgcolor: "#ef4444",

                      "&:hover": {
                        bgcolor:
                          "#dc2626",
                      },
                    }}
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              </Stack>

              {addingClass && (
                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  spacing={1}
                  mt={1.5}
                >
                  <Tooltip
                    title="Ví dụ: 4.1->4.6, 5A->5H"
                    arrow
                  >
                    <TextField
                      size="small"
                      label="Tên lớp"
                      placeholder="VD: 3A->3K"
                      value={newClass}
                      onChange={(e) =>
                        setNewClass(
                          e.target.value
                        )
                      }
                      fullWidth
                    />
                  </Tooltip>

                  <Button
                    variant="contained"
                    onClick={
                      handleAddClass
                    }
                    sx={{
                      textTransform:
                        "none",
                      borderRadius:
                        "12px",
                      fontWeight: 700,
                      boxShadow:
                        "none",
                    }}
                  >
                    Lưu
                  </Button>

                  <Button
                    onClick={() =>
                      setAddingClass(
                        false
                      )
                    }
                    sx={{
                      textTransform:
                        "none",
                    }}
                  >
                    Hủy
                  </Button>
                </Stack>
              )}
            </Box>

            {/* THỜI GIAN */}
            <Box
              sx={{
                p: 1.6,
                borderRadius: "5px",
                bgcolor: "#fff",
                border:
                  "1px solid #e2e8f0",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 700,
                  mb: 1.5,
                  color: "#1e293b",
                }}
              >
                Thời gian làm bài
              </Typography>

              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
              >
                <TextField
                  type="number"
                  size="small"
                  value={timeInput}
                  onChange={(e) =>
                    handleTimeLimitChange(
                      e.target.value
                    )
                  }
                  inputProps={{
                    min: 1,
                    style: {
                      width: 65,
                      textAlign:
                        "center",
                    },
                  }}
                />

                <Typography
                  sx={{
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  phút
                </Typography>
              </Stack>
            </Box>

            {/* TÙY CHỌN */}
            {/* ===== LOẠI ĐỀ ===== */}
            <Box
              sx={{
                p: 1.6,
                borderRadius: "5px",
                bgcolor: "#fff",
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 700,
                  mb: 1.5,
                  color: "#1e293b",
                }}
              >
                Loại đề
              </Typography>

              <RadioGroup
                row
                value={config.examType || "ktdk"}
                onChange={(e) =>
                  updateConfigField(
                    "examType",
                    e.target.value
                  )
                }
              >
                <FormControlLabel
                  value="ktdk"
                  control={<Radio size="small" />}
                  label="KTĐK"
                />

                <FormControlLabel
                  value="on_tap"
                  control={<Radio size="small" />}
                  label="Ôn tập"
                />
              </RadioGroup>
            </Box>

            {/* ===== HIỂN THỊ KẾT QUẢ ===== */}
            <Box
              sx={{
                p: 1.6,
                borderRadius: "5px",
                bgcolor: "#fff",
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 700,
                  mb: 1.5,
                  color: "#1e293b",
                }}
              >
                Hiển thị kết quả
              </Typography>

              <Stack spacing={0.5}>

                {/* CHO XEM ĐIỂM */}
                <Box
                  onClick={() =>
                    updateConfigField(
                      "choXemDiem",
                      !config.choXemDiem
                    )
                  }
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <Checkbox
                    checked={config.choXemDiem || false}
                    onChange={(e) =>
                      updateConfigField(
                        "choXemDiem",
                        e.target.checked
                      )
                    }
                    onClick={(e) => e.stopPropagation()}
                  />

                  <Typography>
                    Cho xem điểm
                  </Typography>
                </Box>

                {/* CHO XEM ĐÁP ÁN */}
                <Box
                  onClick={() =>
                    updateConfigField(
                      "choXemDapAn",
                      !config.choXemDapAn
                    )
                  }
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <Checkbox
                    checked={config.choXemDapAn || false}
                    onChange={(e) =>
                      updateConfigField(
                        "choXemDapAn",
                        e.target.checked
                      )
                    }
                    onClick={(e) => e.stopPropagation()}
                  />

                  <Typography>
                    Cho xem đáp án
                  </Typography>
                </Box>

                {/* XUẤT FILE BÀI LÀM */}
                <Box
                  onClick={() =>
                    updateConfigField(
                      "xuatFileBaiLam",
                      !config.xuatFileBaiLam
                    )
                  }
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <Checkbox
                    checked={config.xuatFileBaiLam || false}
                    onChange={(e) =>
                      updateConfigField(
                        "xuatFileBaiLam",
                        e.target.checked
                      )
                    }
                    onClick={(e) => e.stopPropagation()}
                  />

                  <Typography>
                    Xuất file bài làm
                  </Typography>
                </Box>

              </Stack>
            </Box>

            {/* ===== HỆ THỐNG ===== */}
            <Box
              sx={{
                p: 1.6,
                borderRadius: "5px",
                bgcolor: "#fff",
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 700,
                  mb: 1.5,
                  color: "#1e293b",
                }}
              >
                Hệ thống
              </Typography>

              <Stack spacing={0.5}>

                {/* KHÓA HỆ THỐNG */}
                <Box
                  onClick={() =>
                    updateConfigField(
                      "khoaHeThong",
                      !config.khoaHeThong
                    )
                  }
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <Checkbox
                    checked={config.khoaHeThong || false}
                    onChange={(e) =>
                      updateConfigField(
                        "khoaHeThong",
                        e.target.checked
                      )
                    }
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      color: "#ef4444",
                      "&.Mui-checked": {
                        color: "#ef4444",
                      },
                    }}
                  />

                  <Typography
                    fontWeight={700}
                    color="#ef4444"
                  >
                    Khóa hệ thống
                  </Typography>
                </Box>

              </Stack>
            </Box>

            {/* ACTIONS */}
            <Stack
              direction="row"
              spacing={1.5}
            >
              <Button
                fullWidth
                variant="contained"
                onClick={() =>
                  setOpenBackup(true)
                }
                sx={{
                  textTransform:
                    "none",
                  borderRadius:
                    "12px",
                  py: 1,
                  fontWeight: 700,
                  boxShadow: "none",
                }}
              >
                Sao lưu
              </Button>

              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                onClick={() =>
                  setOpenRestore(true)
                }
                sx={{
                  textTransform:
                    "none",
                  borderRadius:
                    "12px",
                  py: 1,
                  fontWeight: 700,
                }}
              >
                Phục hồi
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Card>
      
      )}
      {/* Backup */}
      {openBackup && (
        <BackupPage
          open={openBackup}
          onClose={() =>
            setOpenBackup(false)
          }
        />
      )}

      {/* Restore */}
      {openRestore && (
        <RestorePage
          open={openRestore}
          onClose={() =>
            setOpenRestore(false)
          }
        />
      )}
    </Box>

    {/* Snackbar */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={() =>
        setSnackbar((s) => ({
          ...s,
          open: false,
        }))
      }
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
    >
      <Alert
        severity={snackbar.severity}
        variant="filled"
      >
        {snackbar.message}
      </Alert>
    </Snackbar>

    {/* Dialog đổi mật khẩu */}
    <Dialog
      open={openChangePw}
      onClose={() =>
        setOpenChangePw(false)
      }
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "14px",
        },
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 1.5,
          background: "#1976d2",
          color: "#fff",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            Đổi mật khẩu
          </Typography>

          <IconButton
            onClick={() =>
              setOpenChangePw(false)
            }
            sx={{
              color: "#fff",
              bgcolor:
                "rgba(255,255,255,0.12)",

              "&:hover": {
                bgcolor:
                  "rgba(255,255,255,0.22)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Mật khẩu mới"
            type="password"
            fullWidth
            size="small"
            value={newPw}
            onChange={(e) =>
              setNewPw(
                e.target.value
              )
            }
          />

          <TextField
            label="Nhập lại mật khẩu"
            type="password"
            fullWidth
            size="small"
            value={confirmPw}
            onChange={(e) =>
              setConfirmPw(
                e.target.value
              )
            }
          />

          {pwError && (
            <Typography
              color="error"
              fontWeight={600}
            >
              {pwError}
            </Typography>
          )}

          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={1}
          >
            <Button
              onClick={() =>
                setOpenChangePw(false)
              }
              sx={{
                textTransform:
                  "none",
              }}
            >
              Hủy
            </Button>

            <Button
              variant="contained"
              onClick={
                handleChangePassword
              }
              sx={{
                textTransform:
                  "none",
                borderRadius:
                  "12px",
                fontWeight: 700,
                boxShadow: "none",
              }}
            >
              Lưu
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>

  </Box>
);
}
