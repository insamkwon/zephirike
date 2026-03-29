import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/styles';

/**
 * VFX — Survivor.io-style bright, impactful visual effects
 * - Bigger, brighter particle bursts
 * - Bold, bouncing damage numbers
 * - Vivid screen effects
 * - Satisfying kill/pickup feedback
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
    gradient.addColorStop(0.25, 'rgba(255,255,255,0.7)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    canvas.refresh();
    this.glowTextureReady = true;
  }

  private setupVignette(): void {
    try {
      this.damageVignette = this.scene.cameras.main.postFX.addVignette(0.5, 0.5, 0.9, 0.12);
    } catch {
      this.damageVignette = null;
    }
  }

  // ── Screen Effects ──

  shake(intensity = 0.005, duration = 100): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  flashDamage(): void {
    this.scene.cameras.main.flash(100, 200, 30, 30, true);
    if (this.damageVignette) {
      this.scene.tweens.add({
        targets: this.damageVignette,
        strength: 0.6,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    }
  }

  flashWhite(duration = 60): void {
    this.scene.cameras.main.flash(duration, 255, 255, 255, true);
  }

  /** Level-up bloom — golden burst */
  levelUpBloom(): void {
    try {
      const bloom = this.scene.cameras.main.postFX.addBloom(0xffdd44, 1, 1, 1.4, 2.0, 4);
      this.scene.tweens.add({
        targets: bloom,
        strength: 0,
        duration: 700,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          this.scene.cameras.main.postFX.remove(bloom);
        },
      });
    } catch {
      this.scene.cameras.main.flash(300, 255, 215, 0, true);
    }
  }

  // ── Particle Effects ──

  /** Death burst — big, bright, satisfying */
  deathBurst(x: number, y: number, color: number, count = 10): void {
    const texture = this.glowTextureReady ? 'soft_glow' : 'xp_gem';

    // Primary burst — white + enemy color
    const emitter = this.scene.add.particles(x, y, texture, {
      speed: { min: 80, max: 250 },
      scale: { start: 1.0, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 200, max: 500 },
      tint: [color, 0xffffff, color],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
      rotate: { min: 0, max: 360 },
    });
    emitter.setDepth(15);
    emitter.explode(count);

    // Secondary white sparkle ring for big kills
    if (count >= 12) {
      const ring = this.scene.add.particles(x, y, texture, {
        speed: { min: 150, max: 350 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: { min: 250, max: 550 },
        tint: [0xffffff, 0xFFD700],
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      });
      ring.setDepth(15);
      ring.explode(Math.floor(count / 2));
      this.scene.time.delayedCall(650, () => ring.destroy());
    }

    this.scene.time.delayedCall(600, () => emitter.destroy());
  }

  /** XP pickup — upward golden sparkle */
  pickupSparkle(x: number, y: number): void {
    const texture = this.glowTextureReady ? 'soft_glow' : 'xp_gem';
    const emitter = this.scene.add.particles(x, y, texture, {
      speed: { min: 40, max: 100 },
      angle: { min: 230, max: 310 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 350,
      tint: [0xFFD700, 0xffffff, 0xFFB300],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    emitter.setDepth(15);
    emitter.explode(8);
    this.scene.time.delayedCall(400, () => emitter.destroy());
  }

  /** Chest open — gold/white fountain */
  chestBurst(x: number, y: number): void {
    const texture = this.glowTextureReady ? 'soft_glow' : 'gold_coin';
    const colors = [0xFFD700, 0xFFB300, 0xffffff, 0x66DD66];
    const emitter = this.scene.add.particles(x, y, texture, {
      speed: { min: 120, max: 300 },
      angle: { min: 220, max: 320 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 400, max: 900 },
      tint: colors,
      gravityY: 200,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    emitter.setDepth(20);
    emitter.explode(30);
    this.scene.time.delayedCall(1000, () => emitter.destroy());
  }

  /** Heal sparkle — green upward */
  healSparkle(x: number, y: number): void {
    const texture = this.glowTextureReady ? 'soft_glow' : 'heart';
    const emitter = this.scene.add.particles(x, y, texture, {
      speed: { min: 25, max: 60 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      tint: [0x66DD66, 0x88ffaa, 0xffffff],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    emitter.setDepth(15);
    emitter.explode(5);
    this.scene.time.delayedCall(450, () => emitter.destroy());
  }

  /** Crit impact — bright flash + screen punch */
  critImpact(x: number, y: number, color = 0xFFD700): void {
    this.flashWhite(40);
    this.shake(0.004, 70);

    const texture = this.glowTextureReady ? 'soft_glow' : 'xp_gem';
    const emitter = this.scene.add.particles(x, y, texture, {
      speed: { min: 100, max: 220 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 150, max: 400 },
      tint: [color, 0xffffff],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    emitter.setDepth(16);
    emitter.explode(10);
    this.scene.time.delayedCall(450, () => emitter.destroy());
  }

  /** Ghost teleport flash */
  teleportEffect(x: number, y: number): void {
    const texture = this.glowTextureReady ? 'soft_glow' : 'xp_gem';
    const emitter = this.scene.add.particles(x, y, texture, {
      speed: { min: 50, max: 120 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 350,
      tint: [0x8888ff, 0xccccff, 0xffffff],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    emitter.setDepth(6);
    emitter.explode(12);
    this.scene.time.delayedCall(400, () => emitter.destroy());
  }

  /** Charge trail — fire particles */
  chargeTrail(x: number, y: number, color = 0xff6600): void {
    const texture = this.glowTextureReady ? 'soft_glow' : 'xp_gem';
    const emitter = this.scene.add.particles(x, y, texture, {
      speed: { min: 15, max: 50 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 300,
      tint: [color, 0xFFB300],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    emitter.setDepth(4);
    emitter.explode(4);
    this.scene.time.delayedCall(350, () => emitter.destroy());
  }

  /** Gold pickup shimmer */
  goldSparkle(x: number, y: number): void {
    const texture = this.glowTextureReady ? 'soft_glow' : 'gold_coin';
    const emitter = this.scene.add.particles(x, y, texture, {
      speed: { min: 25, max: 60 },
      angle: { min: 230, max: 310 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 280,
      tint: [0xFFD700, 0xFFB300, 0xffffff],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    emitter.setDepth(15);
    emitter.explode(5);
    this.scene.time.delayedCall(330, () => emitter.destroy());
  }

  // ── Text Effects ──

  /** Floating damage number — bold, bouncing, scaled by damage */
  damageNumber(x: number, y: number, amount: number, isCrit = false): void {
    const fontSize = isCrit ? '22px' : '15px';
    const color = isCrit ? '#FFD700' : '#ffffff';
    const text = this.scene.add.text(x, y - 12, `${amount}`, {
      fontSize, fontFamily: FONT_FAMILY, fontStyle: '800',
      color,
      stroke: '#000000', strokeThickness: isCrit ? 4 : 3,
    }).setOrigin(0.5).setDepth(20);

    if (isCrit) {
      text.setBlendMode(Phaser.BlendModes.ADD);
      text.setScale(1.6);
    }

    const sizeBonus = Math.min(amount / 50, 1) * 0.5;

    // Bounce up animation
    this.scene.tweens.add({
      targets: text,
      y: y - (isCrit ? 80 : 55),
      alpha: 0,
      scale: isCrit ? 1.3 + sizeBonus : 1 + sizeBonus * 0.5,
      duration: isCrit ? 900 : 650,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  /** Floating heal number */
  healNumber(x: number, y: number, amount: number): void {
    const text = this.scene.add.text(x, y - 12, `+${amount}`, {
      fontSize: '16px', fontFamily: FONT_FAMILY, fontStyle: '800',
      color: '#66DD66',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);

    this.scene.tweens.add({
      targets: text,
      y: y - 45,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  // ── Announcements ──

  bossWarning(text = 'BOSS INCOMING!'): void {
    const cam = this.scene.cameras.main;
    cam.flash(500, 100, 0, 0, true);
    this.shake(0.012, 500);

    // Full-width red banner
    const bg = this.scene.add.rectangle(
      cam.width / 2, cam.height * 0.2, cam.width, 80, 0x000000, 0.85
    ).setScrollFactor(0).setDepth(450);

    // Red accent stripes
    const stripeL = this.scene.add.rectangle(
      0, cam.height * 0.2, 8, 80, 0xFF4444, 1
    ).setScrollFactor(0).setDepth(451).setOrigin(0, 0.5);

    const stripeR = this.scene.add.rectangle(
      cam.width, cam.height * 0.2, 8, 80, 0xFF4444, 1
    ).setScrollFactor(0).setDepth(451).setOrigin(1, 0.5);

    const label = this.scene.add.text(cam.width / 2, cam.height * 0.2, text, {
      fontSize: '40px', fontFamily: FONT_FAMILY, fontStyle: '900',
      color: '#FF4444',
      stroke: '#000000', strokeThickness: 6,
    }).setScrollFactor(0).setDepth(452).setOrigin(0.5).setAlpha(0);

    // Scale in from big
    this.scene.tweens.add({
      targets: label,
      alpha: 1,
      scale: { from: 2.5, to: 1 },
      duration: 350,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Pulse
        this.scene.tweens.add({
          targets: label,
          alpha: { from: 1, to: 0.3 },
          yoyo: true,
          repeat: 3,
          duration: 180,
          onComplete: () => {
            this.scene.tweens.add({
              targets: [bg, label, stripeL, stripeR],
              alpha: 0,
              duration: 400,
              onComplete: () => {
                bg.destroy(); label.destroy();
                stripeL.destroy(); stripeR.destroy();
              },
            });
          },
        });
      },
    });
  }

  killStreak(count: number): void {
    let msg = '';
    let color = '#ffffff';
    if (count >= 500) { msg = `${count} KILLS! GODLIKE!`; color = '#FF44FF'; }
    else if (count >= 300) { msg = `${count} KILLS! LEGENDARY!`; color = '#FF4444'; }
    else if (count >= 200) { msg = `${count} KILLS! UNSTOPPABLE!`; color = '#FF6644'; }
    else if (count >= 100) { msg = `${count} KILLS! MASSACRE!`; color = '#FF9500'; }
    else if (count >= 50) { msg = `${count} KILLS! RAMPAGE!`; color = '#FFB300'; }
    else if (count >= 25) { msg = `${count} KILLS!`; color = '#FFD700'; }
    else return;

    const cam = this.scene.cameras.main;
    cam.flash(80, 255, 215, 0, true);
    this.shake(0.005, 120);

    const text = this.scene.add.text(cam.width / 2, cam.height * 0.35, msg, {
      fontSize: count >= 200 ? '32px' : '26px',
      fontFamily: FONT_FAMILY, fontStyle: '900',
      color,
      stroke: '#000000', strokeThickness: 5,
    }).setScrollFactor(0).setDepth(300).setOrigin(0.5).setAlpha(0);

    this.scene.tweens.add({
      targets: text,
      alpha: 1,
      scale: { from: 0.3, to: 1.3 },
      duration: 280,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: text,
          alpha: 0,
          scale: 1.5,
          y: text.y - 25,
          duration: 600,
          delay: 500,
          ease: 'Cubic.easeIn',
          onComplete: () => text.destroy(),
        });
      },
    });
  }

  /** Wave announcement — bright banner */
  waveAnnouncement(waveNum: number): void {
    const cam = this.scene.cameras.main;
    this.shake(0.004, 150);

    const bg = this.scene.add.rectangle(
      cam.width / 2, cam.height * 0.25, 0, 56, 0x000000, 0.6
    ).setScrollFactor(0).setDepth(299);

    const text = this.scene.add.text(cam.width / 2, cam.height * 0.25, `WAVE ${waveNum}`, {
      fontSize: '24px', fontFamily: FONT_FAMILY, fontStyle: '800',
      color: '#4FC3F7',
      stroke: '#000000', strokeThickness: 4,
    }).setScrollFactor(0).setDepth(300).setOrigin(0.5).setAlpha(0);

    this.scene.tweens.add({
      targets: bg, width: 320, duration: 200, ease: 'Cubic.easeOut',
    });

    this.scene.tweens.add({
      targets: text,
      alpha: 1,
      scale: { from: 0.4, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: [text, bg],
          alpha: 0,
          duration: 400,
          delay: 800,
          onComplete: () => { text.destroy(); bg.destroy(); },
        });
      },
    });
  }

  evolutionGlow(x: number, y: number): void {
    this.levelUpBloom();
    this.chestBurst(x, y);
    this.shake(0.02, 500);
    this.scene.cameras.main.flash(400, 255, 215, 0, true);
  }

  screenFlash(color = 0xffffff, _alpha = 0.4, duration = 300): void {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    this.scene.cameras.main.flash(duration, r, g, b, true);
  }

  /** Boss AoE ring — telegraph + expanding ring + particles */
  bossAoeRing(x: number, y: number, radius: number): void {
    // Warning telegraph
    const telegraph = this.scene.add.circle(x, y, radius, 0xff0000, 0.18).setDepth(2);
    this.scene.tweens.add({
      targets: telegraph,
      alpha: { from: 0.18, to: 0.35 },
      yoyo: true,
      repeat: 2,
      duration: 150,
      onComplete: () => telegraph.destroy(),
    });

    // Expanding ring
    const ring = this.scene.add.circle(x, y, 10, 0xff4444, 0.5).setDepth(3);
    this.scene.tweens.add({
      targets: ring,
      radius: radius,
      alpha: 0,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });

    // Ground particles
    const texture = this.glowTextureReady ? 'soft_glow' : 'xp_gem';
    const emitter = this.scene.add.particles(x, y, texture, {
      speed: { min: 50, max: 150 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: { min: 200, max: 450 },
      tint: [0xff6600, 0xff0000, 0xFFB300],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    emitter.setDepth(3);
    emitter.explode(15);
    this.scene.time.delayedCall(550, () => emitter.destroy());
  }
}
