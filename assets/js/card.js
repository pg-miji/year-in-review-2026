// ===================================================================
// 작은모임연구소의 작은 점술가게 - Tarot Reading Result & Souvenir Generator
// ===================================================================

(function () {
  let currentCard = null;
  let currentCardIndex = 0;

  function getCardData() {
    const params = new URLSearchParams(window.location.search);
    let cardNum = parseInt(params.get('number') || params.get('id') || '0', 10);
    if (isNaN(cardNum) || cardNum < 0 || cardNum > 21) {
      cardNum = 0;
    }
    currentCardIndex = cardNum;

    const cards = window.tarotCards || window.tarotData || [];
    if (cards && cards[cardNum]) {
      currentCard = cards[cardNum];
    } else {
      currentCard = {
        id: 0,
        number: "0",
        roman: "0",
        name: "The Fool",
        koreanName: "바보",
        keywords: ["새로운 출발", "순수한 용기", "뜻밖의 행운"],
        reading: "완벽하게 준비되지 않았다고 해서 멈춰있을 필요는 없습니다. 새해에는 계산을 내려놓고 가벼운 마음으로 미지의 길에 발을 디디게 되는데, 그 엉뚱하고 대담한 무모함이 오히려 생각지도 못한 행운의 문을 열어젖힐 거예요.",
        advice: "지나친 염려는 잠시 내려두세요. 첫걸음을 떼는 그 자체만으로도 이미 반은 성공한 셈입니다.",
        image: "../assets/images/tarot/0.png"
      };
    }
    return currentCard;
  }

  function renderCardUI(card) {
    // Roman Numeral / Arcana Badge
    const romanEl = document.getElementById('card-roman');
    if (romanEl) {
      romanEl.textContent = `✦ MAJOR ARCANA · NO. ${card.roman} ✦`;
    }

    // English Name
    const nameEnEl = document.getElementById('card-name-en');
    if (nameEnEl) nameEnEl.textContent = card.name.toUpperCase();

    // Korean Name
    const nameKoEl = document.getElementById('card-name-ko');
    if (nameKoEl) nameKoEl.textContent = card.koreanName;

    // Image
    const imgEl = document.getElementById('card-image');
    if (imgEl) {
      imgEl.src = `../assets/images/tarot/${card.id}.png`;
      imgEl.alt = `${card.name} (${card.koreanName}) 타로 카드`;
    }

    // Keywords
    const keywordsContainer = document.getElementById('card-keywords');
    if (keywordsContainer && card.keywords) {
      keywordsContainer.innerHTML = card.keywords
        .map(kw => `<span class="keyword-badge">${kw}</span>`)
        .join('');
    }

    // Reading text with clean paragraph line breaks
    const readingEl = document.getElementById('card-reading-text');
    if (readingEl) {
      const paragraphs = card.reading.split('\n\n');
      readingEl.innerHTML = paragraphs
        .map(p => `<p class="reading-para">${p.trim()}</p>`)
        .join('');
    }

    // Advice text
    const adviceEl = document.getElementById('card-advice-text');
    if (adviceEl) adviceEl.textContent = card.advice;

    // Smoothly reveal reading card without flash
    const readingCard = document.getElementById('reading-card');
    if (readingCard) {
      readingCard.style.opacity = '1';
    }
  }

  // Load image helper returning a Promise
  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  // Multi-line text wrapper for Canvas supporting paragraph newlines
  function wrapText(ctx, text, x, y, maxWidth, lineHeight, align = 'center') {
    ctx.textAlign = align;
    const paragraphs = text.split('\n');
    let currentY = y;

    for (let p = 0; p < paragraphs.length; p++) {
      const para = paragraphs[p].trim();
      if (!para) {
        currentY += lineHeight * 0.5;
        continue;
      }
      const words = para.split(' ');
      let line = '';

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line.trim(), x, currentY);
          line = words[n] + ' ';
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      if (line.trim()) {
        ctx.fillText(line.trim(), x, currentY);
        currentY += lineHeight;
      }
    }
    return currentY;
  }

  // Generate Souvenir Canvas Image
  async function generateSouvenirCanvas() {
    const card = currentCard;
    const width = 800;

    // Temporary measure canvas to calculate exact text heights
    const measureCanvas = document.createElement('canvas');
    const mCtx = measureCanvas.getContext('2d');

    // 1. Measure Reading Text Height with paragraph formatting
    mCtx.font = '400 16.5px "Gowun Batang", "Noto Serif KR", serif';
    const readingParagraphs = card.reading.split('\n');
    let rLines = 0;
    for (let p = 0; p < readingParagraphs.length; p++) {
      const para = readingParagraphs[p].trim();
      if (!para) {
        rLines += 0.5;
        continue;
      }
      const words = para.split(' ');
      let rCurLine = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = rCurLine + words[n] + ' ';
        if (mCtx.measureText(testLine).width > 620 && n > 0) {
          rLines++;
          rCurLine = words[n] + ' ';
        } else {
          rCurLine = testLine;
        }
      }
      if (rCurLine.trim()) rLines++;
    }
    const readingLineHeight = 28;
    const readingTotalHeight = rLines * readingLineHeight;

    // 2. Measure Advice Text Height
    mCtx.font = '600 15.5px "Gowun Batang", serif';
    const adviceWords = card.advice.split(' ');
    let aLines = 1;
    let aCurLine = '';
    for (let n = 0; n < adviceWords.length; n++) {
      const testLine = aCurLine + adviceWords[n] + ' ';
      if (mCtx.measureText(testLine).width > 580 && n > 0) {
        aLines++;
        aCurLine = adviceWords[n] + ' ';
      } else {
        aCurLine = testLine;
      }
    }
    const adviceLineHeight = 26;
    const adviceTextHeight = (aLines - 1) * adviceLineHeight;
    const adviceBoxH = 68 + adviceTextHeight + 22;

    // Y coordinates with refined margin between reading and advice
    const readingStartY = 645;
    const readingEndY = readingStartY + readingTotalHeight;
    const adviceBoxY = readingEndY + 22;
    const adviceBoxBottom = adviceBoxY + adviceBoxH;

    // Canvas dynamic height without blank empty space
    const height = Math.round(adviceBoxBottom + 64);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. Background Velvet Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#100a1e');
    bgGrad.addColorStop(0.4, '#1b112c');
    bgGrad.addColorStop(1, '#0c0716');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle star dots
    ctx.fillStyle = 'rgba(243, 207, 122, 0.45)';
    const starCoords = [
      [60, 80], [740, 120], [120, 300], [680, 420],
      [90, 600], [720, 680], [80, Math.min(height - 120, 850)], [710, Math.min(height - 100, 890)]
    ];
    starCoords.forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Vintage Double Border (Clean, No brackets)
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(26, 26, width - 52, height - 52);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(36, 36, width - 72, height - 72);
    ctx.setLineDash([]);

    // 3. Header: LOGO ONLY
    const logoSrc = '../assets/images/colorful_logo.svg';
    const logoImg = await loadImage(logoSrc);
    if (logoImg) {
      const logoSize = 48;
      ctx.drawImage(logoImg, width / 2 - logoSize / 2, 50, logoSize, logoSize);
    }

    // Divider Line with Star
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 90, 114);
    ctx.lineTo(width / 2 + 90, 114);
    ctx.stroke();

    ctx.fillStyle = '#d4af37';
    ctx.font = '13px serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦ ✧ ✦', width / 2, 118);

    // 4. Card Roman Numeral & English Name
    ctx.fillStyle = '#f3cf7a';
    ctx.font = '600 14px "Cinzel", serif, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`MAJOR ARCANA · NO. ${card.roman}`, width / 2, 146);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 33px "Cinzel", "Playfair Display", serif';
    ctx.fillText(card.name.toUpperCase(), width / 2, 186);

    // 5. Card Image Artwork
    const cardArtSrc = `../assets/images/tarot/${card.id}.png`;
    const cardArtImg = await loadImage(cardArtSrc);

    const imgW = 190;
    const imgH = 330;
    const imgX = (width - imgW) / 2;
    const imgY = 210;

    // Image Gold Frame & Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#140c22';
    ctx.fillRect(imgX, imgY, imgW, imgH);
    ctx.restore();

    if (cardArtImg) {
      ctx.drawImage(cardArtImg, imgX, imgY, imgW, imgH);
    }

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.strokeRect(imgX, imgY, imgW, imgH);

    // 6. Keywords Pill Badges
    const kwY = 570;
    const keywords = card.keywords || [];
    const kwGap = 12;
    const pillH = 30;
    ctx.font = 'bold 14.5px "Gowun Batang", serif, sans-serif';

    // Measure total width of keyword pills
    const kwWidths = keywords.map(kw => ctx.measureText(kw).width + 26);
    const totalKwWidth = kwWidths.reduce((a, b) => a + b, 0) + kwGap * (keywords.length - 1);
    let startKwX = (width - totalKwWidth) / 2;

    keywords.forEach((kw, i) => {
      const pW = kwWidths[i];
      // Pill background
      ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
      ctx.beginPath();
      ctx.roundRect(startKwX, kwY, pW, pillH, 15);
      ctx.fill();

      // Pill border
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pill text
      ctx.fillStyle = '#f3cf7a';
      ctx.textAlign = 'center';
      ctx.fillText(kw, startKwX + pW / 2, kwY + 20);

      startKwX += pW + kwGap;
    });

    // 7. Reading Body Prose
    ctx.fillStyle = '#fdf8ee';
    ctx.font = '400 16.5px "Gowun Batang", "Noto Serif KR", serif';
    wrapText(ctx, card.reading, width / 2, readingStartY, 620, readingLineHeight, 'center');

    // 8. Advice Box
    const adviceBoxW = 640;
    const adviceBoxX = (width - adviceBoxW) / 2;

    ctx.fillStyle = 'rgba(35, 22, 50, 0.85)';
    ctx.beginPath();
    ctx.roundRect(adviceBoxX, adviceBoxY, adviceBoxW, adviceBoxH, 12);
    ctx.fill();

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Advice Tag
    ctx.fillStyle = '#f3cf7a';
    ctx.font = '600 12.5px "Cinzel", serif, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✧ NEW YEAR\'S ADVICE ✧', width / 2, adviceBoxY + 30);

    // Advice Content Text
    ctx.fillStyle = '#fff4dc';
    ctx.font = '600 15.5px "Gowun Batang", serif';
    wrapText(ctx, card.advice, width / 2, adviceBoxY + 60, 580, adviceLineHeight, 'center');

    // 9. Footer: ONLY "작은모임연구소" (Seamlessly positioned right under advice box)
    ctx.fillStyle = '#c9bfaf';
    ctx.font = '13.5px "Gowun Batang", serif, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('작은모임연구소', width / 2, height - 38);

    return canvas;
  }

  // Trigger download / preview
  async function handleSaveSouvenir() {
    const saveBtn = document.getElementById('btn-save-souvenir');
    const originalHtml = '<span class="btn-icon">📥</span><span>결과 카드 이미지 저장</span>';

    try {
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="btn-icon">⏳</span><span>기념 카드 생성 중...</span>';
      }

      const canvas = await generateSouvenirCanvas();
      const dataUrl = canvas.toDataURL('image/png');
      const filename = `small_gathering_tarot_${currentCard.name.toLowerCase().replace(/\s+/g, '_')}.png`;

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        // Show in clean overlay modal with easy save instructions & download button
        const modal = document.getElementById('preview-modal');
        const modalImg = document.getElementById('modal-preview-img');
        const modalDownloadBtn = document.getElementById('modal-download-btn');
        if (modal && modalImg) {
          modalImg.src = dataUrl;
          if (modalDownloadBtn) {
            modalDownloadBtn.href = dataUrl;
            modalDownloadBtn.download = filename;
          }
          modal.classList.add('active');
        }
      } else {
        // Desktop direct download trigger
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Error generating tarot image:', err);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalHtml;
      }
    }
  }

  function initCardPage() {
    const card = getCardData();
    renderCardUI(card);

    // Play subtle mystical chime on reading reveal
    setTimeout(() => {
      window.MysticalAudio?.playMysticChime();
    }, 250);

    // Save button event
    const saveBtn = document.getElementById('btn-save-souvenir');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        window.MysticalAudio?.playMysticChime();
        handleSaveSouvenir();
      });
    }

    // Modal close
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modal = document.getElementById('preview-modal');
    if (modalCloseBtn && modal) {
      modalCloseBtn.addEventListener('click', () => {
        modal.classList.remove('active');
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    }
  }

  window.initCardPage = initCardPage;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCardPage);
  } else {
    initCardPage();
  }
})();
