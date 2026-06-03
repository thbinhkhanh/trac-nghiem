import React, { useState, useEffect } from "react";

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
import DeleteClassesConfirmDialog from "./DeleteClassesConfirmDialog";

export default function DeleteClassesDialog({
  open,
  onClose,
  classes,
  onDelete,
}) {
  const [selected, setSelected] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelected([]);
      setConfirmOpen(false);
    }
  }, [open]);

  const handleToggle = (lop) => {
    setSelected((prev) =>
      prev.includes(lop)
        ? prev.filter((x) => x !== lop)
        : [...prev, lop]
    );
  };

  return (
    <>
      {/* ===================== */}
      {/* DIALOG DANH SÁCH LỚP */}
      {/* ===================== */}
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
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
            py: 1.4,
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
              Xóa lớp học
            </Typography>

            <IconButton onClick={onClose} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* CONTENT */}
        <DialogContent
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            px: 3,
            py: 2,
          }}
        >
          <Typography
            sx={{
              mb: 2,
              color: "#64748b",
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            Chọn các lớp cần xóa
          </Typography>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              bgcolor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              p: 1,
              overflowY: "auto",
            }}
          >
            {classes.length === 0 ? (
              <Typography sx={{ color: "#94a3b8" }}>
                Không có lớp nào
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                {classes.map((lop) => {
                  const checked = selected.includes(lop);

                  return (
                    <Box
                      key={lop}
                      onClick={() => handleToggle(lop)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1,
                        py: 0.4,
                        borderRadius: "6px",
                        cursor: "pointer",
                        border: checked
                          ? "2px solid #1976d2"
                          : "1px solid #e2e8f0",
                        bgcolor: checked ? "#f0f7ff" : "#fff",
                      }}
                    >
                      <Checkbox
                        checked={checked}
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => handleToggle(lop)}
                      />

                      <Typography sx={{ fontSize: 14 }}>
                        {lop}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
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
          <Button
            onClick={() => {
              setSelected([]);
              onClose();
            }}
          >
            Đóng
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={selected.length === 0}
            startIcon={<DeleteOutlineIcon />}
            onClick={() => {
                setConfirmOpen(true);
            }}
            >
            Xóa ({selected.length})
            </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== */}
      {/* CONFIRM DIALOG */}
      {/* ===================== */}
      <DeleteClassesConfirmDialog
        open={confirmOpen}
        selectedCount={selected.length}
        selectedClasses={selected}

        onClose={() => {
            setConfirmOpen(false);
        }}

        onConfirm={async () => {
            // 1. đóng confirm
            setConfirmOpen(false);

            // 2. đóng dialog danh sách lớp (QUAN TRỌNG)
            onClose();

            // 3. xử lý xóa
            await onDelete(selected);

            // 4. reset state
            setSelected([]);
        }}
        />
    </>
  );
}