import {
  Box,
  Stack,
  Paper,
  Typography,
  Radio,
  Checkbox,
  FormControl,
  Select,
  MenuItem, 
} from "@mui/material";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import QuestionOption from "../../utils/QuestionOption";

export const renderQuestionByType = ({
  currentQuestion,
  answers,
  submitted,
  started,
  choXemDapAn,
  handleSingleSelect,
  handleMultipleSelect,
  setAnswers,
  reorder,
  handleDragEnd,
}) => {
  if (!currentQuestion) return null;

  return (
    <>
      {currentQuestion.type === "sort" && (
        <Box sx={{ mt: 0 }}>
        {currentQuestion.questionImage && (
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2, width: "100%" }}>
            <img
                src={currentQuestion.questionImage}
                alt="Hình minh hoạ"
                style={{
                width: "auto",
                height: "auto",
                maxWidth: "50%",
                maxHeight: 400,
                objectFit: "contain",
                borderRadius: 8,
                marginTop: "-12px",
                display: "block",
                }}
            />
        </Box>
        )}

        <DragDropContext
            onDragEnd={(result) => {
            if (!result.destination || submitted || !started) return;

            const currentOrder =
                answers[currentQuestion.id] ??
                (Array.isArray(currentQuestion.options)
                ? currentQuestion.options.map((_, idx) => idx)
                : []);

            const newOrder = reorder(
                currentOrder,
                result.source.index,
                result.destination.index
            );

            setAnswers((prev) => ({ ...prev, [currentQuestion.id]: newOrder }));
            }}
        >
            <Droppable droppableId="sort-options">
            {(provided) => {
                const orderIdx =
                answers[currentQuestion.id] ??
                (Array.isArray(currentQuestion.options)
                    ? currentQuestion.options.map((_, idx) => idx)
                    : []);

                return (
                <Stack {...provided.droppableProps} ref={provided.innerRef} spacing={2}>
                    {orderIdx.map((optIdx, pos) => {
                    const optionData = currentQuestion.options?.[optIdx] ?? {};
                    const optionText =
                        typeof optionData === "string"
                        ? optionData
                        : optionData.text ?? "";
                    const optionImage =
                        typeof optionData === "object" ? optionData.image ?? null : null;

                    // ✅ So sánh với correctTexts nếu có
                    const normalize = (v) =>
                        String(
                        typeof v === "object" && v !== null ? v.text ?? "" : v ?? ""
                        )
                        .replace(/<[^>]*>/g, "")
                        .trim()
                        .toLowerCase();

                    const userText = normalize(optionData);
                    const correctText = normalize(
                        currentQuestion.correctTexts?.[pos]
                    );

                    const isCorrectPos =
                        submitted &&
                        choXemDapAn &&
                        userText &&
                        correctText &&
                        userText === correctText;


                    return (
                        <Draggable
                        key={optIdx}
                        draggableId={String(optIdx)}
                        index={pos}
                        isDragDisabled={submitted || !started}
                        >
                        {(provided, snapshot) => (
                            <Box
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                                borderRadius: 1,
                                bgcolor:
                                submitted && choXemDapAn
                                    ? isCorrectPos
                                    ? "#c8e6c9"
                                    : "#ffcdd2"
                                    : "transparent",
                                border: "1px solid #90caf9",
                                cursor: submitted || !started ? "default" : "grab",
                                boxShadow: "none",
                                transition:
                                "background-color 0.2s ease, border-color 0.2s ease",
                                minHeight: 40,
                                py: 0.5,
                                px: 3,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                "&:hover": {
                                borderColor: "#1976d2",
                                bgcolor: "#f5f5f5",
                                },
                            }}
                            >
                            {/*{optionImage && (
                                <Box
                                component="img"
                                src={optionImage}
                                alt={`option-${optIdx}`}
                                sx={{
                                    maxHeight: 40,
                                    width: "auto",
                                    objectFit: "contain",
                                    borderRadius: 2,
                                    flexShrink: 0,
                                }}
                                />
                            )}*/}

                            <QuestionOption option={optionData} />
                            </Box>
                        )}
                        </Draggable>
                    );
                    })}
                    {provided.placeholder}
                </Stack>
                );
            }}
            </Droppable>
        </DragDropContext>
        </Box>
    )}

    {/* MATCH */}
    {currentQuestion.type === "matching" && Array.isArray(currentQuestion.pairs) && (
        <Stack spacing={2} sx={{ width: "100%" }}>

        {/* ⭐ HÌNH MINH HOẠ CÂU HỎI */}
        {currentQuestion.questionImage && (
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2, width: "100%" }}>
                <img
                src={currentQuestion.questionImage}
                alt="Hình minh hoạ"
                style={{
                    width: "auto",        // ⭐ không ép giãn
                    height: "auto",       // ⭐ giữ tỉ lệ gốc
                    maxWidth: "50%",     // ⭐ chỉ co khi ảnh lớn hơn khung
                    maxHeight: 400,       // ⭐ giới hạn chiều cao (tuỳ chỉnh)
                    objectFit: "contain",
                    borderRadius: 8,
                    marginTop: "-12px",
                    display: "block",
                }}
                />
            </Box>
            </Box>
        )}

        <DragDropContext
            onDragEnd={(result) => {
            if (!result.destination || submitted || !started) return;

            const currentOrder =
                answers[currentQuestion.id] ??
                (Array.isArray(currentQuestion.pairs)
                ? currentQuestion.pairs.map((_, idx) => idx)
                : []);

            const newOrder = reorder(
                currentOrder,
                result.source.index,
                result.destination.index
            );

            setAnswers((prev) => ({
                ...prev,
                [currentQuestion.id]: newOrder,
            }));
            }}
        >
            <Stack spacing={1.5} sx={{ width: "100%", px: 1 }}>
            {currentQuestion.pairs.map((pair, i) => {
                const optionText = pair?.left || "";
                const optionImage =
                pair?.leftImage?.url || pair?.leftIconImage?.url || null;

                const ratioLeft = currentQuestion.columnRatio?.left ?? 1;
                const ratioRight = currentQuestion.columnRatio?.right ?? 1;

                const userOrder =
                answers[currentQuestion.id] ??
                (Array.isArray(currentQuestion.rightOptions)
                    ? currentQuestion.rightOptions.map((_, idx) => idx)
                    : []);

                const rightIdx = userOrder[i];
                const rightVal = currentQuestion.rightOptions?.[rightIdx] ?? null;

                const rightText =
                typeof rightVal === "string"
                    ? rightVal
                    : rightVal?.text ?? "";

                const rightImage =
                typeof rightVal === "object" ? rightVal?.url ?? null : null;

                const isCorrect =
                submitted &&
                Array.isArray(currentQuestion.correct) &&
                userOrder[i] === currentQuestion.correct[i];

                return (
                <Stack
                    key={i}
                    direction="row"
                    spacing={2}
                    alignItems="stretch"
                    sx={{ minHeight: 60 }}
                >
                    {/* LEFT */}
                    <Paper
                    sx={{
                        flex: ratioLeft,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 1,
                        py: 0.5,
                        border: "1px solid #64b5f6",
                        borderRadius: 1,
                        boxShadow: "none",
                    }}
                    >
                    {optionImage && (
                        <Box
                        component="img"
                        src={optionImage}
                        alt={`left-${i}`}
                        sx={{
                            maxHeight: 60,
                            maxWidth: 60,
                            objectFit: "contain",
                            borderRadius: 2,
                            flexShrink: 0,
                        }}
                        />
                    )}

                    {optionText && (
                        <Typography
                        component="div"
                        sx={{
                            fontSize: "1.1rem",
                            flex: 1,
                            wordBreak: "break-word",
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.5,
                            "& p": { margin: 0 },
                        }}
                        dangerouslySetInnerHTML={{ __html: optionText }}
                        />
                    )}
                    </Paper>

                    {/* RIGHT */}
                    <Droppable droppableId={`right-${i}`} direction="vertical">
                    {(provided) => (
                        <Stack
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{ flex: ratioRight }}
                        >
                        {rightVal && (
                            <Draggable
                            key={rightIdx}
                            draggableId={String(rightIdx)}
                            index={i}
                            isDragDisabled={submitted || !started}
                            >
                            {(provided) => (
                                <Paper
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                sx={{
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    px: 1,
                                    py: 0.5,
                                    border: "1px solid #90caf9",
                                    borderRadius: 1,
                                    boxShadow: "none",
                                    cursor:
                                    submitted || !started ? "default" : "grab",
                                    bgcolor:
                                    submitted && choXemDapAn
                                        ? isCorrect
                                        ? "#c8e6c9"
                                        : "#ffcdd2"
                                        : "transparent",
                                    "&:hover": {
                                    borderColor: "#1976d2",
                                    bgcolor: "#f5f5f5",
                                    },
                                }}
                                >
                                {rightImage && (
                                    <Box
                                    component="img"
                                    src={rightImage}
                                    alt={`right-${rightIdx}`}
                                    sx={{
                                        maxHeight: 40,
                                        maxWidth: 40,
                                        objectFit: "contain",
                                        borderRadius: 2,
                                        flexShrink: 0,
                                    }}
                                    />
                                )}

                                {rightText && (
                                    <Typography
                                    component="div"
                                    sx={{
                                        fontSize: "1.1rem",
                                        flex: 1,
                                        wordBreak: "break-word",
                                        whiteSpace: "pre-wrap",
                                        lineHeight: 1.5,
                                        "& p": { margin: 0 },
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: rightText,
                                    }}
                                    />
                                )}
                                </Paper>
                            )}
                            </Draggable>
                        )}
                        {provided.placeholder}
                        </Stack>
                    )}
                    </Droppable>
                </Stack>
                );
            })}
            </Stack>
        </DragDropContext>
        </Stack>
    )}

    {/* 1. Single */}
    {currentQuestion.type === "single" && (
        <Stack spacing={2}>

        {/* ⭐ HÌNH MINH HOẠ CÂU HỎI */}
        {currentQuestion.questionImage && (
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2, width: "100%" }}>
            <img
                src={currentQuestion.questionImage}
                alt="Hình minh hoạ"
                style={{
                width: "auto",
                height: "auto",
                maxWidth: "50%",
                maxHeight: 400,
                objectFit: "contain",
                borderRadius: 8,
                marginTop: "-12px",
                display: "block",
                }}
            />
            </Box>
        )}

        {currentQuestion.options.map((optionData, i) => {
            const selected = answers[currentQuestion.id] === i;

            const correctArray = Array.isArray(currentQuestion.correct)
            ? currentQuestion.correct
            : [currentQuestion.correct];

            const isCorrect = submitted && correctArray.includes(i);
            const isWrong = submitted && selected && !correctArray.includes(i);

            const handleSelect = () => {
            if (submitted || !started) return;
            handleSingleSelect(currentQuestion.id, i);   // ⭐ LƯU INDEX HIỂN THỊ
            };

            return (
            <Paper
                key={i}
                onClick={handleSelect}
                sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                borderRadius: 1,
                cursor: submitted || !started ? "default" : "pointer",
                bgcolor:
                    submitted && choXemDapAn
                    ? isCorrect
                        ? "#c8e6c9"
                        : isWrong
                        ? "#ffcdd2"
                        : "transparent"
                    : "transparent",
                border: "1px solid #90caf9",
                minHeight: 40,
                py: 0.5,
                px: 1,
                boxShadow: "none",
                transition: "background-color 0.2s ease, border-color 0.2s ease",
                "&:hover": {
                    borderColor: "#1976d2",
                    bgcolor: "#f5f5f5",
                },
                }}
            >
                {/* Radio button */}
                <Radio checked={selected} onChange={handleSelect} sx={{ mr: 1 }} />

                {/* Option */}
                <Box sx={{ flex: 1 }}>
                <QuestionOption option={optionData} />
                </Box>
            </Paper>
            );
        })}
        </Stack>
    )}

    {/* 2. Multiple */}
    {currentQuestion.type === "multiple" && (
        <Stack spacing={2}>
        {/* Hình minh họa câu hỏi nếu có */}
        {currentQuestion.questionImage && (
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2, width: "100%" }}>
            <img
                src={currentQuestion.questionImage}
                alt="Hình minh hoạ"
                style={{
                width: "auto",
                height: "auto",
                maxWidth: "50%",
                maxHeight: 400,
                objectFit: "contain",
                borderRadius: 8,
                marginTop: "-12px",
                display: "block",
                }}
            />
            </Box>
        )}

        {currentQuestion.options.map((optionData, i) => {
            const optionText = optionData?.text ?? "";
            const optionImage = optionData?.image ?? null;

            const userAns = answers[currentQuestion.id] || [];
            const checked = userAns.includes(i);

            const isCorrect = submitted && currentQuestion.correct.includes(i);
            const isWrong = submitted && checked && !currentQuestion.correct.includes(i);

            const handleSelect = () => {
            if (submitted || !started) return;
            handleMultipleSelect(currentQuestion.id, i, !checked); // ⭐ LƯU INDEX HIỂN THỊ
            };

            return (
            <Paper
                key={i}
                onClick={handleSelect}
                sx={{
                display: "flex",
                alignItems: "center",
                borderRadius: 1,
                cursor: submitted || !started ? "default" : "pointer",
                bgcolor:
                    submitted && choXemDapAn
                    ? isCorrect
                        ? "#c8e6c9"
                        : isWrong
                        ? "#ffcdd2"
                        : "transparent"
                    : "transparent",
                border: "1px solid #90caf9",
                minHeight: 40,
                py: 0.5,
                px: 1,
                gap: 1,
                boxShadow: "none",
                transition: "background-color 0.2s ease, border-color 0.2s ease",
                "&:hover": {
                    borderColor: "#1976d2",
                    bgcolor: "#f5f5f5",
                },
                }}
            >
                {/* Checkbox */}
                <Checkbox checked={checked} onChange={handleSelect} sx={{ mr: 1 }} />

                {/* Hình option nếu có */}
                {optionImage && (
                <Box
                    component="img"
                    src={optionImage}
                    alt={`option-${i}`}
                    sx={{
                    maxHeight: 40,
                    maxWidth: 40,
                    objectFit: "contain",
                    borderRadius: 2,
                    flexShrink: 0,
                    }}
                />
                )}

                {/* Text option */}
                <Typography
                variant="body1"
                sx={{
                    userSelect: "none",
                    fontSize: "1.1rem",
                    lineHeight: 1.5,
                    flex: 1,
                    whiteSpace: "pre-wrap",
                    "& p": { margin: 0 },
                }}
                component="div"
                dangerouslySetInnerHTML={{ __html: optionText }}
                />
            </Paper>
            );
        })}
        </Stack>
    )}

    {/* TRUE / FALSE */}
    {currentQuestion.type === "truefalse" &&
        Array.isArray(currentQuestion?.options) && (
        <Stack spacing={2}>
            {/* Hiển thị hình minh họa nếu có */}
            {currentQuestion.questionImage && (
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <img
                src={currentQuestion.questionImage}
                alt="Hình minh họa"
                style={{
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: 4,
                    marginTop: "-12px",
                }}
                />
            </Box>
            )}

            {currentQuestion.options.map((opt, i) => {
            const userAns = answers[currentQuestion.id] || [];
            const selected = userAns[i] ?? "";

            const originalIdx = Array.isArray(currentQuestion.initialOrder)
                ? currentQuestion.initialOrder[i]
                : i;

            const correctArray = Array.isArray(currentQuestion.correct)
                ? currentQuestion.correct
                : [];

            const correctVal = correctArray[originalIdx] ?? "";

            const showResult = submitted && choXemDapAn;
            const isCorrect = showResult && selected === correctVal;
            const isWrong =
                showResult && selected !== "" && selected !== correctVal;

            // ⭐⭐ FIX DỨT ĐIỂM OBJECT OBJECT
            let optionText = "";
            let optionImage = null;

            if (typeof opt === "string") {
                optionText = opt;
            } else if (opt && typeof opt === "object") {
                optionText = opt.text ?? "";
                optionImage = opt.image ?? null;
            }

            return (
                <Paper
                key={i}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    borderRadius: 1,
                    minHeight: 40,
                    py: 0.5,
                    px: 1,
                    bgcolor: isCorrect
                    ? "#c8e6c9"
                    : isWrong
                    ? "#ffcdd2"
                    : "transparent",
                    border: "1px solid #90caf9",
                    boxShadow: "none",
                    transition:
                    "background-color 0.2s ease, border-color 0.2s ease",
                    "&:hover": {
                    borderColor: "#1976d2",
                    bgcolor: "#f5f5f5",
                    },
                }}
                >
                {/* Ảnh option nếu có */}
                {optionImage && (
                    <Box
                    component="img"
                    src={optionImage}
                    alt={`truefalse-${i}`}
                    sx={{
                        maxHeight: 40,
                        objectFit: "contain",
                        borderRadius: 1,
                        flexShrink: 0,
                    }}
                    />
                )}

                {/* Text option */}
                <Typography
                    component="div"
                    sx={{
                    userSelect: "none",
                    fontSize: "1.1rem",
                    lineHeight: 1.5,
                    flex: 1,
                    whiteSpace: "pre-wrap",
                    "& p": { margin: 0 },
                    }}
                    dangerouslySetInnerHTML={{ __html: optionText }}
                />

                {/* Dropdown Đúng / Sai */}
                <FormControl size="small" sx={{ width: 90 }}>
                    <Select
                    value={selected}
                    onChange={(e) => {
                        if (submitted || !started) return;
                        const val = e.target.value;
                        setAnswers((prev) => {
                        const arr = Array.isArray(prev[currentQuestion.id])
                            ? [...prev[currentQuestion.id]]
                            : Array(currentQuestion.options.length).fill("");
                        arr[i] = val;
                        return { ...prev, [currentQuestion.id]: arr };
                        });
                    }}
                    sx={{
                        height: 32,
                        fontSize: "0.95rem",
                        "& .MuiSelect-select": { py: 0.5 },
                    }}
                    >
                    <MenuItem value="Đ">Đúng</MenuItem>
                    <MenuItem value="S">Sai</MenuItem>
                    </Select>
                </FormControl>
                </Paper>
            );
            })}
        </Stack>
        )}


    {/* IMAGE MULTIPLE */}
    {currentQuestion.type === "image" && (
        <Stack
        direction={{ xs: "column", sm: "row" }}
        gap={2}
        flexWrap="wrap"
        justifyContent="center"
        alignItems="center"
        >
        {currentQuestion.options.map((option, i) => {
            // Ảnh = option.text hoặc option.image
            const imageUrl =
            typeof option === "string"
                ? option
                : option?.text ?? "";

            if (!imageUrl) return null;

            const userAns = answers[currentQuestion.id] || [];
            const checked = userAns.includes(i);

            const isCorrect =
            submitted && currentQuestion.correct.includes(i);

            const isWrong =
            submitted && checked && !currentQuestion.correct.includes(i);

            const handleSelect = () => {
            if (submitted || !started) return;
            handleMultipleSelect(currentQuestion.id, i, !checked); // ⭐ LƯU INDEX HIỂN THỊ
            };

            return (
            <Paper
                key={i}
                onClick={handleSelect}
                sx={{
                width: 150,
                height: 180,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 1,
                border: "1px solid #90caf9",
                cursor: submitted || !started ? "default" : "pointer",
                bgcolor:
                    submitted && choXemDapAn
                    ? isCorrect
                        ? "#c8e6c9"
                        : isWrong
                        ? "#ffcdd2"
                        : "transparent"
                    : "transparent",
                }}
            >
                {/* IMAGE */}
                <img
                src={imageUrl}
                alt={`option-${i}`}
                style={{
                    maxWidth: "75%",
                    maxHeight: 80,
                    objectFit: "contain",
                    marginBottom: 6,
                }}
                onError={(e) => {
                    e.currentTarget.style.display = "none";
                }}
                />

                {/* CHECKBOX */}
                <Checkbox
                checked={checked}
                disabled={submitted || !started}
                />
            </Paper>
            );
        })}
        </Stack>
    )}
    
    {/* FILLBLANK */}
    {currentQuestion.type === "fillblank" &&
        typeof currentQuestion?.option === "string" && (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Stack spacing={2}>
            {/* ⭐ HÌNH MINH HOẠ CÂU HỎI */}
                {currentQuestion.questionImage && (
                <Box
                    sx={{
                    display: "flex",
                    justifyContent: "center",
                    mb: 2,
                    width: "100%",
                    }}
                >
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                    <img
                        src={currentQuestion.questionImage}
                        alt="Hình minh hoạ"
                        style={{
                        width: "auto",
                        height: "auto",
                        maxWidth: "50%",
                        maxHeight: 400,
                        objectFit: "contain",
                        borderRadius: 8,
                        marginTop: "-12px",
                        display: "block",
                        }}
                    />
                    </Box>
                </Box>
                )}
            {/* ======================= CÂU HỎI + CHỖ TRỐNG ======================= */}
            <Box
                sx={{
                width: "100%",
                lineHeight: 1.6,
                fontSize: "1.1rem",
                whiteSpace: "normal",
                fontFamily: "Roboto, Arial, sans-serif",
                }}
            >
                {currentQuestion.option.split("[...]").map((part, idx, arr) => (
                <span
                    key={idx}
                    style={{ display: "inline", fontFamily: "Roboto, Arial, sans-serif" }}
                >
                    {/* Phần văn bản */}
                    <Typography
                    component="span"
                    variant="body1"
                    sx={{
                        mr: 0.5,
                        lineHeight: 1.5,
                        fontSize: "1.1rem",
                        "& p, & div": { display: "inline", margin: 0 },
                    }}
                    dangerouslySetInnerHTML={{ __html: part }}
                    />

                    {/* ======================= CHỖ TRỐNG ======================= */}
                    {idx < arr.length - 1 && (
                    <Droppable droppableId={`blank-${idx}`} direction="horizontal">
                        {(provided) => {
                        const userWord = currentQuestion.filled?.[idx] ?? "";

                        // ✅ LẤY ĐÁP ÁN ĐÚNG (STRING)
                        const correctWordObj = currentQuestion.options?.[idx];
                        const correctWord =
                            typeof correctWordObj === "string"
                            ? correctWordObj
                            : correctWordObj?.text ?? "";

                        const color =
                            submitted && userWord
                            ? userWord.trim() === correctWord.trim()
                                ? "green"
                                : "red"
                            : "#000";

                        return (
                            <Box
                            component="span"
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            sx={{
                                display: "inline-flex",
                                alignItems: "baseline",
                                justifyContent: "center",
                                minWidth: 80,
                                maxWidth: 300,
                                px: 1,
                                border: "1px dashed #90caf9",
                                borderRadius: 1,
                                fontFamily: "Roboto, Arial, sans-serif",
                                fontSize: "1.1rem",
                                lineHeight: "normal",
                                color: color,
                                verticalAlign: "baseline",
                            }}
                            >
                            {userWord && (
                                <Draggable
                                draggableId={`filled-${idx}`}
                                index={0}
                                >
                                {(prov) => (
                                    <Paper
                                    ref={prov.innerRef}
                                    {...prov.draggableProps}
                                    {...prov.dragHandleProps}
                                    sx={{
                                        px: 2,
                                        py: 0.5,
                                        bgcolor: "#e3f2fd",
                                        cursor: "grab",
                                        fontFamily: "Roboto, Arial, sans-serif",
                                        fontSize: "1.1rem",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minHeight: 30,
                                        maxWidth: "100%",
                                        color: color,
                                        border: "1px solid #90caf9",
                                        boxShadow: "none",
                                        "&:hover": { bgcolor: "#bbdefb" },
                                    }}
                                    >
                                    {userWord}
                                    </Paper>
                                )}
                                </Draggable>
                            )}
                            {provided.placeholder}
                            </Box>
                        );
                        }}
                    </Droppable>
                    )}
                </span>
                ))}
            </Box>

            {/* ======================= KHU VỰC THẺ TỪ ======================= */}
            <Box sx={{ mt: 2, textAlign: "left" }}>
                <Typography
                sx={{
                    mb: 1,
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    fontFamily: "Roboto, Arial, sans-serif",
                }}
                >
                Các từ cần điền:
                </Typography>

                <Droppable droppableId="words" direction="horizontal">
                {(provided) => (
                    <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        minHeight: 50,
                        maxHeight: 80,
                        p: 1,
                        border: "1px solid #90caf9",
                        borderRadius: 2,
                        bgcolor: "white",
                        overflowY: "auto",
                    }}
                    >
                    {(currentQuestion.shuffledOptions ||
                        currentQuestion.options ||
                        [])
                        .filter((o) => {
                        const text =
                            typeof o === "string" ? o : o?.text ?? "";
                        return !(currentQuestion.filled ?? []).includes(text);
                        })
                        .map((word, idx) => {
                        const wordText =
                            typeof word === "string"
                            ? word
                            : word?.text ?? "";

                        return (
                            <Draggable
                            key={`${wordText}-${idx}`}
                            draggableId={`word-${idx}`}
                            index={idx}
                            >
                            {(prov) => (
                                <Paper
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                elevation={0}
                                sx={{
                                    px: 2,
                                    py: 0.5,
                                    bgcolor: "#e3f2fd",
                                    cursor: "grab",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    minHeight: 30,
                                    fontFamily: "Roboto, Arial, sans-serif",
                                    fontSize: "1.1rem",
                                    border: "1px solid #90caf9",
                                    boxShadow: "none",
                                    "&:hover": { bgcolor: "#bbdefb" },
                                }}
                                >
                                {wordText}
                                </Paper>
                            )}
                            </Draggable>
                        );
                        })}

                    {provided.placeholder}
                    </Box>
                )}
                </Droppable>
            </Box>
            </Stack>
        </DragDropContext>
    )}
    </>
  );
};