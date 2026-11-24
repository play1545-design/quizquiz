// 한글맞춤법 마스터 - 맞춤형 학습 결과 분석 및 취약 유형 추천 엔진
// 외부 AI 및 라이브러리 없이 순수 JavaScript 규칙 기반으로 동작합니다.

(function () {
  'use strict';

  // 9대 유형별 맞춤형 학습 피드백 메시지 데이터
  var CATEGORY_FEEDBACK_MESSAGES = {
    "안 / 않": "‘아니’와 ‘아니하-’의 차이를 생각하며 부정 표현을 다시 연습해 보세요.",
    "되 / 돼": "‘돼’를 ‘되어’로 바꾸어 문맥과 활용에 맞는지 확인해 보세요.",
    "-데 / -대": "직접 경험한 사실인지 다른 사람에게 전해 들은 내용인지 구별해 보세요.",
    "어떻게 / 어떡해": "‘어떡해’를 ‘어떻게 해’로 풀어서 문장에 어울리는지 생각해 보세요.",
    "왠지 / 웬": "‘왜인지’의 준말인 ‘왠지’와 명사를 수식하는 ‘웬’을 구별해 보세요.",
    "오랜만 / 오랫동안": "‘오랜만’과 ‘오랫동안’의 올바른 표기를 예문과 함께 기억해 보세요.",
    "낫다 / 낳다": "회복이나 비교를 뜻하는 ‘낫다’와 출산이나 결과를 뜻하는 ‘낳다’를 구별해 보세요.",
    "맞히다 / 맞추다": "정답이나 적중을 뜻하는 ‘맞히다’와 비교하거나 조정하는 ‘맞추다’를 구별해 보세요.",
    "-율 / -률": "앞 글자에 받침이 있는지, 그 받침이 ㄴ인지 확인해 보세요."
  };

  var CANONICAL_CATEGORIES = [
    "안 / 않", "되 / 돼", "-데 / -대", "어떻게 / 어떡해",
    "왠지 / 웬", "오랜만 / 오랫동안", "낫다 / 낳다", "맞히다 / 맞추다", "-율 / -률"
  ];

  // 완료된 세션 결과를 기반으로 유형별 성취도 분석
  // result: { total, correct, wrong, responses, mode, scope, ... }
  function analyzeSession(result) {
    if (!result || typeof result !== 'object') {
      return null;
    }

    var totalQuestions = result.total || 0;
    var responses = Array.isArray(result.responses) ? result.responses : [];

    // 방어 코드: 전체 문항 수가 0이거나 완료된 응답이 없는 경우
    if (totalQuestions <= 0 || responses.length === 0) {
      return null;
    }

    // 유형별 집계
    var catMap = {};
    var appearedOrder = [];

    responses.forEach(function (r) {
      if (!r || typeof r.category !== 'string') { return; }
      var cat = r.category;
      if (!catMap[cat]) {
        catMap[cat] = {
          category: cat,
          total: 0,
          correct: 0,
          incorrect: 0
        };
        appearedOrder.push(cat);
      }
      catMap[cat].total += 1;
      if (r.isCorrect) {
        catMap[cat].correct += 1;
      } else {
        catMap[cat].incorrect += 1;
      }
    });

    // 9개 정규 유형 순서에 맞추어 출제된 유형만 정렬 (미출제 유형은 제외)
    var sortedCats = CANONICAL_CATEGORIES.filter(function (c) {
      return Boolean(catMap[c]);
    });

    // 유형별 세부 성취 지표 계산
    var categoryStats = sortedCats.map(function (c) {
      var item = catMap[c];
      var acc = item.total > 0 ? (item.correct / item.total) : 0;
      var status = "집중 복습 권장";
      if (acc === 1) {
        status = "이번 학습 모두 정답";
      } else if (acc >= 0.8) {
        status = "우수";
      } else if (acc >= 0.6) {
        status = "추가 연습 권장";
      }

      return {
        category: item.category,
        total: item.total,
        correct: item.correct,
        incorrect: item.incorrect,
        accuracy: acc, // 반올림 전 실제 정답 비율 (0~1)
        accuracyPercent: acc * 100, // 0~100
        displayAccuracy: (acc * 100).toFixed(1) + "%",
        status: status,
        isSmallSample: item.total <= 3, // 문항 수가 3개 이하인 경우 소수 문항 플래그
        feedback: CATEGORY_FEEDBACK_MESSAGES[item.category] || "맞춤법 규칙과 예문을 다시 복습해 보세요."
      };
    });

    // 맞춤형 취약 유형 추천 계산
    var recommendations = generateRecommendations(categoryStats);

    return {
      totalQuestions: totalQuestions,
      correctQuestions: result.correct || 0,
      incorrectQuestions: result.wrong || 0,
      score: result.score || 0,
      rate: result.rate || 0,
      attemptedCategories: categoryStats,
      categoryStats: categoryStats,
      categoryMap: (function () {
        var m = {};
        categoryStats.forEach(function (cs) { m[cs.category] = cs; });
        return m;
      })(),
      recommendations: recommendations,
      mainRecommendations: recommendations.slice(0, 3), // 메인 추천 영역용 최대 3개
      remainingRecommendations: recommendations.slice(3) // 추가 목록용
    };
  }

  // 취약 유형 추천 알고리즘 (지정된 10대 규칙 엄격 준수)
  function generateRecommendations(categoryStats) {
    if (!categoryStats || categoryStats.length === 0) {
      return [];
    }

    // 규칙 ⑧: 모든 문제를 맞혔다면 취약 유형을 임의로 생성하지 않음
    var totalWrong = categoryStats.reduce(function (sum, item) {
      return sum + item.incorrect;
    }, 0);
    if (totalWrong === 0) {
      return [];
    }

    // 후보군 1: 오답이 하나 이상 존재하고 실제 정답률이 70% 미만 (< 0.7)인 유형
    var primaryCandidates = categoryStats.filter(function (item) {
      return item.incorrect > 0 && item.accuracy < 0.7;
    });

    var candidates = [];
    if (primaryCandidates.length > 0) {
      candidates = primaryCandidates.slice();
    } else {
      // 규칙 ②: 70% 미만 유형이 하나도 없지만 오답이 존재한다면, 오답이 있는 유형 중 실제 정답률이 가장 낮은 유형들 선정
      var wrongHaving = categoryStats.filter(function (item) {
        return item.incorrect > 0;
      });
      if (wrongHaving.length > 0) {
        // 최저 정답률 구하기
        var minAcc = Math.min.apply(null, wrongHaving.map(function (x) { return x.accuracy; }));
        candidates = wrongHaving.filter(function (x) {
          return Math.abs(x.accuracy - minAcc) < 0.000001;
        });
      }
    }

    // 정렬 원칙:
    // ③ 실제 정답률이 낮은 순서 (accuracy 오름차순)
    // ④ 정답률이 같다면 오답 수가 많은 유형 먼저 (incorrect 내림차순)
    // ⑤ 정답률과 오답 수가 모두 같다면 기존 9개 유형의 등록 순서 유지
    candidates.sort(function (a, b) {
      if (Math.abs(a.accuracy - b.accuracy) > 0.000001) {
        return a.accuracy - b.accuracy;
      }
      if (a.incorrect !== b.incorrect) {
        return b.incorrect - a.incorrect;
      }
      var idxA = CANONICAL_CATEGORIES.indexOf(a.category);
      var idxB = CANONICAL_CATEGORIES.indexOf(b.category);
      return idxA - idxB;
    });

    // 추천 이유 문구 부착
    return candidates.map(function (item) {
      var reason = "";
      if (item.accuracy === 0) {
        reason = "해당 유형의 문제를 모두 틀려 개념 원리의 재학습이 꼭 필요합니다.";
      } else if (item.accuracy < 0.6) {
        reason = "오답이 " + item.incorrect + "개 발생하여 집중적인 복습이 권장됩니다.";
      } else {
        reason = "정답률이 " + item.displayAccuracy + "로 다소 아쉬워 보완 학습을 추천합니다.";
      }

      return {
        category: item.category,
        total: item.total,
        correct: item.correct,
        incorrect: item.incorrect,
        accuracy: item.accuracy,
        displayAccuracy: item.displayAccuracy,
        reason: reason,
        feedback: item.feedback,
        isSmallSample: item.isSmallSample
      };
    });
  }

  window.SpellingAnalytics = {
    analyzeSession: analyzeSession,
    getCategoryFeedback: function (cat) {
      return CATEGORY_FEEDBACK_MESSAGES[cat] || "";
    },
    getCanonicalCategories: function () {
      return CANONICAL_CATEGORIES.slice();
    }
  };
})();
