/* =====================================================================
 * config.js — 배포 설정
 * ---------------------------------------------------------------------
 * GAS_URL : Apps Script 웹앱 배포 URL
 *   1) Code.gs 를 Google Apps Script 프로젝트에 붙여넣기
 *   2) 배포 > 새 배포 > 웹 앱 (실행: 나 / 액세스: 모든 사용자)
 *   3) 생성된 웹앱 URL(.../exec) 을 아래에 붙여넣기
 *   배포 전(URL 미설정) 상태에서는 데모 모드로 동작(localStorage 임시 저장).
 *
 * PERIODS : 설문 기간(시작~마감). 이 기간 밖에는 응답 화면이 잠깁니다.
 *   형식: 'YYYY-MM-DDTHH:mm'  (예: 2026년 8월 20일 오전 9시 → '2026-08-20T09:00')
 *   - 비워두면('') 제한 없음(항상 열림).
 *   - start 만 지정 → 그 시각 이후 열림
 *   - end 만 지정   → 그 시각까지만 열림
 *   예)
 *     pre:  { start: '2026-08-20T09:00', end: '2026-09-05T23:59' }
 *     post: { start: '2026-11-01T09:00', end: '2026-11-20T23:59' }
 * ===================================================================== */

window.CONFIG = {
  // 예) 'https://script.google.com/macros/s/AKfy.../exec'
  GAS_URL: 'https://script.google.com/macros/s/AKfycbzS3oY1_6IQsYI7lM2yrMRPIWSOEh_bGfJhmJcyhStF-IvPq8k5xIlriQbVN1Me6VOHAw/exec',

  PERIODS: {
    pre:  { start: '', end: '2026-09-07T23:59' },                   // 사전: (테스트) 지금부터 ~ 9/7
    post: { start: '2026-12-01T09:00', end: '2026-12-07T23:59' },   // 사후: 12월 첫째주(1~7일)
  },
};
