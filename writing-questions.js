// 한글맞춤법 마스터 - 직접 입력형 맞춤법 수정 문항 데이터 (총 18문항, 9개 유형 × 2문항)
// prefix + target + suffix = 잘못된 원래 문장
// prefix + acceptedAnswers[i] + suffix = 올바른 정답 문장
window.WRITING_QUESTIONS = [
  // 유형 1. 안 / 않 (2문항)
  {
    id: "W01",
    category: "안 / 않",
    prefix: "비가 오지 ",
    target: "안았다",
    suffix: ".",
    acceptedAnswers: ["않았다"],
    explanation: "‘않-’은 ‘아니하-’의 준말이다. 부정을 나타내는 ‘-지 않았다’의 형태로 써야 한다."
  },
  {
    id: "W02",
    category: "안 / 않",
    prefix: "비가 ",
    target: "않",
    suffix: " 온다.",
    acceptedAnswers: ["안"],
    explanation: "서술어 앞에서 부정을 나타내는 부사 ‘안’을 사용한다."
  },

  // 유형 2. 되 / 돼 (2문항)
  {
    id: "W03",
    category: "되 / 돼",
    prefix: "나는 약속한 시간이 ",
    target: "되서",
    suffix: " 밖으로 나갔다.",
    acceptedAnswers: ["돼서", "되어서"],
    explanation: "‘되어서’를 줄이면 ‘돼서’가 된다. 본말인 ‘되어서’도 올바른 표현이다."
  },
  {
    id: "W04",
    category: "되 / 돼",
    prefix: "언제 시간이 ",
    target: "돼니",
    suffix: "?",
    acceptedAnswers: ["되니"],
    explanation: "‘되다’의 어간 ‘되-’에 어미 ‘-니’가 결합한 형태이다."
  },

  // 유형 3. -데 / -대 (2문항)
  {
    id: "W05",
    category: "-데 / -대",
    prefix: "어제 직접 들어 보니 그 사람 참 말 ",
    target: "잘하대",
    suffix: ".",
    acceptedAnswers: ["잘하데"],
    guidance: "-데와 -대 중 알맞은 종결 어미를 사용하여 고쳐 보세요.",
    explanation: "직접 경험한 사실을 보고하듯이 전달하는 종결 표현에는 ‘-데’를 사용할 수 있다."
  },
  {
    id: "W06",
    category: "-데 / -대",
    prefix: "친구에게 들었는데 걔네 ",
    target: "결혼한데",
    suffix: ".",
    acceptedAnswers: ["결혼한대"],
    guidance: "-데와 -대 중 알맞은 종결 어미를 사용하여 고쳐 보세요.",
    explanation: "다른 사람에게 전해 들은 내용을 전달하는 ‘결혼한다고 해’의 준말은 ‘결혼한대’이다."
  },

  // 유형 4. 어떻게 / 어떡해 (2문항)
  {
    id: "W07",
    category: "어떻게 / 어떡해",
    prefix: "오늘도 안 오면 ",
    target: "어떻게야",
    suffix: " 하지?",
    acceptedAnswers: ["어떡해야", "어떻게 해야"],
    explanation: "‘어떡해야’는 ‘어떻게 해야’의 준말이다. 두 표현 모두 사용할 수 있다."
  },
  {
    id: "W08",
    category: "어떻게 / 어떡해",
    prefix: "",
    target: "어떡해",
    suffix: " 나에게 그럴 수가 있어?",
    acceptedAnswers: ["어떻게"],
    explanation: "뒤에 오는 서술어를 수식하는 표현이므로 ‘어떻게’를 사용한다."
  },

  // 유형 5. 왠지 / 웬 (2문항)
  {
    id: "W09",
    category: "왠지 / 웬",
    prefix: "너, 오늘따라 ",
    target: "웬지",
    suffix: " 멋져 보인다.",
    acceptedAnswers: ["왠지"],
    explanation: "‘왠지’는 ‘왜인지’의 준말이다."
  },
  {
    id: "W10",
    category: "왠지 / 웬",
    prefix: "",
    target: "왠만하면",
    suffix: " 네 말대로 하자.",
    acceptedAnswers: ["웬만하면"],
    explanation: "표준어 ‘웬만하다’를 활용한 형태는 ‘웬만하면’이다."
  },

  // 유형 6. 오랜만 / 오랫동안 (2문항)
  {
    id: "W11",
    category: "오랜만 / 오랫동안",
    prefix: "",
    target: "오랫만",
    suffix: "에 친구들을 만났다.",
    acceptedAnswers: ["오랜만"],
    explanation: "‘오랜만’은 ‘오래간만’의 준말이다."
  },
  {
    id: "W12",
    category: "오랜만 / 오랫동안",
    prefix: "",
    target: "오랜동안",
    suffix: " 망설였다.",
    acceptedAnswers: ["오랫동안"],
    explanation: "긴 시간 동안이라는 뜻의 한 단어는 ‘오랫동안’이다."
  },

  // 유형 7. 낫다 / 낳다 (2문항)
  {
    id: "W13",
    category: "낫다 / 낳다",
    prefix: "감기가 다 ",
    target: "낳았다",
    suffix: ".",
    acceptedAnswers: ["나았다"],
    explanation: "병이 회복되는 것은 ‘낫다’이며, ㅅ 불규칙 활용에 따라 ‘나았다’로 쓴다."
  },
  {
    id: "W14",
    category: "낫다 / 낳다",
    prefix: "쌍둥이를 ",
    target: "나았다",
    suffix: ".",
    acceptedAnswers: ["낳았다"],
    explanation: "아이를 출산한다는 뜻의 동사는 ‘낳다’이므로 ‘낳았다’가 올바르다."
  },

  // 유형 8. 맞히다 / 맞추다 (2문항)
  {
    id: "W15",
    category: "맞히다 / 맞추다",
    prefix: "혼자 퀴즈를 풀어 정답을 다 ",
    target: "맞췄다",
    suffix: ".",
    acceptedAnswers: ["맞혔다", "맞히었다"],
    explanation: "문제를 풀어 올바른 답을 알아내는 것은 ‘맞히다’이다. ‘맞혔다’는 ‘맞히었다’의 준말이다."
  },
  {
    id: "W16",
    category: "맞히다 / 맞추다",
    prefix: "서로의 답을 비교하려고 친구와 답을 ",
    target: "맞히어",
    suffix: " 보았다.",
    acceptedAnswers: ["맞추어", "맞춰"],
    explanation: "둘 이상의 대상을 비교할 때는 ‘맞추다’를 사용한다. ‘맞추어’와 그 준말인 ‘맞춰’를 모두 허용한다."
  },

  // 유형 9. -율 / -률 (2문항)
  {
    id: "W17",
    category: "-율 / -률",
    prefix: "주사위에서 6이 나올 ",
    target: "확율",
    suffix: "을 구했다.",
    acceptedAnswers: ["확률"],
    explanation: "‘확’은 ㄱ 받침으로 끝나므로 ‘률’을 붙인다."
  },
  {
    id: "W18",
    category: "-율 / -률",
    prefix: "조사 결과를 ",
    target: "백분률",
    suffix: "로 나타냈다.",
    acceptedAnswers: ["백분율"],
    explanation: "‘분’은 ㄴ 받침으로 끝나므로 ‘율’을 붙인다."
  }
];

// 직접 입력형 문항 데이터 유효성 검증 함수
window.validateWritingQuestions = function (questions) {
  var list = questions === undefined ? window.WRITING_QUESTIONS : questions;
  var errors = [];
  if (!Array.isArray(list)) {
    return { ok: false, errors: ["WRITING_QUESTIONS가 배열이 아닙니다."], count: 0 };
  }
  if (list.length !== 18) {
    errors.push("전체 직접 입력형 문항 수가 " + list.length + "개입니다. (정확히 18개여야 함)");
  }

  var expectedCats = [
    "안 / 않", "되 / 돼", "-데 / -대", "어떻게 / 어떡해",
    "왠지 / 웬", "오랜만 / 오랫동안", "낫다 / 낳다", "맞히다 / 맞추다", "-율 / -률"
  ];
  var catCounts = {};
  var seenIds = {};

  for (var i = 0; i < list.length; i++) {
    var q = list[i];
    var tag = "문항 " + (i + 1);
    if (!q || typeof q !== "object") {
      errors.push(tag + ": 객체가 아닙니다.");
      continue;
    }

    // id 유효성 (W01 ~ W18)
    var expectedId = "W" + (i < 9 ? "0" + (i + 1) : (i + 1));
    if (typeof q.id !== "string" || !/^W\d{2}$/.test(q.id)) {
      errors.push(tag + ": id 형식이 올바르지 않습니다. (" + q.id + ")");
    } else if (seenIds[q.id]) {
      errors.push("id 중복: " + q.id);
    } else {
      seenIds[q.id] = true;
    }
    if (q.id !== expectedId) {
      errors.push(tag + ": 기대되는 id는 " + expectedId + "이나 실제는 " + q.id + "입니다.");
    }

    // category
    if (expectedCats.indexOf(q.category) === -1) {
      errors.push(tag + " (" + q.id + "): 알 수 없는 category '" + q.category + "'");
    } else {
      catCounts[q.category] = (catCounts[q.category] || 0) + 1;
    }

    // prefix, suffix: 빈 문자열 허용하되 문자열이어야 함
    if (typeof q.prefix !== "string") {
      errors.push(tag + " (" + q.id + "): prefix가 문자열이 아닙니다.");
    }
    if (typeof q.suffix !== "string") {
      errors.push(tag + " (" + q.id + "): suffix가 문자열이 아닙니다.");
    }

    // target, explanation: 비어 있지 않은 문자열
    if (typeof q.target !== "string" || q.target.trim() === "") {
      errors.push(tag + " (" + q.id + "): target이 비어 있거나 문자열이 아닙니다.");
    }
    if (typeof q.explanation !== "string" || q.explanation.trim() === "") {
      errors.push(tag + " (" + q.id + "): explanation이 비어 있거나 문자열이 아닙니다.");
    }

    // acceptedAnswers: 하나 이상의 비어 있지 않은 문자열 배열
    if (!Array.isArray(q.acceptedAnswers) || q.acceptedAnswers.length === 0) {
      errors.push(tag + " (" + q.id + "): acceptedAnswers가 비어 있거나 배열이 아닙니다.");
    } else {
      var seenAnswers = {};
      var normTarget = (q.target || "").trim().normalize("NFC");
      for (var a = 0; a < q.acceptedAnswers.length; a++) {
        var ans = q.acceptedAnswers[a];
        if (typeof ans !== "string" || ans.trim() === "") {
          errors.push(tag + " (" + q.id + "): acceptedAnswers[" + a + "]가 비어 있거나 문자열이 아닙니다.");
          continue;
        }
        var normAns = ans.trim().normalize("NFC");
        if (seenAnswers[normAns]) {
          errors.push(tag + " (" + q.id + "): 정규화 후 중복된 허용 정답 '" + ans + "'이(가) 있습니다.");
        }
        seenAnswers[normAns] = true;

        if (normAns === normTarget) {
          errors.push(tag + " (" + q.id + "): target('" + q.target + "')이 허용 정답에 포함되어 있습니다.");
        }
      }
    }
  }

  // 9개 유형에 각각 2문항인지 검사
  expectedCats.forEach(function (cat) {
    if ((catCounts[cat] || 0) !== 2) {
      errors.push("유형 '" + cat + "'의 문항 수가 " + (catCounts[cat] || 0) + "개입니다. (2개여야 함)");
    }
  });

  return { ok: errors.length === 0, errors: errors, count: list.length };
};
