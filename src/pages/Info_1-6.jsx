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
                onChange={(e) =>
                  setLop(
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
            <TextField
              label="Họ và tên"
              value={fullname}
              onChange={(e) =>
                setFullname(
                  e.target.value
                )
              }
              fullWidth
              size="small"
              onKeyDown={(e) =>
                e.key === "Enter" &&
                handleStart()
              }
              sx={{
                "& .MuiOutlinedInput-root":
                  {
                    bgcolor: "#fff",
                    borderRadius:
                      "5px",

                    "& fieldset": {
                      borderColor:
                        "#dbe2ea",
                    },

                    "&.Mui-focused fieldset":
                      {
                        borderColor:
                          "#1976d2",
                        borderWidth: 2,
                      },
                  },
              }}
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
