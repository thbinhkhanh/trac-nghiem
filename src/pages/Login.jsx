import React, { useState, useEffect, useContext } from "react";
import { Box, Typography, TextField, Button, Stack, Card, IconButton, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from "react-router-dom";
import { ConfigContext } from "../context/ConfigContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// ⭐ Danh sách tài khoản
const ACCOUNTS = ["Admin", "TH Bình Khánh", "TH Lâm Văn Bền"];
const PASSWORD = "1"; // tất cả cùng mật khẩu 1

export default function Login() {
  const [username, setUsername] = useState(ACCOUNTS[0]);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setConfig } = useContext(ConfigContext);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, "CONFIG", "config");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setConfig(prev => ({
            ...prev,
            tuan: data.tuan || prev.tuan || 1,
            mon: data.mon || prev.mon || "Tin học",
            lop: data.lop || prev.lop || "",
            th_tuan_from: data.th_tuan_from ?? prev.th_tuan_from,
            th_tuan_to: data.th_tuan_to ?? prev.th_tuan_to,
          }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchConfig();
  }, [setConfig]);

  const handleLogin = () => {
    if (ACCOUNTS.includes(username) && password === PASSWORD) {
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("account", username);

      window.dispatchEvent(new Event("storage"));
      navigate("/tonghopdanhgia");
    } else {
      alert("❌ Tài khoản hoặc mật khẩu sai!");
    }
  };

  const handleClose = () => {
    navigate("/hocsinh");
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#e3f2fd", pt: 4 }}>
      <Box sx={{ width: { xs: "95%", sm: 400 }, mx: "auto", position: "relative" }}>
        <Card elevation={10} sx={{ p: 3, borderRadius: 4 }}>
          <IconButton
            onClick={handleClose}
            sx={{ position: "absolute", top: 8, right: 8, color: "red" }}
          >
            <CloseIcon />
          </IconButton>

          <Stack spacing={3} alignItems="center">
            <div style={{ fontSize: 50 }}>🔐</div>
            <Typography variant="h5" fontWeight="bold" color="primary" textAlign="center">
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
                  <MenuItem key={acc} value={acc}>{acc}</MenuItem>
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
              color="primary"
              onClick={handleLogin}
              fullWidth
              sx={{ fontWeight: "bold", textTransform: "none", fontSize: "1rem" }}
            >
              🔐 Đăng nhập
            </Button>
          </Stack>
        </Card>
      </Box>
    </Box>
  );
}
