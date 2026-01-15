import type { Point } from "../model";

const centroid = (pts: Point[]): Point => {
  let sx = 0,
    sy = 0;
  for (const p of pts) {
    sx += p.x;
    sy += p.y;
  }
  const n = Math.max(1, pts.length);
  return { x: sx / n, y: sy / n };
};

const radialSignature = (
  pts: Point[],
  bins = 144, // 36~144 추천
  smoothWindow = 3 // 1~5 추천, 1이면 smoothing 없음
): number[] => {
  if (pts.length === 0) return Array(bins).fill(0);

  const c = centroid(pts);
  const maxR = Array(bins).fill(0);

  for (const p of pts) {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const r = Math.hypot(dx, dy);
    let ang = Math.atan2(dy, dx); // [-pi, pi]
    if (ang < 0) ang += Math.PI * 2; // [0, 2pi)
    const idx = Math.min(bins - 1, Math.floor((ang / (Math.PI * 2)) * bins));
    if (r > maxR[idx]) maxR[idx] = r;
  }

  // 스케일 불변성: 최대값으로 정규화
  const denom = Math.max(...maxR, 1e-6);
  const norm = maxR.map((v) => v / denom);

  // smoothing(이동평균)
  if (smoothWindow <= 1) return norm;
  const half = Math.floor(smoothWindow / 2);
  const smoothed = Array(bins).fill(0);
  for (let i = 0; i < bins; i++) {
    let sum = 0;
    let cnt = 0;
    for (let k = -half; k <= half; k++) {
      const j = (i + k + bins) % bins;
      sum += norm[j];
      cnt++;
    }
    smoothed[i] = sum / cnt;
  }
  return smoothed;
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  let dot = 0,
    na = 0,
    nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na <= 1e-12 || nb <= 1e-12) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
};

export const calculateRadialSimilarity = (
  pts1: Point[],
  pts2: Point[]
): number => {
  const sig1 = radialSignature(pts1, 72, 3);
  const sig2 = radialSignature(pts2, 72, 3);
  // cosine은 [-1,1] 범위 가능하지만 여기선 0~1 근처로 나오는 편
  const cos = cosineSimilarity(sig1, sig2);
  return Math.max(0, Math.min(1, cos));
};
