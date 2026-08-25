/* =====================================================================
 * app.js — 학생 설문 화면 로직
 * ===================================================================== */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  // 풀리캠퍼스에서 ?sid=학번 형태로 전달. 호환을 위해 여러 키 허용.
  var sid = (params.get('sid') || params.get('student_id') || params.get('studentId') || params.get('hakbun') || '').trim();
  var type = (params.get('type') || '').trim().toLowerCase();
  var name = (params.get('name') || params.get('nm') || '').trim();

  var app = document.getElementById('app');
  var whoBox = document.getElementById('whoBox');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(id) { return document.getElementById(id); }

  /* ---------------- 설문 기간 ---------------- */
  function getPeriod(t) {
    var p = (window.CONFIG && window.CONFIG.PERIODS && window.CONFIG.PERIODS[t]) || {};
    return {
      start: p.start ? new Date(p.start) : null,
      end: p.end ? new Date(p.end) : null,
    };
  }
  function getStatus(t) {
    var pr = getPeriod(t);
    var now = new Date();
    if (pr.start && now < pr.start) return 'before';
    if (pr.end && now > pr.end) return 'closed';
    return 'open';
  }
  function fmtDate(d) {
    if (!d || isNaN(d.getTime())) return '';
    var p = function (n) { return ('0' + n).slice(-2); };
    return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function periodText(t) {
    var pr = getPeriod(t);
    if (pr.start && pr.end) return fmtDate(pr.start) + ' ~ ' + fmtDate(pr.end);
    if (pr.end) return fmtDate(pr.end) + ' 까지';
    if (pr.start) return fmtDate(pr.start) + ' 부터';
    return '';
  }
  var STATUS_LABEL = { open: '진행중', before: '시작 전', closed: '마감' };

  function renderWho() {
    if (sid) {
      whoBox.innerHTML = '학번 <b>' + esc(sid) + '</b>' + (name ? ' · ' + esc(name) : '');
    } else {
      whoBox.innerHTML = '';
    }
  }

  /* ---------------- 설문 선택 화면 ---------------- */
  function pickCard(type, icon, icClass, title, desc) {
    var q = sid ? ('?sid=' + encodeURIComponent(sid) + (name ? '&name=' + encodeURIComponent(name) : '')) : '';
    var st = getStatus(type);
    var pt = periodText(type);
    return '<a class="pick-card" href="index.html' + (q ? q + '&' : '?') + 'type=' + type + '">' +
        '<div class="ic-row"><div class="ic ' + icClass + '">' + icon + '</div>' +
          '<span class="pick-badge ' + st + '">' + STATUS_LABEL[st] + '</span></div>' +
        '<h3>' + title + '</h3>' +
        '<p>' + desc + '</p>' +
        (pt ? '<div class="period-line">📅 ' + esc(pt) + '</div>' : '') +
      '</a>';
  }
  function renderPicker() {
    app.innerHTML =
      '<div class="hero">' +
        '<span class="tag">부산대학교 · AI 기반 수학 학습 지원 시스템</span>' +
        '<h1>수학 학습 설문에 참여해 주세요</h1>' +
        '<p>아래에서 진행할 설문을 선택하세요. 응답 내용은 연구·수업 개선 목적으로만 활용됩니다.</p>' +
      '</div>' +
      (sid ? '' :
        '<div class="banner warn">⚠️ 학번 정보가 확인되지 않았습니다. 풀리캠퍼스에서 접속하면 학번이 자동 연동됩니다. 테스트 시에는 설문 화면에서 학번을 입력할 수 있습니다.</div>') +
      '<div class="pick-grid">' +
        pickCard('pre', '📝', 'pre', '사전 설문조사', '수업 시작 전, 수학 학습 배경과 기대를 확인합니다.<br>16문항 · 약 5분') +
        pickCard('post', '✅', 'post', '사후 설문조사', '수업 이후, AI 기반 학습 경험을 평가합니다.<br>20문항 · 약 5~7분') +
      '</div>';
  }

  /* ---------------- 기간 잠금 화면 ---------------- */
  function renderNotice(survey, status) {
    var pt = periodText(survey.key);
    var icon = status === 'before' ? '⏳' : '🔒';
    var head = status === 'before' ? '아직 설문 시작 전이에요' : '설문이 마감되었습니다';
    var sub = status === 'before'
      ? '설문 기간이 시작되면 다시 접속해 주세요.'
      : '설문 응답 기간이 종료되었습니다. 참여해 주셔서 감사합니다.';
    app.innerHTML =
      '<div class="done">' +
        '<div class="check" style="background:var(--fill-warning-weak);color:var(--fill-warning)">' + icon + '</div>' +
        '<h2>' + head + '</h2>' +
        '<p>' + sub + '</p>' +
        '<p class="muted">' + esc(survey.title) + '</p>' +
        (pt ? '<p class="muted">설문 기간 · ' + esc(pt) + '</p>' : '') +
        '<div style="margin-top:24px">' +
          '<a class="btn btn-line" href="index.html' + (sid ? '?sid=' + encodeURIComponent(sid) : '') + '">← 설문 선택으로</a>' +
        '</div>' +
      '</div>';
  }

  /* ---------------- 문항 렌더링 ---------------- */
  function scaleHTML(qq) {
    var pts = qq.scalePoints || window.SCALE_POINTS;
    var labels = qq.scaleLabels || (qq.scalePoints ? [qq.scalePoints[0], qq.scalePoints[4]] : window.SCALE_DEFAULT);
    var opts = '';
    for (var v = 1; v <= 5; v++) {
      opts +=
        '<div class="opt">' +
          '<input type="radio" id="' + qq.id + '_' + v + '" name="' + qq.id + '" value="' + v + '">' +
          '<label for="' + qq.id + '_' + v + '">' +
            '<span class="dot">' + v + '</span>' +
            '<span class="txt">' + esc(pts[v - 1]) + '</span>' +
          '</label>' +
        '</div>';
    }
    return '<div class="scale" data-q="' + qq.id + '">' + opts + '</div>' +
      '<div class="scale-ends"><span>' + esc(labels[0]) + '</span><span>' + esc(labels[1]) + '</span></div>';
  }

  var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function choiceHTML(qq, multi) {
    var cls = multi ? 'check' : 'radio';
    var typ = multi ? 'checkbox' : 'radio';
    var html = '<div class="choices" data-q="' + qq.id + '">';
    var opts = qq.options.slice();
    if (qq.other) opts.push('__OTHER__');
    opts.forEach(function (opt, i) {
      var isOther = opt === '__OTHER__';
      var id = qq.id + '_' + i;
      var val = isOther ? '기타' : opt;
      html +=
        '<div class="choice ' + cls + '">' +
          '<input type="' + typ + '" id="' + id + '" name="' + qq.id + '" value="' + esc(val) + '"' +
            (isOther ? ' data-other="1"' : '') + '>' +
          '<label for="' + id + '"><span class="box">' + CHECK_SVG + '</span>' +
            '<span>' + (isOther ? '기타' : esc(opt)) + '</span></label>' +
        '</div>';
    });
    if (qq.other) {
      html += '<div class="other-input hidden" data-other-for="' + qq.id + '">' +
        '<input type="text" placeholder="기타 내용을 입력하세요" data-other-input="' + qq.id + '"></div>';
    }
    html += '</div>';
    return html;
  }

  function textHTML(qq) {
    if (qq.type === 'long') {
      return '<textarea data-q="' + qq.id + '" placeholder="' + esc(qq.placeholder || '') + '"></textarea>';
    }
    return '<input type="text" data-q="' + qq.id + '" placeholder="' + esc(qq.placeholder || '') + '">';
  }

  // 종속 문항(예: 분반) — 상위 문항(과목) 선택에 따라 보기가 채워짐
  function dependentHTML(qq) {
    return '<div class="choices" data-q="' + qq.id + '">' +
      '<div class="dep-hint muted" style="font-size:13px;padding:2px 0">↑ 먼저 위에서 과목을 선택하면 분반이 표시됩니다.</div>' +
      '</div>';
  }

  function renderDependentOptions(qq, parentValue) {
    var container = document.querySelector('.choices[data-q="' + qq.id + '"]');
    if (!container) return;
    var map = window[qq.optionsBy] || {};
    var list = parentValue ? map[parentValue] : null;
    if (!parentValue) {
      container.innerHTML = '<div class="dep-hint muted" style="font-size:13px;padding:2px 0">↑ 먼저 위에서 과목을 선택하면 분반이 표시됩니다.</div>';
      return;
    }
    if (!list || !list.length) {
      container.innerHTML = '<div class="dep-hint muted" style="font-size:13px;padding:2px 0">선택한 과목의 분반 정보가 없습니다.</div>';
      return;
    }
    var html = '';
    list.forEach(function (item, i) {
      var num = Array.isArray(item) ? item[0] : item;
      var prof = Array.isArray(item) ? item[1] : '';
      var id = qq.id + '_' + i;
      var val = num + '분반' + (prof ? ' (' + prof + ' 교수님)' : '');
      html +=
        '<div class="choice radio">' +
          '<input type="radio" id="' + id + '" name="' + qq.id + '" value="' + esc(val) + '">' +
          '<label for="' + id + '"><span class="box">' + CHECK_SVG + '</span><span>' + esc(val) + '</span></label>' +
        '</div>';
    });
    container.innerHTML = html;
  }

  function handleDependents(target, survey) {
    if (!target || !target.name) return;
    survey.questions.forEach(function (q) {
      if (q.type === 'dependent' && q.dependsOn === target.name) {
        renderDependentOptions(q, getValue(findQ(survey, q.dependsOn)));
      }
    });
  }

  function renderSurvey(survey) {
    var status = getStatus(survey.key);
    if (status !== 'open') { renderNotice(survey, status); return; }

    var sectionCount = 0;
    var qNo = 0;
    var body = '';

    survey.questions.forEach(function (item) {
      if (item.type === 'section') {
        sectionCount++;
        body +=
          '<div class="section-head">' +
            '<span class="num">STEP ' + sectionCount + '</span>' +
            '<h2>' + esc(item.label) + '</h2>' +
          '</div>';
        return;
      }
      qNo++;
      var control = '';
      if (item.type === 'scale') control = scaleHTML(item);
      else if (item.type === 'radio') control = choiceHTML(item, false);
      else if (item.type === 'checkbox') control = choiceHTML(item, true);
      else if (item.type === 'dependent') control = dependentHTML(item);
      else control = textHTML(item);

      body +=
        '<div class="qcard" data-card="' + item.id + '">' +
          '<div class="qlabel"><span class="qno">' + qNo + '.</span>' + esc(item.label) +
            (item.required ? '<span class="req">*</span>' : '') + '</div>' +
          control +
        '</div>';
    });

    var totalRequired = survey.questions.filter(function (q) { return q.type !== 'section' && q.required; }).length;

    app.innerHTML =
      '<div class="hero">' +
        '<span class="tag">부산대학교 · AI 기반 수학 학습 지원 시스템</span>' +
        '<h1>' + esc(survey.title) + '</h1>' +
        '<p>' + esc(survey.subtitle) + '</p>' +
        (periodText(survey.key) ? '<div class="period">📅 설문 기간 · ' + esc(periodText(survey.key)) + '</div>' : '') +
      '</div>' +
      (sid ? '' :
        '<div class="banner warn">⚠️ 학번이 연동되지 않았습니다. 아래에 학번을 입력해 주세요. (풀리캠퍼스에서 접속하면 자동 연동됩니다)' +
          '<div class="sid-inline"><input type="text" id="sidInput" placeholder="학번 입력" inputmode="numeric"></div>' +
        '</div>') +
      '<div class="progress-wrap">' +
        '<div class="progress-top"><span class="lbl">응답 진행률</span><span class="pct" id="pct">0%</span></div>' +
        '<div class="progress-track"><div class="progress-fill" id="pfill"></div></div>' +
      '</div>' +
      '<div id="qbody">' + body + '</div>' +
      '<div style="margin-top:20px">' +
        '<a class="btn btn-line" href="index.html' + (sid ? '?sid=' + encodeURIComponent(sid) : '') + '">← 설문 선택으로</a>' +
      '</div>';

    // 하단 고정 제출바
    var bar = document.createElement('div');
    bar.className = 'submitbar';
    bar.innerHTML =
      '<div class="inner">' +
        '<div class="status" id="subStatus">필수 문항 <b id="cntNow">0</b> / ' + totalRequired + ' 응답</div>' +
        '<button class="btn btn-primary" id="submitBtn">설문 제출하기</button>' +
      '</div>';
    document.body.appendChild(bar);

    if (el('sidInput')) {
      el('sidInput').addEventListener('input', function () { sid = this.value.trim(); renderWho(); });
    }

    app.addEventListener('change', function (e) {
      handleOtherToggle(e.target, survey);
      handleDependents(e.target, survey);
      updateProgress(survey, totalRequired);
    });
    app.addEventListener('input', function (e) {
      if (e.target.matches('textarea,[data-q],[data-other-input]')) updateProgress(survey, totalRequired);
    });
    el('submitBtn').addEventListener('click', function () { onSubmit(survey); });
    updateProgress(survey, totalRequired);
  }

  function handleOtherToggle(target, survey) {
    if (!target.name) return;
    var qq = findQ(survey, target.name);
    if (!qq || !qq.other) return;
    var wrap = document.querySelector('[data-other-for="' + qq.id + '"]');
    if (!wrap) return;
    var otherRadio = document.querySelector('input[name="' + qq.id + '"][data-other]');
    var checked = otherRadio && otherRadio.checked;
    wrap.classList.toggle('hidden', !checked);
    if (checked) { var inp = wrap.querySelector('input'); if (inp) inp.focus(); }
  }

  function findQ(survey, id) {
    return survey.questions.filter(function (q) { return q.id === id; })[0];
  }

  /* ---------------- 값 추출 ---------------- */
  function getValue(qq) {
    if (qq.type === 'scale' || qq.type === 'radio' || qq.type === 'dependent') {
      var sel = document.querySelector('input[name="' + qq.id + '"]:checked');
      if (!sel) return '';
      if (qq.other && sel.hasAttribute('data-other')) {
        var t = document.querySelector('[data-other-input="' + qq.id + '"]');
        return '기타: ' + ((t && t.value.trim()) || '');
      }
      return sel.value;
    }
    if (qq.type === 'checkbox') {
      var arr = [];
      document.querySelectorAll('input[name="' + qq.id + '"]:checked').forEach(function (c) {
        if (qq.other && c.hasAttribute('data-other')) {
          var t = document.querySelector('[data-other-input="' + qq.id + '"]');
          arr.push('기타: ' + ((t && t.value.trim()) || ''));
        } else arr.push(c.value);
      });
      return arr.join(', ');
    }
    var f = document.querySelector('[data-q="' + qq.id + '"]');
    return f ? f.value.trim() : '';
  }

  function isAnswered(qq) {
    var v = getValue(qq);
    if (qq.type === 'checkbox') return v.length > 0;
    if ((qq.type === 'radio' || qq.type === 'scale') && qq.other) {
      // 기타 선택 시 내용까지 있어야 완료로 간주
      if (/^기타:\s*$/.test(v)) return false;
    }
    return v !== '';
  }

  function updateProgress(survey, totalRequired) {
    var done = 0;
    survey.questions.forEach(function (qq) {
      if (qq.type === 'section') return;
      var card = document.querySelector('[data-card="' + qq.id + '"]');
      var ans = isAnswered(qq);
      if (card) {
        card.classList.toggle('answered', ans);
        if (ans) card.classList.remove('invalid');
      }
      if (qq.required && ans) done++;
    });
    var pct = totalRequired ? Math.round((done / totalRequired) * 100) : 100;
    el('pct').textContent = pct + '%';
    el('pfill').style.width = pct + '%';
    el('cntNow').textContent = done;
  }

  /* ---------------- 제출 ---------------- */
  function onSubmit(survey) {
    // 기간 재확인 (작성 중 마감된 경우 차단)
    var status = getStatus(survey.key);
    if (status !== 'open') { renderNotice(survey, status); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }

    // 학번 확인
    if (!sid) {
      var si = el('sidInput');
      if (si) sid = si.value.trim();
    }
    if (!sid) {
      alert('학번이 확인되지 않았습니다. 학번을 입력해 주세요.');
      var si2 = el('sidInput'); if (si2) si2.focus();
      return;
    }

    // 필수 검증
    var firstInvalid = null;
    survey.questions.forEach(function (qq) {
      if (qq.type === 'section' || !qq.required) return;
      var card = document.querySelector('[data-card="' + qq.id + '"]');
      if (!isAnswered(qq)) {
        if (card) card.classList.add('invalid');
        if (!firstInvalid) firstInvalid = card;
      }
    });
    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      flashStatus('아직 응답하지 않은 필수 문항이 있습니다.', true);
      return;
    }

    // 페이로드 구성
    var columns = [], row = [];
    var qNo = 0;
    survey.questions.forEach(function (qq) {
      if (qq.type === 'section') return;
      qNo++;
      columns.push(qNo + '. ' + qq.label);
      row.push(getValue(qq));
    });

    var payload = { action: 'submit', type: survey.key, sheet: survey.sheet, sid: sid, name: name, columns: columns, row: row };

    var btn = el('submitBtn');
    btn.disabled = true; btn.textContent = '제출 중…';

    submit(payload).then(function (res) {
      renderDone(survey, res);
    }).catch(function (err) {
      btn.disabled = false; btn.textContent = '설문 제출하기';
      flashStatus('제출에 실패했습니다: ' + (err && err.message ? err.message : err), true);
    });
  }

  function submit(payload) {
    var url = (window.CONFIG && window.CONFIG.GAS_URL || '').trim();
    if (!url) {
      // 데모 모드: localStorage 저장
      return new Promise(function (resolve) {
        var key = 'pnu_survey_demo';
        var store = JSON.parse(localStorage.getItem(key) || '{}');
        store[payload.type] = store[payload.type] || {};
        store[payload.type][payload.sid] = { ts: new Date().toISOString(), columns: payload.columns, row: payload.row, name: payload.name };
        localStorage.setItem(key, JSON.stringify(store));
        setTimeout(function () { resolve({ ok: true, demo: true }); }, 500);
      });
    }
    // Apps Script 웹앱은 CORS 응답 헤더가 없으므로 no-cors 로 전송(쓰기 전용).
    // Content-Type text/plain → preflight 없음. 응답 본문은 읽지 않고 성공 처리.
    return fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    }).then(function () {
      return { ok: true };
    });
  }

  function flashStatus(msg, isErr) {
    var s = el('subStatus');
    if (!s) return;
    s.innerHTML = (isErr ? '⚠️ ' : '') + esc(msg);
    s.style.color = isErr ? 'var(--fill-danger)' : 'var(--text-sub)';
  }

  function renderDone(survey, res) {
    var bar = document.querySelector('.submitbar');
    if (bar) bar.remove();
    app.innerHTML =
      '<div class="done">' +
        '<div class="check">✓</div>' +
        '<h2>설문이 제출되었습니다</h2>' +
        '<p>소중한 의견에 감사드립니다.</p>' +
        '<p class="muted">' + esc(survey.title) + '</p>' +
        '<p class="muted">학번 ' + esc(sid) + '</p>' +
        (res && res.demo ? '<div class="banner info" style="margin-top:18px;text-align:left">데모 모드로 저장되었습니다. (config.js 의 GAS_URL 미설정) 실제 저장은 Apps Script 배포 후 동작합니다.</div>' : '') +
        (res && res.mode === 'update' ? '<div class="banner info" style="margin-top:18px">기존 응답이 최신 내용으로 업데이트되었습니다.</div>' : '') +
        '<div style="margin-top:24px">' +
          '<a class="btn btn-line" href="index.html' + (sid ? '?sid=' + encodeURIComponent(sid) : '') + '">다른 설문 하기</a>' +
        '</div>' +
      '</div>';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- 진입 ---------------- */
  renderWho();
  if (type === 'pre' || type === 'post') {
    renderSurvey(window.SURVEYS[type]);
  } else {
    renderPicker();
  }
})();
