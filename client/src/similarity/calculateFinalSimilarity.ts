import { normalizeStrokes } from "./utils/normalizeStrokes";
import { calculateGreedyStrokeMatchScore } from "./strokeSimilarity/calculateGreedyStrokeMatchScore";
import { calculateHullSimilarity } from "./geometry/convexHall";
import type { Stroke } from "./model";

export const calculateFinalSimilarity = (
  promptStrokes: Stroke[], // 제시 그림 스트로크
  playerStrokes: Stroke[] // 사용자 그림 스트로크
) => {
  const validPromptStrokes = getValidStrokes(promptStrokes);
  const validPlayerStrokes = getValidStrokes(playerStrokes);

  const normalizedPromptStrokes = normalizeStrokes(validPromptStrokes);
  const normalizedPlayerStrokes = normalizeStrokes(validPlayerStrokes);

  // 스트로크 개수 비교
  const promptStrokeCount = normalizedPromptStrokes.length;
  const playerStrokeCount = normalizedPlayerStrokes.length;
  const strokeCountDifference = Math.abs(promptStrokeCount - playerStrokeCount);

  const strokeCountSimilarity = (() => {
    const a = promptStrokeCount;
    const b = playerStrokeCount;
    if (a === 0 && b === 0) return 100;
    if (a === 0 || b === 0) return 0;

    const ratio = Math.min(a, b) / Math.max(a, b); // 0~1
    return ratio * 100;
  })();

  // 스트로크 유사도
  const strokeMatchSimilarity = calculateGreedyStrokeMatchScore(
    normalizedPromptStrokes,
    normalizedPlayerStrokes
  );

  // hull 기반 유사도
  const hullScore = calculateHullSimilarity(
    normalizedPromptStrokes,
    normalizedPlayerStrokes
  );

  const scaledHull = applyNonLinearScale(hullScore);
  let weights;

  // const strokeThreshold = Math.floor(promptStrokeCount / 2);
  if (promptStrokeCount - playerStrokeCount > 0) {
    // 스트로크 개수가 더 적을 때 (아직 덜 그림)
    // 선 매칭에 가중치
    weights = {
      strokeCount: 0.1,
      strokeMatch: 0.6,
      hull: 0.3,
    };
  } else if (strokeCountDifference === 0) {
    // 스트로크 개수가 같을 때
    weights = {
      strokeCount: 0.15,
      strokeMatch: 0.35,
      hull: 0.5,
    };
  } else {
    // 스트로크 개수가 더 많을 때
    weights = {
      strokeCount: 0.1,
      strokeMatch: 0.3, // 비중 감소
      hull: 0.6, // Hull 비중 증가
    };
  }

  // if (scaledHull >= 92) {
  //   // Hull 높음 -> 형태 중심 평가
  //   weights = {
  //     strokeCount: 0.1,
  //     strokeMatch: 0.2, // 비중 감소
  //     hull: 0.7, // Hull 비중 증가
  //   };
  // } else if (scaledHull >= 60) {
  //   // Hull 중간 -> 균형
  //   weights = {
  //     strokeCount: 0.0,
  //     strokeMatch: 0.4,
  //     hull: 0.6,
  //   };
  // } else {
  //   // Hull 낮음 -> Stroke를 더 중요하게 봄
  //   weights = {
  //     strokeCount: 0.0,
  //     strokeMatch: 0.5,
  //     hull: 0.5,
  //   };
  // }

  // 최종 유사도 계산
  const similarity =
    strokeCountSimilarity * weights.strokeCount +
    strokeMatchSimilarity * weights.strokeMatch +
    scaledHull * weights.hull;

  console.log("strokeCountSimilarity:", strokeCountSimilarity);
  console.log("strokeMatchSimilarity:", strokeMatchSimilarity);
  console.log("hullScore:", hullScore, "scaledHull:", scaledHull);
  console.log("weights:", weights);
  console.log("final similarity:", similarity);

  const roundedSimilarity = Math.round(similarity * 100) / 100;

  return {
    similarity: roundedSimilarity,
  };
};

// 일정 길이 이상의 스트로크만 남김
const getValidStrokes = (strokes: Stroke[]): Stroke[] => {
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

// 점수 비선형 스케일링
const applyNonLinearScale = (
  score: number,
  threshold = 90,
  steepness = 2
): number => {
  // threshold 기준으로 낮은 점수는 더 낮게, 높은 점수는 더 높게
  if (score < threshold) {
    // 낮은 점수는 제곱으로 더 낮춤
    return Math.pow(score / 100, steepness) * 100;
  } else {
    // 높은 점수는 유지하되 약간만 강조
    return score;
    // const normalized = (score - threshold) / (100 - threshold);
    // return threshold + normalized * (100 - threshold);
  }
};
