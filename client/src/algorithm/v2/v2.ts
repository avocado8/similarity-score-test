import type { PreprocessedStrokeData, Stroke } from "../../config/types";
import { preprocessStrokes } from "../../similarity/calculateFinalSimilarity";
import { applyNonLinearScale } from "../../utils/math/applyNonLinearScale";
import { calculateGreedyStrokeMatchScoreV2 } from "./greedyV2";
import { calculateShapeSimilarityByPreprocessedV2 } from "./shapeV2";

// 스트로크 데이터로 최종 유사도 계산
export const calculateFinalSimilarityByStrokesV2 = (
  promptStrokes: Stroke[],
  playerStrokes: Stroke[],
) => {
  const preprocessedPrompt = preprocessStrokes(promptStrokes);
  const preprocessPlayer = preprocessStrokes(playerStrokes);
  return calculateFinalSimilarityByPreprocessedV2(
    preprocessedPrompt,
    preprocessPlayer,
  );
};

// 전처리한 데이터로 최종 유사도 계산
export const calculateFinalSimilarityByPreprocessedV2 = (
  preprocessedPrompt: PreprocessedStrokeData,
  preprocessedPlayer: PreprocessedStrokeData,
) => {
  // v2: 정규화 + 길이 전처리 적용
  const normalizedPromptStrokes = preprocessedPrompt.normalizedStrokes;
  const normalizedPlayerStrokes = preprocessedPlayer.normalizedStrokes;

  // 스트로크 개수 비교 (상대 오차)
  const strokeCountSimilarity = calculateStrokeCountSimilarity(
    normalizedPromptStrokes,
    normalizedPlayerStrokes,
  );

  // 스트로크 유사도
  const strokeMatchSimilarity = calculateGreedyStrokeMatchScoreV2(
    normalizedPromptStrokes,
    normalizedPlayerStrokes,
  );

  // 형태 유사도
  const shapeScore = calculateShapeSimilarityByPreprocessedV2(
    preprocessedPrompt,
    preprocessedPlayer,
  );

  const scaledShapeScore = applyNonLinearScale(shapeScore, 90);

  const strokeCountDifference =
    preprocessedPrompt.strokeCount - preprocessedPlayer.strokeCount;
  let weights;
  if (strokeCountDifference > 0) {
    // 스트로크 개수가 더 적을 때: 선 유사도에 가중치
    weights = {
      strokeCount: 0.1,
      strokeMatch: 0.6,
      shape: 0.3,
    };
  } else if (strokeCountDifference === 0) {
    // 스트로크 개수가 같을 때
    weights = {
      strokeCount: 0.15,
      strokeMatch: 0.35,
      shape: 0.5,
    };
  } else {
    // 스트로크 개수가 더 많을 때: 형태 유사도에 가중치
    weights = {
      strokeCount: 0.1,
      strokeMatch: 0.3,
      shape: 0.6,
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

const calculateStrokeCountSimilarity = (
  strokes1: Stroke[],
  strokes2: Stroke[],
) => {
  const strokeCount1 = strokes1.length;
  const strokeCount2 = strokes2.length;
  if (strokeCount1 === 0 && strokeCount2 === 0) return 100;
  if (strokeCount1 === 0 || strokeCount2 === 0) return 0;

  const ratio =
    Math.min(strokeCount1, strokeCount2) / Math.max(strokeCount1, strokeCount2);
  return ratio * 100;
};
