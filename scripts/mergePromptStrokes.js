#!/usr/bin/env node

/**
 * mergePromptStrokes.js
 *
 * 승인된 제출 데이터를 data/promptStrokes.json과 병합하는 스크립트
 *
 * 사용법:
 *   1. 관리자 UI에서 "승인된 데이터 다운로드" 버튼으로 JSON 파일 다운로드
 *   2. 다운로드된 파일을 scripts/ 폴더에 복사
 *   3. node scripts/mergePromptStrokes.js 실행
 *
 * 동작:
 *   - scripts/ 폴더에서 approved-submissions-*.json 파일 자동 찾기
 *   - data/promptStrokes.json의 최신 날짜 확인
 *   - 새 항목에 연속 날짜 할당 (하루씩 증가)
 *   - 기존 데이터에 append하여 저장
 */

const fs = require("fs");
const path = require("path");

// 경로 설정
const scriptsDir = __dirname;
const dataDir = path.join(__dirname, "..", "data");
const promptStrokesPath = path.join(dataDir, "promptStrokes.json");

/**
 * 날짜를 하루 증가시키기
 */
function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

/**
 * scripts 폴더에서 approved-submissions-*.json 파일 찾기
 */
function findApprovedSubmissionsFile() {
  const files = fs.readdirSync(scriptsDir);
  const approvedFile = files.find((file) =>
    file.match(/^approved-submissions-.*\.json$/),
  );

  if (!approvedFile) {
    console.error(
      "❌ 오류: scripts 폴더에서 approved-submissions-*.json 파일을 찾을 수 없습니다.",
    );
    console.error(
      "   관리자 UI에서 '승인된 데이터 다운로드'를 누르고 파일을 scripts/ 폴더에 복사해주세요.",
    );
    process.exit(1);
  }

  return path.join(scriptsDir, approvedFile);
}

/**
 * 메인 실행
 */
function main() {
  try {
    console.log("🔄 병합 프로세스 시작...\n");

    // 1. 승인된 파일 찾기
    const approvedFilePath = findApprovedSubmissionsFile();
    console.log(`✓ 파일 찾음: ${path.basename(approvedFilePath)}`);

    // 2. 승인된 데이터 읽기
    const approvedDataStr = fs.readFileSync(approvedFilePath, "utf-8");
    const approvedData = JSON.parse(approvedDataStr);

    if (!Array.isArray(approvedData) || approvedData.length === 0) {
      console.error("❌ 오류: 승인된 데이터가 비어있거나 잘못된 형식입니다.");
      process.exit(1);
    }

    console.log(`✓ 승인된 데이터 로드: ${approvedData.length}개 항목`);

    // 3. 기존 promptStrokes.json 읽기
    let existingData = [];
    if (fs.existsSync(promptStrokesPath)) {
      const existingDataStr = fs.readFileSync(promptStrokesPath, "utf-8");
      existingData = JSON.parse(existingDataStr);
      console.log(`✓ 기존 데이터 로드: ${existingData.length}개 항목`);
    } else {
      console.log(`⚠  promptStrokes.json이 없어 새로 생성합니다.`);
    }

    // 4. 최신 날짜 찾기
    let latestDate = null;
    if (existingData.length > 0) {
      // 마지막 항목의 date 사용
      latestDate = existingData[existingData.length - 1].date;
      console.log(`✓ 최신 날짜: ${latestDate}`);
    } else {
      // 새로 생성하는 경우, 오늘 날짜에서 시작
      latestDate = new Date().toISOString().split("T")[0];
      console.log(`✓ 신규 생성, 시작 날짜: ${latestDate}`);
    }

    // 5. 새 항목에 연속 날짜 할당
    console.log(`\n📝 날짜 할당 중...`);
    const newItems = approvedData.map((item, index) => {
      const newDate = addDays(latestDate, index + 1);
      return {
        date: newDate,
        strokes: item.strokes,
      };
    });

    console.log(`✓ 날짜 할당 완료`);
    console.log(`  시작: ${newItems[0].date}`);
    console.log(`  종료: ${newItems[newItems.length - 1].date}`);

    // 6. 병합
    const mergedData = [...existingData, ...newItems];
    console.log(`\n📊 최종 데이터: ${mergedData.length}개 항목`);

    // 7. 저장
    console.log(`\n💾 저장 중...`);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(promptStrokesPath, JSON.stringify(mergedData, null, 2));
    console.log(`✓ 저장 완료: ${promptStrokesPath}`);

    // 8. 백업 생성 (선택사항)
    const backupPath = promptStrokesPath.replace(
      ".json",
      `-backup-${new Date().toISOString().split("T")[0]}.json`,
    );
    fs.copyFileSync(promptStrokesPath, backupPath);
    console.log(`✓ 백업 생성: ${path.basename(backupPath)}`);

    // 9. 정리 (옵션)
    console.log(`\n🧹 정리...`);
    const backupApprovedPath = approvedFilePath.replace(
      ".json",
      "-processed.json",
    );
    fs.renameSync(approvedFilePath, backupApprovedPath);
    console.log(`✓ 처리된 파일 보관: ${path.basename(backupApprovedPath)}`);

    console.log(`\n✅ 병합 완료!`);
    console.log(`   추가된 항목: ${newItems.length}개`);
    console.log(`   전체 항목: ${mergedData.length}개`);
  } catch (error) {
    console.error("\n❌ 오류 발생:");
    console.error(error.message);
    process.exit(1);
  }
}

// 실행
main();
