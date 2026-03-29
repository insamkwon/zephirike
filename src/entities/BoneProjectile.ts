import Phaser from 'phaser';
import { BONE_PROJECTILE_SPEED, BONE_LIFETIME_MS, BONE_HIT_RADIUS } from '../config/constants';

const POOL_SIZE = 20;

/**
 * Pooled bone projectile fired by skeleton enemies.
 */
export class BoneProjectilePool {
  private scene: Phaser.Scene;
  private pool: Phaser.GameObjects.Rectangle[] = [];
  private glows: Phaser.GameObjects.Rectangle[] = [];
  private velocities = new Map<Phaser.GameObjects.Rectangle, { vx: number; vy: number }>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    for (let i = 0; i < POOL_SIZE; i++) {
      const glow = scene.add.rectangle(-100, -100, 20, 20, 0xffddaa, 0.3).setDepth(7);
      glow.setActive(false).setVisible(false);
      this.glows.push(glow);

      const bone = scene.add.rectangle(-100, -100, 12, 12, 0xffeedd, 0).setDepth(8);
      bone.setActive(false).setVisible(false);
      this.pool.push(bone);
    }
  }

  fire(fromX: number, fromY: number, toX: number, toY: number, damage: number): void {
    const bone = this.pool.find(b => !b.active);
    if (!bone) return;

    const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);
    bone.setPosition(fromX, fromY).setActive(true).setVisible(true).setAlpha(1);
    bone.setData('damage', damage);

    const idx = this.pool.indexOf(bone);
    if (idx >= 0) {
      const glow = this.glows[idx];
      glow.setPosition(fromX, fromY).setActive(true).setVisible(true);
    }

    this.velocities.set(bone, {
      vx: Math.cos(angle) * BONE_PROJECTILE_SPEED,
      vy: Math.sin(angle) * BONE_PROJECTILE_SPEED,
    });

    this.scene.time.delayedCall(BONE_LIFETIME_MS, () => {
      this.release(bone);
    });
  }

  /** Call every frame — moves bones and checks player collision */
  update(delta: number, playerX: number, playerY: number, onHitPlayer: (damage: number) => void): void {
    const dt = delta / 1000;
    for (const bone of this.pool) {
      if (!bone.active) continue;
      const vel = this.velocities.get(bone);
      if (!vel) continue;

      bone.x += vel.vx * dt;
      bone.y += vel.vy * dt;
      bone.rotation += 0.3;

      const idx = this.pool.indexOf(bone);
      if (idx >= 0) {
        const glow = this.glows[idx];
        glow.setPosition(bone.x, bone.y);
        glow.rotation = bone.rotation;
      }

      const dx = bone.x - playerX;
      const dy = bone.y - playerY;
      if (dx * dx + dy * dy < BONE_HIT_RADIUS * BONE_HIT_RADIUS) {
        onHitPlayer(bone.getData('damage') as number);
        this.release(bone);
      }
    }
  }

  private release(bone: Phaser.GameObjects.Rectangle): void {
    bone.setActive(false).setVisible(false).setPosition(-100, -100);
    this.velocities.delete(bone);

    const idx = this.pool.indexOf(bone);
    if (idx >= 0) {
      this.glows[idx].setActive(false).setVisible(false).setPosition(-100, -100);
    }
  }

  destroy(): void {
    for (const bone of this.pool) bone.destroy();
    for (const glow of this.glows) glow.destroy();
    this.pool = [];
    this.glows = [];
    this.velocities.clear();
  }
}
