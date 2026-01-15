import type { Stroke } from '../similarity/model';

/**
 * 캔버스에 스트로크 배열을 그립니다
 */
export const drawStrokes = (
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  canvasWidth: number,
  canvasHeight: number
) => {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  strokes.forEach((stroke) => {
    drawStroke(ctx, stroke, canvasWidth, canvasHeight);
  });
};

/**
 * 캔버스에 단일 스트로크를 그립니다
 */
export const drawStroke = (
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  canvasWidth: number,
  canvasHeight: number
) => {
  const [xPoints, yPoints] = stroke.points;
  const [r, g, b] = stroke.color;

  if (xPoints.length === 0) return;

  // 좌표 범위 자동 감지
  const maxX = Math.max(...xPoints);
  const maxY = Math.max(...yPoints);

  // 255보다 크면 QuickDraw 원본 좌표(0-640 정도), 아니면 정규화된 좌표(0-255)
  const normalizeX = maxX > 255 ? maxX : 255;
  const normalizeY = maxY > 255 ? maxY : 255;

  ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();

  // 첫 번째 점으로 이동
  const firstX = (xPoints[0] / normalizeX) * canvasWidth;
  const firstY = (yPoints[0] / normalizeY) * canvasHeight;
  ctx.moveTo(firstX, firstY);

  // 나머지 점들을 연결
  for (let i = 1; i < xPoints.length; i++) {
    const x = (xPoints[i] / normalizeX) * canvasWidth;
    const y = (yPoints[i] / normalizeY) * canvasHeight;
    ctx.lineTo(x, y);
  }

  ctx.stroke();
};
