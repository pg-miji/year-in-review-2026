// ===================================================================
// 시간 조각 상점 - 오늘의 묘한 처방 (수정구슬) Interactive Controller
// ===================================================================

import { getLocalCrystalAnswer } from './crystal_oracle.js';

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

  let currentWorry = '';
  let lastAnswer = '';
  let selectedCategory = '';
  let isSubmitting = false;

  const CATEGORY_MAP = {
    work: '💼 일과 회사',
    future: '🧭 진로와 미래',
    relationship: '💬 인간관계와 연애',
    money: '🪙 돈과 소비',
    self: '🌱 자기 자신',
    condition: '🫠 의욕과 컨디션',
    random: '💭 오늘의 잡생각'
  };

  const THINKING_PHRASES = [
    '구슬아, 뭐라도 하나 알려줘...',
    '구슬 속 작은 우주를 들여다보는 중...',
    '미래와 교신을 시도하는 중...',
    '우주 고객센터에 문의하는 중...',
    '별들이 회의 중입니다. 안건은 당신의 고민...',
    '그럴듯한 한마디를 떠올리는 중...',
    '당신에게 어울리는 한마디를 고르는 중...'
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

      // 8.5s timeout for network call
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 8500)
      );

      const res = await Promise.race([responsePromise, timeoutPromise]);
      if (res && res.ok) {
        const data = await res.json();
        if (data && data.answer) {
          fetchedAnswer = data.answer.trim();
        }
      }
    } catch (err) {
      // Graceful fallback to client-side curated oracle
      fetchedAnswer = '';
    }

    // If API failed or was empty, use curated local engine
    if (!fetchedAnswer) {
      try {
        fetchedAnswer = getLocalCrystalAnswer(currentWorry, isRegen ? lastAnswer : '', selectedCategory);
      } catch (e) {
        fetchedAnswer = '잠시 안개가 짙어졌네요. 이불 속에서 가만히 숨을 고르다 다시 들여다보라는 처방을 내립니다 🌙';
      }
    }

    // Wait for minimum visual animation to finish
    await minAnimationPromise;

    lastAnswer = fetchedAnswer;
    setGeneratingState(false);
    isSubmitting = false;

    showResultState(currentWorry, lastAnswer);
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

      // Scroll smoothly to thinking box on mobile
      setTimeout(() => {
        thinkingBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

    // Smoothly scroll to result box on mobile
    setTimeout(() => {
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
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
