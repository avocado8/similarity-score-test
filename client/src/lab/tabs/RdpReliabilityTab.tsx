import { useState } from "react";
import type { RdpBenchmarkResults } from "../../algorithm/test/rdpRunner";
import {
  runRdpReliabilityTest,
  NOISE_CONFIG,
} from "../../algorithm/test/rdpRunner";
import { RdpReliabilityResults } from "./RdpReliabilityResults";
import { RdpReliabilityAnalysis } from "./RdpReliabilityAnalysis";

export const RdpReliabilityTab = () => {
  const [category, setCategory] = useState<string>("book");
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<RdpBenchmarkResults | null>(null);

  const handleRunTest = async () => {
    setIsCalculating(true);
    // Allow UI to update and show the loading overlay
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const res = await runRdpReliabilityTest(category);
      setResults(res);
    } catch (e) {
      console.error(e);
      alert("테스트 실행 중 오류가 발생했습니다.");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "400px" }}>
      {/* UI Blocking Overlay */}
      {isCalculating && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255, 255, 255, 0.8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div style={{ fontSize: "24px", marginBottom: "20px" }}>⏳</div>
          <div style={{ fontSize: "18px", fontWeight: "bold" }}>
            계산 중입니다...
          </div>
          <div style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
            프롬프트 및 대상 스트로크에 기본 노이즈(Step {NOISE_CONFIG.step},
            Jitter {NOISE_CONFIG.jitter.ampPx})를 추가한 후 유사도 벤치마크를
            수행 중입니다.
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          padding: "15px",
          background: "#f9f9f9",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 10px 0" }}>
            RDP 적용 여부별 신뢰성 벤치마크
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
            기본 노이즈가 추가된 상태에서 RDP 알고리즘 적용 여부 및
            정도(Epsilon)에 따른 v3 알고리즘 점수의 안정성을 분석합니다.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ padding: "8px", borderRadius: "4px" }}
          >
            <option value="book">Book 카테고리 테스트</option>
            <option value="whale">Whale 카테고리 테스트</option>
          </select>
          <button
            onClick={handleRunTest}
            disabled={isCalculating}
            style={{
              padding: "10px 20px",
              background: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isCalculating ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            테스트 실행
          </button>
        </div>
      </div>

      {results && (
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          <div>
            <h3>테스트 결과 통계 요약</h3>
            <RdpReliabilityResults results={results} />
          </div>

          <div>
            <h3>교차 사건 및 이상치 분석</h3>
            <RdpReliabilityAnalysis results={results} />
          </div>
        </div>
      )}
    </div>
  );
};
