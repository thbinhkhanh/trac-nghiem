// src/store.js
import { configureStore, createSlice } from "@reduxjs/toolkit";

// Dummy slice để có reducer hợp lệ
const dummySlice = createSlice({
  name: "dummy",
  initialState: {},
  reducers: {},
});

const store = configureStore({
  reducer: {
    dummy: dummySlice.reducer, // ✅ phải có ít nhất 1 reducer
  },
});

export default store;
