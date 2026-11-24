// ===================================================================
// 시간 조각 상점 - Question Experience Logic
// ===================================================================

(function () {
  const defaultQuestions = {
    this_year: [
      // 사람
      "올해 당신을 조금 바꿔놓은 사람이 있나요?",
      "올해 새로 알게 되었거나, 다시 가까워진 사람은 누구인가요?",
      "올해 누군가를 위해 한 일 중 기억에 남는 것이 있나요?",

      // 소비
      "올해 큰마음 먹고 산 것은 무엇인가요?",
      "올해 가장 후회한 소비는 무엇이었나요?",
      "별 기대 없이 샀는데 오래 곁에 둔 물건이 있나요?",

      // 시도·결정·성장
      "올해 처음으로 해본 일은 무엇인가요?",
      "올해 내린 결정 중 가장 잘했다 싶은 것은 무엇인가요?",
      "작지만 분명히 나아진 것이 있다면 무엇인가요?",
      "올해 스스로가 조금 자랑스러웠던 순간이 있었나요?",
      "올해 기꺼이 내려놓은 것이 있나요?",
      "올해 당신의 하루를 지탱해준 작은 습관이 있나요?",
      "올해까지만 하고 그만두고 싶은 습관이 있나요?",

      // 감정
      "올해 가장 행복했던 순간은 언제였나요?",
      "올해 당신의 마음을 가장 시끄럽게 만든 일은 무엇이었나요?",
      "지금 생각하면 웃음이 나는 올해의 실수가 있나요?",
      "올해 들은 말 중에 오래 기억하고 싶은 말이 있나요?",
      "올해 가장 고마웠던 일은 무엇인가요?",

      // 나 발견
      "올해 새로 생긴 취향이 있나요?",
      "올해 생각이 바뀐 것이 하나 있다면 무엇인가요?",
      "올해 처음 알게 된 자신의 모습이 있나요?",
      "올해 당신이 가장 자주 한 말은 무엇이었을까요?",

      // 취향·발견
      "올해 가장 맛있게 먹은 음식은 무엇인가요?",
      "올해 마음에 오래 남은 장소가 있나요?",
      "올해 자꾸만 다시 듣게 된 노래가 있나요?",
      "올해 본 것 중에 아직도 가끔 떠오르는 장면이 있나요?",
      "여기 있는 사람들에게 꼭 권하고 싶은 것이 있나요?",
      "올해의 사진첩에서 딱 한 장만 보여준다면 어떤 사진인가요?",
      "올해 마음에 밑줄 그은 문장이 있나요?",

      // 정리
      "올해를 이모지 다섯 개로 표현하면 어떻게 될까요?",
      "올해에 점수를 매긴다면 몇 점을 주고 싶나요?",
      "올해가 한 편의 영화라면 제목은 무엇일까요?",
      "올해의 당신에게 상을 준다면 무슨 상을 주고 싶나요?",
      "올해를 살아낸 자신에게 어떤 말을 건네고 싶나요?"
    ],
    next_year: [
      "내년의 당신은 어떤 단어로 표현될까요?",
      "내년에는 꼭 한번 해보고 싶은 일이 있나요?",
      "내년에 배워보고 싶은 것이 있나요?",
      "내년에는 무엇을 새로 좋아해보고 싶나요?",
      "내년에 가보고 싶은 곳은 어디인가요?",
      "내년에 스스로에게 선물하고 싶은 작은 사치가 있나요?",
      "내년에 더 자주 만나고 싶은 사람이 있나요?",
      "내년의 자신에게 무엇을 너그럽게 허락해주고 싶나요?",
      "새해 첫날 첫곡으로 듣고 싶은 노래는 무엇인가요?",
      "내년이 기다려지는 이유가 있나요?",
      "내년에도 변하지 않았으면 하는 것이 있나요?",
      "새해에 스스로와 꼭 지키고 싶은 약속이 있나요?",
      "내년 이맘때, 무엇을 자랑하고 싶나요?"
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

  function updateProgressUI(drawnCount, totalCount, isExhausted) {
    const progressEl = document.getElementById('question-progress');
    if (progressEl) {
      const shownCount = Math.min(drawnCount, totalCount);
      progressEl.textContent = isExhausted
        ? `완료 (${totalCount} / ${totalCount})`
        : `${shownCount} / ${totalCount}`;
    }
  }

  function renderExhaustedNotice(cat, questionTextEl) {
    if (!questionTextEl) return;
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
      categoryRibbonEl.textContent = cat === 'this_year' ? '🧩 올해를 돌아보는 질문' : '☀️ 새해를 맞이하는 질문';
    }

    // Check if exhausted
    if (remaining.length === 0) {
      if (forceNewAnimation && cardEl) {
        triggerExhaustedFade(cardEl, cat, allQuestions.length);
      } else {
        renderExhaustedNotice(cat, questionTextEl);
        updateProgressUI(allQuestions.length, allQuestions.length, true);
      }
      return;
    }

    // Pick random question from remaining
    const randomIndex = Math.floor(Math.random() * remaining.length);
    const selectedQuestion = remaining[randomIndex];

    drawn.push(selectedQuestion);
    saveDrawnHistory(cat, drawn);

    if (forceNewAnimation && cardEl) {
      triggerFade(cardEl, selectedQuestion, cat, drawn.length, allQuestions.length);
    } else {
      if (categoryRibbonEl) {
        categoryRibbonEl.textContent = cat === 'this_year' ? '🧩 올해를 돌아보는 질문' : '☀️ 새해를 맞이하는 질문';
      }
      if (questionTextEl) {
        questionTextEl.textContent = selectedQuestion;
      }
      updateProgressUI(drawn.length, allQuestions.length, false);
    }
  }

  function triggerExhaustedFade(element, cat, totalCount) {
    if (isAnimating) return;
    isAnimating = true;

    const questionTextEl = document.getElementById('card-question-text');
    element.classList.remove('fading-in');
    element.classList.add('fading-out');

    setTimeout(() => {
      renderExhaustedNotice(cat, questionTextEl);
      updateProgressUI(totalCount, totalCount, true);

      element.classList.remove('fading-out');
      element.classList.add('fading-in');

      setTimeout(() => {
        element.classList.remove('fading-in');
        isAnimating = false;
      }, 260);
    }, 250);
  }

  function triggerFade(element, newQuestionText, cat, drawnCount, totalCount) {
    if (isAnimating) return;
    isAnimating = true;

    const questionTextEl = document.getElementById('card-question-text');
    const ribbonEl = document.getElementById('card-category-ribbon');

    // 1. Fade out question text
    element.classList.remove('fading-in');
    element.classList.add('fading-out');

    // 2. After fade out (250ms), change text and ribbon, then fade in
    setTimeout(() => {
      if (questionTextEl) {
        questionTextEl.textContent = newQuestionText;
      }
      if (ribbonEl) {
        ribbonEl.textContent = cat === 'this_year' ? '🧩 올해를 돌아보는 질문' : '☀️ 새해를 맞이하는 질문';
      }
      updateProgressUI(drawnCount, totalCount, false);

      element.classList.remove('fading-out');
      element.classList.add('fading-in');

      // 3. Complete animation sequence
      setTimeout(() => {
        element.classList.remove('fading-in');
        isAnimating = false;
      }, 260);
    }, 250);
  }

  // Initialize Question Page
  function initQuestionPage() {
    isAnimating = false;
    const cardEl = document.getElementById('question-card');
    if (cardEl) {
      cardEl.classList.remove('flipping', 'fading-out', 'fading-in');
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
