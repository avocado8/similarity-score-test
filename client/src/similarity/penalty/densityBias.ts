import type { Stroke, DensityBiasConfig } from "../../config/types";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

type InkStats = {
  maxRatio: number; // 0~1 (1에 가까울수록 한 셀에 몰림)
  usedRatio: number; // 0~1 (사용한 셀 비율)
  totalLen: number; // 총 스트로크 길이
};

const calcInkStats = (strokes: Stroke[], grid = 8): InkStats => {
  const bins = new Array(grid * grid).fill(0);
  let total = 0;

  for (const s of strokes) {
    const [xs, ys] = s.points;
    for (let i = 1; i < xs.length; i++) {
      const x0 = xs[i - 1],
        y0 = ys[i - 1];
      const x1 = xs[i],
        y1 = ys[i];
      const dx = x1 - x0,
        dy = y1 - y0;
      const len = Math.hypot(dx, dy);
      if (len <= 0) continue;

      // 선분 중점이 속한 셀에 길이를 누적
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2;

      const ix = Math.max(0, Math.min(grid - 1, Math.floor(mx * grid)));
      const iy = Math.max(0, Math.min(grid - 1, Math.floor(my * grid)));
      bins[iy * grid + ix] += len;

      total += len;
    }
  }

  if (total <= 0) return { maxRatio: 0, usedRatio: 0, totalLen: 0 };

  let used = 0;
  let maxBin = 0;

  for (const b of bins) {
    if (b > maxBin) maxBin = b;
  }

  const maxRatio = maxBin / total;

  return {
    maxRatio: clamp01(maxRatio),
    usedRatio: clamp01(used / (grid * grid)),
    totalLen: total,
  };
};

/**
 * 밀도 편향 점수(0~100): 플레이어가 프롬프트 대비 너무 한쪽에 몰려 그리면 감점
 * - 난사(한 구역 줄 긋기) 방지 목적
 */
export const calculateDensityBiasScore = (
  promptStrokes: Stroke[],
  playerStrokes: Stroke[],
  config?: DensityBiasConfig,
) => {
  const grid = config?.gridSize ?? 8;
  const p = calcInkStats(promptStrokes, grid);
  const u = calcInkStats(playerStrokes, grid);

  const maxRatioGap = u.maxRatio - p.maxRatio; // +면 플레이어가 더 몰림
  const usedGap = p.usedRatio - u.usedRatio; // +면 플레이어가 더 적은 셀 사용

  const maxRatioPenalty = clamp01(
    (maxRatioGap - (config?.maxRatioFreezone ?? 0.08)) /
      (config?.scaleSlope ?? 0.25),
  );
  const usedPenalty = clamp01(
    (usedGap - (config?.usedRatioFreezone ?? 0.05)) /
      (config?.scaleSlope ?? 0.25),
  );

  const penalty = 0.7 * maxRatioPenalty + 0.3 * usedPenalty;

  // 가중치 적용
  const weight = config?.weight ?? 1.0;
  const weightedPenalty = penalty * weight;

  const densityBiasScore =
    clamp01(weightedPenalty) * (config?.maxPenalty ?? 25);

  return {
    maxRatio: [p.maxRatio, u.maxRatio],
    usedRatio: [p.usedRatio, u.usedRatio],
    densityBiasScore,
  };
};
