import { useEffect, useRef, useState } from "react";
import drawingData from "../../../../drawing.json";
import { useCanvasDrawing } from "../../hooks/useCanvasDrawing";
import { drawStrokes } from "../../utils/drawStrokes";
import { calculateFinalSimilarityByStrokes } from "../../similarity/calculateFinalSimilarity";
import { ConfigPanel } from "../components/ConfigPanel";
import { ResultPanel } from "../components/ResultPanel";
import { CANVAS_CONFIG, COLOR_MAP } from "../../config/canvasConfig";
import type {
  Color,
  SimilarityConfig,
  SimulationResult,
  Stroke,
} from "../../config/types";

export const SingleCaseTab = () => {
  const [targetId, setTargetId] = useState<number>(0);
  const [targetStrokes, setTargetStrokes] = useState<Stroke[]>([]);
  const targetCanvasRef = useRef<HTMLCanvasElement>(null);

  const [inputText, setInputText] = useState("");
  const [config, setConfig] = useState<SimilarityConfig>({
    weights: {
      strokeCount: 0,
      strokeMatch: 0.8,
      shape: 0.2,
    },
    useNormalize: true,
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [hoveredMatch, setHoveredMatch] = useState<{
    index1: number | null;
    index2: number | null;
  }>({ index1: null, index2: null });

  // User Drawing Hook
  const {
    canvasRef: userCanvasRef,
    strokes: userStrokes,
    currentColor,
    setCurrentColor,
    clearCanvas,
    undoStroke,
    loadStrokes,
  } = useCanvasDrawing(CANVAS_CONFIG.width, CANVAS_CONFIG.height);

  // Load target strokes when ID changes
  useEffect(() => {
    const item = drawingData[targetId];
    if (item) {
      const strokes: Stroke[] = item.map((s: any) => ({
        points: s.points as [number[], number[]],
        color: s.color as Color,
      }));
      setTargetStrokes(strokes);
    }
  }, [targetId]);

  // Calculate Similarity when dependencies change
  useEffect(() => {
    if (userStrokes.length > 0 && targetStrokes.length > 0) {
      const simResult = calculateFinalSimilarityByStrokes(
        targetStrokes,
        userStrokes,
        config,
      );
      setResult(simResult);
    } else {
      setResult(null);
    }
  }, [userStrokes, targetStrokes, config]);

  // Draw Helper
  const drawToCanvas = (
    canvas: HTMLCanvasElement | null,
    strokes: Stroke[],
    highlightIndex: number | null,
  ) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use common styles for background
    ctx.fillStyle = "white"; // Always white background for lab
    ctx.fillRect(0, 0, CANVAS_CONFIG.width, CANVAS_CONFIG.height);

    drawStrokes(ctx, strokes, CANVAS_CONFIG.width, CANVAS_CONFIG.height, {
      highlightIndices: highlightIndex !== null ? [highlightIndex] : [],
      highlightColor: "red",
      opacity: highlightIndex !== null ? 0.1 : 1.0,
    });
  };

  // Render Canvases (Effect for drawing)
  useEffect(() => {
    drawToCanvas(targetCanvasRef.current, targetStrokes, hoveredMatch.index1);
    drawToCanvas(userCanvasRef.current, userStrokes, hoveredMatch.index2);
  }, [targetStrokes, userStrokes, hoveredMatch]);

  const handleLoadInput = () => {
    try {
      const parsed = JSON.parse(inputText);
      if (Array.isArray(parsed)) {
        const loaded: Stroke[] = parsed.map((s: any) => ({
          points: s.points,
          color: s.color,
        }));
        loadStrokes(loaded);
      } else {
        alert("배열 형식이 아닙니다.");
      }
    } catch (e) {
      alert("JSON 파싱 에러");
    }
  };

  const handleLoadOriginal = () => {
    loadStrokes(targetStrokes);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "20px",
        gap: "180px",
      }}
    >
      {/* Top Area: Canvases and Config */}
      <div style={{ display: "flex", gap: "20px", height: "500px" }}>
        {/* Left: Target */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3>Target (제시)</h3>
            <div>
              ID:{" "}
              <input
                type="number"
                value={targetId}
                onChange={(e) =>
                  setTargetId(Math.max(0, parseInt(e.target.value) || 0))
                }
                style={{ width: "50px" }}
              />
            </div>
          </div>
          <div
            style={{
              border: "1px solid #ccc",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#eee",
            }}
          >
            <canvas
              ref={targetCanvasRef}
              width={CANVAS_CONFIG.width}
              height={CANVAS_CONFIG.height}
              style={{
                background: "white",
                maxWidth: "100%",
                maxHeight: "100%",
              }}
            />
          </div>
        </div>

        {/* Center: Config */}
        <div style={{ width: "300px" }}>
          <ConfigPanel config={config} onChange={setConfig} />
        </div>

        {/* Right: User Input */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3>User (내 그림)</h3>
            <div style={{ display: "flex", gap: "5px" }}>
              <button onClick={undoStroke}>Undo</button>
              <button onClick={clearCanvas}>Clear</button>
            </div>
          </div>
          <div
            style={{
              border: "1px solid #ccc",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#eee",
            }}
          >
            <canvas
              ref={userCanvasRef}
              width={CANVAS_CONFIG.width}
              height={CANVAS_CONFIG.height}
              style={{
                background: "white",
                cursor: "crosshair",
                maxWidth: "100%",
                maxHeight: "100%",
              }}
            />
          </div>

          {/* Controls & Input */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {/* Color Palette */}
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
              {Object.entries(COLOR_MAP).map(([name, rgb]) => (
                <button
                  key={name}
                  onClick={() => setCurrentColor(rgb)}
                  style={{
                    width: "24px",
                    height: "24px",
                    backgroundColor: `rgb(${rgb.join(",")})`,
                    border:
                      currentColor === rgb
                        ? "2px solid #000"
                        : "1px solid #ccc",
                    cursor: "pointer",
                    borderRadius: "4px",
                  }}
                  title={name}
                />
              ))}
            </div>

            <div>
              <button onClick={handleLoadOriginal}>원본 그림 불러오기</button>
            </div>

            {/* JSON Load */}
            <div style={{ display: "flex", gap: "5px" }}>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="JSON 붙여넣기..."
                style={{ flex: 1, padding: "4px" }}
              />
              <button onClick={handleLoadInput} style={{ padding: "4px 8px" }}>
                Load
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Result */}
      <div
        style={{
          flex: 1,
          borderTop: "1px solid #ddd",
          paddingTop: "20px",
          overflow: "hidden",
        }}
      >
        <ResultPanel
          result={result}
          onHoverMatch={(i1, i2) => setHoveredMatch({ index1: i1, index2: i2 })}
        />
      </div>
    </div>
  );
};
