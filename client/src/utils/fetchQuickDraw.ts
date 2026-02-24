import type { Stroke } from "../config/types";
import { parseQuickDraw } from "./parseQuickDraw";

export interface CandidateItem {
  id: string; // key_id from ndjson
  strokes: Stroke[];
}

export const fetchQuickDraw = async (
  category: "book" | "whale" | "apple" | "bird",
  offset: number = 0,
  limit: number = 100,
): Promise<CandidateItem[]> => {
  // Use Vite's local proxy to bypass CORS
  const url = `/api/quickdraw/${category}.ndjson`;

  const response = await fetch(url);
  if (!response.body) {
    throw new Error("Failed to fetch data body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let result: CandidateItem[] = [];
  let buffer = "";
  let currentOffset = 0;
  let collected = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        const data = JSON.parse(line);

        // We only want 'recognized': true
        if (data.recognized) {
          if (currentOffset < offset) {
            currentOffset++;
            continue;
          }

          result.push({
            id: data.key_id || Math.random().toString(36).substr(2, 9),
            strokes: parseQuickDraw(data),
          });
          collected++;

          if (collected >= limit) {
            // Stop fetching as soon as we have enough
            reader.cancel();
            return result;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error fetching or parsing Quick, Draw! data:", error);
    throw error;
  }

  return result;
};
