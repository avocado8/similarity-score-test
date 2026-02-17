import { comparePairwiseStrokeSimilarity } from "./comparePairwiseStrokeSimilarity";
import { calculateColorSimilarity } from "./calculateColorSimilarity";
import type { Stroke } from "../config/types";

export interface StrokeMatchResult {
  score: number;
  matches: {
    index1: number;
    index2: number;
    score: number;
    subScores: {
      length: number;
      direction: number;
      position: number;
      color: number;
    };
  }[];
  unmatched: number[];
}

// 두 그림의 스트로크를 모두 일대일로 매칭하여 최종 스트로크 유사도 산출
export const calculateGreedyStrokeMatchScore = (
  strokes1: Stroke[],
  strokes2: Stroke[],
): StrokeMatchResult => {
  if (strokes1.length === 0 && strokes2.length === 0)
    return { score: 100, matches: [], unmatched: [] };
  if (strokes1.length === 0 || strokes2.length === 0)
    return { score: 0, matches: [], unmatched: [] };

  const n1 = strokes1.length;
  const n2 = strokes2.length;

  // 유사도 행렬 계산
  const similarityMatrix: {
    score: number;
    details: { length: number; direction: number; position: number };
  }[][] = [];
  for (let i = 0; i < n1; i++) {
    similarityMatrix[i] = [];
    for (let j = 0; j < n2; j++) {
      similarityMatrix[i][j] = comparePairwiseStrokeSimilarity(
        strokes1[i],
        strokes2[j],
      );
    }
  }

  // Greedy 매칭
  const used1 = new Set<number>();
  const used2 = new Set<number>();
  const matches: number[] = [];
  const detailedMatches: {
    index1: number;
    index2: number;
    score: number;
    subScores: {
      length: number;
      direction: number;
      position: number;
      color: number;
    };
  }[] = [];

  // 높은 유사도부터 매칭
  const pairs: { i: number; j: number; similarity: number }[] = [];
  for (let i = 0; i < n1; i++) {
    for (let j = 0; j < n2; j++) {
      pairs.push({ i, j, similarity: similarityMatrix[i][j].score });
    }
  }
  pairs.sort((a, b) => b.similarity - a.similarity);

  for (const pair of pairs) {
    if (!used1.has(pair.i) && !used2.has(pair.j)) {
      used1.add(pair.i);
      used2.add(pair.j);

      const strokeShapeSim = pair.similarity;
      const strokeColorSim = calculateColorSimilarity(
        strokes1[pair.i].color,
        strokes2[pair.j].color,
      );

      const finalPairSim = strokeShapeSim * (0.7 + 0.3 * strokeColorSim);
      matches.push(finalPairSim);

      detailedMatches.push({
        index1: pair.i,
        index2: pair.j,
        score: finalPairSim,
        subScores: {
          ...similarityMatrix[pair.i][pair.j].details,
          color: strokeColorSim,
        },
      });
    }
  }

  const avgSimilarity =
    matches.reduce((sum, s) => sum + s, 0) / Math.max(n1, n2);

  const unmatchedIndices: number[] = [];
  for (let j = 0; j < n2; j++) {
    if (!used2.has(j)) {
      unmatchedIndices.push(j);
    }
  }

  return {
    score: avgSimilarity,
    matches: detailedMatches,
    unmatched: unmatchedIndices,
  };
};
