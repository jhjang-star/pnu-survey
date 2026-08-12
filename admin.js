/* =====================================================================
 * admin.js — 관리자 대시보드 로직
 * 데이터 조회: JSONP(GET) — Apps Script 웹앱 CORS 회피
 * ===================================================================== */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var whoBox = document.getElementById('whoBox');
  var state = { url: '', pw: '', data: null, tab: '사전설문', filter: '' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(id) { return document.getElementById(id); }

  /* ---------------- 로그인 화면 ---------------- */
  function renderLogin(errMsg) {
    var savedUrl = (window.CONFIG && window.CONFIG.GAS_URL) || localStorage.getItem('pnu_admin_url') || '';
    app.innerHTML =
      '<div class="login">' +
        '<h2>관리자 로그인</h2>' +
        '<p>설문 응답 집계를 확인하려면 로그인하세요.</p>' +
        (errMsg ? '<div class="banner err">' + esc(errMsg) + '</div>' : '') +
        '<div class="field"><label>Apps Script 웹앱 URL</label>' +
          '<input type="text" id="inUrl" placeholder="https://script.google.com/macros/s/.../exec" value="' + esc(savedUrl) + '"></div>' +
        '<div class="field"><label>관리자 비밀번호</label>' +
          '<input type="text" id="inPw" placeholder="비밀번호" autocomplete="off"></div>' +
        '<button class="btn btn-primary btn-block" id="loginBtn">로그인</button>' +
        '<p style="margin-top:16px;font-size:12px" class="muted">URL 미입력 시 이 브라우저의 데모 저장분(localStorage)을 표시합니다.</p>' +
      '</div>';
    el('loginBtn').addEventListener('click', doLogin);
    el('inPw').addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
  }

  function doLogin() {
    state.url = el('inUrl').value.trim();
    state.pw = el('inPw').value.trim();
    var btn = el('loginBtn'); btn.disabled = true; btn.textContent = '확인 중…';

    if (!state.url) {
      // 데모 모드
      state.data = loadDemo();
      whoBox.textContent = '데모 모드';
      renderDash();
      return;
    }
    localStorage.setItem('pnu_admin_url', state.url);
    jsonp(state.url, { action: 'data', pw: state.pw }, function (res) {
      if (!res || !res.ok) { renderLogin((res && res.error) || '조회 실패 (URL/네트워크 확인)'); return; }
      state.data = res.sheets;
      whoBox.textContent = '관리자';
      renderDash();
    }, function () {
      renderLogin('서버 연결에 실패했습니다. 웹앱 URL과 배포(액세스: 모든 사용자)를 확인하세요.');
    });
  }

  function loadDemo() {
    var store = JSON.parse(localStorage.getItem('pnu_survey_demo') || '{}');
    var out = {};
    [['pre', '사전설문'], ['post', '사후설문']].forEach(function (pair) {
      var t = pair[0], nm = pair[1];
      var survey = window.SURVEYS[t];
      var cols = survey.questions.filter(function (q) { return q.type !== 'section'; });
      var header = ['제출시각', '학번', '이름'].concat(cols.map(function (q, i) { return (i + 1) + '. ' + q.label; }));
      var rows = [header];
      var recs = (store[t]) || {};
      Object.keys(recs).forEach(function (sid) {
        var r = recs[sid];
        rows.push([r.ts, sid, r.name || ''].concat(r.row || []));
      });
      out[nm] = rows.length > 1 ? rows : [];
    });
    return out;
  }

  /* ---------------- JSONP ---------------- */
  var jsonpSeq = 0;
  function jsonp(url, params, onOk, onErr) {
    jsonpSeq++;
    var cbName = '__pnu_cb_' + jsonpSeq;
    var timer = setTimeout(function () { cleanup(); if (onErr) onErr(); }, 15000);
    function cleanup() { clearTimeout(timer); delete window[cbName]; if (s.parentNode) s.parentNode.removeChild(s); }
    window[cbName] = function (data) { cleanup(); onOk(data); };
    var qs = Object.keys(params).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); });
    qs.push('callback=' + cbName);
    var s = document.createElement('script');
    s.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + qs.join('&');
    s.onerror = function () { cleanup(); if (onErr) onErr(); };
    document.body.appendChild(s);
  }

  /* ---------------- 대시보드 ---------------- */
  function renderDash() {
    app.innerHTML =
      '<div class="tabs">' +
        '<button class="tab' + (state.tab === '사전설문' ? ' active' : '') + '" data-tab="사전설문">사전 설문</button>' +
        '<button class="tab' + (state.tab === '사후설문' ? ' active' : '') + '" data-tab="사후설문">사후 설문</button>' +
        '<button class="tab' + (state.tab === '링크생성' ? ' active' : '') + '" data-tab="링크생성">🔗 학생 링크 생성</button>' +
        '<div style="flex:1"></div>' +
        '<button class="tab" id="reloadBtn">↻ 새로고침</button>' +
      '</div>' +
      '<div id="tabBody"></div>';
    Array.prototype.forEach.call(document.querySelectorAll('.tab[data-tab]'), function (t) {
      t.addEventListener('click', function () { state.tab = this.getAttribute('data-tab'); state.filter=''; renderDash(); });
    });
    el('reloadBtn').addEventListener('click', function () { doReload(); });
    renderTab();
  }

  function doReload() {
    if (!state.url) { state.data = loadDemo(); renderTab(); return; }
    jsonp(state.url, { action: 'data', pw: state.pw }, function (res) {
      if (res && res.ok) { state.data = res.sheets; renderTab(); }
    }, function () {});
  }

  function surveyForTab() { return state.tab === '사후설문' ? window.SURVEYS.post : window.SURVEYS.pre; }

  function renderTab() {
    var body = el('tabBody');
    if (state.tab === '링크생성') { renderLinkGen(body); return; }
    var grid = state.data[state.tab] || [];
    if (!grid.length || grid.length < 2) {
      body.innerHTML = '<div class="panel center muted" style="padding:40px">아직 제출된 응답이 없습니다.</div>';
      return;
    }
    var header = grid[0];
    var rows = grid.slice(1);
    var survey = surveyForTab();
    var qCols = survey.questions.filter(function (q) { return q.type !== 'section'; });

    // 통계 카드
    var lastTs = rows.length ? rows[rows.length - 1][0] : '-';
    var html =
      '<div class="stat-row">' +
        '<div class="stat"><div class="k">총 응답 수</div><div class="v">' + rows.length + '<small> 명</small></div></div>' +
        '<div class="stat"><div class="k">문항 수</div><div class="v">' + qCols.length + '<small> 문항</small></div></div>' +
        '<div class="stat"><div class="k">최근 제출</div><div class="v" style="font-size:16px">' + esc(lastTs) + '</div></div>' +
      '</div>';

    // 문항별 집계 (컬럼 index = 3 + i)
    var panels = '';
    qCols.forEach(function (q, i) {
      var colIdx = 3 + i;
      var vals = rows.map(function (r) { return r[colIdx]; });
      panels += '<div class="panel">' + renderQStat(q, i + 1, vals, rows) + '</div>';
    });

    // 원본 테이블
    var table = renderRawTable(header, rows);

    body.innerHTML = html + panels + table;
    bindTable(header, rows);
  }

  function renderQStat(q, no, vals, rows) {
    var head = '<h3>' + no + '. ' + esc(q.label) + '</h3>';
    var answered = vals.filter(function (v) { return v !== '' && v != null; });

    if (q.type === 'scale') {
      var nums = answered.map(Number).filter(function (n) { return n >= 1 && n <= 5; });
      var avg = nums.length ? (nums.reduce(function (a, b) { return a + b; }, 0) / nums.length) : 0;
      var dist = [0, 0, 0, 0, 0];
      nums.forEach(function (n) { dist[n - 1]++; });
      var max = Math.max.apply(null, dist.concat([1]));
      var bars = '';
      for (var v = 5; v >= 1; v--) {
        var c = dist[v - 1];
        bars += barRow(v + '점', c, nums.length, max);
      }
      return head + '<div class="qsub"><span class="avg-badge">평균 ' + avg.toFixed(2) + '<small>/ 5</small></span> &nbsp; 응답 ' + nums.length + '명</div>' + bars;
    }

    if (q.type === 'radio') {
      var counts = {}; (q.options || []).forEach(function (o) { counts[o] = 0; });
      var etc = 0;
      answered.forEach(function (v) {
        if (counts.hasOwnProperty(v)) counts[v]++;
        else etc++;
      });
      var maxr = Math.max.apply(null, Object.keys(counts).map(function (k) { return counts[k]; }).concat([etc, 1]));
      var b = (q.options || []).map(function (o) { return barRow(o, counts[o], answered.length, maxr); }).join('');
      if (q.other || etc) b += barRow('기타', etc, answered.length, maxr);
      return head + '<div class="qsub">응답 ' + answered.length + '명</div>' + b;
    }

    if (q.type === 'checkbox') {
      var cc = {}; (q.options || []).forEach(function (o) { cc[o] = 0; });
      var oth = 0, respCount = 0;
      answered.forEach(function (v) {
        respCount++;
        String(v).split(',').forEach(function (part) {
          var p = part.trim();
          if (!p) return;
          if (cc.hasOwnProperty(p)) cc[p]++;
          else if (/^기타/.test(p)) oth++;
          else oth++;
        });
      });
      var maxc = Math.max.apply(null, Object.keys(cc).map(function (k) { return cc[k]; }).concat([oth, 1]));
      var bb = (q.options || []).map(function (o) { return barRow(o, cc[o], respCount, maxc); }).join('');
      if (q.other || oth) bb += barRow('기타', oth, respCount, maxc);
      return head + '<div class="qsub">응답 ' + respCount + '명 (복수 선택)</div>' + bb;
    }

    // 텍스트
    var items = rows.map(function (r) {
      return { sid: r[1], text: r[3 + (no - 1)] };
    }).filter(function (x) { return x.text !== '' && x.text != null; });
    var list = items.length
      ? '<div class="txt-list">' + items.map(function (x) {
          return '<div class="item"><span class="sid">' + esc(x.sid) + '</span>' + esc(x.text) + '</div>';
        }).join('') + '</div>'
      : '<div class="qsub">응답 없음</div>';
    return head + '<div class="qsub">주관식 · ' + items.length + '건</div>' + list;
  }

  function barRow(name, cnt, total, max) {
    var pct = max ? Math.round((cnt / max) * 100) : 0;
    var share = total ? Math.round((cnt / total) * 100) : 0;
    return '<div class="bar-row"><div class="name">' + esc(name) + '</div>' +
      '<div class="track"><div class="fill" style="width:' + pct + '%"></div></div>' +
      '<div class="cnt">' + cnt + '명 · ' + share + '%</div></div>';
  }

  /* ---------------- 학생 링크 생성기 ---------------- */
  function defaultBase() {
    try { return location.origin + location.pathname.replace(/admin\.html.*$/, 'index.html'); }
    catch (e) { return 'index.html'; }
  }

  function renderLinkGen(body) {
    var savedBase = localStorage.getItem('pnu_link_base') || defaultBase();
    body.innerHTML =
      '<div class="panel">' +
        '<h3>학생 설문 링크 생성</h3>' +
        '<div class="qsub">학번 목록을 붙여넣으면 학생별 개인 링크를 만들어 줍니다. 풀리캠퍼스/문자/이메일로 배포하세요.</div>' +
        '<div class="grid2">' +
          '<div class="field"><label>설문 페이지 주소 (index.html)</label>' +
            '<input type="text" id="lgBase" value="' + esc(savedBase) + '" placeholder="https://호스팅주소/index.html"></div>' +
          '<div class="field"><label>대상 설문</label>' +
            '<select id="lgType" style="width:100%;padding:12px 14px;border:1.5px solid var(--line-normal);border-radius:var(--radius-12);font-family:var(--font);font-size:14.5px;background:#fff">' +
              '<option value="pre">사전 설문</option>' +
              '<option value="post">사후 설문</option>' +
              '<option value="">설문 선택 화면(사전/사후 고르기)</option>' +
            '</select></div>' +
        '</div>' +
        '<div class="field"><label>학번 목록 (한 줄에 하나 · "학번,이름" 형식도 가능)</label>' +
          '<textarea id="lgList" placeholder="202512345\n202512346,김철수\n202512347,이영희"></textarea></div>' +
        '<button class="btn btn-primary" id="lgGen" style="height:44px">링크 생성</button>' +
        '<div id="lgResult" style="margin-top:18px"></div>' +
      '</div>';

    el('lgGen').addEventListener('click', function () {
      var base = el('lgBase').value.trim();
      localStorage.setItem('pnu_link_base', base);
      var type = el('lgType').value;
      var lines = el('lgList').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      if (!base) { alert('설문 페이지 주소를 입력하세요.'); return; }
      if (!lines.length) { alert('학번 목록을 입력하세요.'); return; }

      var items = lines.map(function (line) {
        var parts = line.split(',');
        var sidv = (parts[0] || '').trim();
        var nm = (parts[1] || '').trim();
        var q = '?sid=' + encodeURIComponent(sidv);
        if (nm) q += '&name=' + encodeURIComponent(nm);
        if (type) q += '&type=' + type;
        return { sid: sidv, name: nm, url: base + q };
      });

      var rowsHtml = items.map(function (it) {
        return '<tr><td>' + esc(it.sid) + '</td><td>' + esc(it.name || '-') + '</td>' +
          '<td style="max-width:420px;overflow:hidden;text-overflow:ellipsis"><a href="' + esc(it.url) + '" target="_blank">' + esc(it.url) + '</a></td>' +
          '<td><button class="btn btn-line" style="height:30px;padding:0 12px;font-size:12px" data-copy="' + esc(it.url) + '">복사</button></td></tr>';
      }).join('');

      el('lgResult').innerHTML =
        '<div class="toolbar"><b>' + items.length + '명</b> 링크 생성됨' +
          '<div class="spacer"></div>' +
          '<button class="btn btn-line" id="lgCopyAll" style="height:36px;padding:0 14px;font-size:13px">전체 링크 복사</button>' +
          '<button class="btn btn-line" id="lgCsv" style="height:36px;padding:0 14px;font-size:13px">CSV 내보내기</button>' +
        '</div>' +
        '<div class="table-scroll"><table class="raw"><thead><tr><th>학번</th><th>이름</th><th>링크</th><th></th></tr></thead>' +
          '<tbody>' + rowsHtml + '</tbody></table></div>';

      Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (b) {
        b.addEventListener('click', function () { copyText(this.getAttribute('data-copy')); this.textContent = '복사됨'; });
      });
      el('lgCopyAll').addEventListener('click', function () {
        copyText(items.map(function (it) { return it.url; }).join('\n'));
        this.textContent = '복사됨';
      });
      el('lgCsv').addEventListener('click', function () {
        var header = ['학번', '이름', '링크'];
        var rows = items.map(function (it) { return [it.sid, it.name, it.url]; });
        exportCSVData('설문링크', header, rows);
      });
    });
  }

  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t); return; }
    var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function renderRawTable(header, rows) {
    return '<div class="panel">' +
      '<div class="toolbar">' +
        '<h3 style="margin:0">전체 응답 데이터</h3>' +
        '<div class="spacer"></div>' +
        '<input type="text" class="search" id="tblSearch" placeholder="학번/내용 검색">' +
        '<button class="btn btn-line" id="csvBtn" style="height:38px;padding:0 16px;font-size:13px">CSV 내보내기</button>' +
      '</div>' +
      '<div class="table-scroll"><table class="raw" id="rawTable"></table></div>' +
    '</div>';
  }

  function bindTable(header, rows) {
    function draw() {
      var f = state.filter.toLowerCase();
      var shown = rows.filter(function (r) {
        return !f || r.join(' ').toLowerCase().indexOf(f) >= 0;
      });
      var thead = '<thead><tr>' + header.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead>';
      var tbody = '<tbody>' + shown.map(function (r) {
        return '<tr>' + header.map(function (_, i) { return '<td>' + esc(r[i] == null ? '' : r[i]) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody>';
      el('rawTable').innerHTML = thead + tbody;
    }
    draw();
    el('tblSearch').addEventListener('input', function () { state.filter = this.value; draw(); });
    el('csvBtn').addEventListener('click', function () { exportCSV(header, rows); });
  }

  function exportCSV(header, rows) {
    exportCSVData(state.tab, header, rows);
  }

  function exportCSVData(name, header, rows) {
    var all = [header].concat(rows);
    var csv = all.map(function (r) {
      return r.map(function (c) {
        var s = String(c == null ? '' : c);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',');
    }).join('\r\n');
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name + '_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  renderLogin();
})();
