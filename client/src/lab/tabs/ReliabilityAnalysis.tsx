import { useState } from "react";
import type { BenchmarkResults } from "../../algorithm/test/runner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ThresholdMode = "A1_MEAN" | "A1_MEDIAN" | "CUSTOM";

export const ReliabilityAnalysis = ({
  results,
}: {
  results: BenchmarkResults;
}) => {
  const [thresholdMode, setThresholdMode] = useState<ThresholdMode>("A1_MEAN");
  const [customThreshold, setCustomThreshold] = useState<number>(80);

  if (!results) return null;

  // 1개 버전에 대한 데이터 (AUROC 차트용)
  // AUC 시각화용 차트 데이터 (간단하게 프롬프트 인덱스 단위로 ROC 표시)
  const renderAUROCChart = (version: "v1" | "v2" | "v3") => {
    const data = results[version].map((res) => ({
      name: `Prompt ${res.promptIndex}`,
      "A1 vs A2": Number((res.auroc.A1_vs_A2 * 100).toFixed(2)),
      "A1 vs B": Number((res.auroc.A1_vs_B * 100).toFixed(2)),
      "A1 vs A2+B": Number((res.auroc.A1_vs_A2B * 100).toFixed(2)),
    }));

    return (
      <div style={{ height: "250px", marginTop: "10px" }}>
        <div
          style={{
            textAlign: "center",
            fontWeight: "bold",
            marginBottom: "5px",
          }}
        >
          AUROC (%) - {version.toUpperCase()}
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
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
    return results.v1.map((v1Res, i) => {
      const v2Res = results.v2[i];
      const v3Res = results.v3[i];

      const data = [
        {
          version: "v1",
          A1: Number(v1Res.stats.A1.mean.toFixed(2)),
          A2: Number(v1Res.stats.A2.mean.toFixed(2)),
          B: Number(v1Res.stats.B.mean.toFixed(2)),
        },
        {
          version: "v2",
          A1: Number(v2Res.stats.A1.mean.toFixed(2)),
          A2: Number(v2Res.stats.A2.mean.toFixed(2)),
          B: Number(v2Res.stats.B.mean.toFixed(2)),
        },
        {
          version: "v3",
          A1: Number(v3Res.stats.A1.mean.toFixed(2)),
          A2: Number(v3Res.stats.A2.mean.toFixed(2)),
          B: Number(v3Res.stats.B.mean.toFixed(2)),
        },
      ];

      return (
        <div
          key={i}
          style={{
            marginBottom: "20px",
            borderBottom: "1px dashed #eee",
            paddingBottom: "15px",
          }}
        >
          <h5 style={{ margin: "0 0 10px 0", color: "#333" }}>
            Prompt #{v1Res.promptIndex} 실험 결과
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

  const getThreshold = (res: any) => {
    if (thresholdMode === "A1_MEAN") return res.stats.A1.mean;
    if (thresholdMode === "A1_MEDIAN") return res.stats.A1.median;
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
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "20px",
          }}
        >
          {renderAUROCChart("v1")}
          {renderAUROCChart("v2")}
          {renderAUROCChart("v3")}
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
          2. 버전별 평균 유사도 추이 (프롬프트별)
        </h4>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
          각 프롬프트 실험에 대해 v1, v2, v3 알고리즘 버전에 따른 A1, A2, B
          그룹의 평균 점수 변화를 보여줍니다.
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
        <h4 style={{ margin: "0 0 10px 0" }}>3. 이상치 및 교차 사건 분석</h4>

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
            이상치 판별 임계값 기준:
          </span>
          <select
            value={thresholdMode}
            onChange={(e) => setThresholdMode(e.target.value as ThresholdMode)}
            style={{ padding: "5px" }}
          >
            <option value="A1_MEAN">A1 세트 평균값</option>
            <option value="A1_MEDIAN">A1 세트 중앙값</option>
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

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          <thead>
            <tr
              style={{ borderBottom: "2px solid #ddd", background: "#f9f9f9" }}
            >
              <th style={{ padding: "10px" }}>프롬프트</th>
              <th style={{ padding: "10px" }}>적용 임계값</th>
              <th style={{ padding: "10px", color: "#8884d8" }}>
                v1 Outliers (B &gt; Threshold)
              </th>
              <th style={{ padding: "10px", color: "#82ca9d" }}>
                v2 Outliers (B &gt; Threshold)
              </th>
              <th style={{ padding: "10px", color: "#ff7300" }}>
                v3 Outliers (B &gt; Threshold)
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 세 가지 알고리즘의 결과를 프롬프트 단위로 묶어서 표현 */}
            {results.v1.map((v1Res, i) => {
              const v2Res = results.v2[i];
              const v3Res = results.v3[i];

              const t1 = getThreshold(v1Res);
              const t2 = getThreshold(v2Res);
              const t3 = getThreshold(v3Res);

              const out1 = v1Res.scores.B.filter((s) => s > t1).length;
              const out2 = v2Res.scores.B.filter((s) => s > t2).length;
              const out3 = v3Res.scores.B.filter((s) => s > t3).length;

              const totalB = v1Res.scores.B.length || 1; // prevent divide by zero

              return (
                <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "10px", fontWeight: "bold" }}>
                    Prompt #{v1Res.promptIndex}
                  </td>
                  <td style={{ padding: "10px", color: "#666" }}>
                    {thresholdMode === "CUSTOM"
                      ? `${t1}점 (고정)`
                      : `v1:${t1.toFixed(1)}, v2:${t2.toFixed(1)}, v3:${t3.toFixed(1)}`}
                  </td>
                  <td style={{ padding: "10px" }}>
                    <span
                      style={{
                        color: out1 > 0 ? "red" : "green",
                        fontWeight: out1 > 0 ? "bold" : "normal",
                      }}
                    >
                      {out1} 건
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#999",
                        marginLeft: "5px",
                      }}
                    >
                      ({((out1 / totalB) * 100).toFixed(1)}%)
                    </span>
                  </td>
                  <td style={{ padding: "10px" }}>
                    <span
                      style={{
                        color: out2 > 0 ? "red" : "green",
                        fontWeight: out2 > 0 ? "bold" : "normal",
                      }}
                    >
                      {out2} 건
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#999",
                        marginLeft: "5px",
                      }}
                    >
                      ({((out2 / totalB) * 100).toFixed(1)}%)
                    </span>
                  </td>
                  <td style={{ padding: "10px" }}>
                    <span
                      style={{
                        color: out3 > 0 ? "red" : "green",
                        fontWeight: out3 > 0 ? "bold" : "normal",
                      }}
                    >
                      {out3} 건
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#999",
                        marginLeft: "5px",
                      }}
                    >
                      ({((out3 / totalB) * 100).toFixed(1)}%)
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
