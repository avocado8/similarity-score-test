import { useState, useRef, useEffect } from "react";
import { fetchQuickDraw, type CandidateItem } from "../../utils/fetchQuickDraw";
import { drawStrokes } from "../../utils/drawStrokes";
import type { Stroke } from "../../config/types";

// Types for Labeling
export type LabelType = "Prompt" | "A1" | "A2" | "B";
export type TargetCategory = "book" | "whale";
export type FetchCategory = TargetCategory | "apple" | "bird";

export interface SelectedItem {
  id: string;
  label: LabelType;
  promptIndex: number;
  category: TargetCategory;
  strokes: Stroke[];
}

const THUMBNAIL_SIZE = 120;

const DrawingThumbnail = ({
  strokes,
  id,
  onClick,
  isSelected,
  isSeen,
}: {
  strokes: Stroke[];
  id: string;
  onClick: () => void;
  isSelected: boolean;
  isSeen: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = isSeen ? "#f0f0f0" : "white";
    ctx.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);

    ctx.strokeStyle = isSeen ? "rgba(0,0,0,0.3)" : "black";
    drawStrokes(ctx, strokes, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  }, [strokes, isSeen]);

  return (
    <div
      onClick={onClick}
      style={{
        border: isSelected ? "3px solid #4CAF50" : "1px solid #ccc",
        cursor: "pointer",
        padding: "5px",
        textAlign: "center",
        backgroundColor: isSelected ? "#e8f5e9" : isSeen ? "#f5f5f5" : "#fff",
        borderRadius: "4px",
        transition: "all 0.2s",
        opacity: isSeen && !isSelected ? 0.6 : 1,
      }}
    >
      <canvas
        ref={canvasRef}
        width={THUMBNAIL_SIZE}
        height={THUMBNAIL_SIZE}
        style={{ border: "1px solid #eee", background: "white" }}
      />
      <div
        style={{
          fontSize: "11px",
          marginTop: "5px",
          textOverflow: "ellipsis",
          overflow: "hidden",
        }}
      >
        {id}
      </div>
    </div>
  );
};

export const TestSetBuilderTab = () => {
  const [targetCategory, setTargetCategory] = useState<TargetCategory>("book");
  const [fetchCategory, setFetchCategory] = useState<FetchCategory>("book");

  // Data State
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  // Tracker State
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [showSeen, setShowSeen] = useState(true);

  // Selection State
  const [selections, setSelections] = useState<SelectedItem[]>([]);

  // Control Panel State
  const [activeLabel, setActiveLabel] = useState<LabelType>("Prompt");
  const [activePromptIndex, setActivePromptIndex] = useState<number>(0);

  // Load Data
  const loadData = async (resetOffset: boolean = false) => {
    setLoading(true);
    try {
      const newOffset = resetOffset ? 0 : offset;
      const data = await fetchQuickDraw(fetchCategory, newOffset, 100);

      if (resetOffset) {
        setCandidates(data);
      } else {
        setCandidates((prev) => [...prev, ...data]);
      }

      setOffset(newOffset + 100);
    } catch (e) {
      alert("Failed to fetch data. See console for details.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Category switch changes the list and resets offset
  useEffect(() => {
    setCandidates([]);
    setOffset(0);
  }, [fetchCategory]);

  const handleSelect = (item: CandidateItem) => {
    // If it's already selected in the current label + promptIndex, let's treat it as unselect? Or just disallow for now (or allow removal)
    const existingIndex = selections.findIndex((s) => s.id === item.id);

    // We add to selections
    if (existingIndex >= 0) {
      // Toggle off if clicking the matching selection
      if (
        selections[existingIndex].label === activeLabel &&
        selections[existingIndex].promptIndex === activePromptIndex &&
        selections[existingIndex].category === targetCategory
      ) {
        setSelections((prev) => prev.filter((s) => s.id !== item.id));
      } else {
        // Re-assign to new label/index/category
        setSelections((prev) => {
          const newArr = [...prev];
          newArr[existingIndex] = {
            ...newArr[existingIndex],
            label: activeLabel,
            promptIndex: activePromptIndex,
            category: targetCategory,
          };
          return newArr;
        });
      }
    } else {
      setSelections((prev) => [
        ...prev,
        {
          id: item.id,
          strokes: item.strokes,
          label: activeLabel,
          promptIndex: activePromptIndex,
          category: targetCategory,
        },
      ]);
    }

    // Mark as seen
    setSeenIds((prev) => new Set(prev).add(item.id));
  };

  const getSelectionCount = (
    lbl: LabelType,
    pIdx: number = 0,
    cat: TargetCategory,
  ) => {
    return selections.filter(
      (s) => s.label === lbl && s.promptIndex === pIdx && s.category === cat,
    ).length;
  };

  const downloadFile = (filename: string, data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    // Prompt Set
    const promptSelected = selections.filter(
      (s) => s.label === "Prompt" && s.category === targetCategory,
    );
    if (promptSelected.length > 0) {
      downloadFile(
        `Prompt-${targetCategory}.json`,
        promptSelected.map((s) => s.strokes),
      );
    }

    // A1, A2, B는 각각 5개의 Prompt 기준에 맞춰 저장
    for (let i = 0; i < 5; i++) {
      const a1 = selections.filter(
        (s) =>
          s.label === "A1" &&
          s.promptIndex === i &&
          s.category === targetCategory,
      );
      if (a1.length > 0)
        downloadFile(
          `A1-${targetCategory}-${i}.json`,
          a1.map((s) => s.strokes),
        );

      const a2 = selections.filter(
        (s) =>
          s.label === "A2" &&
          s.promptIndex === i &&
          s.category === targetCategory,
      );
      if (a2.length > 0)
        downloadFile(
          `A2-${targetCategory}-${i}.json`,
          a2.map((s) => s.strokes),
        );

      const b = selections.filter(
        (s) =>
          s.label === "B" &&
          s.promptIndex === i &&
          s.category === targetCategory,
      );
      if (b.length > 0)
        downloadFile(
          `B-${targetCategory}-${i}.json`,
          b.map((s) => s.strokes),
        );
    }
  };

  const visibleCandidates = candidates.filter((c) =>
    showSeen ? true : !seenIds.has(c.id),
  );

  return (
    <div style={{ display: "flex", height: "100%", width: "100%" }}>
      {/* Left Main Panel: Render Grid */}
      <div
        style={{
          flex: 1,
          padding: "20px",
          overflowY: "auto",
          background: "#fafafa",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <h2>
            {fetchCategory} 후보 그림 풀 ({visibleCandidates.length}개 표시)
          </h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              value={fetchCategory}
              onChange={(e) => setFetchCategory(e.target.value as any)}
            >
              <option value="book">Book</option>
              <option value="whale">Whale</option>
              <option value="apple">Apple</option>
              <option value="bird">Bird</option>
            </select>
            <button
              onClick={() => loadData(candidates.length === 0)}
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : candidates.length === 0
                  ? "초기 로드"
                  : "더 불러오기"}
            </button>
            <label>
              <input
                type="checkbox"
                checked={showSeen}
                onChange={(e) => setShowSeen(e.target.checked)}
              />
              Show Seen
            </label>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {visibleCandidates.map((c) => {
            const selection = selections.find((s) => s.id === c.id);
            const isSelectedForCurrentActive = selection
              ? selection.label === activeLabel &&
                selection.promptIndex === activePromptIndex &&
                selection.category === targetCategory
              : false;

            return (
              <DrawingThumbnail
                key={c.id}
                id={c.id}
                strokes={c.strokes}
                onClick={() => handleSelect(c)}
                isSelected={isSelectedForCurrentActive}
                isSeen={seenIds.has(c.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Right Control Panel */}
      <div
        style={{
          width: "350px",
          borderLeft: "2px solid #ddd",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "15px", borderBottom: "1px solid #ddd" }}>
          <div
            style={{
              marginBottom: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3 style={{ margin: 0 }}>타겟 실험 설정</h3>
            <select
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value as any)}
              style={{ padding: "5px", fontWeight: "bold" }}
            >
              <option value="book">Book 실험</option>
              <option value="whale">Whale 실험</option>
            </select>
          </div>
          <h3 style={{ margin: "0 0 10px 0" }}>분류 라벨 선택</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "5px",
              marginBottom: "15px",
            }}
          >
            {(["Prompt", "A1", "A2", "B"] as LabelType[]).map((lbl) => (
              <button
                key={lbl}
                onClick={() => setActiveLabel(lbl)}
                style={{
                  flex: 1,
                  background: activeLabel === lbl ? "#2196F3" : "#f0f0f0",
                  color: activeLabel === lbl ? "white" : "black",
                  border: "1px solid #ccc",
                  padding: "8px",
                  cursor: "pointer",
                  fontWeight: activeLabel === lbl ? "bold" : "normal",
                }}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              프롬프트 Index (0~4)
            </label>
            <select
              value={activePromptIndex}
              onChange={(e) => setActivePromptIndex(Number(e.target.value))}
              style={{ width: "100%", padding: "8px" }}
            >
              {[0, 1, 2, 3, 4].map((idx) => (
                <option key={idx} value={idx}>
                  Prompt #{idx} - {targetCategory}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              background: "#e3f2fd",
              padding: "10px",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            <strong>현재 액션:</strong> 그림을 클릭하면{" "}
            <strong>{targetCategory}</strong> 세트의{" "}
            <strong>
              {activeLabel}-{activePromptIndex}
            </strong>{" "}
            (으)로 분류됩니다.
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "15px" }}>
          <h3 style={{ margin: "0 0 15px 0" }}>진행률 ({targetCategory})</h3>

          {[0, 1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "15px",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: activePromptIndex === idx ? "#f5fcff" : "white",
                borderColor: activePromptIndex === idx ? "#2196F3" : "#ddd",
              }}
            >
              <strong
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: activePromptIndex === idx ? "#2196F3" : "black",
                }}
              >
                Prompt #{idx}
              </strong>
              <ProgressRow
                label="Prompt (제시)"
                selected={getSelectionCount("Prompt", idx, targetCategory)}
                target={1}
              />
              <ProgressRow
                label="A1 (유사)"
                selected={getSelectionCount("A1", idx, targetCategory)}
                target={10}
              />
              <ProgressRow
                label="A2 (비유사)"
                selected={getSelectionCount("A2", idx, targetCategory)}
                target={10}
              />
              <ProgressRow
                label="B (타 카테고리)"
                selected={getSelectionCount("B", idx, targetCategory)}
                target={20}
              />
            </div>
          ))}
        </div>

        <div style={{ padding: "15px", borderTop: "1px solid #ddd" }}>
          <button
            onClick={exportJSON}
            style={{
              width: "100%",
              padding: "12px",
              background: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            ⬇️ Export JSON
          </button>
          <div
            style={{
              fontSize: "12px",
              color: "#666",
              marginTop: "5px",
              textAlign: "center",
            }}
          >
            선택된 데이터들을 JSON 파일로 다운로드합니다.
          </div>
        </div>
      </div>
    </div>
  );
};

const ProgressRow = ({
  label,
  selected,
  target,
}: {
  label: string;
  selected: number;
  target: number;
}) => {
  const isDone = selected >= target;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "12px",
        marginBottom: "5px",
        alignItems: "center",
      }}
    >
      <span>{label}</span>
      <span
        style={{ color: isDone ? "#4CAF50" : "#F44336", fontWeight: "bold" }}
      >
        {selected} / {target}
      </span>
    </div>
  );
};
