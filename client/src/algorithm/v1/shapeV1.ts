import type { PreprocessedStrokeData } from "../../config/types";
import { getRelativeSimilarity } from "../../similarity/math";

// 전처리된 데이터로 형태 유사도 계산
export const calculateShapeSimilarityByPreprocessedV1 = (
  preprocessedPrompt: PreprocessedStrokeData,
  preprocessedPlayer: PreprocessedStrokeData,
): number => {
  // hull 기반 형태 유사도
  const areaSim = calculateAreaSimilarity(
    preprocessedPrompt.hullArea,
    preprocessedPlayer.hullArea,
  );
  const perimeterSim = calculatePerimeterSimilarity(
    preprocessedPrompt.hullPerimeter,
    preprocessedPlayer.hullPerimeter,
  );
  const hullSim = areaSim * 0.5 + perimeterSim * 0.5;

  return hullSim;
};

// -----convex hull 면적/둘레 유사도 계산 유틸------

const calculateAreaSimilarity = (area1: number, area2: number): number => {
  if (area1 === 0 && area2 === 0) return 1;
  if (area1 === 0 || area2 === 0) return 0;

  return getRelativeSimilarity(area1, area2);
};

const calculatePerimeterSimilarity = (p1: number, p2: number): number => {
  if (p1 === 0 && p2 === 0) return 1;
  if (p1 === 0 || p2 === 0) return 0;

  return getRelativeSimilarity(p1, p2);
};
