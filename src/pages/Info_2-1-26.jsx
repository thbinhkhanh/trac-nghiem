import React, { useState, useEffect, useContext } from "react";
import { Box, Typography, TextField, Button, Stack, Card, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import SchoolIcon from '@mui/icons-material/School';
import { useNavigate } from "react-router-dom";
import { ConfigContext } from "../context/ConfigContext";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { db } from "../firebase";

// Danh sách trường gốc
const SCHOOL_LIST = ["TH Lâm Văn Bền", "TH Bình Khánh"];

export default function Info() {
  const [school, setSchool] = useState("");
  const [fullname, setFullname] = useState("");
  const [lop, setLop] = useState("");
  const [classes, setClasses] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [khoi, setKhoi] = useState("Khối 3");   // 👉 mặc định Khối 3
  const [filteredClasses, setFilteredClasses] = useState([]);

  const [allowedSchool, setAllowedSchool] = useState({
    "TH Lâm Văn Bền": true,
    "TH Bình Khánh": true,
  });

  const navigate = useNavigate();
  const { setConfig } = useContext(ConfigContext);

  useEffect(() => {
    if (!khoi) {
      setFilteredClasses([]);
      return;
    }

    const soKhoi = khoi.replace("Khối ", ""); // "Khối 1" → "1"

    const filtered = classes.filter(cl => cl.startsWith(soKhoi));
    setFilteredClasses(filtered);

    // Reset lớp khi đổi khối
    setLop("");
  }, [khoi, classes]);


  // 🔹 Fetch quyền truy cập từ Firestore
  useEffect(() => {
    const fetchAccess = async () => {
      try {
        // Lấy ở CONFIG/config (cấu hình chung)
        const configRef = doc(db, "CONFIG", "config");
        const snap = await getDoc(configRef);

        if (snap.exists()) {
          const data = snap.data();

          setAllowedSchool({
            "TH Bình Khánh": data.truyCap_BinhKhanh !== false,
            "TH Lâm Văn Bền": data.truyCap_LamVanBen !== false,
          });
        }
      } catch (err) {
        console.error("❌ Lỗi fetch quyền truy cập:", err);
      }
    };

    fetchAccess();
  }, []);

  // 🔹 Khi tải xong quyền truy cập → set trường mặc định theo trường được phép
  useEffect(() => {
    const enabledSchools = SCHOOL_LIST.filter(s => allowedSchool[s]);
    setSchool(enabledSchools[0] || "");
  }, [allowedSchool]);

  // 🔹 Fetch danh sách lớp theo trường
  useEffect(() => {
    if (!school) return;

    const fetchClasses = async () => {
      try {
        let classList = [];
        if (school === "TH Lâm Văn Bền") {
          const lopRef = doc(db, "LAMVANBEN", "lop");
          const lopSnap = await getDoc(lopRef);
          classList = lopSnap.exists() ? lopSnap.data().list ?? [] : [];
        } else {
          const snapshot = await getDocs(collection(db, "DANHSACH"));
          classList = snapshot.docs.map((doc) => doc.id);
        }
        classList.sort((a, b) => a.localeCompare(b));
        setClasses(classList);
        setLop(classList[0] || "");
      } catch (err) {
        console.error("❌ Lỗi fetch lớp:", err);
      }
    };
    fetchClasses();
  }, [school]);

  const handleStart = () => {
    if (!school) {
      setErrorMsg("❌ Trường của bạn hiện không được phép truy cập!");
    } else if (!fullname.trim()) {
      setErrorMsg("❌ Vui lòng nhập Họ và tên!");
    } else if (!lop) {
      setErrorMsg("❌ Vui lòng chọn lớp!");
    } else {
      setErrorMsg("");

      setConfig(prev => ({ ...prev, lop, mon: prev.mon || "Tin học" }));

      navigate("/tracnghiem", { state: { school, fullname, lop } });
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#e3f2fd", pt: 4 }}>
      <Box sx={{ width: { xs: "95%", sm: 400 }, mx: "auto" }}>
        <Card elevation={10} sx={{ p: 3, borderRadius: 4, pt: 4 }}>
          <Stack spacing={3} alignItems="center">
            <SchoolIcon sx={{ fontSize: 60, color: '#1976d2' }} />
            <Typography variant="h5" fontWeight="bold" color="primary" textAlign="center">
              THÔNG TIN
            </Typography>

            {/* Ô Trường */}
            <FormControl fullWidth size="small">
              <InputLabel>Trường</InputLabel>
              <Select
                value={school}
                label="Trường"
                onChange={(e) => setSchool(e.target.value)}
              >
                {SCHOOL_LIST.map(sc => (
                  <MenuItem
                    key={sc}
                    value={sc}
                    disabled={!allowedSchool[sc]}   // 🔥 khóa trường nếu không được truy cập
                  >
                    {sc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Ô Khối + Lớp (cùng hàng) */}
            <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
              {/* Ô Khối */}
              <FormControl fullWidth size="small">
                <InputLabel>Khối</InputLabel>
                <Select
                  value={khoi}
                  label="Khối"
                  onChange={(e) => setKhoi(e.target.value)}
                >
                  {["Khối 1", "Khối 2", "Khối 3", "Khối 4", "Khối 5"].map(k => (
                    <MenuItem key={k} value={k}>{k}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Ô Lớp */}
              <FormControl fullWidth size="small">
                <InputLabel>Lớp</InputLabel>
                <Select
                  value={lop}
                  label="Lớp"
                  onChange={(e) => setLop(e.target.value)}
                >
                  {filteredClasses.map(cl => (
                    <MenuItem key={cl} value={cl}>{cl}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Ô Họ và tên */}
            <TextField
              label="Họ và tên"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              fullWidth
              size="small"
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />

            {/* Nút Bắt đầu */}
            <Button
              variant="contained"
              color="primary"
              onClick={handleStart}
              fullWidth
              sx={{ textTransform: "none", fontSize: "1rem" }}
            >
              BẮT ĐẦU
            </Button>

            {/* Thông báo lỗi */}
            {errorMsg && (
              <Typography color="error" variant="body2" textAlign="center">
                {errorMsg}
              </Typography>
            )}
          </Stack>
        </Card>
      </Box>
    </Box>
  );
}
