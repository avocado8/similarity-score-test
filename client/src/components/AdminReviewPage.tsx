import { useEffect, useState } from "react";
import { getSubmissions, getSubmissionCount } from "../services/submissionService";
import { SubmissionCard } from "./SubmissionCard";
import type { Submission } from "../types/submission";

export const AdminReviewPage = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [error, setError] = useState("");

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [pendingData, pending, approved, rejected] = await Promise.all([
        getSubmissions({ status: "pending" }),
        getSubmissionCount("pending"),
        getSubmissionCount("approved"),
        getSubmissionCount("rejected"),
      ]);
      setSubmissions(pendingData);
      setPendingCount(pending);
      setApprovedCount(approved);
      setRejectedCount(rejected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 중 오류가 발생했습니다.");
      console.error("Error loading submissions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (id: string, status: "approved" | "rejected") => {
    // 제출 목록에서 제거 (status가 pending이 아니므로)
    setSubmissions((prev) => prev.filter((sub) => sub.id !== id));

    // 카운트 업데이트
    setPendingCount((prev) => Math.max(0, prev - 1));
    if (status === "approved") {
      setApprovedCount((prev) => prev + 1);
    } else {
      setRejectedCount((prev) => prev + 1);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>관리자 - 제출 검수</h1>

      {/* 통계 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fff3cd",
            borderRadius: "8px",
            border: "1px solid #ffc107",
          }}
        >
          <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#856404" }}>
            <strong>승인 대기</strong>
          </p>
          <p style={{ margin: "0", fontSize: "28px", fontWeight: "bold", color: "#856404" }}>
            {pendingCount}
          </p>
        </div>
        <div
          style={{
            padding: "16px",
            backgroundColor: "#d4edda",
            borderRadius: "8px",
            border: "1px solid #28a745",
          }}
        >
          <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#155724" }}>
            <strong>승인됨</strong>
          </p>
          <p style={{ margin: "0", fontSize: "28px", fontWeight: "bold", color: "#155724" }}>
            {approvedCount}
          </p>
        </div>
        <div
          style={{
            padding: "16px",
            backgroundColor: "#f8d7da",
            borderRadius: "8px",
            border: "1px solid #f5c6cb",
          }}
        >
          <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#721c24" }}>
            <strong>반려됨</strong>
          </p>
          <p style={{ margin: "0", fontSize: "28px", fontWeight: "bold", color: "#721c24" }}>
            {rejectedCount}
          </p>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          오류: {error}
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          로딩 중...
        </div>
      )}

      {/* 제출 목록 */}
      {!isLoading && submissions.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            color: "#999",
          }}
        >
          <p>검수 대기 중인 제출이 없습니다.</p>
          <button
            onClick={loadData}
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            새로고침
          </button>
        </div>
      )}

      {!isLoading && submissions.length > 0 && (
        <div>
          <div
            style={{
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ margin: "0" }}>
              승인 대기 중 ({submissions.length}개)
            </h2>
            <button
              onClick={loadData}
              style={{
                padding: "8px 16px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              새로고침
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
            }}
          >
            {submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
