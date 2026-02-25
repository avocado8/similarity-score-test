import { useState } from "react";
import { DataTab } from "./tabs/DataTab";
import { SingleCaseTab } from "./tabs/SingleCaseTab";
import { TestSetBuilderTab } from "./tabs/TestSetBuilderTab";
import { TestTab } from "./tabs/TestTab";
import { PreprocessingTab } from "./tabs/PreprocessingTab";

type Tab = "data" | "single" | "human" | "test" | "builder" | "preprocessing";

export const LabPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("builder");

  const renderTabContent = () => {
    switch (activeTab) {
      case "data":
        return <DataTab />;
      case "single":
        return <SingleCaseTab />;
      case "builder":
        return <TestSetBuilderTab />;
      case "test":
        return <TestTab />;
      case "preprocessing":
        return <PreprocessingTab />;
      case "human":
        return <div>휴먼 평가 (준비중)</div>;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header
        style={{
          padding: "10px 20px",
          borderBottom: "1px solid #ddd",
          backgroundColor: "#f8f9fa",
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <h2 style={{ margin: 0 }}>🔬 실험실</h2>
        <nav style={{ display: "flex", gap: "5px" }}>
          <TabButton
            label="테스트 셋 빌더"
            active={activeTab === "builder"}
            onClick={() => setActiveTab("builder")}
          />
          <TabButton
            label="데이터"
            active={activeTab === "data"}
            onClick={() => setActiveTab("data")}
          />
          <TabButton
            label="단일 케이스"
            active={activeTab === "single"}
            onClick={() => setActiveTab("single")}
          />
          <TabButton
            label="전처리"
            active={activeTab === "preprocessing"}
            onClick={() => setActiveTab("preprocessing")}
          />
          <TabButton
            label="테스트 (벤치마크)"
            active={activeTab === "test"}
            onClick={() => setActiveTab("test")}
          />
        </nav>
      </header>
      <main style={{ flex: 1, overflow: "hidden" }}>{renderTabContent()}</main>
    </div>
  );
};

const TabButton = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 16px",
      border: "none",
      background: active ? "#2196F3" : "transparent",
      color: active ? "white" : "#333",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: active ? "bold" : "normal",
    }}
  >
    {label}
  </button>
);
