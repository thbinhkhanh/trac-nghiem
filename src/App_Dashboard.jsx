import React, { useEffect, useState, useContext } from "react";
import {
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AppBar, Toolbar, Button, Typography, Box } from "@mui/material";

// 🔹 Pages
import Info from "./pages/Info";
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

// 🔥 DASHBOARD THẺ
function Dashboard({ isLoggedIn }) {
  const navigate = useNavigate();

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const cards = [
    { label: "Học sinh", path: "/hocsinh", icon: "🎓", color: "#1976d2" },
    { label: "Giáo viên", path: "/giaovien", icon: "👨‍🏫", color: "#2e7d32" },
    { label: "Kết quả KTĐK", path: "/ketqua", icon: "📊", color: "#9c27b0" },
    { label: "Nhập điểm, đánh giá", path: "/nhapdiem-ktdk", icon: "✏️", color: "#ed6c02" },
    { label: "Xuất đánh giá ra C1", path: "/xuat-danh-gia", icon: "📄", color: "#0288d1" },
    { label: "Danh sách học sinh", path: "/danhsach", icon: "📋", color: "#00796b" },
    { label: "Soạn đề", path: "/tracnghiem-gv", icon: "🧠", color: "#c2185b" },
    { label: "Test đề", path: "/tracnghiem-test", icon: "🧪", color: "#6a1b9a" },
    { label: "Đề thi", path: "/de-thi", icon: "📝", color: "#ef6c00" },
    { label: "Cài đặt hệ thống", path: "/quan-tri", icon: "⚙️", color: "#455a64" },
  ];

  return (
    <Box sx={{ minHeight: "100vh", p: 5, bgcolor: "#f4f6f8" }}>
      <Typography variant="h4" fontWeight={800} mb={5}>
        Dashboard
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
              cursor: "pointer",
              transition: "0.25s",
              boxShadow: "0 4px 14px rgba(0,0,0,0.08)",

              "&:hover": {
                transform: "translateY(-8px)",
                boxShadow: "0 14px 28px rgba(0,0,0,0.18)",
              },
            }}
          >
            {/* ICON */}
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

            {/* LABEL */}
            <Typography fontWeight={700} fontSize={18}>
              {item.label}
            </Typography>

            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Nhấn để mở chức năng
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { config, setConfig } = useContext(ConfigContext);

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("loggedIn") === "true"
  );

  const [loading, setLoading] = useState(true);
  const [openLockedDialog, setOpenLockedDialog] = useState(false);
  const [openLogo, setOpenLogo] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setConfig((prev) => ({ ...prev, login: false }));
    navigate("/login", { replace: true });
  };

  if (loading) return null;

  return (
    <>
      {/* ===== APP BAR ===== */}
      <AppBar position="fixed" sx={{ background: "#1976d2" }}>
        <Toolbar sx={{ display: "flex", gap: 1 }}>
          <Box
            component="img"
            src="/Logo.png"
            onClick={() => setOpenLogo(true)}
            sx={{ height: 34, cursor: "pointer" }}
          />

          <Button component={Link} to="/hocsinh" sx={{ color: "white" }}>
            Học sinh
          </Button>

          {/* 🔥 CHỈ HIỆN DASHBOARD KHI ĐÃ ĐĂNG NHẬP */}
          {isLoggedIn && (
            <Button component={Link} to="/dashboard" sx={{ color: "white" }}>
              Dashboard
            </Button>
          )}

          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>

            {/* 👤 ACCOUNT */}
            {isLoggedIn && (
              <Box
                sx={{
                  px: 1.3,
                  py: 0.4,
                  borderRadius: "999px",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  bgcolor: "rgba(34,197,94,0.25)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.3)",
                  whiteSpace: "nowrap",
                }}
              >
                <span>👤</span>
                <span>{localStorage.getItem("account") || "Admin"}</span>
              </Box>
            )}

            {/* 📅 NĂM HỌC */}
            {isLoggedIn && (
              <Box
                sx={{
                  px: 1.3,
                  py: 0.4,
                  borderRadius: "999px",
                  fontSize: 13,
                  fontWeight: 600,
                  bgcolor: "rgba(255,255,255,0.12)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.3)",
                  whiteSpace: "nowrap",
                }}
              >
                📅 {config?.namHoc || "2025-2026"}
              </Box>
            )}

            {/* 🔘 LOGIN / LOGOUT */}
            {isLoggedIn ? (
              <Button
                onClick={handleLogout}
                sx={{
                  color: "white",
                  borderRadius: "999px",
                  px: 2,
                  py: 0.4,
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: "none",
                  bgcolor: "rgba(239,68,68,0.25)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  "&:hover": {
                    bgcolor: "rgba(239,68,68,0.4)",
                  },
                }}
              >
                Đăng xuất
              </Button>
            ) : (
              <Button
                component={Link}
                to="/login"
                sx={{
                  color: "white",
                  borderRadius: "999px",
                  px: 2,
                  py: 0.4,
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: "none",
                  bgcolor: "rgba(59,130,246,0.25)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  "&:hover": {
                    bgcolor: "rgba(59,130,246,0.4)",
                  },
                }}
              >
                Đăng nhập
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* ===== ROUTES ===== */}
      <Box sx={{ pt: 8 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/login"
            element={<Login setIsLoggedIn={setIsLoggedIn} />}
          />

          {/* 🔥 DASHBOARD */}
          <Route
            path="/dashboard"
            element={<Dashboard isLoggedIn={isLoggedIn} />}
          />

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
        <Box onClick={() => setOpenLogo(false)} sx={{
          position: "fixed",
          inset: 0,
          bgcolor: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Box sx={{ bgcolor: "white", p: 3, borderRadius: 2 }}>
            <img src="/Logo.png" width={200} />
          </Box>
        </Box>
      )}
    </>
  );
}

// ===== PROVIDERS GIỮ NGUYÊN =====
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