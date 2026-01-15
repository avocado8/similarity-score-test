import type { Point, Stroke } from "../model";
import { getRelativeSimilarity } from "../utils/math";
import { calculateRadialSimilarity } from "./radialSignature";

export const calculateHullSimilarity = (
  strokes1: Stroke[],
  strokes2: Stroke[]
): number => {
  // 1. Stroke를 Point로 변환
  const points1 = strokesToPoints(strokes1);
  const points2 = strokesToPoints(strokes2);

  // 2. Convex Hull 계산
  const hull1 = convexHull(points1);
  const hull2 = convexHull(points2);

  // 3. 면적과 둘레 계산
  const area1 = hullArea(hull1);
  const area2 = hullArea(hull2);
  const perimeter1 = hullPerimeter(hull1);
  const perimeter2 = hullPerimeter(hull2);

  // 4. 유사도 계산
  const areaSim = calculateAreaSimilarity(area1, area2);
  const perimeterSim = calculatePerimeterSimilarity(perimeter1, perimeter2);
  const hullSim = 0.5 * areaSim + 0.5 * perimeterSim;

  // 5. Hull 점수 (면적 50% + 둘레 50%)
  // const hullScore = (areaSim * 0.5 + perimeterSim * 0.5) * 100;
  // console.log(`면적점수 ${areaSim * 100}, 둘레점수 ${perimeterSim * 100}`);

  // ✅ solidity는 normalized 전용으로
  // const sol1 = solidityFromNormalizedStrokes(strokes1, hull1);
  // const sol2 = solidityFromNormalizedStrokes(strokes2, hull2);
  // const soliditySim = calculateSoliditySimilarity(sol1, sol2);

  // ✅ radial은 그대로 OK (points가 이미 normalize되어도 OK)
  const radialSim = calculateRadialSimilarity(points1, points2);

  const score01 = hullSim * 0.5 + radialSim * 0.5;

  console.log(`hullSim: ${hullSim * 100},radialSim: ${radialSim * 100}`);
  return score01 * 100;

  // return hullScore;
};

// -----convex hall 계산 관련 유틸-----

const strokesToPoints = (strokes: Stroke[]): Point[] => {
  const points: Point[] = [];

  for (const stroke of strokes) {
    const [xs, ys] = stroke.points;
    for (let i = 0; i < xs.length; i++) {
      points.push({ x: xs[i], y: ys[i] });
    }
  }

  return points;
};

const hullArea = (hull: Point[]): number => {
  if (hull.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < hull.length; i++) {
    const j = (i + 1) % hull.length;
    area += hull[i].x * hull[j].y;
    area -= hull[j].x * hull[i].y;
  }

  return Math.abs(area) / 2;
};

const hullPerimeter = (hull: Point[]): number => {
  if (hull.length < 2) return 0;

  let length = 0;
  for (let i = 0; i < hull.length; i++) {
    const j = (i + 1) % hull.length;
    const dx = hull[i].x - hull[j].x;
    const dy = hull[i].y - hull[j].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }

  return length;
};

const convexHull = (points: Point[]): Point[] => {
  points.sort(function (a, b) {
    return a.x != b.x ? a.x - b.x : a.y - b.y;
  });

  const n = points.length;
  const hull = [];

  for (let i = 0; i < 2 * n; i++) {
    const j = i < n ? i : 2 * n - 1 - i;

    while (
      hull.length >= 2 &&
      removeMiddle(hull[hull.length - 2], hull[hull.length - 1], points[j])
    ) {
      hull.pop();
    }
    hull.push(points[j]);
  }

  hull.pop();
  return hull;
};

const removeMiddle = (a: Point, b: Point, c: Point): boolean => {
  const cross = (a.x - b.x) * (c.y - b.y) - (a.y - b.y) * (c.x - b.x);
  const dot = (a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y);
  return cross < 0 || (cross == 0 && dot <= 0);
};

// -----convex hall 면적/둘레 유사도 계산 유틸------

const calculateAreaSimilarity = (area1: number, area2: number): number => {
  if (area1 === 0 && area2 === 0) return 1;
  if (area1 === 0 || area2 === 0) return 0;

  return getRelativeSimilarity(area1, area2);
};

const calculatePerimeterSimilarity = (p1: number, p2: number): number => {
  if (p1 === 0 && p2 === 0) return 1;
  if (p1 === 0 || p2 === 0) return 0;

  return getRelativeSimilarity(p1, p2);
};

// solidity

const estimateFilledAreaNormalized = (
  points: Point[],
  grid = 128, // 64~256 튜닝
  brush = 1 // 0~2 튜닝
): number => {
  if (points.length === 0) return 0;

  const occupied = new Set<number>();
  const key = (ix: number, iy: number) => iy * grid + ix;

  for (const p of points) {
    // normalize 결과가 0~1 범위라고 가정 (약간 벗어나도 clamp)
    const cx = Math.max(0, Math.min(grid - 1, Math.round(p.x * (grid - 1))));
    const cy = Math.max(0, Math.min(grid - 1, Math.round(p.y * (grid - 1))));

    for (let dy = -brush; dy <= brush; dy++) {
      for (let dx = -brush; dx <= brush; dx++) {
        const ix = cx + dx;
        const iy = cy + dy;
        if (ix >= 0 && ix < grid && iy >= 0 && iy < grid) {
          occupied.add(key(ix, iy));
        }
      }
    }
  }

  // 각 셀의 면적은 (1/grid)^2, 전체 면적 스케일은 상수라
  // solidity 비교에서는 occupied.size만 써도 되지만, 명확히 면적으로 환산해도 OK
  const cellArea = 1 / (grid * grid);
  return occupied.size * cellArea;
};

export const solidityFromNormalizedStrokes = (
  strokes: Stroke[],
  hull: Point[]
): number => {
  const points = strokesToPoints(strokes); // 여기 points는 이미 normalize된 좌표여야 함
  const hullA = hullArea(hull);
  if (hullA <= 1e-12) return 0;

  const shapeA = estimateFilledAreaNormalized(points, 128, 1);
  return shapeA / hullA;
};

export const calculateSoliditySimilarity = (s1: number, s2: number): number => {
  const sim = 1 - Math.abs(s1 - s2);
  return Math.max(0, Math.min(1, sim));
};
