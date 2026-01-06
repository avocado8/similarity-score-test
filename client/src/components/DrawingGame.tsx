import { useEffect, useRef, useState } from "react";
import { useCanvasDrawing } from "../hooks/useCanvasDrawing";
import { drawStrokes } from "../utils/drawStrokes";
import { calculateFinalSimilarity } from "../similarity/calculateFinalSimilarity";
import type { Stroke, Color } from "../similarity/model";
import drawingData from "../../../drawing.json";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;

// drawing.json의 첫 번째 요소를 제시 그림으로 사용
const promptStrokes: Stroke[] = drawingData[drawingData.length - 1].map(
  (item) => ({
    points: item.points as [number[], number[]],
    color: item.color as Color,
  })
);

export const DrawingGame = () => {
  const [similarity, setSimilarity] = useState<number | null>(null);
  const promptCanvasRef = useRef<HTMLCanvasElement>(null);

  // 사용자 그림 캔버스
  const { canvasRef, strokes, currentColor, setCurrentColor, clearCanvas } =
    useCanvasDrawing(CANVAS_WIDTH, CANVAS_HEIGHT, (updatedStrokes) => {
      // 스트로크가 완성될 때마다 유사도 계산
      if (updatedStrokes.length > 0) {
        const result = calculateFinalSimilarity(promptStrokes, updatedStrokes);
        setSimilarity(result.similarity);
      } else {
        setSimilarity(null);
      }
    });

  // 제시 그림 렌더링
  useEffect(() => {
    const canvas = promptCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 배경을 흰색으로 채우기
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 제시 그림 그리기
    drawStrokes(ctx, promptStrokes, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  // 색상 선택 핸들러
  const handleColorChange = (color: Color) => {
    setCurrentColor(color);
  };

  const colors: { name: string; value: Color }[] = [
    { name: "검정", value: [0, 0, 0] },
    { name: "빨강", value: [255, 0, 0] },
    { name: "파랑", value: [0, 0, 255] },
    { name: "초록", value: [0, 255, 0] },
  ];

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>그림 유사도 테스트</h1>

      <div style={{ display: "flex", gap: "40px", marginTop: "20px" }}>
        {/* 제시 그림 */}
        <div>
          <h2>제시 그림</h2>
          <canvas
            ref={promptCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              border: "2px solid #333",
              backgroundColor: "white",
            }}
          />
        </div>

        {/* 사용자 그림 */}
        <div>
          <h2>내 그림</h2>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              border: "2px solid #333",
              backgroundColor: "white",
              cursor: "crosshair",
            }}
          />

          {/* 컨트롤 */}
          <div style={{ marginTop: "10px" }}>
            {/* 색상 선택 */}
            <div style={{ marginBottom: "10px" }}>
              <strong>색상 선택: </strong>
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => handleColorChange(color.value)}
                  style={{
                    margin: "0 5px",
                    padding: "5px 10px",
                    backgroundColor:
                      currentColor[0] === color.value[0] &&
                      currentColor[1] === color.value[1] &&
                      currentColor[2] === color.value[2]
                        ? "#ddd"
                        : "white",
                    border: "1px solid #333",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "15px",
                      height: "15px",
                      backgroundColor: `rgb(${color.value[0]}, ${color.value[1]}, ${color.value[2]})`,
                      border: "1px solid #000",
                      marginRight: "5px",
                      verticalAlign: "middle",
                    }}
                  />
                  {color.name}
                </button>
              ))}
            </div>

            {/* 전체 지우기 */}
            <button
              onClick={clearCanvas}
              style={{
                padding: "8px 16px",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              전체 지우기
            </button>
          </div>
        </div>
      </div>

      {/* 유사도 점수 표시 */}
      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <h2>유사도 점수</h2>
        <div style={{ fontSize: "48px", fontWeight: "bold", color: "#2196F3" }}>
          {similarity !== null
            ? `${similarity.toFixed(2)}점`
            : "그림을 그려주세요"}
        </div>
        <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
          <p>스트로크 수: {strokes.length}개</p>
          <p>제시 그림 스트로크 수: {promptStrokes.length}개</p>
        </div>
      </div>

      {/* 디버깅 정보 */}
      <details style={{ marginTop: "20px" }}>
        <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
          디버깅 정보 (스트로크 데이터)
        </summary>
        <pre
          style={{
            backgroundColor: "#f0f0f0",
            padding: "10px",
            borderRadius: "4px",
            overflow: "auto",
            maxHeight: "300px",
          }}
        >
          {JSON.stringify(strokes, null, 2)}
        </pre>
      </details>
    </div>
  );
};
