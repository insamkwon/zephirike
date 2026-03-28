import Phaser from 'phaser';
import { DROP_MAGNET_SPEED, PLAYER_PICKUP_RANGE, PLAYER_MAGNET_RANGE } from '../config/constants';

export class XpGem extends Phaser.Physics.Arcade.Sprite {
  xpValue: number;
  private attracted: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, value: number) {
    super(scene, x, y, 'xp_gem');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.xpValue = value;
    this.attracted = false;
    this.setDepth(3);

    // Small bounce on spawn
    this.setVelocity(
      Phaser.Math.Between(-40, 40),
      Phaser.Math.Between(-40, 40)
    );
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setDrag(100);

    // Scale based on value
    if (value >= 10) {
      this.setTint(0x44ff44); // green = high value
      this.setScale(1.3);
    } else if (value >= 5) {
      this.setTint(0x4488ff); // blue = medium
    }
    // default yellow for small
  }

  attract(playerX: number, playerY: number): void {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);

    if (dist < PLAYER_PICKUP_RANGE) {
      // Close enough to pick up
      this.scene.events.emit('xp-collected', this);
      this.destroy();
      return;
    }

    if (dist < PLAYER_MAGNET_RANGE || this.attracted) {
      this.attracted = true;
      const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
      this.setVelocity(
        Math.cos(angle) * DROP_MAGNET_SPEED,
        Math.sin(angle) * DROP_MAGNET_SPEED
      );
    }
  }
}
