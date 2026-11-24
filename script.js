(function () {
  'use strict';

  var SCREEN_IDS = [
    'screen-home',
    'screen-quiz',
    'screen-writing-quiz',
    'screen-result',
    'screen-notebook',
    'screen-concept-list',
    'screen-concept-detail',
    'screen-badge-list'
  ];

  var MSG_CORRECT = '정답입니다! 잘했어요!';
  var MSG_WRONG = '아쉽지만 틀렸어요. 올바른 표현을 확인해 보세요.';
  var MSG_CONFIRM_HOME = '처음으로 돌아가면 현재 학습 기록이 초기화됩니다. 돌아가시겠습니까?';
  var MSG_NO_WRONG = '모든 문제를 맞혔어요! 복습할 오답이 없습니다.';

  // 연속 정답 격려 기준 (한 세션 내에서 기준 도달 시 최초 1회만 표시)
  var STREAK_MILESTONES = {
    2: '좋은 출발이에요!',
    3: '집중력이 대단해요!',
    5: '5연속 정답 달성!',
    10: '놀라운 집중력! 10연속 정답!',
    15: '맞춤법 실력이 빛나고 있어요!'
  };

  var listenersBound = false;
  var selectedType = null;
  var selectedWritingType = null;
  var currentConceptIndex = 0;
  var isComposing = false; // 한글 IME 조합 상태 플래그

  // ---------- 세션 상태 생성기 (7단계: 연속 정답 관리 추가) ----------
  function createSession(mode, scope, label, questions) {
    return {
      sessionId: 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      mode: mode || 'choice', // 'choice' | 'writing'
      scope: scope || 'all',  // 'all' | 'category' | 'retry'
      modeLabel: label || '',
      questions: questions ? questions.slice() : [],
      currentIndex: 0,
      answered: false,
      score: 0,
      currentStreak: 0,       // 현재 연속 정답 수
      bestStreak: 0,          // 이번 세션 최고 연속 정답 수
      celebratedStreaks: {},  // 이미 격려 메시지를 표시한 기준 기록
      responses: [],
      wrongItems: [],
      currentChoices: [],
      screen: 'screen-home'
    };
  }

  var session = createSession('choice', 'all', '', []);
  var lastCompletedResult = null; // 직전에 완료된 학습 기록
  var conceptNavOrigin = null;    // 개념 학습 진입 경로 추적 ('result' | null)

  // ---------- 유틸리티 ----------
  function $(id) { return document.getElementById(id); }

  function setText(id, text) {
    var el = $(id);
    if (el) { el.textContent = text; }
  }

  function setHidden(id, hidden) {
    var el = $(id);
    if (el) { el.hidden = hidden; }
  }

  function on(id, handler) {
    var el = $(id);
    if (el) { el.addEventListener('click', handler); }
  }

  function showScreen(id) {
    if (SCREEN_IDS.indexOf(id) === -1) { return; }
    session.screen = id;
    SCREEN_IDS.forEach(function (sid) { setHidden(sid, sid !== id); });
    window.scrollTo(0, 0);
    focusScreenHeading(id);
  }

  function focusScreenHeading(id) {
    var screen = $(id);
    if (!screen || id === 'screen-quiz' || id === 'screen-writing-quiz') { return; }
    var h = screen.querySelector('h2');
    if (!h) { return; }
    h.setAttribute('tabindex', '-1');
    try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); }
  }

  function showNotice(message) {
    var el = $('global-notice');
    if (!el) { return; }
    el.textContent = message;
    el.hidden = false;
  }

  function clearNotice() {
    var el = $('global-notice');
    if (el) { el.hidden = true; el.textContent = ''; }
  }

  function shuffled(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function percent(part, whole) {
    return whole > 0 ? (part / whole) * 100 : 0;
  }

  // ---------- 데이터 참조 및 유효성 검증 ----------
  function getChoiceQuestions() {
    return Array.isArray(window.QUESTIONS) ? window.QUESTIONS : [];
  }

  function getWritingQuestions() {
    return Array.isArray(window.WRITING_QUESTIONS) ? window.WRITING_QUESTIONS : [];
  }

  function getConcepts() {
    return Array.isArray(window.SPELLING_CONCEPTS) ? window.SPELLING_CONCEPTS : [];
  }

  function checkChoiceData() {
    var src = getChoiceQuestions();
    if (src.length === 0) { return '선택형 문항 데이터가 없어 학습을 시작할 수 없습니다.'; }
    if (typeof window.validateQuestions === 'function') {
      var r;
      try { r = window.validateQuestions(src); } catch (e) { return '선택형 문항 검증 중 오류가 발생했습니다.'; }
      if (!r.ok) { return '선택형 문항 데이터 오류: ' + (r.errors[0] || ''); }
    }
    return null;
  }

  function checkWritingData() {
    var src = getWritingQuestions();
    if (src.length === 0) { return '직접 수정 문항 데이터가 없어 학습을 시작할 수 없습니다.'; }
    if (typeof window.validateWritingQuestions === 'function') {
      var r;
      try { r = window.validateWritingQuestions(src); } catch (e) { return '직접 수정 문항 검증 중 오류가 발생했습니다.'; }
      if (!r.ok) { return '직접 수정 문항 데이터 오류: ' + (r.errors[0] || ''); }
    }
    return null;
  }

  function getCategories(sourceList) {
    var list = sourceList || getChoiceQuestions();
    var names = [];
    var counts = {};
    list.forEach(function (q) {
      if (!q || typeof q.category !== 'string') { return; }
      if (!(q.category in counts)) { counts[q.category] = 0; names.push(q.category); }
      counts[q.category] += 1;
    });
    return names.map(function (n) { return { name: n, count: counts[n] }; });
  }

  // ---------- 메인 대시보드 화면 ----------
  function renderHome() {
    var box = $('type-list');
    var wBox = $('writing-type-list');
    var choiceCats = getCategories(getChoiceQuestions());
    var writingCats = getCategories(getWritingQuestions());
    var choiceTotal = getChoiceQuestions().length;
    var writingTotal = getWritingQuestions().length;

    setText('btn-start-all', choiceTotal > 0 ? '전체 문제 풀기 (' + choiceTotal + '문항)' : '전체 문제 풀기');
    setText('btn-start-writing-all', writingTotal > 0 ? '전체 직접 수정 (' + writingTotal + '문항)' : '전체 직접 수정');

    // 8단계: 최근 완료 학습 결과 바로보기 배너 갱신
    var recentBanner = $('home-recent-result-banner');
    if (recentBanner) {
      if (lastCompletedResult) {
        recentBanner.hidden = false;
        var rMode = (lastCompletedResult.mode === 'writing') ? '직접 수정' : '선택형';
        setText('home-recent-badge', rMode + ' 최근 결과');
        setText('home-recent-title', '직전 ' + rMode + ' 학습: ' + lastCompletedResult.score + '점 (정답률 ' + lastCompletedResult.rate.toFixed(1) + '%)');
        var recCount = (lastCompletedResult.analysisResult && lastCompletedResult.analysisResult.recommendations)
          ? lastCompletedResult.analysisResult.recommendations.length
          : 0;
        var descText = (recCount > 0)
          ? '보완이 필요한 ' + recCount + '개 맞춤 추천 유형과 종합 성취도 리포트를 확인해 보세요.'
          : '완벽한 맞춤법 실력! 원형 점수 차트와 상세 성취도 리포트를 확인해 보세요.';
        setText('home-recent-desc', descText);
      } else {
        recentBanner.hidden = true;
      }
    }

    // 7단계: 성취 배지 현황 태그 갱신
    if (window.AchievementManager) {
      var unlocked = window.AchievementManager.getUnlockedList();
      var defs = window.AchievementManager.getDefinitions();
      setText('home-badge-tag', '획득 ' + unlocked.length + ' / ' + defs.length);
      var bDesc = $('home-badge-desc');
      if (bDesc) {
        if (unlocked.length > 0) {
          bDesc.textContent = '현재 ' + unlocked.length + '개의 성취 배지를 획득했어요! 남은 배지도 도전해 보세요.';
        } else {
          bDesc.textContent = '학습을 완료하고 연속 정답을 달성하며 총 6개의 성취 배지를 모아보세요.';
        }
      }
    }

    // 오답 다시 풀기 버튼 상태 및 설명 갱신
    var retryBtn = $('btn-home-retry');
    var retryDesc = $('home-retry-desc');
    var hasWrong = lastCompletedResult && lastCompletedResult.wrongQuestions && lastCompletedResult.wrongQuestions.length > 0;

    if (retryBtn) {
      retryBtn.disabled = !hasWrong;
      if (hasWrong) {
        var modeText = (lastCompletedResult.mode === 'writing') ? '직접 수정 ' : '선택형 ';
        retryBtn.textContent = modeText + '오답 다시 풀기 (' + lastCompletedResult.wrongQuestions.length + '문항)';
      } else {
        retryBtn.textContent = '오답 다시 풀기';
      }
    }

    if (retryDesc) {
      if (hasWrong) {
        var mLabel = (lastCompletedResult.mode === 'writing') ? '직접 수정' : '선택형';
        retryDesc.textContent = '직전 ' + mLabel + ' 학습에서 틀린 ' + lastCompletedResult.wrongQuestions.length + '문제를 다시 풀어봅니다.';
      } else if (lastCompletedResult && lastCompletedResult.wrong === 0) {
        retryDesc.textContent = '모든 문제를 맞혔습니다! 복습할 오답이 없습니다.';
      } else {
        retryDesc.textContent = '아직 완료된 학습 기록이 없습니다. 퀴즈를 먼저 진행해 주세요.';
      }
    }

    // 선택형 유형 목록
    if (box) {
      while (box.firstChild) { box.removeChild(box.firstChild); }
      choiceCats.forEach(function (c, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn type-btn';
        b.id = 'btn-type-' + (i + 1);
        b.setAttribute('aria-pressed', 'false');
        b.setAttribute('data-category', c.name);
        b.textContent = c.name + ' (' + c.count + '문항)';
        b.addEventListener('click', function () { selectChoiceType(c.name); });
        box.appendChild(b);
      });
      selectedType = null;
      var start = $('btn-start-type');
      if (start) { start.disabled = true; }
    }

    // 직접 입력형 유형 목록
    if (wBox) {
      while (wBox.firstChild) { wBox.removeChild(wBox.firstChild); }
      writingCats.forEach(function (c, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn type-btn';
        b.id = 'btn-wtype-' + (i + 1);
        b.setAttribute('aria-pressed', 'false');
        b.setAttribute('data-category', c.name);
        b.textContent = c.name + ' (' + c.count + '문항)';
        b.addEventListener('click', function () { selectWritingType(c.name); });
        wBox.appendChild(b);
      });
      selectedWritingType = null;
      var wStart = $('btn-start-writing-type');
      if (wStart) { wStart.disabled = true; }
    }
  }

  function selectChoiceType(name) {
    selectedType = name;
    var btns = document.querySelectorAll('#type-list .type-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', btns[i].getAttribute('data-category') === name ? 'true' : 'false');
    }
    var start = $('btn-start-type');
    if (start) {
      start.disabled = false;
      start.textContent = '‘' + name + '’ 선택형 퀴즈 시작하기';
    }
  }

  function selectWritingType(name) {
    selectedWritingType = name;
    var btns = document.querySelectorAll('#writing-type-list .type-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', btns[i].getAttribute('data-category') === name ? 'true' : 'false');
    }
    var start = $('btn-start-writing-type');
    if (start) {
      start.disabled = false;
      start.textContent = '‘' + name + '’ 직접 수정 퀴즈 시작';
    }
  }

  // ---------- ⑧ 나의 성취 배지 화면 (7단계 신규) ----------
  function renderBadgeList() {
    if (!window.AchievementManager) { return; }
    var grid = $('badge-card-grid');
    if (!grid) { return; }
    while (grid.firstChild) { grid.removeChild(grid.firstChild); }

    var defs = window.AchievementManager.getDefinitions();
    var unlocked = window.AchievementManager.getUnlockedList();
    var unlockedMap = {};
    unlocked.forEach(function (u) { unlockedMap[u.id] = u; });

    var rate = Math.round((unlocked.length / defs.length) * 100);
    setText('badge-summary-text', '전체 ' + defs.length + '개 중 ' + unlocked.length + '개 획득 (획득률 ' + rate + '%)');

    defs.forEach(function (badge) {
      var card = document.createElement('div');
      var isGot = Boolean(unlockedMap[badge.id]);
      card.className = 'badge-card ' + (isGot ? 'unlocked' : 'locked');

      var header = document.createElement('div');
      header.className = 'badge-card-header';

      var icon = document.createElement('span');
      icon.className = 'badge-card-icon';
      icon.textContent = badge.icon;

      var titleBox = document.createElement('div');
      titleBox.className = 'badge-card-title';

      var h3 = document.createElement('h3');
      h3.textContent = badge.name;

      var tag = document.createElement('span');
      tag.className = 'badge-status-tag ' + (isGot ? 'unlocked' : 'locked');
      tag.textContent = isGot ? '획득 완료' : '미획득';

      titleBox.appendChild(h3);
      titleBox.appendChild(tag);
      header.appendChild(icon);
      header.appendChild(titleBox);

      var desc = document.createElement('p');
      desc.className = 'badge-card-desc';
      desc.textContent = badge.description;

      var cond = document.createElement('p');
      cond.className = 'badge-card-condition';
      cond.textContent = '조건: ' + badge.conditionText;

      card.appendChild(header);
      card.appendChild(desc);
      card.appendChild(cond);

      if (isGot) {
        var timeP = document.createElement('p');
        timeP.className = 'badge-card-time';
        timeP.textContent = '획득 일시: ' + unlockedMap[badge.id].unlockedAt;
        card.appendChild(timeP);
      }

      grid.appendChild(card);
    });
  }

  // ---------- ⑤ 개념 학습 화면 연동 ----------
  function renderConceptList() {
    var grid = $('concept-category-grid');
    if (!grid) { return; }
    while (grid.firstChild) { grid.removeChild(grid.firstChild); }

    var concepts = getConcepts();
    concepts.forEach(function (c, index) {
      var card = document.createElement('div');
      card.className = 'concept-overview-card';
      card.id = 'concept-card-' + (index + 1);
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');

      var badge = document.createElement('span');
      badge.className = 'concept-badge';
      badge.textContent = '유형 ' + (index + 1);

      var h3 = document.createElement('h3');
      h3.textContent = c.category;

      var p = document.createElement('p');
      p.textContent = c.summary;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm btn-ghost';
      btn.textContent = '개념 알아보기 →';

      card.appendChild(badge);
      card.appendChild(h3);
      card.appendChild(p);
      card.appendChild(btn);

      var openDetail = function () { openConceptDetail(index); };
      card.addEventListener('click', openDetail);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetail();
        }
      });
      grid.appendChild(card);
    });
  }

  function openConceptDetail(index) {
    var concepts = getConcepts();
    if (index < 0 || index >= concepts.length) { return; }
    currentConceptIndex = index;
    var c = concepts[index];

    setText('concept-detail-category', '유형 ' + (index + 1) + '. ' + c.category);
    setText('concept-detail-title', c.title);
    setText('concept-detail-summary', c.summary);

    var ruleUl = $('concept-detail-rules');
    if (ruleUl) {
      while (ruleUl.firstChild) { ruleUl.removeChild(ruleUl.firstChild); }
      c.rules.forEach(function (rule) {
        var li = document.createElement('li');
        li.textContent = rule;
        ruleUl.appendChild(li);
      });
    }

    if (c.comparison) {
      setText('compare-left-title', c.comparison.left.title);
      setText('compare-left-desc', c.comparison.left.desc);
      setText('compare-left-usage', c.comparison.left.usage);
      setText('compare-right-title', c.comparison.right.title);
      setText('compare-right-desc', c.comparison.right.desc);
      setText('compare-right-usage', c.comparison.right.usage);
    }

    var corUl = $('concept-detail-correct-examples');
    var incorUl = $('concept-detail-incorrect-examples');
    if (corUl && incorUl) {
      while (corUl.firstChild) { corUl.removeChild(corUl.firstChild); }
      while (incorUl.firstChild) { incorUl.removeChild(incorUl.firstChild); }
      c.examples.correct.forEach(function (ex) {
        var li = document.createElement('li');
        li.textContent = ex;
        corUl.appendChild(li);
      });
      c.examples.incorrect.forEach(function (ex) {
        var li = document.createElement('li');
        li.textContent = ex;
        incorUl.appendChild(li);
      });
    }

    setText('concept-detail-tip', c.tip);
    setText('concept-detail-caution', c.caution);

    var prevBtn = $('btn-concept-prev');
    var nextBtn = $('btn-concept-next');
    if (prevBtn) { prevBtn.disabled = (index === 0); }
    if (nextBtn) { nextBtn.disabled = (index === concepts.length - 1); }

    var startBtn = $('btn-concept-start-quiz');
    if (startBtn) {
      startBtn.textContent = '🎯 ‘' + c.category + '’ 관련 퀴즈 풀기';
    }

    var backResultBtn = $('btn-concept-back-to-result');
    if (backResultBtn) {
      backResultBtn.hidden = (conceptNavOrigin !== 'result');
    }

    clearNotice();
    showScreen('screen-concept-detail');
  }

  // ---------- 세션 시작 관리 ----------
  function startChoiceSession(scope, label, questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
      showNotice('출제할 선택형 문항이 없습니다.');
      return false;
    }
    session = createSession('choice', scope, label, shuffled(questions));
    clearNotice();
    showScreen('screen-quiz');
    renderChoiceQuestion();
    return true;
  }

  function startWritingSession(scope, label, questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
      showNotice('출제할 직접 수정 문항이 없습니다.');
      return false;
    }
    session = createSession('writing', scope, label, shuffled(questions));
    clearNotice();
    showScreen('screen-writing-quiz');
    renderWritingQuestion();
    return true;
  }

  function startAllChoice() {
    var err = checkChoiceData();
    if (err) { showNotice(err); return; }
    startChoiceSession('all', '전체 36문항', getChoiceQuestions());
  }

  function startChoiceByType(categoryName) {
    var err = checkChoiceData();
    if (err) { showNotice(err); return; }
    var cat = categoryName || selectedType;
    if (!cat) { showNotice('학습할 유형을 먼저 선택해 주세요.'); return; }
    var picked = getChoiceQuestions().filter(function (q) { return q.category === cat; });
    if (picked.length === 0) {
      showNotice('‘' + cat + '’ 유형에 해당하는 선택형 문항이 없습니다.');
      return;
    }
    startChoiceSession('category', cat, picked);
  }

  function startAllWriting() {
    var err = checkWritingData();
    if (err) { showNotice(err); return; }
    startWritingSession('all', '전체 직접 수정 18문항', getWritingQuestions());
  }

  function startWritingByType(categoryName) {
    var err = checkWritingData();
    if (err) { showNotice(err); return; }
    var cat = categoryName || selectedWritingType;
    if (!cat) { showNotice('학습할 유형을 먼저 선택해 주세요.'); return; }
    var picked = getWritingQuestions().filter(function (q) { return q.category === cat; });
    if (picked.length === 0) {
      showNotice('‘' + cat + '’ 유형에 해당하는 직접 수정 문항이 없습니다.');
      return;
    }
    startWritingSession('category', cat, picked);
  }

  function startRetry() {
    var rec = lastCompletedResult;
    if (!rec || !rec.wrongQuestions || rec.wrongQuestions.length === 0) {
      showNotice('복습할 오답 문항이 없습니다.');
      return;
    }
    if (rec.mode === 'writing') {
      startWritingSession('retry', '오답 다시 풀기 (직접 수정)', rec.wrongQuestions);
    } else {
      startChoiceSession('retry', '오답 다시 풀기 (선택형)', rec.wrongQuestions);
    }
  }

  // ---------- 연속 정답 업데이트 및 토스트 메시지 처리 ----------
  function updateStreakState(isCorrect, badgeElId, toastElId, countElId) {
    var badgeEl = $(badgeElId);
    var toastEl = $(toastElId);
    var countEl = $(countElId);

    if (isCorrect) {
      session.currentStreak += 1;
      if (session.currentStreak > session.bestStreak) {
        session.bestStreak = session.currentStreak;
      }
      if (countEl) { countEl.textContent = String(session.currentStreak); }
      if (badgeEl) { badgeEl.hidden = false; }

      // 격려 메시지 기준 도달 검사 (세션당 1회만 노출)
      var streakCount = session.currentStreak;
      if (STREAK_MILESTONES[streakCount] && !session.celebratedStreaks[streakCount]) {
        session.celebratedStreaks[streakCount] = true;
        if (toastEl) {
          toastEl.textContent = '🎉 ' + STREAK_MILESTONES[streakCount];
          toastEl.hidden = false;
        }
      } else if (toastEl) {
        toastEl.hidden = true;
        toastEl.textContent = '';
      }
    } else {
      session.currentStreak = 0;
      if (countEl) { countEl.textContent = '0'; }
      if (badgeEl) { badgeEl.hidden = true; }
      if (toastEl) { toastEl.hidden = true; toastEl.textContent = ''; }
    }
  }

  // ---------- 선택형 퀴즈 화면 로직 ----------
  function currentChoiceQuestion() {
    if (session.currentIndex < 0 || session.currentIndex >= session.questions.length) { return null; }
    return session.questions[session.currentIndex] || null;
  }

  function updateChoiceProgress() {
    var total = session.questions.length;
    var done = session.responses.length;
    var pct = Math.round(percent(done, total));
    var bar = $('quiz-progress-bar');
    if (bar) { bar.style.width = pct + '%'; }
    var wrap = $('quiz-progress');
    if (wrap) { wrap.setAttribute('aria-valuenow', String(pct)); }
    setText('quiz-progress-text', '진행률 ' + pct + '% (' + done + ' / ' + total + '문항 완료)');
  }

  function renderChoiceQuestion() {
    var q = currentChoiceQuestion();
    if (!q) { showNotice('문항을 불러올 수 없습니다.'); goHome(); return; }

    session.answered = false;
    session.currentChoices = shuffled([
      { text: q.correct, isCorrect: true },
      { text: q.incorrect, isCorrect: false }
    ]);

    setText('quiz-type-label', '학습 유형: ' + session.modeLabel);
    setText('quiz-current', String(session.currentIndex + 1));
    setText('quiz-total', String(session.questions.length));
    setText('quiz-score-value', String(session.score));
    setText('quiz-question-text', '[' + q.category + '] 두 표현 중 올바른 것은 무엇일까요?');

    for (var i = 0; i < 2; i++) {
      var btn = $('btn-choice-' + (i + 1));
      if (!btn) { continue; }
      btn.textContent = session.currentChoices[i].text;
      btn.disabled = false;
      btn.classList.remove('is-correct', 'is-wrong');
    }

    setHidden('quiz-feedback', true);
    setHidden('quiz-explanation', true);
    setHidden('quiz-streak-toast', true);
    var fb = $('quiz-feedback');
    if (fb) { fb.classList.remove('is-correct', 'is-wrong'); }

    var next = $('btn-next');
    if (next) {
      next.disabled = true;
      next.textContent = (session.currentIndex === session.questions.length - 1) ? '결과 확인하기' : '다음 문제';
    }
    updateChoiceProgress();
    var firstChoice = $('btn-choice-1');
    if (firstChoice) { firstChoice.focus(); }
  }

  function onChooseChoice(choiceIndex) {
    if (session.screen !== 'screen-quiz' || session.answered) { return; }
    var q = currentChoiceQuestion();
    var choice = session.currentChoices[choiceIndex];
    if (!q || !choice) { return; }
    session.answered = true;

    var isCorrect = (choice.isCorrect === true);
    var correctIndex = session.currentChoices[0].isCorrect ? 0 : 1;

    // 연속 정답 갱신 (확정된 채점 지점)
    updateStreakState(isCorrect, 'quiz-streak-badge', 'quiz-streak-toast', 'quiz-streak-count');

    session.responses.push({
      questionId: q.id,
      category: q.category,
      mode: 'choice',
      userAnswer: choice.text,
      correctAnswer: q.correct,
      isCorrect: isCorrect,
      explanation: q.explanation
    });

    if (isCorrect) {
      session.score += 1;
    } else {
      session.wrongItems.push({
        questionId: q.id,
        category: q.category,
        mode: 'choice',
        question: q,
        userAnswer: choice.text,
        correctAnswer: q.correct,
        explanation: q.explanation
      });
    }

    for (var i = 0; i < 2; i++) {
      var btn = $('btn-choice-' + (i + 1));
      if (!btn) { continue; }
      btn.disabled = true;
      if (i === correctIndex) {
        btn.classList.add('is-correct');
      } else if (i === choiceIndex) {
        btn.classList.add('is-wrong');
      }
    }

    var fb = $('quiz-feedback');
    if (fb) {
      fb.classList.remove('is-correct', 'is-wrong');
      fb.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
    }
    setText('quiz-feedback-title', (isCorrect ? '○ ' : '✕ ') + (isCorrect ? MSG_CORRECT : MSG_WRONG));
    setText('quiz-feedback-answer', isCorrect ? '' : '정답: ' + q.correct);
    setText('quiz-explanation-text', q.explanation);
    setHidden('quiz-feedback', false);
    setHidden('quiz-explanation', false);
    setText('quiz-score-value', String(session.score));
    updateChoiceProgress();

    var next = $('btn-next');
    if (next) { next.disabled = false; next.focus(); }
  }

  function onNextChoice() {
    if (session.screen !== 'screen-quiz' || !session.answered) { return; }
    session.answered = false;
    var next = $('btn-next');
    if (next) { next.disabled = true; }
    if (session.currentIndex >= session.questions.length - 1) {
      finishSession();
    } else {
      session.currentIndex += 1;
      renderChoiceQuestion();
    }
  }

  // ---------- 직접 입력형 퀴즈 화면 로직 ----------
  function currentWritingQuestion() {
    if (session.currentIndex < 0 || session.currentIndex >= session.questions.length) { return null; }
    return session.questions[session.currentIndex] || null;
  }

  function updateWritingProgress() {
    var total = session.questions.length;
    var done = session.responses.length;
    var pct = Math.round(percent(done, total));
    var bar = $('writing-quiz-progress-bar');
    if (bar) { bar.style.width = pct + '%'; }
    var wrap = $('writing-quiz-progress');
    if (wrap) { wrap.setAttribute('aria-valuenow', String(pct)); }
    setText('writing-quiz-progress-text', '진행률 ' + pct + '% (' + done + ' / ' + total + '문항 완료)');
  }

  function renderWritingQuestion() {
    var q = currentWritingQuestion();
    if (!q) { showNotice('직접 수정 문항을 불러올 수 없습니다.'); goHome(); return; }

    session.answered = false;

    setText('writing-quiz-type-label', '직접 수정: ' + session.modeLabel);
    setText('writing-quiz-current', String(session.currentIndex + 1));
    setText('writing-quiz-total', String(session.questions.length));
    setText('writing-quiz-score-value', String(session.score));

    var guideText = q.guidance || '밑줄 친 잘못된 표현을 바르게 고쳐 입력하세요.';
    setText('writing-question-guide', guideText);

    var sentenceBox = $('writing-sentence-display');
    if (sentenceBox) {
      while (sentenceBox.firstChild) { sentenceBox.removeChild(sentenceBox.firstChild); }
      if (q.prefix) { sentenceBox.appendChild(document.createTextNode(q.prefix)); }
      var span = document.createElement('span');
      span.className = 'target-underline';
      span.textContent = q.target;
      sentenceBox.appendChild(span);
      if (q.suffix) { sentenceBox.appendChild(document.createTextNode(q.suffix)); }
    }

    var input = $('writing-answer-input');
    if (input) {
      input.value = '';
      input.disabled = false;
      input.classList.remove('is-correct', 'is-wrong');
    }
    var submitBtn = $('btn-writing-submit');
    if (submitBtn) { submitBtn.disabled = false; }

    setHidden('writing-warn-msg', true);
    setText('writing-warn-msg', '');
    setHidden('writing-feedback', true);
    setHidden('writing-explanation', true);
    setHidden('writing-streak-toast', true);
    var fb = $('writing-feedback');
    if (fb) { fb.classList.remove('is-correct', 'is-wrong'); }

    var next = $('btn-writing-next');
    if (next) {
      next.disabled = true;
      next.textContent = (session.currentIndex === session.questions.length - 1) ? '결과 확인하기' : '다음 문제';
    }

    updateWritingProgress();
    if (input) { input.focus(); }
  }

  function normalizeText(str) {
    if (typeof str !== 'string') { return ''; }
    return str.trim().normalize('NFC');
  }

  function submitWritingAnswer() {
    if (session.screen !== 'screen-writing-quiz' || session.answered || isComposing) {
      return;
    }

    var q = currentWritingQuestion();
    if (!q) { return; }

    var input = $('writing-answer-input');
    if (!input) { return; }

    var rawValue = input.value || '';
    var normValue = normalizeText(rawValue);

    if (normValue === '') {
      var warn = $('writing-warn-msg');
      if (warn) {
        warn.textContent = '답안을 입력한 후 정답 확인 버튼을 눌러주세요.';
        warn.hidden = false;
      }
      input.focus();
      return;
    }

    var isFullSentenceMatch = false;
    for (var k = 0; k < q.acceptedAnswers.length; k++) {
      var fullSentence = (q.prefix || '') + q.acceptedAnswers[k] + (q.suffix || '');
      if (normValue === normalizeText(fullSentence)) {
        isFullSentenceMatch = true;
        break;
      }
    }
    var wrongFull = (q.prefix || '') + q.target + (q.suffix || '');
    if (normValue === normalizeText(wrongFull)) {
      isFullSentenceMatch = true;
    }

    if (isFullSentenceMatch) {
      var warn2 = $('writing-warn-msg');
      if (warn2) {
        warn2.textContent = '문장 전체가 아니라 밑줄 친 부분만 바르게 고쳐 입력해 주세요.';
        warn2.hidden = false;
      }
      input.focus();
      return;
    }

    session.answered = true;
    setHidden('writing-warn-msg', true);

    var isCorrect = false;
    var normAccepted = q.acceptedAnswers.map(function (ans) { return normalizeText(ans); });
    for (var a = 0; a < normAccepted.length; a++) {
      if (normValue === normAccepted[a]) {
        isCorrect = true;
        break;
      }
    }

    // 연속 정답 갱신 (확정된 채점 지점)
    updateStreakState(isCorrect, 'writing-quiz-streak-badge', 'writing-streak-toast', 'writing-quiz-streak-count');

    var repAnswer = q.acceptedAnswers[0];
    var completedSentence = (q.prefix || '') + repAnswer + (q.suffix || '');

    session.responses.push({
      questionId: q.id,
      category: q.category,
      mode: 'writing',
      userAnswer: rawValue.trim(),
      correctAnswer: repAnswer,
      acceptedAnswers: q.acceptedAnswers.slice(),
      isCorrect: isCorrect,
      explanation: q.explanation,
      fullSentence: completedSentence
    });

    if (isCorrect) {
      session.score += 1;
    } else {
      session.wrongItems.push({
        questionId: q.id,
        category: q.category,
        mode: 'writing',
        question: q,
        userAnswer: rawValue.trim(),
        correctAnswer: repAnswer,
        acceptedAnswers: q.acceptedAnswers.slice(),
        explanation: q.explanation,
        fullSentence: completedSentence
      });
    }

    input.disabled = true;
    var submitBtn = $('btn-writing-submit');
    if (submitBtn) { submitBtn.disabled = true; }

    var fb = $('writing-feedback');
    if (fb) {
      fb.classList.remove('is-correct', 'is-wrong');
      fb.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
    }

    var fbTitle = $('writing-feedback-title');
    if (fbTitle) {
      fbTitle.textContent = isCorrect ? '○ 정답입니다! 올바르게 수정했어요.' : '✕ 아쉽지만 틀렸어요. 올바른 표현을 확인해 보세요.';
    }

    var userP = $('writing-feedback-user');
    if (userP) {
      userP.textContent = '내가 입력한 답: ' + rawValue.trim();
    }

    var corP = $('writing-feedback-correct');
    if (corP) {
      if (isCorrect) {
        corP.textContent = '올바른 표기: ' + rawValue.trim();
      } else {
        var ansText = '올바른 정답: ' + repAnswer;
        if (q.acceptedAnswers.length > 1) {
          ansText += ' (허용 정답: ' + q.acceptedAnswers.join(', ') + ')';
        }
        corP.textContent = ansText;
      }
    }

    setText('writing-full-sentence', completedSentence);
    setText('writing-explanation-text', q.explanation);

    setHidden('writing-feedback', false);
    setHidden('writing-explanation', false);
    setText('writing-quiz-score-value', String(session.score));
    updateWritingProgress();

    var next = $('btn-writing-next');
    if (next) { next.disabled = false; next.focus(); }
  }

  function onNextWriting() {
    if (session.screen !== 'screen-writing-quiz' || !session.answered) { return; }
    session.answered = false;
    var next = $('btn-writing-next');
    if (next) { next.disabled = true; }
    if (session.currentIndex >= session.questions.length - 1) {
      finishSession();
    } else {
      session.currentIndex += 1;
      renderWritingQuestion();
    }
  }

  // ---------- 결과 화면 및 세션 완료 관리 ----------
  function buildResult() {
    var total = session.questions.length;
    var correct = session.score;
    var cats = {};
    session.responses.forEach(function (r) {
      if (!(r.category in cats)) { cats[r.category] = { name: r.category, total: 0, correct: 0 }; }
      cats[r.category].total += 1;
      if (r.isCorrect) { cats[r.category].correct += 1; }
    });

    var sourceList = (session.mode === 'writing') ? getWritingQuestions() : getChoiceQuestions();
    var order = getCategories(sourceList).map(function (c) { return c.name; }).filter(function (n) { return n in cats; });

    return {
      sessionId: session.sessionId,
      mode: session.mode,
      scope: session.scope,
      label: session.modeLabel,
      total: total,
      correct: correct,
      wrong: total - correct,
      score: total > 0 ? Math.round((correct / total) * 100) : 0,
      rate: percent(correct, total),
      bestStreak: session.bestStreak, // 7단계 최고 연속 정답 수 보존
      typeStats: order.map(function (n) { return cats[n]; }),
      responses: session.responses.slice(),
      wrongItems: session.wrongItems.slice(),
      wrongQuestions: session.wrongItems.map(function (w) { return w.question; })
    };
  }

  function scoreMessage(score) {
    if (score >= 90) { return '훌륭해요! 한글맞춤법 마스터에 가까워졌어요.'; }
    if (score >= 70) { return '잘했어요! 틀린 문제를 복습하면 더 발전할 수 있어요.'; }
    if (score >= 50) { return '조금 더 연습해 볼까요? 해설을 다시 확인해 보세요.'; }
    return '괜찮아요! 맞춤법은 연습할수록 실력이 늘어요.';
  }

  function finishSession() {
    lastCompletedResult = buildResult();

    // 8단계: 교육 데이터 분석 엔진 구동 (실제 응답 기반 취약 유형 및 추천 도출)
    if (window.SpellingAnalytics && typeof window.SpellingAnalytics.analyzeSession === 'function') {
      lastCompletedResult.analysisResult = window.SpellingAnalytics.analyzeSession(lastCompletedResult);
    }

    // 7단계: 성취 배지 조건 평가 (완료 시점에만 1회 확정)
    var newlyUnlockedIds = [];
    if (window.AchievementManager) {
      newlyUnlockedIds = window.AchievementManager.evaluateSession(lastCompletedResult);
    }
    lastCompletedResult.newlyUnlockedBadges = newlyUnlockedIds;

    renderResult();
    showScreen('screen-result');
  }

  function renderResult() {
    var r = lastCompletedResult;
    if (!r) { return; }

    var badgeText = (r.mode === 'writing') ? '직접 수정 퀴즈 완료' : '선택형 퀴즈 완료';
    setText('result-badge', badgeText);

    var headingText = '학습을 완료했습니다!';
    if (r.scope === 'retry') { headingText = '오답 복습을 완료했습니다!'; }
    else if (r.scope === 'recommended') { headingText = '추천 유형 집중 학습을 완료했습니다!'; }
    setText('result-heading', headingText);

    setText('result-message', scoreMessage(r.score));
    setText('result-total', String(r.total));
    setText('result-correct', String(r.correct));
    setText('result-wrong', String(r.wrong));
    setText('result-rate', r.rate.toFixed(1) + '%');
    setText('result-best-streak', String(r.bestStreak || 0));

    // 8단계 신규: 종합 결과 메타 및 원형 도넛 차트 (CSS conic-gradient)
    var modeLabel = (r.mode === 'writing') ? '직접 수정' : '선택형';
    var scopeLabel = (r.scope === 'all') ? '전체 문항' :
      (r.scope === 'category') ? (r.label || '유형별') :
      (r.scope === 'retry') ? '오답 다시 풀기' :
      (r.scope === 'recommended') ? '추천 유형 묶음' : (r.label || '맞춤');
    setText('result-mode-text', modeLabel);
    setText('result-scope-text', scopeLabel);

    // 도넛 차트 렌더링 (소수점 포함 실제 비율 각도 + 중앙 반올림 점수)
    var donutChart = $('result-donut-chart');
    if (donutChart) {
      var exactRate = Math.max(0, Math.min(100, r.rate));
      donutChart.style.background = 'conic-gradient(var(--primary) 0% ' + exactRate + '%, #e2e8f0 ' + exactRate + '% 100%)';
      donutChart.setAttribute('aria-label', '종합 점수 ' + r.score + '점, 실제 정답률 ' + exactRate.toFixed(1) + '%');
    }
    setText('donut-score-text', String(r.score));
    setText('donut-legend-text', '정답률 ' + r.rate.toFixed(1) + '% (실제 응답 비율)');

    // 7단계: 새로 획득한 배지 축하 표시
    var newBadgeCard = $('result-new-badge-card');
    var newBadgeList = $('result-new-badge-list');
    if (newBadgeCard && newBadgeList) {
      while (newBadgeList.firstChild) { newBadgeList.removeChild(newBadgeList.firstChild); }
      if (r.newlyUnlockedBadges && r.newlyUnlockedBadges.length > 0 && window.AchievementManager) {
        var defs = window.AchievementManager.getDefinitions();
        var defMap = {};
        defs.forEach(function (d) { defMap[d.id] = d; });

        r.newlyUnlockedBadges.forEach(function (bId) {
          var bDef = defMap[bId];
          if (bDef) {
            var item = document.createElement('div');
            item.className = 'new-badge-item';
            var icon = document.createElement('span');
            icon.className = 'icon';
            icon.textContent = bDef.icon;
            var name = document.createElement('span');
            name.textContent = bDef.name;
            item.appendChild(icon);
            item.appendChild(name);
            newBadgeList.appendChild(item);
          }
        });
        newBadgeCard.hidden = false;
      } else {
        newBadgeCard.hidden = true;
      }
    }

    // 8단계: 맞춤형 추천 및 유형별 상세 분석 렌더링
    renderAnalytics(r);

    var retry = $('btn-retry-wrong');
    if (retry) { retry.disabled = (r.wrongQuestions.length === 0); }
    var nb = $('btn-open-notebook');
    if (nb) { nb.disabled = false; }
  }

  // ---------- 8단계 신규: 분석 리포트 및 맞춤 추천 렌더링 ----------
  function renderAnalytics(r) {
    var analysis = r.analysisResult;
    if (!analysis) { return; }

    var recCardsContainer = $('recommendation-cards-container');
    var addCardsContainer = $('additional-cards-container');
    var addBox = $('additional-recommend-box');
    var perfectBox = $('perfect-praise-box');
    var batchBtn = $('btn-recommend-batch');

    if (recCardsContainer) { while (recCardsContainer.firstChild) { recCardsContainer.removeChild(recCardsContainer.firstChild); } }
    if (addCardsContainer) { while (addCardsContainer.firstChild) { addCardsContainer.removeChild(addCardsContainer.firstChild); } }

    var recs = analysis.recommendations || [];

    // 만점인 경우와 추천 유형이 있는 경우 분기
    if (r.score === 100 && r.wrong === 0) {
      if (perfectBox) { perfectBox.hidden = false; }
      if (addBox) { addBox.hidden = true; }
      if (batchBtn) { batchBtn.disabled = true; batchBtn.hidden = true; }
    } else {
      if (perfectBox) { perfectBox.hidden = true; }
      if (batchBtn) {
        batchBtn.hidden = false;
        batchBtn.disabled = (recs.length === 0);
        batchBtn.textContent = '추천 유형 ' + recs.length + '개 한 번에 학습하기';
      }

      var top3 = recs.slice(0, 3);
      var rest = recs.slice(3);

      top3.forEach(function (rec, idx) {
        if (recCardsContainer) {
          recCardsContainer.appendChild(createRecommendationCard(rec, idx + 1, r.mode));
        }
      });

      if (rest.length > 0 && addBox && addCardsContainer) {
        addBox.hidden = false;
        rest.forEach(function (rec, idx) {
          addCardsContainer.appendChild(createRecommendationCard(rec, idx + 4, r.mode));
        });
      } else if (addBox) {
        addBox.hidden = true;
      }
    }

    // 유형별 세부 성취도 분석 리스트 (가로 막대 그래프)
    var list = $('result-type-list');
    if (list) {
      while (list.firstChild) { list.removeChild(list.firstChild); }

      if (analysis.attemptedCategories && analysis.attemptedCategories.length > 0) {
        analysis.attemptedCategories.forEach(function (stat) {
          var li = document.createElement('li');
          li.className = 'type-stat';

          var head = document.createElement('div');
          head.className = 'type-stat-head';

          var titleGroup = document.createElement('div');
          titleGroup.className = 'type-stat-title-group';

          var nameStrong = document.createElement('strong');
          nameStrong.textContent = stat.category;
          titleGroup.appendChild(nameStrong);

          var statusBadge = document.createElement('span');
          statusBadge.className = 'type-stat-status-badge ' + stat.status;
          var statusLabels = {
            perfect: '완벽',
            good: '우수',
            warning: '보완 필요',
            danger: '집중 필요'
          };
          statusBadge.textContent = statusLabels[stat.status] || '진행';
          titleGroup.appendChild(statusBadge);

          if (stat.isSmallSample) {
            var sampleBadge = document.createElement('span');
            sampleBadge.className = 'type-sample-warn';
            sampleBadge.textContent = '소량 문항 (참고용)';
            sampleBadge.title = '출제 문항 수가 3문항 이하이므로 학습 참고용으로 확인하세요.';
            titleGroup.appendChild(sampleBadge);
          }
          head.appendChild(titleGroup);

          var numSpan = document.createElement('span');
          numSpan.className = 'type-stat-numbers';
          numSpan.textContent = '정답 ' + stat.correct + ' / 전체 ' + stat.total + ' · 정답률 ' + stat.accuracyPercent + '%';
          head.appendChild(numSpan);

          var barBg = document.createElement('div');
          barBg.className = 'type-bar-bg';
          var barFill = document.createElement('div');
          barFill.className = 'type-bar-fill ' + stat.status;
          barFill.style.width = stat.accuracyPercent + '%';
          barBg.appendChild(barFill);

          li.appendChild(head);
          li.appendChild(barBg);
          list.appendChild(li);
        });
      } else {
        var emptyLi = document.createElement('li');
        emptyLi.className = 'muted';
        emptyLi.textContent = '아직 집계된 맞춤법 유형 결과가 없습니다.';
        list.appendChild(emptyLi);
      }
    }
  }

  // 추천 카드 1개 생성 헬퍼
  function createRecommendationCard(rec, rank, currentMode) {
    var card = document.createElement('div');
    card.className = 'recommend-card';

    var head = document.createElement('div');
    head.className = 'recommend-card-head';

    var title = document.createElement('h4');
    title.className = 'recommend-card-title';
    title.textContent = rank + '. ' + rec.category;

    var rate = document.createElement('span');
    rate.className = 'recommend-rate-badge';
    rate.textContent = '정답률 ' + rec.accuracyPercent + '% (' + rec.incorrect + '오답)';

    head.appendChild(title);
    head.appendChild(rate);

    var reasonP = document.createElement('p');
    reasonP.className = 'recommend-reason';
    reasonP.textContent = '⚠️ ' + rec.reason;

    var feedbackP = document.createElement('p');
    feedbackP.className = 'recommend-feedback';
    feedbackP.textContent = rec.feedback;

    var actions = document.createElement('div');
    actions.className = 'recommend-actions';

    // 액션 1: 개념 다시 학습하기 (결과 화면 복귀 지원)
    var btnConcept = document.createElement('button');
    btnConcept.type = 'button';
    btnConcept.className = 'btn btn-secondary';
    btnConcept.textContent = '📖 개념 다시 학습하기';
    btnConcept.addEventListener('click', function () {
      conceptNavOrigin = 'result';
      var concepts = getConcepts();
      var cIdx = 0;
      for (var i = 0; i < concepts.length; i++) {
        if (concepts[i].category === rec.category) { cIdx = i; break; }
      }
      openConceptDetail(cIdx);
    });

    // 액션 2: 선택형 집중 학습
    var btnChoice = document.createElement('button');
    btnChoice.type = 'button';
    btnChoice.className = 'btn btn-primary';
    btnChoice.textContent = '🎯 선택형 집중 학습';
    btnChoice.addEventListener('click', function () {
      startChoiceByType(rec.category);
    });

    // 액션 3: 직접 수정 연습하기
    var btnWriting = document.createElement('button');
    btnWriting.type = 'button';
    btnWriting.className = 'btn btn-ghost';
    btnWriting.textContent = '✍️ 직접 수정 연습하기';
    btnWriting.addEventListener('click', function () {
      startWritingByType(rec.category);
    });

    actions.appendChild(btnConcept);
    actions.appendChild(btnChoice);
    actions.appendChild(btnWriting);

    card.appendChild(head);
    card.appendChild(reasonP);
    card.appendChild(feedbackP);
    card.appendChild(actions);

    return card;
  }

  // ---------- 8단계 신규: 추천 유형 한 번에 학습하기 세션 구동 ----------
  function startRecommendedBatch() {
    if (!lastCompletedResult || !lastCompletedResult.analysisResult) {
      showNotice('추천할 학습 분석 데이터가 없습니다.');
      return;
    }
    var recs = lastCompletedResult.analysisResult.recommendations || [];
    if (recs.length === 0) {
      showNotice('추천할 취약 유형이 없습니다.');
      return;
    }

    var recCategories = recs.map(function (r) { return r.category; });
    var targetMode = lastCompletedResult.mode || 'choice';

    if (targetMode === 'writing') {
      var writingPool = getWritingQuestions().filter(function (q) {
        return recCategories.indexOf(q.category) !== -1;
      });
      if (writingPool.length === 0) {
        showNotice('추천 유형에 해당하는 직접 수정 문항이 없습니다.');
        return;
      }
      startWritingSession('recommended', '추천 ' + recs.length + '개 유형 집중 직접 수정', writingPool);
    } else {
      var choicePool = getChoiceQuestions().filter(function (q) {
        return recCategories.indexOf(q.category) !== -1;
      });
      if (choicePool.length === 0) {
        showNotice('추천 유형에 해당하는 선택형 문항이 없습니다.');
        return;
      }
      startChoiceSession('recommended', '추천 ' + recs.length + '개 유형 집중 선택형', choicePool);
    }
  }

  // ---------- 오답 노트 화면 ----------
  function renderNotebook() {
    var list = $('notebook-list');
    var r = lastCompletedResult;
    if (!list) { return; }
    while (list.firstChild) { list.removeChild(list.firstChild); }

    if (!r || !r.wrongItems || r.wrongItems.length === 0) {
      var li0 = document.createElement('li');
      li0.className = 'muted';
      li0.id = 'notebook-empty';
      li0.textContent = MSG_NO_WRONG;
      list.appendChild(li0);
      return;
    }

    r.wrongItems.forEach(function (w, i) {
      var li = document.createElement('li');
      li.className = 'note-item';

      function row(label, text, cls) {
        var p = document.createElement('p');
        p.className = 'note-row' + (cls ? ' ' + cls : '');
        var b = document.createElement('strong');
        b.textContent = label + ' ';
        var s = document.createElement('span');
        s.textContent = text;
        p.appendChild(b);
        p.appendChild(s);
        li.appendChild(p);
      }

      var bWrap = document.createElement('div');
      bWrap.className = 'note-badges';

      var badge = document.createElement('span');
      badge.className = 'badge badge-accent';
      badge.textContent = (i + 1) + '. ' + w.category;
      bWrap.appendChild(badge);

      var mBadge = document.createElement('span');
      mBadge.className = 'badge-mode';
      mBadge.textContent = (w.mode === 'writing') ? '직접 수정' : '선택형';
      bWrap.appendChild(mBadge);

      li.appendChild(bWrap);

      if (w.mode === 'writing' && w.fullSentence) {
        row('문장 문맥:', w.fullSentence, '');
      }
      row('✕ 내가 작성한 답:', w.userAnswer, 'note-wrong');

      var corDisplay = w.correctAnswer;
      if (w.acceptedAnswers && w.acceptedAnswers.length > 1) {
        corDisplay += ' (허용: ' + w.acceptedAnswers.join(', ') + ')';
      }
      row('○ 올바른 정답:', corDisplay, 'note-right');
      row('맞춤법 해설:', w.explanation, '');

      list.appendChild(li);
    });
  }

  // ---------- 화면 복귀 및 초기화 ----------
  function goHome() {
    session = createSession('choice', 'all', '', []);
    clearNotice();
    renderHome();
    showScreen('screen-home');
  }

  function onQuizHome() {
    var ok = true;
    try { ok = window.confirm(MSG_CONFIRM_HOME); } catch (e) { ok = true; }
    if (ok) { goHome(); }
  }

  // ---------- 이벤트 리스너 바인딩 ----------
  function bindEvents() {
    if (listenersBound) { return; }
    listenersBound = true;

    // 대시보드 메뉴
    on('btn-menu-concept', function () {
      renderConceptList();
      showScreen('screen-concept-list');
    });

    on('btn-start-all', startAllChoice);

    on('btn-menu-type', function () {
      var panel = $('home-type-card');
      if (panel) {
        panel.hidden = !panel.hidden;
        if (!panel.hidden) {
          setHidden('home-writing-type-card', true);
          panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });

    on('btn-close-type-select', function () {
      setHidden('home-type-card', true);
    });

    on('btn-start-type', function () { startChoiceByType(); });

    on('btn-start-writing-all', startAllWriting);

    on('btn-menu-writing-type', function () {
      var wPanel = $('home-writing-type-card');
      if (wPanel) {
        wPanel.hidden = !wPanel.hidden;
        if (!wPanel.hidden) {
          setHidden('home-type-card', true);
          wPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });

    on('btn-close-writing-type-select', function () {
      setHidden('home-writing-type-card', true);
    });

    on('btn-start-writing-type', function () { startWritingByType(); });
    on('btn-home-retry', startRetry);

    // 7단계 신규: 배지 보관함 보기
    on('btn-menu-badge', function () {
      renderBadgeList();
      showScreen('screen-badge-list');
    });
    on('btn-badge-list-home', goHome);
    on('btn-result-view-badges', function () {
      renderBadgeList();
      showScreen('screen-badge-list');
    });

    // 개념 학습 화면 이벤트
    on('btn-concept-list-home', goHome);
    on('btn-concept-prev', function () {
      if (currentConceptIndex > 0) { openConceptDetail(currentConceptIndex - 1); }
    });
    on('btn-concept-next', function () {
      var concepts = getConcepts();
      if (currentConceptIndex < concepts.length - 1) { openConceptDetail(currentConceptIndex + 1); }
    });
    on('btn-concept-start-quiz', function () {
      var concepts = getConcepts();
      var c = concepts[currentConceptIndex];
      if (c) { startChoiceByType(c.category); }
    });
    on('btn-concept-to-list', function () {
      renderConceptList();
      showScreen('screen-concept-list');
    });
    on('btn-concept-to-home', goHome);

    // 선택형 퀴즈 화면 이벤트
    on('btn-choice-1', function () { onChooseChoice(0); });
    on('btn-choice-2', function () { onChooseChoice(1); });
    on('btn-next', onNextChoice);
    on('btn-quiz-home', onQuizHome);

    // 직접 입력형 퀴즈 화면 이벤트 및 IME 핸들러
    var input = $('writing-answer-input');
    if (input) {
      input.addEventListener('compositionstart', function () { isComposing = true; });
      input.addEventListener('compositionend', function () { isComposing = false; });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          if (e.isComposing || isComposing || e.keyCode === 229) { return; }
          e.preventDefault();
          submitWritingAnswer();
        }
      });
    }

    on('btn-writing-submit', function () {
      if (isComposing) { return; }
      submitWritingAnswer();
    });

    on('btn-writing-next', onNextWriting);
    on('btn-writing-home', onQuizHome);

    // 8단계 신규: 최근 학습 결과 바로보기 배너 이벤트
    on('btn-home-view-analysis', function () {
      if (lastCompletedResult) {
        renderResult();
        showScreen('screen-result');
      }
    });

    // 8단계 신규: 추천 유형 한 번에 학습하기 버튼 이벤트
    on('btn-recommend-batch', startRecommendedBatch);

    // 8단계 신규: 개념 학습 화면에서 결과 화면으로 돌아가기
    on('btn-concept-back-to-result', function () {
      conceptNavOrigin = null;
      if (lastCompletedResult) {
        showScreen('screen-result');
      } else {
        goHome();
      }
    });

    // 결과 및 오답 노트 이벤트
    on('btn-result-home', function () {
      conceptNavOrigin = null;
      goHome();
    });
    on('btn-open-notebook', function () { renderNotebook(); showScreen('screen-notebook'); });
    on('btn-notebook-back', function () { showScreen('screen-result'); });
    on('btn-retry-wrong', startRetry);
  }

  function init() {
    bindEvents();
    renderHome();
    showScreen('screen-home');
    var err = checkChoiceData() || checkWritingData();
    if (err) { showNotice(err); }
  }

  // 자동화 테스트 및 디버깅용 인터페이스
  window.__quizDebug = {
    getSession: function () { return session; },
    getLastResult: function () { return lastCompletedResult; },
    getConceptIndex: function () { return currentConceptIndex; },
    setComposing: function (val) { isComposing = val; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
