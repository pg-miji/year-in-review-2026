// ===================================================================
// 시간 조각 상점 - 수정구슬 (Crystal Ball) Interactive Controller
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
  const revelationText = document.getElementById('revelation-answer-text');
  const thinkingPhrase = document.getElementById('thinking-phrase');
  const btnRegenerate = document.getElementById('btn-regenerate-answer');
  const btnNewWorry = document.getElementById('btn-new-worry');
  const exampleChips = document.querySelectorAll('.worry-chip');

  let currentWorry = '';
  let lastAnswer = '';

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
    });
  }

  // 2. Clickable example chips
  exampleChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const promptText = chip.getAttribute('data-prompt') || chip.textContent.trim();
      if (worryTextarea) {
        worryTextarea.value = promptText;
        worryTextarea.dispatchEvent(new Event('input'));
        worryTextarea.focus();
        if (window.MysticalAudio && typeof window.MysticalAudio.playCardFlip === 'function') {
          window.MysticalAudio.playCardFlip();
        }
      }
    });
  });

  // 3. Clicking the crystal ball directly
  if (crystalOrb) {
    crystalOrb.addEventListener('click', () => {
      if (window.MysticalAudio && typeof window.MysticalAudio.playMysticChime === 'function') {
        window.MysticalAudio.playMysticChime();
      }
      if (inputPanel.style.display !== 'none' && worryTextarea && worryTextarea.value.trim().length > 0) {
        handleAskQuestion();
      } else if (inputPanel.style.display !== 'none' && worryTextarea) {
        worryTextarea.focus();
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
    btnRegenerate.addEventListener('click', () => {
      if (!currentWorry) return;
      handleAskQuestion(true);
    });
  }

  // 6. New worry button
  if (btnNewWorry) {
    btnNewWorry.addEventListener('click', () => {
      resetToInputState();
    });
  }

  // Core Request / Generate Action
  async function handleAskQuestion(isRegen = false) {
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

    // Transition to Generating state
    setGeneratingState(true);

    if (window.MysticalAudio && typeof window.MysticalAudio.playMysticChime === 'function') {
      window.MysticalAudio.playMysticChime();
    }

    const minAnimationPromise = new Promise((resolve) => setTimeout(resolve, 3500));
    let fetchedAnswer = '';

    try {
      const responsePromise = fetch('/api/crystal-ball', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worry: currentWorry,
          previousAnswer: isRegen ? lastAnswer : ''
        })
      });

      // 9s timeout for AI network call
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 9000)
      );

      const res = await Promise.race([responsePromise, timeoutPromise]);
      if (res.ok) {
        const data = await res.json();
        if (data && data.answer) {
          fetchedAnswer = data.answer;
        }
      }
    } catch (err) {
      // Graceful fallback to client-side curated oracle
      fetchedAnswer = '';
    }

    if (!fetchedAnswer) {
      fetchedAnswer = getLocalCrystalAnswer(currentWorry, isRegen ? lastAnswer : '');
    }

    // Wait for minimum visual animation to finish
    await minAnimationPromise;

    lastAnswer = fetchedAnswer;
    setGeneratingState(false);
    showResultState(currentWorry, lastAnswer);
  }

  function setGeneratingState(isGenerating) {
    if (isGenerating) {
      crystalDisplay.classList.add('is-generating');
      inputPanel.style.display = 'none';
      resultBox.style.display = 'none';
      thinkingBox.style.display = 'flex';

      // Pick ONE random thinking phrase and keep it steady throughout loading
      const phraseIdx = Math.floor(Math.random() * THINKING_PHRASES.length);
      thinkingPhrase.textContent = THINKING_PHRASES[phraseIdx];
    } else {
      crystalDisplay.classList.remove('is-generating');
      thinkingBox.style.display = 'none';
    }
  }

  function showResultState(worry, answer) {
    if (userWorryQuote) {
      userWorryQuote.textContent = worry;
    }
    if (revelationText) {
      revelationText.textContent = answer;
    }

    resultBox.style.display = 'flex';
    inputPanel.style.display = 'none';

    if (window.MysticalAudio && typeof window.MysticalAudio.playMysticChime === 'function') {
      window.MysticalAudio.playMysticChime();
    }

    // Scroll smoothly to result if on mobile
    if (window.innerWidth <= 680) {
      setTimeout(() => {
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }

  function resetToInputState() {
    resultBox.style.display = 'none';
    thinkingBox.style.display = 'none';
    inputPanel.style.display = 'block';

    if (worryTextarea) {
      worryTextarea.value = '';
      if (charCount) charCount.textContent = '0 / 300';
      worryTextarea.focus();
    }

    currentWorry = '';
  }
});
