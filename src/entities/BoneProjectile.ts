import Phaser from 'phaser';
import { BONE_PROJECTILE_SPEED, BONE_LIFETIME_MS, BONE_HIT_RADIUS } from '../config/constants';

const POOL_SIZE = 20;

/**
 * Pooled bone projectile fired by skeleton enemies.
 */
export class BoneProjectilePool {
  private scene: Phaser.Scene;
  private pool: Phaser.GameObjects.Rectangle[] = [];
  private velocities = new Map<Phaser.GameObjects.Rectangle, { vx: number; vy: number }>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    for (let i = 0; i < POOL_SIZE; i++) {
      const bone = scene.add.rectangle(-100, -100, 6, 6, 0xcccccc, 0).setDepth(8);
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
  }

  destroy(): void {
    for (const bone of this.pool) bone.destroy();
    this.pool = [];
    this.velocities.clear();
  }
}
