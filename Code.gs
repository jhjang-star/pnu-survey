/* =====================================================================
 * Code.gs — 부산대 AI 수학 학습 설문 백엔드 (Google Apps Script 웹앱)
 * ---------------------------------------------------------------------
 * 저장: 이 스크립트가 바인딩된 Google 스프레드시트에 시트 자동 생성 후 적재
 *   - 사전설문 / 사후설문 시트에 각각 저장
 *   - 동일 학번(sid) 재제출 시 기존 행을 최신 내용으로 덮어씀(upsert)
 *
 * 배포:
 *   1) Google 스프레드시트 새로 만들기 → 확장 프로그램 > Apps Script
 *   2) 이 파일 전체를 붙여넣고 저장
 *   3) 아래 ADMIN_PASSWORD 값을 원하는 관리자 비밀번호로 변경
 *   4) 배포 > 새 배포 > 유형: 웹 앱
 *        - 설명: pnu-survey
 *        - 실행 계정: 나
 *        - 액세스 권한: 모든 사용자
 *   5) 배포 후 표시되는 웹앱 URL(.../exec)을 config.js 의 GAS_URL 에 입력
 *      admin.html 관리자 화면에도 같은 URL 을 입력
 * ===================================================================== */

// ★ 관리자 비밀번호 — 원하는 값으로 변경하세요.
var ADMIN_PASSWORD = 'pnu2026';

var META_HEADERS = ['제출시각', '학번', '이름'];

/* ---------- 학생 응답 저장 (POST) ---------- */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action !== 'submit') return json({ ok: false, error: 'unknown action' });

    var sheetName = data.sheet || (data.type === 'post' ? '사후설문' : '사전설문');
    var sid = String(data.sid || '').trim();
    if (!sid) return json({ ok: false, error: '학번(sid) 누락' });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(sheetName);
    if (!sh) { sh = ss.insertSheet(sheetName); }

    var columns = data.columns || [];
    var header = META_HEADERS.concat(columns);

    // 헤더 없으면 생성 (또는 컬럼 수가 바뀌었으면 갱신)
    var lastCol = sh.getLastColumn();
    if (sh.getLastRow() === 0 || lastCol < header.length) {
      sh.getRange(1, 1, 1, header.length).setValues([header]);
      sh.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#e9e9ff');
      sh.setFrozenRows(1);
    }

    var now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    var rowValues = [now, sid, data.name || ''].concat(data.row || []);

    // upsert: 학번 열(2열)에서 기존 행 탐색
    var mode = 'insert';
    var lastRow = sh.getLastRow();
    if (lastRow >= 2) {
      var sids = sh.getRange(2, 2, lastRow - 1, 1).getValues();
      for (var i = 0; i < sids.length; i++) {
        if (String(sids[i][0]).trim() === sid) {
          sh.getRange(i + 2, 1, 1, rowValues.length).setValues([rowValues]);
          mode = 'update';
          break;
        }
      }
    }
    if (mode === 'insert') {
      sh.appendRow(rowValues);
    }

    return json({ ok: true, mode: mode });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* ---------- 관리자 조회 (GET, JSONP 지원) ----------
 * 브라우저에서 크로스오리진 응답을 읽어야 하므로 JSONP(callback) 로 반환.
 * admin.js 는 ?action=data&pw=...&callback=fn 형태로 호출한다.
 */
function doGet(e) {
  var p = e.parameter || {};
  var action = p.action || '';
  var cb = p.callback || '';

  if (action === 'ping') return json({ ok: true, pong: true }, cb);

  if (action === 'data') {
    if (String(p.pw || '') !== ADMIN_PASSWORD) return json({ ok: false, error: '비밀번호가 올바르지 않습니다.' }, cb);
    var result = {};
    ['사전설문', '사후설문'].forEach(function (nm) {
      var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nm);
      if (sh && sh.getLastRow() >= 1) {
        result[nm] = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues();
      } else {
        result[nm] = [];
      }
    });
    return json({ ok: true, sheets: result }, cb);
  }

  return json({ ok: false, error: 'unknown action' }, cb);
}

function json(obj, callback) {
  var body = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + body + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(body)
    .setMimeType(ContentService.MimeType.JSON);
}
