import Phaser from 'phaser';
import { WEAPONS, WeaponDef } from '../config/weaponConfig';
import { EVOLUTIONS } from '../config/evolutionConfig';
import {
  PROJECTILE_POOL_SIZE,
  PROJECTILE_OFFSCREEN_MARGIN,
  PROJECTILE_SPREAD_ANGLE,
  ORB_HIT_RADIUS,
  ORB_ANGULAR_SPEED_FACTOR,
  MELEE_VISUAL_HEIGHT,
  AREA_TICK_MS,
  AREA_OFFSET_RANGE,
  AREA_FADE_MS,
} from '../config/constants';
import { Player } from '../entities/Player';
import { Projectile } from './Projectile';
import { EnemyPool } from '../systems/EnemyPool';
import { soundEngine } from '../systems/SoundEngine';


export interface OwnedWeapon {
  id: string;
  level: number;
  def: WeaponDef;
  lastFired: number;
  orbs?: Phaser.GameObjects.Sprite[];
}

/**
 * Manages all player weapons.
 * Delegates spatial queries to EnemyPool to avoid redundant O(n) scans.
 */
export class WeaponManager {
  private scene: Phaser.Scene;
  private player: Player;
  private enemyPool: EnemyPool;
  /** Instance-level weapon registry (includes evolved weapons without polluting global) */
  private localWeaponDefs = new Map<string, WeaponDef>();
  weapons: OwnedWeapon[];
  projectiles: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, player: Player, enemyPool: EnemyPool) {
    this.scene = scene;
    this.player = player;
    this.enemyPool = enemyPool;
    this.weapons = [];

    this.projectiles = scene.physics.add.group({
      classType: Projectile,
      maxSize: PROJECTILE_POOL_SIZE,
      runChildUpdate: false,
    });
  }

  addWeapon(weaponId: string): void {
    const existing = this.weapons.find(w => w.id === weaponId);
    if (existing) {
      if (existing.level < existing.def.maxLevel - 1) {
        existing.level++;
        if (existing.def.type === 'orbit') this.rebuildOrbs(existing);
      }
      return;
    }

    const def = WEAPONS[weaponId] ?? this.localWeaponDefs.get(weaponId);
    if (!def) return;

    const owned: OwnedWeapon = { id: weaponId, level: 0, def, lastFired: 0 };
    this.weapons.push(owned);

    if (def.type === 'orbit') this.rebuildOrbs(owned);
  }

  private rebuildOrbs(weapon: OwnedWeapon): void {
    if (weapon.orbs) weapon.orbs.forEach(o => o.destroy());
    const stats = weapon.def.levels[weapon.level];
    weapon.orbs = [];
    for (let i = 0; i < stats.count; i++) {
      const orb = this.scene.add.sprite(this.player.x, this.player.y, 'orb');
      orb.setDepth(9);
      orb.setData('angle', (i / stats.count) * Math.PI * 2);
      weapon.orbs.push(orb);
    }
  }

  update(time: number): void {
    for (const weapon of this.weapons) {
      const stats = weapon.def.levels[weapon.level];
      const type = weapon.def.type;

      if (type === 'orbit') {
        this.updateOrbit(weapon);
        continue;
      }

      // Cooldown-based weapons (apply haste passive)
      const effectiveCooldown = stats.cooldown * (1 - this.player.cooldownReduction);
      if (time - weapon.lastFired < effectiveCooldown) continue;
      weapon.lastFired = time;

      soundEngine.weaponFire(type);
      switch (type) {
        case 'projectile': this.fireProjectile(weapon); break;
        case 'melee': this.fireMelee(weapon); break;
        case 'area': this.fireArea(weapon); break;
      }
    }

    this.cleanupProjectiles();
  }

  // ── Projectile ──

  private fireProjectile(weapon: OwnedWeapon): void {
    const stats = weapon.def.levels[weapon.level];
    const targets = this.enemyPool.getClosest(this.player.x, this.player.y, stats.count);
    if (targets.length === 0) return;

    for (let i = 0; i < stats.count; i++) {
      const target = targets[i % targets.length];
      const angle = Phaser.Math.Angle.Between(
        this.player.x, this.player.y, target.x, target.y
      );
      const spread = stats.count > 1
        ? (i - (stats.count - 1) / 2) * PROJECTILE_SPREAD_ANGLE
        : 0;

      const proj = this.projectiles.get(
        this.player.x, this.player.y, `proj_${weapon.id}`
      ) as Projectile | null;
      if (proj) {
        proj.fire(this.player.x, this.player.y, angle + spread, stats.speed, this.scaledDamage(stats.damage), stats.pierce);
      }
    }
  }

  // ── Melee ──

  private fireMelee(weapon: OwnedWeapon): void {
    const stats = weapon.def.levels[weapon.level];
    const dir = this.player.getFacingDir();
    const directions = stats.count >= 2 ? [1, -1] : [dir.x];

    for (const d of directions) {
      const hitX = this.player.x + d * stats.area * 0.5;
      const hitY = this.player.y;

      // VFX: slash rectangle
      this.showSlash(hitX, hitY, stats.area, weapon.def.color, stats.duration);

      // Damage enemies in range — apply damage multiplier
      const dmg = this.scaledDamage(stats.damage);
      const nearby = this.enemyPool.getNearby(hitX, hitY, stats.area);
      for (const enemy of nearby) {
        enemy.takeDamage(dmg);
      }
    }
  }

  private showSlash(x: number, y: number, width: number, color: number, duration: number): void {
    const slash = this.scene.add.rectangle(x, y, width, MELEE_VISUAL_HEIGHT, color, 0.6);
    slash.setDepth(9);
    this.scene.tweens.add({
      targets: slash,
      alpha: 0,
      scaleY: 2,
      duration,
      onComplete: () => slash.destroy(),
    });
  }

  // ── Area ──

  private fireArea(weapon: OwnedWeapon): void {
    const stats = weapon.def.levels[weapon.level];

    for (let i = 0; i < stats.count; i++) {
      const offsetX = stats.count > 1 ? Phaser.Math.Between(-AREA_OFFSET_RANGE, AREA_OFFSET_RANGE) : 0;
      const offsetY = stats.count > 1 ? Phaser.Math.Between(-AREA_OFFSET_RANGE, AREA_OFFSET_RANGE) : 0;
      const ax = this.player.x + offsetX;
      const ay = this.player.y + offsetY;

      this.spawnAreaPool(ax, ay, stats.area, stats.damage, stats.duration, weapon.def.color);
    }
  }

  private spawnAreaPool(
    x: number, y: number, radius: number,
    damage: number, duration: number, color: number
  ): void {
    const pool = this.scene.add.circle(x, y, radius, color, 0.3).setDepth(2);
    let elapsed = 0;

    const timer = this.scene.time.addEvent({
      delay: AREA_TICK_MS,
      repeat: Math.floor(duration / AREA_TICK_MS) - 1,
      callback: () => {
        elapsed += AREA_TICK_MS;
        const dmg = this.scaledDamage(damage);
        const nearby = this.enemyPool.getNearby(x, y, radius);
        for (const enemy of nearby) {
          enemy.takeDamage(dmg);
        }
        pool.setAlpha(0.15 + 0.15 * Math.sin(elapsed * 0.01));
      },
    });

    this.scene.time.delayedCall(duration, () => {
      timer.destroy();
      this.scene.tweens.add({
        targets: pool,
        alpha: 0,
        duration: AREA_FADE_MS,
        onComplete: () => pool.destroy(),
      });
    });
  }

  // ── Orbit ──

  private updateOrbit(weapon: OwnedWeapon): void {
    if (!weapon.orbs) return;
    const stats = weapon.def.levels[weapon.level];
    const angularSpeed = (stats.speed / 100) * ORB_ANGULAR_SPEED_FACTOR;

    for (const orb of weapon.orbs) {
      if (!orb.active) continue;
      let angle = orb.getData('angle') as number;
      angle += angularSpeed;
      orb.setData('angle', angle);

      const ox = this.player.x + Math.cos(angle) * stats.area;
      const oy = this.player.y + Math.sin(angle) * stats.area;
      orb.setPosition(ox, oy);

      // Damage nearby enemies — with per-enemy hit cooldown
      const dmg = this.scaledDamage(stats.damage);
      const now = this.scene.time.now;
      const orbSourceId = `orb_${weapon.id}`;
      const hit = this.enemyPool.getNearby(ox, oy, ORB_HIT_RADIUS);
      for (const enemy of hit) {
        if (enemy.canBeHitBy(orbSourceId, now)) {
          enemy.takeDamage(dmg);
        }
      }
    }
  }

  // ── Cleanup ──

  private cleanupProjectiles(): void {
    const cam = this.scene.cameras.main;
    const margin = PROJECTILE_OFFSCREEN_MARGIN;
    const left = cam.scrollX - margin;
    const right = cam.scrollX + cam.width + margin;
    const top = cam.scrollY - margin;
    const bottom = cam.scrollY + cam.height + margin;

    for (const p of this.projectiles.getChildren()) {
      const proj = p as Projectile;
      if (!proj.active) continue;
      if (proj.x < left || proj.x > right || proj.y < top || proj.y > bottom) {
        proj.deactivate();
      }
    }
  }

  // ── Evolution ──

  /** Check if any evolution is available */
  getAvailableEvolution(): { weapon1: string; weapon2: string; resultDef: WeaponDef } | null {
    for (const evo of EVOLUTIONS) {
      const w1 = this.weapons.find(w => w.id === evo.weapon1);
      const w2 = this.weapons.find(w => w.id === evo.weapon2);
      if (!w1 || !w2) continue;
      if (w1.level >= w1.def.maxLevel - 1 && w2.level >= w2.def.maxLevel - 1) {
        // Check not already evolved
        if (!this.weapons.find(w => w.id === evo.result.id)) {
          return { weapon1: evo.weapon1, weapon2: evo.weapon2, resultDef: evo.result };
        }
      }
    }
    return null;
  }

  /** Perform evolution — removes both source weapons, adds evolved weapon */
  evolve(weapon1Id: string, weapon2Id: string, resultDef: WeaponDef): void {
    // Remove source weapons
    for (const id of [weapon1Id, weapon2Id]) {
      const idx = this.weapons.findIndex(w => w.id === id);
      if (idx >= 0) {
        const w = this.weapons[idx];
        if (w.orbs) w.orbs.forEach(o => o.destroy());
        this.weapons.splice(idx, 1);
      }
    }

    // Register in instance-level registry (not polluting global WEAPONS)
    this.localWeaponDefs.set(resultDef.id, resultDef);
    this.addWeapon(resultDef.id);
  }

  // ── Upgrade Options ──

  getUpgradeOptions(count: number): Array<{ weaponId: string; nextLevel: number; isNew: boolean }> {
    const options: Array<{ weaponId: string; nextLevel: number; isNew: boolean }> = [];

    for (const w of this.weapons) {
      if (w.level < w.def.maxLevel - 1) {
        options.push({ weaponId: w.id, nextLevel: w.level + 1, isNew: false });
      }
    }

    const ownedIds = new Set(this.weapons.map(w => w.id));
    for (const id of Object.keys(WEAPONS)) {
      if (!ownedIds.has(id)) {
        options.push({ weaponId: id, nextLevel: 0, isNew: true });
      }
    }

    Phaser.Utils.Array.Shuffle(options);
    return options.slice(0, count);
  }

  /** Map of owned weapon defs for LevelUpUI */
  getOwnedDefs(): Map<string, WeaponDef> {
    const map = new Map<string, WeaponDef>();
    for (const w of this.weapons) map.set(w.id, w.def);
    for (const [id, def] of this.localWeaponDefs) map.set(id, def);
    return map;
  }

  /** Apply all damage bonuses: meta upgrade + might passive */
  private scaledDamage(base: number): number {
    return Math.floor(base * this.player.metaDamageMul * (1 + this.player.mightBonus));
  }

  destroy(): void {
    for (const w of this.weapons) {
      if (w.orbs) w.orbs.forEach(o => o.destroy());
    }
    this.projectiles.destroy(true);
  }
}
