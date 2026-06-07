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
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import DeleteClassesConfirmDialog from "./DeleteClassesConfirmDialog";

export default function DeleteClassesDialog({
  open,
  onClose,
  classes,
  selectedClass,
  deleteNamHoc,
  onDelete,
}) {
  const [selected, setSelected] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(selectedClass ? [selectedClass] : []);
    } else {
      setSelected([]);
      setConfirmOpen(false);
    }
  }, [open, selectedClass]);

  // =========================
  // GROUP DATA
  // =========================
  const khoiGroups = classes.reduce((acc, lop) => {
    const khoi = String(lop).match(/^\d+/)?.[0];

    if (!khoi) return acc;

    if (!acc[khoi]) {
      acc[khoi] = [];
    }

    acc[khoi].push(lop);

    return acc;
  }, {});

  // =========================
  // TOGGLE 1 LỚP
  // =========================
  const toggleLop = (lop) => {
    setSelected((prev) => {
      const set = new Set(prev);

      if (set.has(lop)) {
        set.delete(lop);
      } else {
        set.add(lop);
      }

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
  // TOGGLE TOÀN TRƯỜNG
  // =========================
  const toggleAll = () => {
    setSelected((prev) =>
      prev.length === classes.length
        ? []
        : [...classes]
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
    classes.length > 0 &&
    selected.length === classes.length;

  return (
    <>
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
            py: 1.5,
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
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              🎯 Xóa danh sách lớp
            </Typography>

            <IconButton
              onClick={onClose}
              sx={{
                color: "#fff",
                p: 0.5,
              }}
            >
              <CloseIcon />
            </IconButton>
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
          <Typography
            sx={{
              mb: 2,
              color: "#64748b",
              fontSize: 14,
            }}
          >
            Chọn các lớp cần xóa
          </Typography>

          {/* TOÀN TRƯỜNG */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              gap: 2,
            }}
          >
            {/* TOÀN TRƯỜNG */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                px: 1,
                py: 0.6,
                bgcolor: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                flex: 1,
              }}
            >
              <Checkbox
                checked={isAllSelected}
                indeterminate={
                  selected.length > 0 &&
                  selected.length < classes.length
                }
                onChange={toggleAll}
              />

              <Typography
                sx={{
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
                Toàn trường ({selected.length}/{classes.length})
              </Typography>
            </Box>

            {/* NĂM HỌC */}
            <FormControl
              size="small"
              sx={{
                width: {
                  xs: 120,
                  sm: 150,
                },
              }}
            >
              <InputLabel shrink>
                Năm học
              </InputLabel>

              <OutlinedInput
                notched
                label="Năm học"
                value={deleteNamHoc}
                readOnly
                sx={{
                  "& input": {
                    textAlign: "center",
                  },
                }}
              />
            </FormControl>
          </Box>

          {/* DANH SÁCH KHỐI */}
          <Box
            sx={{
              bgcolor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              p: 1.5,
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(3, 1fr)",
                },
                gap: 2,
                alignItems: "start",
              }}
            >
              {Object.entries(khoiGroups).map(
                ([khoi, group]) => (
                  <Box
                    key={khoi}
                    sx={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    {/* HEADER KHỐI */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        bgcolor: "#f8fafc",
                        borderBottom:
                          "1px solid #e2e8f0",
                        px: 1,
                        py: 0.4,
                      }}
                    >
                      <Checkbox
                        size="small"
                        checked={isGroupSelected(group)}
                        indeterminate={isGroupPartial(group)}
                        onChange={() =>
                          toggleKhoi(group)
                        }
                      />

                      <Typography
                        sx={{
                          fontWeight: 700,
                          color: "#1e293b",
                        }}
                      >
                        Khối {khoi}
                      </Typography>

                      <Typography
                        sx={{
                          ml: 1,
                          fontSize: 12,
                          color: "#64748b",
                        }}
                      >
                        ({group.length})
                      </Typography>
                    </Box>

                    {/* DANH SÁCH LỚP */}
                    <Box sx={{ p: 1 }}>
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
                            checked={selected.includes(
                              lop
                            )}
                            onChange={() =>
                              toggleLop(lop)
                            }
                          />

                          <Typography
                            sx={{
                              fontSize: 14,
                              cursor: "pointer",
                              userSelect: "none",
                            }}
                            onClick={() =>
                              toggleLop(lop)
                            }
                          >
                            {lop}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )
              )}
            </Box>
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
            onClick={() => setConfirmOpen(true)}
            sx={{
              borderRadius: "12px",
            }}
          >
            Xóa ({selected.length})
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteClassesConfirmDialog
        open={confirmOpen}
        selectedCount={selected.length}
        selectedClasses={selected}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          onClose();

          await onDelete(selected);

          setSelected([]);
        }}
      />
    </>
  );
}