import type { RdpBenchmarkResults } from "../../algorithm/test/rdpRunner";

export const RdpReliabilityResults = ({
  results,
}: {
  results: RdpBenchmarkResults;
}) => {
  if (!results || Object.keys(results).length === 0) return null;

  const versions = Object.keys(results);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {versions.map((version) => (
        <div
          key={version}
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "15px",
            background: "white",
          }}
        >
          <h4
            style={{
              margin: "0 0 15px 0",
              color: "#333",
              borderBottom: "2px solid #2196F3",
              paddingBottom: "5px",
              display: "inline-block",
            }}
          >
            적용 조건:{" "}
            {version === "no_rdp"
              ? "RDP 미적용 (no_rdp)"
              : `RDP 적용 (epsilon: ${version.replace("rdp_", "")})`}
          </h4>

          {results[version].map((res, i) => (
            <div
              key={i}
              style={{
                marginBottom: "20px",
                padding: "10px",
                background: "#f8f9fa",
                borderRadius: "6px",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "10px",
                  color: "#555",
                }}
              >
                Prompt #{res.promptIndex} 실험 결과
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                  textAlign: "right",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #ccc",
                      background: "#f1f1f1",
                    }}
                  >
                    <th style={{ padding: "8px", textAlign: "left" }}>
                      데이터 세트
                    </th>
                    <th style={{ padding: "8px" }}>평균 (Mean)</th>
                    <th style={{ padding: "8px" }}>중앙값 (Median)</th>
                    <th style={{ padding: "8px" }}>최소 (Min)</th>
                    <th style={{ padding: "8px" }}>최대 (Max)</th>
                  </tr>
                </thead>
                <tbody>
                  {(["A1", "A2", "B"] as const).map((label) => {
                    const stats = res.stats[label];
                    return (
                      <tr
                        key={label}
                        style={{ borderBottom: "1px solid #eee" }}
                      >
                        <td
                          style={{
                            padding: "8px",
                            textAlign: "left",
                            fontWeight: "bold",
                          }}
                        >
                          {label}
                        </td>
                        <td style={{ padding: "8px" }}>
                          {stats.mean.toFixed(2)}
                        </td>
                        <td style={{ padding: "8px" }}>
                          {stats.median.toFixed(2)}
                        </td>
                        <td style={{ padding: "8px" }}>
                          {stats.min.toFixed(2)}
                        </td>
                        <td style={{ padding: "8px" }}>
                          {stats.max.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
