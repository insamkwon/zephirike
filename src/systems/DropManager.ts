import Phaser from 'phaser';
import { XpGem } from '../entities/XpGem';
import { Player } from '../entities/Player';

export class DropManager {
  private scene: Phaser.Scene;
  private player: Player;
  gems: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.gems = scene.add.group();
  }

  spawnXpGem(x: number, y: number, value: number): void {
    const gem = new XpGem(this.scene, x, y, value);
    this.gems.add(gem);
  }

  /** Occasionally spawn a health drop */
  spawnHealthDrop(x: number, y: number): void {
    const heart = this.scene.add.sprite(x, y, 'heart');
    heart.setDepth(3);
    this.scene.physics.add.existing(heart);
    heart.setData('type', 'health');
    heart.setData('value', 20);
    this.gems.add(heart);
  }

  update(): void {
    const children = this.gems.getChildren() as Phaser.GameObjects.Sprite[];
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      if (!child.active) continue;

      if (child instanceof XpGem) {
        child.attract(this.player.x, this.player.y);
      } else if (child.getData('type') === 'health') {
        // Attract health pickups
        const dist = Phaser.Math.Distance.Between(child.x, child.y, this.player.x, this.player.y);
        if (dist < 40) {
          this.player.heal(child.getData('value') as number);
          child.destroy();
        }
      }
    }
  }

  destroy(): void {
    this.gems.destroy(true);
  }
}
