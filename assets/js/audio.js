// ===================================================================
// 시간의 방 - Lightweight Sound Effects Engine (BGM 기능 삭제됨)
// ===================================================================

class MysticalAudioEngine {
  constructor() {
    this.ctx = null;
    this.sfxGain = null;

    // Remove any legacy floating sound toggle buttons from DOM
    const oldBtn = document.getElementById('mystic-sound-toggle');
    if (oldBtn) {
      oldBtn.remove();
    }
  }

  initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        this.sfxGain.connect(this.ctx.destination);
      }
    } catch (e) {}
  }

  async resumeContext() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {}
    }
  }

  // Soft Card Flip SFX
  async playCardFlip() {
    try {
      await this.resumeContext();
      if (!this.ctx || !this.sfxGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  // Mystical Crystal Bell Chime SFX
  async playMysticChime() {
    try {
      await this.resumeContext();
      if (!this.ctx || !this.sfxGain) return;

      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const delay = idx * 0.045;
        const noteStart = now + delay;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.12, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.7);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(noteStart);
        osc.stop(noteStart + 0.72);
      });
    } catch (e) {}
  }
}

// Global Singleton
window.MysticalAudio = new MysticalAudioEngine();
