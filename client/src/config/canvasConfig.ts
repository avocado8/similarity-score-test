import type { Color } from "./types";

export const CANVAS_CONFIG = {
  width: 500,
  height: 500,
} as const;

export const CANVAS_STYLES = {
  fillStyle: "white",
  strokeStyle: "black",
  lineWidth: 3,
  lineCap: "round" as CanvasLineCap,
  lineJoin: "round" as CanvasLineJoin,
} as const;

export const COLOR_MAP: Record<string, Color> = {
  black: [0, 0, 0],
  red: [239, 68, 68],
  blue: [59, 130, 246],
  green: [34, 197, 94],
  yellow: [250, 204, 21],
} as const;
