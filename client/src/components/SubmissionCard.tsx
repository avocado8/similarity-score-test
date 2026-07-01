import { useEffect, useRef, useState } from "react";
import { drawStrokes } from "../utils/drawStrokes";
import { CANVAS_CONFIG } from "../config/canvasConfig";
import { updateSubmissionStatus } from "../services/submissionService";
import type { Submission } from "../types/submission";

interface SubmissionCardProps {
  submission: Submission;
  onStatusChange: (id: string, status: "approved" | "rejected") => void;
}

export const SubmissionCard = ({ submission, onStatusChange }: SubmissionCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  // 캔버스에 그림 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 배경을 흰색으로
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, CANVAS_CONFIG.width, CANVAS_CONFIG.height);

    // 스트로크 그리기
    drawStrokes(ctx, submission.strokes, CANVAS_CONFIG.width, CANVAS_CONFIG.height);
  }, [submission.strokes]);

  const handleApprove = async () => {
    setIsUpdating(true);
    try {
      await updateSubmissionStatus(submission.id, {
        status: "approved",
      });
      onStatusChange(submission.id, "approved");
    } catch (error) {
      console.error("Failed to approve:", error);
      alert("승인 중 오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("반려 사유를 입력해주세요.");
      return;
    }

    setIsUpdating(true);
    try {
      await updateSubmissionStatus(submission.id, {
        status: "rejected",
        rejected_reason: rejectionReason,
      });
      onStatusChange(submission.id, "rejected");
    } catch (error) {
      console.error("Failed to reject:", error);
      alert("반려 중 오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
      setRejectionReason("");
      setShowRejectInput(false);
    }
  };

  const createdAt = new Date(submission.created_at);
  const formattedTime = createdAt.toLocaleString("ko-KR");

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        backgroundColor: "#fafafa",
        marginBottom: "16px",
      }}
    >
      {/* 헤더 정보 */}
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#666" }}>
            <strong>ID:</strong> {submission.id.slice(0, 8)}...
          </p>
          <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#666" }}>
            <strong>제출 시간:</strong> {formattedTime}
          </p>
          <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>
            <strong>스트로크 수:</strong> {submission.strokes.length}개
          </p>
        </div>
        <div style={{ fontSize: "12px", color: "#999" }}>
          Status: <span style={{ fontWeight: "bold" }}>{submission.status}</span>
        </div>
      </div>

      {/* 캔버스 */}
      <div style={{ marginBottom: "16px" }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_CONFIG.width}
          height={CANVAS_CONFIG.height}
          style={{
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "white",
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
      </div>

      {/* 액션 버튼 */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <button
          onClick={handleApprove}
          disabled={isUpdating}
          style={{
            flex: 1,
            padding: "10px",
            backgroundColor: isUpdating ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isUpdating ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {isUpdating ? "처리 중..." : "✓ 승인"}
        </button>
        <button
          onClick={() => setShowRejectInput(!showRejectInput)}
          disabled={isUpdating}
          style={{
            flex: 1,
            padding: "10px",
            backgroundColor: isUpdating ? "#ccc" : "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isUpdating ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          ✕ 반려
        </button>
      </div>

      {/* 반려 사유 입력 */}
      {showRejectInput && (
        <div style={{ marginTop: "8px", padding: "12px", backgroundColor: "white", borderRadius: "4px", border: "1px solid #f44336" }}>
          <p style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: 600 }}>반려 사유</p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="반려 사유를 입력해주세요 (예: 그림이 불완전함, 부적절한 내용 등)"
            style={{
              width: "100%",
              minHeight: "60px",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontFamily: "Arial, sans-serif",
              fontSize: "13px",
              boxSizing: "border-box",
              marginBottom: "8px",
            }}
          />
          <button
            onClick={handleReject}
            disabled={isUpdating || !rejectionReason.trim()}
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: !rejectionReason.trim() || isUpdating ? "#ccc" : "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: !rejectionReason.trim() || isUpdating ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            반려 확인
          </button>
        </div>
      )}
    </div>
  );
};
