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

// 🔹 Pages (CHỈ GIỮ 7 MENU)
import Info from "./pages/Info";
import Login from "./pages/Login";
import TongHopKQ from "./pages/TongHopKQ";
import TracNghiemGV from "./pages/TracNghiemGV";
import TracNghiemTest from "./pages/TracNghiem_Test";
import DeThi from "./pages/DeThi";
import QuanTri from "./pages/QuanTri";
import SystemLockedDialog from "./dialog/SystemLockedDialog";
import TracNghiem from "./pages/TracNghiem";


// 🔹 Context (giữ nguyên)
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

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openLockedDialog, setOpenLockedDialog] = useState(false);


  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("loggedIn") === "true");
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("account");
    setIsLoggedIn(false);
    setConfig((prev) => ({ ...prev, login: false }));
    navigate("/login");
  };

  const handleHocKyChange = (e) => {
    const hocKy = e.target.value;
    const newConfig = { ...config, hocKy };
    setConfig(newConfig);
    localStorage.setItem("appConfig", JSON.stringify(newConfig));
  };

  const handleHocSinhClick = (e) => {
    if (config?.khoaHeThong) {
      e.preventDefault();           // ❌ chặn chuyển trang
      setOpenLockedDialog(true);    // 🔒 mở dialog
    }
  };

  // ✅ CHỈ 7 MENU – GIỮ NGUYÊN CẤU TRÚC
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
      {/* ===== GIỮ NGUYÊN THANH MENU GỐC ===== */}
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
              sx={{
                height: 34,
                flexShrink: 0,
                ml: { xs: -1, sm: -2 },
                mr: 1,
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
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.8,
                  minHeight: "auto",
                  flexShrink: 0,
                  borderBottom:
                    location.pathname === item.path
                      ? "3px solid #fff"
                      : "3px solid transparent",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.1)",
                    opacity: 1,
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ ml: 0.3, color: "white", opacity: 1 }}
                >
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

      {/* ===== ROUTES (CHỈ 7 MENU) ===== */}
      <Box sx={{ paddingTop: "44px" }}>
        <Routes>
          <Route path="/" element={<Navigate to="/hocsinh" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/hocsinh" element={<Info />} />

          <Route
            path="/ketqua"
            element={isLoggedIn ? <TongHopKQ /> : <Navigate to="/login" />}
          />
          <Route
            path="/tracnghiem-gv"
            element={isLoggedIn ? <TracNghiemGV /> : <Navigate to="/login" />}
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

          <Route
            path="/tracnghiem"
            element={<TracNghiem />}
          />

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
  );
}
