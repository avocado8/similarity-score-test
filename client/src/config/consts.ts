import type { SimilarityConfig } from "./types";

// 파라미터 기본값. '게임하기' 탭의 유사도 점수 계산 기준
export const similarityConfig: SimilarityConfig = {
  weights: {
    strokeCount: 0,
    strokeMatch: 0.8,
    shape: 0.2,
  },
  densityBias: {
    enabled: true,
    gridSize: 8,
    weight: 1.0,
    maxPenalty: 25,
  },
  inkLength: {
    enabled: true,
    threshold: 1.5,
    maxRatio: 4.0,
    maxPenalty: 40,
  },
  useNormalize: true,
  strokeMatchPenalty: {
    enabled: true,
    threshold: 60,
    maxPenalty: 10,
  },
};
