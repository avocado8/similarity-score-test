import type { SimulationResult } from "../../config/types";

interface Props {
  result: SimulationResult | null;
  onHoverMatch: (index1: number | null, index2: number | null) => void;
}

export const ResultPanel = ({ result, onHoverMatch }: Props) => {
  if (!result) {
    return (
      <div style={{ padding: "10px", color: "#999" }}>
        결과가 여기에 표시됩니다.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100%", gap: "20px" }}>
      {/* Score Overview */}
      <div style={{ flex: 1 }}>
        <h2
          style={{ fontSize: "2rem", color: "#2196F3", margin: "0 0 10px 0" }}
        >
          {result.similarity.toFixed(1)}점
        </h2>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: "5px" }}>개수 점수</td>
              <td style={{ fontWeight: "bold", textAlign: "right" }}>
                {result.strokeCountSimilarity.toFixed(1)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "5px" }}>스트로크 일치</td>
              <td style={{ fontWeight: "bold", textAlign: "right" }}>
                {result.strokeMatchSimilarity.toFixed(1)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "5px" }}>형태 점수</td>
              <td style={{ fontWeight: "bold", textAlign: "right" }}>
                {result.shapeSimilarity.toFixed(1)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "5px" }}>밀도 점수</td>
              <td style={{ fontWeight: "bold", textAlign: "right" }}>
                {result.densityBias?.toFixed(1)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "5px" }}>잉크 길이 비율</td>
              <td
                style={{
                  fontWeight: "bold",
                  textAlign: "right",
                  color:
                    (result.inkLengthRatio ?? 0) > 1.5 ? "orange" : "inherit",
                }}
              >
                {result.inkLengthRatio?.toFixed(2)}x
              </td>
            </tr>
            <tr>
              <td style={{ padding: "5px" }}>스트로크 매칭 패널티</td>
              <td style={{ fontWeight: "bold", textAlign: "right" }}>
                {result.getPenalty ? "true" : "false"}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "5px" }}>페널티 점수</td>
              <td
                style={{ fontWeight: "bold", textAlign: "right", color: "red" }}
              >
                {result.penaltyPoints?.toFixed(1)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Detailed Matches */}
      <div
        style={{
          flex: 2,
          overflowY: "auto",
          borderLeft: "1px solid #eee",
          paddingLeft: "10px",
        }}
      >
        <h4>상세 매칭 정보 ({result.details.strokeMatch.matches.length}쌍)</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {result.details.strokeMatch.matches.map((match, idx) => (
            <div
              key={idx}
              onMouseEnter={() => onHoverMatch(match.index1, match.index2)}
              onMouseLeave={() => onHoverMatch(null, null)}
              style={{
                padding: "5px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                backgroundColor: "#f9f9f9",
                fontSize: "0.9em",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "bold",
                }}
              >
                <span>
                  #{match.index1} (제시) ↔ #{match.index2} (내그림)
                </span>
                <span
                  style={{
                    color:
                      match.score > 80
                        ? "green"
                        : match.score > 50
                          ? "orange"
                          : "red",
                  }}
                >
                  {match.score.toFixed(1)}점
                </span>
              </div>
              <div
                style={{ fontSize: "0.8em", color: "#666", marginTop: "3px" }}
              >
                길이: {match.subScores.length.toFixed(2)} | 방향:{" "}
                {match.subScores.direction.toFixed(2)} | 위치:{" "}
                {match.subScores.position.toFixed(2)} | 색상:{" "}
                {match.subScores.color.toFixed(2)}
              </div>
            </div>
          ))}
          {result.details.strokeMatch.unmatched.length > 0 && (
            <div style={{ padding: "5px", color: "red", fontSize: "0.9em" }}>
              매칭되지 않은 내 그림 스트로크:{" "}
              {result.details.strokeMatch.unmatched.join(", ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
