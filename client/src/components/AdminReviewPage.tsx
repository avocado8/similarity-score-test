import { useEffect, useMemo, useState } from "react";
import {
  getSubmissions,
  getSubmissionCount,
  getApprovedSubmissions,
  deleteSubmission,
} from "../services/submissionService";
import { SubmissionCard } from "./SubmissionCard";
import type { Submission } from "../types/submission";

export const AdminReviewPage = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [approvedSubmissions, setApprovedSubmissions] = useState<Submission[]>(
    [],
  );
  const [rejectedSubmissions, setRejectedSubmissions] = useState<Submission[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setError("");

    if (!hasLoadedOnce) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const [
        pendingData,
        approvedData,
        rejectedData,
        pending,
        approved,
        rejected,
      ] = await Promise.all([
        getSubmissions({ status: "pending" }),
        getSubmissions({ status: "approved" }),
        getSubmissions({ status: "rejected" }),
        getSubmissionCount("pending"),
        getSubmissionCount("approved"),
        getSubmissionCount("rejected"),
      ]);
      setSubmissions(pendingData);
      setApprovedSubmissions(approvedData);
      setRejectedSubmissions(rejectedData);
      setPendingCount(pending);
      setApprovedCount(approved);
      setRejectedCount(rejected);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "데이터 로드 중 오류가 발생했습니다.",
      );
      console.error("Error loading submissions:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setHasLoadedOnce(true);
    }
  };

  const handleStatusChange = (
    id: string,
    status: "approved" | "rejected",
    source: "pending" | "approved" = "pending",
  ) => {
    if (source === "pending") {
      const moved = submissions.find((sub) => sub.id === id);
      if (!moved) return;

      setSubmissions((prev) => prev.filter((sub) => sub.id !== id));
      if (status === "approved") {
        setApprovedSubmissions((prevApproved) => [moved, ...prevApproved]);
        setApprovedCount((prevCount) => prevCount + 1);
      } else {
        setRejectedSubmissions((prevRejected) => [moved, ...prevRejected]);
        setRejectedCount((prevCount) => prevCount + 1);
      }
      setPendingCount((prevCount) => Math.max(0, prevCount - 1));
      return;
    }

    const moved = approvedSubmissions.find((sub) => sub.id === id);
    if (!moved) return;

    setApprovedSubmissions((prev) => prev.filter((sub) => sub.id !== id));
    if (status === "rejected") {
      setRejectedSubmissions((prevRejected) => [moved, ...prevRejected]);
      setRejectedCount((prevCount) => prevCount + 1);
    }
    setApprovedCount((prevCount) => Math.max(0, prevCount - 1));
  };

  const handleReapproveRejected = (id: string) => {
    setRejectedSubmissions((prev) => {
      const moved = prev.find((sub) => sub.id === id);
      if (!moved) return prev;
      setApprovedSubmissions((prevApproved) => [moved, ...prevApproved]);
      setApprovedCount((prevCount) => prevCount + 1);
      setRejectedCount((prevCount) => Math.max(0, prevCount - 1));
      return prev.filter((sub) => sub.id !== id);
    });
  };

  const handleDeleteRejected = async (id: string) => {
    try {
      await deleteSubmission(id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete rejected submission:", error);
      alert("삭제 중 오류가 발생했습니다. 다시 시도해 주세요.");
    }
  };

  const sortSubmissions = (items: Submission[]) =>
    [...items].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  const filteredPendingSubmissions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const base = normalizedSearch
      ? submissions.filter((submission) => {
          const haystack = [
            submission.id,
            submission.note,
            submission.rejected_reason,
            submission.submitted_by,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalizedSearch);
        })
      : submissions;

    return sortSubmissions(base);
  }, [searchTerm, submissions]);

  const filteredApprovedSubmissions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const base = normalizedSearch
      ? approvedSubmissions.filter((submission) => {
          const haystack = [
            submission.id,
            submission.note,
            submission.rejected_reason,
            submission.submitted_by,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalizedSearch);
        })
      : approvedSubmissions;

    return sortSubmissions(base);
  }, [approvedSubmissions, searchTerm]);

  const filteredRejectedSubmissions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const base = normalizedSearch
      ? rejectedSubmissions.filter((submission) => {
          const haystack = [
            submission.id,
            submission.note,
            submission.rejected_reason,
            submission.submitted_by,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalizedSearch);
        })
      : rejectedSubmissions;

    return sortSubmissions(base);
  }, [rejectedSubmissions, searchTerm]);

  // 승인된 데이터 다운로드
  const handleDownloadApproved = async () => {
    try {
      const approved = await getApprovedSubmissions();

      if (approved.length === 0) {
        alert("승인된 제출이 없습니다.");
        return;
      }

      // 다운로드할 데이터 형식 (스트로크만 포함)
      const exportData = approved.map((sub) => ({
        date: new Date(sub.created_at).toISOString().split("T")[0],
        strokes: sub.strokes,
      }));

      // JSON 문자열 생성
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // 다운로드 링크 생성
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `approved-submissions-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`${approved.length}개의 승인된 제출이 다운로드되었습니다.`);
    } catch (error) {
      console.error("Download error:", error);
      alert("다운로드 중 오류가 발생했습니다.");
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
          <p
            style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#856404" }}
          >
            <strong>승인 대기</strong>
          </p>
          <p
            style={{
              margin: "0",
              fontSize: "28px",
              fontWeight: "bold",
              color: "#856404",
            }}
          >
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
          <p
            style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#155724" }}
          >
            <strong>승인됨</strong>
          </p>
          <p
            style={{
              margin: "0",
              fontSize: "28px",
              fontWeight: "bold",
              color: "#155724",
            }}
          >
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
          <p
            style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#721c24" }}
          >
            <strong>반려됨</strong>
          </p>
          <p
            style={{
              margin: "0",
              fontSize: "28px",
              fontWeight: "bold",
              color: "#721c24",
            }}
          >
            {rejectedCount}
          </p>
        </div>
      </div>

      {/* 다운로드 버튼 */}
      {approvedCount > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={handleDownloadApproved}
            style={{
              padding: "12px 24px",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            📥 승인된 데이터 다운로드 ({approvedCount}개)
          </button>
          <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>
            다운로드된 파일을 scripts/ 폴더에 복사 후{" "}
            <code>node scripts/mergePromptStrokes.js</code> 실행
          </p>
        </div>
      )}

      {!isLoading && (
        <div
          style={{
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { key: "all", label: "전체" },
              { key: "pending", label: "대기" },
              { key: "approved", label: "승인" },
              { key: "rejected", label: "반려" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={async () => {
                  setActiveTab(tab.key as typeof activeTab);
                  await loadData();
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: "999px",
                  border:
                    activeTab === tab.key
                      ? "1px solid #2196F3"
                      : "1px solid #ddd",
                  backgroundColor: activeTab === tab.key ? "#eaf5ff" : "white",
                  color: activeTab === tab.key ? "#0b6dc1" : "#333",
                  cursor: "pointer",
                  fontWeight: activeTab === tab.key ? 700 : 400,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="ID, 메모, 반려 사유 검색"
            style={{
              minWidth: "240px",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "14px",
            }}
          />
        </div>
      )}

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
      {!isLoading &&
        (activeTab === "all" || activeTab === "pending") &&
        filteredPendingSubmissions.length === 0 &&
        activeTab === "pending" && (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              color: "#999",
              marginBottom: "24px",
            }}
          >
            <p>조건에 맞는 대기 중인 제출이 없습니다.</p>
          </div>
        )}

      {!isLoading &&
        (activeTab === "all" || activeTab === "pending") &&
        filteredPendingSubmissions.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                marginBottom: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <h2 style={{ margin: "0" }}>
                승인 대기 중 ({submissions.length}개)
              </h2>
              {isRefreshing && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    backgroundColor: "#f5f5f5",
                    padding: "4px 8px",
                    borderRadius: "999px",
                  }}
                >
                  새 데이터 불러오는 중…
                </span>
              )}
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
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              {filteredPendingSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  actionMode="pending"
                  onApprove={(id) =>
                    handleStatusChange(id, "approved", "pending")
                  }
                  onReject={(id) =>
                    handleStatusChange(id, "rejected", "pending")
                  }
                />
              ))}
            </div>
          </div>
        )}

      {!isLoading &&
        (activeTab === "all" || activeTab === "approved") &&
        filteredApprovedSubmissions.length === 0 &&
        activeTab === "approved" && (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              color: "#999",
              marginBottom: "24px",
            }}
          >
            <p>조건에 맞는 승인된 제출이 없습니다.</p>
          </div>
        )}

      {!isLoading &&
        (activeTab === "all" || activeTab === "approved") &&
        filteredApprovedSubmissions.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ marginBottom: "16px", color: "#155724" }}>
              승인 완료 ({approvedSubmissions.length}개)
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              {filteredApprovedSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  actionMode="approved"
                  onApprove={() => Promise.resolve()}
                  onReject={(id) =>
                    handleStatusChange(id, "rejected", "approved")
                  }
                />
              ))}
            </div>
          </div>
        )}

      {!isLoading &&
        (activeTab === "all" || activeTab === "rejected") &&
        filteredRejectedSubmissions.length === 0 &&
        activeTab === "rejected" && (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              color: "#999",
            }}
          >
            <p>조건에 맞는 반려된 제출이 없습니다.</p>
          </div>
        )}

      {!isLoading &&
        (activeTab === "all" || activeTab === "rejected") &&
        filteredRejectedSubmissions.length > 0 && (
          <div>
            <h2 style={{ marginBottom: "16px", color: "#721c24" }}>
              반려 완료 ({rejectedSubmissions.length}개)
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              {filteredRejectedSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  actionMode="rejected"
                  onApprove={handleReapproveRejected}
                  onDelete={handleDeleteRejected}
                />
              ))}
            </div>
          </div>
        )}
    </div>
  );
};
