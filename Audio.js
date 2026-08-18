'use strict';
class CirclethingAudio {
  _audioCtx = null;
  _noiseBuffer = null;
  _audioSettings = {
    baseFreq: 440,
    minGain: 0.0001,
    noiseDuration: 0.05,
  };
  _filterSettings = {
    centerMin: 1800,
    centerMax: 6500,
    centerScale: 5,
  };
  _slapbackSettings = {
    maxDelay: 0.12,
    delayTime: 0.045,
    feedback: 0.18,
    wet: 0.16,
    lowpass: 4200,
  };
  _clickPrimarySettings = {
    startOffset: 0,
    stopOffset: 0.04,
    attackEndOffset: 0.0015,
    peak: 0.28,
    releaseEndOffset: 0.018,
    hpScale: 0.7,
    lpScale: 1.5,
  };
  _clickSecondarySettings = {
    startOffset: 0.003,
    stopOffset: 0.045,
    attackEndOffset: 0.006,
    peak: 0.12,
    releaseEndOffset: 0.03,
    hpScale: 0.45,
    lpScale: null,
  };
  _toneSettings = {
    type: 'sine',
    peak: 0.045,
    attackEndOffset: 0.004,
    releaseEndOffset: 0.14,
    stopOffset: 0.16,
  };

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

  get noiseBuffer() {
    try {
      const ctx = this.context;
      if (!ctx) return null;
      if (this._noiseBuffer) return this._noiseBuffer;

      // Reusable white-noise buffer used to synthesize click transients.
      const duration = this._audioSettings.noiseDuration;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1);
      }
      this._noiseBuffer = buffer;
      return this._noiseBuffer;
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
    const step = this._scale[size] ?? this._scale[3];
    this.playTone(this.stepFreq(step));
  }

  stepFreq(step) {
    const base = this._audioSettings.baseFreq; // A4
    return base * Math.pow(2, step / 12);
  }

  playTone(freq) {
    try {
      const ctx = this.context;
      if (!ctx) return;
      const noise = this.noiseBuffer;
      if (!noise) return;

      const now = ctx.currentTime;
      const slapDelay = this._createSlapback(ctx, now);

      // Map combo pitch to filter center so larger combos still sound distinct.
      const center = this._mapPitchToClickFilterCenter(freq);
      const clickAConfig = this._clickPrimarySettings;
      const clickBConfig = this._clickSecondarySettings;

      const clickA = this._createNoiseTap(ctx, noise, now, clickAConfig, center);
      this._routeToOutput(ctx, clickA, slapDelay);

      // Tiny delayed second tap adds a natural mechanical "clack".
      const clickB = this._createNoiseTap(ctx, noise, now, clickBConfig, center);
      this._routeToOutput(ctx, clickB, slapDelay);

      // Subtle tonal layer under the click so the sound is both percussive and musical.
      const toneLayer = this._createToneLayer(ctx, now, freq);
      this._routeToOutput(ctx, toneLayer, slapDelay);
    } catch (e) {
      // fail silently if audio can't be created
    }
  }

  _mapPitchToClickFilterCenter(freq) {
    return Math.min(
      this._filterSettings.centerMax,
      Math.max(this._filterSettings.centerMin, freq * this._filterSettings.centerScale)
    );
  }

  _createSlapback(ctx, now) {
    const slapDelay = ctx.createDelay(this._slapbackSettings.maxDelay);
    const slapFeedback = ctx.createGain();
    const slapWet = ctx.createGain();
    const slapTone = ctx.createBiquadFilter();

    // Short slapback tail: one obvious echo and a very faint follow-up.
    slapDelay.delayTime.setValueAtTime(this._slapbackSettings.delayTime, now);
    slapFeedback.gain.setValueAtTime(this._slapbackSettings.feedback, now);
    slapWet.gain.setValueAtTime(this._slapbackSettings.wet, now);
    slapTone.type = 'lowpass';
    slapTone.frequency.setValueAtTime(this._slapbackSettings.lowpass, now);

    slapDelay.connect(slapFeedback);
    slapFeedback.connect(slapDelay);
    slapDelay.connect(slapTone);
    slapTone.connect(slapWet);
    slapWet.connect(ctx.destination);

    return slapDelay;
  }

  _routeToOutput(ctx, node, slapDelay) {
    node.connect(ctx.destination);
    node.connect(slapDelay);
  }

  /**
   * @typedef {Object} NoiseTapConfig
   * @property {number} startOffset Seconds from now when this tap starts.
   * @property {number} stopOffset Seconds from now when this tap stops.
   * @property {number} attackEndOffset Seconds from now when attack reaches peak.
   * @property {number} peak Peak gain value for the tap envelope.
   * @property {number} releaseEndOffset Seconds from now when envelope reaches silence.
   * @property {number} hpScale Multiplier for center frequency to produce HP cutoff.
   * @property {?number} lpScale Optional multiplier for center frequency to produce LP cutoff.
   */

  /** @param {NoiseTapConfig} config */
  _createNoiseTap(ctx, noise, now, config, center) {
    const {
      startOffset,
      stopOffset,
      attackEndOffset,
      peak,
      releaseEndOffset,
      hpScale,
      lpScale,
    } = config;
    const hpFreq = center * hpScale;
    const lpFreq = lpScale ? center * lpScale : null;

    const source = ctx.createBufferSource();
    source.buffer = noise;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(hpFreq, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this._audioSettings.minGain, now + startOffset);
    gain.gain.exponentialRampToValueAtTime(peak, now + attackEndOffset);
    gain.gain.exponentialRampToValueAtTime(this._audioSettings.minGain, now + releaseEndOffset);

    source.connect(hp);

    if (lpFreq) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(lpFreq, now);
      hp.connect(lp);
      lp.connect(gain);
    } else {
      hp.connect(gain);
    }

    source.start(now + startOffset);
    source.stop(now + stopOffset);
    return gain;
  }

  _createToneLayer(ctx, now, freq) {
    const toneOsc = ctx.createOscillator();
    toneOsc.type = this._toneSettings.type;
    toneOsc.frequency.setValueAtTime(freq, now);

    const toneGain = ctx.createGain();
    toneGain.gain.setValueAtTime(this._audioSettings.minGain, now);
    toneGain.gain.exponentialRampToValueAtTime(this._toneSettings.peak, now + this._toneSettings.attackEndOffset);
    toneGain.gain.exponentialRampToValueAtTime(this._audioSettings.minGain, now + this._toneSettings.releaseEndOffset);

    toneOsc.connect(toneGain);
    toneOsc.start(now);
    toneOsc.stop(now + this._toneSettings.stopOffset);
    return toneGain;
  }

}
