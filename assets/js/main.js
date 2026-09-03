// ===================================================================
// 작은모임연구소의 작은 점술가게 - Main Entrance Portal Logic
// ===================================================================

function initMainPage() {
  const questionBtn = document.getElementById('portal-question-btn');
  const tarotBtn = document.getElementById('portal-tarot-btn');
  const photoboothBtn = document.getElementById('portal-photobooth-btn');

  if (questionBtn) {
    questionBtn.onclick = function (e) {
      e.preventDefault();
      window.MysticalAudio?.playCardFlip();
      navigateTo('pages/question.html?fresh=1');
    };
  }

  if (tarotBtn) {
    tarotBtn.onclick = function (e) {
      e.preventDefault();
      window.MysticalAudio?.playCardFlip();
      navigateTo('pages/cards.html');
    };
  }

  if (photoboothBtn) {
    photoboothBtn.onclick = function (e) {
      e.preventDefault();
      window.MysticalAudio?.playCardFlip();
      navigateTo('pages/photobooth.html');
    };
  }
}

function navigateTo(url) {
  if (window.MysticalRouter) {
    window.MysticalRouter.navigate(url);
  } else {
    const overlay = document.getElementById('transition-curtain');
    if (overlay) {
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'all';
      setTimeout(() => {
        window.location.href = url;
      }, 250);
    } else {
      window.location.href = url;
    }
  }
}

window.initMainPage = initMainPage;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMainPage);
} else {
  initMainPage();
}
