import React, { createContext, useState, useEffect } from "react";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export const LamVanBenConfigContext = createContext();

export const LamVanBenConfigProvider = ({ children }) => {
  const defaultConfig = {
    tuan: 1,
    mon: "Tin học",
    hocKy: "Giữa kỳ I",
    lop: "",
    tracNghiem: false,
    choXemDiem: false,
    xuatFileBaiLam: false,
    timeLimit: 1,
  };

  const [config, setConfigState] = useState(defaultConfig);

  // 🔹 Lấy config từ Firestore ngay khi tải + realtime
  useEffect(() => {
    const docRef = doc(db, "LAMVANBEN", "config");

    // Lấy dữ liệu ban đầu
    getDoc(docRef).then((snap) => {
      if (snap.exists()) {
        setConfigState((prev) => ({ ...prev, ...snap.data() }));
      }
    });

    // Lắng nghe realtime
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (!snapshot.exists()) return;
      setConfigState((prev) => ({ ...prev, ...snapshot.data() }));
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Hàm update config và lưu Firestore
  const setConfig = async (newConfigOrUpdater) => {
    setConfigState((prev) => {
      const newConfig =
        typeof newConfigOrUpdater === "function"
          ? newConfigOrUpdater(prev)
          : { ...prev, ...newConfigOrUpdater };

      const docRef = doc(db, "LAMVANBEN", "config");
      setDoc(docRef, newConfig, { merge: true })
        .then(() => console.log("✅ LAMVANBEN/config updated:", newConfig))
        .catch((err) => console.error("❌ Lỗi lưu LamVanBen config:", err));

      return newConfig; // cập nhật UI ngay
    });
  };

  return (
    <LamVanBenConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </LamVanBenConfigContext.Provider>
  );
};