/**
 * Procedural sound engine using Web Audio API.
 * Exposes audio context for BGM integration — no internal casting needed.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  volume = 0.3;

  init(): void {
    if (this.ctx) return; // already initialized
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    } catch {
      // Web Audio not available
    }
  }

  /** Public API for BGM and other subsystems */
  getContext(): AudioContext | null { return this.ctx; }
  getDestination(): GainNode | null { return this.master; }

  private ensureContext(): void {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  get isMuted(): boolean { return this.muted; }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master) {
      this.master.gain.value = this.muted ? 0 : this.volume;
    }
    return this.muted;
  }

  // ── Sound Effects ──

  hit(): void {
    this.playTone(200 + this.rp(), 0.05, 'square', 0.15, this.rp() * 5);
  }

  kill(): void {
    this.playSweep(400 + this.rp() * 2, 100, 0.12, 'sawtooth', 0.2);
  }

  playerHit(): void {
    this.playSweep(300, 100, 0.15, 'square', 0.25);
    this.playNoise(0.08, 0.2);
  }

  xpPickup(): void {
    this.playTone(800 + this.rp() * 3, 0.04, 'sine', 0.1);
    this.playTone(1000 + this.rp() * 3, 0.04, 'sine', 0.08, 0, 0.05);
  }

  healthPickup(): void {
    this.playTone(523, 0.08, 'sine', 0.15);
    this.playTone(659, 0.08, 'sine', 0.12, 0, 0.08);
    this.playTone(784, 0.1, 'sine', 0.1, 0, 0.16);
  }

  levelUp(): void {
    [523, 659, 784, 1047].forEach((freq, i) => {
      this.playTone(freq, 0.15, 'sine', 0.2, 0, i * 0.08);
    });
  }

  weaponFire(type: 'projectile' | 'melee' | 'area' | 'orbit' = 'projectile'): void {
    switch (type) {
      case 'projectile':
        this.playTone(180, 0.06, 'square', 0.08);
        this.playNoise(0.03, 0.06);
        break;
      case 'melee':
        this.playSweep(250, 100, 0.1, 'sawtooth', 0.12);
        this.playNoise(0.05, 0.1);
        break;
      case 'area':
        this.playTone(100, 0.15, 'sine', 0.08);
        this.playTone(150, 0.1, 'sine', 0.06, 0, 0.05);
        break;
      case 'orbit': break;
    }
  }

  waveTransition(): void {
    this.playTone(220, 0.15, 'sine', 0.15);
    this.playTone(330, 0.15, 'sine', 0.12, 0, 0.1);
    this.playTone(440, 0.2, 'sine', 0.1, 0, 0.2);
  }

  bossWarning(): void {
    for (let i = 0; i < 3; i++) {
      this.playTone(100, 0.2, 'sawtooth', 0.3, 0, i * 0.3);
      this.playTone(120, 0.2, 'sawtooth', 0.2, 0, i * 0.3 + 0.05);
    }
  }

  chestOpen(): void {
    [392, 494, 587, 784, 988].forEach((freq, i) => {
      this.playTone(freq, 0.12, 'sine', 0.2 - i * 0.03, 0, i * 0.06);
    });
  }

  evolution(): void {
    for (let i = 0; i < 6; i++) {
      this.playTone(300 + i * 150, 0.2, 'sine', 0.25, 0, i * 0.1);
      this.playTone(305 + i * 150, 0.2, 'sine', 0.15, 0, i * 0.1);
    }
    this.playNoise(0.3, 0.1, 0.6);
  }

  goldPickup(): void {
    this.playTone(1200, 0.05, 'sine', 0.12);
    this.playTone(1500, 0.05, 'sine', 0.1, 0, 0.05);
  }

  /** Random pitch variation ±20% */
  private rp(): number {
    return (Math.random() - 0.5) * 40;
  }

  // ── Primitives ──

  private playTone(
    freq: number, duration: number, type: OscillatorType,
    volume: number, detune = 0, delay = 0
  ): void {
    if (!this.ctx || !this.master) return;
    this.ensureContext();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    const now = this.ctx.currentTime + delay;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  private playSweep(
    startFreq: number, endFreq: number, duration: number,
    type: OscillatorType, volume: number
  ): void {
    if (!this.ctx || !this.master) return;
    this.ensureContext();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  private playNoise(duration: number, volume: number, delay = 0): void {
    if (!this.ctx || !this.master) return;
    this.ensureContext();
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime + delay;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(gain);
    gain.connect(this.master);
    source.start(now);
  }
}

export const soundEngine = new SoundEngine();
