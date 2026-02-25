import { useState } from "react";
import type { RdpBenchmarkResults } from "../../algorithm/test/rdpRunner";
import { RDP_EPSILONS } from "../../algorithm/test/rdpRunner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ThresholdMode = "NO_RDP_MEAN" | "NO_RDP_MEDIAN" | "CUSTOM";

const CHART_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#d0ed57",
];

const getColorForVersion = (version: string) => {
  if (version === "no_rdp") return "#444444"; // Dark gray for baseline
  const epsilonStr = version.replace("rdp_", "");
  const epsilon = parseFloat(epsilonStr);
  const idx = RDP_EPSILONS.indexOf(epsilon);
  if (idx !== -1) return CHART_COLORS[idx % CHART_COLORS.length];
  return "#000";
};

export const RdpReliabilityAnalysis = ({
  results,
}: {
  results: RdpBenchmarkResults;
}) => {
  const [thresholdMode, setThresholdMode] =
    useState<ThresholdMode>("NO_RDP_MEAN");
  const [customThreshold, setCustomThreshold] = useState<number>(80);

  if (!results || Object.keys(results).length === 0) return null;

  const versions = Object.keys(results);
  const firstVersion = versions[0];
  if (!results[firstVersion]) return null;

  // 1개 버전에 대한 데이터 (AUROC 차트용)
  const renderAUROCChart = (version: string) => {
    const data = results[version].map((res) => ({
      name: `Prompt ${res.promptIndex}`,
      "A1 vs A2": Number((res.auroc.A1_vs_A2 * 100).toFixed(2)),
      "A1 vs B": Number((res.auroc.A1_vs_B * 100).toFixed(2)),
      "A1 vs A2+B": Number((res.auroc.A1_vs_A2B * 100).toFixed(2)),
    }));

    return (
      <div
        key={version}
        style={{
          height: "250px",
          marginTop: "10px",
          padding: "10px",
          border: "1px solid #eee",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            fontWeight: "bold",
            marginBottom: "5px",
          }}
        >
          AUROC (%) -{" "}
          {version === "no_rdp"
            ? "No RDP"
            : `RDP (epsilon: ${version.replace("rdp_", "")})`}
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, bottom: 25, left: 0 }}
          >
            <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend wrapperStyle={{ bottom: 0 }} />
            <Line
              type="monotone"
              dataKey="A1 vs A2"
              stroke="#8884d8"
              name="A1 vs A2"
            />
            <Line
              type="monotone"
              dataKey="A1 vs B"
              stroke="#82ca9d"
              name="A1 vs B"
            />
            <Line
              type="monotone"
              dataKey="A1 vs A2+B"
              stroke="#ff7300"
              name="A1 vs A2+B"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderTrendCharts = () => {
    return results[firstVersion].map((_, idx) => {
      // Build data points for each version in this prompt
      const data = versions.map((v) => {
        const vRes = results[v][idx];
        return {
          version: v === "no_rdp" ? "No RDP" : v.replace("rdp_", ""),
          A1: Number(vRes.stats.A1.mean.toFixed(2)),
          A2: Number(vRes.stats.A2.mean.toFixed(2)),
          B: Number(vRes.stats.B.mean.toFixed(2)),
        };
      });

      return (
        <div
          key={idx}
          style={{
            marginBottom: "20px",
            borderBottom: "1px dashed #eee",
            paddingBottom: "15px",
          }}
        >
          <h5 style={{ margin: "0 0 10px 0", color: "#333" }}>
            Prompt #{results[firstVersion][idx].promptIndex} 실험 결과
          </h5>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 30, bottom: 5, left: -10 }}
              >
                <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                <XAxis dataKey="version" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="A1"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="A1 Mean"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="A2"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="A2 Mean"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="B"
                  stroke="#ff7300"
                  strokeWidth={2}
                  name="B Mean"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    });
  };

  const getThreshold = (promptIdx: number) => {
    if (thresholdMode === "NO_RDP_MEAN")
      return results["no_rdp"]?.[promptIdx]?.stats.A1.mean || 0;
    if (thresholdMode === "NO_RDP_MEDIAN")
      return results["no_rdp"]?.[promptIdx]?.stats.A1.median || 0;
    return customThreshold;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      {/* 1. AUROC Chart Section */}
      <div
        style={{
          padding: "15px",
          background: "white",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      >
        <h4 style={{ margin: "0 0 10px 0" }}>
          1. 모델 분류 능력 (AUROC Curve 요약)
        </h4>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
          값이 100%에 가까울수록 A1 집단을 완벽하게 분리해냄을 의미합니다.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          {versions.map((v) => renderAUROCChart(v))}
        </div>
      </div>

      {/* 2. Version Trend Charts Section */}
      <div
        style={{
          padding: "15px",
          background: "white",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      >
        <h4 style={{ margin: "0 0 10px 0" }}>
          2. 조건별 평균 유사도 점수 추이
        </h4>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
          각 프롬프트 실험에 대해 설정된 조건에 따른 A1, A2, B 그룹의 평균 점수
          변화를 보여줍니다.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {renderTrendCharts()}
        </div>
      </div>

      {/* 3. Outlier Analysis Section */}
      <div
        style={{
          padding: "15px",
          background: "white",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      >
        <h4 style={{ margin: "0 0 10px 0" }}>3. 이상치 (Outlier) 개수 분석</h4>

        <div
          style={{
            background: "#f0f8ff",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >
          <span style={{ fontWeight: "bold", fontSize: "14px" }}>
            이상치 판별 임계값 기준 (B그룹 중 임계값 초과):
          </span>
          <select
            value={thresholdMode}
            onChange={(e) => setThresholdMode(e.target.value as ThresholdMode)}
            style={{ padding: "5px" }}
          >
            <option value="NO_RDP_MEAN">No RDP 조건 A1 평균값</option>
            <option value="NO_RDP_MEDIAN">No RDP 조건 A1 중앙값</option>
            <option value="CUSTOM">수동 입력 점수</option>
          </select>
          {thresholdMode === "CUSTOM" && (
            <input
              type="number"
              value={customThreshold}
              onChange={(e) => setCustomThreshold(Number(e.target.value))}
              style={{ width: "80px", padding: "5px" }}
              min={0}
              max={100}
            />
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
              textAlign: "center",
              minWidth: "800px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #ddd",
                  background: "#f9f9f9",
                }}
              >
                <th style={{ padding: "10px", minWidth: "100px" }}>프롬프트</th>
                <th style={{ padding: "10px", minWidth: "120px" }}>
                  적용 임계값
                </th>
                {versions.map((v) => (
                  <th
                    key={v}
                    style={{ padding: "10px", color: getColorForVersion(v) }}
                  >
                    {v === "no_rdp"
                      ? "No RDP"
                      : `RDP (${v.replace("rdp_", "")})`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results[firstVersion].map((baseRes, i) => {
                const threshold = getThreshold(i);

                return (
                  <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px", fontWeight: "bold" }}>
                      Prompt #{baseRes.promptIndex}
                    </td>
                    <td style={{ padding: "10px", color: "#666" }}>
                      {thresholdMode === "CUSTOM"
                        ? `${threshold}점 (고정)`
                        : `${threshold.toFixed(1)}점`}
                    </td>
                    {versions.map((v) => {
                      const vRes = results[v][i];
                      const outCount = vRes.scores.B.filter(
                        (s) => s > threshold,
                      ).length;
                      const totalB = vRes.scores.B.length || 1;

                      return (
                        <td key={v} style={{ padding: "10px" }}>
                          <span
                            style={{
                              color: outCount > 0 ? "red" : "green",
                              fontWeight: outCount > 0 ? "bold" : "normal",
                            }}
                          >
                            {outCount} 건
                          </span>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#999",
                              marginLeft: "5px",
                              display: "block",
                            }}
                          >
                            ({((outCount / totalB) * 100).toFixed(1)}%)
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Computation Time Analysis Section */}
      <div
        style={{
          padding: "15px",
          background: "white",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      >
        <h4 style={{ margin: "0 0 10px 0" }}>
          4. 결괏값 생성 소요 시간 비교 (전체 프롬프트 처리 기준)
        </h4>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
          각 엡실론별 전체 데이터셋(A1, A2, B) 실행에 소요된 총시간을 RDP
          처리시간과 유사도 계산 시간으로 구분하여 제공합니다.
        </p>
        <div style={{ height: "350px", width: "100%", marginTop: "10px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={versions.map((v) => {
                let sumTotal = 0;
                let sumRdp = 0;
                results[v].forEach((res) => {
                  sumTotal +=
                    res.computeTimeMs.A1.total +
                    res.computeTimeMs.A2.total +
                    res.computeTimeMs.B.total;
                  sumRdp +=
                    res.computeTimeMs.A1.rdp +
                    res.computeTimeMs.A2.rdp +
                    res.computeTimeMs.B.rdp;
                });
                return {
                  version: v === "no_rdp" ? "No RDP" : v.replace("rdp_", ""),
                  "유사도 계산 (ms)": Number((sumTotal - sumRdp).toFixed(1)),
                  "RDP 처리 (ms)": Number(sumRdp.toFixed(1)),
                };
              })}
              margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
            >
              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
              <XAxis dataKey="version" />
              <YAxis />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Legend />
              <Bar dataKey="RDP 처리 (ms)" stackId="a" fill="#8884d8" />
              <Bar dataKey="유사도 계산 (ms)" stackId="a" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
