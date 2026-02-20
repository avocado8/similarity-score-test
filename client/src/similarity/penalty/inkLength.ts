import { similarityConfig } from "../../config/consts";
import type { Stroke, InkLengthConfig } from "../../config/types";
import { getStrokeLength } from "../strokeGeometry";

// 스트로크 전체 길이 계산
const calculateTotalLength = (strokes: Stroke[]): number => {
  let total = 0;
  for (const stroke of strokes) {
    total += getStrokeLength(stroke);
  }
  return total;
};

/**
 * 잉크 길이 비율 패널티
 * - 내 그림이 제시 그림보다 비정상적으로 길면(낙서) 패널티 부여
 */
export const calculateInkLengthPenalty = (
  promptStrokes: Stroke[],
  playerStrokes: Stroke[],
  config?: InkLengthConfig,
) => {
  const enabled = config?.enabled ?? true;
  if (!enabled) {
    return { penaltyScore: 0, ratio: 0, rawPenalty: 0 };
  }

  const promptLen = calculateTotalLength(promptStrokes);
  const playerLen = calculateTotalLength(playerStrokes);

  // 0으로 나눔 방지
  if (promptLen === 0) {
    return { penaltyScore: 0, ratio: 0, rawPenalty: 0 };
  }

  const ratio = playerLen / promptLen;
  const threshold = config?.threshold ?? similarityConfig.inkLength!.threshold;
  const maxRatio = config?.maxRatio ?? similarityConfig.inkLength!.maxRatio;
  const maxPenaltyScore =
    config?.maxPenalty ?? similarityConfig.inkLength!.maxPenalty;

  // 임계값 이하면 패널티 없음
  if (ratio <= threshold) {
    return { penaltyScore: 0, ratio, rawPenalty: 0 };
  }

  // threshold ~ maxRatio 구간에서 0 ~ 1로 선형 증가
  // (ratio - threshold) / (maxRatio - threshold)
  let t = (ratio - threshold) / (maxRatio - threshold);
  t = Math.max(0, Math.min(1, t)); // 0~1 clamp

  const penaltyFactor = t;

  const penaltyScore = penaltyFactor * maxPenaltyScore;

  return {
    penaltyScore,
    ratio,
    rawPenalty: penaltyFactor, // 0~1
  };
};
