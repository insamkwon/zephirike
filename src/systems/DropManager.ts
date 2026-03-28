import Phaser from 'phaser';
import { Drop } from '../entities/Drop';
import { Player } from '../entities/Player';
import { HEALTH_DROP_AMOUNT } from '../config/constants';

/**
 * Manages all ground drops (XP gems, health pickups).
 * Uses the unified Drop class for consistent behavior.
 */
export class DropManager {
  private scene: Phaser.Scene;
  private player: Player;
  private drops: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.drops = scene.add.group();
  }

  spawnXpGem(x: number, y: number, value: number): void {
    this.drops.add(new Drop(this.scene, x, y, 'xp', value));
  }

  spawnHealthDrop(x: number, y: number): void {
    this.drops.add(new Drop(this.scene, x, y, 'health', HEALTH_DROP_AMOUNT));
  }

  update(): void {
    const children = this.drops.getChildren() as Drop[];
    for (let i = children.length - 1; i >= 0; i--) {
      const drop = children[i];
      if (!drop.active) continue;

      const result = drop.attract(this.player.x, this.player.y);
      if (result === 'pickup') {
        this.scene.events.emit('drop-collected', drop);
        drop.destroy();
      }
    }
  }

  destroy(): void {
    this.drops.destroy(true);
  }
}
