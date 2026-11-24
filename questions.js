// 한글맞춤법 마스터 - 퀴즈 문항 데이터 (총 36문항)
// 정답 판정은 버튼 위치가 아니라 각 문항의 correct / incorrect 값으로 합니다.
// (10번은 복수 정답 논란 방지를 위해 대체 문항만 등록되어 있습니다.)
window.QUESTIONS = [
  // 유형 1. 안 / 않 (4문항)
  { id: 1, category: "안 / 않", correct: "안 벌고 안 쓸 거야.", incorrect: "않 벌고 않 쓸 거야.", explanation: "‘안’은 ‘아니’의 준말인 부사로, 뒤에 오는 서술어와 띄어 쓴다." },
  { id: 2, category: "안 / 않", correct: "벌지 않고 쓰지 않을 거야.", incorrect: "벌지 안고 쓰지 안을 거야.", explanation: "‘않-’은 ‘아니하-’의 준말이다. ‘-지 않다’의 형태로 부정을 나타낸다." },
  { id: 3, category: "안 / 않", correct: "비가 오지 않았다.", incorrect: "비가 오지 안았다.", explanation: "‘오지 아니하였다’가 줄어든 표현이므로 ‘오지 않았다’가 올바르다." },
  { id: 4, category: "안 / 않", correct: "비가 안 온다.", incorrect: "비가 않 온다.", explanation: "서술어 앞에서 부정을 나타내는 부사 ‘안’을 사용한다." },

  // 유형 2. 되 / 돼 (3문항)
  { id: 5, category: "되 / 돼", correct: "나는 약속한 시간이 돼서 밖으로 나갔다.", incorrect: "나는 약속한 시간이 되서 밖으로 나갔다.", explanation: "‘되어서’를 줄이면 ‘돼서’가 된다." },
  { id: 6, category: "되 / 돼", correct: "언제 시간이 되니?", incorrect: "언제 시간이 돼니?", explanation: "‘되다’의 어간 ‘되-’에 어미 ‘-니’가 결합하므로 ‘되니’가 올바르다." },
  { id: 7, category: "되 / 돼", correct: "드디어 17살이 됐다.", incorrect: "드디어 17살이 됬다.", explanation: "‘되었다’의 준말은 ‘됐다’이다." },

  // 유형 3. -데 / -대 (2문항)
  { id: 8, category: "-데 / -대", correct: "어제 직접 들어 보니 그 사람 참 말 잘하데.", incorrect: "어제 직접 들어 보니 그 사람 참 말 잘하대.", explanation: "화자가 직접 경험한 사실을 전달할 때는 종결 어미 ‘-데’를 사용한다. 이 문맥에서는 ‘-더라’와 비슷한 뜻을 나타낸다." },
  { id: 9, category: "-데 / -대", correct: "친구에게 들었는데 걔네 결혼한대.", incorrect: "친구에게 들었는데 걔네 결혼한데.", explanation: "다른 사람에게 들은 내용을 전달할 때는 ‘-대’를 사용한다. ‘결혼한다고 해’가 줄어든 표현이다." },

  // 유형 4. 어떻게 / 어떡해 (3문항) - 10번은 대체 문항
  { id: 10, category: "어떻게 / 어떡해", correct: "오늘도 안 오면 어떡해야 하지?", incorrect: "오늘도 안 오면 어떻게야 하지?", explanation: "‘어떡해야’는 ‘어떻게 해야’가 줄어든 표현이다." },
  { id: 11, category: "어떻게 / 어떡해", correct: "어떻게 나에게 그럴 수가 있어?", incorrect: "어떡해 나에게 그럴 수가 있어?", explanation: "‘어떻게’는 뒤에 오는 서술어를 수식할 수 있다. ‘어떡해’는 ‘어떻게 해’의 준말이므로 이 문맥에는 적절하지 않다." },
  { id: 12, category: "어떻게 / 어떡해", correct: "선생님, 저는 어떻게 하면 좋겠어요?", incorrect: "선생님, 저는 어떡해면 좋겠어요?", explanation: "뒤에 오는 ‘하면’을 수식하는 표현으로 ‘어떻게’를 사용한다." },

  // 유형 5. 왠지 / 웬 (3문항)
  { id: 13, category: "왠지 / 웬", correct: "웬 놈이야?", incorrect: "왠 놈이야?", explanation: "‘어찌 된’ 또는 ‘어떠한’이라는 의미로 명사를 수식할 때는 ‘웬’을 사용한다." },
  { id: 14, category: "왠지 / 웬", correct: "너, 오늘따라 왠지 멋져 보인다.", incorrect: "너, 오늘따라 웬지 멋져 보인다.", explanation: "‘왜인지’가 줄어든 말은 ‘왠지’이며, 이유를 정확히 알 수 없다는 뜻을 나타낸다." },
  { id: 15, category: "왠지 / 웬", correct: "웬만하면 네 말대로 하자.", incorrect: "왠만하면 네 말대로 하자.", explanation: "‘웬만하다’가 올바른 표준어이므로 ‘웬만하면’으로 쓴다." },

  // 유형 6. 오랜만 / 오랫동안 (2문항)
  { id: 16, category: "오랜만 / 오랫동안", correct: "오랜만에 친구들을 만났다.", incorrect: "오랫만에 친구들을 만났다.", explanation: "‘오랜만’은 ‘오래간만’의 준말이므로 사이시옷을 넣지 않는다." },
  { id: 17, category: "오랜만 / 오랫동안", correct: "오랫동안 망설였다.", incorrect: "오랜동안 망설였다.", explanation: "긴 시간 동안이라는 뜻의 한 단어는 ‘오랫동안’으로 쓴다." },

  // 유형 7. 낫다 / 낳다 (4문항)
  { id: 18, category: "낫다 / 낳다", correct: "감기가 다 나았다.", incorrect: "감기가 다 낳았다.", explanation: "병이나 상처가 회복되는 것을 ‘낫다’라고 한다. ‘낫다’는 ㅅ 불규칙 활용을 하므로 과거형은 ‘나았다’이다." },
  { id: 19, category: "낫다 / 낳다", correct: "소문이 소문을 낳았다.", incorrect: "소문이 소문을 나았다.", explanation: "어떤 결과를 이루거나 가져온다는 뜻으로는 ‘낳다’를 사용한다." },
  { id: 20, category: "낫다 / 낳다", correct: "나는 여름이 겨울보다 낫다.", incorrect: "나는 여름이 겨울보다 낳다.", explanation: "어떤 것이 다른 것보다 더 좋거나 앞선다는 뜻으로는 ‘낫다’를 사용한다." },
  { id: 21, category: "낫다 / 낳다", correct: "쌍둥이를 낳았다.", incorrect: "쌍둥이를 나았다.", explanation: "아이를 출산한다는 뜻의 동사는 ‘낳다’이며, 과거형은 ‘낳았다’이다." },

  // 유형 8. 맞히다 / 맞추다 (6문항)
  { id: 22, category: "맞히다 / 맞추다", correct: "분해한 부품을 다시 맞췄다.", incorrect: "분해한 부품을 다시 맞혔다.", explanation: "서로 떨어진 부분을 제자리에 맞게 결합할 때는 ‘맞추다’를 사용한다." },
  { id: 23, category: "맞히다 / 맞추다", correct: "활을 쏘아 화살을 과녁에 맞혔다.", incorrect: "활을 쏘아 화살을 과녁에 맞췄다.", explanation: "화살이 표적에 적중하도록 하는 행위는 ‘맞히다’로 표현한다." },
  { id: 24, category: "맞히다 / 맞추다", correct: "혼자 퀴즈를 풀어 정답을 다 맞혔다.", incorrect: "혼자 퀴즈를 풀어 정답을 다 맞췄다.", explanation: "문제를 풀어 올바른 답을 알아내는 것은 ‘맞히다’이다." },
  { id: 25, category: "맞히다 / 맞추다", correct: "서로의 답을 비교하려고 친구와 답을 맞추어 보았다.", incorrect: "서로의 답을 비교하려고 친구와 답을 맞히어 보았다.", explanation: "둘 이상의 대상을 비교하여 살필 때는 ‘맞추다’를 사용한다." },
  { id: 26, category: "맞히다 / 맞추다", correct: "화분에 비를 맞히지 말아라.", incorrect: "화분에 비를 맞추지 말아라.", explanation: "어떤 대상이 비나 눈 등을 맞게 한다는 뜻으로는 ‘맞히다’를 사용한다." },
  { id: 27, category: "맞히다 / 맞추다", correct: "약속 시간에 맞춰 갔다.", incorrect: "약속 시간에 맞혀 갔다.", explanation: "정해진 기준이나 시간에 어긋나지 않게 할 때는 ‘맞추다’를 사용한다." },

  // 유형 9. -율 / -률 (9문항)
  { id: 28, category: "-율 / -률", correct: "확률", incorrect: "확율", explanation: "‘확’은 ㄱ 받침으로 끝나므로 ‘률’을 붙인다." },
  { id: 29, category: "-율 / -률", correct: "수익률", incorrect: "수익율", explanation: "‘익’은 ㄱ 받침으로 끝나므로 ‘률’을 붙인다." },
  { id: 30, category: "-율 / -률", correct: "취업률", incorrect: "취업율", explanation: "‘업’은 ㅂ 받침으로 끝나므로 ‘률’을 붙인다." },
  { id: 31, category: "-율 / -률", correct: "비율", incorrect: "비률", explanation: "‘비’는 받침이 없으므로 ‘율’을 붙인다." },
  { id: 32, category: "-율 / -률", correct: "연체율", incorrect: "연체률", explanation: "‘체’는 받침이 없으므로 ‘율’을 붙인다." },
  { id: 33, category: "-율 / -률", correct: "증가율", incorrect: "증가률", explanation: "‘가’는 받침이 없으므로 ‘율’을 붙인다." },
  { id: 34, category: "-율 / -률", correct: "백분율", incorrect: "백분률", explanation: "‘분’은 ㄴ 받침으로 끝나므로 ‘율’을 붙인다." },
  { id: 35, category: "-율 / -률", correct: "환율", incorrect: "환률", explanation: "‘환’은 ㄴ 받침으로 끝나므로 ‘율’을 붙인다." },
  { id: 36, category: "-율 / -률", correct: "할인율", incorrect: "할인률", explanation: "‘인’은 ㄴ 받침으로 끝나므로 ‘율’을 붙인다." }
];

// 유형별 기대 문항 수 (검증용)
window.EXPECTED_CATEGORY_COUNTS = {
  "안 / 않": 4,
  "되 / 돼": 3,
  "-데 / -대": 2,
  "어떻게 / 어떡해": 3,
  "왠지 / 웬": 3,
  "오랜만 / 오랫동안": 2,
  "낫다 / 낳다": 4,
  "맞히다 / 맞추다": 6,
  "-율 / -률": 9
};

// 문항 데이터 검증 함수: { ok, errors, total, counts } 반환
window.validateQuestions = function (questions, expectedCounts) {
  var errors = [];
  var counts = {};
  var list = questions === undefined ? window.QUESTIONS : questions;
  var expected = expectedCounts === undefined ? window.EXPECTED_CATEGORY_COUNTS : expectedCounts;
  var fields = ["id", "category", "correct", "incorrect", "explanation"];
  var seen = {};
  var i, j;

  if (!Array.isArray(list)) {
    return { ok: false, errors: ["QUESTIONS가 배열이 아닙니다."], total: 0, counts: counts };
  }

  for (i = 0; i < list.length; i++) {
    var q = list[i];
    var label = "배열 " + (i + 1) + "번째 항목";
    if (q === null || typeof q !== "object") {
      errors.push(label + ": 객체가 아닙니다.");
      continue;
    }
    for (j = 0; j < fields.length; j++) {
      var f = fields[j];
      if (!(f in q)) {
        errors.push(label + ": '" + f + "' 속성이 없습니다.");
      } else if (f !== "id" && (typeof q[f] !== "string" || q[f].replace(/\s/g, "") === "")) {
        errors.push(label + " (id " + q.id + "): '" + f + "' 값이 비어 있거나 문자열이 아닙니다.");
      }
    }
    if (typeof q.id !== "number" || q.id % 1 !== 0) {
      errors.push(label + ": id가 정수가 아닙니다. (" + q.id + ")");
    } else if (seen[q.id]) {
      errors.push("id " + q.id + "가 중복되었습니다.");
    } else {
      seen[q.id] = true;
    }
    if (q.correct === q.incorrect) {
      errors.push("id " + q.id + ": 정답과 오답이 같습니다.");
    }
    if (typeof q.correct === "string" && q.correct.indexOf("\uFFFD") !== -1) {
      errors.push("id " + q.id + ": 인코딩 깨짐 문자가 있습니다.");
    }
    if (typeof q.category === "string") {
      counts[q.category] = (counts[q.category] || 0) + 1;
    }
  }

  var total = list.length;
  var expectedTotal = 0;
  var cat;
  if (expected) {
    for (cat in expected) {
      if (Object.prototype.hasOwnProperty.call(expected, cat)) {
        expectedTotal += expected[cat];
        if ((counts[cat] || 0) !== expected[cat]) {
          errors.push("유형 '" + cat + "': 문항 수가 " + (counts[cat] || 0) + "개입니다. (기대 " + expected[cat] + "개)");
        }
      }
    }
    for (cat in counts) {
      if (Object.prototype.hasOwnProperty.call(counts, cat) && !(cat in expected)) {
        errors.push("정의되지 않은 유형 '" + cat + "'이(가) 있습니다.");
      }
    }
    if (total !== expectedTotal) {
      errors.push("전체 문항 수가 " + total + "개입니다. (기대 " + expectedTotal + "개)");
    }
  }
  for (i = 1; i <= total; i++) {
    if (!seen[i]) { errors.push("id " + i + "번이 누락되었습니다. (1~" + total + " 연속이어야 함)"); }
  }

  return { ok: errors.length === 0, errors: errors, total: total, counts: counts };
};
