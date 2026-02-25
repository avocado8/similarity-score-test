import type { Stroke } from "../../config/types";
import { calculateFinalSimilarityByStrokes } from "../../similarity/calculateFinalSimilarity";
import { addNoiseToStroke } from "../../utils/test/addNoiseToStroke";
import {
  getMean,
  getMedian,
  getMin,
  getMax,
  getROC_AUC,
} from "../../utils/math/stats";
import { similarityConfig } from "../../config/consts";
import type { TestResultData as BaseTestResultData } from "./runner";

export interface RdpTestResultData extends BaseTestResultData {
  computeTimeMs: {
    A1: { total: number; rdp: number };
    A2: { total: number; rdp: number };
    B: { total: number; rdp: number };
  };
}

export type RdpBenchmarkResults = Record<string, RdpTestResultData[]>;

export const NOISE_CONFIG = {
  step: 2,
  jitter: {
    ampPx: 0.8,
    offset: 0.4,
  },
};

export const RDP_EPSILONS = [0.5, 1, 2, 3, 5, 8, 10];

// A helper to safely load JSON files dynamically
const loadData = async ({
  fileName,
  category,
}: {
  fileName: string;
  category: string;
}): Promise<Stroke[][]> => {
  try {
    const module = await import(`../../data/${category}/${fileName}.json`);
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

const applyNoiseToStrk = (strokes: Stroke[]): Stroke[] => {
  return strokes.map((stroke) =>
    addNoiseToStroke({ stroke, noiseConfig: NOISE_CONFIG }),
  );
};

const runAlgorithm = (
  version: string,
  promptStrokes: Stroke[],
  targetList: Stroke[][],
): { scores: number[]; computeTimeMs: { total: number; rdp: number } } => {
  const useRdp = version !== "no_rdp";
  const rdpEpsilon = useRdp
    ? parseFloat(version.replace("rdp_", ""))
    : undefined;

  const config = {
    ...similarityConfig,
    useRdp,
    rdpEpsilon,
  };

  let totalMs = 0;
  let rdpMs = 0;

  const scores = targetList.map((target) => {
    // Add noise to target before testing
    const noisedTarget = applyNoiseToStrk(target);

    const startObj = performance.now();
    const res = calculateFinalSimilarityByStrokes(
      promptStrokes,
      noisedTarget,
      config,
    );
    totalMs += performance.now() - startObj;
    rdpMs += res.rdpTimeMs || 0;

    return Math.max(0, res.similarity);
  });

  return {
    scores,
    computeTimeMs: {
      total: totalMs,
      rdp: rdpMs,
    },
  };
};

export const runRdpReliabilityTest = async (
  category: string = "book",
  promptIndices = [0, 1, 2, 3, 4],
): Promise<RdpBenchmarkResults> => {
  // versions dynamically constructed: "no_rdp", "rdp_0.5", "rdp_1", etc.
  const versions: string[] = ["no_rdp", ...RDP_EPSILONS.map((e) => `rdp_${e}`)];
  const results: RdpBenchmarkResults = {};
  versions.forEach((v) => {
    results[v] = [];
  });

  const promptsList = await loadData({
    fileName: `Prompt-${category}`,
    category,
  });

  for (const pIdx of promptIndices) {
    if (!promptsList[pIdx]) continue;

    // Original prompt strokes, then add noise to them for testing
    const originalPromptStrokes = promptsList[pIdx] as unknown as Stroke[];
    const noisedPromptStrokes = applyNoiseToStrk(originalPromptStrokes);

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
      const resA1 = runAlgorithm(v, noisedPromptStrokes, a1List);
      const resA2 = runAlgorithm(v, noisedPromptStrokes, a2List);
      const resB = runAlgorithm(v, noisedPromptStrokes, bList);

      const a2bScores = [...resA2.scores, ...resB.scores];

      results[v].push({
        category,
        promptIndex: pIdx,
        promptStrokes: noisedPromptStrokes,
        scores: {
          A1: resA1.scores,
          A2: resA2.scores,
          B: resB.scores,
        },
        stats: {
          A1: calcStats(resA1.scores),
          A2: calcStats(resA2.scores),
          B: calcStats(resB.scores),
        },
        auroc: {
          A1_vs_A2: getROC_AUC(resA1.scores, resA2.scores),
          A1_vs_B: getROC_AUC(resA1.scores, resB.scores),
          A1_vs_A2B: getROC_AUC(resA1.scores, a2bScores),
        },
        computeTimeMs: {
          A1: resA1.computeTimeMs,
          A2: resA2.computeTimeMs,
          B: resB.computeTimeMs,
        },
      });
    }
  }

  return results;
};
