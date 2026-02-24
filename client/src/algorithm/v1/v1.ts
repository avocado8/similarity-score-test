import type { PreprocessedStrokeData, Stroke } from "../../config/types";
import {
  normalizeStrokes,
  preprocessStrokes,
} from "../../similarity/calculateFinalSimilarity";
import { applyNonLinearScale } from "../../utils/math/applyNonLinearScale";
import { calculateGreedyStrokeMatchScoreV1 } from "./greedyV1";
import { calculateShapeSimilarityByPreprocessedV1 } from "./shapeV1";

export const calculateFinalSimilarityByStrokesV1 = (
  promptStrokes: Stroke[],
  playerStrokes: Stroke[],
) => {
  const preprocessedPrompt = preprocessStrokes(promptStrokes);
  const preprocessPlayer = preprocessStrokes(playerStrokes);
  return calculateFinalSimilarityByPreprocessedV1(
    preprocessedPrompt,
    preprocessPlayer,
  );
};

// 전처리한 데이터로 최종 유사도 계산
const calculateFinalSimilarityByPreprocessedV1 = (
  preprocessedPrompt: PreprocessedStrokeData,
  preprocessedPlayer: PreprocessedStrokeData,
) => {
  // v1 전처리: 정규화만 사용
  const normalizedPromptStrokes = normalizeStrokes(
    preprocessedPrompt.originalStrokes!,
  );
  const normalizedPlayerStrokes = normalizeStrokes(
    preprocessedPlayer.originalStrokes!,
  );

  // 스트로크 개수 비교: 절대 오차
  const strokeCountSimilarity =
    normalizedPlayerStrokes.length === 0
      ? 0
      : Math.max(
          0,
          100 -
            Math.abs(
              normalizedPromptStrokes.length - normalizedPlayerStrokes.length,
            ) *
              10,
        );

  // 스트로크 유사도
  const strokeMatchSimilarity = calculateGreedyStrokeMatchScoreV1(
    normalizedPromptStrokes,
    normalizedPlayerStrokes,
  );

  // 형태 유사도
  const shapeScore = calculateShapeSimilarityByPreprocessedV1(
    preprocessedPrompt,
    preprocessedPlayer,
  );

  const scaledShapeScore = applyNonLinearScale(shapeScore, 90);

  let weights;
  if (scaledShapeScore >= 92) {
    // Hull 점수가 높으면 -> 형태 중심 평가
    weights = {
      strokeCount: 0.05,
      strokeMatch: 0.15, // 비중 감소
      shape: 0.8, // Hull 비중 증가
    };
  } else if (scaledShapeScore >= 60) {
    // Hull 중간 -> 균형
    weights = {
      strokeCount: 0.08,
      strokeMatch: 0.32,
      shape: 0.6,
    };
  } else {
    // Hull 낮음 -> Stroke 중요
    weights = {
      strokeCount: 0.1,
      strokeMatch: 0.5,
      shape: 0.4,
    };
  }

  // 최종 유사도 계산
  const weightedStrokeCountSim = strokeCountSimilarity * weights.strokeCount;
  const weightedStrokeMatchSim = strokeMatchSimilarity * weights.strokeMatch;
  const weightedShapeSim = scaledShapeScore * weights.shape;
  let similarity =
    weightedStrokeCountSim + weightedStrokeMatchSim + weightedShapeSim;

  const roundedSimilarity = Math.round(similarity * 100) / 100;

  return {
    similarity: roundedSimilarity,
    strokeCountSimilarity: Math.round(weightedStrokeCountSim * 100) / 100,
    strokeMatchSimilarity: Math.round(weightedStrokeMatchSim * 100) / 100,
    shapeSimilarity: Math.round(weightedShapeSim * 100) / 100,
  };
};
