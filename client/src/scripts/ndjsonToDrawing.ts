import { parseQuickDraw } from "../utils/parseQuickDraw";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function main() {
  const ndjson = {
    word: "car",
    countrycode: "PH",
    timestamp: "2017-03-01 02:21:51.71917 UTC",
    recognized: true,
    key_id: "4819414685843456",
    drawing: [
      [
        [
          187, 173, 85, 56, 14, 7, 0, 0, 9, 23, 42, 68, 183, 216, 248, 255, 254,
          247, 219, 207, 186,
        ],
        [
          2, 0, 2, 55, 59, 66, 82, 89, 92, 92, 85, 85, 95, 104, 105, 96, 83, 77,
          70, 63, 5,
        ],
      ],
      [
        [65, 54, 52, 57, 67, 79, 86, 88, 79],
        [82, 91, 106, 121, 130, 131, 119, 100, 91],
      ],
      [
        [191, 186, 185, 185, 188],
        [98, 103, 109, 116, 121],
      ],
    ],
  };

  const parsed = parseQuickDraw(ndjson);

  // drawing.json 파일 경로 (프로젝트 루트)
  const drawingJsonPath = path.resolve(__dirname, "../../../drawing.json");

  // 기존 drawing.json 읽기
  const existingData = JSON.parse(fs.readFileSync(drawingJsonPath, "utf-8"));

  // parsed 결과를 1번째 요소로 추가
  existingData.splice(1, 0, parsed);

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
