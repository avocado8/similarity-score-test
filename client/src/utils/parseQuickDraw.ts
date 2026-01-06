import type { Stroke } from "../similarity/model";

interface RawDrawing {
  word: string;
  countrycode: string;
  timestamp: string;
  recognized: boolean;
  key_id: string;
  drawing: number[][][];
}

export const parseQuickDraw = (data: RawDrawing): Stroke[] => {
  // const data: RawDrawing = JSON.parse(jsonLine);

  return data.drawing.map((stroke) => ({
    points: [stroke[0], stroke[1]],
    color: [0, 0, 0],
  }));
};

// 사용 예시
// const jsonl =
//   '{"word":"apple","countrycode":"US","timestamp":"2017-03-10 22:17:57.57466 UTC","recognized":false,"key_id":"6420579601088512","drawing":[[[255,255],[0,0]],[[255,255],[0,0]],[[255,255],[0,0]],[[255,254],[0,1]],[[131,124,114,69,37,10,0,0,5,16,31,50,68,86,101,115,126,135,137,135,122,106],[50,39,39,59,89,127,172,194,215,233,244,249,249,241,225,203,174,143,114,88,65,45]],[[84,77,81,88,99,122,138,161,180],[97,85,52,34,18,4,1,2,12]]]}';

// const strokes = parseQuickDraw(jsonl);
// console.log(strokes);

// 결과:
// [
//   { points: [[255,255], [0,0]], color: [0,0,0] },
//   { points: [[255,255], [0,0]], color: [0,0,0] },
//   { points: [[255,255], [0,0]], color: [0,0,0] },
//   { points: [[255,254], [0,1]], color: [0,0,0] },
//   { points: [[131,124,114,...], [50,39,39,...]], color: [0,0,0] },
//   { points: [[84,77,81,...], [97,85,52,...]], color: [0,0,0] }
// ]
