export type Color = [number, number, number];

export interface Point {
  x: number;
  y: number;
}

export type Stroke = {
  points: [number[], number[]];
  color: Color;
};

export interface Similarity {
  similarity: number;
  strokeCountSimilarity: number;
  strokeMatchSimilarity: number;
  shapeSimilarity: number;
  densityBias?: number;
  penaltyPoints?: number;
  entropyNorm?: number[];
  usedRatio?: number[];
  inkLengthRatio?: number;
  getPenalty?: boolean;
}

export interface DensityBiasConfig {
  enabled: boolean;
  gridSize: number;
  weight: number;
  maxPenalty: number;
  maxRatioFreezone?: number;
  usedRatioFreezone?: number;
  scaleSlope?: number;
}

export interface InkLengthConfig {
  enabled: boolean;
  threshold: number;
  maxRatio: number;
  maxPenalty: number;
}

export interface StrokeMatchPenaltyConfig {
  enabled: boolean;
  threshold: number;
  maxPenalty: number;
}

export interface SimilarityConfig {
  weights: {
    strokeCount: number;
    strokeMatch: number;
    shape: number;
  };
  densityBias?: DensityBiasConfig;
  inkLength?: InkLengthConfig;
  strokeMatchPenalty?: StrokeMatchPenaltyConfig;
  useNormalize?: boolean;
}

export interface SimulationResult extends Similarity {
  details: {
    strokeMatch: {
      matches: {
        index1: number;
        index2: number;
        score: number;
        subScores: {
          length: number;
          direction: number;
          position: number;
          color: number;
        };
      }[];
      unmatched: number[];
    };
  };
}

export interface PreprocessedStrokeData {
  originalStrokes?: Stroke[];
  normalizedStrokes: Stroke[];
  strokeCount: number;
  points: Point[];
  hull: Point[];
  hullArea: number;
  hullPerimeter: number;
  radialSignature: number[];
}
