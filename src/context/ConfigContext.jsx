import React, { createContext, useState, useEffect, useContext } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  // Các field cần thiết
  const defaultConfig = {
    choXemDapAn: false,
    choXemDiem: false,
    hocKy: "Cuối kỳ I",
    timeLimit: 20,        // phút
    xuatFileBaiLam: true,
    deTracNghiem: null,
    namHoc: "2025-2026",
  };

  // Load từ localStorage
  const storedConfig = JSON.parse(localStorage.getItem("appConfig") || "{}");
  const allowedKeys = Object.keys(defaultConfig);
  const filteredStored = Object.fromEntries(
    Object.entries(storedConfig).filter(([k]) => allowedKeys.includes(k))
  );

  const [config, setConfig] = useState({ ...defaultConfig, ...filteredStored });

  // Lưu localStorage khi config thay đổi
  useEffect(() => {
    localStorage.setItem("appConfig", JSON.stringify(config));
  }, [config]);

  // 🔹 Snapshot realtime: chỉ đồng bộ checkbox, không ghi đè hocKy & timeLimit
  useEffect(() => {
    const docRef = doc(db, "CONFIG", "config");
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();

        setConfig((prev) => ({
          ...prev,
          choXemDapAn: data.choXemDapAn ?? prev.choXemDapAn,
          choXemDiem: data.choXemDiem ?? prev.choXemDiem,
          xuatFileBaiLam: data.xuatFileBaiLam ?? prev.xuatFileBaiLam,
          deTracNghiem: data.deTracNghiem ?? prev.deTracNghiem,
          // hocKy và timeLimit giữ nguyên giá trị local
        }));
      },
      (err) => console.error("❌ Firestore snapshot lỗi:", err)
    );

    return () => unsubscribe();
  }, []);

  // 🔹 Hàm cập nhật config do user thao tác
  const updateConfig = async (newValues) => {
    const filtered = Object.fromEntries(
      Object.entries(newValues).filter(([k]) => allowedKeys.includes(k))
    );

    const hasDiff = Object.keys(filtered).some((k) => filtered[k] !== config[k]);
    if (!hasDiff) return;

    setConfig((prev) => ({ ...prev, ...filtered }));

    const docRef = doc(db, "CONFIG", "config");
    await setDoc(docRef, filtered, { merge: true });
    console.log("✅ Firestore cập nhật:", filtered);
  };

  return (
    <ConfigContext.Provider value={{ config, setConfig: updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

// Hook tiện lợi
export const useConfig = () => useContext(ConfigContext);
