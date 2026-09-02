// ===================================================================
// 작은모임연구소의 작은 점술가게 - 22 Major Arcana Tarot Card Data
// ===================================================================

const tarotCards = [
  {
    id: 0,
    number: "0",
    roman: "0",
    name: "The Fool",
    koreanName: "바보",
    keywords: ["새로운 출발", "순수한 용기", "뜻밖의 행운"],
    reading: "완벽하게 준비되지 않았다고 해서 멈춰있을 필요는 없습니다.\n\n새해에는 이것저것 재지 않고 가벼운 마음으로 미지의 길에 발을 디뎌보세요.그 엉뚱하고 대담한 발걸음이 오히려 생각지도 못한 행운의 문을 열어젖힐 거예요.",
    advice: "지나친 염려는 잠시 내려두세요. 첫걸음을 떼는 그 자체만으로도 이미 반은 성공한 셈입니다.",
    image: "../assets/images/tarot/0.png"
  },
  {
    id: 1,
    number: "I",
    roman: "I",
    name: "The Magician",
    koreanName: "마법사",
    keywords: ["실행력", "재능의 발현", "판의 주도권"],
    reading: "머릿속으로만 구상하던 일들을 드디어 손에 잡히는 결과물로 실현해 내는 시기입니다.\n\n당신이 가진 기술과 언변, 그리고 수많은 자원들이 비로소 제자리를 찾아 강력한 시너지를 발휘하기 시작합니다.",
    advice: "가능성을 의심하며 망설일 시간이 없습니다. 지금 손에 쥔 도구들을 믿고 과감히 판을 주도해 보세요.",
    image: "../assets/images/tarot/1.png"
  },
  {
    id: 2,
    number: "II",
    roman: "II",
    name: "The High Priestess",
    koreanName: "여사제",
    keywords: ["날카로운 직관", "비밀스러운 통찰", "내면의 답"],
    reading: "세상의 요란한 소음 속에서 한 발짝 물러나 사물의 본질을 꿰뚫어 보는 한 해입니다.\n\n논리로는 설명하기 힘든 강한 육감과 직관이 위기나 중요한 선택의 순간마다 정확한 등대가 되어줄 거예요.",
    advice: "타인의 말에 흔들리지 마세요. 이미 당신의 내면은 모든 정답을 알고 있습니다.",
    image: "../assets/images/tarot/2.png"
  },
  {
    id: 3,
    number: "III",
    roman: "III",
    name: "The Empress",
    koreanName: "여황제",
    keywords: ["풍요로운 결실", "따스한 돌봄", "안정감"],
    reading: "오랫동안 공들여 가꾼 일상과 관계 속에서 비옥한 대지 같은 결실이 차오릅니다.\n\n물질적·정서적인 여유가 찾아오며, 주변을 너그럽게 품어줄 수 있는 따스한 포용력이 빛을 발하는 시기에요.",
    advice: "조급하게 서두르지 않아도 됩니다. 무르익어 가는 과정을 편안하게 누릴 자격이 충분합니다.",
    image: "../assets/images/tarot/3.png"
  },
  {
    id: 4,
    number: "IV",
    roman: "IV",
    name: "The Emperor",
    koreanName: "황제",
    keywords: ["확고한 질서", "책임감", "견고한 성취"],
    reading: "감정에 휘둘리지 않는 냉철한 결단력으로 혼란스러운 판세를 단단하게 다잡는 새해입니다.\n\n확고한 원칙을 세워 주변 환경을 장악하고, 리더로서 가치 있는 타이틀과 성과를 거머쥐게 됩니다.",
    advice: "자신의 결정을 의심하지 마세요. 단단한 뚝심이 곧 가장 강력한 무기입니다.",
    image: "../assets/images/tarot/4.png"
  },
  {
    id: 5,
    number: "V",
    roman: "V",
    name: "The Hierophant",
    koreanName: "교황",
    keywords: ["귀인의 인도", "검증된 지혜", "깊이 있는 배움"],
    reading: "혼자서 맨땅에 헤딩하며 시행착오를 겪기보다, 지혜로운 조력자나 신뢰할 수 있는 시스템 속에서 확실한 성장을 이뤄냅니다.\n\n새해에는 이미 그 길을 걸어본 이들의 묵직한 조언이 앞날을 환히 밝혀줄 거예요.",
    advice: "독자 노선만 고집하지 마세요. 검증된 규범과 선배의 조언 속에 해답이 숨어 있습니다.",
    image: "../assets/images/tarot/5.png"
  },
  {
    id: 6,
    number: "VI",
    roman: "VI",
    name: "The Lovers",
    koreanName: "연인",
    keywords: ["운명적 선택", "깊은 교감", "파트너십"],
    reading: "인생의 중요한 갈림길에서 마음이 온전히 향하는 대상과 단단한 결합을 맺게 되는 새해입니다.\n\n일적이든 사적이든 진심 어린 파트너십을 통해 서로의 부족한 부분을 채워주며 큰 시너지를 내게 됩니다.",
    advice: "타인의 시선이 아니라, 내 가슴이 진정으로 원하는 선택이 무엇인지 집중하세요.",
    image: "../assets/images/tarot/6.png"
  },
  {
    id: 7,
    number: "VII",
    roman: "VII",
    name: "The Chariot",
    koreanName: "전차",
    keywords: ["정면 돌파", "속도감 있는 승리", "강한 의지"],
    reading: "치열한 경쟁이나 팽팽한 대립 속에서 한 치의 양보도 없이 기어코 승리를 거머쥐는 한 해입니다.\n\n흩어져 있던 의지를 하나로 모아 속도감 있게 밀어붙이면, 지루했던 정체기도 단숨에 끝이 납니다.",
    advice: "브레이크는 잠시 꺼두세요. 방향이 정해졌다면 오직 전진만이 답입니다.",
    image: "../assets/images/tarot/7.png"
  },
  {
    id: 8,
    number: "VIII",
    roman: "VIII",
    name: "Strength",
    koreanName: "힘",
    keywords: ["부드러운 카리스마", "내공", "유연한 통제"],
    reading: "거칠고 까다로운 상황을 억지로 짓누르지 않고, 특유의 부드러움과 끈기로 완벽하게 길들여내는 새해입니다.\n\n내면의 두려움을 의젓하게 다스리며 주위의 깊은 신뢰를 한몸에 받게 됩니다.",
    advice: "소리 내어 강한 척할 필요 없습니다. 조용하고 단단한 인내가 결국 승리합니다.",
    image: "../assets/images/tarot/8.png"
  },
  {
    id: 9,
    number: "IX",
    roman: "IX",
    name: "The Hermit",
    koreanName: "은둔자",
    keywords: ["깊은 사유", "본질 탐구", "지혜의 등불"],
    reading: "새해에는 세상의 소란스러움에서 잠시 발을 빼고, 나만의 등불을 하나 들고서 내면을 깊이 들여다보는 시기를 가집니다.\n\n겉멋과 허세를 다 걷어내고 삶의 진짜 알짜배기 가치를 발견하는 고요한 깨달음의 시간이에요.",
    advice: "혼자만의 시간을 외롭다 여기지 마세요. 그 고요함 속에서 비로소 진정한 길이 보입니다.",
    image: "../assets/images/tarot/9.png"
  },
  {
    id: 10,
    number: "X",
    roman: "X",
    name: "Wheel of Fortune",
    koreanName: "운명의 수레바퀴",
    keywords: ["운명의 변곡점", "절묘한 타이밍", "흐름의 반전"],
    reading: "내 힘으로 어쩔 수 없던 정체된 판이 거대한 운명의 흐름을 타고 극적으로 재편됩니다.\n\n새해에는 생각지도 못한 순간, 절묘한 타이밍에 다가오는 기회가 삶의 궤도를 유쾌하고 이롭게 바꿔놓을 거예요.",
    advice: "상황을 억지로 쥐고 흔들려 하지 마세요. 행운의 바람이 불어올 때 그저 돛을 올리면 됩니다.",
    image: "../assets/images/tarot/10.png"
  },
  {
    id: 11,
    number: "XI",
    roman: "XI",
    name: "Justice",
    koreanName: "정의",
    keywords: ["냉철한 판결", "공정한 보상", "균형감각"],
    reading: "감정을 배제하고 오직 사실과 원칙에 입각해 상황을 명확하게 매듭짓는 한 해입니다.\n\n뿌린 대로 거둔다는 진리 속에서, 그간 성실하게 쌓아온 노력에 대한 가장 정직하고 떳떳한 성적표를 받게 됩니다.",
    advice: "균형 잡힌 시각을 유지하세요. 공정함을 잃지 않는 태도가 곧 최고의 방패입니다.",
    image: "../assets/images/tarot/11.png"
  },
  {
    id: 12,
    number: "XII",
    roman: "XII",
    name: "The Hanged Man",
    koreanName: "매달린 사람",
    keywords: ["발상의 전환", "자발적 멈춤", "깊은 깨달음"],
    reading: "진행하던 일이 새해에 의도치 않게 제동이 걸리며 답답한 정체기를 지나는 듯 보이지만, 사실 이는 하늘이 준 휴식입니다.\n\n기존의 방식을 완전히 뒤집어 보는 신선한 통찰을 얻게 되는 계기가 될 거예요.",
    advice: "상황을 억지로 밀어붙이지 말고, 한 걸음 물러나 세상을 거꾸로 보는 여유를 가져보세요.",
    image: "../assets/images/tarot/12.png"
  },
  {
    id: 13,
    number: "XIII",
    roman: "XIII",
    name: "Death",
    koreanName: "죽음",
    keywords: ["과감한 단절", "환골탈태", "새로운 차원"],
    reading: "이미 수명이 다해 짐만 되는 낡은 습관, 관계, 환경을 가차 없이 끊어내고 완전히 새롭게 태어나는 새해입니다.\n\n약간의 통증이 따를 수 있지만, 이는 더 큰 성장을 위한 절대적이고 시원한 마침표입니다.",
    advice: "지나간 과거에 미련을 두지 마세요. 공간이 비워져야 비로소 더 좋은 새것이 채워집니다.",
    image: "../assets/images/tarot/13.png"
  },
  {
    id: 14,
    number: "XIV",
    roman: "XIV",
    name: "Temperance",
    koreanName: "절제",
    keywords: ["절묘한 조율", "중용의 미덕", "평온한 밸런스"],
    reading: "극단으로 치닫는 감정과 상황 속에서 절묘하게 타협점을 찾아내며 평정심을 되찾습니다.\n\n겉으로 요란하지는 않지만 물 흐르듯 유연하게 일상의 균형을 맞추며 최적의 안정을 누리게 될 거예요.",
    advice: "양극단에서 줄다리기하지 말고, 중간에서 유연하게 흐름을 조율하는 데 집중하세요.",
    image: "../assets/images/tarot/14.png"
  },
  {
    id: 15,
    number: "XV",
    roman: "XV",
    name: "The Devil",
    koreanName: "악마",
    keywords: ["타성의 자각", "집착으로부터의 해방", "매력의 재발견"],
    reading: "그동안 나를 은근히 옭아매던 나쁜 루틴이나 해로운 집착의 실체를 명확히 깨닫고 통쾌하게 끊어내는 시기입니다.\n\n족쇄인 줄 알았던 굴레가 사실은 내가 쥐고 있었음을 깨닫는 순간, 비로소 진짜 자유가 찾아옵니다.",
    advice: "외면하고 싶었던 나의 약점이나 묵은 타성을 솔직히 인정하고 당당하게 끊어내세요.",
    image: "../assets/images/tarot/15.png"
  },
  {
    id: 16,
    number: "XVI",
    roman: "XVI",
    name: "The Tower",
    koreanName: "탑",
    keywords: ["유쾌한 충격", "체계의 리셋", "각성과 도약"],
    reading: "안일하게 버텨오던 낡은 틀이나 임시방편의 체계가 새해에 예기치 못한 서프라이즈와 함께 와르르 무너집니다.\n\n당황스러울 수 있지만, 이 강력한 충격은 썩은 기반을 도려내고 훨씬 더 멋진 판을 짜는 각성의 기회가 됩니다.",
    advice: "지키려 애쓰지 말고 무너질 것은 시원하게 리셋하세요. 진짜 튼튼한 성은 이제부터 짓는 것입니다.",
    image: "../assets/images/tarot/16.png"
  },
  {
    id: 17,
    number: "XVII",
    roman: "XVII",
    name: "The Star",
    koreanName: "별",
    keywords: ["희망의 이정표", "치유와 영감", "빛나는 미래"],
    reading: "어두운 밤하늘을 환하게 밝히는 북극성처럼, 새해에는 마음속 깊은 곳에서 꺼지지 않는 희망과 영감이 차오릅니다.\n\n지친 몸과 마음이 따뜻하게 치유되며, 앞으로 내가 나아갈 길에 대한 확신을 얻게 될 거예요.",
    advice: "비관적인 생각에 갇히지 마세요. 당신의 미래는 생각보다 훨씬 더 찬란하게 빛나고 있습니다.",
    image: "../assets/images/tarot/17.png"
  },
  {
    id: 18,
    number: "XVIII",
    roman: "XVIII",
    name: "The Moon",
    koreanName: "달",
    keywords: ["모호함의 수용", "무의식의 탐험", "안개 너머의 빛"],
    reading: "앞이 뚜렷하게 보이지 않는 안갯속을 걷는 듯한 불확실성이 잠시 찾아올 수 있습니다.\n\n하지만 이 시기는 오히려 숨겨진 창의성과 무의식의 지혜를 길어 올리는 값진 시간이 될 거예요.",
    advice: "실체 없는 불안에 스스로를 괴롭히지 마세요. 안개는 아침 해가 뜨면 저절로 걷힙니다.",
    image: "../assets/images/tarot/18.png"
  },
  {
    id: 19,
    number: "XIX",
    roman: "XIX",
    name: "The Sun",
    koreanName: "태양",
    keywords: ["눈부신 환희", "생명력", "명확한 성공"],
    reading: "어두운 밤이 완전히 끝나고 온 세상이 눈부신 햇살로 가득 차는 대길(大吉)의 새해입니다.\n\n매사에 생명력과 긍정적인 에너지가 넘쳐흐르며, 하는 일마다 막힘없이 시원하게 풀리는 최고의 전성기를 맞이합니다.",
    advice: "그늘 속에서 머뭇거릴 이유가 없습니다. 온 세상이 당신을 응원하고 있으니 마음껏 빛나세요.",
    image: "../assets/images/tarot/19.png"
  },
  {
    id: 20,
    number: "XX",
    roman: "XX",
    name: "Judgement",
    koreanName: "심판",
    keywords: ["극적 부활", "두 번째 찬스", "명예로운 보상"],
    reading: "새해에는 과거에 아쉽게 놓쳤거나 미뤄두었던 일에 두 번째 기회, 즉 멋진 부활의 서막이 열립니다.\n\n그간 흘린 땀방울이 정확한 평가를 받으며 사람들의 뜨거운 환호와 축하를 이끌어냅니다.",
    advice: "과거의 실패나 아쉬움에 발목 잡히지 마세요. 다시 찾아온 기회를 기쁜 마음으로 품으세요.",
    image: "../assets/images/tarot/20.png"
  },
  {
    id: 21,
    number: "XXI",
    roman: "XXI",
    name: "The World",
    koreanName: "세계",
    keywords: ["완벽한 해피엔딩", "통합과 완성", "찬란한 축제"],
    reading: "오랫동안 공들여온 거대한 여정의 조각들이 마침내 완벽하게 제자리를 찾아 하나의 아름다운 풍경을 완성합니다.\n\n모든 사이클이 성공적으로 마무리되며, 누구나 부러워할 만한 깊은 성취감과 축제를 맞이하게 돼요.",
    advice: "지나온 모든 순간에 스스로 아낌없는 박수를 보내주세요. 모든 것이 완벽하게 순조롭습니다.",
    image: "../assets/images/tarot/21.png"
  }
];

if (typeof window !== 'undefined') {
  window.tarotCards = tarotCards;
  window.tarotData = tarotCards;
}
