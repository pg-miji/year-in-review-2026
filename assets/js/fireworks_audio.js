// ===================================================================
// 시간 조각 상점 - 은하재 Web Audio SFX + Procedural BGM
// 100% original procedural synthesis (zero external audio files / zero copyright issues)
// ===================================================================

const PAD_CHORDS = [
  [261.63, 329.63, 392.00, 493.88], // Cmaj7
  [220.00, 261.63, 329.63, 392.00], // Am7
  [174.61, 220.00, 261.63, 329.63], // Fmaj7
  [196.00, 246.94, 293.66, 392.00]  // G6
];

const CELESTA_MOTIF = [
  523.25, 659.25, 783.99, 659.25,
  587.33, 659.25, 523.25, 493.88,
  440.00, 523.25, 659.25, 587.33,
  392.00, 493.88, 587.33, 659.25
];

export class FireworksAudioEngine {
  constructor(options = {}) {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.noiseBuffer = null;

    this.isMobile = Boolean(
      options?.isMobile ??
        (typeof window !== 'undefined' &&
          (window.matchMedia?.('(hover: none) and (pointer: coarse)').matches ||
            Math.min(window.innerWidth, window.innerHeight) <= 768))
    );

    this._masterLevel = this.isMobile ? 1.28 : 0.72;
    this._sfxLevel = this.isMobile ? 1.05 : 0.65;
    this._ambientLevel = this.isMobile ? 0.56 : 0.36;
    this._bgmScale = this.isMobile ? 1.48 : 1.0;

    this.muted = false;
    this.sfxEnabled = true;
    this.bgmEnabled = true;
    this.ambientEnabled = true;
    this.bgmVolume = 0.34;

    this.ambientGain = null;
    this._sizzleGain = null;
    this._sizzlePanner = null;
    this._fireGain = null;
    this._fireCrackleBus = null;
    this._firePanner = null;
    this._fireProximity = 0;
    this._ambientStarted = false;
    this._ambientSources = [];

    this._bgmTimer = 0;
    this._bgmStep = 0;
    this._bgmRunning = false;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this._masterLevel;

      if (this.isMobile && typeof this.ctx.createDynamicsCompressor === 'function') {
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(14, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(3.5, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.004, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.14, this.ctx.currentTime);
        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
      } else {
        this.masterGain.connect(this.ctx.destination);
      }

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxEnabled ? this._sfxLevel : 0;
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.bgmEnabled ? this.bgmVolume * this._bgmScale : 0;
      this.bgmGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = this.ambientEnabled ? this._ambientLevel : 0;
      this.ambientGain.connect(this.masterGain);

      this.noiseBuffer = this._createNoiseBuffer(this.ctx);
      this._startAmbientNodes();
    }
    if (this.ctx.state === 'suspended' && !document.hidden) {
      this.ctx.resume().then(() => {
        if (this.bgmEnabled && !this.muted && !this._bgmRunning && !document.hidden) {
          this._startBgmLoop();
        }
      }).catch(() => {});
    }
    if (this.ctx.state === 'running' && this.bgmEnabled && !this.muted && !this._bgmRunning) {
      this._startBgmLoop();
    }
    return this.ctx;
  }

  _startAmbientNodes() {
    if (this._ambientStarted || !this.ctx || !this.ambientGain || !this.noiseBuffer) return;
    this._ambientStarted = true;
    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;

      // 1. Subtle soft hill breeze (very gentle low bandpass noise)
      const windSrc = ctx.createBufferSource();
      windSrc.buffer = this.noiseBuffer;
      windSrc.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(240, now);
      windFilter.Q.value = 0.85;

      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.032, now);

      windSrc.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(this.ambientGain);
      windSrc.start(now);
      this._ambientSources.push(windSrc);

      // 2. 3D-attenuated bungeoppang griddle sizzle
      const sizzleSrc = ctx.createBufferSource();
      sizzleSrc.buffer = this.noiseBuffer;
      sizzleSrc.loop = true;

      const sizzleHp = ctx.createBiquadFilter();
      sizzleHp.type = 'highpass';
      sizzleHp.frequency.setValueAtTime(2200, now);

      const sizzleBp = ctx.createBiquadFilter();
      sizzleBp.type = 'bandpass';
      sizzleBp.frequency.setValueAtTime(3800, now);
      sizzleBp.Q.value = 0.9;

      this._sizzleGain = ctx.createGain();
      this._sizzleGain.gain.setValueAtTime(0, now);

      this._sizzlePanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      sizzleSrc.connect(sizzleHp);
      sizzleHp.connect(sizzleBp);
      sizzleBp.connect(this._sizzleGain);
      if (this._sizzlePanner) {
        this._sizzleGain.connect(this._sizzlePanner);
        this._sizzlePanner.connect(this.ambientGain);
      } else {
        this._sizzleGain.connect(this.ambientGain);
      }
      sizzleSrc.start(now);
      this._ambientSources.push(sizzleSrc);
      // 3. 3D-attenuated Campfire Wood Burning & Hearth Warmth (fades out smoothly with distance)
      this._firePanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      this._fireGain = ctx.createGain();
      this._fireGain.gain.setValueAtTime(0, now);

      this._fireCrackleBus = ctx.createGain();
      this._fireCrackleBus.gain.setValueAtTime(0, now);

      // Warm low hearth flame rumble
      const fireRumbleSrc = ctx.createBufferSource();
      fireRumbleSrc.buffer = this.noiseBuffer;
      fireRumbleSrc.loop = true;
      fireRumbleSrc.start(now, 0.2);

      const fireLpf = ctx.createBiquadFilter();
      fireLpf.type = 'lowpass';
      fireLpf.frequency.setValueAtTime(195, now);
      fireLpf.Q.value = 0.75;

      const fireRumbleMix = ctx.createGain();
      fireRumbleMix.gain.setValueAtTime(0.56, now);

      fireRumbleSrc.connect(fireLpf);
      fireLpf.connect(fireRumbleMix);
      fireRumbleMix.connect(this._fireGain);
      this._ambientSources.push(fireRumbleSrc);

      // Soft airy flame whisper / ember rustle
      const fireFlameSrc = ctx.createBufferSource();
      fireFlameSrc.buffer = this.noiseBuffer;
      fireFlameSrc.loop = true;
      fireFlameSrc.start(now, 0.75);

      const fireBpf = ctx.createBiquadFilter();
      fireBpf.type = 'bandpass';
      fireBpf.frequency.setValueAtTime(760, now);
      fireBpf.Q.value = 0.7;

      const fireFlameMix = ctx.createGain();
      fireFlameMix.gain.setValueAtTime(0.24, now);

      fireFlameSrc.connect(fireBpf);
      fireBpf.connect(fireFlameMix);
      fireFlameMix.connect(this._fireGain);
      this._ambientSources.push(fireFlameSrc);

      if (this._firePanner) {
        this._fireGain.connect(this._firePanner);
        this._fireCrackleBus.connect(this._firePanner);
        this._firePanner.connect(this.ambientGain);
      } else {
        this._fireGain.connect(this.ambientGain);
        this._fireCrackleBus.connect(this.ambientGain);
      }
    } catch (e) {}
  }

  setAmbientEnabled(enabled) {
    this.ambientEnabled = Boolean(enabled);
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.ambientEnabled ? this._ambientLevel : 0, this.ctx.currentTime, 0.08);
    }
    return this.ambientEnabled;
  }

  updateSpatialAmbient(stallDistance, stallPan = 0) {
    return;
    try {
      const now = this.ctx.currentTime;
      const dist = Math.max(0, Number(stallDistance) || 0);
      const maxRange = 16.5;
      const t = Math.max(0, Math.min(1, 1 - Math.max(0, dist - 2.0) / maxRange));
      const targetGain = t * t * 0.16;
      this._sizzleGain.gain.setTargetAtTime(targetGain, now, 0.1);
      if (this._sizzlePanner) {
        this._sizzlePanner.pan.setTargetAtTime(Math.max(-0.9, Math.min(0.9, stallPan)), now, 0.1);
      }
    } catch (e) {}
  }

  updateCampfireAudio(fireDist, firePan = 0) {
    if (!this.ctx || !this._fireGain || !this._fireCrackleBus) return;
    try {
      const now = this.ctx.currentTime;
      if (this.ctx.state !== 'running' || this.muted || !this.ambientEnabled || document.hidden) {
        this._fireProximity = 0;
        this._fireGain.gain.setTargetAtTime(0, now, 0.08);
        this._fireCrackleBus.gain.setTargetAtTime(0, now, 0.08);
        return;
      }

      const dist = Math.max(0, Number(fireDist) || 0);
      // Full warmth within 1.8m of hearth; smooth cubic fade-out over 1.8m -> 13.5m
      const u = Math.max(0, Math.min(1, 1 - Math.max(0, dist - 1.8) / 11.7));
      const atten = u * u * (3 - 2 * u);
      this._fireProximity = atten;

      this._fireGain.gain.setTargetAtTime(atten * 0.52, now, 0.16);
      this._fireCrackleBus.gain.setTargetAtTime(atten, now, 0.15);
      if (this._firePanner) {
        this._firePanner.pan.setTargetAtTime(Math.max(-0.88, Math.min(0.88, firePan)), now, 0.12);
      }

      // Schedule natural wood-crackle & spark pops while within earshot
      if (atten > 0.04 && this.noiseBuffer) {
        const roll = Math.random();
        const count = roll < 0.52 ? 1 : (roll < 0.78 ? 2 : 0);
        for (let i = 0; i < count; i++) {
          const t0 = now + Math.random() * 0.1;
          const isDeepSnap = Math.random() < 0.34;
          const dur = isDeepSnap ? 0.028 + Math.random() * 0.015 : 0.016 + Math.random() * 0.013;

          const crackle = this.ctx.createBufferSource();
          crackle.buffer = this.noiseBuffer;
          const offset = Math.random() * Math.max(0.1, this.noiseBuffer.duration - 0.1);

          const bpf = this.ctx.createBiquadFilter();
          bpf.type = 'bandpass';
          bpf.frequency.setValueAtTime(
            isDeepSnap ? 680 + Math.random() * 380 : 1950 + Math.random() * 2500,
            t0
          );
          bpf.Q.value = isDeepSnap ? 2.1 : 3.2;

          const cGain = this.ctx.createGain();
          const peak = isDeepSnap ? 0.26 + Math.random() * 0.12 : 0.22 + Math.random() * 0.14;
          cGain.gain.setValueAtTime(0.0005, t0);
          cGain.gain.linearRampToValueAtTime(peak, t0 + 0.0025);
          cGain.gain.exponentialRampToValueAtTime(0.0004, t0 + dur);

          crackle.connect(bpf);
          bpf.connect(cGain);
          cGain.connect(this._fireCrackleBus);
          crackle.start(t0, offset, dur + 0.01);
        }
      }
    } catch (e) {}
  }

  isRunning() {
    return Boolean(this.ctx && this.ctx.state === 'running');
  }

  _createNoiseBuffer(ctx) {
    const length = Math.floor(ctx.sampleRate * 1.4);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this._masterLevel, this.ctx.currentTime, 0.04);
    }
    if (this.muted) {
      this._stopBgmLoop();
    } else {
      this.ensureContext();
    }
    return this.muted;
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = Boolean(enabled);
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxEnabled ? this._sfxLevel : 0, this.ctx.currentTime, 0.04);
    }
    return this.sfxEnabled;
  }

  setBgmEnabled(enabled) {
    this.bgmEnabled = Boolean(enabled);
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(this.bgmEnabled ? this.bgmVolume * this._bgmScale : 0, this.ctx.currentTime, 0.08);
    }
    if (this.bgmEnabled && !this.muted) {
      this.ensureContext();
    } else {
      this._stopBgmLoop();
    }
    return this.bgmEnabled;
  }

  setBgmVolume(vol) {
    this.bgmVolume = Math.max(0, Math.min(1, Number(vol) || 0));
    if (this.bgmGain && this.ctx && this.bgmEnabled) {
      this.bgmGain.gain.setTargetAtTime(this.bgmVolume * this._bgmScale, this.ctx.currentTime, 0.05);
    }
  }

  suspendForHidden(hidden) {
    if (!this.ctx) return;
    if (hidden) {
      this._stopBgmLoop();
      if (this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
    } else if (!this.muted) {
      this.ctx.resume().then(() => {
        if (this.bgmEnabled && !this.muted && !this._bgmRunning) {
          this._startBgmLoop();
        }
      }).catch(() => {});
    }
  }

  _startBgmLoop() {
    if (this._bgmRunning || !this.ctx || this.ctx.state !== 'running' || this.muted || !this.bgmEnabled || document.hidden) return;
    this._bgmRunning = true;

    const scheduleStep = () => {
      if (!this._bgmRunning || !this.ctx || this.ctx.state !== 'running' || this.muted || !this.bgmEnabled || document.hidden) {
        this._bgmRunning = false;
        return;
      }

      const now = this.ctx.currentTime;
      const step = this._bgmStep;
      this._bgmStep = (this._bgmStep + 1) % 16;

      // Every 4 steps (~3.6s), bloom a gentle warm chord pad
      if (step % 4 === 0) {
        const chord = PAD_CHORDS[(step / 4) % PAD_CHORDS.length];
        this._playPadChord(chord, now, 3.8);
      }

      // Delicate nocturnal celesta/music-box note
      if (step % 2 === 0 || step % 4 === 3) {
        const noteFreq = CELESTA_MOTIF[step];
        this._playBellNote(noteFreq, now, step % 4 === 0 ? 0.11 : 0.07);
      }

      this._bgmTimer = window.setTimeout(scheduleStep, 900);
    };

    scheduleStep();
  }

  _stopBgmLoop() {
    this._bgmRunning = false;
    if (this._bgmTimer) {
      clearTimeout(this._bgmTimer);
      this._bgmTimer = 0;
    }
  }

  _playPadChord(freqs, startTime, duration) {
    if (!this.ctx || !this.bgmGain) return;
    try {
      const lpf = this.ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = this.isMobile ? 820 : 460;

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.0001, startTime);
      env.gain.linearRampToValueAtTime(0.11, startTime + 1.0);
      env.gain.exponentialRampToValueAtTime(0.0005, startTime + duration);

      lpf.connect(env);
      env.connect(this.bgmGain);

      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, startTime);
        osc.connect(lpf);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
      });
    } catch (e) {}
  }

  _playBellNote(freq, startTime, peak) {
    if (!this.ctx || !this.bgmGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(peak, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0004, startTime + 1.6);

      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(startTime);
      osc.stop(startTime + 1.65);
    } catch (e) {}
  }

  playLaunch(pan = 0) {
    const ctx = this.ensureContext();
    if (!ctx || this.muted || !this.sfxEnabled) return;

    try {
      const now = ctx.currentTime;
      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (panner) {
        panner.pan.value = Math.max(-0.85, Math.min(0.85, pan));
        panner.connect(this.sfxGain);
      }
      const dest = panner || this.sfxGain;

      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, now);
      filter.frequency.exponentialRampToValueAtTime(2200, now + 0.45);
      filter.Q.value = 2.8;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      noise.start(now);
      noise.stop(now + 0.55);
    } catch (e) {}
  }

  playBurst(burstType = 'chrysanthemum', pan = 0) {
    const ctx = this.ensureContext();
    if (!ctx || this.muted || !this.sfxEnabled) return;

    try {
      const now = ctx.currentTime;
      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (panner) {
        panner.pan.value = Math.max(-0.85, Math.min(0.85, pan));
        panner.connect(this.sfxGain);
      }
      const dest = panner || this.sfxGain;

      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(115, now);
      sub.frequency.exponentialRampToValueAtTime(32, now + 0.42);
      subGain.gain.setValueAtTime(0.32, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.46);
      sub.connect(subGain);
      subGain.connect(dest);
      sub.start(now);
      sub.stop(now + 0.48);

      const tailDuration = burstType === 'willow' ? 1.2 : 0.82;
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(2500, now);
      lpf.frequency.exponentialRampToValueAtTime(340, now + tailDuration);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.24, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + tailDuration);

      noise.connect(lpf);
      lpf.connect(nGain);
      nGain.connect(dest);
      noise.start(now);
      noise.stop(now + tailDuration + 0.05);

      if (burstType === 'willow') {
        for (let i = 0; i < 4; i++) {
          const delay = 0.24 + i * 0.14 + Math.random() * 0.07;
          const sparkle = ctx.createOscillator();
          const sGain = ctx.createGain();
          sparkle.type = 'triangle';
          sparkle.frequency.setValueAtTime(1600 + Math.random() * 1400, now + delay);
          sGain.gain.setValueAtTime(0.035, now + delay);
          sGain.gain.exponentialRampToValueAtTime(0.0005, now + delay + 0.07);
          sparkle.connect(sGain);
          sGain.connect(dest);
          sparkle.start(now + delay);
          sparkle.stop(now + delay + 0.08);
        }
      }
    } catch (e) {}
  }

  playWishLantern() {
    const ctx = this.ensureContext();
    if (!ctx || this.muted || !this.sfxEnabled) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0.0001, now + i * 0.09);
        gain.gain.linearRampToValueAtTime(0.08, now + i * 0.09 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + i * 0.09 + 0.9);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.95);
      });
    } catch (e) {}
  }

  playCountdownTick(secondsLeft) {
    const ctx = this.ensureContext();
    if (!ctx || this.muted || !this.sfxEnabled) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(secondsLeft <= 3 ? 880 : 659.25, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {}
  }

  playMidnightChime() {
    const ctx = this.ensureContext();
    if (!ctx || this.muted || !this.sfxEnabled) return;

    try {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.0001, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.07 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.07 + 1.5);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 1.55);
      });
    } catch (e) {}
  }

  playMysticChime() {
    const ctx = this.ensureContext();
    if (!ctx || this.muted || !this.sfxEnabled) return;

    try {
      const now = ctx.currentTime;
      [659.25, 830.61, 987.77, 1318.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.0001, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.08 + 1.6);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 1.65);
      });
    } catch (e) {}
  }

  playBungeoppangEat() {
    const ctx = this.ensureContext();
    if (!ctx || this.muted || !this.sfxEnabled) return;

    try {
      const now = ctx.currentTime;
      // Gentle crispy bite + warm happy chime
      if (this.noiseBuffer) {
        const crunch = ctx.createBufferSource();
        crunch.buffer = this.noiseBuffer;
        const bpf = ctx.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.setValueAtTime(1650, now);
        bpf.Q.value = 1.6;
        const cGain = ctx.createGain();
        cGain.gain.setValueAtTime(0.08, now);
        cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        crunch.connect(bpf);
        bpf.connect(cGain);
        cGain.connect(this.sfxGain);
        crunch.start(now);
        crunch.stop(now + 0.12);
      }

      [587.33, 783.99, 987.77].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.06 + idx * 0.08);
        gain.gain.setValueAtTime(0.0001, now + 0.06 + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.09, now + 0.08 + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.42 + idx * 0.08);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + 0.06 + idx * 0.08);
        osc.stop(now + 0.46 + idx * 0.08);
      });
    } catch (e) {}
  }

  playBosingakBell() {
    const ctx = this.ensureContext();
    if (!ctx || this.muted || !this.sfxEnabled) return;

    try {
      const now = ctx.currentTime;

      // Wooden striker (당목) impact transient against heavy bronze
      if (this.noiseBuffer) {
        const impactNoise = ctx.createBufferSource();
        impactNoise.buffer = this.noiseBuffer;
        const bpf = ctx.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.setValueAtTime(420, now);
        bpf.Q.value = 1.4;
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.14, now);
        nGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.12);
        impactNoise.connect(bpf);
        bpf.connect(nGain);
        nGain.connect(this.sfxGain);
        impactNoise.start(now);
        impactNoise.stop(now + 0.14);
      }

      // Deep Korean bronze bell fundamental + detuned beating (맥놀이) + resonant partials
      const partials = [
        { freq: 130.81, amp: 0.22, dur: 4.3 },
        { freq: 132.15, amp: 0.18, dur: 4.1 },
        { freq: 196.0, amp: 0.11, dur: 3.4 },
        { freq: 311.13, amp: 0.065, dur: 2.5 },
        { freq: 466.16, amp: 0.04, dur: 1.8 },
        { freq: 698.46, amp: 0.022, dur: 1.1 }
      ];

      partials.forEach((p) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(p.freq, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(p.amp, now + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0004, now + p.dur);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + p.dur + 0.05);
      });
    } catch (e) {}
  }

  playPuppyBark() {
    const ctx = this.ensureContext();
    if (!ctx || this.muted || !this.sfxEnabled) return;

    try {
      const now = ctx.currentTime;
      const barks = [
        { offset: 0.0, fStart: 340, fPeak: 590, fEnd: 250, dur: 0.145, peakGain: 0.16 },
        { offset: 0.21, fStart: 370, fPeak: 640, fEnd: 270, dur: 0.155, peakGain: 0.14 }
      ];

      barks.forEach((b) => {
        const t0 = now + b.offset;

        const osc = ctx.createOscillator();
        const overtone = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const env = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(b.fStart, t0);
        osc.frequency.exponentialRampToValueAtTime(b.fPeak, t0 + 0.032);
        osc.frequency.exponentialRampToValueAtTime(b.fEnd, t0 + b.dur);

        overtone.type = 'sine';
        overtone.frequency.setValueAtTime(b.fStart * 1.95, t0);
        overtone.frequency.exponentialRampToValueAtTime(b.fPeak * 1.9, t0 + 0.032);
        overtone.frequency.exponentialRampToValueAtTime(b.fEnd * 1.75, t0 + b.dur);

        const overtoneGain = ctx.createGain();
        overtoneGain.gain.setValueAtTime(0.28, t0);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600, t0);
        filter.frequency.exponentialRampToValueAtTime(680, t0 + b.dur);
        filter.Q.value = 2.1;

        env.gain.setValueAtTime(0.0001, t0);
        env.gain.linearRampToValueAtTime(b.peakGain, t0 + 0.018);
        env.gain.exponentialRampToValueAtTime(0.0008, t0 + b.dur);

        osc.connect(filter);
        overtone.connect(overtoneGain);
        overtoneGain.connect(filter);
        filter.connect(env);
        env.connect(this.sfxGain);

        osc.start(t0);
        overtone.start(t0);
        osc.stop(t0 + b.dur + 0.02);
        overtone.stop(t0 + b.dur + 0.02);

        if (this.noiseBuffer) {
          const puff = ctx.createBufferSource();
          puff.buffer = this.noiseBuffer;
          const bpf = ctx.createBiquadFilter();
          bpf.type = 'bandpass';
          bpf.frequency.setValueAtTime(1150, t0);
          bpf.Q.value = 1.4;
          const pGain = ctx.createGain();
          pGain.gain.setValueAtTime(0.001, t0);
          pGain.gain.linearRampToValueAtTime(0.055, t0 + 0.012);
          pGain.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.065);
          puff.connect(bpf);
          bpf.connect(pGain);
          pGain.connect(this.sfxGain);
          puff.start(t0);
          puff.stop(t0 + 0.07);
        }
      });
    } catch (e) {}
  }

  playReindeerBell() {
    const ctx = this.ensureContext();
    if (!ctx || this.muted || !this.sfxEnabled) return;

    try {
      const now = ctx.currentTime;
      // Festive sleigh-bell double ring ("딸랑-딸랑!") with crisp metallic overtones
      const rings = [0.0, 0.13];
      rings.forEach((offset, rIdx) => {
        const t0 = now + offset;
        const baseFreq = rIdx === 0 ? 1567.98 : 1760.0; // G6 -> A6 cheerful jingle
        const partials = [
          { ratio: 1.0, amp: 0.11, dur: 0.42 },
          { ratio: 2.02, amp: 0.065, dur: 0.3 },
          { ratio: 2.76, amp: 0.04, dur: 0.22 },
          { ratio: 3.98, amp: 0.025, dur: 0.14 }
        ];
        partials.forEach((p) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(baseFreq * p.ratio, t0);
          gain.gain.setValueAtTime(0.0001, t0);
          gain.gain.linearRampToValueAtTime(p.amp, t0 + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.0004, t0 + p.dur);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t0);
          osc.stop(t0 + p.dur + 0.03);
        });

        if (this.noiseBuffer) {
          const jingle = ctx.createBufferSource();
          jingle.buffer = this.noiseBuffer;
          const hpf = ctx.createBiquadFilter();
          hpf.type = 'highpass';
          hpf.frequency.setValueAtTime(4800, t0);
          const jGain = ctx.createGain();
          jGain.gain.setValueAtTime(0.0001, t0);
          jGain.gain.linearRampToValueAtTime(0.045, t0 + 0.01);
          jGain.gain.exponentialRampToValueAtTime(0.0004, t0 + 0.11);
          jingle.connect(hpf);
          hpf.connect(jGain);
          jGain.connect(this.sfxGain);
          jingle.start(t0);
          jingle.stop(t0 + 0.12);
        }
      });
    } catch (e) {}
  }

  playDrinkOrder() {
    const ctx = this.ensureContext();
    if (!ctx || this.muted || !this.sfxEnabled) return;

    try {
      const now = ctx.currentTime;
      // Warm gentle wooden cup-set chime + soft warm pour shimmer
      [587.33, 783.99].forEach((freq, idx) => {
        const t0 = now + idx * 0.085;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(0.11, t0 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0006, t0 + 0.34);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t0);
        osc.stop(t0 + 0.36);
      });

      if (this.noiseBuffer) {
        const pour = ctx.createBufferSource();
        pour.buffer = this.noiseBuffer;
        const bpf = ctx.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.setValueAtTime(1400, now);
        bpf.Q.value = 1.6;
        const pGain = ctx.createGain();
        pGain.gain.setValueAtTime(0.0001, now);
        pGain.gain.linearRampToValueAtTime(0.045, now + 0.04);
        pGain.gain.exponentialRampToValueAtTime(0.0004, now + 0.24);
        pour.connect(bpf);
        bpf.connect(pGain);
        pGain.connect(this.sfxGain);
        pour.start(now);
        pour.stop(now + 0.26);
      }
    } catch (e) {}
  }

  playCameraShutter(pan = 0, distanceScale = 1) {
    if (!this.ctx || this.ctx.state !== 'running' || this.muted || !this.sfxEnabled || document.hidden) return;
    const scale = Math.max(0, Math.min(1, Number(distanceScale) || 0));
    if (scale <= 0.04) return;

    try {
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (panner) {
        panner.pan.value = Math.max(-0.85, Math.min(0.85, pan));
        panner.connect(this.sfxGain);
      }
      const dest = panner || this.sfxGain;

      // Crisp two-stage DSLR/film mechanical shutter click ("찰-칵!")
      const clicks = [
        { offset: 0.0,   freq: 2700, q: 1.7, amp: 0.5 * scale,  dur: 0.032, thumpHz: 240 },
        { offset: 0.056, freq: 3450, q: 1.9, amp: 0.42 * scale, dur: 0.036, thumpHz: 320 }
      ];

      clicks.forEach((c) => {
        const t0 = now + c.offset;
        if (this.noiseBuffer) {
          const snap = ctx.createBufferSource();
          snap.buffer = this.noiseBuffer;
          const bpf = ctx.createBiquadFilter();
          bpf.type = 'bandpass';
          bpf.frequency.setValueAtTime(c.freq, t0);
          bpf.Q.value = c.q;

          const nGain = ctx.createGain();
          nGain.gain.setValueAtTime(0.0005, t0);
          nGain.gain.linearRampToValueAtTime(c.amp, t0 + 0.002);
          nGain.gain.exponentialRampToValueAtTime(0.0004, t0 + c.dur);

          snap.connect(bpf);
          bpf.connect(nGain);
          nGain.connect(dest);
          snap.start(t0, Math.random() * 0.4, c.dur + 0.01);
        }

        const thump = ctx.createOscillator();
        const tGain = ctx.createGain();
        thump.type = 'triangle';
        thump.frequency.setValueAtTime(c.thumpHz, t0);
        thump.frequency.exponentialRampToValueAtTime(85, t0 + 0.022);
        tGain.gain.setValueAtTime(0.15 * scale, t0);
        tGain.gain.exponentialRampToValueAtTime(0.0004, t0 + 0.028);
        thump.connect(tGain);
        tGain.connect(dest);
        thump.start(t0);
        thump.stop(t0 + 0.03);
      });
    } catch (e) {}
  }

  dispose() {
    this._stopBgmLoop();
    this._ambientStarted = false;
    if (this._ambientSources && this._ambientSources.length) {
      this._ambientSources.forEach((src) => {
        try {
          src.stop();
          src.disconnect();
        } catch (e) {}
      });
      this._ambientSources = [];
    }
    this._sizzleGain = null;
    this._sizzlePanner = null;
    this._fireGain = null;
    this._fireCrackleBus = null;
    this._firePanner = null;
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
