// 점수 비선형 스케일링
export const applyNonLinearScale = (
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
