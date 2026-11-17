// ===================================================================
// 시간 조각 상점 - 오늘의 사소한 처방 (수정구슬) Interactive Controller
// ===================================================================

import { getLocalCrystalAnswer } from './crystal_oracle.js';
import { CRYSTAL_CONFIG } from './crystal_config.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const crystalDisplay = document.getElementById('crystal-ball-display');
  const crystalOrb = document.getElementById('crystal-orb');
  const inputPanel = document.getElementById('crystal-input-panel');
  const thinkingBox = document.getElementById('crystal-thinking-box');
  const resultBox = document.getElementById('crystal-result-box');
  const worryTextarea = document.getElementById('worry-textarea');
  const charCount = document.getElementById('char-count');
  const btnAsk = document.getElementById('btn-ask-crystal');
  const userWorryQuote = document.getElementById('user-worry-quote');
  const userCategoryTag = document.getElementById('user-category-tag');
  const revelationText = document.getElementById('revelation-answer-text');
  const thinkingPhrase = document.getElementById('thinking-phrase');
  const btnRegenerate = document.getElementById('btn-regenerate-answer');
  const btnNewWorry = document.getElementById('btn-new-worry');
  const categoryCards = document.querySelectorAll('.category-card');
  const errorBox = document.getElementById('crystal-error-box');
  const errorText = document.getElementById('crystal-error-text');
  const btnRetry = document.getElementById('btn-retry');
  const quotaModal = document.getElementById('crystal-quota-modal');
  const btnCloseQuotaModal = document.getElementById('btn-close-quota-modal');

  const QUOTA_KEY = 'crystal_quota_exhausted_date';

  let currentWorry = '';
  let lastAnswer = '';
  let selectedCategory = '';
  let isSubmitting = false;

  function getKstDateString() {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
    } catch (e) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
  }

  function isQuotaExhausted() {
    try {
      const savedDate = localStorage.getItem(QUOTA_KEY);
      const today = getKstDateString();
      return savedDate === today;
    } catch (e) {
      return false;
    }
  }

  function setQuotaExhausted() {
    try {
      const today = getKstDateString();
      localStorage.setItem(QUOTA_KEY, today);
    } catch (e) {}
  }

  function showQuotaAlert(msg) {
    if (quotaModal) {
      if (msg) {
        const descEl = document.getElementById('quota-modal-desc');
        if (descEl) descEl.innerHTML = msg.replace(/\n/g, '<br>');
      }
      quotaModal.style.display = 'flex';
    }
  }

  if (btnCloseQuotaModal) {
    btnCloseQuotaModal.addEventListener('click', () => {
      if (quotaModal) quotaModal.style.display = 'none';
      resetToInputState();
    });
  }

  const CATEGORY_MAP = {
    work: '💼 일과 진로',
    relationship: '💬 사람과 관계',
    money: '🪙 돈과 소비',
    mind: '🌱 나와 마음',
    rest: '🛌 건강과 휴식',
    random: '💭 그 밖의 고민',
    // Fallback aliases
    future: '💼 일과 진로',
    self: '🌱 나와 마음',
    condition: '🛌 건강과 휴식'
  };

  const THINKING_PHRASES = [
    '구슬아, 뭐라도 보여줘...',
    '구슬 속 작은 우주를 들여다보는 중...',
    '미래와 교신을 시도하는 중...',
    '우주 고객센터에 문의하는 중...',
    '별들이 회의 중입니다. 안건은 당신의 고민...',
    '고민을 한 꼬집, 별가루를 두 꼬집...',
    '구슬 속 안개가 걷히는 중...',
    '흐릿한 운명의 실마리를 찾는 중...',
    '구슬에 무언가 비치기 시작하는 중...',
    '우주의 기밀문서를 열람하는 중...',
    '미래를 불러오는 중... 잠시만요...',
  ];

  // 1. Character count listener
  if (worryTextarea && charCount) {
    worryTextarea.addEventListener('input', () => {
      const len = worryTextarea.value.length;
      charCount.textContent = `${len} / 300`;
      hideError();
    });
  }

  // 2. Category selection cards
  categoryCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      const catKey = card.getAttribute('data-category');
      if (selectedCategory === catKey) {
        // Toggle off if already selected
        selectedCategory = '';
        card.classList.remove('is-selected');
        card.setAttribute('aria-checked', 'false');
      } else {
        // Select this category
        selectedCategory = catKey;
        categoryCards.forEach((c) => {
          c.classList.remove('is-selected');
          c.setAttribute('aria-checked', 'false');
        });
        card.classList.add('is-selected');
        card.setAttribute('aria-checked', 'true');
      }

      hideError();

      if (window.MysticalAudio && typeof window.MysticalAudio.playCardFlip === 'function') {
        window.MysticalAudio.playCardFlip();
      }
    });
  });

  // 3. Direct crystal ball tap
  if (crystalOrb) {
    crystalOrb.addEventListener('click', () => {
      if (isSubmitting) return;

      if (window.MysticalAudio && typeof window.MysticalAudio.playMysticChime === 'function') {
        window.MysticalAudio.playMysticChime();
      }

      if (inputPanel.style.display !== 'none') {
        const text = worryTextarea ? worryTextarea.value.trim() : '';
        if (text.length > 0) {
          handleAskQuestion();
        } else if (worryTextarea) {
          worryTextarea.focus();
        }
      }
    });
  }

  // 4. Submit button click
  if (btnAsk) {
    btnAsk.addEventListener('click', (e) => {
      e.preventDefault();
      handleAskQuestion();
    });
  }

  // Allow Ctrl+Enter or Cmd+Enter to submit
  if (worryTextarea) {
    worryTextarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAskQuestion();
      }
    });
  }

  // 5. Regenerate answer button
  if (btnRegenerate) {
    btnRegenerate.addEventListener('click', (e) => {
      e.preventDefault();
      if (!currentWorry || isSubmitting) return;
      handleAskQuestion(true);
    });
  }

  // 6. New worry button
  if (btnNewWorry) {
    btnNewWorry.addEventListener('click', (e) => {
      e.preventDefault();
      resetToInputState();
    });
  }

  // 7. Retry button
  if (btnRetry) {
    btnRetry.addEventListener('click', (e) => {
      e.preventDefault();
      hideError();
      handleAskQuestion();
    });
  }

  function showError(msg) {
    if (errorBox) {
      if (errorText) errorText.textContent = msg || '수정구슬과의 교신이 원활하지 않습니다.';
      errorBox.style.display = 'flex';
    }
  }

  function hideError() {
    if (errorBox) {
      errorBox.style.display = 'none';
    }
  }

  // Core Request & Generation Action (Hardened for PC + Mobile)
  async function handleAskQuestion(isRegen = false) {
    if (isSubmitting) return;

    // Check if daily quota is exhausted
    if (isQuotaExhausted()) {
      showQuotaAlert('수정구슬도 잠시 쉬어갈 시간이에요.<br>내일 다시 찾아와 주세요 🌙');
      return;
    }

    const text = isRegen ? currentWorry : (worryTextarea ? worryTextarea.value.trim() : '');

    if (!text) {
      if (worryTextarea) {
        worryTextarea.classList.add('shake-anim');
        worryTextarea.focus();
        setTimeout(() => worryTextarea.classList.remove('shake-anim'), 600);
      }
      return;
    }

    currentWorry = text;
    isSubmitting = true;
    hideError();

    // On mobile: smoothly dismiss virtual keyboard before hiding input panel
    if (worryTextarea) {
      worryTextarea.blur();
    }

    // Transition to Generating state
    setGeneratingState(true);

    if (window.MysticalAudio && typeof window.MysticalAudio.playMysticChime === 'function') {
      window.MysticalAudio.playMysticChime();
    }

    // Minimum deliberation time (3.2 seconds) for atmospheric presence
    const minAnimationPromise = new Promise((resolve) => setTimeout(resolve, 3200));
    let fetchedAnswer = '';
    let quotaHit = false;

    // Check if hosted on GitHub Pages or static host where /api/ does not exist
    const isStaticHosting = window.location.hostname.includes('github.io') ||
                            window.location.protocol === 'file:' ||
                            (!window.location.origin.includes('localhost') && !window.location.origin.includes('run.app'));

    const clientKey = (CRYSTAL_CONFIG && CRYSTAL_CONFIG.geminiApiKey)
      ? CRYSTAL_CONFIG.geminiApiKey.trim()
      : '';

    // On GitHub Pages: Call Gemini API directly (skipping non-existent /api/ route to save 3+ seconds on mobile)
    if (isStaticHosting && clientKey) {
      try {
        const directRes = await callDirectClientGemini(
          currentWorry,
          selectedCategory,
          isRegen ? lastAnswer : '',
          clientKey
        );
        if (directRes && directRes.quotaExhausted) {
          quotaHit = true;
        } else if (typeof directRes === 'string' && directRes.length > 2) {
          fetchedAnswer = directRes;
        }
      } catch (e) {
        fetchedAnswer = '';
      }
    } else {
      // 1. Try server endpoint first (/api/crystal-ball) on local/cloud dev servers
      try {
        const responsePromise = fetch('/api/crystal-ball', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            worry: currentWorry,
            category: selectedCategory,
            previousAnswer: isRegen ? lastAnswer : ''
          })
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 8500)
        );

        const res = await Promise.race([responsePromise, timeoutPromise]);
        if (res && res.status === 429) {
          quotaHit = true;
        } else if (res && res.ok) {
          const data = await res.json();
          if (data && data.answer) {
            fetchedAnswer = data.answer.trim();
          }
        }
      } catch (err) {
        fetchedAnswer = '';
      }

      // 2. Client-side fallback if server endpoint fails
      if (!fetchedAnswer && !quotaHit && clientKey) {
        try {
          const directRes = await callDirectClientGemini(
            currentWorry,
            selectedCategory,
            isRegen ? lastAnswer : '',
            clientKey
          );
          if (directRes && directRes.quotaExhausted) {
            quotaHit = true;
          } else if (typeof directRes === 'string' && directRes.length > 2) {
            fetchedAnswer = directRes;
          }
        } catch (e) {
          fetchedAnswer = '';
        }
      }
    }

    // If quota was hit (429 RESOURCE_EXHAUSTED)
    if (quotaHit) {
      setQuotaExhausted();
      setGeneratingState(false);
      isSubmitting = false;
      showQuotaAlert('수정구슬도 잠시 쉬어갈 시간이에요.<br>내일 다시 찾아와 주세요 🌙');
      return;
    }

    // 3. If neither server API nor client key succeeded, use curated local engine
    if (!fetchedAnswer) {
      try {
        fetchedAnswer = getLocalCrystalAnswer(currentWorry, isRegen ? lastAnswer : '', selectedCategory);
      } catch (e) {
        fetchedAnswer = '앗, 구슬 속 안개가 걷히지 않네요. 잠시 후 다시 살펴봐 주세요 🫧';
      }
    }

    // Wait for minimum visual animation to finish
    await minAnimationPromise;

    lastAnswer = fetchedAnswer;
    setGeneratingState(false);
    isSubmitting = false;

    showResultState(currentWorry, lastAnswer);
  }

  // Direct Browser Gemini API Call (For GitHub Pages static hosting)
  async function callDirectClientGemini(worry, category, previousAnswer, apiKey) {
    const categoryName = (CATEGORY_MAP[category] || '').replace(/^[^\s]+\s*/, '');
    const userPromptText = categoryName
      ? `[사용자가 고른 카테고리: ${categoryName}]\n고민/질문: "${worry}"`
      : `고민/질문: "${worry}"`;

    const trimmedWorry = (worry || '').trim();
    const isSeriousMode = /^진지하게/i.test(trimmedWorry) ||
      /우울증|공황|불안장애|트라우마|이별했|헤어졌|상실|가족.*아프|돌아가|눈물이\s*(계속|멈추)|너무\s*괴로|버티기\s*힘들/.test(trimmedWorry);
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
    // 12 seconds timeout to accommodate mobile network latency
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
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

      if (apiRes) {
        if (apiRes.status === 429) {
          return { quotaExhausted: true };
        }
        if (apiRes.ok) {
          const data = await apiRes.json();
          const parts = data?.candidates?.[0]?.content?.parts || [];
          const text = parts
            .filter((p) => !p.thought && typeof p.text === 'string')
            .map((p) => p.text)
            .join('')
            .trim();
          if (text && text.length > 2) {
            return text;
          }
        }
      }
    } catch (err) {
      console.warn('[Crystal Ball] Client Gemini error:', err);
    }
    return '';
  }

  function setGeneratingState(isGenerating) {
    if (isGenerating) {
      if (btnAsk) btnAsk.disabled = true;
      crystalDisplay.classList.add('is-generating');
      inputPanel.style.display = 'none';
      resultBox.style.display = 'none';
      thinkingBox.style.display = 'flex';

      // Pick ONE random thinking phrase and keep it steady throughout loading
      const phraseIdx = Math.floor(Math.random() * THINKING_PHRASES.length);
      thinkingPhrase.textContent = THINKING_PHRASES[phraseIdx];

      // Gently align viewport on mobile so crystal and loading stay comfortably visible
      setTimeout(() => {
        if (crystalDisplay) {
          const rect = crystalDisplay.getBoundingClientRect();
          if (rect.top < 10) {
            window.scrollTo({
              top: Math.max(0, window.pageYOffset + rect.top - 16),
              behavior: 'smooth'
            });
          }
        }
      }, 50);
    } else {
      if (btnAsk) btnAsk.disabled = false;
      crystalDisplay.classList.remove('is-generating');
      thinkingBox.style.display = 'none';
    }
  }

  function showResultState(worry, answer) {
    if (userWorryQuote) {
      userWorryQuote.textContent = worry;
    }

    // Show category badge if one was selected
    if (userCategoryTag) {
      if (selectedCategory && CATEGORY_MAP[selectedCategory]) {
        userCategoryTag.textContent = CATEGORY_MAP[selectedCategory];
        userCategoryTag.style.display = 'inline-flex';
      } else {
        userCategoryTag.style.display = 'none';
      }
    }

    if (revelationText) {
      revelationText.textContent = answer;
    }

    resultBox.style.display = 'flex';
    inputPanel.style.display = 'none';

    if (window.MysticalAudio && typeof window.MysticalAudio.playMysticChime === 'function') {
      window.MysticalAudio.playMysticChime();
    }

    // Gently align viewport on mobile so crystal and result stay naturally visible
    setTimeout(() => {
      if (crystalDisplay) {
        const rect = crystalDisplay.getBoundingClientRect();
        if (rect.top < 10) {
          window.scrollTo({
            top: Math.max(0, window.pageYOffset + rect.top - 16),
            behavior: 'smooth'
          });
        }
      }
    }, 80);
  }

  function resetToInputState() {
    isSubmitting = false;
    hideError();
    resultBox.style.display = 'none';
    thinkingBox.style.display = 'none';
    inputPanel.style.display = 'block';

    if (worryTextarea) {
      worryTextarea.value = '';
      if (charCount) charCount.textContent = '0 / 300';
      // Only focus on desktop to avoid abruptly popping mobile keyboard
      if (window.innerWidth > 768) {
        worryTextarea.focus();
      }
    }

    // Scroll smoothly back to input panel
    inputPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    currentWorry = '';
  }
});
