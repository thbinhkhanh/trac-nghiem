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
import Login from "./pages/Login";
import TongHopKQ from "./pages/TongHopKQ";
import TracNghiemGV from "./pages/TracNghiemGV";
import TracNghiemTest from "./pages/TracNghiem_Test";
import DeThi from "./pages/DeThi";
import QuanTri from "./pages/QuanTri";
import TracNghiem from "./pages/TracNghiem";

import { QuizProvider } from "./context/QuizContext";
import { StudentQuizProvider } from "./context/StudentQuizContext";
import { TeacherQuizProvider } from "./context/TeacherQuizContext";

// 🔹 Dialog
import SystemLockedDialog from "./dialog/SystemLockedDialog";

// 🔹 Context (GIỮ NGUYÊN)
import { ConfigProvider, ConfigContext } from "./context/ConfigContext";
import { AdminProvider } from "./context/AdminContext";
import { TracNghiemProvider } from "./context/TracNghiemContext";
import { StudentProvider } from "./context/StudentContext";
import { StudentDataProvider } from "./context/StudentDataContext";
import { StudentKTDKProvider } from "./context/StudentKTDKContext";
import { SelectedClassProvider } from "./context/SelectedClassContext";

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { config, setConfig } = useContext(ConfigContext);

  // ✅ LOGIN STATE – LẤY NGAY TỪ localStorage
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("loggedIn") === "true"
  );

  const [loading, setLoading] = useState(true);
  const [openLockedDialog, setOpenLockedDialog] = useState(false);
  const [openLogo, setOpenLogo] = useState(false);

  // ✅ CHỈ DÙNG ĐỂ KẾT THÚC LOADING
  useEffect(() => {
    setLoading(false);
  }, []);

  // ===== LOGOUT =====
  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setConfig((prev) => ({ ...prev, login: false }));
    navigate("/login", { replace: true });
  };

  // ===== HỌC KỲ =====
  const handleHocKyChange = (e) => {
    const hocKy = e.target.value;
    const newConfig = { ...config, hocKy };
    setConfig(newConfig);
    localStorage.setItem("appConfig", JSON.stringify(newConfig));
  };

  // ===== KHÓA HỆ THỐNG =====
  const handleHocSinhClick = (e) => {
    if (config?.khoaHeThong) {
      e.preventDefault();
      setOpenLockedDialog(true);
    }
  };

  // ===== MENU (7 MENU) =====
  const navItems = [
    {
      path: "/hocsinh",
      label: "Học sinh",
      onClick: handleHocSinhClick,
    },

    ...(isLoggedIn
      ? [
          { path: "/ketqua", label: "Kết quả" },
          { path: "/tracnghiem-gv", label: "Soạn đề" },
          { path: "/tracnghiem-test", label: "Test đề" },
          { path: "/de-thi", label: "Đề thi" },
          { path: "/quan-tri", label: "Hệ thống" },
          { label: "Đăng xuất", onClick: handleLogout },
        ]
      : [{ path: "/login", label: "Đăng nhập" }]),
  ];

  if (loading) return null;

  return (
    <>
      {/* ===== APP BAR ===== */}
      <AppBar position="fixed" sx={{ background: "#1976d2" }}>
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            minHeight: "48px !important",
            paddingTop: 0,
            paddingBottom: 0,
            overflowX: "auto",
            whiteSpace: "nowrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              component="img"
              src="/Logo.png"
              alt="Logo"
              onClick={() => setOpenLogo(true)}
              sx={{
                height: 34,
                flexShrink: 0,
                ml: { xs: -1, sm: -2 },
                mr: 1,
                cursor: "pointer",
              }}
            />

            {navItems.map((item) => (
              <Button
                key={item.path || item.label}
                component={item.path ? Link : "button"}
                to={item.path || undefined}
                onClick={item.onClick}
                sx={{
                  color: "white",
                  textTransform: "none",
                  padding: "4px 10px",
                  minHeight: "auto",
                  borderBottom:
                    location.pathname === item.path
                      ? "3px solid #fff"
                      : "3px solid transparent",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <Typography variant="body2" sx={{ color: "white" }}>
                  {item.label}
                </Typography>
              </Button>
            ))}
          </Box>

          {isLoggedIn && (
            <Box sx={{ minWidth: 140, mr: 1 }}>
              <select
                value={config?.hocKy || "Giữa kỳ I"}
                onChange={handleHocKyChange}
                style={{
                  backgroundColor: "transparent",
                  color: "white",
                  borderRadius: "4px",
                  padding: "6px 12px",
                  border: "2px solid white",
                  outline: "none",
                  fontSize: "0.95rem",
                  width: "100%",
                  appearance: "none",
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg fill='white' height='18' viewBox='0 0 24 24' width='18' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPositionX: "calc(100% - 10px)",
                  backgroundPositionY: "center",
                }}
              >
                <option value="Giữa kỳ I">Giữa kỳ I</option>
                <option value="Cuối kỳ I">Cuối kỳ I</option>
                <option value="Giữa kỳ II">Giữa kỳ II</option>
                <option value="Cả năm">Cả năm</option>
              </select>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {openLogo && (
        <Box
          onClick={() => setOpenLogo(false)}
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            cursor: "pointer",
          }}
        >
          {/* Khung trắng */}
          <Box
            onClick={() => setOpenLogo(false)}
            sx={{
              width: "clamp(150px, 42vw, 260px)",
              height: "clamp(150px, 42vw, 260px)",
              bgcolor: "white",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              animation: "zoomIn 0.3s ease",
            }}
          >
            <Box
              component="img"
              src="/Logo.png"
              alt="Logo lớn"
              sx={{
                maxWidth: "85%",
                maxHeight: "85%",
                objectFit: "contain",
              }}
            />
          </Box>
        </Box>
      )}

      {/* ===== ROUTES ===== */}
      <Box sx={{ paddingTop: "44px" }}>
        <Routes>
          <Route path="/" element={<Navigate to="/hocsinh" replace />} />

          <Route
            path="/login"
            element={<Login setIsLoggedIn={setIsLoggedIn} />}
          />

          <Route path="/hocsinh" element={<Info />} />

          <Route
            path="/ketqua"
            element={isLoggedIn ? <TongHopKQ /> : <Navigate to="/login" />}
          />

          <Route
            path="/tracnghiem-gv"
            element={
              isLoggedIn ? (
                <TracNghiemGV setIsLoggedIn={setIsLoggedIn} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/tracnghiem-test"
            element={isLoggedIn ? <TracNghiemTest /> : <Navigate to="/login" />}
          />

          <Route
            path="/de-thi"
            element={isLoggedIn ? <DeThi /> : <Navigate to="/login" />}
          />

          <Route
            path="/quan-tri"
            element={isLoggedIn ? <QuanTri /> : <Navigate to="/login" />}
          />

          <Route path="/tracnghiem" element={<TracNghiem />} />
        </Routes>
      </Box>

      <SystemLockedDialog
        open={openLockedDialog}
        onClose={() => setOpenLockedDialog(false)}
      />
    </>
  );
}

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
