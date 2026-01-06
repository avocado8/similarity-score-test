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

  ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();

  // 첫 번째 점으로 이동 (0-255 범위를 캔버스 크기로 변환)
  const firstX = (xPoints[0] / 255) * canvasWidth;
  const firstY = (yPoints[0] / 255) * canvasHeight;
  ctx.moveTo(firstX, firstY);

  // 나머지 점들을 연결
  for (let i = 1; i < xPoints.length; i++) {
    const x = (xPoints[i] / 255) * canvasWidth;
    const y = (yPoints[i] / 255) * canvasHeight;
    ctx.lineTo(x, y);
  }

  ctx.stroke();
};
