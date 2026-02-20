import type { SimilarityConfig } from "../../config/types";

interface Props {
  config: SimilarityConfig;
  onChange: (config: SimilarityConfig) => void;
}

export const ConfigPanel = ({ config, onChange }: Props) => {
  const handleChange = (
    key: keyof SimilarityConfig["weights"],
    value: number,
  ) => {
    // 값이 변경되면 나머지 값들을 비율에 맞춰 정규화
    const newWeights = { ...config.weights, [key]: value };
    const otherKeys = Object.keys(newWeights).filter(
      (k) => k !== key,
    ) as (keyof SimilarityConfig["weights"])[];

    const remainingWeight = 1 - value;
    const currentSumOther = otherKeys.reduce(
      (sum, k) => sum + config.weights[k],
      0,
    );

    if (currentSumOther === 0) {
      // 나머지 합이 0이면 균등 분배
      otherKeys.forEach((k) => {
        newWeights[k] = remainingWeight / otherKeys.length;
      });
    } else {
      // 비율대로 분배
      otherKeys.forEach((k) => {
        newWeights[k] = (config.weights[k] / currentSumOther) * remainingWeight;
      });
    }

    onChange({
      ...config,
      weights: newWeights,
    });
  };

  return (
    <div
      style={{
        padding: "10px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <h3>파라미터 설정</h3>

      {/* Stroke Count Weight */}
      <div>
        <label style={{ display: "flex", justifyContent: "space-between" }}>
          <span>개수(Count) 가중치</span>
          <span>{(config.weights.strokeCount * 100).toFixed(0)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={config.weights.strokeCount}
          onChange={(e) =>
            handleChange("strokeCount", parseFloat(e.target.value))
          }
          style={{ width: "100%" }}
        />
      </div>

      {/* Stroke Match Weight */}
      <div>
        <label style={{ display: "flex", justifyContent: "space-between" }}>
          <span>스트로크(Match) 가중치</span>
          <span>{(config.weights.strokeMatch * 100).toFixed(0)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={config.weights.strokeMatch}
          onChange={(e) =>
            handleChange("strokeMatch", parseFloat(e.target.value))
          }
          style={{ width: "100%" }}
        />
      </div>

      {/* Shape Weight */}
      <div>
        <label style={{ display: "flex", justifyContent: "space-between" }}>
          <span>형태(Shape) 가중치</span>
          <span>{(config.weights.shape * 100).toFixed(0)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={config.weights.shape}
          onChange={(e) => handleChange("shape", parseFloat(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>

      <hr style={{ width: "100%", borderColor: "#eee" }} />

      {/* Density Bias Config */}
      <div>
        <label>
          <input
            type="checkbox"
            checked={config.densityBias?.enabled ?? true}
            onChange={(e) =>
              onChange({
                ...config,
                densityBias: {
                  gridSize: 8,
                  weight: 1.0,
                  maxPenalty: 25,
                  ...config.densityBias,
                  enabled: e.target.checked,
                },
              })
            }
          />
          밀도 패널티 (Density Bias) 사용
        </label>
        {(config.densityBias?.enabled ?? true) && (
          <div style={{ paddingLeft: "20px", marginTop: "5px" }}>
            <label
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.9em",
              }}
            >
              <span>Max Penalty</span>
              <span>{config.densityBias?.maxPenalty ?? 25}점</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={config.densityBias?.maxPenalty ?? 25}
              onChange={(e) =>
                onChange({
                  ...config,
                  densityBias: {
                    gridSize: 8,
                    weight: 1.0,
                    enabled: true,
                    ...config.densityBias,
                    maxPenalty: parseFloat(e.target.value),
                  },
                })
              }
              style={{ width: "100%" }}
            />
          </div>
        )}

        <hr style={{ width: "100%", borderColor: "#eee" }} />

        {/* Ink Length Config */}
        <div>
          <label>
            <input
              type="checkbox"
              checked={config.inkLength?.enabled ?? true}
              onChange={(e) =>
                onChange({
                  ...config,
                  inkLength: {
                    threshold: 1.5,
                    maxRatio: 4.0,
                    maxPenalty: 30,
                    ...config.inkLength,
                    enabled: e.target.checked,
                  },
                })
              }
            />
            잉크 길이 패널티 사용
          </label>
          {(config.inkLength?.enabled ?? true) && (
            <div style={{ paddingLeft: "20px", marginTop: "5px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.8em" }}>
                    시작 비율 ({config.inkLength?.threshold ?? 1.5})
                  </label>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.1"
                    value={config.inkLength?.threshold ?? 1.5}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        inkLength: {
                          enabled: true,
                          maxRatio: 4.0,
                          maxPenalty: 30,
                          ...config.inkLength,
                          threshold: parseFloat(e.target.value),
                        },
                      })
                    }
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.8em" }}>
                    최대 비율 ({config.inkLength?.maxRatio ?? 4.0})
                  </label>
                  <input
                    type="range"
                    min="2.0"
                    max="10.0"
                    step="0.5"
                    value={config.inkLength?.maxRatio ?? 4.0}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        inkLength: {
                          enabled: true,
                          threshold: 1.5,
                          maxPenalty: 30,
                          ...config.inkLength,
                          maxRatio: parseFloat(e.target.value),
                        },
                      })
                    }
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
              <label
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.9em",
                  marginTop: "5px",
                }}
              >
                <span>Max Penalty</span>
                <span>{config.inkLength?.maxPenalty ?? 30}점</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={config.inkLength?.maxPenalty ?? 30}
                onChange={(e) =>
                  onChange({
                    ...config,
                    inkLength: {
                      enabled: true,
                      threshold: 1.5,
                      maxRatio: 4.0,
                      ...config.inkLength,
                      maxPenalty: parseFloat(e.target.value),
                    },
                  })
                }
                style={{ width: "100%" }}
              />
            </div>
          )}

          <hr style={{ width: "100%", borderColor: "#eee" }} />

          {/* Stroke Outlier Weight */}
          <div>
            <label style={{ display: "flex", justifyContent: "space-between" }}>
              <span>스트로크 매칭 패널티 임계값</span>
              <span>{config.strokeMatchPenalty?.threshold ?? 60}점</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={config.strokeMatchPenalty?.threshold}
              onChange={(e) =>
                onChange({
                  ...config,
                  strokeMatchPenalty: {
                    enabled: true,
                    threshold: parseFloat(e.target.value),
                    maxPenalty: 10,
                  },
                })
              }
              style={{ width: "100%" }}
            />
          </div>

          {/* Other Configs */}
          <div>
            <label>
              <input
                type="checkbox"
                checked={config.useNormalize ?? true}
                onChange={(e) =>
                  onChange({ ...config, useNormalize: e.target.checked })
                }
              />
              정규화 (Normalize) 사용
            </label>
          </div>

          <div style={{ marginTop: "auto", fontSize: "0.8em", color: "#666" }}>
            * 가중치 합은 항상 100%가 되도록 자동 조정됩니다.
          </div>
        </div>
      </div>
    </div>
  );
};
