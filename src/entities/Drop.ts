import Phaser from 'phaser';
import {
  DROP_MAGNET_SPEED,
  PLAYER_PICKUP_RANGE,
  PLAYER_MAGNET_RANGE,
  HEALTH_PICKUP_RANGE,
} from '../config/constants';

export type DropType = 'xp' | 'health';

/**
 * Unified drop item — handles both XP gems and health pickups
 * with consistent magnet/attract behavior.
 */
export class Drop extends Phaser.Physics.Arcade.Sprite {
  readonly dropType: DropType;
  readonly value: number;
  private attracted: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, type: DropType, value: number) {
    const texture = type === 'xp' ? 'xp_gem' : 'heart';
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.dropType = type;
    this.value = value;
    this.attracted = false;
    this.setDepth(3);

    // Small bounce on spawn
    this.setVelocity(
      Phaser.Math.Between(-40, 40),
      Phaser.Math.Between(-40, 40)
    );
    (this.body as Phaser.Physics.Arcade.Body).setDrag(100);

    // Visual differentiation for XP based on value
    if (type === 'xp') {
      if (value >= 10) {
        this.setTint(0x44ff44);
        this.setScale(1.3);
      } else if (value >= 5) {
        this.setTint(0x4488ff);
      }
    }
  }

  /** Call each frame. Returns 'pickup' if collected, null otherwise. */
  attract(playerX: number, playerY: number): 'pickup' | null {
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    const dist2 = dx * dx + dy * dy;

    const pickupRange = this.dropType === 'xp' ? PLAYER_PICKUP_RANGE : HEALTH_PICKUP_RANGE;
    if (dist2 < pickupRange * pickupRange) {
      return 'pickup';
    }

    const magnetRange = this.dropType === 'xp' ? PLAYER_MAGNET_RANGE : HEALTH_PICKUP_RANGE * 2;
    if (dist2 < magnetRange * magnetRange || this.attracted) {
      this.attracted = true;
      const dist = Math.sqrt(dist2);
      if (dist > 0) {
        this.setVelocity(
          (-dx / dist) * DROP_MAGNET_SPEED,
          (-dy / dist) * DROP_MAGNET_SPEED
        );
      }
    }

    return null;
  }
}
