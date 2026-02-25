import { useEffect, useRef, useState } from "react";
import { drawStrokes } from "../../utils/drawStrokes";
import { addNoiseToStroke } from "../../utils/test/addNoiseToStroke";
import { rdpStroke } from "../../utils/test/rdp";
import { CANVAS_CONFIG } from "../../config/canvasConfig";
import type { Stroke } from "../../config/types";

export const PreprocessingTab = () => {
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const noisedCanvasRef = useRef<HTMLCanvasElement>(null);

  const [inputText, setInputText] = useState("");
  const [originalStrokes, setOriginalStrokes] = useState<Stroke[]>([]);
  const [noisedStrokes, setNoisedStrokes] = useState<Stroke[]>([]);

  const [noiseConfig, setNoiseConfig] = useState({
    step: 2,
    jitterAmpPx: 0.8,
    jitterOffset: 0.4,
  });

  const [rdpEpsilon, setRdpEpsilon] = useState(2);

  const drawToCanvas = (
    canvas: HTMLCanvasElement | null,
    strokes: Stroke[],
  ) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, CANVAS_CONFIG.width, CANVAS_CONFIG.height);

    drawStrokes(ctx, strokes, CANVAS_CONFIG.width, CANVAS_CONFIG.height, {
      highlightIndices: [],
      highlightColor: "red",
      opacity: 1.0,
    });
  };

  // Draw original strokes
  useEffect(() => {
    drawToCanvas(originalCanvasRef.current, originalStrokes);
  }, [originalStrokes]);

  // Draw noised strokes
  useEffect(() => {
    drawToCanvas(noisedCanvasRef.current, noisedStrokes);
  }, [noisedStrokes]);

  const handleLoadInput = () => {
    try {
      const parsed = JSON.parse(inputText);
      if (Array.isArray(parsed)) {
        const loaded: Stroke[] = parsed.map(
          (s: any): Stroke => ({
            points: [s.points[0], s.points[1]] as [number[], number[]],
            color: s.color as Stroke["color"],
          }),
        );
        setOriginalStrokes(loaded);
        setNoisedStrokes([]); // Reset noised strokes on new load
      } else {
        alert("배열 형식이 아닙니다.");
      }
    } catch (e) {
      alert("JSON 파싱 에러");
    }
  };

  const handleApplyNoise = () => {
    if (originalStrokes.length === 0) {
      alert("먼저 원본 스트로크 데이터를 입력해주세요.");
      return;
    }

    const newStrokes = originalStrokes.map((stroke) =>
      addNoiseToStroke({
        stroke,
        noiseConfig: {
          step: noiseConfig.step,
          jitter: {
            ampPx: noiseConfig.jitterAmpPx,
            offset: noiseConfig.jitterOffset,
          },
        },
      }),
    );
    setNoisedStrokes(newStrokes);
  };

  const handleApplyRdp = () => {
    if (originalStrokes.length === 0) {
      alert("먼저 원본 스트로크 데이터를 입력해주세요.");
      return;
    }

    const newStrokes = originalStrokes.map((stroke) =>
      rdpStroke(stroke, rdpEpsilon),
    );
    setNoisedStrokes(newStrokes);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "20px",
        gap: "20px",
      }}
    >
      <div style={{ display: "flex", gap: "20px", height: "500px" }}>
        {/* Left: Original Target */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <h3>Original (원본)</h3>
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
              ref={originalCanvasRef}
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

        {/* Center: Controls */}
        <div
          style={{
            width: "300px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            <h4>노이즈 설정</h4>
            <div style={{ marginBottom: "10px" }}>
              <label>Step ({noiseConfig.step})</label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={noiseConfig.step}
                onChange={(e) =>
                  setNoiseConfig({
                    ...noiseConfig,
                    step: parseFloat(e.target.value),
                  })
                }
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label>Jitter Amp ({noiseConfig.jitterAmpPx})</label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={noiseConfig.jitterAmpPx}
                onChange={(e) =>
                  setNoiseConfig({
                    ...noiseConfig,
                    jitterAmpPx: parseFloat(e.target.value),
                  })
                }
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label>Jitter Offset ({noiseConfig.jitterOffset})</label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={noiseConfig.jitterOffset}
                onChange={(e) =>
                  setNoiseConfig({
                    ...noiseConfig,
                    jitterOffset: parseFloat(e.target.value),
                  })
                }
                style={{ width: "100%" }}
              />
            </div>
            <button
              onClick={handleApplyNoise}
              style={{
                width: "100%",
                padding: "10px",
                background: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              노이즈 추가 적용
            </button>
          </div>

          <div
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            <h4>RDP 단순화 설정</h4>
            <div style={{ marginBottom: "10px" }}>
              <label>Epsilon ({rdpEpsilon})</label>
              <input
                type="range"
                min="0.1"
                max="20"
                step="0.1"
                value={rdpEpsilon}
                onChange={(e) => setRdpEpsilon(parseFloat(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>
            <button
              onClick={handleApplyRdp}
              style={{
                width: "100%",
                padding: "10px",
                background: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              RDP 단순화 적용
            </button>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <h4>데이터 입력 (JSON)</h4>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="여기에 JSON 배열을 붙여넣으세요..."
              style={{
                width: "100%",
                height: "150px",
                padding: "8px",
                resize: "none",
              }}
            />
            <button
              onClick={handleLoadInput}
              style={{ padding: "8px", cursor: "pointer" }}
            >
              불러오기
            </button>
          </div>
        </div>

        {/* Right: Processed Target */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <h3>Processed (노이즈 / RDP 적용)</h3>
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
              ref={noisedCanvasRef}
              width={CANVAS_CONFIG.width}
              height={CANVAS_CONFIG.height}
              style={{
                background: "white",
                maxWidth: "100%",
                maxHeight: "100%",
              }}
            />
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <h4>변환된 데이터 (JSON)</h4>
            <textarea
              readOnly
              value={
                noisedStrokes.length > 0
                  ? JSON.stringify(noisedStrokes, null, 2)
                  : ""
              }
              placeholder="여기에 변환된 데이터가 표시됩니다..."
              style={{
                width: "100%",
                height: "150px",
                padding: "8px",
                resize: "none",
                backgroundColor: "#f5f5f5",
              }}
            />
            <button
              onClick={() => {
                if (noisedStrokes.length > 0) {
                  navigator.clipboard.writeText(
                    JSON.stringify(noisedStrokes, null, 2),
                  );
                  alert("복사되었습니다.");
                }
              }}
              style={{ padding: "8px", cursor: "pointer" }}
            >
              복사하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
