'use strict';
class CirclethingAudio {
  _audioCtx = null;

  get context() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this._audioCtx) this._audioCtx = new AudioCtx();
      return this._audioCtx;
    } catch (e) {
      return null;
    }
  }

  _scale = {
    3: 0,
    4: 2,
    5: 4,
    6: 5,
    7: 7,
    8: 9,
    9: 11,
    10: 12,
    11: 14,
    12: 16,
    13: 17,
    14: 19,
    15: 21,
    16: 22,
    17: 23,
    18: 25
  }; // major scale

  playComboSound(combo) {
    // frequency maps to combo size and color
    const size = combo.length || 3;
    const step = this._scale[size];
    this.playTone(this.stepFreq(step));
  }

  stepFreq(step) {
    const base = 440;
    return base * Math.pow(2, step / 12);
  }

  playTone(freq) {
    try {
      const ctx = this.context;
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // short envelope: quick attack, short decay
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.50);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {
      // fail silently if audio can't be created
    }
  }

}
