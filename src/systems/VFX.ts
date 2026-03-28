import Phaser from 'phaser';
import { TEXT_STYLES } from '../config/styles';

const PARTICLE_POOL_SIZE = 64;
const TEXT_POOL_SIZE = 16;

/**
 * Visual effects manager with object pooling for particles and damage numbers.
 */
export class VFX {
  private scene: Phaser.Scene;
  private particlePool: Phaser.GameObjects.Rectangle[] = [];
  private textPool: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initPools();
  }

  private initPools(): void {
    // Pre-allocate particle rectangles
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      const p = this.scene.add.rectangle(-100, -100, 4, 4, 0xffffff, 0);
      p.setDepth(15).setActive(false).setVisible(false);
      this.particlePool.push(p);
    }
    // Pre-allocate damage number texts
    for (let i = 0; i < TEXT_POOL_SIZE; i++) {
      const t = this.scene.add.text(-100, -100, '', TEXT_STYLES.damage);
      t.setOrigin(0.5).setDepth(20).setActive(false).setVisible(false);
      this.textPool.push(t);
    }
  }

  private getParticle(): Phaser.GameObjects.Rectangle | null {
    for (const p of this.particlePool) {
      if (!p.active) return p;
    }
    return null; // pool exhausted — skip this particle
  }

  private getText(): Phaser.GameObjects.Text | null {
    for (const t of this.textPool) {
      if (!t.active) return t;
    }
    return null;
  }

  private releaseParticle(p: Phaser.GameObjects.Rectangle): void {
    p.setActive(false).setVisible(false).setPosition(-100, -100).setAlpha(1).setScale(1);
  }

  private releaseText(t: Phaser.GameObjects.Text): void {
    t.setActive(false).setVisible(false).setPosition(-100, -100).setAlpha(1).setScale(1);
  }

  // ── Effects ──

  shake(intensity = 0.005, duration = 100): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  deathBurst(x: number, y: number, color: number, count = 8): void {
    for (let i = 0; i < count; i++) {
      const p = this.getParticle();
      if (!p) break;

      const angle = (i / count) * Math.PI * 2;
      const speed = Phaser.Math.Between(60, 150);
      const size = Phaser.Math.Between(2, 5);

      p.setPosition(x, y).setSize(size, size).setFillStyle(color, 0.9);
      p.setActive(true).setVisible(true).setAlpha(0.9).setScale(1);

      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(200, 400),
        ease: 'Power2',
        onComplete: () => this.releaseParticle(p),
      });
    }
  }

  damageNumber(x: number, y: number, amount: number, isCrit = false): void {
    const t = this.getText();
    if (!t) return;

    t.setStyle(isCrit ? TEXT_STYLES.damageCrit : TEXT_STYLES.damage);
    t.setText(`${amount}`);
    t.setPosition(x, y - 10).setActive(true).setVisible(true).setAlpha(1);

    this.scene.tweens.add({
      targets: t,
      y: y - 50,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => this.releaseText(t),
    });
  }

  pickupSparkle(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      const p = this.getParticle();
      if (!p) break;
      const px = x + Phaser.Math.Between(-8, 8);
      const py = y + Phaser.Math.Between(-8, 8);
      p.setPosition(px, py).setSize(3, 3).setFillStyle(0xffff88, 1);
      p.setActive(true).setVisible(true).setAlpha(1).setScale(1);
      this.scene.tweens.add({
        targets: p,
        y: py - 20, alpha: 0, scale: 0,
        duration: 300,
        onComplete: () => this.releaseParticle(p),
      });
    }
  }

  screenFlash(color = 0xffffff, alpha = 0.4, duration = 300): void {
    const cam = this.scene.cameras.main;
    const flash = this.scene.add.rectangle(
      cam.width / 2, cam.height / 2, cam.width, cam.height, color, alpha
    ).setScrollFactor(0).setDepth(500);
    this.scene.tweens.add({
      targets: flash, alpha: 0, duration,
      onComplete: () => flash.destroy(),
    });
  }

  bossWarning(text = 'BOSS INCOMING!'): void {
    const cam = this.scene.cameras.main;
    const bg = this.scene.add.rectangle(
      cam.width / 2, cam.height * 0.2, cam.width, 60, 0x000000, 0.7
    ).setScrollFactor(0).setDepth(450);
    const label = this.scene.add.text(cam.width / 2, cam.height * 0.2, text, {
      fontSize: '32px', fontFamily: 'monospace', color: '#ff0000',
      stroke: '#000', strokeThickness: 4,
    }).setScrollFactor(0).setDepth(451).setOrigin(0.5);
    this.scene.tweens.add({
      targets: [label],
      alpha: { from: 1, to: 0.3 }, yoyo: true, repeat: 3, duration: 300,
      onComplete: () => {
        this.scene.tweens.add({
          targets: [bg, label], alpha: 0, duration: 500,
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
    const text = this.scene.add.text(cam.width / 2, cam.height * 0.35, msg, {
      ...TEXT_STYLES.announcement, color,
    }).setScrollFactor(0).setDepth(300).setOrigin(0.5).setAlpha(0);
    this.scene.tweens.add({
      targets: text, alpha: 1, scale: { from: 0.5, to: 1.2 },
      duration: 300, yoyo: true, hold: 500,
      onComplete: () => text.destroy(),
    });
  }

  chestBurst(x: number, y: number): void {
    const colors = [0xffdd44, 0xffaa00, 0xffffff, 0x44ddff];
    for (let i = 0; i < 16; i++) {
      const p = this.getParticle();
      if (!p) break;
      const angle = (i / 16) * Math.PI * 2;
      const speed = Phaser.Math.Between(80, 180);
      p.setPosition(x, y).setSize(4, 4).setFillStyle(colors[i % 4], 1);
      p.setActive(true).setVisible(true).setAlpha(1).setScale(1);
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: Phaser.Math.Between(300, 600),
        ease: 'Power2',
        onComplete: () => this.releaseParticle(p),
      });
    }
  }

  evolutionGlow(x: number, y: number): void {
    this.screenFlash(0xffdd44, 0.6, 500);
    this.chestBurst(x, y);
    this.shake(0.01, 300);
  }
}
