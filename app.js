/* Smart Harvest survey – frontend logic (no libraries, no build step). */
(function () {
  'use strict';

  var CFG = window.SMART_HARVEST_CONFIG || {};
  var ENDPOINT = String(CFG.ENDPOINT_URL || '');
  var TIMEOUT_MS = Number(CFG.REQUEST_TIMEOUT_MS) || 20000;
  var DRAFT_KEY = 'smartHarvest.draft.v1';
  var DONE_KEY = 'smartHarvest.done.v1';
  var TOTAL_STEPS = 11; // 10 questions + 1 ranking
  var ENDPOINT_PATTERN = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;

  // ── Survey content ────────────────────────────────────────────────────────
  var OPTIONS = [
    { value: 'Yes',   en: 'Yes',   ms: 'Ya',      emoji: '👍' },
    { value: 'No',    en: 'No',    ms: 'Tidak',   emoji: '👎' },
    { value: 'Maybe', en: 'Maybe', ms: 'Mungkin', emoji: '🤔' }
  ];

  var QUESTIONS = [
    { key: 'Q1',  emoji: '🦾', en: 'Would you use a robotic arm to help pick tomatoes?',
      ms: 'Adakah awda akan menggunakan lengan robot untuk membantu memetik tomato?' },
    { key: 'Q2',  emoji: '🍅', en: 'Would you like a robot that can identify ripe, red tomatoes?',
      ms: 'Adakah awda mahu robot yang boleh mengenal pasti tomato yang masak dan merah?' },
    { key: 'Q3',  emoji: '✨', en: 'Do you think a robotic arm could make tomato harvesting easier?',
      ms: 'Adakah awda fikir lengan robot boleh memudahkan penuaian tomato?' },
    { key: 'Q4',  emoji: '💰', en: 'Would you use a tomato-picking robot if it was affordable?',
      ms: 'Adakah awda akan menggunakan robot pemetik tomato kalau harganya berpatutan?' },
    { key: 'Q5',  emoji: '🌱', en: 'Would you like the robot to pick ripe tomatoes and leave green tomatoes on the plant?',
      ms: 'Adakah awda mahu robot memetik tomato yang masak dan membiarkan tomato yang hijau pada pokok?' },
    { key: 'Q6',  emoji: '👩‍🌾', en: 'Do you think a robotic arm for tomato harvesting would be easy for farmers to use?',
      ms: 'Adakah awda fikir lengan robot untuk menuai tomato mudah digunakan oleh petani?' },
    { key: 'Q7',  emoji: '🤝', en: 'Would you recommend a tomato-picking robot to other farmers?',
      ms: 'Adakah awda akan mengesyorkan robot pemetik tomato kepada petani lain?' },
    { key: 'Q8',  emoji: '🌴', en: 'Do you think a tomato-picking robot would be useful for farms in Brunei?',
      ms: 'Adakah awda fikir robot pemetik tomato berguna untuk ladang-ladang di Brunei?' },
    { key: 'Q9',  emoji: '🔍', en: 'Would you trust a robot to identify which tomatoes are ripe?',
      ms: 'Adakah awda akan mempercayai robot untuk mengenal pasti tomato yang mana masak?' },
    { key: 'Q10', emoji: '👀', en: 'Would you be interested in seeing a demonstration of a tomato-picking robot?',
      ms: 'Adakah awda berminat untuk melihat demonstrasi robot pemetik tomato?' }
  ];

  var FEATURES = [
    { key: 'F1',  en: 'Identifies ripe, red tomatoes',         ms: 'Mengenal pasti tomato yang masak dan merah' },
    { key: 'F2',  en: 'Affordable price',                      ms: 'Harga yang berpatutan' },
    { key: 'F3',  en: 'Easy for farmers to use',               ms: 'Mudah digunakan oleh petani' },
    { key: 'F4',  en: 'Helps reduce harvesting time',          ms: 'Membantu mengurangkan masa menuai' },
    { key: 'F5',  en: 'Minimises damage to tomatoes',          ms: 'Mengurangkan kerosakan pada tomato' },
    { key: 'F6',  en: 'Easy to control manually',              ms: 'Mudah dikawal secara manual' },
    { key: 'F7',  en: 'Works without an internet connection',  ms: 'Berfungsi tanpa sambungan internet' },
    { key: 'F8',  en: 'Can be used on small farms',            ms: 'Boleh digunakan di ladang kecil' },
    { key: 'F9',  en: 'Easy to maintain and repair',           ms: 'Mudah diselenggara dan dibaiki' },
    { key: 'F10', en: 'Safe to operate',                       ms: 'Selamat dikendalikan' }
  ];
  var FEATURE_BY_KEY = {};
  FEATURES.forEach(function (f) { FEATURE_BY_KEY[f.key] = f; });

  // ── State ─────────────────────────────────────────────────────────────────
  var stage = document.getElementById('stage');
  var topbar = document.getElementById('topbar');
  var progressFill = document.getElementById('progressFill');
  var progressBar = document.getElementById('progressBar');
  var progressLabel = document.getElementById('progressLabel');

  var state = loadDraft() || freshState();
  var submitting = false;

  // If a half-finished survey was restored (e.g. after a page refresh), always show the
  // welcome page first and offer "Continue" so nobody is dropped into the middle by surprise.
  state.resumeStep = (state.step >= 1 && state.step <= 11 && Object.keys(state.answers).length > 0) ? state.step : 0;
  state.step = 0;

  function freshState() {
    return { step: 0, answers: {}, order: shuffledKeys(), confirmed: false, submissionId: null };
  }

  function shuffledKeys() {
    var keys = FEATURES.map(function (f) { return f.key; });
    for (var i = keys.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = keys[i]; keys[i] = keys[j]; keys[j] = t;
    }
    return keys;
  }

  function newId() {
    var uuid;
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      uuid = window.crypto.randomUUID();
    } else {
      var bytes = new Uint8Array(16);
      (window.crypto || window.msCrypto).getRandomValues(bytes);
      uuid = Array.prototype.map.call(bytes, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    }
    return 'SH-' + uuid;
  }

  // ── Storage helpers (wrapped: private browsing can block storage) ─────────
  function saveDraft() {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  function clearDraft() {
    try { sessionStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
  }
  function loadDraft() {
    try {
      var raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      var validOrder = Array.isArray(s.order) && s.order.length === FEATURES.length &&
        FEATURES.every(function (f) { return s.order.indexOf(f.key) !== -1; });
      var validAnswers = s.answers && typeof s.answers === 'object' &&
        Object.keys(s.answers).every(function (k) {
          return /^Q([1-9]|10)$/.test(k) && OPTIONS.some(function (o) { return o.value === s.answers[k]; });
        });
      if (!validOrder || !validAnswers || typeof s.step !== 'number' || s.step < 0 || s.step > TOTAL_STEPS) return null;
      s.confirmed = !!s.confirmed;
      s.submissionId = typeof s.submissionId === 'string' ? s.submissionId : null;
      return s;
    } catch (e) { return null; }
  }
  function alreadyDone() {
    try { return !!localStorage.getItem(DONE_KEY); } catch (e) { return false; }
  }
  function markDone() {
    try { localStorage.setItem(DONE_KEY, String(Date.now())); } catch (e) { /* ignore */ }
  }

  // Two-line button label: English on top, Malay underneath.
  function biLabel(en, ms) {
    return '<span class="b-txt"><span class="b-en">' + esc(en) + '</span><span class="b-ms">' + esc(ms) + '</span></span>';
  }

  // ── Tiny DOM helpers ──────────────────────────────────────────────────────
  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ── Navigation / rendering ────────────────────────────────────────────────
  function go(step, dir) {
    state.step = step;
    if (step < 12) saveDraft();
    render(dir || 'fwd');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function render(dir) {
    stage.innerHTML = '';
    var screen;
    if (state.step === 0) screen = welcomeScreen();
    else if (state.step >= 1 && state.step <= 10) screen = questionScreen(state.step);
    else if (state.step === 11) screen = rankScreen();
    else screen = thanksScreen();

    screen.classList.add('screen', dir === 'back' ? 'enter-back' : 'enter-fwd');
    stage.appendChild(screen);
    updateProgress();

    var heading = screen.querySelector('h1, h2');
    if (heading) { heading.setAttribute('tabindex', '-1'); if (state.step !== 0) heading.focus({ preventScroll: true }); }
  }

  function updateProgress() {
    if (state.step === 0) { topbar.hidden = true; return; }
    topbar.hidden = false;
    var n = Math.min(state.step, TOTAL_STEPS);
    var done = state.step === 12;
    progressFill.style.width = (done ? 100 : Math.round(((n - 1) / TOTAL_STEPS) * 100 + (100 / TOTAL_STEPS) * 0.5)) + '%';
    progressBar.setAttribute('aria-valuenow', done ? TOTAL_STEPS : n - 1);
    progressLabel.textContent = done ? 'Done · Selesai' : (n === TOTAL_STEPS ? 'Last question · Soalan akhir' : 'Question ' + n + ' of ' + TOTAL_STEPS + ' · Soalan ' + n);
  }

  // ── Welcome ───────────────────────────────────────────────────────────────
  function hasDraftProgress() {
    return state.resumeStep >= 1 && state.resumeStep <= 11;
  }

  function welcomeScreen() {
    var resume = hasDraftProgress();
    var node = el(
      '<section class="card welcome">' +
        '<div class="hero-art">' + window.SH_ART.hero() + '</div>' +
        '<p class="eyebrow">Market research survey · Tinjauan pasaran</p>' +
        '<h1>Smart Harvest 🍅</h1>' +
        '<p class="lead">Help us design a robot that picks ripe tomatoes. It takes about 3 minutes.</p>' +
        '<p class="lead ms">Bantu kami mereka bentuk robot yang memetik tomato masak. Ia mengambil masa lebih kurang 3 minit.</p>' +
        '<ul class="facts"><li>10 quick questions · <em>10 soalan ringkas</em></li><li>1 ranking · <em>1 susunan</em></li><li>Anonymous · <em>Tanpa nama</em></li></ul>' +
        (alreadyDone() ? '<p class="notice">It looks like you already completed this survey on this device — thank you! You are welcome to answer again for another person.<br><span class="ms">Nampaknya awda sudah melengkapkan tinjauan ini pada peranti ini — terima kasih! Awda dipersilakan menjawab lagi untuk orang lain.</span></p>' : '') +
        '<div class="nav" style="justify-content:center;flex-direction:column;margin-top:22px">' +
          '<button class="btn primary" id="start" type="button">' + (resume ? biLabel('Continue →', 'Sambung') : biLabel('Start →', 'Mula')) + '</button>' +
          (resume ? '<button class="btn link" id="restart" type="button">Start over · Mula semula</button>' : '') +
        '</div>' +
        '<p class="privacy">We do not ask for your name, email, phone number or location. Your answers are only used for this research.<br>' +
        '<span class="ms">Kami tidak meminta nama, e-mel, nombor telefon atau lokasi awda. Jawapan awda hanya digunakan untuk kajian ini.</span></p>' +
      '</section>'
    );
    node.querySelector('#start').addEventListener('click', function () {
      if (!state.submissionId) state.submissionId = newId();
      go(resume ? state.resumeStep : 1, 'fwd');
    });
    var restartBtn = node.querySelector('#restart');
    if (restartBtn) {
      restartBtn.addEventListener('click', function () {
        state = freshState();
        clearDraft();
        render('back');
      });
    }
    return node;
  }

  // ── Question screens ──────────────────────────────────────────────────────
  function questionScreen(n) {
    var q = QUESTIONS[n - 1];
    var current = state.answers[q.key] || null;

    var optionsHtml = OPTIONS.map(function (o) {
      return '<label class="opt"><input type="radio" name="' + q.key + '" value="' + o.value + '"' + (current === o.value ? ' checked' : '') + '>' +
        '<span class="opt-body"><span class="opt-emoji" aria-hidden="true">' + o.emoji + '</span>' +
        '<span class="opt-text"><span class="opt-en">' + esc(o.en) + '</span><span class="opt-ms">' + esc(o.ms) + '</span></span>' +
        '<span class="opt-check" aria-hidden="true">✓</span></span></label>';
    }).join('');

    var node = el(
      '<section class="card">' +
        '<div class="q-badge" aria-hidden="true">' + q.emoji + '</div>' +
        '<div class="q-count">Question ' + n + ' of ' + TOTAL_STEPS + ' · Soalan ' + n + '</div>' +
        '<h2 class="q-en">' + esc(q.en) + '</h2>' +
        '<p class="q-ms ms">' + esc(q.ms) + '</p>' +
        '<fieldset class="options"><legend>' + esc(q.en) + '</legend>' + optionsHtml + '</fieldset>' +
        '<div class="nav">' +
          '<button class="btn ghost" id="back" type="button">' + biLabel('← Back', 'Kembali') + '</button>' +
          '<button class="btn primary" id="next" type="button"' + (current ? '' : ' disabled') + '>' + biLabel('Next →', 'Seterusnya') + '</button>' +
        '</div>' +
      '</section>'
    );

    var nextBtn = node.querySelector('#next');
    node.querySelectorAll('input[type=radio]').forEach(function (input) {
      input.addEventListener('change', function () {
        state.answers[q.key] = input.value;
        saveDraft();
        nextBtn.disabled = false;
      });
    });
    node.querySelector('#back').addEventListener('click', function () { go(n - 1, 'back'); });
    nextBtn.addEventListener('click', function () {
      if (state.answers[q.key]) go(n + 1, 'fwd');
    });
    return node;
  }

  // ── Ranking screen (drag-and-drop + up/down buttons) ──────────────────────
  function rankScreen() {
    var node = el(
      '<section class="card">' +
        '<div class="q-badge" aria-hidden="true">🏆</div>' +
        '<div class="q-count">Last question · Soalan akhir</div>' +
        '<h2 class="q-en">Which robot features matter most to you?</h2>' +
        '<p class="q-ms ms">Ciri-ciri robot yang mana paling penting bagi awda?</p>' +
        '<p class="rank-help">Drag the <strong>⋮⋮</strong> handle (or use the ▲ ▼ buttons) to put the <strong>most important feature at the top</strong>. Every feature gets its own place from 1 to 10.</p>' +
        '<p class="rank-help ms">Seret pemegang <strong>⋮⋮</strong> (atau gunakan butang ▲ ▼) untuk meletakkan <strong>ciri yang paling penting di atas</strong>. Setiap ciri mendapat kedudukan sendiri dari 1 hingga 10.</p>' +
        '<div class="rank-scale" aria-hidden="true"><span>1 = Most important · Paling penting</span><span>10 = Least · Paling kurang</span></div>' +
        '<ol class="rank-list" id="rankList"></ol>' +
        '<div class="sr-only" id="rankLive" aria-live="polite" style="position:absolute;left:-9999px"></div>' +
        '<div class="hp" aria-hidden="true"><label>Leave this field empty<input type="text" name="website" id="website" tabindex="-1" autocomplete="off"></label></div>' +
        '<div class="confirm-row" id="confirmRow"></div>' +
        '<div class="suggest-box" style="margin-top:22px">' +
          '<label for="suggestion" style="display:block;font-weight:700;margin-bottom:4px">💬 Any other ideas or suggestions about the robot? (Optional)</label>' +
          '<p class="ms" style="margin:0 0 8px">Ada idea atau cadangan lain tentang robot ini? (Pilihan)</p>' +
          '<textarea id="suggestion" rows="4" maxlength="500" placeholder="Write here… / Tulis di sini…" style="width:100%;box-sizing:border-box;padding:12px;border-radius:12px;border:1.5px solid #e2d6c4;font:inherit;font-size:16px;resize:vertical;background:#fff"></textarea>' +
        '</div>' +
        '<div id="errorBox" role="alert"></div>' +
        '<div class="nav">' +
          '<button class="btn ghost" id="back" type="button">' + biLabel('← Back', 'Kembali') + '</button>' +
          '<button class="btn primary" id="submit" type="button">' + biLabel('Submit', 'Hantar') + '</button>' +
        '</div>' +
      '</section>'
    );

    var list = node.querySelector('#rankList');
    var live = node.querySelector('#rankLive');
    var submitBtn = node.querySelector('#submit');
    var confirmRow = node.querySelector('#confirmRow');

    // Optional suggestion box: keep what the person types, even if they go Back.
    var suggestBox = node.querySelector('#suggestion');
    suggestBox.value = typeof state.suggestion === 'string' ? state.suggestion : '';
    suggestBox.addEventListener('input', function () { state.suggestion = suggestBox.value; saveDraft(); });

    state.order.forEach(function (key) {
      var f = FEATURE_BY_KEY[key];
      list.appendChild(el(
        '<li class="rank-item" data-key="' + f.key + '">' +
          '<span class="rank-num" aria-hidden="true"></span>' +
          '<span class="rank-text"><span class="rank-en">' + esc(f.en) + '</span><span class="rank-ms">' + esc(f.ms) + '</span></span>' +
          '<span class="rank-controls">' +
            '<span class="updown">' +
              '<button type="button" class="icon-btn up" aria-label="Move up: ' + esc(f.en) + '">▲</button>' +
              '<button type="button" class="icon-btn down" aria-label="Move down: ' + esc(f.en) + '">▼</button>' +
            '</span>' +
            '<button type="button" class="handle" aria-label="Drag to reorder: ' + esc(f.en) + '. Or press arrow up or down.">⋮⋮</button>' +
          '</span>' +
        '</li>'
      ));
    });

    function syncFromDom() {
      state.order = Array.prototype.map.call(list.children, function (li) { return li.dataset.key; });
      Array.prototype.forEach.call(list.children, function (li, i) {
        li.querySelector('.rank-num').textContent = i + 1;
        li.querySelector('.up').disabled = i === 0;
        li.querySelector('.down').disabled = i === list.children.length - 1;
      });
      saveDraft();
    }

    function refreshConfirm() {
      confirmRow.innerHTML = state.confirmed
        ? '<span class="confirm-chip">✓ Order saved · Susunan disimpan</span>'
        : '<button class="btn ghost" id="keep" type="button">' + biLabel('Keep this order', 'Kekalkan susunan ini') + '</button>';
      submitBtn.disabled = !state.confirmed || submitting;
      var keep = confirmRow.querySelector('#keep');
      if (keep) keep.addEventListener('click', function () { state.confirmed = true; saveDraft(); refreshConfirm(); });
    }

    function markChanged(li) {
      state.confirmed = true;
      syncFromDom();
      refreshConfirm();
      var f = FEATURE_BY_KEY[li.dataset.key];
      live.textContent = f.en + ' is now number ' + (state.order.indexOf(li.dataset.key) + 1) + ' of 10.';
    }

    // FLIP: smoothly slide the other rows to their new places.
    function reorder(mutate) {
      var items = Array.prototype.slice.call(list.children);
      var before = items.map(function (li) { return li.getBoundingClientRect().top; });
      mutate();
      items.forEach(function (li, i) {
        if (li.classList.contains('dragging')) return;
        var dy = before[i] - li.getBoundingClientRect().top;
        if (!dy) return;
        li.style.transition = 'none';
        li.style.transform = 'translateY(' + dy + 'px)';
        li.getBoundingClientRect(); // force layout
        li.style.transition = 'transform .18s ease';
        li.style.transform = '';
      });
    }

    function moveBy(li, delta, refocusSelector) {
      var siblings = Array.prototype.slice.call(list.children);
      var idx = siblings.indexOf(li);
      var target = idx + delta;
      if (target < 0 || target >= siblings.length) return;
      reorder(function () {
        if (delta < 0) list.insertBefore(li, siblings[target]);
        else list.insertBefore(li, siblings[target].nextSibling);
      });
      markChanged(li);
      var focusEl = li.querySelector(refocusSelector);
      if (focusEl && !focusEl.disabled) focusEl.focus({ preventScroll: false });
      else li.querySelector(delta < 0 ? '.down' : '.up').focus();
    }

    list.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.icon-btn');
      if (!btn) return;
      var li = btn.closest('.rank-item');
      moveBy(li, btn.classList.contains('up') ? -1 : 1, btn.classList.contains('up') ? '.up' : '.down');
    });

    list.addEventListener('keydown', function (ev) {
      var handle = ev.target.closest('.handle');
      if (!handle) return;
      if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
        ev.preventDefault();
        moveBy(handle.closest('.rank-item'), ev.key === 'ArrowUp' ? -1 : 1, '.handle');
      }
    });

    // Pointer-based dragging (works with mouse, finger and pen).
    var drag = null;
    var scrollTimer = null;

    list.addEventListener('pointerdown', function (ev) {
      var handle = ev.target.closest('.handle');
      if (!handle || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
      ev.preventDefault();
      var li = handle.closest('.rank-item');
      drag = { li: li, lastY: ev.clientY, moved: false };
      li.classList.add('dragging');
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', endDrag);
      document.addEventListener('pointercancel', endDrag);
      scrollTimer = setInterval(function () {
        if (!drag) return;
        if (drag.lastY < 80) window.scrollBy(0, -12);
        else if (drag.lastY > window.innerHeight - 80) window.scrollBy(0, 12);
        else return;
        placeDragged();
      }, 16);
    });

    function onMove(ev) {
      if (!drag) return;
      drag.lastY = ev.clientY;
      placeDragged();
    }

    function placeDragged() {
      var li = drag.li;
      var y = drag.lastY;
      var target = null;
      var siblings = Array.prototype.filter.call(list.children, function (c) { return c !== li; });
      for (var i = 0; i < siblings.length; i++) {
        var r = siblings[i].getBoundingClientRect();
        if (y < r.top + r.height / 2) { target = siblings[i]; break; }
      }
      if (target !== li.nextElementSibling) {
        reorder(function () { list.insertBefore(li, target); });
        drag.moved = true;
        syncFromDom();
      }
    }

    function endDrag() {
      if (!drag) return;
      var li = drag.li;
      var moved = drag.moved;
      li.classList.remove('dragging');
      clearInterval(scrollTimer);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', endDrag);
      document.removeEventListener('pointercancel', endDrag);
      drag = null;
      if (moved) markChanged(li);
    }

    node.querySelector('#back').addEventListener('click', function () { go(10, 'back'); });
    submitBtn.addEventListener('click', function () { submit(node); });

    syncFromDom();
    refreshConfirm();
    node._refreshConfirm = refreshConfirm;
    return node;
  }

  // ── Submitting to Google Apps Script ──────────────────────────────────────
  function bilingualError(en, ms) {
    return '<div class="error"><strong>' + esc(en) + '</strong><span class="ms">' + esc(ms) + '</span></div>';
  }

  function setBusy(node, busy) {
    var btn = node.querySelector('#submit');
    var back = node.querySelector('#back');
    submitting = busy;
    btn.disabled = busy || !state.confirmed;
    back.disabled = busy;
    btn.innerHTML = busy ? '<span class="spinner" aria-hidden="true"></span>' + biLabel('Saving…', 'Menyimpan…') : biLabel('Submit', 'Hantar');
    node.querySelectorAll('.icon-btn, .handle').forEach(function (b) { b.disabled = busy || b.disabled; });
    if (!busy) {
      // re-enable controls and restore first/last arrow states
      var items = node.querySelectorAll('.rank-item');
      items.forEach(function (li, i) {
        li.querySelector('.handle').disabled = false;
        li.querySelector('.up').disabled = i === 0;
        li.querySelector('.down').disabled = i === items.length - 1;
      });
    }
  }

  function submit(node) {
    if (submitting) return; // blocks double-taps
    var errorBox = node.querySelector('#errorBox');
    errorBox.innerHTML = '';

    // Client-side checks (the server checks again – this is only for friendly messages).
    var missing = QUESTIONS.filter(function (q) { return !state.answers[q.key]; });
    if (missing.length) {
      errorBox.innerHTML = bilingualError('Please answer every question first (' + missing[0].key + ' is missing).',
        'Sila jawab semua soalan dahulu (' + missing[0].key + ' belum dijawab).');
      return;
    }
    if (!ENDPOINT_PATTERN.test(ENDPOINT)) {
      errorBox.innerHTML = bilingualError(
        'This survey is not connected to its database yet. The owner needs to paste the Web app URL into config.js. Nothing was saved.',
        'Tinjauan ini belum disambungkan ke pangkalan datanya. Pemilik perlu memasukkan URL Web app ke dalam config.js. Tiada apa yang disimpan.');
      return;
    }
    if (!state.submissionId) state.submissionId = newId();
    saveDraft();

    var payload = {
      submissionId: state.submissionId,
      answers: state.answers,
      ranking: state.order.slice(),
      suggestion: String(state.suggestion || '').trim().slice(0, 500),
      website: (node.querySelector('#website') || {}).value || ''
    };

    setBusy(node, true);
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);

    // IMPORTANT: Content-Type "text/plain" makes this a CORS "simple request", so the
    // browser does not send a preflight (OPTIONS) request that Apps Script cannot answer.
    // The body is still JSON text; the server parses it itself.
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'omit',
      signal: controller.signal
    })
      .then(function (res) {
        return res.text().then(function (text) {
          var data = null;
          try { data = JSON.parse(text); } catch (e) { /* not JSON */ }
          return { httpOk: res.ok, data: data };
        });
      })
      .then(function (result) {
        clearTimeout(timer);
        var data = result.data;
        if (data && data.ok === true && data.id === payload.submissionId) {
          // Only now – after the server confirmed the row is saved – do we show success.
          clearDraft();
          markDone();
          var id = payload.submissionId;
          state = freshState();
          state.step = 12;
          state.lastId = id;
          submitting = false;
          render('fwd');
          window.scrollTo({ top: 0, behavior: 'auto' });
          return;
        }
        setBusy(node, false);
        if (data && data.ok === false && data.message) {
          errorBox.innerHTML = bilingualError(String(data.message) + ' Nothing was confirmed as saved.',
            'Jawapan awda belum disahkan tersimpan. Sila cuba lagi.');
        } else {
          errorBox.innerHTML = bilingualError(
            'We got an unexpected reply from the server, so we cannot confirm your answers were saved. Please try again.',
            'Kami menerima jawapan yang tidak dijangka daripada pelayan, jadi kami tidak dapat mengesahkan jawapan awda tersimpan. Sila cuba lagi.');
        }
      })
      .catch(function (err) {
        clearTimeout(timer);
        setBusy(node, false);
        var timedOut = err && err.name === 'AbortError';
        errorBox.innerHTML = bilingualError(
          (timedOut ? 'The server took too long to answer. ' : 'We could not reach the server. ') +
          'Your answers are still here — check your internet and tap Submit again. It is safe to retry; you will not be counted twice.',
          'Jawapan awda masih ada di sini — semak internet awda dan tekan Hantar lagi. Selamat untuk mencuba semula; awda tidak akan dikira dua kali.');
      });
  }

  // ── Thank-you ─────────────────────────────────────────────────────────────
  function thanksScreen() {
    var node = el(
      '<section class="card thanks">' +
        '<div class="big-tomato" style="font-size:72px" aria-hidden="true">🍅</div>' +
        '<h2>Thank you!</h2>' +
        '<p class="lead">Your answers have been saved. You are helping us design smarter, kinder tools for farmers in Brunei.</p>' +
        '<p class="lead ms">Terima kasih! Jawapan awda sudah disimpan. Awda membantu kami mereka bentuk alat yang lebih pintar untuk petani di Brunei.</p>' +
        '<div style="max-width:260px;margin:14px auto 0">' + window.SH_ART.seedling(40) + '</div>' +
        '<p class="ref">Reference · Rujukan: <span id="refId"></span></p>' +
      '</section>'
    );
    node.querySelector('#refId').textContent = state.lastId || '';
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      for (var i = 0; i < 14; i++) {
        var s = document.createElement('span');
        s.className = 'fall';
        s.textContent = i % 3 === 0 ? '🍃' : '🍅';
        s.style.left = (Math.random() * 92 + 2) + '%';
        s.style.animationDuration = (2.6 + Math.random() * 2.4) + 's';
        s.style.animationDelay = (Math.random() * 1.4) + 's';
        node.appendChild(s);
      }
    }
    return node;
  }

  // Go!
  render('fwd');
})();
