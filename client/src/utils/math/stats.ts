export const getMean = (values: number[]) => {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

export const getMedian = (values: number[]) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

export const getMin = (values: number[]) => {
  if (values.length === 0) return 0;
  return Math.min(...values);
};

export const getMax = (values: number[]) => {
  if (values.length === 0) return 0;
  return Math.max(...values);
};

/**
 * Calculates Area Under the Receiver Operating Characteristic Curve (AUROC).
 * @param positiveScores Array of scores for positive class (e.g., A1/A2 - should have higher scores)
 * @param negativeScores Array of scores for negative class (e.g., B - should have lower scores)
 * Returns the probability that a randomly chosen positive sample has a higher score than a randomly chosen negative sample.
 */
export const getROC_AUC = (
  positiveScores: number[],
  negativeScores: number[],
) => {
  if (positiveScores.length === 0 || negativeScores.length === 0) return 0;

  // Wilcoxon-Mann-Whitney U statistic
  let numPairs = 0;
  let numCorrect = 0;

  for (const p of positiveScores) {
    for (const n of negativeScores) {
      if (p > n) {
        numCorrect += 1;
      } else if (p === n) {
        numCorrect += 0.5; // tie
      }
      numPairs += 1;
    }
  }

  return numPairs > 0 ? numCorrect / numPairs : 0;
};
