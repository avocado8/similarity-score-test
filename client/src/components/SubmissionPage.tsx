import { useState } from "react";
import { useCanvasDrawing } from "../hooks/useCanvasDrawing";
import { CANVAS_CONFIG, COLOR_MAP } from "../config/canvasConfig";
import { createSubmission } from "../services/submissionService";
import type { Color } from "../config/types";

export const SubmissionPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const {
    canvasRef,
    strokes,
    currentColor,
    setCurrentColor,
    clearCanvas,
    undoStroke,
  } = useCanvasDrawing(CANVAS_CONFIG.width, CANVAS_CONFIG.height);

  // 색상 선택 핸들러
  const handleColorChange = (color: Color) => {
    setCurrentColor(color);
  };

  // 제출 핸들러
  const handleSubmit = async () => {
    if (strokes.length === 0) {
      setSubmitStatus("error");
      setSubmitMessage("그림을 그려주세요.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const result = await createSubmission({
        strokes,
        submitted_by: undefined,
      });

      setSubmitStatus("success");
      setSubmitMessage(
        `제출이 완료되었습니다.
관리자 검수 후 게임 반영 여부가 결정됩니다.`,
      );
      clearCanvas();

      // 3초 후 메시지 자동 사라지기
      setTimeout(() => {
        setSubmitStatus("idle");
        setSubmitMessage("");
      }, 3000);
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage(
        error instanceof Error ? error.message : "제출 중 오류가 발생했습니다.",
      );
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const colors: { name: string; value: Color }[] = [
    { name: "검정", value: COLOR_MAP["black"] },
    { name: "빨강", value: COLOR_MAP["red"] },
    { name: "파랑", value: COLOR_MAP["blue"] },
    { name: "초록", value: COLOR_MAP["green"] },
    { name: "노랑", value: COLOR_MAP["yellow"] },
  ];

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>그림 제출</h1>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        아래 캔버스에 그림을 그리고 제출 버튼을 누르면 그림이 제출됩니다. 그림은
        관리자 검수 후 게임에 반영됩니다.
      </p>

      <div style={{ display: "flex", gap: "40px", marginTop: "20px" }}>
        {/* 캔버스 */}
        <div>
          <h2>그림 그리기</h2>
          <canvas
            ref={canvasRef}
            width={CANVAS_CONFIG.width}
            height={CANVAS_CONFIG.height}
            style={{
              border: "2px solid #333",
              backgroundColor: "white",
              cursor: "crosshair",
            }}
          />

          {/* 컨트롤 */}
          <div style={{ marginTop: "15px" }}>
            {/* 색상 선택 */}
            <div style={{ marginBottom: "20px" }}>
              <strong style={{ display: "block", marginBottom: "8px" }}>
                색상 선택
              </strong>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleColorChange(color.value)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor:
                        currentColor[0] === color.value[0] &&
                        currentColor[1] === color.value[1] &&
                        currentColor[2] === color.value[2]
                          ? "#333"
                          : "white",
                      color:
                        currentColor[0] === color.value[0] &&
                        currentColor[1] === color.value[1] &&
                        currentColor[2] === color.value[2]
                          ? "white"
                          : "#333",
                      border: "2px solid #333",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 500,
                      transition: "all 0.2s",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: "12px",
                        height: "12px",
                        backgroundColor: `rgb(${color.value[0]}, ${color.value[1]}, ${color.value[2]})`,
                        border: "1px solid rgba(0,0,0,0.3)",
                        borderRadius: "2px",
                        marginRight: "6px",
                        verticalAlign: "middle",
                      }}
                    />
                    {color.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 작업 버튼 */}
            <div style={{ marginBottom: "20px" }}>
              <strong style={{ display: "block", marginBottom: "8px" }}>
                작업 도구
              </strong>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={undoStroke}
                  disabled={strokes.length === 0}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    backgroundColor: strokes.length === 0 ? "#ddd" : "#FF9800",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: strokes.length === 0 ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  ↶ 취소
                </button>
              </div>
            </div>

            {/* 전체 지우기 - 위험 작업 섹션 */}
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fff3cd",
                border: "1px solid #ffc107",
                borderRadius: "4px",
              }}
            >
              <strong
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#856404",
                }}
              >
                위험 구역
              </strong>
              <button
                onClick={clearCanvas}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                🗑️ 캔버스 초기화
              </button>
              <p
                style={{
                  margin: "8px 0 0 0",
                  fontSize: "12px",
                  color: "#856404",
                }}
              >
                그려진 모든 내용이 삭제됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 상태 표시 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 스트로크 정보 */}
          <div
            style={{
              padding: "20px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              minWidth: "250px",
            }}
          >
            <h3>그림 정보</h3>
            <p style={{ margin: "10px 0" }}>
              <strong>스트로크 수:</strong> {strokes.length}개
            </p>
            <p style={{ margin: "10px 0", color: "#666", fontSize: "14px" }}>
              그림을 모두 그렸으면 아래 제출 버튼을 누르세요.
            </p>
          </div>

          {/* 제출 버튼 및 상태 메시지 */}
          <div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || strokes.length === 0}
              style={{
                width: "100%",
                padding: "12px 24px",
                backgroundColor:
                  isSubmitting || strokes.length === 0 ? "#ccc" : "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor:
                  isSubmitting || strokes.length === 0
                    ? "not-allowed"
                    : "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              {isSubmitting ? "제출 중..." : "제출"}
            </button>

            {/* 상태 메시지 */}
            {submitMessage && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "12px",
                  borderRadius: "4px",
                  backgroundColor:
                    submitStatus === "success" ? "#d4edda" : "#f8d7da",
                  color: submitStatus === "success" ? "#155724" : "#721c24",
                  border: `1px solid ${
                    submitStatus === "success" ? "#c3e6cb" : "#f5c6cb"
                  }`,
                  fontSize: "14px",
                }}
              >
                {submitMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
