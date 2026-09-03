// ===================================================================
// 작은모임연구소의 작은 점술가게 - 22 Tarot Deck Spread Selection Logic
// ===================================================================

(function () {
  const TOTAL_CARDS = 22;

  // Shuffle an array using Fisher-Yates
  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function renderDesktopFan(shuffledIds) {
    const container = document.getElementById('desktop-deck-fan');
    if (!container) return;
    container.innerHTML = '';

    const count = shuffledIds.length;
    const totalAngle = 80; // Total arc span in degrees (-40 deg to +40 deg)
    const startAngle = -totalAngle / 2;
    const angleStep = totalAngle / (count - 1);
    
    const totalSpanX = 720; // px
    const startX = -totalSpanX / 2;
    const stepX = totalSpanX / (count - 1);

    shuffledIds.forEach((cardId, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'tarot-card-fan-item';
      cardEl.dataset.cardId = cardId;
      cardEl.setAttribute('role', 'button');
      cardEl.setAttribute('aria-label', `타로 카드 ${index + 1}번 선택`);
      cardEl.setAttribute('tabindex', '0');

      const angle = startAngle + index * angleStep;
      const posX = startX + index * stepX;
      const normalizedPos = (index - (count - 1) / 2) / ((count - 1) / 2);
      const posY = Math.pow(normalizedPos, 2) * 50;

      // Store base transform
      cardEl.dataset.baseAngle = angle;
      cardEl.dataset.baseX = posX;
      cardEl.dataset.baseY = posY;

      cardEl.style.transform = `translateX(${posX}px) translateY(${posY}px) rotate(${angle}deg)`;
      cardEl.style.zIndex = index + 1;

      cardEl.innerHTML = `
        <div class="card-back-art">
          <div class="card-back-border"></div>
          <div class="card-back-inner-border"></div>
          <div class="card-back-center-crest">
            <div class="card-back-symbol">✦</div>
            <div class="card-back-ornament">TAROT</div>
          </div>
        </div>
      `;

      // Subtle PC Hover: slight upward movement only
      cardEl.addEventListener('mouseenter', () => {
        if (!cardEl.classList.contains('selected')) {
          cardEl.style.zIndex = '99';
          cardEl.style.transform = `translateX(${posX}px) translateY(${posY - 14}px) rotate(${angle}deg)`;
        }
      });

      cardEl.addEventListener('mouseleave', () => {
        if (!cardEl.classList.contains('selected')) {
          cardEl.style.zIndex = index + 1;
          cardEl.style.transform = `translateX(${posX}px) translateY(${posY}px) rotate(${angle}deg)`;
        }
      });

      // Click selection
      const handleSelect = () => onCardSelected(cardEl, cardId);
      cardEl.addEventListener('click', handleSelect);
      cardEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect();
        }
      });

      container.appendChild(cardEl);
    });
  }

  // Mobile 3 Overlapping Rows Spread
  function renderMobileSpread(shuffledIds) {
    const container = document.getElementById('mobile-cards-spread');
    if (!container) return;
    container.innerHTML = '';

    // Split 22 cards into 3 rows: 7 cards, 7 cards, 8 cards
    const rowCounts = [7, 7, 8];
    let cardIdx = 0;

    rowCounts.forEach((countInRow, rowIndex) => {
      const rowEl = document.createElement('div');
      rowEl.className = `mobile-card-row mobile-card-row-${rowIndex + 1}`;

      for (let i = 0; i < countInRow; i++) {
        if (cardIdx >= shuffledIds.length) break;
        const cardId = shuffledIds[cardIdx];
        const currentIdxInTotal = cardIdx;
        cardIdx++;

        const cardEl = document.createElement('div');
        cardEl.className = 'mobile-card-item';
        cardEl.dataset.cardId = cardId;
        cardEl.style.zIndex = i + 1;
        cardEl.setAttribute('role', 'button');
        cardEl.setAttribute('aria-label', `타로 카드 ${currentIdxInTotal + 1}번 선택`);
        cardEl.setAttribute('tabindex', '0');

        cardEl.innerHTML = `
          <div class="card-back-art">
            <div class="card-back-border"></div>
            <div class="card-back-inner-border"></div>
            <div class="card-back-center-crest">
              <div class="card-back-symbol" style="font-size: 24px;">✦</div>
            </div>
          </div>
        `;

        const handleSelect = () => onCardSelected(cardEl, cardId);
        cardEl.addEventListener('click', handleSelect);
        cardEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelect();
          }
        });

        rowEl.appendChild(cardEl);
      }

      container.appendChild(rowEl);
    });
  }

  let isSelected = false;

  function onCardSelected(cardElement, cardId) {
    if (isSelected) return;
    isSelected = true;

    // Trigger mystical sounds
    window.MysticalAudio?.playCardFlip();
    setTimeout(() => {
      window.MysticalAudio?.playMysticChime();
    }, 200);

    // Visual feedback on card
    cardElement.classList.add('selected');

    // Show mystical loading modal
    const modal = document.getElementById('reading-loading-modal');
    if (modal) {
      modal.classList.add('active');
    }

    // Gentle mystical transition delay (~2.0s for an authentic, immersive reading experience)
    setTimeout(() => {
      if (window.MysticalRouter) {
        window.MysticalRouter.navigate(`card.html?number=${cardId}`);
      } else {
        window.location.href = `card.html?number=${cardId}`;
      }
    }, 2000);
  }

  function initCardsPage() {
    isSelected = false;
    const modal = document.getElementById('reading-loading-modal');
    if (modal) {
      modal.classList.remove('active');
    }

    const desktopFan = document.getElementById('desktop-deck-fan');
    const mobileSpread = document.getElementById('mobile-cards-spread');
    if (desktopFan) desktopFan.innerHTML = '';
    if (mobileSpread) mobileSpread.innerHTML = '';

    // Generate original fixed IDs 0..21
    const cardIds = Array.from({ length: TOTAL_CARDS }, (_, i) => i);
    // Shuffle display order
    const shuffledIds = shuffle(cardIds);

    renderDesktopFan(shuffledIds);
    renderMobileSpread(shuffledIds);
  }

  window.initCardsPage = initCardsPage;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCardsPage);
  } else {
    initCardsPage();
  }
})();
