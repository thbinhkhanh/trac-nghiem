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
  MenuItem,
  Autocomplete,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import { useNavigate } from "react-router-dom";
import { ConfigContext } from "../context/ConfigContext";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

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
  const [students, setStudents] = useState([]);

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

  useEffect(() => {
    const soKhoi = khoi.replace("Khối ", "");
    const filtered = classes.filter(cl => cl.startsWith(soKhoi));

    setFilteredClasses(filtered);

    // chỉ reset lớp, KHÔNG auto chọn lớp đầu
    setLop("");
    setStudents([]);
  }, [khoi, classes]);

  useEffect(() => {
    if (!lop) return;
    fetchStudentsByClass(lop);
  }, [lop]);

  const fetchStudentsByClass = async (classKey) => {
    try {
      if (!classKey) return;

      const snap = await getDocs(
        collection(db, "DS_HOCSINH_MASTER", classKey, "STUDENTS")
      );

      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      const getTenSortKey = (hoTen = "") =>
        hoTen.trim().split(/\s+/).reverse().join(" ");

      const compareVietnameseName = (a, b) => {
        const pa = (a.hoTen || "").trim().split(/\s+/).reverse();
        const pb = (b.hoTen || "").trim().split(/\s+/).reverse();

        const len = Math.max(pa.length, pb.length);

        for (let i = 0; i < len; i++) {
          const wa = pa[i] || "";
          const wb = pb[i] || "";

          const cmp = wa.localeCompare(wb, "vi", {
            sensitivity: "base",
            numeric: true,
          });

          if (cmp !== 0) return cmp;
        }

        return 0;
      };

      list.sort(compareVietnameseName);

      setStudents(list);
    } catch (err) {
      console.error("❌ Lỗi load học sinh:", err);
      setStudents([]);
    }
  };

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
  <Box
    sx={{
      minHeight: "100vh",
      background: "#f1f5f9",
      pt: 5, // 👈 top 10
      px: 2,
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      fontFamily:
        '"Roboto","Inter","Arial",sans-serif',
    }}
  >
    <Box
      sx={{
        width: "100%",
        maxWidth: 420,
      }}
    >
      <Card
        elevation={0}
        sx={{
          borderRadius: "14px",
          overflow: "hidden",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          boxShadow:
            "0 10px 35px rgba(0,0,0,0.12)",
          position: "relative",
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
          <Typography
            sx={{
              fontSize: 17,
              fontWeight: 700,
            }}
          >
            Thông tin học sinh
          </Typography>

          {/*<Typography
            sx={{
              fontSize: 13,
              opacity: 0.9,
              mt: 0.3,
            }}
          >
            Nhập thông tin để bắt đầu làm bài
          </Typography>*/}
        </Box>

        {/* ===== CONTENT ===== */}
        <Box
          sx={{
            px: 3,
            py: 3,
          }}
        >
          <Stack
            spacing={2.5}
            alignItems="center"
          >
            {/* ICON */}
            <Box
              sx={{
                width: 82,
                height: 82,
                borderRadius: "50%",
                bgcolor: "#e3f2fd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border:
                  "4px solid #fff",
                boxShadow:
                  "0 4px 15px rgba(25,118,210,0.15)",
              }}
            >
              <SchoolIcon
                sx={{
                  fontSize: 42,
                  color: "#1976d2",
                }}
              />
            </Box>

            {/* TITLE */}
            <Box textAlign="center">
              <Typography
                sx={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
                Chào em 👋
              </Typography>

              <Typography
                sx={{
                  fontSize: 14,
                  color: "#64748b",
                  mt: 0.5,
                }}
              >
                Vui lòng nhập thông tin
                để tiếp tục
              </Typography>
            </Box>

            {/* KHỐI */}
            <FormControl
              fullWidth
              size="small"
            >
              <InputLabel>
                Khối
              </InputLabel>

              <Select
                value={khoi}
                label="Khối"
                onChange={(e) =>
                  setKhoi(
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
                {[
                  "Khối 1",
                  "Khối 2",
                  "Khối 3",
                  "Khối 4",
                  "Khối 5",
                ].map((k) => (
                  <MenuItem
                    key={k}
                    value={k}
                  >
                    {k}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* LỚP */}
            <FormControl
              fullWidth
              size="small"
            >
              <InputLabel>
                Lớp
              </InputLabel>

              <Select
                value={lop}
                label="Lớp"
                onChange={(e) => {
                  const newClass = e.target.value;
                  setLop(newClass);
                  fetchStudentsByClass(newClass); // 👈 quan trọng
                }}
                sx={{
                  bgcolor: "#fff",
                  borderRadius: "5px",

                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#dbe2ea",
                  },

                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2",
                    borderWidth: 2,
                  },
                }}
              >
                {filteredClasses.map(
                  (cl) => (
                    <MenuItem
                      key={cl}
                      value={cl}
                    >
                      {cl}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>

            {/* HỌ TÊN */}
            <Autocomplete
              freeSolo
              fullWidth
              size="small"
              options={lop ? students.map((st) => st.hoTen) : []}
              value={fullname}
              onChange={(event, newValue) => {
                setFullname(newValue || "");
              }}
              onInputChange={(event, newInputValue) => {
                setFullname(newInputValue);
              }}
              sx={{
                bgcolor: "#fff",
                borderRadius: "5px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#dbe2ea",
                },
                "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#1976d2",
                  borderWidth: 2,
                },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Họ và tên"
                />
              )}
            />

            {/* BUTTON */}
            <Button
              variant="contained"
              fullWidth
              onClick={handleStart}
              sx={{
                textTransform:
                  "none",
                borderRadius:
                  "12px",
                py: 1.2,
                fontWeight: 700,
                fontSize: 15,
                boxShadow: "none",

                "&:hover": {
                  boxShadow: "none",
                },
              }}
            >
              Bắt đầu làm bài
            </Button>

            {/* ERROR */}
            {errorMsg && (
              <Typography
                sx={{
                  fontSize: 13,
                  color: "#ef4444",
                  fontWeight: 600,
                  textAlign:
                    "center",
                }}
              >
                {errorMsg}
              </Typography>
            )}
          </Stack>
        </Box>
      </Card>
    </Box>
  </Box>
);
}
