import { useState } from "react";
import { ReliabilityTab } from "./ReliabilityTab";
import { RdpReliabilityTab } from "./RdpReliabilityTab";

export const TestTab = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    "reliability" | "rdp_reliability" | "stability"
  >("reliability");

  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "20px",
          borderBottom: "1px solid #ddd",
          paddingBottom: "10px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => setActiveSubTab("reliability")}
          style={{
            padding: "10px 20px",
            background: activeSubTab === "reliability" ? "#2196F3" : "#f0f0f0",
            color: activeSubTab === "reliability" ? "white" : "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: activeSubTab === "reliability" ? "bold" : "normal",
          }}
        >
          알고리즘 종류별 테스트
        </button>
        <button
          onClick={() => setActiveSubTab("rdp_reliability")}
          style={{
            padding: "10px 20px",
            background:
              activeSubTab === "rdp_reliability" ? "#2196F3" : "#f0f0f0",
            color: activeSubTab === "rdp_reliability" ? "white" : "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: activeSubTab === "rdp_reliability" ? "bold" : "normal",
          }}
        >
          RDP 적용 조건별 테스트
        </button>
        <button
          onClick={() => setActiveSubTab("stability")}
          style={{
            padding: "10px 20px",
            background: activeSubTab === "stability" ? "#2196F3" : "#f0f0f0",
            color: activeSubTab === "stability" ? "white" : "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: activeSubTab === "stability" ? "bold" : "normal",
          }}
        >
          안정성 테스트 (예정)
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {activeSubTab === "reliability" && <ReliabilityTab />}
        {activeSubTab === "rdp_reliability" && <RdpReliabilityTab />}
        {activeSubTab === "stability" && <div>준비 중입니다.</div>}
      </div>
    </div>
  );
};
