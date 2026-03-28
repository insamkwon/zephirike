/**
 * Procedural background music using Web Audio API.
 * Dark ambient drone that intensifies as the game progresses.
 * Layers: bass drone, pad, arpeggiated pulse.
 */
export class BGM {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bassOsc: OscillatorNode | null = null;
  private padOsc1: OscillatorNode | null = null;
  private padOsc2: OscillatorNode | null = null;
  private pulseOsc: OscillatorNode | null = null;
  private pulseGain: GainNode | null = null;
  private bassGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private playing = false;
  private intensity = 0; // 0-1

  start(audioCtx: AudioContext, destination: AudioNode): void {
    if (this.playing) return;
    this.ctx = audioCtx;
    this.playing = true;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.12;
    this.masterGain.connect(destination);

    // Bass drone (low rumble)
    this.bassGain = this.ctx.createGain();
    this.bassGain.gain.value = 0.4;
    this.bassGain.connect(this.masterGain);

    this.bassOsc = this.ctx.createOscillator();
    this.bassOsc.type = 'sawtooth';
    this.bassOsc.frequency.value = 55; // A1
    const bassFilter = this.ctx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 120;
    this.bassOsc.connect(bassFilter);
    bassFilter.connect(this.bassGain);
    this.bassOsc.start();

    // Pad (ambient chord)
    this.padGain = this.ctx.createGain();
    this.padGain.gain.value = 0.15;
    this.padGain.connect(this.masterGain);

    this.padOsc1 = this.ctx.createOscillator();
    this.padOsc1.type = 'sine';
    this.padOsc1.frequency.value = 165; // E3
    this.padOsc1.connect(this.padGain);
    this.padOsc1.start();

    this.padOsc2 = this.ctx.createOscillator();
    this.padOsc2.type = 'sine';
    this.padOsc2.frequency.value = 220; // A3
    this.padOsc2.connect(this.padGain);
    this.padOsc2.start();

    // Pulse (rhythmic element, driven by LFO)
    this.pulseGain = this.ctx.createGain();
    this.pulseGain.gain.value = 0;
    this.pulseGain.connect(this.masterGain);

    this.pulseOsc = this.ctx.createOscillator();
    this.pulseOsc.type = 'triangle';
    this.pulseOsc.frequency.value = 110;
    const pulseFilter = this.ctx.createBiquadFilter();
    pulseFilter.type = 'bandpass';
    pulseFilter.frequency.value = 200;
    pulseFilter.Q.value = 2;
    this.pulseOsc.connect(pulseFilter);
    pulseFilter.connect(this.pulseGain);
    this.pulseOsc.start();

    // LFO for pulse rhythm
    this.lfo = this.ctx.createOscillator();
    this.lfo.type = 'square';
    this.lfo.frequency.value = 2; // 2 Hz = 120 BPM feel
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.08;
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.pulseGain.gain);
    this.lfo.start();
  }

  /** Update intensity based on elapsed game time (0-900s) */
  setIntensity(elapsedSeconds: number, maxSeconds: number): void {
    if (!this.ctx || !this.playing) return;
    this.intensity = Math.min(1, elapsedSeconds / maxSeconds);

    const now = this.ctx.currentTime;

    // Bass gets louder and higher over time
    if (this.bassOsc) {
      this.bassOsc.frequency.setTargetAtTime(55 + this.intensity * 30, now, 2);
    }
    if (this.bassGain) {
      this.bassGain.gain.setTargetAtTime(0.3 + this.intensity * 0.3, now, 1);
    }

    // Pad shifts to minor chord at high intensity
    if (this.padOsc2) {
      const freq = this.intensity > 0.5 ? 208 : 220; // Ab3 vs A3
      this.padOsc2.frequency.setTargetAtTime(freq, now, 3);
    }
    if (this.padGain) {
      this.padGain.gain.setTargetAtTime(0.1 + this.intensity * 0.15, now, 1);
    }

    // Pulse kicks in after 30% intensity
    if (this.pulseGain) {
      const pulseVol = this.intensity > 0.3 ? (this.intensity - 0.3) * 0.15 : 0;
      this.pulseGain.gain.setTargetAtTime(pulseVol, now, 1);
    }

    // LFO speeds up
    if (this.lfo) {
      this.lfo.frequency.setTargetAtTime(2 + this.intensity * 3, now, 2);
    }
  }

  stop(): void {
    if (!this.playing) return;
    this.playing = false;
    [this.bassOsc, this.padOsc1, this.padOsc2, this.pulseOsc, this.lfo].forEach(osc => {
      try { osc?.stop(); } catch { /* already stopped */ }
    });
    this.masterGain?.disconnect();
  }
}

export const bgm = new BGM();
