import React, { useEffect, useState, useContext } from "react";
import {
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
} from "@mui/material";

// Icons
import MenuIcon from "@mui/icons-material/Menu";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import LoginIcon from "@mui/icons-material/Login";

// Pages
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

// Providers
import { QuizProvider } from "./context/QuizContext";
import { StudentQuizProvider } from "./context/StudentQuizContext";
import { TeacherQuizProvider } from "./context/TeacherQuizContext";

// Dialog
import SystemLockedDialog from "./dialog/SystemLockedDialog";

// Context
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

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("loggedIn") === "true"
  );

  const [loading, setLoading] = useState(true);
  const [openLockedDialog, setOpenLockedDialog] = useState(false);
  const [openLogo, setOpenLogo] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setConfig((prev) => ({ ...prev, login: false }));
    navigate("/login", { replace: true });
  };

  const handleHocSinhClick = (e) => {
    if (config?.khoaHeThong) {
      e.preventDefault();
      setOpenLockedDialog(true);
    }
  };

  if (loading) return null;

  return (
    <>
      {/* ================= APP BAR ================= */}
      <AppBar position="fixed" sx={{ background: "#1976d2" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={() => setOpenMenu(true)} sx={{ color: "white" }}>
              <MenuIcon />
            </IconButton>

            <Box
              component="img"
              src="/Logo.png"
              alt="Logo"
              onClick={() => setOpenLogo(true)}
              sx={{ height: 32, cursor: "pointer" }}
            />
          </Box>

          {isLoggedIn && (
            <Box
              sx={{
                color: "white",
                fontWeight: 600,
                px: 2,
                py: 0.5,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              {config?.namHoc || "2025-2026"}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* ================= DRAWER MENU ================= */}
      <Drawer open={openMenu} onClose={() => setOpenMenu(false)}>
        <Box sx={{ width: 260, p: 1 }}>
          <Box sx={{ p: 2, fontWeight: 700, fontSize: 18 }}>
            HỆ THỐNG
          </Box>

          <Divider />

          <List>
            {/* Học sinh luôn có */}
            <ListItemButton
              component={Link}
              to="/hocsinh"
              onClick={() => setOpenMenu(false)}
            >
              <ListItemIcon><SchoolIcon /></ListItemIcon>
              <ListItemText primary="Học sinh" />
            </ListItemButton>

            {/* ĐÃ LOGIN */}
            {isLoggedIn ? (
              <>
                <ListItemButton component={Link} to="/giaovien" onClick={() => setOpenMenu(false)}>
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText primary="Giáo viên" />
                </ListItemButton>

                <ListItemButton component={Link} to="/ketqua" onClick={() => setOpenMenu(false)}>
                  <ListItemIcon><AssessmentIcon /></ListItemIcon>
                  <ListItemText primary="Kết quả" />
                </ListItemButton>

                <ListItemButton component={Link} to="/xuat-danh-gia" onClick={() => setOpenMenu(false)}>
                  <ListItemIcon><AssessmentIcon /></ListItemIcon>
                  <ListItemText primary="Xuất đánh giá" />
                </ListItemButton>

                <ListItemButton component={Link} to="/nhapdiem-ktdk" onClick={() => setOpenMenu(false)}>
                  <ListItemIcon><AssessmentIcon /></ListItemIcon>
                  <ListItemText primary="Nhập điểm" />
                </ListItemButton>

                <Divider />

                <ListItemButton component={Link} to="/tracnghiem-gv" onClick={() => setOpenMenu(false)}>
                  <ListItemIcon><SchoolIcon /></ListItemIcon>
                  <ListItemText primary="Soạn đề" />
                </ListItemButton>

                <ListItemButton component={Link} to="/tracnghiem-test" onClick={() => setOpenMenu(false)}>
                  <ListItemIcon><SchoolIcon /></ListItemIcon>
                  <ListItemText primary="Test đề" />
                </ListItemButton>

                <ListItemButton component={Link} to="/de-thi" onClick={() => setOpenMenu(false)}>
                  <ListItemIcon><SchoolIcon /></ListItemIcon>
                  <ListItemText primary="Đề thi" />
                </ListItemButton>

                <Divider />

                <ListItemButton component={Link} to="/quan-tri" onClick={() => setOpenMenu(false)}>
                  <ListItemIcon><SettingsIcon /></ListItemIcon>
                  <ListItemText primary="Hệ thống" />
                </ListItemButton>

                <ListItemButton onClick={handleLogout}>
                  <ListItemIcon><LogoutIcon /></ListItemIcon>
                  <ListItemText primary="Đăng xuất" />
                </ListItemButton>
              </>
            ) : (
              /* ❗ CHƯA LOGIN -> THÊM ĐĂNG NHẬP */
              <>
                <Divider />

                <ListItemButton
                  component={Link}
                  to="/login"
                  onClick={() => setOpenMenu(false)}
                >
                  <ListItemIcon>
                    <LoginIcon />
                  </ListItemIcon>
                  <ListItemText primary="Đăng nhập" />
                </ListItemButton>
              </>
            )}
          </List>
        </Box>
      </Drawer>

      {/* ================= LOGO POPUP ================= */}
      {openLogo && (
        <Box
          onClick={() => setOpenLogo(false)}
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <Box sx={{ bgcolor: "#fff", p: 3, borderRadius: 3 }}>
            <Box component="img" src="/Logo.png" sx={{ width: 200 }} />
          </Box>
        </Box>
      )}

      {/* ================= ROUTES ================= */}
      <Box sx={{ pt: 8 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/hocsinh" />} />

          <Route
            path="/login"
            element={<Login setIsLoggedIn={setIsLoggedIn} />}
          />

          <Route
            path="/hocsinh"
            element={
              config?.giaoDien === "the_ten" ? <HocSinh /> : <Info />
            }
          />

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