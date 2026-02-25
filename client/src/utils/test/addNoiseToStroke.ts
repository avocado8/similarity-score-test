import type { Stroke } from "../../config/types";

export const densifyStroke = ({
  stroke,
  step = 2,
}: {
  stroke: Stroke;
  step?: number;
}): Stroke => {
  const [xs, ys] = stroke.points;
  if (xs.length <= 1) return stroke;

  const outX = [xs[0]];
  const outY = [ys[0]];

  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i],
      y0 = ys[i];
    const x1 = xs[i + 1],
      y1 = ys[i + 1];

    const dx = x1 - x0,
      dy = y1 - y0;
    const dist = Math.hypot(dx, dy);

    const steps = Math.max(0.5, Math.ceil(dist / step));
    for (let j = 1; j < steps; j++) {
      const t = j / steps;
      outX.push(x0 + dx * t);
      outY.push(y0 + dy * t);
    }

    outX.push(Math.floor(x1));
    outY.push(Math.floor(y1));
  }

  return {
    ...stroke,
    points: [outX, outY],
  };
};

interface JitterConfig {
  ampPx: number;
  offset: number;
  bounds?: { minX: number; maxX: number; minY: number; maxY: number };
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const DEFAULT_JITTER: JitterConfig = {
  ampPx: 0.8,
  offset: 0.4,
};
export const addJitter = ({
  stroke,
  jitterConfig = DEFAULT_JITTER,
}: {
  stroke: Stroke;
  jitterConfig: Partial<JitterConfig>;
}) => {
  const config: JitterConfig = { ...DEFAULT_JITTER, ...jitterConfig };

  const [xs, ys] = stroke.points;
  if (xs.length === 0) return stroke;

  const randomCentered = () => Math.random() + Math.random() - 1;
  let ox = 0,
    oy = 0;
  const outX = [],
    outY = [];

  for (let i = 0; i < xs.length; i++) {
    ox = ox + randomCentered() * config.offset;
    oy = oy + randomCentered() * config.offset;

    ox = clamp(ox, -config.ampPx, config.ampPx);
    oy = clamp(oy, -config.ampPx, config.ampPx);

    let nx = xs[i] + ox;
    let ny = ys[i] + oy;

    if (config.bounds) {
      nx = clamp(nx, config.bounds.minX, config.bounds.maxX);
      ny = clamp(ny, config.bounds.minY, config.bounds.maxY);
    }

    outX.push(Math.floor(nx));
    outY.push(Math.floor(ny));
  }

  return {
    ...stroke,
    points: [outX, outY] as [number[], number[]],
  };
};

interface NoiseConfig {
  step: number;
  jitter: Partial<JitterConfig>;
}

export const addNoiseToStroke = ({
  stroke,
  noiseConfig,
}: {
  stroke: Stroke;
  noiseConfig: NoiseConfig;
}): Stroke => {
  const dense = densifyStroke({ stroke, step: noiseConfig.step });
  return addJitter({ stroke: dense, jitterConfig: noiseConfig.jitter });
};
