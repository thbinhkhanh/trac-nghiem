import React, { useContext, useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AppBar, Toolbar, Button, Typography, Box } from "@mui/material";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// 🔹 Import các trang còn sử dụng
import HocSinh from "./pages/Info";
import Login from "./pages/Login";
import QuanTri from "./pages/QuanTri";
import TracNghiem from "./pages/TracNghiem";
import TracNghiemGV from "./pages/TracNghiemGV";
import TongHopKQ from "./pages/TongHopKQ";

// 🔹 Import context
import { StudentProvider } from "./context/StudentContext";
import { ConfigProvider, ConfigContext } from "./context/ConfigContext";
import { TracNghiemProvider } from "./context/TracNghiemContext";
import { StudentDataProvider } from "./context/StudentDataContext";
import { StudentKTDKProvider } from "./context/StudentKTDKContext";

// 🔹 Import icon
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SchoolIcon from "@mui/icons-material/School";
import SettingsIcon from "@mui/icons-material/Settings";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { config, setConfig } = useContext(ConfigContext);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ Lấy trạng thái login ban đầu
  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  // ✅ Theo dõi thay đổi login giữa các tab
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(localStorage.getItem("loggedIn") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ✅ Hàm xử lý đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("account");
    setIsLoggedIn(false);
    setConfig((prev) => ({ ...prev, login: false }));
    navigate("/login");

    setTimeout(() => {
      const docRef = doc(db, "CONFIG", "config");
      setDoc(docRef, { login: false }, { merge: true }).catch(() => {});
    }, 0);
  };

  // ✅ Danh sách menu
  const navItems = [
    { path: "/hocsinh", label: "Học sinh", icon: <MenuBookIcon fontSize="small" /> },
    ...(isLoggedIn
      ? [
          //{ path: "/tracnghiem", label: "Trắc nghiệm", icon: <SchoolIcon fontSize="small" /> },
          { path: "/tonghopkq", label: "Kết quả", icon: <MenuBookIcon fontSize="small" /> },
          { path: "/tracnghiem-gv", label: "Soạn đề", icon: <MenuBookIcon fontSize="small" /> },           
          { path: "/quan-tri", label: "Hệ thống", icon: <SettingsIcon fontSize="small" /> },
          { label: "Đăng xuất", onClick: handleLogout, icon: <LogoutIcon fontSize="small" /> },
        ]
      : [{ path: "/login", label: "Đăng nhập", icon: <LoginIcon fontSize="small" /> }]),
  ];

  return (
    <>
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
          {/* 🔹 Logo + Menu */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              component="img"
              src="/Logo.png"
              alt="Logo"
              sx={{ height: 34, flexShrink: 0, ml: { xs: -1, sm: -2 }, mr: 1 }}
            />
            {navItems.map((item) => (
              <Button
                key={item.path || item.label}
                component={item.path ? Link : "button"}
                to={item.path || undefined}
                onClick={item.onClick || undefined}
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
                    location.pathname === item.path ? "3px solid #fff" : "3px solid transparent",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                }}
              >
                {item.icon}
                <Typography variant="body2" sx={{ ml: 0.3 }}>
                  {item.label}
                </Typography>
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>

      {/* 🔹 Nội dung các trang */}
      <Box sx={{ paddingTop: "44px" }}>
        <Routes>
          <Route path="/" element={<Navigate to="/hocsinh" replace />} />
          <Route path="/hocsinh" element={<HocSinh />} />
          <Route path="/tracnghiem" element={<TracNghiem />} />
          <Route path="/tracnghiem-gv" element={<TracNghiemGV />} />
          <Route path="/tonghopkq" element={<TongHopKQ/>} />
          <Route path="/quan-tri" element={<QuanTri />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Box>
    </>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <TracNghiemProvider>
        <StudentProvider>
          <StudentDataProvider>
            <StudentKTDKProvider>
              <AppContent />
            </StudentKTDKProvider>
          </StudentDataProvider>
        </StudentProvider>
      </TracNghiemProvider>
    </ConfigProvider>
  );
}
