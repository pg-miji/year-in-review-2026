// ===================================================================
// 시간 조각 상점 - Tarot Reading Result & Souvenir Generator
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
        reading: "새로운 환경이나 낯선 경험을 마주할 기회가 찾아옵니다.\n\n익숙한 방식에서 벗어나면서 예상하지 못했던 즐거움을 발견하거나, 가벼운 호기심으로 시작한 일이 새로운 가능성으로 이어질 수 있습니다.",
        advice: "시작하기도 전에 결과부터 걱정하며 가능성을 닫아두지 마세요. 관심이 생긴 일이 있다면 작은 규모로라도 직접 경험해 보세요.",
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

  // Multi-line text measurement & wrapper for Canvas supporting paragraph newlines
  function measureWrappedText(ctx, text, maxWidth, lineHeight, font) {
    if (font) ctx.font = font;
    const paragraphs = text.split('\n');
    const linesToDraw = [];
    let totalHeight = 0;

    for (let p = 0; p < paragraphs.length; p++) {
      const para = paragraphs[p].trim();
      if (!para) {
        const gap = lineHeight * 0.4;
        linesToDraw.push({ text: '', isBreak: true, height: gap });
        totalHeight += gap;
        continue;
      }
      const words = para.split(' ');
      let line = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          linesToDraw.push({ text: line.trim(), isBreak: false, height: lineHeight });
          totalHeight += lineHeight;
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      if (line.trim()) {
        linesToDraw.push({ text: line.trim(), isBreak: false, height: lineHeight });
        totalHeight += lineHeight;
      }
      if (p < paragraphs.length - 1) {
        const gap = lineHeight * 0.35;
        linesToDraw.push({ text: '', isBreak: true, height: gap });
        totalHeight += gap;
      }
    }
    return { totalHeight, linesToDraw };
  }

  function renderMeasuredLines(ctx, linesToDraw, x, startY, align = 'center') {
    ctx.textAlign = align;
    let currentY = startY;
    for (const item of linesToDraw) {
      if (!item.isBreak && item.text) {
        ctx.fillText(item.text, x, currentY);
      }
      currentY += item.height;
    }
    return currentY;
  }

  // Generate Souvenir Canvas Image (Instagram Feed Portrait 4:5: 1080 x 1350)
  // Large typography, generous breathing room, dynamic content heights, pure tarot aesthetic
  async function generateSouvenirCanvas() {
    const card = currentCard;
    const width = 1080;
    const height = 1350; // 4:5 Aspect Ratio

    const cleanReading = (card.reading || '').trim().replace(/\s+$/, '');
    const cleanAdvice = (card.advice || '').trim().replace(/\s+$/, '');

    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {}
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. Deep Space Velvet Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#090514');
    bgGrad.addColorStop(0.3, '#160d28');
    bgGrad.addColorStop(0.7, '#110820');
    bgGrad.addColorStop(1, '#070310');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Celestial stardust stars
    ctx.fillStyle = 'rgba(243, 207, 122, 0.45)';
    const starCoords = [
      [75, 75], [1005, 85], [110, 240], [970, 280],
      [85, 660], [995, 700], [95, 1060], [985, 1100],
      [130, 1270], [950, 1280]
    ];
    starCoords.forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Vintage Royal Double Border
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(26, 26, width - 52, height - 52);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(36, 36, width - 72, height - 72);
    ctx.setLineDash([]);

    // 4 Corner Stars
    ctx.fillStyle = '#d4af37';
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', 50, 50);
    ctx.fillText('✦', width - 50, 50);
    ctx.fillText('✦', 50, height - 50);
    ctx.fillText('✦', width - 50, height - 50);

    // ==========================================
    // [요소별 크기 및 정밀 간격 세팅]
    // ==========================================
    const majorH = 26;
    const titleH = 48;
    const imgH   = 510;
    const imgW   = 336;
    const pillH  = 46;

    // 운세 리딩 텍스트 & 박스 높이
    const readingMeasure = measureWrappedText(
      ctx,
      cleanReading,
      880,
      40,
      '500 27px "Gowun Batang", "Noto Serif KR", serif'
    );
    const readingBoxH = 26 + readingMeasure.totalHeight + 26;

    // 타로 조언 텍스트 & 박스 높이
    const adviceText = `"${cleanAdvice}"`;
    const adviceMeasure = measureWrappedText(
      ctx,
      adviceText,
      880,
      42,
      '600 26px "Gowun Batang", "Pretendard", serif'
    );
    const advTitleH         = 28;
    const advTitleToTextGap = 56; 
    const totalAdvContentH  = advTitleH + advTitleToTextGap + adviceMeasure.totalHeight;
    const advBoxPadding     = 8;
    const advBoxH = totalAdvContentH + advBoxPadding;

    // 요소 사이 간격 수치 조정
    const gapMajorToTitle = 14;   
    const gapTitleToImg   = 28;     
    const gapImgToKw      = 42;        
    const gapKwToReading  = 42;    
    const gapReadingToAdv = -15;

    // 전체 콘텐츠 총 세로 높이 계산
    const totalContentHeight = 
      majorH + gapMajorToTitle + 
      titleH + gapTitleToImg + 
      imgH + gapImgToKw + 
      pillH + gapKwToReading + 
      readingBoxH + gapReadingToAdv + 
      advBoxH;

    // 캔버스 세로 중앙 배치를 위한 시작 Y 좌표
    const startY = Math.floor((height - totalContentHeight) / 2);

    // Y축 절대 좌표 산출
    const majorY = startY + majorH / 2;
    const titleY = startY + majorH + gapMajorToTitle + titleH / 2;
    const imgY = startY + majorH + gapMajorToTitle + titleH + gapTitleToImg;
    const kwY = imgY + imgH + gapImgToKw;
    const readingBoxY = kwY + pillH + gapKwToReading;
    const advBoxY = readingBoxY + readingBoxH + gapReadingToAdv;

    const imgX = (width - imgW) / 2;

    // 3. Header Section
    ctx.textBaseline = 'middle';
    
    ctx.fillStyle  = '#e8c868';
    ctx.font      = '700 24px "Cinzel", serif, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`✦ MAJOR ARCANA · NO. ${card.roman} ✦`, width / 2, majorY);

    ctx.fillStyle = '#ffffff';
    ctx.font     = 'bold 46px "Cinzel", "Playfair Display", serif';
    ctx.fillText((card.name || '').toUpperCase(), width / 2, titleY);

    // 4. Centerpiece Tarot Card Artwork (510px)
    const cardArtSrc = `../assets/images/tarot/${card.id}.png`;
    const cardArtImg = await loadImage(cardArtSrc);

    if (cardArtImg) {
      ctx.save();
      ctx.shadowColor   = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur    = 24;
      ctx.shadowOffsetY = 8;
      ctx.drawImage(cardArtImg, imgX, imgY, imgW, imgH);
      ctx.restore();
    }

    // 5. Keywords Badges
    const keywords = card.keywords || [];
    const kwGap = 16;
    ctx.font = 'bold 26px "Gowun Batang", "Pretendard", serif, sans-serif';
    ctx.textBaseline = 'alphabetic';

    const kwWidths = keywords.map(kw => ctx.measureText(`# ${kw}`).width + 48);
    const totalKwWidth = kwWidths.reduce((a, b) => a + b, 0) + kwGap * (keywords.length - 1);
    let startKwX = (width - totalKwWidth) / 2;

    keywords.forEach((kw, i) => {
      const pW = kwWidths[i];
      ctx.save();
      ctx.shadowColor   = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur    = 10;
      ctx.shadowOffsetY = 3;

      ctx.fillStyle = 'rgba(36, 20, 56, 0.96)';
      ctx.beginPath();
      ctx.roundRect(startKwX, kwY, pW, pillH, 24);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = 'rgba(212, 175, 55, 0.22)';
      ctx.beginPath();
      ctx.roundRect(startKwX, kwY, pW, pillH, 24);
      ctx.fill();

      ctx.strokeStyle = '#f3cf7a';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle     = '#fff6d6';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`# ${kw}`, startKwX + pW / 2, kwY + 32);

      startKwX += pW + kwGap;
    });

    // 6. Reading Body Glass Container Box
    const readingBoxX = 52;
    const readingBoxW = width - readingBoxX * 2;

    ctx.fillStyle = 'rgba(20, 12, 34, 0.94)';
    ctx.beginPath();
    ctx.roundRect(readingBoxX, readingBoxY, readingBoxW, readingBoxH, 18);
    ctx.fill();

    // Reading Body Prose
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 27px "Gowun Batang", "Noto Serif KR", serif';
    renderMeasuredLines(ctx, cleanReading ? readingMeasure.linesToDraw : [], width / 2, readingBoxY + 24, 'center');

    // 7. Advice Card Box
    const advBoxX = 52;
    const advBoxW = readingBoxW;

    const advGrad = ctx.createLinearGradient(advBoxX, advBoxY, advBoxX, advBoxY + advBoxH);
    advGrad.addColorStop(0, 'rgba(44, 28, 66, 0.96)');
    advGrad.addColorStop(1, 'rgba(28, 16, 44, 0.98)');
    ctx.fillStyle = advGrad;
    ctx.beginPath();
    ctx.roundRect(advBoxX, advBoxY, advBoxW, advBoxH, 16);
    ctx.fill();

    ctx.strokeStyle = 'rgba(243, 207, 122, 0.8)';
    ctx.lineWidth   = 1.8;
    ctx.stroke();

    // Advice Header Title & Quote
    const advContentStartY = advBoxY + (advBoxH - totalAdvContentH) / 2 + 4;
    const advTitleY = advContentStartY + advTitleH;

    ctx.fillStyle     = '#f3cf7a';
    ctx.font         = '700 26px "Gowun Batang", "Cinzel", serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText("✦  NEW YEAR'S ADVICE ✦", width / 2, advTitleY);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 130, advTitleY + 12);
    ctx.lineTo(width / 2 + 130, advTitleY + 12);
    ctx.stroke();

    const adviceStartY = advTitleY + advTitleToTextGap;
    ctx.fillStyle = '#ffeaa7';
    ctx.font = '600 26px "Gowun Batang", "Pretendard", serif';
    renderMeasuredLines(ctx, cleanAdvice ? adviceMeasure.linesToDraw : [], width / 2, adviceStartY, 'center');

    return canvas;
  }

  // Trigger download / preview
  async function handleSaveSouvenir() {
    const saveBtn = document.getElementById('btn-save-souvenir');
    const originalHtml = '<span class="btn-icon">📥</span><span>카드 이미지 저장</span>';

    try {
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="btn-icon">⏳</span><span>기념 카드 생성 중...</span>';
      }

      const canvas = await generateSouvenirCanvas();
      const dataUrl = canvas.toDataURL('image/png');
      const filename = `new_year_tarot_${currentCard.name.toLowerCase().replace(/\s+/g, '_')}.png`;

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        // Show in clean overlay modal with easy long-press save instructions
        const modal = document.getElementById('preview-modal');
        const modalImg = document.getElementById('modal-preview-img');
        if (modal && modalImg) {
          modalImg.src = dataUrl;
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

    // Save button event (Download 4:5 image)
    const saveBtn = document.getElementById('btn-save-souvenir');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        window.MysticalAudio?.playMysticChime();
        handleSaveSouvenir();
      });
    }

    // Modal close handlers
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
