// Safety keywords for crisis / self-harm
const CRISIS_PATTERNS = [
  /자살/i, /죽고\s*싶/i, /살기\s*싫/i, /자해/i, /세상.*떠나/i, /목숨/i, /사라지고\s*싶/i
];

const CRISIS_RESPONSE = '지금 많이 버겁고 지치셨군요. 당신의 소중한 오늘은 여기서 끝나지 않아요. 힘들 땐 혼자 견디지 마시고 언제든 24시간 열려 있는 전문 상담(자살예방상담전화 109, 정신건강상담전화 1577-0199)에 손을 내밀어 보세요.';

const CATEGORY_NAMES = {
  work: '일과 진로',
  relationship: '사람과 관계',
  money: '돈과 소비',
  mind: '나와 마음',
  rest: '건강과 휴식',
  random: '그 밖의 고민',
  future: '일과 진로',
  self: '나와 마음',
  condition: '건강과 휴식'
};

// 6대 카테고리별 정제된 사소한 처방 카탈로그 (쉬운 단어, 이모지 0~1개)
const WITTY_CATALOG = {
  work: [
    '퇴사 버튼은 있는데 인생에는 멈춤 버튼이 없다는 게 참 불친절해요 🥲',
    '상사에게 전송할 사직서는 마음 속으로 백 번 썼으니, 일단 오늘은 칼퇴라는 작은 승리를 거둬봅시다 💼',
    '일이 많은 건 당신의 능력이 뛰어난 탓도 있지만, 회사의 분배 시스템이 게으른 탓이 더 큽니다.',
    '월급이라는 위로금은 원래 한숨 값까지 포함된 거라지만, 오늘은 한숨을 조금 아껴두기로 해요.',
    '내년의 당신은 아직 출근도 안 했답니다. 지금부터 벌써 업무를 배정해둘 필요는 없어요 ☕',
    '인생에는 원래 정답지가 없어요. 다들 답안지 없이 눈치껏 시험 보는 중이랍니다.',
    '5년 뒤 계획보다 5시간 뒤에 뭐 먹을지 정하는 편이 훨씬 영양가 있어요 😉',
    '길을 잃었다는 건 새로운 지도를 그릴 수 있는 탐험가가 되었다는 뜻이기도 해요!'
  ],
  relationship: [
    '인간관계는 블루투스 같아서 가끔 지직거리고 끊기기도 해요. 전원을 잠깐 껐다 켜봅시다.',
    '모두에게 착한 사람이 되려다간 내 속부터 터져요. 오늘은 절전 모드로 사람을 대해보세요 🌿',
    '상대방 속마음까지 억지로 맞추려 하지 않아도 돼요. 거기엔 아무 생각이 없었을 확률이 높답니다.',
    '모든 사람 마음에 들 필요는 없어요. 당신은 호불호 없는 치킨이 아니라 고유한 사람인걸요 🍗'
  ],
  money: [
    '돈은 있다가도 없는 게 아니라, 원래 없다가 잠깐 스쳐 지나가는 여행자일 뿐이에요.',
    '장바구니에 담아둔 건 내일의 내가 알아서 취소할 테니 너무 자책하지 마세요.',
    '통장 잔고를 자꾸 들여다보면 잔고도 부끄러워하니 오늘은 눈을 질끈 감아줍시다.',
    '돈으로 행복을 살 수 없다지만, 맛있는 디저트 영수증은 제법 그럴듯한 행복을 증명해 줍니다 🍰'
  ],
  mind: [
    '올해 성과 보고서 첫 줄에는 ‘무사히 살아남음’만 적혀 있어도 충분히 만점입니다 📜',
    '올해를 통째로 무효 처리하기엔 열심히 버틴 날들도 실적으로 쳐야 하지 않을까요? 인사팀이 너무 엄격하네요!',
    '남의 인생은 하이라이트 영상이고 내 인생은 비하인드까지 전편 공개라서 그래요. 당신의 인생도 하이라이트만 모으면 꽤 멋진 명작이랍니다.',
    '다른 사람 꽃밭을 쳐다보느라 내 소중한 화분에 물 주는 걸 깜빡하면 아쉽잖아요 🌱',
    '나를 괴롭히는 생각 중 8할은 아직 일어나지도 않은 소설의 초고에 불과해요.'
  ],
  rest: [
    '지금 눈꺼풀이 사투를 벌이고 있어요. 이만 퇴근시켜 주세요 🫩',
    '졸리면 자야죠! 누구도 수면의 과학까지 거스를 순 없어요.',
    '몸이 잠깐 파업했나 봐요. 일단 맛있는 간식부터 쥐여주고 살살 달래봅시다 🍪',
    '침대랑 너무 끈끈하게 붙어버렸군요. 오늘은 이불 속을 지키는 수호자 역할을 맡은 셈 칩시다 🛋️',
    '배터리가 3%밖에 안 남았는데 걱정을 너무 많이 켜뒀네요. 오늘은 충전기 꽂고 푹 쉬어봅시다 🔋',
    '열심히 쉬는 것도 엄청난 재능입니다. 오늘은 쉼의 달인이 되어보는 건 어떨까요 🛌'
  ],
  random: [
    '고양이가 당신을 무시하는 건 당신이 싫어서가 아니라, 원래 고양이는 세상을 무시하기 때문입니다 🐱',
    '야식을 먹을까 말까 고민될 땐, 10분 뒤 배고파서 후회할 나의 표정을 먼저 상상해 보세요.',
    '고민이 너무 커 보일 땐 돋보기를 거꾸로 들어봅시다. 생각보다 아주 작고 귀여운 크기일 수도 있어요 🔍',
    '하루하루는 연습장 낙서 페이지랍니다. 마음에 안 들면 지워버려도 아무 문제 없어요!',
    '지금 엉킨 실은 억지로 풀지 말고 주머니에 쏙 넣어두세요. 저절로 풀릴 때도 있으니까요 ✨',
    '너무 심각해지지 않아도 괜찮아요. 우리 모두 지구에 잠깐 소풍 나온 거니까요 🎈'
  ]
};

// Aliases for backwards compatibility
WITTY_CATALOG.future = WITTY_CATALOG.work;
WITTY_CATALOG.self = WITTY_CATALOG.mind;
WITTY_CATALOG.condition = WITTY_CATALOG.rest;

function resolveCategory(worryText, selectedCategory) {
  // If user selected a valid category, use it as baseline
  if (selectedCategory && WITTY_CATALOG[selectedCategory]) {
    return selectedCategory;
  }

  // Otherwise infer from keywords
  const t = (worryText || '').toLowerCase();
  if (/졸리|잠이 온|잠와|눈이 감겨|꾸벅|하품|잠들고 싶|자고 싶|수면|피곤|기운이 없|체력|번아웃|쉬고 싶|침대/.test(t)) return 'rest';
  if (/퇴사|회사|상사|야근|출근|이직|직장|업무|일이 너무|진로|미래|시험|취업|합격|면접|공부/.test(t)) return 'work';
  if (/연애|남편|남친|남자친구|아내|여친|여자친구|애인|친구|인간관계|싸웠|짝사랑|가족/.test(t)) return 'relationship';
  if (/비교|잘나|부러|뒤처|남들|인기|질투|열등감|자존감|후회|자책|자신감|내 탓/.test(t)) return 'mind';
  if (/돈|지갑|통장|거지|월급|적자|쇼핑|부자|소비|지출|빚/.test(t)) return 'money';
  return 'random';
}

export function getCuratedCrystalAnswer(worry, previousAnswer = '', category = '') {
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(worry)) {
      return CRISIS_RESPONSE;
    }
  }

  const catKey = resolveCategory(worry, category);
  let pool = [...(WITTY_CATALOG[catKey] || []), ...WITTY_CATALOG.random];
  if (previousAnswer) {
    pool = pool.filter(a => a !== previousAnswer);
  }
  if (pool.length === 0) pool = WITTY_CATALOG.random;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return picked;
}

export async function generateCrystalBallAnswer(worry, previousAnswer = '', category = '') {
  const trimmed = (worry || '').trim();
  if (!trimmed) {
    return '비어 있는 공간에는 밤바람의 소리만 들려옵니다. 마음에 머무는 고민을 적어보세요 🌙';
  }

  // Safety first
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return CRISIS_RESPONSE;
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return getCuratedCrystalAnswer(trimmed, previousAnswer, category);
  }

  try {
    const categoryName = CATEGORY_NAMES[category] || '';
    const userPromptText = categoryName
      ? `[사용자가 고른 카테고리: ${categoryName}]\n고민/질문: "${trimmed}"`
      : `고민/질문: "${trimmed}"`;

    const systemPrompt = `당신은 시간 조각 상점의 "오늘의 사소한 처방" 수정구슬입니다.
사용자가 털어놓은 고민, 질문, 엉뚱한 생각에 대해 짧고 재치 있는 사소한 처방을 한마디 건넵니다.
전문적인 심리 상담이나 정답 해결책을 주려는 것이 아니라, 고민을 바라보는 순간의 기분을 환기해 주는 가벼운 엔터테인먼트 콘텐츠입니다.

[핵심 원칙]
1. 입력 맥락 우선 (카테고리는 참고용):
   - 카테고리와 실제 입력 내용이 다르더라도 사용자가 실제로 쓴 글의 맥락과 감정을 최우선으로 해석하세요.
   - 구체적인 고민, 복합적인 고민(일+돈 등), 모호한 고민("그냥 다 귀찮아"), 짧은 단어("망했다", "졸려", "아 몰라"), 일상적 선택 질문("야식 먹을까 말까", "주말에 뭐 하지"), 엉뚱한 질문("고양이가 날 무시해") 등 어떤 입력이든 찰떡같이 알아듣고 반응하세요.
2. 짧고 명쾌한 분량:
   - 보통 1~2문장으로 작성하고, 꼭 필요할 때만 최대 3문장까지 작성하세요.
3. 말투와 톤:
   - 능청스럽고 엉뚱하며 재치 있는 어조를 사용하세요. (~네요, ~군요, ~해봅시다, ~인 셈 치죠, ~어떨까요?)
   - 상투적인 위로, 뻔한 조언, 자기계발식 훈계, 진지한 분석은 피하세요.
   - 사용자를 비난하거나 무시, 평가, 훈계하지 마세요. 상대를 낮잡아 보는 '~이나' (팝콘이나 등), 차가운 '~하지 마세요'는 절대 금지합니다.
   - 다만, 고민/질문이 '진지하게'라는 문구로 시작한다면 진지하게 답해주세요.
4. 자연스러운 유머와 쉬운 단어:
   - 모든 고민에 억지 개그를 붙이지 말고, 입력한 내용에 자연스럽게 어울리는 유머를 사용하세요. 예상 밖의 일상 비유와 반전을 써도 좋습니다.
   - 어렵고 피곤한 용어/수식어 남발을 금지합니다. 초등학생도 쉽게 읽히는 쉬운 일상 단어만 쓰세요.
   - 사용자가 해결책을 요구하지 않았다면 굳이 훈계나 해결책을 내리지 않아도 됩니다.
5. 이모지: 답변에 사용하지 않거나 1개까지만 사용하세요.
6. 뻔한 접두사 금지: "구슬 속 은하수가...", "우주의 시계추가..." 같은 진부한 서두 없이 바로 산뜻하게 시작하세요.

[정답 벤치마크 예시 스타일]
- 입력: "너무 졸린데 어떡하지?" -> 답변: "지금 눈꺼풀이 사투를 벌이고 있어요. 이만 퇴근시켜 주세요 🫩"
- 입력: "회사 그만두고 싶어." -> 답변: "퇴사 버튼은 있는데 인생에는 멈춤 버튼이 없다는 게 참 불친절해요."
- 입력: "올해 이룬 게 하나도 없는 것 같아." -> 답변: "올해를 통째로 무효 처리하기엔 열심히 버틴 날들도 실적으로 쳐야 하지 않을까요? 인사팀이 너무 엄격하네요!"
- 입력: "친구가 나보다 잘나가는 것 같아." -> 답변: "남의 인생은 하이라이트 영상이고 내 인생은 비하인드까지 전편 공개라서 그래요. 당신의 인생도 하이라이트만 모은다면 꽤 멋진 영상이 될 거예요."
- 입력: "고양이가 나를 무시하는 것 같아." -> 답변: "고양이는 원래 온 우주를 무시하는 생명체이니 너무 서운해하지 않아도 괜찮아요 🐱"
- 입력: "야식을 먹을까 말까?" -> 답변: "고민하는 사이에 위장은 이미 야식 파티를 준비하고 있을지도 모릅니다."
- 입력: "망했다" -> 답변: "이번 판이 망했다는 건 다음 판을 새 마음으로 시작할 완벽한 명분이 생겼다는 뜻이죠 ✨"
${previousAnswer ? `\n이전에 제공했던 답변: "${previousAnswer}" 와는 다른 새로운 표현과 비유로 작성하세요.` : ''}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPromptText }] }],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 140
          }
        })
      }
    );
    clearTimeout(timeoutId);

    if (apiRes.ok) {
      const data = await apiRes.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text && text.length > 3) {
        return text;
      }
    }

    return getCuratedCrystalAnswer(trimmed, previousAnswer, category);
  } catch (err) {
    return getCuratedCrystalAnswer(trimmed, previousAnswer, category);
  }
}
