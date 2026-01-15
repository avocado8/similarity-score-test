import { parseQuickDraw } from "../utils/parseQuickDraw";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function main() {
  const ndjson = {
    word: "dog",
    countrycode: "MY",
    timestamp: "2017-03-28 08:44:27.44595 UTC",
    recognized: true,
    key_id: "5111107440082944",
    drawing: [
      [
        [55, 34, 33, 39, 45, 68, 96, 124, 160],
        [25, 171, 194, 196, 196, 180, 148, 111, 49],
      ],
      [
        [60, 60],
        [74, 74],
      ],
      [
        [92, 92, 96],
        [74, 86, 94],
      ],
      [
        [68, 68],
        [72, 94],
      ],
      [
        [48, 18, 7, 0, 6, 29, 41],
        [6, 7, 24, 104, 106, 81, 72],
      ],
      [
        [71, 199, 206, 210, 210, 209, 201, 190, 179, 158, 148],
        [1, 1, 11, 29, 92, 105, 125, 133, 99, 59, 31],
      ],
      [
        [31, 50, 50, 39, 39],
        [183, 183, 189, 198, 191],
      ],
      [
        [86, 86, 91, 104, 104],
        [166, 253, 255, 187, 141],
      ],
      [
        [116, 120],
        [128, 179],
      ],
    ],
  };

  const parsed = parseQuickDraw(ndjson);

  // drawing.json 파일 경로 (프로젝트 루트)
  const drawingJsonPath = path.resolve(__dirname, "../../../drawing.json");

  // 기존 drawing.json 읽기
  const existingData = JSON.parse(fs.readFileSync(drawingJsonPath, "utf-8"));

  // parsed 결과를 마지막 요소로 추가
  existingData.push(parsed);

  // drawing.json에 저장
  fs.writeFileSync(
    drawingJsonPath,
    JSON.stringify(existingData, null, 2),
    "utf-8"
  );

  console.log("✅ drawing.json에 새로운 그림이 추가되었습니다!");
  console.log(`총 그림 개수: ${existingData.length}`);
  console.log(`추가된 그림의 스트로크 개수: ${parsed.length}`);
}

main();
