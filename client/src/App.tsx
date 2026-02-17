import { useState } from "react";
import { DrawingGame } from "./components/DrawingGame";
import { DataPreview } from "./components/DataPreview";
import { LabPage } from "./lab/LabPage";
import "./App.css";

function App() {
  const [view, setView] = useState<"game" | "preview" | "lab">("game");

  return (
    <>
      <>
        <div
          style={{
            padding: "10px 20px",
            borderBottom: "1px solid #ddd",
            background: "#f9f9f9",
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            onClick={() => setView("game")}
            style={{
              fontWeight: view === "game" ? "bold" : "normal",
              padding: "8px 16px",
              backgroundColor: view === "game" ? "#2196F3" : "white",
              color: view === "game" ? "white" : "black",
              border: "1px solid #ccc",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            게임
          </button>
          <button
            onClick={() => setView("preview")}
            style={{
              fontWeight: view === "preview" ? "bold" : "normal",
              padding: "8px 16px",
              backgroundColor: view === "preview" ? "#2196F3" : "white",
              color: view === "preview" ? "white" : "black",
              border: "1px solid #ccc",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            데이터 미리보기
          </button>
          <button
            onClick={() => setView("lab")}
            style={{
              fontWeight: view === "lab" ? "bold" : "normal",
              padding: "8px 16px",
              backgroundColor: view === "lab" ? "#2196F3" : "white",
              color: view === "lab" ? "white" : "black",
              border: "1px solid #ccc",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            실험실
          </button>
        </div>
        {view === "game" && <DrawingGame />}
        {view === "preview" && <DataPreview />}
        {view === "lab" && <LabPage />}
      </>
    </>
  );
}

export default App;
