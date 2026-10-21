// ===================================================================
// 시간 조각 상점 - 오늘의 사소한 처방 (수정구슬) Interactive Controller
// ===================================================================

import { getLocalCrystalAnswer } from './crystal_oracle.js?v=2.3.0';
import { CRYSTAL_CONFIG } from './crystal_config.js?v=2.3.0';

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

  function isQuotaExhausted() {
    try {
      const savedDate = localStorage.getItem(QUOTA_KEY);
      const today = new Date().toISOString().slice(0, 10);
      return savedDate === today;
    } catch (e) {
      return false;
    }
  }

  function setQuotaExhausted() {
    try {
      const today = new Date().toISOString().slice(0, 10);
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
    } else {
      try {
        window.alert(msg ? msg.replace(/<br>/g, '\n') : '수정구슬도 잠시 쉬어갈 시간이에요. 내일 다시 찾아와 주세요.');
      } catch (e) {}
    }
  }

  if (btnCloseQuotaModal) {
    btnCloseQuotaModal.addEventListener('click', () => {
      if (quotaModal) quotaModal.style.display = 'none';
      resetToInputState();
    });
  }

  const CATEGORY_MAP = {
    work: '💼 일과 회사',
    future: '🧭 진로와 미래',
    relationship: '💬 사람과 관계',
    money: '🪙 돈과 소비',
    self: '🌱 나 자신',
    condition: '🫠 마음과 에너지',
    random: '💭 그 밖의 고민'
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

    const systemPrompt = `당신은 시간 조각 상점의 "오늘의 사소한 처방" 수정구슬입니다.
사용자가 털어놓은 고민, 질문, 엉뚱한 생각에 대해 짧고 재치 있는 처방을 한마디 건넵니다.
전문적인 심리 상담이나 정답 해결책을 주려는 것이 아니라, 고민을 바라보는 순간의 기분을 환기해 주는 가벼운 엔터테인먼트 콘텐츠입니다.

[핵심 원칙]
1. 입력 맥락 우선: 카테고리는 참고용일 뿐, 사용자가 실제로 쓴 글의 맥락과 감정을 최우선으로 해석하세요.
2. 보통 1~2문장 (최대 3문장 이내)으로 짧고 명쾌하게 작성하세요.
3. 능청스럽고 엉뚱하며 재치 있는 어조를 사용하세요. (~네요, ~군요, ~해봅시다, ~인 셈 치죠, ~어떨까요?).
4. 상투적인 위로, 뻔한 조언, 자기계발식 훈계, 진지한 분석은 피하세요.
5. 사용자를 비난하거나 무시, 평가, 훈계하지 마세요. 상대를 낮잡아 보는 말투나, 차가운 '~하지 마세요'는 절대 금지합니다.
6. 어려운 용어나 수식어 남발을 절대 금지합니다. 초등학생도 쉽게 읽히는 쉬운 일상 단어만 쓰세요.
7. 이모지는 답변에 사용하지 않거나 1개까지만 사용하세요.
8. 뻔한 접두사 금지: "구슬 속 은하수가...", "우주의 시계추가..." 같은 진부한 서두 없이 바로 산뜻하게 시작하세요.
9. 고민/질문이 '진지하게'라는 문구로 시작한다면 진지하게 답해주세요.
${previousAnswer ? `\n이전에 제공했던 답변: "${previousAnswer}" 와는 다른 새로운 표현과 비유로 작성하세요.` : ''}`;

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
              temperature: 0.85,
              maxOutputTokens: 140
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
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
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
