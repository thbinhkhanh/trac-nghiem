import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
} from "@mui/material";

// Icons
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";

// Context
import { ConfigContext } from "../context/ConfigContext";

export default function DashboardLayout({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();

  const ctx = useContext(ConfigContext);
  const config = ctx?.config || {};

  const cards = [
    {
      title: "Học sinh",
      value: 120,
      icon: <SchoolIcon fontSize="large" />,
      color: "#1976d2",
      path: "/hocsinh",
    },
    {
      title: "Giáo viên",
      value: 15,
      icon: <PersonIcon fontSize="large" />,
      color: "#2e7d32",
      path: "/giaovien",
    },
    {
      title: "Kết quả",
      value: 340,
      icon: <AssessmentIcon fontSize="large" />,
      color: "#ed6c02",
      path: "/ketqua",
    },
    {
      title: "Hệ thống",
      value: "OK",
      icon: <SettingsIcon fontSize="large" />,
      color: "#9c27b0",
      path: "/quan-tri",
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", background: "#f5f6fa" }}>
      {/* TOP BAR */}
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6">Bảng điều khiển</Typography>

          <Box sx={{ ml: "auto", fontWeight: 600 }}>
            {config?.namHoc || "2025-2026"}
          </Box>
        </Toolbar>
      </AppBar>

      {/* CONTENT */}
      <Box sx={{ pt: 10, px: 3 }}>
        <Typography variant="h5" fontWeight={700} mb={3}>
          Dashboard
        </Typography>

        <Grid container spacing={3}>
          {cards.map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 3,
                  cursor: "pointer",
                  boxShadow: 3,
                  transition: "0.3s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ color: item.color }}>{item.icon}</Box>

                  <Typography variant="h6" mt={2}>
                    {item.title}
                  </Typography>

                  <Typography variant="h4" fontWeight={700}>
                    {item.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}