import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Card,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  TextField,
  IconButton,
  Checkbox,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";

import { ConfigContext } from "../context/ConfigContext";
import { StudentContext } from "../context/StudentContext";
import { doc, getDoc, getDocs, setDoc, collection } from "firebase/firestore";
import { db } from "../firebase";

export default function QuanTri() {
  const account = localStorage.getItem("account") || "";
  const isLamVanBen = account === "TH Lâm Văn Bền";

  const { classData, setClassData } = useContext(StudentContext);

  // ===== Lâm Văn Bền: state local =====
  const [configLocal, setConfigLocal] = useState({
    mon: "Tin học",
    lop: "",
    hocKy: "Giữa kỳ I",
    choXemDiem: false,
    xuatFileBaiLam: false,
  });
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [subject, setSubject] = useState("Tin học");
  const [selectedSemester, setSelectedSemester] = useState("Giữa kỳ I");
  const [addingClass, setAddingClass] = useState(false);
  const [newClass, setNewClass] = useState("");

  // ===== Người dùng khác: context =====
  const configContext = useContext(ConfigContext);
  const configOther = configContext?.config || {};
  const setConfigOther = configContext?.setConfig || (() => {});

  // ===== Thời gian =====
  const [timeInput, setTimeInput] = useState(1);

  // ===== Sắp xếp lớp =====
  const sortClasses = (list) => {
    return [...list].sort((a, b) => {
      const matchA = a.match(/(\d+)([A-Z]+)/);
      const matchB = b.match(/(\d+)([A-Z]+)/);
      if (!matchA || !matchB) return a.localeCompare(b);
      const [numA, charA] = [parseInt(matchA[1]), matchA[2]];
      const [numB, charB] = [parseInt(matchB[1]), matchB[2]];
      if (numA !== numB) return numA - numB;
      return charA.localeCompare(charB);
    });
  };

  // ===== Fetch data =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isLamVanBen) {
          const docRef = doc(db, "LAMVANBEN", "config");
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            setConfigLocal({
              mon: data.mon ?? "Tin học",
              lop: data.lop ?? "",
              hocKy: data.hocKy ?? "Giữa kỳ I",
              choXemDiem: data.choXemDiem ?? false,
              xuatFileBaiLam: data.xuatFileBaiLam ?? false,
            });
            setSelectedClass(data.lop ?? "");
            setSubject(data.mon ?? "Tin học");
            setSelectedSemester(data.hocKy ?? "Giữa kỳ I");
            setTimeInput(data.timeLimit ?? 1);
          }

          const lopRef = doc(db, "LAMVANBEN", "lop");
          const lopSnap = await getDoc(lopRef);
          let classList = lopSnap.exists() ? lopSnap.data().list ?? [] : [];
          classList = sortClasses(classList);
          setClasses(classList);
          setSelectedClass((prev) => prev || classList[0] || "");
        } else {
          let classList = classData?.length ? classData : [];
          if (!classList.length) {
            const snapshot = await getDocs(collection(db, "DANHSACH"));
            classList = snapshot.docs.map((doc) => doc.id);
            setClassData(classList);
          }
          classList = sortClasses(classList);
          setClasses(classList);
          setSelectedClass(configOther.lop || classList[0] || "");
          setSubject(configOther.mon || "Tin học");
          setSelectedSemester(configOther.hocKy || "Giữa kỳ I");
          setTimeInput(configOther.timeLimit ?? 1);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [account, classData, setClassData, configOther]);

  // ===== Update field =====
  const updateConfigField = async (field, value) => {
    if (isLamVanBen) {
      setConfigLocal((prev) => ({ ...prev, [field]: value }));
      try {
        await setDoc(doc(db, "LAMVANBEN", "config"), { [field]: value }, { merge: true });
      } catch (err) {
        console.error(err);
      }
    } else {
      setConfigOther((prev) => ({ ...prev, [field]: value }));
      try {
        await setDoc(doc(db, "CONFIG", "config"), { [field]: value }, { merge: true });
      } catch (err) {
        console.error(err);
      }
    }

    if (field === "lop") setSelectedClass(value);
    if (field === "mon") setSubject(value);
    if (field === "hocKy") setSelectedSemester(value);
    if (field === "timeLimit") setTimeInput(value);
  };

  // ===== Thêm / Xóa lớp =====
  const handleAddClass = async () => {
    const className = newClass.trim().toUpperCase();
    if (!className || classes.includes(className)) return alert("Lớp đã tồn tại!");
    const updatedClasses = sortClasses([...classes, className]);
    setClasses(updatedClasses);
    setSelectedClass(className);
    updateConfigField("lop", className);
    if (isLamVanBen) await setDoc(doc(db, "LAMVANBEN", "lop"), { list: updatedClasses }, { merge: true });
    setNewClass("");
    setAddingClass(false);
  };

  const handleDeleteClass = async () => {
    const updatedClasses = classes.filter((c) => c !== selectedClass);
    setClasses(sortClasses(updatedClasses));
    const nextClass = updatedClasses[0] || "";
    setSelectedClass(nextClass);
    updateConfigField("lop", nextClass);
    if (isLamVanBen) await setDoc(doc(db, "LAMVANBEN", "lop"), { list: updatedClasses }, { merge: true });
  };

  const handleTimeLimitChange = (value) => {
    const v = Math.max(1, Number(value));
    setTimeInput(v);
    updateConfigField("timeLimit", v);
  };

  const renderConfig = isLamVanBen ? configLocal : configOther;

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#e3f2fd", pt: 3 }}>
      <Card elevation={6} sx={{ p: 4, borderRadius: 3, maxWidth: 350, mx: "auto", mt: 3 }}>
        <Typography variant="h5" color="primary" fontWeight="bold" align="center" gutterBottom sx={{ mb: 2 }}>
          HỆ THỐNG
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" align="center" sx={{ mb: 2, fontWeight: "bold" }}>
          {account || "Chưa đăng nhập"}
        </Typography>

        <Stack spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="hocKy-label">Học kỳ</InputLabel>
            <Select labelId="hocKy-label" value={selectedSemester} onChange={(e) => updateConfigField("hocKy", e.target.value)} label="Học kỳ">
              <MenuItem value="Giữa kỳ I">Giữa kỳ I</MenuItem>
              <MenuItem value="Cuối kỳ I">Cuối kỳ I</MenuItem>
              <MenuItem value="Giữa kỳ II">Giữa kỳ II</MenuItem>
              <MenuItem value="Cả năm">Cả năm</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel id="mon-label">Môn</InputLabel>
            <Select labelId="mon-label" value={subject} onChange={(e) => updateConfigField("mon", e.target.value)} label="Môn">
              <MenuItem value="Tin học">Tin học</MenuItem>
              <MenuItem value="Công nghệ">Công nghệ</MenuItem>
            </Select>
          </FormControl>

          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
              <InputLabel id="lop-label">Lớp</InputLabel>
              <Select labelId="lop-label" value={selectedClass} onChange={(e) => updateConfigField("lop", e.target.value)} label="Lớp">
                {classes.map((cls) => <MenuItem key={cls} value={cls}>{cls}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton sx={{ color: "green" }} onClick={() => setAddingClass(true)}><Add /></IconButton>
            <IconButton sx={{ color: "red" }} onClick={handleDeleteClass}><Delete /></IconButton>
          </Stack>

          {addingClass && (
            <Stack direction="row" spacing={1}>
              <TextField size="small" label="Tên lớp" value={newClass} onChange={(e) => setNewClass(e.target.value)} fullWidth />
              <Button variant="contained" size="small" sx={{ bgcolor: "green" }} onClick={handleAddClass}>Lưu</Button>
              <Button size="small" onClick={() => setAddingClass(false)}>Hủy</Button>
            </Stack>
          )}
        </Stack>

        <Stack spacing={1} sx={{ mt: 2 }}>
          {/* Thời gian */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ minWidth: 110 }}>Thời gian làm bài (phút)</Typography>
            <TextField
              type="number"
              size="small"
              value={timeInput}
              onChange={(e) => handleTimeLimitChange(e.target.value)}
              inputProps={{ min: 1, style: { textAlign: "center", width: 45 } }}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Checkbox
              checked={renderConfig.choXemDiem || false}
              onChange={(e) => updateConfigField("choXemDiem", e.target.checked)}
            />
            <Typography>Cho xem điểm</Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Checkbox
              checked={renderConfig.xuatFileBaiLam || false}
              onChange={(e) => updateConfigField("xuatFileBaiLam", e.target.checked)}
            />
            <Typography>Xuất file bài làm</Typography>
          </Box>
        </Stack>

      </Card>
    </Box>
  );
}
