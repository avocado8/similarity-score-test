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

export interface PreprocessedStrokeData {
  normalizedStrokes: Stroke[];
  strokeCount: number;
  points: Point[];
  hull: Point[];
  hullArea: number;
  hullPerimeter: number;
  radialSignature: number[];
}
