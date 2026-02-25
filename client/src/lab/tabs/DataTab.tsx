import { useEffect, useRef, useState } from "react";
import drawingData from "../../../../drawing.json";
// import drawingData from "../../data/book/B-book-0.json";
import { drawStrokes } from "../../utils/drawStrokes";
import type { Color, Stroke } from "../../config/types";

const ITEMS_PER_PAGE = 50;
const THUMBNAIL_SIZE = 100;

const DrawingThumbnail = ({
  strokes,
  index,
  onClick,
}: {
  strokes: Stroke[];
  index: number;
  onClick: () => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
    drawStrokes(ctx, strokes, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  }, [strokes]);

  return (
    <div
      onClick={onClick}
      style={{
        border: "1px solid #ccc",
        padding: "5px",
        textAlign: "center",
        backgroundColor: "#fff",
        borderRadius: "4px",
        cursor: "pointer",
        transition: "transform 0.2s",
      }}
      title="클릭하여 JSON 복사"
    >
      <canvas
        ref={canvasRef}
        width={THUMBNAIL_SIZE}
        height={THUMBNAIL_SIZE}
        style={{ border: "1px solid #eee" }}
      />
      <div style={{ fontSize: "12px", marginTop: "5px" }}>ID: {index}</div>
    </div>
  );
};

export const DataTab = () => {
  const [page, setPage] = useState(0);
  const [previewInput, setPreviewInput] = useState("");
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const totalPages = Math.ceil(drawingData.length / ITEMS_PER_PAGE);
  const currentItems = drawingData.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  const handleCopy = (item: any, index: number) => {
    const strokes: Stroke[] = item.map((s: any) => ({
      points: s.points,
      color: s.color,
    }));
    navigator.clipboard.writeText(JSON.stringify(strokes));
    alert(`ID ${index}번 그림 데이터가 복사되었습니다.`);
  };

  const handlePreview = () => {
    try {
      const strokes: Stroke[] = JSON.parse(previewInput);
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 300, 300);
      drawStrokes(ctx, strokes, 300, 300);
    } catch (e) {
      alert("JSON 파싱 오류: 올바른 형식이 아닙니다.");
    }
  };

  return (
    <div
      style={{ padding: "20px", display: "flex", gap: "20px", height: "100%" }}
    >
      {/* Left: Grid */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: "10px" }}>
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <h2>데이터 미리보기 ({drawingData.length}개)</h2>
          <div style={{ marginLeft: "auto" }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              이전
            </button>
            <span style={{ margin: "0 10px" }}>
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
            >
              다음
            </button>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            gap: "10px",
          }}
        >
          {currentItems.map((item, idx) => {
            const globalIndex = page * ITEMS_PER_PAGE + idx;
            const strokes: Stroke[] = item.map((s: any) => ({
              points: s.points as [number[], number[]],
              color: s.color as Color,
            }));
            return (
              <DrawingThumbnail
                key={globalIndex}
                strokes={strokes}
                index={globalIndex}
                onClick={() => handleCopy(item, globalIndex)}
              />
            );
          })}
        </div>
      </div>

      {/* Right: Preview & Test */}
      <div
        style={{
          width: "320px",
          borderLeft: "1px solid #ddd",
          paddingLeft: "20px",
        }}
      >
        <h3>JSON 미리보기</h3>
        <textarea
          value={previewInput}
          onChange={(e) => setPreviewInput(e.target.value)}
          placeholder="JSON 데이터를 여기에 붙여넣으세요..."
          style={{
            width: "100%",
            height: "200px",
            fontFamily: "monospace",
            fontSize: "12px",
          }}
        />
        <button
          onClick={handlePreview}
          style={{
            marginTop: "10px",
            width: "100%",
            padding: "10px",
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          렌더링 확인
        </button>
        <div
          style={{
            marginTop: "20px",
            border: "1px solid #ccc",
            width: "300px",
            height: "300px",
          }}
        >
          <canvas ref={previewCanvasRef} width={300} height={300} />
        </div>
      </div>
    </div>
  );
};
