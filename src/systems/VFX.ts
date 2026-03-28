import Phaser from 'phaser';

/**
 * Visual effects manager — screen shake, particle bursts, damage numbers, flashes.
 */
export class VFX {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Camera shake */
  shake(intensity = 0.005, duration = 100): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  /** Particle burst at position (enemy death explosion) */
  deathBurst(x: number, y: number, color: number, count = 8): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = Phaser.Math.Between(60, 150);
      const size = Phaser.Math.Between(2, 5);

      const particle = this.scene.add.rectangle(x, y, size, size, color, 0.9);
      particle.setDepth(15);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(200, 400),
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  /** Floating damage number */
  damageNumber(x: number, y: number, amount: number, isCrit = false): void {
    const color = isCrit ? '#ffdd44' : '#ffffff';
    const size = isCrit ? '16px' : '12px';

    const text = this.scene.add.text(x, y - 10, `${amount}`, {
      fontSize: size,
      fontFamily: 'monospace',
      color,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20);

    this.scene.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  /** XP pickup sparkle */
  pickupSparkle(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      const px = x + Phaser.Math.Between(-8, 8);
      const py = y + Phaser.Math.Between(-8, 8);
      const spark = this.scene.add.rectangle(px, py, 3, 3, 0xffff88, 1);
      spark.setDepth(15);
      this.scene.tweens.add({
        targets: spark,
        y: py - 20,
        alpha: 0,
        scale: 0,
        duration: 300,
        onComplete: () => spark.destroy(),
      });
    }
  }

  /** Full-screen flash (level up, evolution) */
  screenFlash(color = 0xffffff, alpha = 0.4, duration = 300): void {
    const cam = this.scene.cameras.main;
    const flash = this.scene.add.rectangle(
      cam.width / 2, cam.height / 2,
      cam.width, cam.height,
      color, alpha
    ).setScrollFactor(0).setDepth(500);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration,
      onComplete: () => flash.destroy(),
    });
  }

  /** Boss warning banner */
  bossWarning(text = 'BOSS INCOMING!'): void {
    const cam = this.scene.cameras.main;

    const bg = this.scene.add.rectangle(
      cam.width / 2, cam.height * 0.2,
      cam.width, 60,
      0x000000, 0.7
    ).setScrollFactor(0).setDepth(450);

    const label = this.scene.add.text(cam.width / 2, cam.height * 0.2, text, {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#ff0000',
      stroke: '#000',
      strokeThickness: 4,
    }).setScrollFactor(0).setDepth(451).setOrigin(0.5);

    // Pulse then fade
    this.scene.tweens.add({
      targets: [label],
      alpha: { from: 1, to: 0.3 },
      yoyo: true,
      repeat: 3,
      duration: 300,
      onComplete: () => {
        this.scene.tweens.add({
          targets: [bg, label],
          alpha: 0,
          duration: 500,
          onComplete: () => {
            bg.destroy();
            label.destroy();
          },
        });
      },
    });
  }

  /** Kill streak text popup */
  killStreak(count: number): void {
    const cam = this.scene.cameras.main;
    let msg = '';
    let color = '#ffffff';

    if (count >= 100) { msg = `${count} KILLS! UNSTOPPABLE!`; color = '#ff4444'; }
    else if (count >= 50) { msg = `${count} KILLS! MASSACRE!`; color = '#ff8844'; }
    else if (count >= 25) { msg = `${count} KILLS! RAMPAGE!`; color = '#ffdd44'; }
    else return;

    const text = this.scene.add.text(cam.width / 2, cam.height * 0.35, msg, {
      fontSize: '20px',
      fontFamily: 'monospace',
      color,
      stroke: '#000',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(300).setOrigin(0.5).setAlpha(0);

    this.scene.tweens.add({
      targets: text,
      alpha: 1,
      scale: { from: 0.5, to: 1.2 },
      duration: 300,
      yoyo: true,
      hold: 500,
      onComplete: () => text.destroy(),
    });
  }

  /** Chest open burst */
  chestBurst(x: number, y: number): void {
    const colors = [0xffdd44, 0xffaa00, 0xffffff, 0x44ddff];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const speed = Phaser.Math.Between(80, 180);
      const color = colors[i % colors.length];
      const p = this.scene.add.rectangle(x, y, 4, 4, color, 1).setDepth(20);
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: Phaser.Math.Between(300, 600),
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  /** Evolution weapon glow effect */
  evolutionGlow(x: number, y: number): void {
    this.screenFlash(0xffdd44, 0.6, 500);
    this.chestBurst(x, y);
    this.shake(0.01, 300);
  }
}
