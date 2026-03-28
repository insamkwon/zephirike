import Phaser from 'phaser';
import { PROJECTILE_LIFETIME_MS } from '../config/constants';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  damage: number;
  pierce: number;
  private hitEnemies: Set<number>;
  private lifetimeTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    this.damage = 0;
    this.pierce = 1;
    this.hitEnemies = new Set();
    this.setDepth(8);
  }

  fire(
    x: number, y: number, angle: number,
    speed: number, damage: number, pierce: number,
  ): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.damage = damage;
    this.pierce = pierce;
    this.hitEnemies.clear();

    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.setRotation(angle);

    // Cancel previous timer if reused from pool
    if (this.lifetimeTimer) {
      this.lifetimeTimer.destroy();
    }
    this.lifetimeTimer = this.scene.time.delayedCall(PROJECTILE_LIFETIME_MS, () => {
      if (this.active) this.deactivate();
    });
  }

  onHitEnemy(enemyId: number): boolean {
    if (this.hitEnemies.has(enemyId)) return false;
    this.hitEnemies.add(enemyId);
    this.pierce--;
    if (this.pierce <= 0) {
      this.deactivate();
      return true;
    }
    return false;
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    this.setPosition(-100, -100);
    // Clean up timer
    if (this.lifetimeTimer) {
      this.lifetimeTimer.destroy();
      this.lifetimeTimer = null;
    }
  }
}
