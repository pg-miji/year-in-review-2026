// ===================================================================
// 시간 조각 상점 - Main Entrance Portal Logic
// ===================================================================

function initMainPage() {
  // Clear any residual photobooth stage attribute
  document.body.removeAttribute('data-stage');
  const appContainer = document.querySelector('.app-container');
  if (appContainer) {
    appContainer.removeAttribute('data-stage');
  }

  const questionBtn = document.getElementById('portal-question-btn');
  const tarotBtn = document.getElementById('portal-tarot-btn');
  const photoboothBtn = document.getElementById('portal-photobooth-btn');
  const fireworksBtn = document.getElementById('portal-fireworks-btn');

  if (questionBtn) {
    questionBtn.onclick = function () {
      window.MysticalAudio?.playCardFlip();
    };
  }

  if (tarotBtn) {
    tarotBtn.onclick = function () {
      window.MysticalAudio?.playCardFlip();
    };
  }

  if (photoboothBtn) {
    photoboothBtn.onclick = function () {
      window.MysticalAudio?.playCardFlip();
    };
  }

  if (fireworksBtn) {
    fireworksBtn.onclick = function () {
      window.MysticalAudio?.playCardFlip();
    };
  }

  function getKstDateString() {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
    } catch (e) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
  }

  // Quota check: If crystal quota was exhausted today, hide the crystal portal button
  try {
    const quotaDate = localStorage.getItem('crystal_quota_exhausted_date');
    const today = getKstDateString();
    if (quotaDate === today) {
      const crystalBtn = document.getElementById('portal-crystal-btn');
      if (crystalBtn) {
        crystalBtn.style.display = 'none';
      }
    }
  } catch (e) {}
}

window.initMainPage = initMainPage;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMainPage);
} else {
  initMainPage();
}
