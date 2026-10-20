// Safety keywords for crisis / self-harm
const CRISIS_PATTERNS = [
  /자살/i, /죽고\s*싶/i, /살기\s*싫/i, /자해/i, /세상.*떠나/i, /목숨/i, /사라지고\s*싶/i
];

const CRISIS_RESPONSE = '지금 많이 버겁고 지치셨군요. 당신의 소중한 오늘은 여기서 끝나지 않아요. 힘들 땐 혼자 견디지 마시고 언제든 24시간 열려 있는 전문 상담(자살예방상담전화 109, 정신건강상담전화 1577-0199)에 손을 내밀어 주세요.';

// 쉽고 직관적인 일상 단어, 군더더기 없는 수식어, 이모지 0~1개
const WITTY_CATALOG = {
  lazy: [
    '침대랑 너무 끈끈하게 붙어버렸군요. 재협상은 내일부터 천천히 시작해도 괜찮아요 🛋️',
    '몸이 잠깐 파업했나 봐요. 일단 맛있는 간식부터 쥐여주고 살살 달래봅시다 🍪',
    '에너지 절약 모드가 켜진 것뿐이에요. 고장 난 게 아니라 친환경 상태인 셈이죠 🌱',
    '오늘 누워 있는 건 게으른 게 아니라, 바닥이랑 친해지는 중인 거랍니다.'
  ],
  achievement: [
    '올해 성과 보고서 첫 줄에는 ‘무사히 살아남음’만 적혀 있어도 충분히 만점입니다 📜',
    '지나간 시간은 이미 환불 안 되는 티켓이에요. 팝콘 챙겨 들고 다음 영화 보러 가봅시다 🍿',
    '히든 퀘스트를 깨는 중이라 알림이 늦게 뜨는 것뿐이에요 🎮',
    '나무도 겨울엔 그냥 서 있기만 하잖아요. 우리도 지금은 잠깐 쉬어가는 계절입니다.'
  ],
  comparison: [
    '인생은 각자 다른 게임을 하는 중이에요. 친구 화면 보느라 내 캐릭터를 방치하지 않아도 괜찮아요.',
    '남들의 하이라이트 영상이랑 나의 연습 장면을 비교하면 당연히 다큐멘터리가 되죠 🎬',
    '저 친구가 빨리 달리는 건 가는 목적지가 다른 탓이에요. 경로 재탐색 중일 땐 창밖 풍경을 즐겨봅시다.',
    '다른 사람 꽃밭을 쳐다보느라 내 소중한 화분에 물 주는 걸 깜빡하면 아쉽잖아요 🌱'
  ],
  future: [
    '내년의 당신은 아직 출근도 안 했답니다. 지금부터 벌써 업무를 배정해둘 필요는 없어요 ☕',
    '인생에는 원래 정답지가 없어요. 다들 답안지 없이 눈치껏 시험 보는 중이랍니다.',
    '5년 뒤 계획보다 5시간 뒤에 뭐 먹을지 정하는 편이 훨씬 영양가 있어요 😉',
    '길을 잃었다는 건 새로운 지도를 그릴 수 있는 탐험가가 되었다는 뜻이기도 해요!'
  ],
  burnout: [
    '배터리가 3%밖에 안 남았는데 걱정을 너무 많이 켜뒀네요. 오늘은 충전기 꽂고 푹 쉬어봅시다 🔋',
    '인간은 충전이 필요해요. 지금은 전원 끄고 가만히 누워있을 시간입니다.',
    '의욕이라는 녀석은 달콤한 냄새를 맡아야 슬그머니 나타나요. 일단 맛있는 거부터 챙겨 먹읍시다 🍰',
    '달리기를 멈추면 넘어지는 줄 알았는데, 누우면 아주 편하다는 비밀을 발견하셨군요 🛌'
  ],
  relationship: [
    '인간관계는 블루투스 같아서 가끔 지직거리고 끊기기도 해요. 전원을 잠깐 껐다 켜봅시다.',
    '모두에게 착한 사람이 되려다간 내 속부터 터져요. 오늘은 절전 모드로 사람을 대해보세요 🌿',
    '상대방 속마음까지 억지로 맞추려 하지 않아도 돼요. 거기엔 아무 생각이 없었을 확률이 높답니다.'
  ],
  money: [
    '돈은 있다가도 없는 게 아니라, 원래 없다가 잠깐 스쳐 지나가는 여행자일 뿐이에요.',
    '장바구니에 담아둔 건 내일의 내가 알아서 취소할 테니 너무 자책하지 마세요.'
  ],
  general: [
    '고민이 너무 커 보일 땐 돋보기를 거꾸로 들어봅시다. 생각보다 아주 작고 귀여운 크기일 수도 있어요 🔍',
    '하루하루는 연습장 낙서 페이지예요. 마음에 안 들면 지워버려도 아무 문제 없답니다.',
    '지금 엉킨 실은 억지로 풀지 말고 주머니에 쏙 넣어두세요. 저절로 풀릴 때도 있으니까요 ✨',
    '너무 심각해지지 않아도 괜찮아요. 우리 모두 지구에 잠깐 소풍 나온 거니까요 🎈'
  ]
};

function selectCategoryByKeywords(text) {
  const t = text.toLowerCase();
  if (/게으|누워|침대|귀찮|늦잠|미루/.test(t)) return 'lazy';
  if (/이룬|성과|후회|올해|한일|망했|실패|자책/.test(t)) return 'achievement';
  if (/친구|비교|잘나|부러|뒤처|남들|인기/.test(t)) return 'comparison';
  if (/내년|미래|계획|진로|취업|시험|앞날|뭐하지/.test(t)) return 'future';
  if (/하기\s*싫|의욕|무기력|지쳤|번아웃|피곤|힘들/.test(t)) return 'burnout';
  if (/연애|남편|남친|남자친구|아내|여친|여자친구|애인|친구|인간관계|사람|싸웠|짝사랑/.test(t)) return 'relationship';
  if (/돈|지갑|통장|거지|월급|적자|쇼핑|부자/.test(t)) return 'money';
  return 'general';
}

export function getCuratedCrystalAnswer(worry, excludeAnswer = '') {
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(worry)) {
      return CRISIS_RESPONSE;
    }
  }

  const category = selectCategoryByKeywords(worry);
  let pool = [...(WITTY_CATALOG[category] || []), ...WITTY_CATALOG.general];
  if (excludeAnswer) {
    pool = pool.filter(a => a !== excludeAnswer);
  }
  if (pool.length === 0) pool = WITTY_CATALOG.general;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return picked;
}

export async function generateCrystalBallAnswer(worry, previousAnswer = '') {
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
    return getCuratedCrystalAnswer(trimmed, previousAnswer);
  }

  try {
    const systemPrompt = `당신은 시간 조각 상점의 "오늘의 묘한 처방" 수정구슬입니다.

[최우선 절대 원칙: 1초 만에 술술 읽히는 쉬운 단어로 쓰기]
1. 피곤하고 어려운 수식어·전문 용어 남발 절대 금지:
   - "내부 시스템의 합법적 전원 차단 요청", "두뇌 내부의 메인 프로세서", "고성능 방어막", "공회전", "오버클럭" 같은 길고 딱딱하며 피곤한 표현은 일체 쓰지 마세요.
   - 평소 친구에게 톡을 보내듯, 초등학생도 단숨에 읽고 피식 웃을 수 있는 아주 쉽고 친근한 일상 단어만 쓰세요.
2. 수식어를 덜어낸 짧고 깔끔한 문장:
   - 복잡한 관형어나 수식어를 빼고 군더더기 없이 1~2문장(한눈에 쏙 들어오게)으로 작성하세요.
3. 엉뚱하고 귀여운 처방으로 유머 살리기:
   - 고민을 사소하고 귀여운 상황으로 살짝 재해석하여 피식 웃음이 나게 만드세요.
4. 이모지 개수: 답변당 최대 0~1개만 쓰세요 (남발 금지).
5. 훈계나 지적조, "~하지 마세요", "~이나" (팝콘이나 등) 절대 금지.
6. 뻔한 접두사 금지: "구슬 속 은하수가..." 같은 접두어 없이 바로 산뜻하게 시작하세요.

[정답 벤치마크 예시]
- 고민: 내가 너무 게으른 것 같아
  답변: 침대랑 너무 끈끈하게 붙어버렸군요. 오늘은 이불 속을 지키는 명예 수호자 역할을 맡은 셈 칩시다 🛋️
- 고민: 내년에 뭘 해야 할지 모르겠어
  답변: 내년의 당신은 아직 출근도 안 했습니다. 지금부터 다음 사람 일까지 미리 대신 해둘 필요는 없어요 ☕
- 고민: 요즘 아무것도 하기 싫어
  답변: 몸이 잠깐 파업했나 봐요. 일단 맛있는 간식부터 쥐여주고 살살 달래봅시다 🍪
- 고민: 친구들이 나보다 잘나가는 것 같아
  답변: 인생은 각자 다른 게임을 하는 중이에요. 친구 화면 보느라 내 캐릭터를 방치하지 않아도 괜찮아요.
- 고민: 올해 이룬 게 별로 없는 것 같아
  답변: 올해 성과 보고서 첫 줄에는 ‘무사히 살아남음’만 적어도 충분히 만점입니다 📜
- 고민: 내가 잘 살고 있는 걸까
  답변: 인생에는 원래 정답지가 없어요. 다들 답안지 없이 눈치껏 시험 보는 중이랍니다.
${previousAnswer ? `\n이전에 제공했던 답변: "${previousAnswer}" 와는 다른 새로운 쉬운 처방으로 작성하세요.` : ''}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: `사용자의 고민: "${trimmed}"` }] }],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.8,
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

    return getCuratedCrystalAnswer(trimmed, previousAnswer);
  } catch (err) {
    return getCuratedCrystalAnswer(trimmed, previousAnswer);
  }
}
