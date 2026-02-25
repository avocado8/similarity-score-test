import type { Stroke } from "../../config/types";

/** 내부 표현: [x, y] */
type Pt = [number, number];

/** Stroke -> Pt[] */
const strokeToPoints = (stroke: Stroke): Pt[] => {
  const [xs, ys] = stroke.points;
  const n = Math.min(xs.length, ys.length);
  const pts: Pt[] = new Array(n);
  for (let i = 0; i < n; i++) pts[i] = [xs[i], ys[i]];
  return pts;
};

/** Pt[] -> Stroke(points만 교체) */
const pointsToStroke = (stroke: Stroke, pts: Pt[]): Stroke => {
  const outX: number[] = new Array(pts.length);
  const outY: number[] = new Array(pts.length);
  for (let i = 0; i < pts.length; i++) {
    outX[i] = pts[i][0];
    outY[i] = pts[i][1];
  }
  return { ...stroke, points: [outX, outY] };
};

/**
 * 점 P에서 선분 AB까지의 거리^2
 * - AB 길이가 0이면(시작=끝) 그냥 AP 거리^2
 * - 선분 밖으로 투영되면 endpoint까지의 거리^2
 */
const distPointToSegmentSq = (p: Pt, a: Pt, b: Pt): number => {
  const px = p[0],
    py = p[1];
  const ax = a[0],
    ay = a[1];
  const bx = b[0],
    by = b[1];

  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;

  const abLenSq = abx * abx + aby * aby;
  if (abLenSq === 0) {
    // A == B
    return apx * apx + apy * apy;
  }

  // t = projection of AP onto AB, normalized by |AB|^2
  let t = (apx * abx + apy * aby) / abLenSq;
  t = Math.max(0, Math.min(1, t)); // clamp to segment

  const cx = ax + t * abx;
  const cy = ay + t * aby;

  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy;
};

/**
 * Douglas-Peucker (RDP) 단순화: Pt[] -> Pt[]
 * 위키 수도코드 기반, 중복 점 제거 포함.
 */
export const rdpPoints = (points: Pt[], epsilon: number): Pt[] => {
  const n = points.length;
  if (n <= 2) return points.slice();

  const a = points[0];
  const b = points[n - 1];

  let maxDistSq = 0;
  let index = -1;

  for (let i = 1; i < n - 1; i++) {
    const dSq = distPointToSegmentSq(points[i], a, b);
    if (dSq > maxDistSq) {
      maxDistSq = dSq;
      index = i;
    }
  }

  const epsSq = epsilon * epsilon;

  if (maxDistSq > epsSq && index !== -1) {
    const left = rdpPoints(points.slice(0, index + 1), epsilon);
    const right = rdpPoints(points.slice(index), epsilon);

    // left의 마지막 점과 right의 첫 점이 동일(분할점)이라 중복 제거
    return left.slice(0, left.length - 1).concat(right);
  }

  // 충분히 직선으로 근사 가능
  return [a, b];
};

/** Stroke용 래퍼 */
export const rdpStroke = (stroke: Stroke, epsilon: number): Stroke => {
  const pts = strokeToPoints(stroke);
  const simplified = rdpPoints(pts, epsilon);
  return pointsToStroke(stroke, simplified);
};
