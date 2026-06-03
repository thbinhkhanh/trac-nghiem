import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Grid, Card, CardActionArea, CardContent, Typography } from "@mui/material";

import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";

export default function DashboardHome() {
  const navigate = useNavigate();

  const cards = [
    { label: "Học sinh", path: "/hocsinh", icon: <SchoolIcon sx={{ fontSize: 50 }} /> },
    { label: "Giáo viên", path: "/giaovien", icon: <PersonIcon sx={{ fontSize: 50 }} /> },
    { label: "Kết quả", path: "/ketqua", icon: <AssessmentIcon sx={{ fontSize: 50 }} /> },
    { label: "Hệ thống", path: "/quan-tri", icon: <SettingsIcon sx={{ fontSize: 50 }} /> },
  ];

  return (
    <Box sx={{ p: 4, background: "#f5f6fa", minHeight: "100vh" }}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Bảng điều khiển
      </Typography>

      <Grid container spacing={3}>
        {cards.map((item) => (
          <Grid item xs={6} sm={4} md={3} key={item.path}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardActionArea onClick={() => navigate(item.path)}>
                <CardContent sx={{ textAlign: "center", py: 5 }}>
                  <Box sx={{ mb: 2 }}>{item.icon}</Box>
                  <Typography fontWeight={600}>
                    {item.label}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}