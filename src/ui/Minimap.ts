import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { EnemyPool } from '../systems/EnemyPool';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../config/constants';

const MAP_SIZE = 100;
const MAP_MARGIN = 10;
const MAP_SCALE_X = MAP_SIZE / WORLD_WIDTH;
const MAP_SCALE_Y = MAP_SIZE / WORLD_HEIGHT;

/**
 * Corner minimap showing player, enemies, and bosses on the world.
 */
export class Minimap {
  private scene: Phaser.Scene;
  private player: Player;
  private enemyPool: EnemyPool;
  private graphics: Phaser.GameObjects.Graphics;
  private bg: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, player: Player, enemyPool: EnemyPool) {
    this.scene = scene;
    this.player = player;
    this.enemyPool = enemyPool;

    const cam = scene.cameras.main;
    const x = cam.width - MAP_SIZE - MAP_MARGIN;
    const y = cam.height - MAP_SIZE - MAP_MARGIN;

    this.bg = scene.add.rectangle(
      x + MAP_SIZE / 2, y + MAP_SIZE / 2,
      MAP_SIZE, MAP_SIZE, 0x000000, 0.5
    ).setScrollFactor(0).setDepth(90);
    this.bg.setStrokeStyle(1, 0x444466);

    this.graphics = scene.add.graphics();
    this.graphics.setScrollFactor(0).setDepth(91);
  }

  update(): void {
    this.graphics.clear();

    const cam = this.scene.cameras.main;
    const ox = cam.width - MAP_SIZE - MAP_MARGIN;
    const oy = cam.height - MAP_SIZE - MAP_MARGIN;

    // Draw enemies as dots
    const enemies = this.enemyPool.getLiving();
    for (const enemy of enemies) {
      const mx = ox + enemy.x * MAP_SCALE_X;
      const my = oy + enemy.y * MAP_SCALE_Y;

      if (enemy.enemyDef.isBoss) {
        this.graphics.fillStyle(0xff0000, 1);
        this.graphics.fillCircle(mx, my, 3);
      } else if (enemy.isElite) {
        this.graphics.fillStyle(0xffdd44, 1);
        this.graphics.fillCircle(mx, my, 2);
      } else {
        this.graphics.fillStyle(0xff4444, 0.6);
        this.graphics.fillRect(mx, my, 1, 1);
      }
    }

    // Draw player
    const px = ox + this.player.x * MAP_SCALE_X;
    const py = oy + this.player.y * MAP_SCALE_Y;
    this.graphics.fillStyle(0x44ff44, 1);
    this.graphics.fillCircle(px, py, 3);

    // Camera viewport outline
    const vx = ox + cam.scrollX * MAP_SCALE_X;
    const vy = oy + cam.scrollY * MAP_SCALE_Y;
    const vw = cam.width * MAP_SCALE_X;
    const vh = cam.height * MAP_SCALE_Y;
    this.graphics.lineStyle(1, 0x44ddff, 0.4);
    this.graphics.strokeRect(vx, vy, vw, vh);
  }

  destroy(): void {
    this.bg.destroy();
    this.graphics.destroy();
  }
}
