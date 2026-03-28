import Phaser from 'phaser';
import {
  WORLD_WIDTH, WORLD_HEIGHT, WORLD_BOUND_MARGIN,
  MAP_PILLAR_COUNT, MAP_TORCH_COUNT, MAP_GRAVE_COUNT, MAP_SPAWN_EXCLUSION, TORCH_HP,
} from '../config/constants';

/**
 * Spawns destructible objects and obstacles on the map.
 * Provides spatial landmarks so the player has positional awareness.
 */
export class MapObjects {
  private scene: Phaser.Scene;
  readonly obstacles: Phaser.Physics.Arcade.StaticGroup;
  readonly destructibles: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.obstacles = scene.physics.add.staticGroup();
    this.destructibles = scene.physics.add.group();
    this.generate();
  }

  private generate(): void {
    const rng = new Phaser.Math.RandomDataGenerator(['map']);
    const margin = WORLD_BOUND_MARGIN + 100;

    // Stone pillars (static obstacles — enemies and player collide)
    for (let i = 0; i < MAP_PILLAR_COUNT; i++) {
      const x = rng.between(margin, WORLD_WIDTH - margin);
      const y = rng.between(margin, WORLD_HEIGHT - margin);
      if (Math.abs(x - WORLD_WIDTH / 2) < MAP_SPAWN_EXCLUSION && Math.abs(y - WORLD_HEIGHT / 2) < MAP_SPAWN_EXCLUSION) continue;

      const pillar = this.scene.add.rectangle(x, y, 24, 24, 0x444455, 1).setDepth(1);
      this.scene.physics.add.existing(pillar, true);
      this.obstacles.add(pillar);
    }

    // Destructible torches (drop XP when broken)
    for (let i = 0; i < MAP_TORCH_COUNT; i++) {
      const x = rng.between(margin, WORLD_WIDTH - margin);
      const y = rng.between(margin, WORLD_HEIGHT - margin);
      if (Math.abs(x - WORLD_WIDTH / 2) < MAP_SPAWN_EXCLUSION * 0.67 && Math.abs(y - WORLD_HEIGHT / 2) < MAP_SPAWN_EXCLUSION * 0.67) continue;

      const torch = this.scene.add.rectangle(x, y, 12, 16, 0xcc6622, 1).setDepth(1);
      this.scene.physics.add.existing(torch);
      torch.setData('hp', TORCH_HP);
      torch.setData('type', 'torch');
      this.destructibles.add(torch);

      // Flame flicker
      const flame = this.scene.add.rectangle(x, y - 10, 6, 8, 0xffaa22, 0.8).setDepth(2);
      this.scene.tweens.add({
        targets: flame,
        scaleX: { from: 0.8, to: 1.2 },
        scaleY: { from: 1, to: 1.3 },
        alpha: { from: 0.6, to: 1 },
        yoyo: true, repeat: -1, duration: 200 + rng.between(0, 100),
      });
      torch.setData('flame', flame);
    }

    // Decorative graves (visual only, no collision)
    for (let i = 0; i < MAP_GRAVE_COUNT; i++) {
      const x = rng.between(margin, WORLD_WIDTH - margin);
      const y = rng.between(margin, WORLD_HEIGHT - margin);
      this.scene.add.rectangle(x, y, 10, 14, 0x555566, 0.6).setDepth(0);
      this.scene.add.rectangle(x, y - 8, 8, 3, 0x555566, 0.6).setDepth(0);
    }
  }

  /** Handle projectile/weapon hitting a destructible */
  hitDestructible(obj: Phaser.GameObjects.GameObject, damage: number): void {
    const rect = obj as Phaser.GameObjects.Rectangle;
    let hp = rect.getData('hp') as number;
    hp -= damage;
    rect.setData('hp', hp);

    // Flash
    rect.setFillStyle(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (rect.active) rect.setFillStyle(0xcc6622);
    });

    if (hp <= 0) {
      const flame = rect.getData('flame') as Phaser.GameObjects.Rectangle;
      if (flame) flame.destroy();
      // Emit drop event
      this.scene.events.emit('destructible-broken', rect.x, rect.y);
      rect.destroy();
    }
  }

  destroy(): void {
    this.obstacles.destroy(true);
    this.destructibles.destroy(true);
  }
}
