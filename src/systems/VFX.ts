import Phaser from 'phaser';
import { TEXT_STYLES } from '../config/styles';

/**
 * VFX using proper Phaser 3.80 features:
 * - camera.flash/shake for screen effects
 * - camera.postFX for vignette/bloom
 * - Particle emitters for death bursts
 * - ADD blend mode for glow
 * - Procedural radial gradient for soft glow texture
 */
export class VFX {
  private scene: Phaser.Scene;
  private glowTextureReady = false;
  private damageVignette: Phaser.FX.Vignette | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createGlowTexture();
    this.setupVignette();
  }

  /** Create a radial gradient texture for glow effects */
  private createGlowTexture(): void {
    if (this.scene.textures.exists('soft_glow')) {
      this.glowTextureReady = true;
      return;
    }
    const canvas = this.scene.textures.createCanvas('soft_glow', 32, 32);
    if (!canvas) return;
    const ctx = canvas.getContext();
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    canvas.refresh();
    this.glowTextureReady = true;
  }

  /** Setup persistent damage vignette on camera */
  private setupVignette(): void {
    try {
      this.damageVignette = this.scene.cameras.main.postFX.addVignette(0.5, 0.5, 0.9, 0.15);
    } catch {
      // Canvas renderer — no postFX
      this.damageVignette = null;
    }
  }

  // ── Screen Effects (Phaser built-in) ──

  shake(intensity = 0.005, duration = 100): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  /** Camera flash — white for kills, red for damage */
  flashDamage(): void {
    this.scene.cameras.main.flash(120, 180, 0, 0, true);
    if (this.damageVignette) {
      this.scene.tweens.add({
        targets: this.damageVignette,
        strength: 0.7,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    }
  }

  flashWhite(duration = 80): void {
    this.scene.cameras.main.flash(duration, 255, 255, 255, true);
  }

  /** Level-up bloom burst */
  levelUpBloom(): void {
    try {
      const bloom = this.scene.cameras.main.postFX.addBloom(0xffdd44, 1, 1, 1, 1.5, 4);
      this.scene.tweens.add({
        targets: bloom,
        strength: 0,
        duration: 400,
        onComplete: () => {
          this.scene.cameras.main.postFX.remove(bloom);
        },
      });
    } catch {
      // Fallback: simple flash
      this.scene.cameras.main.flash(200, 255, 220, 100, true);
    }
  }

  // ── Particle Effects ──

  /** Death burst using Phaser particle emitter with ADD blend */
  deathBurst(x: number, y: number, color: number, count = 8): void {
    const texture = this.glowTextureReady ? 'soft_glow' : 'xp_gem';
    const emitter = this.scene.add.particles(x, y, texture, {
      speed: { min: 60, max: 180 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 150, max: 400 },
      tint: color,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    emitter.setDepth(15);
    emitter.explode(count);
    // Auto-destroy after particles die
    this.scene.time.delayedCall(500, () => emitter.destroy());
  }

  /** XP pickup sparkle — small upward burst */
  pickupSparkle(x: number, y: number): void {
    const texture = this.glowTextureReady ? 'soft_glow' : 'xp_gem';
    const emitter = this.scene.add.particles(x, y, texture, {
      speed: { min: 20, max: 60 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 250,
      tint: 0xffff88,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    emitter.setDepth(15);
    emitter.explode(5);
    this.scene.time.delayedCall(300, () => emitter.destroy());
  }

  /** Chest open — gold particle fountain */
  chestBurst(x: number, y: number): void {
    const texture = this.glowTextureReady ? 'soft_glow' : 'gold_coin';
    const colors = [0xffdd44, 0xffaa00, 0xffffff, 0x44ddff];
    const emitter = this.scene.add.particles(x, y, texture, {
      speed: { min: 80, max: 200 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 300, max: 600 },
      tint: colors,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    emitter.setDepth(20);
    emitter.explode(20);
    this.scene.time.delayedCall(700, () => emitter.destroy());
  }

  // ── Text Effects ──

  /** Floating damage number */
  damageNumber(x: number, y: number, amount: number, isCrit = false): void {
    const style = isCrit ? TEXT_STYLES.damageCrit : TEXT_STYLES.damage;
    const text = this.scene.add.text(x, y - 10, `${amount}`, style)
      .setOrigin(0.5).setDepth(20);

    if (isCrit) text.setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: text,
      y: y - 55,
      alpha: 0,
      scale: isCrit ? 1.3 : 1,
      duration: 600,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  // ── Announcements ──

  bossWarning(text = 'BOSS INCOMING!'): void {
    const cam = this.scene.cameras.main;
    cam.flash(400, 80, 0, 0, true);
    this.shake(0.008, 300);

    const bg = this.scene.add.rectangle(
      cam.width / 2, cam.height * 0.2, cam.width, 60, 0x000000, 0.7
    ).setScrollFactor(0).setDepth(450);

    const label = this.scene.add.text(cam.width / 2, cam.height * 0.2, text, {
      fontSize: '32px', fontFamily: '"Courier New", monospace', color: '#ff0000',
      stroke: '#000000', strokeThickness: 5,
    }).setScrollFactor(0).setDepth(451).setOrigin(0.5);

    this.scene.tweens.add({
      targets: [label],
      alpha: { from: 1, to: 0.3 }, yoyo: true, repeat: 3, duration: 250,
      onComplete: () => {
        this.scene.tweens.add({
          targets: [bg, label], alpha: 0, duration: 400,
          onComplete: () => { bg.destroy(); label.destroy(); },
        });
      },
    });
  }

  killStreak(count: number): void {
    let msg = '';
    let color = '#ffffff';
    if (count >= 100) { msg = `${count} KILLS! UNSTOPPABLE!`; color = '#ff4444'; }
    else if (count >= 50) { msg = `${count} KILLS! MASSACRE!`; color = '#ff8844'; }
    else if (count >= 25) { msg = `${count} KILLS! RAMPAGE!`; color = '#ffdd44'; }
    else return;

    const cam = this.scene.cameras.main;
    cam.flash(60, 255, 220, 100, true);

    const text = this.scene.add.text(cam.width / 2, cam.height * 0.35, msg, {
      ...TEXT_STYLES.announcement, color,
    }).setScrollFactor(0).setDepth(300).setOrigin(0.5).setAlpha(0);

    this.scene.tweens.add({
      targets: text, alpha: 1, scale: { from: 0.5, to: 1.2 },
      duration: 300, yoyo: true, hold: 500,
      onComplete: () => text.destroy(),
    });
  }

  evolutionGlow(x: number, y: number): void {
    this.levelUpBloom();
    this.chestBurst(x, y);
    this.shake(0.012, 300);
  }

  screenFlash(color = 0xffffff, _alpha = 0.4, duration = 300): void {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    this.scene.cameras.main.flash(duration, r, g, b, true);
  }
}
