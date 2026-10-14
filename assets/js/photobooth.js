// ===================================================================
// 시간의 방 - Photo Booth Logic Engine
// ===================================================================

(function () {
  'use strict';

  let currentFrameId = null;
  let currentFrameData = null;
  let activeSlotIndex = 0;
  let capturedSlots = []; // array of { slot, dataUrl, canvas }
  let mediaStream = null;
  let currentFacingMode = 'user';
  let activeFilter = 'blurry'; // 'blurry' | 'ccd' | 'mono'
  let isCountingDown = false;
  let isCapturing = false;
  let countdownIntervalId = null;
  let isPhotoboothInitialized = false;
  let finalResultDataUrl = null;
  let simulatedCanvasAnimId = null;
  let sharedVideoEl = null;
  let simulatedCanvas = null;

  // Early global registration so user or test runner clicks never fail
  window._realSelectFrame = function (frameId) {
    selectFrame(frameId);
  };
  window.selectPhotoboothFrame = window._realSelectFrame;

  // Refined sound effects generator using Web Audio API
  const PhotoAudio = {
    ctx: null,
    getCtx: function () {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.ctx = new AudioContext();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    },
    playCountdownTick: function (count) {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const freq = count === 1 ? 880 : 587.33;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } catch (e) {}
    },
    playShutter: function () {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(800, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.05);
        gain1.gain.setValueAtTime(0.2, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.05);

        setTimeout(() => {
          if (!this.ctx) return;
          const osc2 = this.ctx.createOscillator();
          const gain2 = this.ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(500, this.ctx.currentTime);
          osc2.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);
          gain2.gain.setValueAtTime(0.15, this.ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
          osc2.connect(gain2);
          gain2.connect(this.ctx.destination);
          osc2.start();
          osc2.stop(this.ctx.currentTime + 0.08);
        }, 60);
      } catch (e) {}
    },
    playPrintSoftPop: function () {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } catch (e) {}
    },
    playCompleteFanfare: function () {
      const ctx = this.getCtx();
      if (!ctx) return;
      try {
        const notes = [523.25, 659.25, 783.99, 987.77, 1046.50];
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.85);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.85);
          }, idx * 100);
        });
      } catch (e) {}
    }
  };

  // ----------------------------------------------------
  // Initialization & View Routing
  // ----------------------------------------------------
  function initPhotobooth() {
    if (isPhotoboothInitialized) return;
    isPhotoboothInitialized = true;

    setupFrameSelection();
    setupCameraControls();
    setupResultActions();
    showStage('select');

    // Process any frame selection that was triggered before script finished loading
    if (window._pendingFrameSelection) {
      const pending = window._pendingFrameSelection;
      window._pendingFrameSelection = null;
      selectFrame(pending);
    }
  }

  function showStage(stageName) {
    const selectStage = document.getElementById('stage-frame-select');
    const boothStage = document.getElementById('stage-camera-booth');
    const resultStage = document.getElementById('stage-final-result');

    if (selectStage) selectStage.style.display = stageName === 'select' ? 'block' : 'none';
    if (boothStage) boothStage.style.display = stageName === 'booth' ? 'flex' : 'none';
    if (resultStage) resultStage.style.display = stageName === 'result' ? 'flex' : 'none';

    document.body.setAttribute('data-stage', stageName);
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.setAttribute('data-stage', stageName);
    }

    try {
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }

  // ----------------------------------------------------
  // 1. Frame Selection Setup
  // ----------------------------------------------------
  let isSelectingFrame = false;

  function setupFrameSelection() {
    const grid = document.querySelector('.frame-card-grid');
    if (!grid) return;

    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.frame-pick-card');
      if (card) {
        e.preventDefault();
        const frameId = card.getAttribute('data-frame-id') || '2026';
        selectFrame(frameId);
      }
    });

    const frameCards = grid.querySelectorAll('.frame-pick-card');
    frameCards.forEach((card) => {
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const frameId = card.getAttribute('data-frame-id') || '2026';
          selectFrame(frameId);
        }
      });
    });
  }

  function selectFrame(frameId) {
    if (isSelectingFrame) return;
    isSelectingFrame = true;

    const frames = window.PHOTOBOOTH_FRAMES || {};
    const selected = frames[String(frameId)] || frames[frameId] || frames['2026'];
    if (!selected) {
      console.error('Frame definition not available for:', frameId);
      isSelectingFrame = false;
      return;
    }

    currentFrameId = String(frameId);
    currentFrameData = selected;
    resetBoothState();

    // Default filter per frame (1: BLURRY, 2: CCD, 3: MONO)
    if (currentFrameId === '2026') {
      activeFilter = 'blurry';
    } else if (currentFrameId === '2027') {
      activeFilter = 'ccd';
    } else if (currentFrameId === 'self') {
      activeFilter = 'mono';
    } else {
      activeFilter = 'blurry';
    }

    updateFilterUI();

    try {
      window.MysticalAudio?.playCardFlip();
    } catch (e) {}

    startBoothStage();
    applyFilterToVideo();

    setTimeout(() => {
      isSelectingFrame = false;
    }, 400);
  }

  function resetBoothState() {
    activeSlotIndex = 0;
    capturedSlots = [];
    isCountingDown = false;
    isCapturing = false;
    if (countdownIntervalId) {
      clearInterval(countdownIntervalId);
      countdownIntervalId = null;
    }
    const overlay = document.getElementById('countdown-overlay');
    if (overlay) {
      overlay.innerHTML = '';
      overlay.classList.remove('active');
    }
    const shutterInit = document.getElementById('btn-take-photo');
    if (shutterInit) {
      shutterInit.disabled = false;
      shutterInit.classList.remove('disabled');
      shutterInit.style.opacity = '1';
      shutterInit.style.pointerEvents = 'auto';
    }
  }

  // ----------------------------------------------------
  // 2. Camera Booth Stage Setup
  // ----------------------------------------------------
  function startBoothStage() {
    showStage('booth');
    resetBoothState();
    setupFrameBoard();
    updateProgressUI();
    applyFilterToVideo();
    
    initCamera().catch((err) => {
      console.warn('initCamera error handling:', err);
    });
  }

  function setupFrameBoard() {
    const board = document.getElementById('booth-frame-board');
    if (!board || !currentFrameData) return;

    board.innerHTML = '';

    // 1. Slots Layer (Behind Frame Overlay, z-index: 2)
    const slotsLayer = document.createElement('div');
    slotsLayer.className = 'booth-slots-layer';
    slotsLayer.style.position = 'absolute';
    slotsLayer.style.inset = '0';
    slotsLayer.style.zIndex = '2';
    board.appendChild(slotsLayer);

    // Render Slots based on frame geometry (1200 x 1800)
    currentFrameData.slots.forEach((slot, index) => {
      const slotEl = document.createElement('div');
      slotEl.id = `booth-slot-${index}`;
      slotEl.className = 'booth-slot';
      if (index === activeSlotIndex) {
        slotEl.classList.add('active-slot');
      }

      // Proportional placement in %
      const leftPct = (slot.x / currentFrameData.width) * 100;
      const topPct = (slot.y / currentFrameData.height) * 100;
      const widthPct = (slot.width / currentFrameData.width) * 100;
      const heightPct = (slot.height / currentFrameData.height) * 100;

      slotEl.style.position = 'absolute';
      slotEl.style.left = `${leftPct}%`;
      slotEl.style.top = `${topPct}%`;
      slotEl.style.width = `${widthPct}%`;
      slotEl.style.height = `${heightPct}%`;
      slotEl.style.overflow = 'hidden';
      slotEl.style.backgroundColor = '#0a0a0a';
      slotEl.style.display = 'flex';
      slotEl.style.alignItems = 'center';
      slotEl.style.justifyContent = 'center';

      // If already captured, restore image
      if (capturedSlots[index] && capturedSlots[index].dataUrl) {
        const img = document.createElement('img');
        img.className = 'booth-slot-captured-img';
        img.src = capturedSlots[index].dataUrl;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        slotEl.appendChild(img);
      } else if (index !== activeSlotIndex) {
        const ph = document.createElement('div');
        ph.className = 'booth-slot-placeholder';
        ph.textContent = `${index + 1}번째 컷`;
        slotEl.appendChild(ph);
      }

      slotsLayer.appendChild(slotEl);
    });

    // 2. Frame PNG Transparent Overlay on TOP (z-index: 10, keeps overlapping stickers, bubbles, window bars intact!)
    const frameOverlay = document.createElement('img');
    frameOverlay.className = 'frame-background-svg';
    frameOverlay.src = currentFrameData.overlaySrc || `../assets/images/photo_booth/${currentFrameId}_overlay.png`;
    frameOverlay.alt = currentFrameData.title;
    frameOverlay.style.position = 'absolute';
    frameOverlay.style.inset = '0';
    frameOverlay.style.width = '100%';
    frameOverlay.style.height = '100%';
    frameOverlay.style.zIndex = '10';
    frameOverlay.style.pointerEvents = 'none';
    board.appendChild(frameOverlay);

    // Attach Video Element to the active slot
    attachVideoToSlot(activeSlotIndex);
  }

  function getOrCreateVideoElement() {
    if (!sharedVideoEl) {
      sharedVideoEl = document.createElement('video');
      sharedVideoEl.id = 'booth-live-video';
      sharedVideoEl.className = 'booth-video-stream';
      sharedVideoEl.autoplay = true;
      sharedVideoEl.playsInline = true;
      sharedVideoEl.setAttribute('playsinline', '');
      sharedVideoEl.setAttribute('webkit-playsinline', '');
      sharedVideoEl.muted = true;
      sharedVideoEl.style.width = '100%';
      sharedVideoEl.style.height = '100%';
      sharedVideoEl.style.objectFit = 'cover';
      sharedVideoEl.style.display = 'block';
    }
    return sharedVideoEl;
  }

  function attachVideoToSlot(slotIndex) {
    const video = getOrCreateVideoElement();

    // Update active state on all slots
    const allSlots = document.querySelectorAll('.booth-slot');
    allSlots.forEach((s, idx) => {
      s.classList.toggle('active-slot', idx === slotIndex);
      if (idx !== slotIndex && !capturedSlots[idx]) {
        if (!s.querySelector('.booth-slot-placeholder') && !s.querySelector('.booth-slot-captured-img')) {
          s.innerHTML = '';
          const ph = document.createElement('div');
          ph.className = 'booth-slot-placeholder';
          ph.textContent = `${idx + 1}번째 컷`;
          s.appendChild(ph);
        }
      }
    });

    const targetSlot = document.getElementById(`booth-slot-${slotIndex}`);
    if (targetSlot) {
      // Clear target slot placeholder or old children
      targetSlot.innerHTML = '';

      // Append persistent video element
      targetSlot.appendChild(video);

      // Re-attach countdown overlay inside active slot
      let overlay = document.getElementById('countdown-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'countdown-overlay';
        overlay.className = 'countdown-overlay';
      }
      targetSlot.appendChild(overlay);

      applyFilterToVideo();

      // Ensure stream connection and playback
      if (mediaStream && video.srcObject !== mediaStream) {
        video.srcObject = mediaStream;
      }
      if (video.srcObject) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      }
    }
  }

  async function initCamera() {
    const video = getOrCreateVideoElement();

    // If mediaStream is already active with live video tracks, reuse it!
    if (mediaStream && mediaStream.active) {
      const liveTracks = mediaStream.getVideoTracks().filter(t => t.readyState === 'live');
      if (liveTracks.length > 0) {
        if (video.srcObject !== mediaStream) {
          video.srcObject = mediaStream;
        }
        video.classList.toggle('no-mirror', currentFacingMode === 'environment');
        applyFilterToVideo();
        try {
          await video.play();
          return;
        } catch (e) {
          console.warn('Playback of active stream failed, re-acquiring:', e);
        }
      }
    }

    // Stop previous simulation if running
    if (simulatedCanvasAnimId) {
      cancelAnimationFrame(simulatedCanvasAnimId);
      simulatedCanvasAnimId = null;
    }

    // Stop existing stream if any
    if (mediaStream) {
      try {
        mediaStream.getTracks().forEach(track => track.stop());
      } catch (e) {}
      mediaStream = null;
    }

    try {
      video.pause();
    } catch (e) {}
    video.srcObject = null;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser context');
      }

      const constraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 1280 }
        },
        audio: false
      };

      mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = mediaStream;
      video.classList.toggle('no-mirror', currentFacingMode === 'environment');
      applyFilterToVideo();
      await video.play();
    } catch (err) {
      console.warn('Camera access denied or unavailable, activating interactive simulated feed:', err);
      useSimulatedCameraFeed(video);
    }
  }

  function useSimulatedCameraFeed(video) {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 640;
    simulatedCanvas = canvas;
    const ctx = canvas.getContext('2d');

    let t = 0;
    function draw() {
      t += 0.035;
      const grad = ctx.createLinearGradient(0, 0, 640, 640);
      grad.addColorStop(0, '#1c142c');
      grad.addColorStop(0.5, '#2e153b');
      grad.addColorStop(1, '#110c1c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 640);

      // Subtle circular ambient wave
      ctx.beginPath();
      ctx.arc(320, 240, 110 + Math.sin(t * 2) * 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
      ctx.fill();

      // Sparkling Star
      ctx.fillStyle = '#f3cf7a';
      ctx.font = '72px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✨', 320 + Math.sin(t) * 15, 220 + Math.cos(t) * 10);

      // Camera feed guide
      ctx.font = 'bold 22px "Pretendard", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('실시간 프리뷰 모드', 320, 340);

      ctx.font = '15px "Pretendard", sans-serif';
      ctx.fillStyle = '#eeddbf';
      ctx.fillText('📸 셔터를 눌러 촬영을 진행해주세요', 320, 380);

      ctx.font = '13px "Pretendard", sans-serif';
      ctx.fillStyle = 'rgba(212, 175, 55, 0.8)';
      ctx.fillText('(카메라 권한 허용 시 실제 얼굴이 노출됩니다)', 320, 415);

      simulatedCanvasAnimId = requestAnimationFrame(draw);
    }
    draw();

    try {
      if (canvas.captureStream) {
        const stream = canvas.captureStream(30);
        video.srcObject = stream;
        video.play().catch(() => {});
      }
    } catch (e) {
      console.error('Simulated stream capture error:', e);
    }
  }

  function updateFilterUI() {
    const filterOptionsWrap = document.querySelector('.filter-options-wrap');
    if (filterOptionsWrap) {
      filterOptionsWrap.style.display = 'flex';
      const filterBtns = filterOptionsWrap.querySelectorAll('.filter-btn');
      filterBtns.forEach(b => {
        const f = b.getAttribute('data-filter');
        b.classList.toggle('active', f === activeFilter);
      });
    }
  }

  function setupCameraControls() {
    // Shutter button (Sole authoritative photo trigger)
    const shutterBtn = document.getElementById('btn-take-photo');
    if (shutterBtn) {
      shutterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isCountingDown || isCapturing) return;
        startCountdownAndCapture();
      });
    }

    // Global keyboard shortcut for shutter (Space key on PC)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        const boothStage = document.getElementById('stage-camera-booth');
        if (boothStage && boothStage.style.display !== 'none') {
          const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
          if (activeTag !== 'input' && activeTag !== 'textarea') {
            e.preventDefault();
            const shutter = document.getElementById('btn-take-photo');
            if (shutter && !shutter.disabled && !isCountingDown && !isCapturing) {
              startCountdownAndCapture();
            }
          }
        }
      }
    });

    // Timer toggle button (Default OFF per user request)
    const timerBtn = document.getElementById('btn-toggle-timer');
    let timerEnabled = false;
    if (timerBtn) {
      timerBtn.classList.remove('active');
      const textEl = timerBtn.querySelector('.aux-text');
      if (textEl) textEl.textContent = '타이머 OFF';

      timerBtn.addEventListener('click', () => {
        timerEnabled = !timerEnabled;
        timerBtn.classList.toggle('active', timerEnabled);
        const textEl = timerBtn.querySelector('.aux-text');
        if (textEl) textEl.textContent = timerEnabled ? '5초 타이머 ON' : '타이머 OFF';
        try {
          window.MysticalAudio?.playCardFlip();
        } catch (e) {}
      });
    }

    // Switch camera (front / back)
    const switchCamBtn = document.getElementById('btn-switch-camera');
    if (switchCamBtn) {
      switchCamBtn.addEventListener('click', async () => {
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        try {
          window.MysticalAudio?.playCardFlip();
        } catch (e) {}
        await initCamera();
      });
    }

    // Filter Buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        activeFilter = btn.getAttribute('data-filter') || 'blurry';
        updateFilterUI();
        applyFilterToVideo();
        try {
          window.MysticalAudio?.playCardFlip();
        } catch (e) {}
      });
    });

    // Retake previous cut button
    const retakeCutBtn = document.getElementById('btn-retake-cut');
    if (retakeCutBtn) {
      retakeCutBtn.addEventListener('click', () => {
        if (countdownIntervalId) {
          clearInterval(countdownIntervalId);
          countdownIntervalId = null;
        }
        isCountingDown = false;
        isCapturing = false;

        const overlay = document.getElementById('countdown-overlay');
        if (overlay) {
          overlay.innerHTML = '';
          overlay.classList.remove('active');
        }

        const shutter = document.getElementById('btn-take-photo');
        if (shutter) {
          shutter.disabled = false;
          shutter.classList.remove('disabled');
          shutter.style.opacity = '1';
          shutter.style.pointerEvents = 'auto';
        }

        if (activeSlotIndex > 0) {
          activeSlotIndex--;
          capturedSlots.pop();
          setupFrameBoard();
          updateProgressUI();
        }
      });
    }

    // Change Frame button
    const changeFrameBtn = document.getElementById('btn-change-frame');
    if (changeFrameBtn) {
      changeFrameBtn.addEventListener('click', () => {
        resetBoothState();
        showStage('select');
      });
    }

    // Booth Home button
    const boothHomeBtn = document.getElementById('btn-booth-home');
    if (boothHomeBtn) {
      boothHomeBtn.addEventListener('click', () => {
        if (mediaStream) {
          try { mediaStream.getTracks().forEach(t => t.stop()); } catch (e) {}
          mediaStream = null;
        }
        if (simulatedCanvasAnimId) {
          cancelAnimationFrame(simulatedCanvasAnimId);
          simulatedCanvasAnimId = null;
        }
        document.body.removeAttribute('data-stage');
      });
    }
  }

  function applyFilterToVideo() {
    const video = getOrCreateVideoElement();
    if (!video) return;

    if (activeFilter === 'blurry') {
      // 1. BLURRY: Dreamy editorial soft focus, gentle pastel warmth, soft glow highlights
      video.style.filter = 'brightness(1.09) contrast(0.92) saturate(1.05) sepia(0.06)';
    } else if (activeFilter === 'ccd') {
      // 2. CCD: 2000s compact digital camera flash style, punchy contrast, vivid saturation, crisp highlights
      video.style.filter = 'contrast(1.15) saturate(1.22) brightness(1.04) hue-rotate(-2deg)';
    } else if (activeFilter === 'mono') {
      // 3. MONO: Deep contrast photo booth monochrome, rich blacks, preserved highlights
      video.style.filter = 'grayscale(1) contrast(1.45) brightness(0.96)';
    } else {
      video.style.filter = 'brightness(1.09) contrast(0.92) saturate(1.05) sepia(0.06)';
    }
  }

  function startCountdownAndCapture() {
    if (isCountingDown || isCapturing) return;

    const timerBtn = document.getElementById('btn-toggle-timer');
    const isTimerOn = timerBtn && timerBtn.classList.contains('active');

    if (!isTimerOn) {
      captureCurrentSlot();
      return;
    }

    isCountingDown = true;
    const overlay = document.getElementById('countdown-overlay');
    let count = 5;

    if (overlay) {
      overlay.innerHTML = `<div class="countdown-number-badge">${count}</div>`;
      overlay.classList.add('active');
    }
    PhotoAudio.playCountdownTick(count);

    if (countdownIntervalId) {
      clearInterval(countdownIntervalId);
      countdownIntervalId = null;
    }

    countdownIntervalId = setInterval(() => {
      count--;
      if (count > 0) {
        if (overlay) {
          overlay.innerHTML = `<div class="countdown-number-badge">${count}</div>`;
        }
        PhotoAudio.playCountdownTick(count);
      } else {
        clearInterval(countdownIntervalId);
        countdownIntervalId = null;
        if (overlay) {
          overlay.innerHTML = '';
          overlay.classList.remove('active');
        }
        isCountingDown = false;
        captureCurrentSlot();
      }
    }, 1000);
  }

  // ----------------------------------------------------
  // Pixel-level Filter Engine (100% Mobile & Safari Compatible)
  // ----------------------------------------------------
  function applyBlurryFilter(ctx, width, height) {
    // 1. Soft Editorial Glow / Highlight Diffusion Pass
    // Keeps facial contours, eyes, and mouth sharp while creating a soft-focus radiant glow
    try {
      const glowCanvas = document.createElement('canvas');
      glowCanvas.width = width;
      glowCanvas.height = height;
      const gCtx = glowCanvas.getContext('2d');
      gCtx.drawImage(ctx.canvas, 0, 0);

      const smallW = Math.max(1, Math.floor(width / 4));
      const smallH = Math.max(1, Math.floor(height / 4));
      const smallCanvas = document.createElement('canvas');
      smallCanvas.width = smallW;
      smallCanvas.height = smallH;
      const sCtx = smallCanvas.getContext('2d');
      sCtx.drawImage(glowCanvas, 0, 0, smallW, smallH);

      gCtx.clearRect(0, 0, width, height);
      if ('filter' in gCtx) {
        gCtx.filter = 'blur(6px) brightness(1.12)';
        gCtx.drawImage(smallCanvas, 0, 0, width, height);
        gCtx.filter = 'none';
      } else {
        gCtx.drawImage(smallCanvas, 0, 0, width, height);
      }

      ctx.save();
      ctx.globalAlpha = 0.26;
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(glowCanvas, 0, 0);
      ctx.restore();
    } catch (e) {
      console.warn('Blurry glow pass fallback:', e);
    }

    // 2. Pastel Tone Curve & Soft Focus Color Grading
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];

      // Soft contrast reduction (0.92) with lifted shadows for airy, dreamy feel
      // Warm, creamy pastel highlight tint (gentle peach / rosy pastel tone)
      const rSoft = (r - 128) * 0.92 + 128;
      const gSoft = (g - 128) * 0.92 + 128;
      const bSoft = (b - 128) * 0.92 + 128;

      d[i] = Math.min(255, Math.max(0, rSoft * 1.05 + 10));
      d[i + 1] = Math.min(255, Math.max(0, gSoft * 1.03 + 8));
      d[i + 2] = Math.min(255, Math.max(0, bSoft * 1.01 + 10));
    }
    ctx.putImageData(imgData, 0, 0);
  }

  function applyCcdFilter(ctx, width, height) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;

    // Compact digital camera tone curve with punchy S-curve and flash-like highlights
    const ccdLut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      let v = (i - 128) * 1.14 + 128;
      if (i > 160) {
        v += (i - 160) * 0.16; // 2000s flash pop in highlights
      }
      ccdLut[i] = Math.min(255, Math.max(0, Math.round(v)));
    }

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];

      // 1. Enhanced vivid saturation without fluorescence
      const gray = (r * 299 + g * 587 + b * 114) / 1000;
      r = gray + (r - gray) * 1.22;
      g = gray + (g - gray) * 1.18;
      b = gray + (b - gray) * 1.15;

      // 2. Compact digicam tone reproduction (warm vibrant skin tones)
      r = ccdLut[Math.min(255, Math.max(0, Math.round(r)))] + 4;
      g = ccdLut[Math.min(255, Math.max(0, Math.round(g)))] + 2;
      b = ccdLut[Math.min(255, Math.max(0, Math.round(b)))] - 2;

      // 3. Subtle fine digital sensor noise (crisp 2000s sensor grain, keeps face details sharp)
      const noise = (Math.random() - 0.5) * 7.5;
      d[i] = Math.min(255, Math.max(0, Math.round(r + noise)));
      d[i + 1] = Math.min(255, Math.max(0, Math.round(g + noise * 0.9)));
      d[i + 2] = Math.min(255, Math.max(0, Math.round(b + noise)));
    }
    ctx.putImageData(imgData, 0, 0);
  }

  function applyMonoFilter(ctx, width, height) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;

    // Photobooth silver-gelatin monochrome tone curve
    // Deep velvety blacks, sculpted midtones for eye/nose/contour depth, preserved highlights
    const monoLut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      let v;
      if (i < 48) {
        // Deep rich shadow drop
        v = i * 0.65;
      } else if (i < 185) {
        // Sculpted dimensional midtones (high contrast for facial features)
        v = (i - 48) * 1.48 + 31;
      } else {
        // Smooth highlight shoulder to preserve highlight details
        v = 233 + (i - 185) * 0.31;
      }
      monoLut[i] = Math.min(255, Math.max(0, Math.round(v)));
    }

    for (let i = 0; i < d.length; i += 4) {
      // Natural perceptual luminance
      const gray = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
      const baseTone = monoLut[Math.min(255, Math.max(0, Math.round(gray)))];

      // Subtle silver-halide photo booth film grain
      const grain = (Math.random() - 0.5) * 8.5;
      const finalVal = Math.min(255, Math.max(0, Math.round(baseTone + grain)));

      d[i] = finalVal;
      d[i + 1] = finalVal;
      d[i + 2] = finalVal;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  function applyPixelFilter(ctx, width, height, filterType) {
    try {
      if (filterType === 'blurry') {
        applyBlurryFilter(ctx, width, height);
      } else if (filterType === 'ccd') {
        applyCcdFilter(ctx, width, height);
      } else if (filterType === 'mono') {
        applyMonoFilter(ctx, width, height);
      } else {
        applyBlurryFilter(ctx, width, height);
      }
    } catch (err) {
      console.warn('Pixel filter error:', err);
    }
  }

  // ----------------------------------------------------
  // 3. Capturing Photo Slot
  // ----------------------------------------------------
  function captureCurrentSlot() {
    if (isCapturing) return;
    isCapturing = true;

    try {
      const video = getOrCreateVideoElement();
      if (!video || !currentFrameData) {
        isCapturing = false;
        return;
      }

      const shutterBtn = document.getElementById('btn-take-photo');
      if (shutterBtn) {
        shutterBtn.disabled = true;
        shutterBtn.classList.add('disabled');
        shutterBtn.style.opacity = '0.5';
        shutterBtn.style.pointerEvents = 'none';
      }

      // Play Shutter sound & trigger flash
      PhotoAudio.playShutter();
      triggerFlash();

      const currentSlot = currentFrameData.slots[activeSlotIndex];
      if (!currentSlot) {
        isCapturing = false;
        if (shutterBtn) {
          shutterBtn.disabled = false;
          shutterBtn.classList.remove('disabled');
          shutterBtn.style.opacity = '1';
          shutterBtn.style.pointerEvents = 'auto';
        }
        return;
      }
      const targetW = currentSlot.width;
      const targetH = currentSlot.height;

      // Create off-screen canvas for high quality slot photo
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      let sourceForDraw = video;
      let vw = video.videoWidth || 640;
      let vh = video.videoHeight || 480;
      if (simulatedCanvas && (!mediaStream || !video.videoWidth)) {
        sourceForDraw = simulatedCanvas;
        vw = simulatedCanvas.width;
        vh = simulatedCanvas.height;
      }

      // Video aspect crop math (cover style)
      const targetAspect = targetW / targetH;
      const videoAspect = vw / vh;

      let sx, sy, sWidth, sHeight;
      if (videoAspect > targetAspect) {
        sHeight = vh;
        sWidth = vh * targetAspect;
        sx = (vw - sWidth) / 2;
        sy = 0;
      } else {
        sWidth = vw;
        sHeight = vw / targetAspect;
        sx = 0;
        sy = (vh - sHeight) / 2;
      }

      ctx.save();
      // Mirror front camera
      if (currentFacingMode === 'user' && !video.classList.contains('no-mirror')) {
        ctx.translate(targetW, 0);
        ctx.scale(-1, 1);
      }

      // Draw unadulterated camera frame
      ctx.filter = 'none';
      ctx.drawImage(sourceForDraw, sx, sy, sWidth, sHeight, 0, 0, targetW, targetH);
      ctx.restore();

      // Reliably apply color filter directly to canvas pixel buffer
      const filterToApply = activeFilter || 'blurry';
      applyPixelFilter(ctx, targetW, targetH, filterToApply);

      // Store captured photo data URL
      let slotPhotoDataUrl;
      try {
        slotPhotoDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      } catch (e) {
        slotPhotoDataUrl = canvas.toDataURL();
      }

      capturedSlots[activeSlotIndex] = {
        slot: currentSlot,
        dataUrl: slotPhotoDataUrl,
        canvas: canvas
      };

      // Detach video from current slot before setting static image
      if (video.parentElement) {
        video.parentElement.removeChild(video);
      }

      // Set static captured image in current slot element
      const currentSlotEl = document.getElementById(`booth-slot-${activeSlotIndex}`);
      if (currentSlotEl) {
        currentSlotEl.innerHTML = '';
        const img = document.createElement('img');
        img.className = 'booth-slot-captured-img';
        img.src = slotPhotoDataUrl;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        currentSlotEl.appendChild(img);
      }

      // Advance to next slot or complete
      activeSlotIndex++;
      updateProgressUI();

      if (activeSlotIndex < currentFrameData.slots.length) {
        // Immediately move video to the next slot and resume playback
        attachVideoToSlot(activeSlotIndex);

        // Enforce deliberate 1.2s pause between cuts so user sees cut 1 and gets ready for cut 2
        setTimeout(() => {
          isCapturing = false;
          const shutter = document.getElementById('btn-take-photo');
          if (shutter) {
            shutter.disabled = false;
            shutter.classList.remove('disabled');
            shutter.style.opacity = '1';
            shutter.style.pointerEvents = 'auto';
          }
        }, 1200);
      } else {
        // All slots filled! Run print animation and reveal final result
        setTimeout(() => {
          isCapturing = false;
          runPrintAnimationAndComplete();
        }, 400);
      }
    } catch (err) {
      console.error('Fatal capture error:', err);
      isCapturing = false;
      const shutter = document.getElementById('btn-take-photo');
      if (shutter) {
        shutter.disabled = false;
        shutter.classList.remove('disabled');
        shutter.style.opacity = '1';
        shutter.style.pointerEvents = 'auto';
      }
    }
  }

  function triggerFlash() {
    const flash = document.getElementById('camera-flash-overlay');
    if (flash) {
      flash.classList.add('flashing');
      setTimeout(() => {
        flash.classList.remove('flashing');
      }, 100);
    }
  }

  function updateProgressUI() {
    const stepText = document.getElementById('booth-step-text');
    const totalSlots = currentFrameData?.slots.length || 2;
    if (stepText) {
      if (activeSlotIndex < totalSlots) {
        stepText.textContent = `${activeSlotIndex + 1}번째 컷 촬영 중 (${activeSlotIndex + 1}/${totalSlots})`;
      } else {
        stepText.textContent = '모든 컷 촬영 완료!';
      }
    }

    const pipsWrap = document.querySelector('.shots-progress-wrap');
    if (pipsWrap && pipsWrap.children.length !== totalSlots) {
      pipsWrap.innerHTML = '';
      for (let i = 0; i < totalSlots; i++) {
        const pip = document.createElement('div');
        pip.className = 'shot-pip';
        pipsWrap.appendChild(pip);
      }
    }

    const pips = document.querySelectorAll('.shot-pip');
    pips.forEach((pip, idx) => {
      pip.classList.remove('done', 'active');
      if (idx < activeSlotIndex) {
        pip.classList.add('done');
      } else if (idx === activeSlotIndex) {
        pip.classList.add('active');
      }
    });

    const retakeBtn = document.getElementById('btn-retake-cut');
    if (retakeBtn) {
      retakeBtn.style.display = activeSlotIndex > 0 ? 'inline-flex' : 'none';
    }
  }

  // ----------------------------------------------------
  // 4. Print Animation & Result Generation
  // ----------------------------------------------------
  async function runPrintAnimationAndComplete() {
    // Stop live camera stream
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
      mediaStream = null;
    }
    if (simulatedCanvasAnimId) {
      cancelAnimationFrame(simulatedCanvasAnimId);
      simulatedCanvasAnimId = null;
    }

    // Build the final master composite high-res image
    const finalCanvas = await compositeFinalFrameCanvas();
    finalResultDataUrl = finalCanvas.toDataURL('image/png');

    // Trigger high-speed background pre-upload while printing animation plays
    triggerBackgroundUpload(finalCanvas);

    // Show Print Animation Modal
    const printModal = document.getElementById('printing-stage-modal');
    const printImg = document.getElementById('printing-photo-preview');
    if (printImg) {
      printImg.src = finalResultDataUrl;
    }
    if (printModal) {
      printModal.classList.add('active');
    }

    PhotoAudio.playPrintSoftPop();

    // After 2.4s print ejection animation, transition to final result screen
    setTimeout(() => {
      if (printModal) {
        printModal.classList.remove('active');
      }
      showFinalResultScreen();
    }, 2400);
  }

  async function compositeFinalFrameCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = currentFrameData.width;   // 1200
    canvas.height = currentFrameData.height; // 1800
    const ctx = canvas.getContext('2d');

    // Fill base background
    ctx.fillStyle = currentFrameData.themeColor || '#0a0614';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. Draw captured photos into their designated slot positions (behind overlay)
    for (let i = 0; i < capturedSlots.length; i++) {
      const item = capturedSlots[i];
      if (item && item.canvas) {
        ctx.drawImage(
          item.canvas,
          item.slot.x,
          item.slot.y,
          item.slot.width,
          item.slot.height
        );
      }
    }

    // 2. Draw Frame PNG Transparent Overlay on TOP (so stickers, bubbles, window bars overlap on top of photos!)
    const overlaySrc = currentFrameData.overlaySrc || `../assets/images/photo_booth/${currentFrameId}_overlay.png`;
    const overlayImg = await loadImage(overlaySrc);
    if (overlayImg) {
      ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);
    }

    return canvas;
  }

  function loadImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function showFinalResultScreen() {
    showStage('result');
    const resultImg = document.getElementById('result-photo-img');
    if (resultImg && finalResultDataUrl) {
      resultImg.src = finalResultDataUrl;
    }
    PhotoAudio.playCompleteFanfare();

    // QR Code button is shown ONLY on PC / Desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    const qrBtn = document.getElementById('btn-share-mobile-qr');
    if (qrBtn) {
      qrBtn.style.display = isMobile ? 'none' : 'inline-flex';
    }
  }

  // ----------------------------------------------------
  // 5. Action Handlers (Save, PC QR Share to Phone)
  // ----------------------------------------------------
  let cachedPhotoUploadUrl = null;
  let activeUploadPromise = null;
  let cachedUploadBlob = null;
  let currentQrUrl = null;

  // Converts canvas into a crisp, high-resolution JPEG (quality 0.92, full 1200x1800)
  // Balanced to prevent pixelation/blurriness while keeping file lightweight (~380KB) for fast upload
  function getHighResPhotoBlob(canvas) {
    if (cachedUploadBlob) return Promise.resolve(cachedUploadBlob);
    return new Promise((resolve) => {
      if (canvas && canvas.toBlob) {
        canvas.toBlob((blob) => {
          if (blob) cachedUploadBlob = blob;
          resolve(blob);
        }, 'image/jpeg', 0.92);
      } else {
        resolve(null);
      }
    });
  }

  // Uploads photo to fast temporary cloud hosts and returns direct image URL
  async function uploadPhotoBlob(blob) {
    if (!blob) return null;
    const filename = `photobooth_${currentFrameId || 'photo'}_${Date.now()}.jpg`;

    // Strategy 1: Catbox Litterbox (Direct raw image, 1h temporary hosting, fastest & completely free)
    try {
      const fd1 = new FormData();
      fd1.append('reqtype', 'fileupload');
      fd1.append('time', '1h');
      fd1.append('fileToUpload', blob, filename);

      const controller1 = new AbortController();
      const timer1 = setTimeout(() => controller1.abort(), 4500);

      const resp1 = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
        method: 'POST',
        body: fd1,
        signal: controller1.signal
      });
      clearTimeout(timer1);

      if (resp1.ok) {
        const text = (await resp1.text()).trim();
        if (text && text.startsWith('http')) {
          return text;
        }
      }
    } catch (e) {
      console.warn('Litterbox upload failed, trying fallback:', e);
    }

    // Strategy 2: tmpfiles.org fallback
    try {
      const fd2 = new FormData();
      fd2.append('file', blob, filename);

      const controller2 = new AbortController();
      const timer2 = setTimeout(() => controller2.abort(), 4500);

      const resp2 = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: fd2,
        signal: controller2.signal
      });
      clearTimeout(timer2);

      if (resp2.ok) {
        const json = await resp2.json();
        if (json && json.data && json.data.url) {
          return json.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
        }
      }
    } catch (e) {
      console.warn('tmpfiles fallback failed:', e);
    }

    return null;
  }

  // Background photo pre-upload: starts as soon as printing animation begins!
  function triggerBackgroundUpload(canvas) {
    cachedPhotoUploadUrl = null;
    cachedUploadBlob = null;
    activeUploadPromise = (async () => {
      try {
        const blob = await getHighResPhotoBlob(canvas);
        if (!blob) return null;
        const directUrl = await uploadPhotoBlob(blob);
        if (directUrl) {
          cachedPhotoUploadUrl = directUrl;
          return directUrl;
        }
      } catch (err) {
        console.warn('Background photo upload warning:', err);
      }
      return null;
    })();
  }

  function showToast(message) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notification';
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('active');
    setTimeout(() => {
      toast.classList.remove('active');
    }, 3200);
  }

  function closePhotoboothQrModal() {
    const modal = document.getElementById('qr-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
  }

  async function openPhotoboothQrModal() {
    if (!finalResultDataUrl) {
      const resultImg = document.getElementById('result-photo-img');
      if (resultImg && resultImg.src && resultImg.src.startsWith('data:')) {
        finalResultDataUrl = resultImg.src;
      }
    }
    if (!finalResultDataUrl) return;

    const modal = document.getElementById('qr-modal');
    const spinner = document.getElementById('qr-loading-spinner');
    const boxContainer = document.getElementById('qr-box-container');
    const subtitle = document.getElementById('qr-modal-subtitle');
    const expiryNotice = document.getElementById('qr-expiry-notice');

    if (!modal) return;
    modal.style.display = 'flex';
    modal.classList.add('active');

    // If pre-upload already completed in background, render INSTANTLY!
    if (cachedPhotoUploadUrl) {
      renderQrCode(cachedPhotoUploadUrl);
      return;
    }

    if (spinner) spinner.style.display = 'block';
    if (boxContainer) boxContainer.style.display = 'none';
    if (expiryNotice) expiryNotice.style.display = 'none';

    try {
      let uploadUrl = null;
      if (activeUploadPromise) {
        uploadUrl = await activeUploadPromise;
      }

      if (!uploadUrl && !cachedPhotoUploadUrl) {
        // Fallback: fast upload using cached crisp JPEG blob
        let blob = cachedUploadBlob;
        if (!blob) {
          const resBlob = await fetch(finalResultDataUrl);
          blob = await resBlob.blob();
        }
        uploadUrl = await uploadPhotoBlob(blob);
      }

      const finalUrl = uploadUrl || cachedPhotoUploadUrl;
      if (finalUrl) {
        cachedPhotoUploadUrl = finalUrl;
        renderQrCode(finalUrl);
      } else {
        throw new Error('Upload fallback');
      }
    } catch (err) {
      console.warn('Temporary cloud upload fallback:', err);
      if (subtitle) {
        subtitle.innerHTML = '스마트폰 카메라로 아래 QR 코드를 스캔하세요.';
      }
      renderQrCode(window.location.origin + window.location.pathname, true);
    }
  }

  function renderQrCode(url, isFallback = false) {
    const spinner = document.getElementById('qr-loading-spinner');
    const boxContainer = document.getElementById('qr-box-container');
    const canvas = document.getElementById('qr-canvas');
    const expiryNotice = document.getElementById('qr-expiry-notice');

    if (spinner) spinner.style.display = 'none';
    if (boxContainer) boxContainer.style.display = 'flex';
    if (expiryNotice) expiryNotice.style.display = isFallback ? 'none' : 'inline-block';
    currentQrUrl = url;

    if (canvas && window.QRCode) {
      window.QRCode.toCanvas(canvas, url, {
        width: 200,
        margin: 1,
        color: {
          dark: '#120822',
          light: '#ffffff'
        }
      }, function (err) {
        if (err) console.error('QR code render error:', err);
      });

      canvas.style.cursor = 'pointer';
      canvas.onclick = () => {
        if (currentQrUrl) {
          window.open(currentQrUrl, '_blank');
        }
      };
    }
  }

  function setupResultActions() {
    // 1. Save (PC 다운로드)
    const saveBtn = document.getElementById('btn-save-photo');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        handleSavePhoto();
      });
    }

    // 2. Mobile QR Share Modal (PC only)
    const qrShareBtn = document.getElementById('btn-share-mobile-qr');
    if (qrShareBtn) {
      qrShareBtn.addEventListener('click', () => {
        window.MysticalAudio?.playCardFlip();
        openPhotoboothQrModal();
      });
    }

    // 3. Retake (다시 찍기)
    const retakeBtn = document.getElementById('btn-retake-all');
    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => {
        try {
          window.MysticalAudio?.playCardFlip();
        } catch (e) {}
        activeSlotIndex = 0;
        capturedSlots = [];
        cachedPhotoUploadUrl = null;
        activeUploadPromise = null;
        startBoothStage();
      });
    }

    // 4. Change Frame from Result (다른 프레임 선택)
    const changeFrameFromResultBtn = document.getElementById('btn-change-frame-from-result');
    if (changeFrameFromResultBtn) {
      changeFrameFromResultBtn.addEventListener('click', () => {
        try {
          window.MysticalAudio?.playCardFlip();
        } catch (e) {}
        resetBoothState();
        cachedPhotoUploadUrl = null;
        activeUploadPromise = null;
        showStage('select');
      });
    }

    // QR Modal Controls
    const qrModal = document.getElementById('qr-modal');
    const closeQrBtn = document.getElementById('btn-close-qr-modal');
    if (closeQrBtn && qrModal) {
      closeQrBtn.addEventListener('click', () => {
        closePhotoboothQrModal();
      });
      qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) {
          closePhotoboothQrModal();
        }
      });
    }
  }

  function handleSavePhoto() {
    if (!finalResultDataUrl) return;

    try {
      window.MysticalAudio?.playCardFlip();
    } catch (e) {}

    const filename = `small_gathering_photobooth_${currentFrameId}_${Date.now()}.png`;

    const link = document.createElement('a');
    link.download = filename;
    link.href = finalResultDataUrl;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✨ 사진 파일이 다운로드되었습니다!');
  }

  // Export to window
  window.initPhotobooth = initPhotobooth;
  window.selectPhotoboothFrame = selectFrame;
  window.openPhotoboothQrModal = openPhotoboothQrModal;
  window.closePhotoboothQrModal = closePhotoboothQrModal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhotobooth);
  } else {
    initPhotobooth();
  }
})();
