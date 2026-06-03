import React, { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Checkbox,
  Box,
  IconButton,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteDataClassesConfirmDialog from "./DeleteDataClassesConfirmDialog";

export default function DeleteDataClassesDialog({
  open,
  onClose,
  classesList,
  onConfirmDelete,
}) {
  const [selected, setSelected] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelected([]);
      setConfirmOpen(false);
    }
  }, [open]);

  // =========================
  // GROUP DATA (3,4,5...)
  // =========================
  const khoiGroups = classesList.reduce((acc, lop) => {
    const khoi = String(lop).match(/^\d+/)?.[0];
    if (!khoi) return acc;

    if (!acc[khoi]) acc[khoi] = [];
    acc[khoi].push(lop);

    return acc;
  }, {});

  // =========================
  // TOGGLE 1 LỚP (FIXED)
  // =========================
  const toggleLop = (lop) => {
    setSelected((prev) => {
      const set = new Set(prev);

      if (set.has(lop)) set.delete(lop);
      else set.add(lop);

      return Array.from(set);
    });
  };

  // =========================
  // TOGGLE KHỐI
  // =========================
  const toggleKhoi = (group) => {
    const allSelected = group.every((l) =>
      selected.includes(l)
    );

    setSelected((prev) => {
      const set = new Set(prev);

      if (allSelected) {
        group.forEach((l) => set.delete(l));
      } else {
        group.forEach((l) => set.add(l));
      }

      return Array.from(set);
    });
  };

  // =========================
  // TOGGLE TỔNG TRƯỜNG
  // =========================
  const toggleAll = () => {
    setSelected((prev) =>
      prev.length === classesList.length
        ? []
        : [...classesList]
    );
  };

  // =========================
  // CHECK HELPERS
  // =========================
  const isGroupSelected = (group) =>
    group.length > 0 &&
    group.every((l) => selected.includes(l));

  const isGroupPartial = (group) =>
    group.some((l) => selected.includes(l)) &&
    !isGroupSelected(group);

  const isAllSelected =
    selected.length === classesList.length;

  return (
    <>
      {/* ===================== DIALOG ===================== */}
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            height: "75vh",
            borderRadius: "14px",
            overflow: "hidden",
            background: "#f8fafc",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            px: 3,
            py: 1.3,
            bgcolor: "#1976d2",
            color: "#fff",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography sx={{ fontSize: 17, fontWeight: 700 }}>
              Xóa dữ liệu lớp
            </Typography>

            <IconButton onClick={onClose} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* TỔNG TRƯỜNG */}
          <Box sx={{ mt: 1 }}>
            <Checkbox
              size="small"
              checked={isAllSelected}
              onChange={toggleAll}
              sx={{ color: "#fff", "&.Mui-checked": { color: "#fff" } }}
            />
            <Typography
              component="span"
              sx={{ color: "#fff", fontWeight: 600 }}
            >
              Toàn trường ({selected.length}/{classesList.length})
            </Typography>
          </Box>
        </Box>

        {/* CONTENT */}
        <DialogContent
          sx={{
            flex: 1,
            px: 3,
            py: 2,
            overflowY: "auto",
          }}
        >
          <Typography sx={{ mb: 2, color: "#64748b", fontSize: 14 }}>
            Chọn các lớp cần xóa dữ liệu
          </Typography>

          <Box
            sx={{
              bgcolor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              p: 1.5,
            }}
          >
            {Object.entries(khoiGroups).map(([khoi, group]) => (
              <Box key={khoi} sx={{ mb: 2 }}>
                {/* KHỐI */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    bgcolor: "#f1f5f9",
                    borderRadius: "6px",
                    px: 1,
                    py: 0.5,
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={isGroupSelected(group)}
                    indeterminate={isGroupPartial(group)}
                    onChange={() => toggleKhoi(group)}
                  />

                  <Typography fontWeight={700}>
                    Khối {khoi}
                  </Typography>
                </Box>

                {/* LỚP */}
                <Box sx={{ pl: 3, mt: 0.5 }}>
                  {group.map((lop) => (
                    <Box
                      key={lop}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Checkbox
                        size="small"
                        checked={selected.includes(lop)}
                        onChange={() => toggleLop(lop)}
                      />

                      <Typography
                        sx={{ fontSize: 14, cursor: "pointer" }}
                        onClick={() => toggleLop(lop)}
                      >
                        {lop}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>

        {/* FOOTER */}
        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            justifyContent: "space-between",
          }}
        >
          <Button onClick={onClose}>Đóng</Button>

          <Button
            variant="contained"
            color="error"
            disabled={selected.length === 0}
            startIcon={<DeleteOutlineIcon />}
            onClick={() => setConfirmOpen(true)}
          >
            Xóa ({selected.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRM */}
      <DeleteDataClassesConfirmDialog
        open={confirmOpen}
        selectedCount={selected.length}
        selectedClasses={selected}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          onClose();

          await onConfirmDelete(selected);
          setSelected([]);
        }}
      />
    </>
  );
}