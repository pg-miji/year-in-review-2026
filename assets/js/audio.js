// ===================================================================
// 작은모임연구소의 작은 점술가게 - Web Audio API Synthesizer & SFX
// 100% 브라우저 Web Audio API 기반 오르골/클래시컬 앰비언트 엔진
// (외부 음원 파일 없음, 저작권 0%, 무제한 연속 스트리밍)
// ===================================================================

class MysticalAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;

    this.isPlayingBGM = false;
    this.bgmTimeout = null;
    this.activeVoices = [];
    this.padOscillators = [];
    this.filterNode = null;
    this.lfo = null;

    this.currentStep = 0;

    // Check saved sound preference (default: off until user enables)
    this.soundEnabled = localStorage.getItem('tarot_sound_enabled') === 'true';

    this.initUI();
  }

  // Initialize Audio Context on first user gesture
  initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // BGM Gain (Clear, soothing, audible volume)
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.32, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  // Ensure Audio Context is resumed
  async resumeContext() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // -------------------------------------------------------------
  // 1. Classical / Warm Nocturne Music Box Engine
  // -------------------------------------------------------------
  // Note frequency map
  getFreq(noteStr) {
    const notes = {
      'C3': 130.81, 'D3': 146.83, 'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'Ab3': 207.65, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
      'C4': 261.63, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'Ab4': 415.30, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'Eb5': 622.25, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'Ab5': 830.61, 'A5': 880.00, 'Bb5': 932.33, 'B5': 987.77,
      'C6': 1046.50, 'D6': 1174.66, 'Eb6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'G6': 1567.98, 'A6': 1760.00
    };
    return notes[noteStr] || null;
  }

  startBGM() {
    if (this.isPlayingBGM || !this.soundEnabled) return;
    this.resumeContext();
    if (!this.ctx) return;

    this.isPlayingBGM = true;

    // 1-A. Warm Cellar Strings Pad (아늑하고 따뜻한 배경 현악 화음)
    this.startWarmDronePad();

    // 1-B. Long Classical / Music Box Nocturne Composition (32마디 구성 - 약 2분 이상의 긴 멜로디 루프)
    this.playScoreSequence();
  }

  startWarmDronePad() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(500, now);
    this.filterNode.Q.setValueAtTime(1.2, now);
    this.filterNode.connect(this.bgmGain);

    // Warm chord drone in C Major / A Minor: C3, G3, E4, B4
    const padFreqs = [130.81, 196.00, 329.63, 493.88];
    this.padOscillators = padFreqs.map(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 2.5);

      osc.connect(gain);
      gain.connect(this.filterNode);
      osc.start();
      return { osc, gain };
    });
  }

  // Classical / Gymnopedie & Music Box Nocturne Score
  // (멜로디와 따뜻한 아르페지오 베이스의 아름다운 하모니)
  getCompositionScore() {
    return [
      // Phrase 1: Pure Serenade (C Major / G)
      { note: 'E5', bass: 'C3', dur: 1.2, delay: 0.7 },
      { note: 'G5', dur: 1.0, delay: 0.6 },
      { note: 'B5', bass: 'G3', dur: 1.4, delay: 0.8 },
      { note: 'A5', dur: 1.0, delay: 0.6 },
      { note: 'G5', bass: 'E3', dur: 1.5, delay: 0.9 },
      { note: 'E5', dur: 1.0, delay: 0.6 },
      { note: 'D5', bass: 'F3', dur: 1.6, delay: 1.0 },

      // Phrase 2: Winter Waltz (A Minor / F Maj7)
      { note: 'C5', bass: 'A3', dur: 1.2, delay: 0.7 },
      { note: 'E5', dur: 1.0, delay: 0.6 },
      { note: 'A5', bass: 'F3', dur: 1.5, delay: 0.8 },
      { note: 'B5', dur: 1.0, delay: 0.6 },
      { note: 'C6', bass: 'G3', dur: 1.8, delay: 1.0 },
      { note: 'B5', dur: 1.0, delay: 0.6 },
      { note: 'G5', bass: 'E3', dur: 1.5, delay: 0.9 },
      { note: 'E5', dur: 1.2, delay: 0.8 },

      // Phrase 3: Starlight Nocturne (Clair de lune inspiration)
      { note: 'D5', bass: 'F3', dur: 1.3, delay: 0.7 },
      { note: 'F5', dur: 1.0, delay: 0.6 },
      { note: 'A5', bass: 'D3', dur: 1.4, delay: 0.8 },
      { note: 'G5', dur: 1.0, delay: 0.6 },
      { note: 'E5', bass: 'C3', dur: 1.6, delay: 0.9 },
      { note: 'C5', dur: 1.1, delay: 0.6 },
      { note: 'D5', bass: 'G3', dur: 1.8, delay: 1.1 },

      // Phrase 4: Warm Hope / Resolution (C Maj9)
      { note: 'E5', bass: 'C3', dur: 1.2, delay: 0.7 },
      { note: 'G5', dur: 1.0, delay: 0.6 },
      { note: 'C6', bass: 'A3', dur: 1.6, delay: 0.9 },
      { note: 'B5', dur: 1.0, delay: 0.6 },
      { note: 'A5', bass: 'F3', dur: 1.4, delay: 0.8 },
      { note: 'G5', bass: 'G3', dur: 1.5, delay: 0.9 },
      { note: 'E5', dur: 1.2, delay: 0.7 },
      { note: 'C5', bass: 'C3', dur: 2.4, delay: 1.8 }, // Long gentle pause

      // Phrase 5: High Crystal Variation (천상의 오르골 변주)
      { note: 'G5', bass: 'C4', dur: 1.1, delay: 0.6 },
      { note: 'C6', dur: 1.0, delay: 0.6 },
      { note: 'E6', bass: 'G3', dur: 1.6, delay: 0.8 },
      { note: 'D6', dur: 1.0, delay: 0.6 },
      { note: 'C6', bass: 'A3', dur: 1.4, delay: 0.8 },
      { note: 'A5', dur: 1.0, delay: 0.6 },
      { note: 'G5', bass: 'E3', dur: 1.8, delay: 1.0 },

      // Phrase 6: Quiet Winter Sky
      { note: 'A5', bass: 'F3', dur: 1.2, delay: 0.7 },
      { note: 'C6', dur: 1.0, delay: 0.6 },
      { note: 'B5', bass: 'G3', dur: 1.5, delay: 0.8 },
      { note: 'G5', dur: 1.0, delay: 0.6 },
      { note: 'E5', bass: 'C3', dur: 1.6, delay: 0.9 },
      { note: 'D5', bass: 'G3', dur: 1.4, delay: 0.8 },
      { note: 'C5', bass: 'C3', dur: 2.8, delay: 2.2 } // Peaceful transition to loop
    ];
  }

  playScoreSequence() {
    if (!this.isPlayingBGM || !this.ctx) return;

    const score = this.getCompositionScore();
    const item = score[this.currentStep % score.length];

    // Play melody note
    if (item.note) {
      const freq = this.getFreq(item.note);
      if (freq) {
        this.playMusicBoxNote(freq, 0.22, item.dur || 1.4);
      }
    }

    // Play warm bass/accompaniment tone simultaneously
    if (item.bass) {
      const bassFreq = this.getFreq(item.bass);
      if (bassFreq) {
        this.playAcousticBassNote(bassFreq, 0.16, 2.2);
      }
    }

    this.currentStep++;

    const delayMs = (item.delay || 0.7) * 1000;
    this.bgmTimeout = setTimeout(() => {
      this.playScoreSequence();
    }, delayMs);
  }

  // Clear, crystalline Music Box / Glockenspiel synthesis
  playMusicBoxNote(freq, volume = 0.2, decay = 1.6) {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    // Subtle bright harmonic overtone (2nd harmonic) for authentic music box chime
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.002, now); // slight detune for warmth

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.015); // sharp chime attack
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.4, now + 0.2); // natural drop
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.bgmGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + decay);
    osc2.stop(now + decay);
  }

  // Warm acoustic bass accompaniment note (warm cello/piano low tone)
  playAcousticBassNote(freq, volume = 0.15, decay = 2.4) {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle'; // rich, warm acoustic low end
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(now);
    osc.stop(now + decay);
  }

  stopBGM() {
    this.isPlayingBGM = false;
    if (this.bgmTimeout) {
      clearTimeout(this.bgmTimeout);
      this.bgmTimeout = null;
    }

    if (this.ctx) {
      const now = this.ctx.currentTime;
      this.padOscillators.forEach(({ osc, gain }) => {
        try {
          gain.gain.linearRampToValueAtTime(0.0001, now + 0.5);
          setTimeout(() => osc.stop(), 600);
        } catch (e) {}
      });
      this.padOscillators = [];
    }
  }

  // -------------------------------------------------------------
  // 2. Sound Effects (SFX)
  // -------------------------------------------------------------
  playCardFlip() {
    if (!this.soundEnabled) return;
    this.resumeContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.18;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(600, now + 0.16);
      filter.Q.setValueAtTime(3.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      whiteNoise.start(now);
    } catch (e) {}
  }

  playMysticChime() {
    if (!this.soundEnabled) return;
    this.resumeContext();
    if (!this.ctx) return;

    const chimeCascade = [659.25, 880.00, 1108.73, 1318.51, 1760.00];
    chimeCascade.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 1.9);
      }, idx * 90);
    });
  }

  // -------------------------------------------------------------
  // 3. Floating Sound Widget UI
  // -------------------------------------------------------------
  initUI() {
    if (document.getElementById('mystic-sound-toggle')) return;

    const btn = document.createElement('button');
    btn.id = 'mystic-sound-toggle';
    btn.type = 'button';
    btn.className = 'mystic-sound-btn' + (this.soundEnabled ? ' sound-active' : '');
    btn.setAttribute('aria-label', this.soundEnabled ? '배경음악 끄기' : '클래식 오르골 음악 켜기');
    btn.setAttribute('title', this.soundEnabled ? '배경음악 끄기' : '클래식 오르골 음악 켜기');

    btn.innerHTML = `
      <span class="sound-icon-note" aria-hidden="true">${this.soundEnabled ? '🎵' : '🔇'}</span>
      <span class="sound-label-text">${this.soundEnabled ? '음악 ON' : '음악 OFF'}</span>
    `;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSound();
    });

    document.body.appendChild(btn);

    if (this.soundEnabled) {
      const startOnGesture = () => {
        if (this.soundEnabled && !this.isPlayingBGM) {
          this.startBGM();
        }
        document.removeEventListener('click', startOnGesture);
        document.removeEventListener('touchstart', startOnGesture);
      };
      document.addEventListener('click', startOnGesture, { once: true });
      document.addEventListener('touchstart', startOnGesture, { once: true });
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('tarot_sound_enabled', this.soundEnabled ? 'true' : 'false');

    const btn = document.getElementById('mystic-sound-toggle');
    if (btn) {
      if (this.soundEnabled) {
        btn.classList.add('sound-active');
        btn.setAttribute('aria-label', '배경음악 끄기');
        btn.setAttribute('title', '배경음악 끄기');
        btn.innerHTML = `
          <span class="sound-icon-note" aria-hidden="true">🎵</span>
          <span class="sound-label-text">음악 ON</span>
        `;
      } else {
        btn.classList.remove('sound-active');
        btn.setAttribute('aria-label', '클래식 오르골 음악 켜기');
        btn.setAttribute('title', '클래식 오르골 음악 켜기');
        btn.innerHTML = `
          <span class="sound-icon-note" aria-hidden="true">🔇</span>
          <span class="sound-label-text">음악 OFF</span>
        `;
      }
    }

    if (this.soundEnabled) {
      this.startBGM();
      this.playMysticChime();
    } else {
      this.stopBGM();
    }
  }
}

// ===================================================================
// Seamless SPA Router for Continuous Audio Playback
// ===================================================================
class SeamlessSPARouter {
  constructor() {
    this.isNavigating = false;
    this.init();
  }

  init() {
    // Intercept clicks on internal links for seamless page navigation
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || link.target === '_blank') {
        return;
      }

      if (link.hasAttribute('download')) {
        return;
      }

      // Resolve destination URL
      const targetUrl = new URL(link.href, window.location.href);
      if (targetUrl.origin !== window.location.origin) {
        return;
      }

      e.preventDefault();
      // Sound feedback
      window.MysticalAudio?.playCardFlip();
      this.navigate(targetUrl.href);
    });

    // Handle browser back and forward buttons
    window.addEventListener('popstate', () => {
      this.loadPage(window.location.href, false);
    });
  }

  async navigate(url) {
    if (this.isNavigating) return;
    const targetUrl = new URL(url, window.location.href).href;
    return this.loadPage(targetUrl, true);
  }

  async loadPage(url, push = true) {
    this.isNavigating = true;

    // Remove legacy transition curtain if any
    const legacyCurtain = document.getElementById('transition-curtain');
    if (legacyCurtain) {
      legacyCurtain.remove();
    }

    const currentContainer = document.querySelector('.app-container');
    if (currentContainer) {
      currentContainer.classList.add('page-leaving');
      currentContainer.classList.remove('page-entering');
    }

    try {
      // Fetch the destination page HTML
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const htmlText = await resp.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      // Update Document Title
      if (doc.title) {
        document.title = doc.title;
      }

      // Ensure target page CSS stylesheets exist
      const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
      for (const link of links) {
        const href = link.getAttribute('href');
        if (!href) continue;
        const resolvedHref = new URL(href, url).href;
        const alreadyExists = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(
          ex => ex.href === resolvedHref
        );
        if (!alreadyExists) {
          const newLink = document.createElement('link');
          newLink.rel = 'stylesheet';
          newLink.href = resolvedHref;
          document.head.appendChild(newLink);
        }
      }

      // Wait a tiny frame (120ms) for smooth fade out
      await new Promise(r => setTimeout(r, 120));

      // Swap .app-container
      const newContainer = doc.querySelector('.app-container');
      if (currentContainer && newContainer) {
        currentContainer.innerHTML = newContainer.innerHTML;
        currentContainer.className = newContainer.className;
        currentContainer.classList.add('page-entering');
        currentContainer.classList.remove('page-leaving');
      }

      // Swap / Manage any modals (reading-loading-modal, preview-modal)
      const modals = ['reading-loading-modal', 'preview-modal'];
      modals.forEach(modalId => {
        const oldModal = document.getElementById(modalId);
        const newModal = doc.getElementById(modalId);
        if (oldModal && newModal) {
          oldModal.outerHTML = newModal.outerHTML;
        } else if (!oldModal && newModal) {
          document.body.appendChild(newModal.cloneNode(true));
        } else if (oldModal && !newModal) {
          oldModal.remove();
        }
      });

      // Update browser history URL
      if (push) {
        window.history.pushState({}, '', url);
      }

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Load any external scripts in the fetched page that haven't been loaded yet
      const scriptTags = Array.from(doc.querySelectorAll('script[src]'));
      for (const s of scriptTags) {
        const src = s.getAttribute('src');
        if (!src) continue;
        const resolvedSrc = new URL(src, url).href;
        if (resolvedSrc.endsWith('audio.js')) continue;

        const alreadyLoaded = Array.from(document.querySelectorAll('script[src]')).some(
          ex => ex.src === resolvedSrc
        );
        if (!alreadyLoaded) {
          await new Promise((resolve) => {
            const newScript = document.createElement('script');
            newScript.src = resolvedSrc;
            newScript.onload = resolve;
            newScript.onerror = resolve;
            document.body.appendChild(newScript);
          });
        }
      }

      // Trigger page initializer based on pathname
      this.runPageLifecycle(url);

      setTimeout(() => {
        if (currentContainer) {
          currentContainer.classList.remove('page-entering');
        }
        this.isNavigating = false;
      }, 200);

    } catch (e) {
      console.warn('Seamless navigation fallback to hard navigation:', e);
      if (currentContainer) {
        currentContainer.classList.remove('page-leaving');
      }
      this.isNavigating = false;
      window.location.href = url;
    }
  }

  runPageLifecycle(url) {
    const parsed = new URL(url, window.location.origin);
    const path = parsed.pathname;

    if (path.endsWith('question.html')) {
      if (window.initQuestionPage) {
        window.initQuestionPage();
      }
    } else if (path.endsWith('cards.html')) {
      if (window.initCardsPage) {
        window.initCardsPage();
      }
    } else if (path.endsWith('card.html')) {
      if (window.initCardPage) {
        window.initCardPage();
      }
    } else {
      if (window.initMainPage) {
        window.initMainPage();
      }
    }
  }
}

// Global Singleton Instances
if (!window.MysticalAudio) {
  window.MysticalAudio = new MysticalAudioEngine();
}
if (!window.MysticalRouter) {
  window.MysticalRouter = new SeamlessSPARouter();
}
