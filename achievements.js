// 한글맞춤법 마스터 - 성취 배지 정의 및 판정 시스템
// 총 6가지 성취 배지 정의 및 메모리 기반 획득 상태 관리

window.ACHIEVEMENT_DEFINITIONS = [
  {
    id: "badge-first-step",
    name: "첫걸음",
    description: "맞춤법 학습을 시작하고 끝까지 완료했어요.",
    conditionText: "복습을 제외한 선택형 또는 직접 입력형 학습 최초 1회 완료",
    icon: "🌱"
  },
  {
    id: "badge-streak-champion",
    name: "연속 정답 챔피언",
    description: "다섯 문제를 연속으로 맞혔어요.",
    conditionText: "한 세션에서 최고 연속 정답 수 5 이상 달성",
    icon: "🔥"
  },
  {
    id: "badge-accurate-korean",
    name: "정확한 한글",
    description: "높은 정확도로 맞춤법 실력을 보여 주었어요.",
    conditionText: "복습 제외 10문항 이상 세션에서 실제 정답률 90% 이상 (정답수 / 전체문항 >= 0.9)",
    icon: "🎯"
  },
  {
    id: "badge-hangeul-explorer",
    name: "한글 탐험가",
    description: "아홉 가지 맞춤법 유형을 모두 탐험했어요.",
    conditionText: "완료된 일반 학습 기록을 기준으로 9가지 맞춤법 유형 모두 학습 완료",
    icon: "📖"
  },
  {
    id: "badge-wrong-master",
    name: "오답 정복",
    description: "틀렸던 문제를 다시 학습하여 모두 해결했어요.",
    conditionText: "이전 오답이 1개 이상 존재하고 오답 복습 세션의 모든 문제를 맞힘",
    icon: "🔄"
  },
  {
    id: "badge-spelling-master",
    name: "맞춤법 마스터",
    description: "선택형 맞춤법 퀴즈 36문항을 모두 맞혔어요.",
    conditionText: "전체 선택형 퀴즈 36문항 세션에서 36문항 모두 정답",
    icon: "🏆"
  }
];

// 메모리 기반 배지 획득 상태 및 완료 기록 저장소
// (브라우저 탭 세션 동안 메모리에 유지)
window.AchievementManager = (function () {
  'use strict';

  var unlockedBadges = {}; // { badgeId: { id, unlockedAt, sessionId } }
  var completedSessions = []; // [ completedResultObject, ... ]
  var exploredCategories = {}; // { categoryName: true }
  var processedSessionIds = {}; // 동일 세션 ID 중복 평가 방지

  var ALL_9_CATEGORIES = [
    "안 / 않", "되 / 돼", "-데 / -대", "어떻게 / 어떡해",
    "왠지 / 웬", "오랜만 / 오랫동안", "낫다 / 낳다", "맞히다 / 맞추다", "-율 / -률"
  ];

  function getUnlockedList() {
    return Object.keys(unlockedBadges).map(function (id) {
      return unlockedBadges[id];
    });
  }

  function isUnlocked(badgeId) {
    return Boolean(unlockedBadges[badgeId]);
  }

  function unlock(badgeId, sessionId) {
    if (unlockedBadges[badgeId]) {
      return false; // 이미 획득한 배지는 덮어쓰지 않음
    }
    var now = new Date();
    var timeStr = now.getFullYear() + '.' +
      ('0' + (now.getMonth() + 1)).slice(-2) + '.' +
      ('0' + now.getDate()).slice(-2) + ' ' +
      ('0' + now.getHours()).slice(-2) + ':' +
      ('0' + now.getMinutes()).slice(-2);

    unlockedBadges[badgeId] = {
      id: badgeId,
      unlockedAt: timeStr,
      sessionId: sessionId || ''
    };
    return true;
  }

  // 학습 세션 완료 시 배지 조건 평가
  // completedResult: { sessionId, mode, scope, label, total, correct, wrong, score, rate, bestStreak, wrongQuestions, ... }
  function evaluateSession(result) {
    if (!result || !result.sessionId) {
      return [];
    }

    // 동일 세션 중복 처리 방어
    if (processedSessionIds[result.sessionId]) {
      return [];
    }
    processedSessionIds[result.sessionId] = true;

    // 세션 기록 사본 보존 (참조 분리)
    completedSessions.push(JSON.parse(JSON.stringify(result)));

    var newlyUnlocked = [];

    // 1. 배지 1: 첫걸음 (복습을 제외한 일반 선택형/직접입력형 최초 완료)
    if (result.scope !== 'retry') {
      if (unlock('badge-first-step', result.sessionId)) {
        newlyUnlocked.push('badge-first-step');
      }
    }

    // 2. 배지 2: 연속 정답 챔피언 (해당 세션 최고 연속 정답 수 5 이상)
    if (result.bestStreak >= 5) {
      if (unlock('badge-streak-champion', result.sessionId)) {
        newlyUnlocked.push('badge-streak-champion');
      }
    }

    // 3. 배지 3: 정확한 한글 (복습 제외 10문항 이상, 실제 정답수/전체 >= 0.9)
    if (result.scope !== 'retry' && result.total >= 10) {
      var exactAccuracy = result.correct / result.total;
      if (exactAccuracy >= 0.9) {
        if (unlock('badge-accurate-korean', result.sessionId)) {
          newlyUnlocked.push('badge-accurate-korean');
        }
      }
    }

    // 4. 배지 4: 한글 탐험가 (완료된 일반 학습 기록 기준으로 9가지 맞춤법 유형 모두 학습)
    if (result.scope !== 'retry') {
      if (result.scope === 'all') {
        // 전체 퀴즈를 완료했으면 9개 유형 모두 탐험 완료
        ALL_9_CATEGORIES.forEach(function (cat) { exploredCategories[cat] = true; });
      } else if (result.scope === 'category' && result.label) {
        exploredCategories[result.label] = true;
      }

      var exploredCount = 0;
      ALL_9_CATEGORIES.forEach(function (cat) {
        if (exploredCategories[cat]) { exploredCount += 1; }
      });

      if (exploredCount === 9) {
        if (unlock('badge-hangeul-explorer', result.sessionId)) {
          newlyUnlocked.push('badge-hangeul-explorer');
        }
      }
    }

    // 5. 배지 5: 오답 정복 (이전에 틀린 문항 1개 이상 존재, 복습 세션에서 모든 문제 정답)
    if (result.scope === 'retry' && result.total >= 1 && result.correct === result.total) {
      if (unlock('badge-wrong-master', result.sessionId)) {
        newlyUnlocked.push('badge-wrong-master');
      }
    }

    // 6. 배지 6: 맞춤법 마스터 (선택형 36문항 전체 퀴즈 36문항 만점)
    if (result.mode === 'choice' && result.scope === 'all' && result.total === 36 && result.correct === 36) {
      if (unlock('badge-spelling-master', result.sessionId)) {
        newlyUnlocked.push('badge-spelling-master');
      }
    }

    return newlyUnlocked;
  }

  // 상태 리셋 (테스트용 또는 명시적 초기화)
  function reset() {
    unlockedBadges = {};
    completedSessions = [];
    exploredCategories = {};
    processedSessionIds = {};
  }

  return {
    getDefinitions: function () { return window.ACHIEVEMENT_DEFINITIONS; },
    getUnlockedList: getUnlockedList,
    isUnlocked: isUnlocked,
    evaluateSession: evaluateSession,
    getExploredCount: function () { return Object.keys(exploredCategories).length; },
    reset: reset
  };
})();
