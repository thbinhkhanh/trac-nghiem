import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Card,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import { useNavigate } from "react-router-dom";
import { ConfigContext } from "../context/ConfigContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// ✅ Chỉ còn 1 trường
const SCHOOL_LIST = ["TH Lâm Văn Bền"];

export default function Info() {
  const [school, setSchool] = useState("TH Lâm Văn Bền"); // mặc định
  const [fullname, setFullname] = useState("");
  const [lop, setLop] = useState("");
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [khoi, setKhoi] = useState("Khối 3");
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();
  const { setConfig } = useContext(ConfigContext);

  // 🔹 Lọc lớp theo khối
  useEffect(() => {
    const soKhoi = khoi.replace("Khối ", "");
    const filtered = classes.filter(cl => cl.startsWith(soKhoi));
    setFilteredClasses(filtered);
    setLop("");
  }, [khoi, classes]);

  // 🔹 Fetch danh sách lớp (LAMVANBEN)
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const lopRef = doc(db, "LAMVANBEN", "lop");
        const lopSnap = await getDoc(lopRef);

        const classList = lopSnap.exists()
          ? lopSnap.data().list ?? []
          : [];

        classList.sort((a, b) => a.localeCompare(b));
        setClasses(classList);
        setLop(classList[0] || "");
      } catch (err) {
        console.error("❌ Lỗi fetch lớp:", err);
      }
    };

    fetchClasses();
  }, []);

  const handleStart = () => {
    if (!fullname.trim()) {
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
            <SchoolIcon sx={{ fontSize: 60, color: "#1976d2" }} />

            <Typography variant="h5" fontWeight="bold" color="primary">
              THÔNG TIN HỌC SINH
            </Typography>

            {/* ✅ Trường (KHÔNG disable) */}
            {/*<FormControl fullWidth size="small">
              <InputLabel>Trường</InputLabel>
              <Select
                value={school}
                label="Trường"
                onChange={(e) => setSchool(e.target.value)}
              >
                {SCHOOL_LIST.map(sc => (
                  <MenuItem key={sc} value={sc}>
                    {sc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>*/}

            {/* Khối + Lớp */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                width: "100%",
              }}
            >
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

            {/* Họ và tên */}
            <TextField
              label="Họ và tên"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              fullWidth
              size="small"
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />

            <Button
              variant="contained"
              fullWidth
              sx={{ textTransform: "none", fontSize: "1rem" }}
              onClick={handleStart}
            >
              BẮT ĐẦU LÀM BÀI
            </Button>

            {errorMsg && (
              <Typography color="error" variant="body2">
                {errorMsg}
              </Typography>
            )}
          </Stack>
        </Card>
      </Box>
    </Box>
  );
}
