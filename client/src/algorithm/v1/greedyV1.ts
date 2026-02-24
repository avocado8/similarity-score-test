import type { Stroke } from "../../config/types";
import { comparePairwiseStrokeSimilarity } from "../../similarity/comparePairwiseStrokeSimilarity";

// 두 그림의 스트로크를 모두 일대일로 매칭하여 최종 스트로크 유사도 산출
export const calculateGreedyStrokeMatchScoreV1 = (
  strokes1: Stroke[],
  strokes2: Stroke[],
): number => {
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
      const finalPairSim = strokeShapeSim;
      matches.push(finalPairSim);
    }
  }

  const avgSimilarity =
    matches.reduce((sum, s) => sum + s, 0) / Math.max(n1, n2);

  return avgSimilarity;
};
