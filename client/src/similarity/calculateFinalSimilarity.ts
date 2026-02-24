import { calculateGreedyStrokeMatchScore } from "./calculateGreedyStrokeMatchScore";
import {
  getConvexHull,
  getHullArea,
  getHullPerimeter,
  strokesToPoints,
} from "./convexHullGeometry";
import { getRadialSignature } from "./radialSignature";
import { calculateShapeSimilarityByPreprocessed } from "./calculateShapeSimilarity";
import type {
  PreprocessedStrokeData,
  SimilarityConfig,
  SimulationResult,
  Stroke,
} from "../config/types";
import { calculateDensityBiasScore } from "./penalty/densityBias";
import { calculateInkLengthPenalty } from "./penalty/inkLength";

// 스트로크에서 유사도 계산에 필요한 수학적 데이터를 미리 계산하는 함수
export const preprocessStrokes = (
  strokes: Stroke[],
): PreprocessedStrokeData => {
  const validStrokes = getValidStrokes(strokes);
  const normalizedStrokes = normalizeStrokes(validStrokes);
  const points = strokesToPoints(normalizedStrokes);
  const hull = getConvexHull(points);
  const hullArea = getHullArea(hull);
  const hullPerimeter = getHullPerimeter(hull);
  const radialSignature = getRadialSignature(points);

  return {
    originalStrokes: strokes,
    normalizedStrokes,
    strokeCount: normalizedStrokes.length,
    points,
    hull,
    hullArea,
    hullPerimeter,
    radialSignature,
  };
};

// 스트로크 데이터로 최종 유사도 계산
export const calculateFinalSimilarityByStrokes = (
  promptStrokes: Stroke[],
  playerStrokes: Stroke[],
  config?: SimilarityConfig,
): SimulationResult => {
  const preprocessedPrompt = preprocessStrokes(promptStrokes);
  const preprocessPlayer = preprocessStrokes(playerStrokes);
  return calculateFinalSimilarityByPreprocessed(
    preprocessedPrompt,
    preprocessPlayer,
    config,
  );
};

// 전처리한 데이터로 최종 유사도 계산
export const calculateFinalSimilarityByPreprocessed = (
  preprocessedPrompt: PreprocessedStrokeData,
  preprocessedPlayer: PreprocessedStrokeData,
  config?: SimilarityConfig,
): SimulationResult => {
  const normalizedPromptStrokes = preprocessedPrompt.normalizedStrokes;
  const normalizedPlayerStrokes = preprocessedPlayer.normalizedStrokes;

  // 스트로크 개수 비교
  const strokeCountSimilarity = calculateStrokeCountSimilarity(
    normalizedPromptStrokes,
    normalizedPlayerStrokes,
  );

  // 스트로크 유사도
  const strokeMatchResult = calculateGreedyStrokeMatchScore(
    normalizedPromptStrokes,
    normalizedPlayerStrokes,
    config?.strokeMatchPenalty?.threshold,
  );
  const strokeMatchSimilarity = strokeMatchResult.score;

  // 형태 유사도
  const shapeScore = calculateShapeSimilarityByPreprocessed(
    preprocessedPrompt,
    preprocessedPlayer,
  );

  const scaledShapeScore = applyNonLinearScale(shapeScore, 90);
  let weights = config?.weights;

  if (!weights) {
    const promptStrokeCount = preprocessedPrompt.strokeCount;
    const playerStrokeCount = normalizedPlayerStrokes.length;
    const strokeCountDifference = promptStrokeCount - playerStrokeCount;
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
  }

  // 최종 유사도 계산
  const weightedStrokeCountSim = strokeCountSimilarity * weights.strokeCount;
  const weightedStrokeMatchSim = strokeMatchSimilarity * weights.strokeMatch;
  const weightedShapeSim = scaledShapeScore * weights.shape;
  let similarity =
    weightedStrokeCountSim + weightedStrokeMatchSim + weightedShapeSim;

  const densityBias = calculateDensityBiasScore(
    normalizedPromptStrokes,
    normalizedPlayerStrokes,
    config?.densityBias,
  ); // 0~100

  // 잉크 길이 패널티
  const inkLengthResult = calculateInkLengthPenalty(
    normalizedPromptStrokes,
    normalizedPlayerStrokes,
    config?.inkLength,
  );

  // 패널티 적용 여부 및 비활성화 체크
  // (개별 config가 있으면 그것을 따르고, 없으면 기본값 true)
  const enableDensityBias = config?.densityBias?.enabled ?? true;
  const enableInkLength = config?.inkLength?.enabled ?? true;

  // const MAX_DENSITY_PENALTY = config?.densityBias?.maxPenalty ?? 25;

  let penaltyPoints = 0;

  // 1. 밀도 편향 패널티 합산
  if (enableDensityBias) {
    // const p = (1 - densityBias.densityBiasScore / 100) * MAX_DENSITY_PENALTY;
    penaltyPoints += densityBias.densityBiasScore;
  }

  // 2. 잉크 길이 패널티 합산
  if (enableInkLength) {
    penaltyPoints += inkLengthResult.penaltyScore;
  }

  // 3. 스트로크 매칭 패널티 합산
  const enableStrokeMatchPenalty = config?.strokeMatchPenalty?.enabled ?? true;
  if (enableStrokeMatchPenalty && strokeMatchResult.getPenalty) {
    penaltyPoints += config?.strokeMatchPenalty?.maxPenalty ?? 10;
  }

  similarity = Math.max(0, similarity - penaltyPoints);

  const roundedSimilarity = Math.round(similarity * 100) / 100;

  return {
    similarity: roundedSimilarity,
    strokeCountSimilarity: Math.round(weightedStrokeCountSim * 100) / 100,
    strokeMatchSimilarity: Math.round(weightedStrokeMatchSim * 100) / 100,
    shapeSimilarity: Math.round(weightedShapeSim * 100) / 100,
    densityBias: densityBias.densityBiasScore,
    inkLengthRatio: inkLengthResult.ratio,
    penaltyPoints,
    getPenalty: enableStrokeMatchPenalty && strokeMatchResult.getPenalty,
    details: {
      strokeMatch: {
        matches: strokeMatchResult.matches,
        unmatched: strokeMatchResult.unmatched,
      },
    },
  };
};

// 일정 길이 이상의 스트로크만 남김
export const getValidStrokes = (strokes: Stroke[]): Stroke[] => {
  const MIN_STROKE_LENGTH = 10; // 최소 길이 임계값
  return strokes.filter((stroke) => {
    const [xs, ys] = stroke.points;
    let length = 0;
    for (let i = 1; i < xs.length; i++) {
      const dx = xs[i] - xs[i - 1];
      const dy = ys[i] - ys[i - 1];
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length >= MIN_STROKE_LENGTH;
  });
};

// 스트로크 정규화
export const normalizeStrokes = (strokes: Stroke[]): Stroke[] => {
  if (strokes.length === 0) return [];

  // 모든 점의 min/max 찾기
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;

  for (const stroke of strokes) {
    const [xArr, yArr] = stroke.points;
    for (const x of xArr) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
    for (const y of yArr) {
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  const width = maxX - minX || 1;
  const height = maxY - minY || 1;
  const scale = Math.max(width, height);

  // 정규화 (0~1 범위, 중앙 기준)
  const normalized = strokes.map((stroke): Stroke => {
    const [xArr, yArr] = stroke.points;
    const normalizedX = xArr.map((x) => (x - minX) / scale);
    const normalizedY = yArr.map((y) => (y - minY) / scale);
    return { points: [normalizedX, normalizedY], color: stroke.color };
  });

  return normalized;
};

// 스트로크 개수 유사도 점수
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

// 점수 비선형 스케일링
const applyNonLinearScale = (
  score: number,
  threshold = 70,
  steepness = 2,
): number => {
  // threshold 기준으로 낮은 점수는 더 낮게, 높은 점수는 더 높게
  if (score < threshold) {
    // 낮은 점수는 제곱으로 더 낮춤
    return Math.pow(score / 100, steepness) * 100;
  } else {
    return score;
  }
};
