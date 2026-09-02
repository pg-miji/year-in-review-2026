// ===================================================================
// 작은모임연구소의 작은 점술가게 - Photo Booth Logic Engine
// ===================================================================

(function () {
  'use strict';

  let currentFrameId = null;
  let currentFrameData = null;
  let activeSlotIndex = 0;
  let capturedSlots = []; // array of { slot, dataUrl, canvas }
  let mediaStream = null;
  let currentFacingMode = 'user';
  let activeFilter = 'none'; // 'none' | 'bw' | 'warm'
  let isCountingDown = false;
  let finalResultDataUrl = null;
  let simulatedCanvasAnimId = null;
  let sharedVideoEl = null;

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
    setupFrameSelection();
    setupCameraControls();
    setupResultActions();
    showStage('select');
  }

  function showStage(stageName) {
    const selectStage = document.getElementById('stage-frame-select');
    const boothStage = document.getElementById('stage-camera-booth');
    const resultStage = document.getElementById('stage-final-result');

    if (selectStage) selectStage.style.display = stageName === 'select' ? 'block' : 'none';
    if (boothStage) boothStage.style.display = stageName === 'booth' ? 'flex' : 'none';
    if (resultStage) resultStage.style.display = stageName === 'result' ? 'flex' : 'none';

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
    activeSlotIndex = 0;
    capturedSlots = [];

    try {
      window.MysticalAudio?.playCardFlip();
    } catch (e) {}

    startBoothStage();

    setTimeout(() => {
      isSelectingFrame = false;
    }, 400);
  }

  // ----------------------------------------------------
  // 2. Camera Booth Stage Setup
  // ----------------------------------------------------
  function startBoothStage() {
    showStage('booth');
    setupFrameBoard();
    updateProgressUI();
    
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
      slotEl.style.backgroundColor = '#000000';
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
    frameOverlay.src = currentFrameData.overlaySrc || `/assets/images/${currentFrameId}_overlay.png`;
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

    // Stop previous simulation if running
    if (simulatedCanvasAnimId) {
      cancelAnimationFrame(simulatedCanvasAnimId);
      simulatedCanvasAnimId = null;
    }

    // Stop existing stream if any
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }

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
      const stream = canvas.captureStream(30);
      video.srcObject = stream;
      video.play().catch(() => {});
    } catch (e) {
      console.error('Simulated stream capture error:', e);
    }
  }

  function setupCameraControls() {
    // Shutter button
    const shutterBtn = document.getElementById('btn-take-photo');
    if (shutterBtn) {
      shutterBtn.addEventListener('click', () => {
        if (isCountingDown) return;
        startCountdownAndCapture();
      });
    }

    // Timer toggle button
    const timerBtn = document.getElementById('btn-toggle-timer');
    let timerEnabled = true;
    if (timerBtn) {
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
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-filter') || 'none';
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
        if (mediaStream) {
          mediaStream.getTracks().forEach(t => t.stop());
        }
        if (simulatedCanvasAnimId) {
          cancelAnimationFrame(simulatedCanvasAnimId);
          simulatedCanvasAnimId = null;
        }
        showStage('select');
      });
    }
  }

  function applyFilterToVideo() {
    const video = getOrCreateVideoElement();
    if (!video) return;

    if (activeFilter === 'bw') {
      video.style.filter = 'grayscale(1) contrast(1.25) brightness(1.05)';
    } else if (activeFilter === 'warm') {
      video.style.filter = 'sepia(0.2) saturate(1.35) hue-rotate(-10deg) brightness(1.08)';
    } else {
      video.style.filter = 'none';
    }
  }

  function startCountdownAndCapture() {
    const timerBtn = document.getElementById('btn-toggle-timer');
    const isTimerOn = timerBtn && timerBtn.classList.contains('active');

    if (!isTimerOn) {
      captureCurrentSlot();
      return;
    }

    if (isCountingDown) return;
    isCountingDown = true;
    const overlay = document.getElementById('countdown-overlay');
    let count = 5;

    if (overlay) {
      overlay.innerHTML = `<div class="countdown-number-badge">${count}</div>`;
      overlay.classList.add('active');
    }
    PhotoAudio.playCountdownTick(count);

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        if (overlay) {
          overlay.innerHTML = `<div class="countdown-number-badge">${count}</div>`;
        }
        PhotoAudio.playCountdownTick(count);
      } else {
        clearInterval(interval);
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
  // 3. Capturing Photo Slot
  // ----------------------------------------------------
  function captureCurrentSlot() {
    const video = getOrCreateVideoElement();
    if (!video || !currentFrameData) return;

    // Play Shutter sound & trigger flash
    PhotoAudio.playShutter();
    triggerFlash();

    const currentSlot = currentFrameData.slots[activeSlotIndex];
    const targetW = currentSlot.width;
    const targetH = currentSlot.height;

    // Create off-screen canvas for high quality slot photo
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    // Video aspect crop math (cover style)
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
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

    // Apply color filter to captured canvas
    if (activeFilter === 'bw') {
      ctx.filter = 'grayscale(1) contrast(1.25) brightness(1.05)';
    } else if (activeFilter === 'warm') {
      ctx.filter = 'sepia(0.2) saturate(1.35) hue-rotate(-10deg) brightness(1.08)';
    }

    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetW, targetH);
    ctx.restore();

    // Store captured photo data URL
    const slotPhotoDataUrl = canvas.toDataURL('image/jpeg', 0.95);
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
    } else {
      // All slots filled! Run print animation and reveal final result
      setTimeout(() => {
        runPrintAnimationAndComplete();
      }, 300);
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
    const overlaySrc = currentFrameData.overlaySrc || `/assets/images/${currentFrameId}_overlay.png`;
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
  }

  // ----------------------------------------------------
  // 5. Action Handlers (Save, Retake)
  // ----------------------------------------------------
  function setupResultActions() {
    // 1. Save (저장하기)
    const saveBtn = document.getElementById('btn-save-photo');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        handleSavePhoto();
      });
    }

    // 2. Retake (다시 찍기)
    const retakeBtn = document.getElementById('btn-retake-all');
    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => {
        try {
          window.MysticalAudio?.playCardFlip();
        } catch (e) {}
        activeSlotIndex = 0;
        capturedSlots = [];
        startBoothStage();
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
  }

  // Export to window
  window.initPhotobooth = initPhotobooth;
  window.selectPhotoboothFrame = selectFrame;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhotobooth);
  } else {
    initPhotobooth();
  }
})();
