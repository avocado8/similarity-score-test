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
}

export interface SimilarityConfig {
  weights: {
    strokeCount: number;
    strokeMatch: number;
    shape: number;
  };
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
  normalizedStrokes: Stroke[];
  strokeCount: number;
  points: Point[];
  hull: Point[];
  hullArea: number;
  hullPerimeter: number;
  radialSignature: number[];
}
