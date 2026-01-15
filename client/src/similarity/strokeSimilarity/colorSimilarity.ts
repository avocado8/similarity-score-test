export const colorSimilarity = (
  c1?: [number, number, number],
  c2?: [number, number, number],
  gamma = 2.5
): number => {
  // 색 정보가 없으면 "중립" 처리(색으로 가점/감점하지 않음)
  if (!c1 || !c2) return 1;

  const dr = c1[0] - c2[0];
  const dg = c1[1] - c2[1];
  const db = c1[2] - c2[2];
  const d = Math.hypot(dr, dg, db); // 0 ~ 441.67
  const dMax = Math.sqrt(3 * 255 * 255);
  const x = d / dMax; // 0~1

  const sim = Math.pow(1 - x, gamma); // 0~1
  return Math.max(0, Math.min(1, sim));
};
