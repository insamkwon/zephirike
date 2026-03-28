import Phaser from 'phaser';
import {
  DROP_MAGNET_SPEED,
  PLAYER_PICKUP_RANGE,
  HEALTH_PICKUP_RANGE,
} from '../config/constants';

export type DropType = 'xp' | 'health' | 'gold' | 'chest';

/**
 * Unified drop item — XP gems, health, gold coins, treasure chests.
 */
export class Drop extends Phaser.Physics.Arcade.Sprite {
  readonly dropType: DropType;
  readonly value: number;
  private attracted: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, type: DropType, value: number) {
    const textureMap: Record<DropType, string> = {
      xp: 'xp_gem',
      health: 'heart',
      gold: 'gold_coin',
      chest: 'chest',
    };
    super(scene, x, y, textureMap[type]);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.dropType = type;
    this.value = value;
    this.attracted = false;
    this.setDepth(3);

    // Bounce on spawn
    this.setVelocity(
      Phaser.Math.Between(-40, 40),
      Phaser.Math.Between(-40, 40)
    );
    (this.body as Phaser.Physics.Arcade.Body).setDrag(100);

    // Visual styling
    if (type === 'xp') {
      if (value >= 10) { this.setTint(0x44ff44); this.setScale(1.3); }
      else if (value >= 5) { this.setTint(0x4488ff); }
    } else if (type === 'chest') {
      this.setScale(1.5);
    }
  }

  attract(playerX: number, playerY: number, magnetRange?: number): 'pickup' | null {
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    const dist2 = dx * dx + dy * dy;

    // Chests don't get attracted — player must walk to them
    if (this.dropType === 'chest') {
      if (dist2 < HEALTH_PICKUP_RANGE * HEALTH_PICKUP_RANGE) return 'pickup';
      return null;
    }

    const pickupRange = this.dropType === 'xp' || this.dropType === 'gold'
      ? PLAYER_PICKUP_RANGE : HEALTH_PICKUP_RANGE;
    if (dist2 < pickupRange * pickupRange) return 'pickup';

    const effectiveMagnet = magnetRange ?? 150;
    const magRange = this.dropType === 'xp' || this.dropType === 'gold'
      ? effectiveMagnet : HEALTH_PICKUP_RANGE * 2;
    if (dist2 < magRange * magRange || this.attracted) {
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
