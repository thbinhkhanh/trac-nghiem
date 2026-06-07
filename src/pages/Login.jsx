import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Card,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const ACCOUNTS = [
  "Admin",
  "Ngọc Tuyết",
  "Lê Nhàn",
];

const ACCOUNT_MAP = {
  Admin: "admin",
  "Ngọc Tuyết": "ngoctuyet",
  "Lê Nhàn": "lenhan",
};

export default function Login({ setIsLoggedIn }) {
  const [username, setUsername] = useState(ACCOUNTS[0]);
  const [password, setPassword] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const cleanUsername = username?.trim();
      const docId = ACCOUNT_MAP[cleanUsername];

      console.log("username:", cleanUsername);
      console.log("docId:", docId);

      // ❗ check mapping
      if (!docId) {
        setSnackbar({
          open: true,
          message: "❌ Sai mapping tài khoản!",
          severity: "error",
        });
        return;
      }

      const ref = doc(db, "MATKHAU", docId);
      const snap = await getDoc(ref);

      console.log("exists:", snap.exists());
      console.log("data:", snap.data());

      // ❗ không tìm thấy document
      if (!snap.exists()) {
        setSnackbar({
          open: true,
          message: "❌ Không tìm thấy tài khoản trên Firestore!",
          severity: "error",
        });
        return;
      }

      const savedPw = snap.data()?.pass;

      // ❗ không có field pass
      if (!savedPw) {
        setSnackbar({
          open: true,
          message: "❌ Firestore thiếu field 'pass'!",
          severity: "error",
        });
        return;
      }

      // ❗ sai mật khẩu
      if (password !== savedPw) {
        setSnackbar({
          open: true,
          message: "❌ Mật khẩu sai!",
          severity: "error",
        });
        return;
      }

      // ✅ LOGIN OK
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("account", cleanUsername);
      localStorage.setItem("school", cleanUsername);

      setIsLoggedIn(true);
      navigate("/dashboard", { replace: true });

    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "❌ Lỗi kết nối Firestore!",
        severity: "error",
      });
    }
  };

  return (
  <Box
    sx={{
      minHeight: "100vh",
      background: "#f1f5f9",
      py: 5,
      px: 2,
      display: "flex",
      justifyContent: "center",
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
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                Đăng nhập hệ thống
              </Typography>
            </Box>

            <IconButton
              onClick={() =>
                navigate("/hocsinh")
              }
              sx={{
                color: "#fff",
                bgcolor:
                  "rgba(255,255,255,0.12)",

                "&:hover": {
                  bgcolor:
                    "rgba(255,255,255,0.22)",
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
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
                justifyContent:
                  "center",
                fontSize: 38,
                border:
                  "4px solid #fff",
                boxShadow:
                  "0 4px 15px rgba(25,118,210,0.15)",
              }}
            >
              🔐
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
                Chào mừng
              </Typography>

              <Typography
                sx={{
                  fontSize: 14,
                  color: "#64748b",
                  mt: 0.5,
                }}
              >
                Vui lòng đăng nhập để tiếp tục
              </Typography>
            </Box>

            {/* ACCOUNT */}
            <FormControl
              fullWidth
              size="small"
            >
              <InputLabel>
                Tài khoản
              </InputLabel>

              <Select
                value={username}
                label="Tài khoản"
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
                sx={{
                  bgcolor: "#fff",
                  borderRadius:
                    "5px",

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
                {ACCOUNTS.map(
                  (acc) => (
                    <MenuItem
                      key={acc}
                      value={acc}
                    >
                      {acc}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>

            {/* PASSWORD */}
            <TextField
              label="Mật khẩu"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              fullWidth
              size="small"
              onKeyDown={(e) =>
                e.key === "Enter" &&
                handleLogin()
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

            {/* LOGIN BUTTON */}
            <Button
              variant="contained"
              fullWidth
              onClick={handleLogin}
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
              🔐 Đăng nhập
            </Button>
          </Stack>
        </Box>
      </Card>
    </Box>

    {/* ===== Snackbar ===== */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={() =>
        setSnackbar((s) => ({
          ...s,
          open: false,
        }))
      }
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
    >
      <Alert
        severity={snackbar.severity}
        variant="filled"
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  </Box>
);
}
