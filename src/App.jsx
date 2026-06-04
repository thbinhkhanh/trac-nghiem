import React, { useEffect, useState, useContext } from "react";
import {
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";

import {
  AppBar,
  Toolbar,
  Button,
  Typography,
  Box,
  IconButton,
  Menu,
  Dialog,
  DialogContent,
  TextField,
  Stack,
  Snackbar, 
  Alert,
  Tooltip
} from "@mui/material";

import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

import AppsIcon from "@mui/icons-material/Apps";
import CloseIcon from "@mui/icons-material/Close";

import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

// 🔹 Pages
import HocSinh from "./pages/HocSinh";
import GiaoVien from "./pages/GiaoVien";
import DanhSach from "./pages/DanhSach";
import NhapdiemKTDK from "./pages/NhapdiemKTDK";
import XuatDanhGia from "./pages/XuatDanhGia";
import Login from "./pages/Login";
import TongHopKQ from "./pages/TongHopKQ";
import TracNghiemGV from "./pages/TracNghiemGV";
import TracNghiemTest from "./pages/TracNghiem_Test";
import DeThi from "./pages/DeThi";
import QuanTri from "./pages/QuanTri";
import TracNghiem from "./pages/TracNghiem";

// 🔹 Provider
import { QuizProvider } from "./context/QuizContext";
import { StudentQuizProvider } from "./context/StudentQuizContext";
import { TeacherQuizProvider } from "./context/TeacherQuizContext";
import { ConfigProvider, ConfigContext } from "./context/ConfigContext";
import { AdminProvider } from "./context/AdminContext";
import { TracNghiemProvider } from "./context/TracNghiemContext";
import { StudentProvider } from "./context/StudentContext";
import { StudentDataProvider } from "./context/StudentDataContext";
import { StudentKTDKProvider } from "./context/StudentKTDKContext";
import { SelectedClassProvider } from "./context/SelectedClassContext";

// 🔥 DASHBOARD
function Dashboard({ isLoggedIn }) {
  const navigate = useNavigate();

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const cards = [
    {
      label: "Phòng thi trực tuyến",
      description: "Làm bài kiểm tra và thi trực tuyến",
      path: "/hocsinh",
      icon: "🎓",
      color: "#1976d2",
    },
    {
      label: "Theo dõi, quản lí KTĐK",
      description: "Tra cứu kết quả kiểm tra và ôn tập của học sinh theo lớp",
      path: "/giaovien",
      icon: "👨‍🏫",
      color: "#2e7d32",
    },
    {
      label: "Kết quả KTĐK",
      description: "Tra cứu và tổng hợp kết quả kiểm tra định kỳ, ôn tập",
      path: "/ketqua",
      icon: "📊",
      color: "#9c27b0",
    },
    {
      label: "Nhập điểm, đánh giá",
      description: "Nhập điểm KTĐK, đánh giá mức đạt và nhận xét học sinh",
      path: "/nhapdiem-ktdk",
      icon: "✏️",
      color: "#ed6c02",
    },
    {
      label: "Xuất đánh giá ra C1",
      description: "Xuất dữ liệu đánh giá sang biểu mẫu C1",
      path: "/xuat-danh-gia",
      icon: "📄",
      color: "#0288d1",
    },
    {
      label: "Danh sách học sinh",
      description: "Thêm, sửa, xóa học sinh và quản lý dữ liệu lớp học",
      path: "/danhsach",
      icon: "📋",
      color: "#00796b",
    },
    {
      label: "Soạn đề",
      description: "Tạo đề thi và quản lý ngân hàng câu hỏi",
      path: "/tracnghiem-gv",
      icon: "🧠",
      color: "#c2185b",
    },
    {
      label: "Test đề",
      description: "Kiểm tra thử đề thi trước khi sử dụng",
      path: "/tracnghiem-test",
      icon: "🧪",
      color: "#6a1b9a",
    },
    {
      label: "Đề thi",
      description: "Chọn đề thi và đề ôn tập từ ngân hàng đề",
      path: "/de-thi",
      icon: "📝",
      color: "#ef6c00",
    },
    {
      label: "Cài đặt hệ thống",
      description: "Quản trị và cấu hình hệ thống",
      path: "/quan-tri",
      icon: "⚙️",
      color: "#455a64",
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", p: 5, bgcolor: "#f4f6f8" }}>
      <Typography
        variant="h5"
        fontWeight={700}
        mb={5}
        sx={{
          fontFamily: '"Segoe UI","Arial","Helvetica","Noto Sans","sans-serif"',
        }}
      >
        CHỨC NĂNG CHÍNH
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 4,
        }}
      >
        {cards.map((item) => (
          <Box
            key={item.path}
            onClick={() => navigate(item.path)}
            sx={{
              bgcolor: "white",
              borderRadius: 4,
              p: 4,
              minHeight: 220,
              cursor: "pointer",
              transition: "0.25s",
              boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
              display: "flex",
              flexDirection: "column",
              "&:hover": {
                transform: "translateY(-8px)",
                boxShadow: "0 14px 28px rgba(0,0,0,0.18)",
              },
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: item.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                color: "white",
                mb: 2,
              }}
            >
              {item.icon}
            </Box>

            <Typography
              fontWeight={700}
              fontSize={18}
              sx={{ mb: 1 }}
            >
              {item.label}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "#64748b",
                lineHeight: 1.6,
              }}
            >
              {item.description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// 🔥 APP CONTENT
function AppContent() {
  const navigate = useNavigate();
  const { config, setConfig } = useContext(ConfigContext);

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("loggedIn") === "true"
  );

  const [openLogo, setOpenLogo] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const [openChangePw, setOpenChangePw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("loggedIn") === "true");
  }, []);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("account");

    setIsLoggedIn(false);
    setConfig((prev) => ({ ...prev, login: false }));

    navigate("/hocsinh", { replace: true });
  };

  const account = localStorage.getItem("account") || "";

  const handleChangePassword = async () => {
    if (!newPw.trim()) {
      setPwError("❌ Mật khẩu mới không được để trống!");
      return;
    }

    if (newPw !== confirmPw) {
      setPwError("❌ Mật khẩu nhập lại không khớp!");
      return;
    }

    // ✅ PASS VALID → đóng dialog + báo thành công ngay
    setPwError("");
    setOpenChangePw(false);

    setSnackbar({
      open: true,
      message: "✅ Đổi mật khẩu thành công!",
      severity: "success",
    });

    const docId = account === "TH Lâm Văn Bền" ? "lvb" : "admin";

    // 🔥 Firestore chạy nền (không chặn UI)
    setDoc(
      doc(db, "MATKHAU", docId),
      { pass: newPw },
      { merge: true }
    ).catch((err) => {
      console.error("Lỗi lưu mật khẩu:", err);

      setSnackbar({
        open: true,
        message: "❌ Lưu mật khẩu thất bại!",
        severity: "error",
      });
    });

    // reset input
    setNewPw("");
    setConfirmPw("");
  };

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  return (
    <>
      {/* APP BAR */}
      <AppBar position="fixed" sx={{ background: "#1976d2" }}>
        <Toolbar
          variant="dense"
          sx={{
            minHeight: "50px !important",
            px: 1.5,
            gap: 1,
          }}
        >
          <Box component="img" src="/Logo.png" sx={{ height: 34 }} />

          {!isLoggedIn ? (
            <Button
              component={Link}
              to="/login"
              sx={{
                color: "#fff",
                ml: "auto",
                textDecoration: "none",
                "&:hover": {
                  color: "#fff",
                  textDecoration: "none",
                },
                "&:visited": {
                  color: "#fff",
                },
              }}
            >
              Đăng nhập
            </Button>
          ) : (
            <>
              <Button
                component={Link}
                to="/dashboard"
                sx={{
                  color: "#fff",
                  "&:hover": {
                    color: "#fff",
                  },
                }}
              >
                Dashboard
              </Button>

              <Box
                sx={{
                  ml: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    minWidth: 130,
                    px: 1.3,
                    py: 0.4,
                    borderRadius: 999,
                    fontSize: 14,
                    bgcolor: "rgba(255,255,255,0.12)",
                    color: "#fff",
                    textAlign: "center",
                  }}
                >
                  Năm học: {config?.namHoc || "2025-2026"}
                </Box>

                {account === "Admin" ? (
                  <Tooltip title="Quản trị viên" arrow>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        bgcolor: "#FFD700",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(255,215,0,0.4)",
                      }}
                    >
                      <AdminPanelSettingsIcon
                        sx={{
                          color: "#5D4037",
                          fontSize: 22,
                        }}
                      />
                    </Box>
                  </Tooltip>
                ) : (
                  <Tooltip title="Lâm Văn Bền" arrow>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        bgcolor: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(255,255,255,0.25)",
                      }}
                    >
                      <PersonIcon
                        sx={{
                          color: "#1976d2",
                          fontSize: 22,
                        }}
                      />
                    </Box>
                  </Tooltip>
                )}

                <IconButton onClick={handleMenuOpen} sx={{ color: "white" }}>
                  <AppsIcon sx={{ fontSize: 32 }} />
                </IconButton>
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* MENU */}
      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            width: 130,
            //borderRadius: "14px",
            overflow: "hidden",
            boxShadow: "0 12px 35px rgba(0,0,0,0.18)",
            p: 0,
          },
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            bgcolor: "#fff",
            fontWeight: 600,
            fontSize: 14,
            borderBottom: "1px solid #eee",
            color: "#d32f2f", // 🔴 màu đỏ
          }}
        >
          THÔNG TIN
        </Box>

        {/* ITEM 1 */}
        <Box
          onClick={() => {
            handleMenuClose();
            setOpenChangePw(true);
          }}
          sx={{
            px: 2,
            py: 1.5,
            cursor: "pointer",
            bgcolor: "#f5f7fa",
            transition: "0.2s",
            "&:hover": { bgcolor: "#e9eef5" },
          }}
        >
          Đổi mật khẩu
        </Box>

        {/* 🔥 LINE NGĂN CÁCH */}
        <Box
          sx={{
            height: "1px",
            bgcolor: "#e5e7eb",
            mx: 1,
          }}
        />

        {/* ITEM 2 */}
        <Box
          onClick={() => {
            handleMenuClose();
            handleLogout();
          }}
          sx={{
            px: 2,
            py: 1.5,
            cursor: "pointer",
            bgcolor: "#f5f7fa",
            transition: "0.2s",
            "&:hover": { bgcolor: "#e9eef5" },
          }}
        >
          Đăng xuất
        </Box>
      </Menu>
      
      {/* DIALOG ĐỔI MẬT KHẨU */}
      <Dialog
        open={openChangePw}
        onClose={() => setOpenChangePw(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "18px",
            overflow: "hidden",
            background: "#f8fafc",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          },
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            px: 3,
            py: 1.5,
            color: "#fff",
            background: "linear-gradient(135deg, #1976d2, #42a5f5)",
            position: "relative",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                bgcolor: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                fontSize: 16,
              }}
            >
              🔐
            </Box>

            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
              Đổi mật khẩu
            </Typography>
          </Stack>

          <IconButton
            onClick={() => setOpenChangePw(false)}
            sx={{
              position: "absolute",
              right: 10,
              top: 10,
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.15)",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.25)",
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* CONTENT */}
        <DialogContent sx={{ px: 3, py: 4 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Mật khẩu mới"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              fullWidth
            />

            <TextField
              label="Nhập lại mật khẩu"
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              fullWidth
            />

            {pwError && (
              <Typography color="error" sx={{ textAlign: "center" }}>
                {pwError}
              </Typography>
            )}
          </Stack>
        </DialogContent>

        {/* FOOTER */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          sx={{ pb: 3 }}
        >
          <Button
            variant="outlined"
            onClick={() => setOpenChangePw(false)}
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
            onClick={handleChangePassword}
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
        </Stack>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar((prev) => ({ ...prev, open: false }))
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Toolbar variant="dense" />   

      {/* ROUTES */}
      <Box>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/dashboard" element={<Dashboard isLoggedIn={isLoggedIn} />} />
          <Route path="/hocsinh" element={<HocSinh />} />
          <Route path="/giaovien" element={<GiaoVien />} />
          <Route path="/danhsach" element={<DanhSach />} />
          <Route path="/nhapdiem-ktdk" element={<NhapdiemKTDK />} />
          <Route path="/xuat-danh-gia" element={<XuatDanhGia />} />
          <Route path="/ketqua" element={<TongHopKQ />} />
          <Route path="/tracnghiem-gv" element={<TracNghiemGV />} />
          <Route path="/tracnghiem-test" element={<TracNghiemTest />} />
          <Route path="/de-thi" element={<DeThi />} />
          <Route path="/quan-tri" element={<QuanTri />} />
          <Route path="/tracnghiem" element={<TracNghiem />} />
        </Routes>
      </Box>

      {/* LOGO POPUP */}
      {openLogo && (
        <Box onClick={() => setOpenLogo(false)}
          sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.6)" }}>
          <Box sx={{ bgcolor: "#fff", p: 3 }}>
            <img src="/Logo.png" width={200} />
          </Box>
        </Box>
      )}
    </>
  );
}

// PROVIDER
export default function App() {
  return (
    <TeacherQuizProvider>
      <StudentQuizProvider>
        <QuizProvider>
          <ConfigProvider>
            <AdminProvider>
              <TracNghiemProvider>
                <StudentProvider>
                  <StudentDataProvider>
                    <StudentKTDKProvider>
                      <SelectedClassProvider>
                        <AppContent />
                      </SelectedClassProvider>
                    </StudentKTDKProvider>
                  </StudentDataProvider>
                </StudentProvider>
              </TracNghiemProvider>
            </AdminProvider>
          </ConfigProvider>
        </QuizProvider>
      </StudentQuizProvider>
    </TeacherQuizProvider>
  );
}