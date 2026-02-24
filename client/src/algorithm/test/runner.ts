import type { Stroke } from "../../config/types";
import { calculateFinalSimilarityByStrokesV1 } from "../v1/v1";
import { calculateFinalSimilarityByStrokesV2 } from "../v2/v2";
import { calculateFinalSimilarityByStrokes } from "../../similarity/calculateFinalSimilarity";
import {
  getMean,
  getMedian,
  getMin,
  getMax,
  getROC_AUC,
} from "../../utils/math/stats";
import { similarityConfig } from "../../config/consts";

export type AlgorithmVersion = "v1" | "v2" | "v3";

export interface TestResultData {
  category: string;
  promptIndex: number;
  promptStrokes: Stroke[];
  scores: {
    A1: number[];
    A2: number[];
    B: number[];
  };
  stats: {
    A1: { mean: number; median: number; min: number; max: number };
    A2: { mean: number; median: number; min: number; max: number };
    B: { mean: number; median: number; min: number; max: number };
  };
  auroc: {
    A1_vs_A2: number;
    A1_vs_B: number;
    A1_vs_A2B: number;
  };
}

export type BenchmarkResults = Record<AlgorithmVersion, TestResultData[]>;

// A helper to safely load JSON files dynamically
const loadData = async ({
  fileName,
  category,
}: {
  fileName: string;
  category: string;
}): Promise<Stroke[][]> => {
  try {
    // Vite's dynamic import from src/data
    const module = await import(`../../data/${category}/${fileName}.json`);
    // Assuming the JSON structure is Stroke[][][] or Stroke[][] depending on how it's formatted.
    // Export structure seems to be `Stroke[][]` per file since it's grouped.
    return module.default || module;
  } catch (e) {
    console.warn(`Failed to load ${fileName}.json`, e);
    return [];
  }
};

const calcStats = (arr: number[]) => {
  return {
    mean: getMean(arr),
    median: getMedian(arr),
    min: getMin(arr),
    max: getMax(arr),
  };
};

const runAlgorithm = (
  version: AlgorithmVersion,
  promptStrokes: Stroke[],
  targetList: Stroke[][],
): number[] => {
  return targetList.map((target) => {
    let res;
    switch (version) {
      case "v1":
        res = calculateFinalSimilarityByStrokesV1(promptStrokes, target);
        break;
      case "v2":
        res = calculateFinalSimilarityByStrokesV2(promptStrokes, target);
        break;
      case "v3":
      default:
        res = calculateFinalSimilarityByStrokes(
          promptStrokes,
          target,
          similarityConfig,
        );
        break;
    }
    return res.similarity;
  });
};

export const runReliabilityTest = async (
  category: string = "book",
  promptIndices = [0, 1, 2, 3, 4],
): Promise<BenchmarkResults> => {
  const versions: AlgorithmVersion[] = ["v1", "v2", "v3"];
  const results: BenchmarkResults = {
    v1: [],
    v2: [],
    v3: [],
  };

  const promptsList = await loadData({
    fileName: `Prompt-${category}`,
    category,
  });

  for (const pIdx of promptIndices) {
    // If prompt doesn't exist, skip
    if (!promptsList[pIdx]) continue;
    const promptStrokes = promptsList[pIdx] as unknown as Stroke[]; // Prompt is saved as `strokes` array, but inside the list it's the raw array of strokes

    const a1List = await loadData({
      fileName: `A1-${category}-${pIdx}`,
      category,
    });
    const a2List = await loadData({
      fileName: `A2-${category}-${pIdx}`,
      category,
    });
    const bList = await loadData({
      fileName: `B-${category}-${pIdx}`,
      category,
    });

    for (const v of versions) {
      const a1Scores = runAlgorithm(v, promptStrokes, a1List);
      const a2Scores = runAlgorithm(v, promptStrokes, a2List);
      const bScores = runAlgorithm(v, promptStrokes, bList);

      const a2bScores = [...a2Scores, ...bScores];

      results[v].push({
        category,
        promptIndex: pIdx,
        promptStrokes,
        scores: {
          A1: a1Scores,
          A2: a2Scores,
          B: bScores,
        },
        stats: {
          A1: calcStats(a1Scores),
          A2: calcStats(a2Scores),
          B: calcStats(bScores),
        },
        auroc: {
          A1_vs_A2: getROC_AUC(a1Scores, a2Scores),
          A1_vs_B: getROC_AUC(a1Scores, bScores),
          A1_vs_A2B: getROC_AUC(a1Scores, a2bScores),
        },
      });
    }
  }

  return results;
};
