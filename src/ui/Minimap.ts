import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { EnemyPool } from '../systems/EnemyPool';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../config/constants';
// Minimap colors defined inline for performance

const MAP_SIZE = 110;
const MAP_MARGIN = 12;
const MAP_RADIUS = 10;
const MAP_SCALE_X = MAP_SIZE / WORLD_WIDTH;
const MAP_SCALE_Y = MAP_SIZE / WORLD_HEIGHT;

export class Minimap {
  private scene: Phaser.Scene;
  private player: Player;
  private enemyPool: EnemyPool;
  private bgGraphics: Phaser.GameObjects.Graphics;
  private dotGraphics: Phaser.GameObjects.Graphics;
  private bossPulseTimer = 0;

  constructor(scene: Phaser.Scene, player: Player, enemyPool: EnemyPool) {
    this.scene = scene;
    this.player = player;
    this.enemyPool = enemyPool;

    const cam = scene.cameras.main;
    const x = cam.width - MAP_SIZE - MAP_MARGIN;
    const y = cam.height - MAP_SIZE - MAP_MARGIN;

    // Semi-transparent dark background
    this.bgGraphics = scene.add.graphics().setScrollFactor(0).setDepth(90);
    this.bgGraphics.fillStyle(0x1a2a20, 0.6);
    this.bgGraphics.fillRoundedRect(x, y, MAP_SIZE, MAP_SIZE, MAP_RADIUS);
    this.bgGraphics.lineStyle(1.5, 0xffffff, 0.1);
    this.bgGraphics.strokeRoundedRect(x, y, MAP_SIZE, MAP_SIZE, MAP_RADIUS);

    // Dot rendering layer with mask
    this.dotGraphics = scene.add.graphics().setScrollFactor(0).setDepth(91);
    const maskShape = scene.make.graphics({ x: 0, y: 0 });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRoundedRect(x, y, MAP_SIZE, MAP_SIZE, MAP_RADIUS);
    this.dotGraphics.setMask(maskShape.createGeometryMask());
  }

  update(): void {
    this.dotGraphics.clear();
    this.bossPulseTimer += 16;

    const cam = this.scene.cameras.main;
    const ox = cam.width - MAP_SIZE - MAP_MARGIN;
    const oy = cam.height - MAP_SIZE - MAP_MARGIN;

    // Enemies
    const enemies = this.enemyPool.getLiving();
    for (const enemy of enemies) {
      const mx = ox + enemy.x * MAP_SCALE_X;
      const my = oy + enemy.y * MAP_SCALE_Y;

      if (mx < ox || mx > ox + MAP_SIZE || my < oy || my > oy + MAP_SIZE) continue;

      if (enemy.enemyDef.isBoss) {
        const pulseSize = 3.5 + Math.sin(this.bossPulseTimer * 0.006) * 1.5;
        this.dotGraphics.fillStyle(0xFF4444, 1);
        this.dotGraphics.fillCircle(mx, my, pulseSize);
        this.dotGraphics.fillStyle(0xFF4444, 0.2);
        this.dotGraphics.fillCircle(mx, my, pulseSize + 2);
      } else if (enemy.isElite) {
        this.dotGraphics.fillStyle(0xFFD700, 0.9);
        this.dotGraphics.fillCircle(mx, my, 2);
      } else {
        this.dotGraphics.fillStyle(0xFF6644, 0.5);
        this.dotGraphics.fillRect(mx - 0.5, my - 0.5, 1.5, 1.5);
      }
    }

    // Player — bright green
    const px = ox + this.player.x * MAP_SCALE_X;
    const py = oy + this.player.y * MAP_SCALE_Y;
    this.dotGraphics.fillStyle(0x66DD66, 0.3);
    this.dotGraphics.fillCircle(px, py, 5);
    this.dotGraphics.fillStyle(0x66DD66, 1);
    this.dotGraphics.fillCircle(px, py, 2.5);

    // Camera viewport
    const vx = ox + cam.scrollX * MAP_SCALE_X;
    const vy = oy + cam.scrollY * MAP_SCALE_Y;
    const vw = cam.width * MAP_SCALE_X;
    const vh = cam.height * MAP_SCALE_Y;
    this.dotGraphics.lineStyle(1, 0xffffff, 0.3);
    this.dotGraphics.strokeRect(vx, vy, vw, vh);
  }

  destroy(): void {
    this.bgGraphics.destroy();
    this.dotGraphics.destroy();
  }
}
