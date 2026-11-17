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

// 상황별/감정별 세분화 처방 풀 (말장난·상투적 긍정 배제, 공감+관점 전환+작은 행동 다양화)
const TOPIC_POOLS = {
  food_snack: [
    '이미 저녁을 든든하게 드셨군요. 야식이 당기는 건 진짜 배고픔이 아니라 오늘 수고한 나를 위한 보상 심리일 수 있으니, 따뜻한 허브티나 물 한 잔으로 입가심만 하고 내일 아침 맛있는 첫끼를 기대해봐요 🍵',
    '저녁을 먹었는데 또 먹고 싶다면 뇌가 착각하고 있는 걸지도 몰라요. 양치질을 깨끗하게 하고 10분만 버텨보면 거짓말처럼 식욕이 잠잠해질 거예요!',
    '오늘 하루 고생 많았으니 맛있는 걸로 채우고 싶은 마음은 백번 이해하지만, 속 편한 내일을 위해 오늘은 따뜻한 차 한 잔으로 마음을 달래봅시다.'
  ],
  overwork: [
    '손가락 하나 까딱하기 싫을 만큼 할 일이 쌓였군요. 지금 책상에서 제일 만만한 일 하나만 10분 만에 해치우고, 나머지는 내일의 나한테 당당히 넘겨버립시다.',
    '시간당 월급으로 따져보면 한숨 쉬며 버티는 이 순간에도 통장 숫자는 조금씩 오르고 있어요. 일단 물 한 모금 천천히 마시고 어깨 힘부터 빼봐요.',
    '일이 끝도 없이 밀려올 땐 완벽하게 해내려는 마음이 제일 큰 적이에요. 화면 끄기 딱 5분 전에 가장 쉬운 일 하나만 처리하고 시계만 보며 버텨봅시다.',
    '산더미처럼 쌓인 일도 막상 뜯어보면 꽤 시시한 잡무 몇 조각일 때가 많더라고요. 제일 작은 조각 하나만 집어서 해치워 보면 의외로 속이 풀립니다.'
  ],
  monday: [
    '일주일 중 가장 가혹한 시간대를 정면으로 맞고 계시군요. 오늘 하루 목표는 대단한 성과가 아니라 점심 메뉴 고르기 하나로만 정해두죠.',
    '월요일 아침에 기운 넘치는 사람보다 이불 밖으로 나온 것만으로도 대견한 사람이 훨씬 많아요. 출근길에 평소 안 사던 따뜻한 음료 하나쯤은 스스로에게 쥐여줘도 됩니다 ☕',
    '출근하기 싫은 건 의지가 약해서가 아니라 지난 주말이 너무 짧았던 탓이에요. 오전 한 시간은 워밍업 시간으로 치고 제일 느린 속도로 시작해 봐요.',
    '금요일까지 아직 멀었다고 생각하면 막막하지만, 당장 두 시간 뒤 점심시간까지만 버틴다고 치면 생각보다 해볼 만해요.'
  ],
  lethargy: [
    '지금은 억지로 열정을 쥐어짤 때가 아니라 몸과 마음이 비상 절전에 들어간 상태예요. 물 한 컵 마시고 창밖이나 벽을 1분만 멍하니 바라봐도 오늘은 충분합니다.',
    '아무것도 하기 싫을 땐 굳이 대단한 생산성을 증명하려 애쓰지 않아도 돼요. 미지근한 물로 세수만 한번 하고, 소파에서 제일 편한 자세를 찾는 데 집중해 봅시다.',
    '마음이 방전되면 평소에 좋아하던 일조차 숙제처럼 느껴지기 마련이에요. 해야 할 일 목록을 잠시 접어두고, 당장 제일 편한 옷으로 갈아입는 것부터 해보면 어떨까요?',
    '엔진도 과열되면 식히는 시간이 필요한데 사람 마음이 계속 돌아갈 순 없죠. 오늘은 아무 성과 없이 숨만 고르고 지나가도 충분히 잘한 날입니다.'
  ],
  friend_hurt: [
    '가까운 사람에게 서운함을 느끼면 낯선 사람보다 몇 배는 더 오래 남죠. 당장 이해하려 들거나 쿨한 척 넘기지 말고, 잠깐 일정한 거리를 두고 내 마음부터 챙겨요.',
    '상대는 별생각 없이 던진 말이라도 들은 쪽이 아픈 건 사실이에요. 오늘 바로 결론 내리지 말고, 유독 그 말의 어느 지점이 걸렸는지만 짧게 적어보면 마음이 조금 가라앉을 거예요.',
    '상대방의 사정을 먼저 헤아려주느라 정작 내 서운함을 뒤로 미루는 경우가 많아요. 오늘은 다른 사람 편 대신 온전히 내 편만 들어주는 날로 정해도 됩니다.',
    '서운한 감정은 예민해서가 아니라 그 관계를 진심으로 아꼈기 때문에 생기는 거예요. 바로 연락해서 풀 힘이 없다면 며칠쯤 답장을 늦춰도 괜찮아요.'
  ],
  overspent: [
    '이미 결제된 내역을 붙잡고 자책해 봐야 취소 버튼이 생기진 않죠. 대신 이번 주 중에 하루만 지갑을 아예 안 여는 무지출 데이로 정해두면 기분이 꽤 개운해져요.',
    '소비가 늘었다는 건 요즘 버거운 날들을 작은 물건이나 음식으로라도 달래고 싶었다는 뜻일지도 몰라요. 다음 주 커피 두 잔값만 아껴도 생각보다 금방 균형이 맞습니다 ☕',
    '결제할 때는 분명 그만한 이유가 있었을 거예요. 영수증 보며 한숨 쉬기 전에, 이번에 산 것 중 제일 마음에 드는 하나를 제대로 잘 써서 본전부터 뽑아봅시다.',
    '가계부 앱 열기가 두려워지는 순간이죠. 당장 이번 달 전체를 계산하느라 머리 싸매지 말고, 오늘 저녁 한 끼만 집 냉장고 털기로 정해봐요.'
  ],
  boredom: [
    '매일 비슷한 풍경만 반복되면 마음도 금방 무뎌지기 마련이죠. 오늘 산책길이나 퇴근길에 평소 안 가본 골목으로 딱 한 블록만 돌아가 보세요. 생각보다 낯선 공기가 듭니다.',
    '거창한 재미를 찾으려 할수록 일상이 더 밋밋하게 느껴지기도 해요. 오늘 하루만 평소 절대 안 고를 낯선 간식이나 안 듣던 노래 한 곡을 일부러 골라보세요 🎵',
    '재미없는 날이 이어지는 건 그만큼 큰 사고 없이 버텨왔다는 신호이기도 하지만 막상 겪으면 참 헛헛하죠. 가볍게 15분만 내서 동네에서 안 가본 가게 한 곳 구경해 보는 건 어떨까요?',
    '억지로 즐거움을 찾으려 애쓸 필요는 없어요. 늘 걷던 길을 평소와 다른 시간대에 한 번만 걸어봐도 하루의 결이 살짝 달라지곤 합니다.'
  ],
  new_start_fear: [
    '시작도 하기 전에 머릿속으로 실패하는 장면부터 백 번쯤 돌려보고 계시군요. 처음부터 잘 해내려 하지 말고, 딱 10분만 써서 관련 정보 한 줄 찾아보는 정도로 발만 담가보세요.',
    '용기가 안 나는 건 겁이 많아서가 아니라 그 일을 진짜 잘해보고 싶은 마음이 커서예요. 완벽하게 준비될 날을 기다리면 영영 못 오니, 서툰 초안부터 일단 시작해 봅시다.',
    '큰 결심이라는 무게를 얹으면 첫걸음이 천근만근이 됩니다. 남들 눈에 띄지 않는 작은 취미 하나 테스트해 본다는 가벼운 마음으로 딱 하루만 체험해 봐요.',
    '아직 안 해본 일 앞에서 망설여지는 건 당연한 반응이에요. 성공 여부를 따지기 전에, 이걸 시작했을 때 내일 아침 눈뜰 맛이 날지만 먼저 떠올려 보세요.'
  ],
  unexplained_low: [
    '특별한 사건이 없는데도 마음이 축 가라앉는 날이 꼭 있죠. 억지로 이유를 캐내서 고치려 들지 말고, 오늘은 따뜻한 샤워나 포근한 이불처럼 몸의 온도부터 살짝 높여주세요.',
    '이유 없는 우울감은 마음의 일기예보가 잠깐 흐린 날과 비슷해요. 비 오는 이유를 따져 묻지 않듯, 오늘은 그냥 평소보다 조용히 지나가는 날로 두어도 괜찮습니다.',
    '그동안 알게 모르게 쌓였던 피로가 기분 저하로 슬쩍 신호를 보내는 걸 수도 있어요. 미뤄둔 할 일은 잠시 접어두고, 지금 당장 귀가 편한 조용한 음악이나 따뜻한 차 한 잔 곁에 둬봐요 🍵',
    '기분이 가라앉을 때 억지로 텐션을 끌어올리려 하면 오히려 더 지치기 쉽더라고요. 기분 좋은 척하지 않아도 되니 오늘은 말수도 조금 줄이고 내 페이스대로만 움직여요.'
  ]
};

const WITTY_CATALOG = {
  work: [
    ...TOPIC_POOLS.overwork,
    ...TOPIC_POOLS.monday,
    '내년의 일까지 오늘의 내가 미리 끌어와 걱정할 필요는 없어요. 지금은 눈앞에 있는 가장 작은 일 하나만 매듭짓고 손 털어 봅시다.'
  ],
  relationship: [
    ...TOPIC_POOLS.friend_hurt,
    '모든 사람과 주파수가 맞을 순 없어요. 억지로 맞춘 대화 뒤에 남는 피곤함보다, 조금 서먹해도 내 마음이 편한 거리가 훨씬 오래갑니다.',
    '상대방의 표정 하나까지 전부 내 책임으로 번역하지 마세요. 의외로 상대는 어제 점심 메뉴를 떠올리고 있었을 확률이 높습니다.'
  ],
  money: [
    ...TOPIC_POOLS.overspent,
    '통장 잔고를 자꾸 들여다본다고 숫자가 불어나진 않지만, 이번 주 고정 지출 한 가지만 점검해도 불안감이 꽤 줄어들어요.'
  ],
  mind: [
    ...TOPIC_POOLS.boredom,
    ...TOPIC_POOLS.new_start_fear,
    ...TOPIC_POOLS.unexplained_low,
    '남의 인생은 잘 편집된 하이라이트만 보이고 내 하루는 편집 전 원본 그대로라서 초라해 보일 때가 많죠. 오늘 내 원본에서 괜찮았던 장면 하나만 골라 기억해 봐요.'
  ],
  rest: [
    ...TOPIC_POOLS.lethargy,
    '몸이 보내는 피곤 신호를 의지 부족으로 착각하지 마세요. 지금 가장 효율적인 일과는 알림 끄고 30분만 눈 붙이는 겁니다 🛌',
    '배터리가 5% 남았는데 무거운 앱만 계속 켜두면 금방 꺼지죠. 오늘 저녁엔 생각 대신 따뜻한 국물이나 가벼운 스트레칭으로 충전부터 합시다.'
  ],
  random: [
    '고민이 너무 커 보여서 손에 안 잡힐 땐, 지금 당장 해결해야 하는 것과 일주일 뒤에 봐도 되는 것 두 줄로만 나눠 적어보세요. 절반 이상이 급하지 않은 일일 거예요.',
    '아직 일어나지 않은 일까지 머릿속에서 리허설할 필요는 없어요. 오늘은 따뜻한 공기와 좋아하는 냄새 하나 맡는 걸로 충분히 선방한 하루입니다 ✨',
    '고양이가 불러도 못 들은 척하는 건 미워서가 아니라 원래 자기 리듬대로 살기 때문이래요. 오늘 하루쯤은 우리도 남 눈치 대신 내 리듬만 따라가 봅시다 🐱'
  ]
};

WITTY_CATALOG.future = WITTY_CATALOG.work;
WITTY_CATALOG.self = WITTY_CATALOG.mind;
WITTY_CATALOG.condition = WITTY_CATALOG.rest;

const SERIOUS_CATALOG = {
  work: [
    '앞이 막막하게 느껴질 때는 속도를 억지로 높이기보다 지금 내 발밑에 놓인 선택지부터 차분히 살펴보세요. 흔들리는 것처럼 보여도 실제로는 나에게 맞는 방향을 조율하는 시간입니다.',
    '모든 선택이 처음부터 확신으로 가득할 순 없어요. 완벽한 정답을 찾을 때까지 멈춰 있기보다, 감당할 수 있는 작은 시도 속에서 나만의 기준을 세워 나가 보시길 바랍니다.',
    '주변 사람들의 속도에 나를 자꾸 대어보면 조급함만 커집니다. 조금 돌아가는 듯해도 내가 납득하며 걸어온 시간은 분명 다음 걸음의 단단한 바탕이 됩니다.'
  ],
  relationship: [
    '마음을 다 내어주었는데도 엇갈리는 순간은 누구에게나 찾아옵니다. 모든 인연을 붙잡으려 애쓰기보다, 나를 있는 그대로 존중해 주는 곁을 지키는 데 마음을 써 보세요.',
    '서운함과 실망이 쌓였을 때는 상대의 의도를 추측하느라 나를 소모하기보다, 내가 편안히 숨 쉴 수 있는 거리를 먼저 확보하는 편이 좋습니다.',
    '모든 사람에게 좋은 사람으로 남으려 애쓰다 보면 정작 가장 중요한 나 자신을 돌볼 여력이 사라집니다. 관계에도 숨 고를 틈이 필요하다는 걸 잊지 마세요.'
  ],
  money: [
    '경제적인 막막함이 몰려올 때는 막연한 불안감보다 현재 내가 조절할 수 있는 항목과 없는 항목을 숫자로 차분히 나눠보는 것이 의외로 큰 안정을 줍니다.',
    '통장이나 지출은 삶을 꾸려가는 수단일 뿐 당신이라는 사람의 가치를 매기는 기준이 아닙니다. 오늘 할 수 있는 작은 정리 하나부터 천천히 시작해 보세요.'
  ],
  mind: [
    '이유 모를 무력감이나 슬픔이 찾아왔을 땐 스스로를 다그칠수록 마음이 더 굳어버립니다. 지금은 해결책을 억지로 끌어내기보다 지친 마음을 조용히 쉬게 해주는 시간이 필요해요 🌿',
    '후회와 불안에 발목이 잡힐수록 지금 손에 쥔 작은 일상마저 놓치기 쉽습니다. 지나간 선택을 되돌릴 수 없다면 오늘 나에게 다정하게 대하는 선택부터 다시 시작해 보세요.',
    '별일 없어 보여도 마음속으로 이미 수많은 날을 버텨온 것일 수 있습니다. 혼자 끌어안기 버겁다면 믿을 만한 사람에게 솔직한 속내를 조금만 나누어 보세요.'
  ],
  rest: [
    '몸과 마음이 계속 피로 신호를 보내고 있다면 잠깐 멈추는 것은 포기가 아니라 회복입니다. 오늘만큼은 아무 죄책감 없이 온전한 쉼을 스스로에게 허락해 주세요.',
    '기력이 바닥난 상태에서는 작은 걱정조차 감당하기 어려운 큰 바위처럼 느껴집니다. 판단은 푹 자고 난 내일로 미루고 오늘은 몸을 따뜻하게 쉬게 하세요.'
  ],
  random: [
    '당장 명쾌한 답이 나오지 않는 고민이라면 억지로 결론을 지으려 하지 말고 잠시 내려놓으세요. 일상을 성실히 건너다 보면 어느 순간 자연스럽게 보이는 길이 있습니다.',
    '혼란스러운 시기는 무너지는 과정이 아니라 다음 계절을 맞기 전 잠시 비워지는 틈일지도 모릅니다. 서두르지 말고 오늘 하루를 차분히 건너가 보세요.'
  ]
};

SERIOUS_CATALOG.future = SERIOUS_CATALOG.work;
SERIOUS_CATALOG.self = SERIOUS_CATALOG.mind;
SERIOUS_CATALOG.condition = SERIOUS_CATALOG.rest;

function detectTopicPool(worryText) {
  const t = (worryText || '').toLowerCase();
  if (/먹고\s*싶|야식|배고프|또\s*먹|간식|야식.*먹|배고파|저녁.*또|먹을까/.test(t)) return 'food_snack';
  if (/월요일|출근.*싫|일요일\s*밤/.test(t)) return 'monday';
  if (/퇴근|야근|일이\s*(너무|많)|업무|과제|할\s*일/.test(t)) return 'overwork';
  if (/무기력|아무것도\s*하기\s*싫|의욕|번아웃|만사\s*귀찮/.test(t)) return 'lethargy';
  if (/서운|섭섭|친구가|친구랑|마음\s*상|다투|싸웠/.test(t)) return 'friend_hurt';
  if (/돈을\s*(너무|많이)|과소비|충동구매|탕진|카드값|지출|다\s*썼/.test(t)) return 'overspent';
  if (/재미있는\s*일|재미없|심심|지루|똑같은\s*일상|흥미/.test(t)) return 'boredom';
  if (/새로운\s*일|용기가\s*안\s*나|도전|시작.*두려|시작하고\s*싶|겁나/.test(t)) return 'new_start_fear';
  if (/이유\s*없이|기분이\s*(안\s*좋|우울|가라앉|별로|꿀꿀)|왠지\s*우울/.test(t)) return 'unexplained_low';
  return '';
}

function isHeavyOrSeriousWorry(worryText) {
  const t = (worryText || '').trim();
  if (/^진지하게/i.test(t)) return true;
  if (/우울증|공황|불안장애|트라우마|이별했|헤어졌|상실|가족.*아프|돌아가|눈물이\s*(계속|멈추)|너무\s*괴로|버티기\s*힘들/.test(t)) {
    return true;
  }
  return false;
}

function resolveCategory(worryText, selectedCategory) {
  if (selectedCategory && WITTY_CATALOG[selectedCategory]) {
    return selectedCategory;
  }

  const t = (worryText || '').toLowerCase();
  if (/졸리|잠이 온|잠와|눈이 감겨|꾸벅|하품|잠들고 싶|자고 싶|수면|피곤|기운이 없|체력|번아웃|쉬고 싶|침대|무기력|아무것도 하기 싫/.test(t)) return 'rest';
  if (/퇴사|퇴근|월요일|회사|상사|야근|출근|이직|직장|업무|일이 너무|진로|미래|시험|취업|합격|면접|공부/.test(t)) return 'work';
  if (/서운|섭섭|연애|남편|남친|남자친구|아내|여친|여자친구|애인|친구|인간관계|싸웠|짝사랑|가족/.test(t)) return 'relationship';
  if (/비교|잘나|부러|뒤처|남들|인기|질투|열등감|자존감|후회|자책|자신감|내 탓|기분이 안 좋|재미있는 일이 없|새로운 일|용기가 안 나/.test(t)) return 'mind';
  if (/돈|지갑|통장|거지|월급|적자|쇼핑|부자|소비|지출|빚|과소비/.test(t)) return 'money';
  return 'random';
}

export function getCuratedCrystalAnswer(worry, previousAnswer = '', category = '') {
  const trimmed = (worry || '').trim();
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return CRISIS_RESPONSE;
    }
  }

  if (isHeavyOrSeriousWorry(trimmed)) {
    const catKey = resolveCategory(trimmed, category);
    let sPool = [...(SERIOUS_CATALOG[catKey] || []), ...SERIOUS_CATALOG.random];
    if (previousAnswer) {
      sPool = sPool.filter((a) => a !== previousAnswer);
    }
    if (sPool.length === 0) sPool = SERIOUS_CATALOG.random;
    return sPool[Math.floor(Math.random() * sPool.length)];
  }

  const topicKey = detectTopicPool(trimmed);
  const catKey = resolveCategory(trimmed, category);
  let pool = topicKey && TOPIC_POOLS[topicKey]
    ? [...TOPIC_POOLS[topicKey]]
    : [...(WITTY_CATALOG[catKey] || []), ...WITTY_CATALOG.random];

  if (previousAnswer) {
    pool = pool.filter((a) => a !== previousAnswer);
  }
  if (pool.length === 0) pool = WITTY_CATALOG.random;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function generateCrystalBallAnswer(worry, previousAnswer = '', category = '') {
  const trimmed = (worry || '').trim();
  if (!trimmed) {
    return '비어 있는 공간에는 밤바람의 소리만 들려옵니다. 마음에 머무는 고민을 적어보세요 🌙';
  }

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

    const isSeriousMode = isHeavyOrSeriousWorry(trimmed);

    let systemPrompt = '';
    let temperature = 0.85;

    if (isSeriousMode) {
      temperature = 0.7;
      systemPrompt = `당신은 시간 조각 상점의 "오늘의 사소한 처방" 수정구슬입니다.
사용자가 무겁거나 진지한 고민을 털어놓았습니다. 억지 유머나 장난은 완전히 거두고, 깊이 공감하며 차분하고 현실적인 처방을 건네세요.

[진지 모드 핵심 원칙]
1. 억지 위로/설교 금지: "다 잘될 거예요", "열심히 하면 돼요" 같은 상투적 교훈이나 훈계를 피하고, 사용자가 지금 느끼는 무게를 먼저 인정하세요.
2. 분량: 2~3문장 (최대 160자 내외), 담백하고 정중한 경어체.
3. 이모지: 사용하지 않거나 차분한 것(🌿, 🕯️, 🌙) 최대 1개.
4. 진부한 서두("구슬 속이 고요해지며...") 금지.`;
    } else {
      systemPrompt = `당신은 시간 조각 상점의 "오늘의 사소한 처방" 수정구슬입니다.
사용자가 입력한 고민이나 질문에 대해 절대 회피적이거나 뜬금없는 명상적 비유(예: "일어나지 않은 일", "달", "고양이", "바람")를 하지 마세요.
사용자의 고민(예: "저녁을 먹었는데 또 먹고 싶어", "잠이 안 와", "야식 먹을까")에 대해 **먹을지 말지, 참을지, 가벼운 차를 마실지 등 해당 고민에 대한 직접적이고 현실적인 판단과 행동 지침**을 1~2문장으로 담백하게 건네세요.

[답변 원칙]
1. 1:1 맞춤 직접 답변: 질문 속 상황과 감정에 정확히 부합하는 실질적인 조언 제공.
2. 금지: 무관한 사물 관찰, 추상적 철학 멘트, 뻔한 긍정 해석, 훈계.
3. 분량: 2문장 내외, 담백한 구어체 경어, 이모지 최대 1개.
${previousAnswer ? `\n이전 답변("${previousAnswer}")과 완전히 다른 접근 방식(관점/어조/구성)으로 답하세요.` : ''}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

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
            temperature,
            maxOutputTokens: 1024
          }
        })
      }
    );
    clearTimeout(timeoutId);

    if (apiRes.ok) {
      const data = await apiRes.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const text = parts
        .filter((p) => !p.thought && typeof p.text === 'string')
        .map((p) => p.text)
        .join('')
        .trim();
      if (text && text.length > 3) {
        return text;
      }
    }

    return getCuratedCrystalAnswer(trimmed, previousAnswer, category);
  } catch (err) {
    return getCuratedCrystalAnswer(trimmed, previousAnswer, category);
  }
}
