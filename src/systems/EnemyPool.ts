import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { ENEMY_DESPAWN_RANGE } from '../config/constants';

/**
 * Manages the enemy group with efficient spatial queries.
 * Caches the living-enemy list once per frame.
 */
export class EnemyPool {
  readonly group: Phaser.Physics.Arcade.Group;
  private scene: Phaser.Scene;
  private livingCache: Enemy[] = [];
  private cacheFrame = -1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group({
      classType: Enemy,
      runChildUpdate: false,
    });
  }

  add(enemy: Enemy): void {
    this.group.add(enemy);
  }

  getLiving(): readonly Enemy[] {
    const frame = this.scene.game.loop.frame;
    if (frame !== this.cacheFrame) {
      this.cacheFrame = frame;
      this.livingCache = this.group.getChildren().filter(
        e => (e as Enemy).active,
      ) as Enemy[];
    }
    return this.livingCache;
  }

  getNearby(x: number, y: number, range: number): Enemy[] {
    const r2 = range * range;
    const result: Enemy[] = [];
    for (const enemy of this.getLiving()) {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      if (dx * dx + dy * dy < r2) result.push(enemy);
    }
    return result;
  }

  getClosest(x: number, y: number, count: number): Enemy[] {
    const living = this.getLiving();
    if (living.length === 0) return [];
    const withDist = living.map(e => ({
      enemy: e,
      d: (e.x - x) ** 2 + (e.y - y) ** 2,
    }));
    withDist.sort((a, b) => a.d - b.d);
    return withDist.slice(0, count).map(w => w.enemy);
  }

  /** Update: AI movement + collect despawn targets, then destroy after iteration */
  updateEnemies(playerX: number, playerY: number, delta: number): void {
    const despawnR2 = ENEMY_DESPAWN_RANGE * ENEMY_DESPAWN_RANGE;
    const toDespawn: Enemy[] = [];

    for (const enemy of this.getLiving()) {
      if (!enemy.active) continue;
      const dx = enemy.x - playerX;
      const dy = enemy.y - playerY;
      if (dx * dx + dy * dy > despawnR2) {
        toDespawn.push(enemy);
      } else {
        enemy.moveToward(playerX, playerY, delta);
      }
    }

    // Destroy after iteration to avoid stale-cache issues
    for (const enemy of toDespawn) {
      enemy.destroy();
    }
    // Invalidate cache if we removed anything
    if (toDespawn.length > 0) this.cacheFrame = -1;
  }

  get count(): number {
    return this.getLiving().length;
  }

  destroy(): void {
    this.group.destroy(true);
    this.livingCache = [];
  }
}
