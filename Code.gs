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

// ★ 설문 기간(서버측 강제) — config.js 의 PERIODS 와 동일하게 유지하세요.
//   시각은 한국시간(KST) 기준. 비워두면('') 해당 방향 제한 없음.
//   이 기간 밖에는 서버가 저장을 거부하여 응답이 완전히 비활성화됩니다.
var PERIODS = {
  pre:  { start: '2026-09-01T00:00', end: '2026-09-30T23:59' },   // 사전: 9월 한 달(9/1~9/30)
  post: { start: '2026-12-01T09:00', end: '2026-12-07T23:59' },
};

var META_HEADERS = ['제출시각', '학번', '이름'];

// KST 문자열('YYYY-MM-DDTHH:mm')을 Date(UTC epoch)로 변환
function kstToDate(s) {
  if (!s) return null;
  var m = String(s).match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 9, +m[5]));
}

// 현재 시각이 해당 설문 기간 내인지
function isWithinPeriod(type) {
  var p = PERIODS[type];
  if (!p) return true;
  var now = new Date();
  var s = kstToDate(p.start), e = kstToDate(p.end);
  if (s && now < s) return false;
  if (e && now > e) return false;
  return true;
}

/* ---------- 학생 응답 저장 (POST) ---------- */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action !== 'submit') return json({ ok: false, error: 'unknown action' });

    var type = data.type === 'post' ? 'post' : 'pre';
    // 설문 기간 밖이면 저장 거부(서버측 비활성화)
    if (!isWithinPeriod(type)) return json({ ok: false, error: '설문 기간이 아닙니다.', closed: true });

    var sheetName = data.sheet || (type === 'post' ? '사후설문' : '사전설문');
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
