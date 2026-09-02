// ===================================================================
// 작은모임연구소의 작은 점술가게 - Question Experience Logic
// ===================================================================

(function () {
  const defaultQuestions = {
    this_year: [
      "올해 나에게 영향을 준 사람",
      "올해 새롭게 만난 사람",
      "올해 큰 마음 먹고 지른 소비",
      "올해 최악의 소비",
      "올해 가장 스트레스 받은 일",
      "올해 과감히 시도해본 것",
      "올해 처음 해본 것",
      "올해 잘한 결정 하나",
      "올해의 작은 성공",
      "올해 내 자신이 자랑스러웠던 순간",
      "올해 가장 많이 웃었던 순간",
      "올해 가장 행복했던 순간",
      "올해 들었던 가장 기분 좋았던 말",
      "올해 새롭게 생긴 취향",
      "올해의 음식",
      "올해의 여행지",
      "올해 귀를 사로잡은 노래",
      "올해의 콘텐츠",
      "올해의 새로운 발견",
      "올해 나만 알고 있기 아까운 것",
      "올해 누군가에게 가장 영업하고 싶은 것",
      "올해의 사진",
      "올해의 문장",
      "올해 잊을 수 없는 장소",
      "올해의 실패 또는 포기",
      "올해를 이모지 5개로 표현한다면",
      "올해 평점을 매긴다면",
      "올해를 영화 제목으로 만든다면",
      "올해의 나에게 상을 준다면 어떤 상?",
      "올해의 나에게 한마디 한다면"
    ],
    next_year: [
      "내년에 가장 이루고 싶은 목표",
      "내년의 나를 한 단어로 표현한다면",
      "내년에 시간을 더 많이 보내고 싶은 사람",
      "내년에 도전해보고 싶은 취미",
      "내년의 여행 계획",
      "내년에 하고 싶은 작은 사치",
      "내년이 기대되는 점",
      "새해 첫 곡으로 들을 노래",
      "내년에 꼭 한번 해보고 싶은 일",
      "내년에 새롭게 좋아해보고 싶은 것",
      "내년에 배우고 싶은 것",
      "내년에 더 자주 하고 싶은 것",
      "내년에 덜 하고 싶은 것",
      "내년에 나에게 허락하고 싶은 것",
      "내년에 나에게 선물하고 싶은 것",
      "내년이 끝났을 때 가장 듣고 싶은 칭찬",
      "내년에 꼭 한번 자랑하고 싶은 일"
    ]
  };

  let currentCategory = 'this_year';
  let isAnimating = false;

  function getQuestions(cat) {
    if (window.questionData && window.questionData[cat]) {
      return window.questionData[cat];
    }
    return defaultQuestions[cat] || [];
  }

  function getDrawnHistory(cat) {
    try {
      const data = sessionStorage.getItem('drawn_' + cat);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveDrawnHistory(cat, list) {
    try {
      sessionStorage.setItem('drawn_' + cat, JSON.stringify(list));
    } catch (e) {}
  }

  function resetCategoryHistory(cat) {
    try {
      sessionStorage.removeItem('drawn_' + cat);
    } catch (e) {}
    drawQuestion(cat, false);
  }

  function drawQuestion(cat, forceNewAnimation = true) {
    if (isAnimating) return;
    currentCategory = cat;

    const allQuestions = getQuestions(cat);
    const drawn = getDrawnHistory(cat);
    const remaining = allQuestions.filter(q => !drawn.includes(q));

    const cardEl = document.getElementById('question-card');
    const categoryRibbonEl = document.getElementById('card-category-ribbon');
    const questionTextEl = document.getElementById('card-question-text');
    const bottomThisYearBtn = document.getElementById('btn-draw-this-year');
    const bottomNextYearBtn = document.getElementById('btn-draw-next-year');

    // Update bottom button active appearance
    if (bottomThisYearBtn && bottomNextYearBtn) {
      if (cat === 'this_year') {
        bottomThisYearBtn.classList.add('btn-gold');
        bottomThisYearBtn.classList.remove('btn-velvet');
        bottomNextYearBtn.classList.add('btn-velvet');
        bottomNextYearBtn.classList.remove('btn-gold');
      } else {
        bottomNextYearBtn.classList.add('btn-gold');
        bottomNextYearBtn.classList.remove('btn-velvet');
        bottomThisYearBtn.classList.add('btn-velvet');
        bottomThisYearBtn.classList.remove('btn-gold');
      }
    }

    if (categoryRibbonEl) {
      categoryRibbonEl.textContent = cat === 'this_year' ? '🌿 올해를 돌아보는 질문' : '✨ 새해를 맞이하는 질문';
    }

    // Check if exhausted
    if (remaining.length === 0) {
      if (forceNewAnimation && cardEl) {
        triggerFlip(cardEl);
      }
      if (questionTextEl) {
        questionTextEl.innerHTML = `
          <div class="exhausted-notice-wrap">
            <div class="exhausted-icon">💛</div>
            <div class="exhausted-title">준비된 모든 질문을 열어보았습니다!</div>
            <div class="exhausted-desc">지난 시간을 돌아보고 새해를 상상하는 따뜻한 대화가 되었기를 바랍니다.</div>
            <button id="btn-reset-questions" class="btn-vintage btn-gold" style="margin-top:12px; font-size:14px; padding:10px 20px;">
              🔄 질문 다시 섞기 (처음부터)
            </button>
          </div>
        `;
        const resetBtn = document.getElementById('btn-reset-questions');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => resetCategoryHistory(cat));
        }
      }
      return;
    }

    // Pick random question from remaining
    const randomIndex = Math.floor(Math.random() * remaining.length);
    const selectedQuestion = remaining[randomIndex];

    drawn.push(selectedQuestion);
    saveDrawnHistory(cat, drawn);

    if (forceNewAnimation && cardEl) {
      triggerFlip(cardEl, selectedQuestion, cat);
    } else {
      if (categoryRibbonEl) {
        categoryRibbonEl.textContent = cat === 'this_year' ? '🌿 올해를 돌아보는 질문' : '✨ 새해를 맞이하는 질문';
      }
      if (questionTextEl) {
        questionTextEl.textContent = selectedQuestion;
      }
    }
  }

  function triggerFlip(element, newQuestionText, cat) {
    if (isAnimating) return;
    isAnimating = true;

    const questionTextEl = document.getElementById('card-question-text');
    const ribbonEl = document.getElementById('card-category-ribbon');

    // 1. Instantly fade out old question text
    element.classList.remove('text-fade-in', 'flipping');
    element.classList.add('text-fade-out');
    void element.offsetWidth;

    // 2. Start card 3D flip animation
    element.classList.add('flipping');

    // 3. At edge-on rotation (~400ms), swap text while turned
    setTimeout(() => {
      if (questionTextEl) {
        questionTextEl.textContent = newQuestionText;
      }
      if (ribbonEl) {
        ribbonEl.textContent = cat === 'this_year' ? '🌿 올해를 돌아보는 질문' : '✨ 새해를 맞이하는 질문';
      }
    }, 400);

    // 4. As card faces forward (~580ms), fade in the new question text smoothly
    setTimeout(() => {
      element.classList.remove('text-fade-out');
      element.classList.add('text-fade-in');
    }, 580);

    // 5. Complete animation sequence (~880ms)
    setTimeout(() => {
      element.classList.remove('flipping', 'text-fade-in');
      isAnimating = false;
    }, 880);
  }

  // Initialize Question Page
  function initQuestionPage() {
    isAnimating = false;
    const cardEl = document.getElementById('question-card');
    if (cardEl) {
      cardEl.classList.remove('flipping');
    }

    const params = new URLSearchParams(window.location.search);
    const isFresh = params.get('fresh') === '1' || (document.referrer && (document.referrer.endsWith('index.html') || document.referrer.endsWith('/')));

    // When entering fresh, reset session history
    if (isFresh) {
      try {
        sessionStorage.removeItem('drawn_this_year');
        sessionStorage.removeItem('drawn_next_year');
      } catch (e) {}

      if (params.has('fresh')) {
        params.delete('fresh');
        const cleanQuery = params.toString() ? '?' + params.toString() : '';
        window.history.replaceState({}, document.title, window.location.pathname + cleanQuery);
      }
    }

    const categoryParam = params.get('type');
    if (categoryParam === 'next_year' || categoryParam === 'next') {
      currentCategory = 'next_year';
    } else {
      currentCategory = 'this_year';
    }

    // Bottom Navigation Buttons
    const btnThisYear = document.getElementById('btn-draw-this-year');
    if (btnThisYear) {
      btnThisYear.onclick = () => {
        window.MysticalAudio?.playCardFlip();
        drawQuestion('this_year', true);
      };
    }

    const btnNextYear = document.getElementById('btn-draw-next-year');
    if (btnNextYear) {
      btnNextYear.onclick = () => {
        window.MysticalAudio?.playCardFlip();
        drawQuestion('next_year', true);
      };
    }

    // Initial draw
    drawQuestion(currentCategory, false);
  }

  window.initQuestionPage = initQuestionPage;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuestionPage);
  } else {
    initQuestionPage();
  }
})();
