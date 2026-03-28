/**
 * Procedural BGM — recreates oscillators on each start() to avoid
 * Web Audio's "stopped oscillators can't restart" limitation.
 */
export class BGM {
  private ctx: AudioContext | null = null;
  private destination: AudioNode | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private lfo: OscillatorNode | null = null;
  private bassGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private pulseGain: GainNode | null = null;
  private bassOsc: OscillatorNode | null = null;
  private padOsc2: OscillatorNode | null = null;
  private playing = false;

  start(audioCtx: AudioContext, dest: AudioNode): void {
    // Always clean up before starting fresh
    this.stop();

    this.ctx = audioCtx;
    this.destination = dest;
    this.playing = true;
    this.oscillators = [];
    this.gains = [];

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.12;
    this.masterGain.connect(this.destination);

    // Bass drone
    this.bassGain = this.createGain(0.4);
    this.bassOsc = this.createOsc('sawtooth', 55);
    const bassFilter = this.ctx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 120;
    this.bassOsc.connect(bassFilter);
    bassFilter.connect(this.bassGain);

    // Pad
    this.padGain = this.createGain(0.15);
    this.createOsc('sine', 165).connect(this.padGain);
    this.padOsc2 = this.createOsc('sine', 220);
    this.padOsc2.connect(this.padGain);

    // Pulse (LFO-driven)
    this.pulseGain = this.createGain(0);
    const pulseOsc = this.createOsc('triangle', 110);
    const pulseFilter = this.ctx.createBiquadFilter();
    pulseFilter.type = 'bandpass';
    pulseFilter.frequency.value = 200;
    pulseFilter.Q.value = 2;
    pulseOsc.connect(pulseFilter);
    pulseFilter.connect(this.pulseGain);

    // LFO
    this.lfo = this.createOsc('square', 2);
    const lfoGain = this.createGain(0.08);
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.pulseGain.gain);

    // Start all
    for (const osc of this.oscillators) osc.start();
  }

  setIntensity(elapsedSeconds: number, maxSeconds: number): void {
    if (!this.ctx || !this.playing) return;
    const intensity = Math.min(1, elapsedSeconds / maxSeconds);
    const now = this.ctx.currentTime;

    if (this.bassOsc) this.bassOsc.frequency.setTargetAtTime(55 + intensity * 30, now, 2);
    if (this.bassGain) this.bassGain.gain.setTargetAtTime(0.3 + intensity * 0.3, now, 1);
    if (this.padOsc2) this.padOsc2.frequency.setTargetAtTime(intensity > 0.5 ? 208 : 220, now, 3);
    if (this.padGain) this.padGain.gain.setTargetAtTime(0.1 + intensity * 0.15, now, 1);
    if (this.pulseGain) {
      const vol = intensity > 0.3 ? (intensity - 0.3) * 0.15 : 0;
      this.pulseGain.gain.setTargetAtTime(vol, now, 1);
    }
    if (this.lfo) this.lfo.frequency.setTargetAtTime(2 + intensity * 3, now, 2);
  }

  stop(): void {
    if (!this.playing) return;
    this.playing = false;

    for (const osc of this.oscillators) {
      try { osc.stop(); } catch { /* already stopped */ }
    }
    this.masterGain?.disconnect();

    // Null out all refs so setIntensity is safe after stop
    this.oscillators = [];
    this.gains = [];
    this.bassOsc = null;
    this.padOsc2 = null;
    this.lfo = null;
    this.bassGain = null;
    this.padGain = null;
    this.pulseGain = null;
    this.masterGain = null;
  }

  // ── Helpers ──

  private createOsc(type: OscillatorType, freq: number): OscillatorNode {
    const osc = this.ctx!.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    this.oscillators.push(osc);
    return osc;
  }

  private createGain(value: number): GainNode {
    const gain = this.ctx!.createGain();
    gain.gain.value = value;
    gain.connect(this.masterGain!);
    this.gains.push(gain);
    return gain;
  }
}

export const bgm = new BGM();
