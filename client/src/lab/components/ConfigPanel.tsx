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
  );
};
