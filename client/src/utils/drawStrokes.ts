import type { Stroke } from "../config/types";

interface DrawOptions {
  highlightIndices?: number[];
  highlightColor?: string; // Default 'red' or something valid
  opacity?: number; // For non-highlighted strokes
}

/**
 * 캔버스에 스트로크 배열을 그립니다
 */
export const drawStrokes = (
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  canvasWidth: number,
  canvasHeight: number,
  options?: DrawOptions,
) => {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  strokes.forEach((stroke, index) => {
    const isHighlighted = options?.highlightIndices?.includes(index);

    // 하이라이트 모드일 때, 하이라이트 되지 않은 것은 흐리게 처리
    if (options?.highlightIndices && options.highlightIndices.length > 0) {
      if (!isHighlighted) {
        ctx.globalAlpha = options.opacity ?? 0.3;
      } else {
        ctx.globalAlpha = 1.0;
        // 하이라이트 색상 적용 (옵션)
        if (options.highlightColor) {
          // stroke.color is [r, g, b]. We can override logic or just let drawStroke handle it?
          // drawStroke uses stroke.color.
          // We could temporarily change stroke color or handle it in drawStroke.
          // Let's modify drawStroke signature too or just change style after calling drawStroke path?
          // drawStroke calls stroke() internaly.
          // Let's overload drawStroke to take color override.
        }
      }
    } else {
      ctx.globalAlpha = 1.0;
    }

    drawStroke(
      ctx,
      stroke,
      canvasWidth,
      canvasHeight,
      isHighlighted ? options?.highlightColor : undefined,
    );
  });

  // Restore alpha
  ctx.globalAlpha = 1.0;
};

/**
 * 캔버스에 단일 스트로크를 그립니다
 */
export const drawStroke = (
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  canvasWidth: number,
  canvasHeight: number,
  overrideColor?: string,
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

  if (overrideColor) {
    ctx.strokeStyle = overrideColor;
    ctx.lineWidth = 4; // Thicker for highlight
  } else {
    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.lineWidth = 2;
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

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
