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

const ACCOUNTS = ["TH Lâm Văn Bền", "Admin"];

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
    if (!ACCOUNTS.includes(username)) {
      setSnackbar({ open: true, message: "❌ Tài khoản không tồn tại!", severity: "error" });
      return;
    }

    try {
      const docId = username === "TH Lâm Văn Bền" ? "lvb" : "admin";
      const snap = await getDoc(doc(db, "MATKHAU", docId));

      if (!snap.exists()) {
        setSnackbar({ open: true, message: "❌ Không tìm thấy mật khẩu!", severity: "error" });
        return;
      }

      const savedPw = snap.data().pass;

      if (password === savedPw) {
        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("account", username);
        localStorage.setItem("school", "TH Lâm Văn Bền");

        setIsLoggedIn(true); // ⭐ CỰC KỲ QUAN TRỌNG

        navigate("/tracnghiem-gv", { replace: true });
      } else {
        setSnackbar({ open: true, message: "❌ Mật khẩu sai!", severity: "error" });
      }
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "❌ Lỗi kết nối Firestore!", severity: "error" });
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#e3f2fd", pt: 4 }}>
      <Box sx={{ width: { xs: "95%", sm: 400 }, mx: "auto", position: "relative" }}>
        <Card elevation={10} sx={{ p: 3, borderRadius: 4 }}>
          <IconButton
            onClick={() => navigate("/hocsinh")}
            sx={{ position: "absolute", top: 8, right: 8, color: "red" }}
          >
            <CloseIcon />
          </IconButton>

          <Stack spacing={3} alignItems="center">
            <div style={{ fontSize: 50 }}>🔐</div>

            <Typography variant="h5" fontWeight="bold" color="primary">
              ĐĂNG NHẬP
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel>Tài khoản</InputLabel>
              <Select
                value={username}
                label="Tài khoản"
                onChange={(e) => setUsername(e.target.value)}
              >
                {ACCOUNTS.map((acc) => (
                  <MenuItem key={acc} value={acc}>
                    {acc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Mật khẩu"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              size="small"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={handleLogin}
              sx={{ fontWeight: "bold" }}
            >
              🔐 Đăng nhập
            </Button>
          </Stack>
        </Card>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
