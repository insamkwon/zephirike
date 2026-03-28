import Phaser from 'phaser';
import { WEAPONS, WeaponDef } from '../config/weaponConfig';
import { Player } from '../entities/Player';
import { Projectile } from './Projectile';
import { Enemy } from '../entities/Enemy';

export interface OwnedWeapon {
  id: string;
  level: number; // 0-indexed
  def: WeaponDef;
  lastFired: number;
  orbs?: Phaser.GameObjects.Sprite[];
}

export class WeaponManager {
  scene: Phaser.Scene;
  player: Player;
  weapons: OwnedWeapon[];
  projectiles: Phaser.Physics.Arcade.Group;
  enemies: Phaser.Physics.Arcade.Group;
  private areaEffects: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene, player: Player, enemies: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.player = player;
    this.weapons = [];
    this.enemies = enemies;

    // Projectile pool
    this.projectiles = scene.physics.add.group({
      classType: Projectile,
      maxSize: 100,
      runChildUpdate: false,
    });

    this.areaEffects = scene.add.group();
  }

  addWeapon(weaponId: string): void {
    const existing = this.weapons.find(w => w.id === weaponId);
    if (existing) {
      // Level up existing weapon
      if (existing.level < existing.def.maxLevel - 1) {
        existing.level++;
        // Rebuild orbs if orbit weapon
        if (existing.def.type === 'orbit') {
          this.rebuildOrbs(existing);
        }
      }
      return;
    }

    const def = WEAPONS[weaponId];
    if (!def) return;

    const owned: OwnedWeapon = {
      id: weaponId,
      level: 0,
      def,
      lastFired: 0,
    };
    this.weapons.push(owned);

    if (def.type === 'orbit') {
      this.rebuildOrbs(owned);
    }
  }

  getWeaponLevel(weaponId: string): number {
    const w = this.weapons.find(w => w.id === weaponId);
    return w ? w.level : -1;
  }

  private rebuildOrbs(weapon: OwnedWeapon): void {
    // Destroy old orbs
    if (weapon.orbs) {
      weapon.orbs.forEach(o => o.destroy());
    }
    const stats = weapon.def.levels[weapon.level];
    weapon.orbs = [];
    for (let i = 0; i < stats.count; i++) {
      const orb = this.scene.add.sprite(this.player.x, this.player.y, 'orb');
      orb.setDepth(9);
      orb.setData('angle', (i / stats.count) * Math.PI * 2);
      orb.setData('weaponId', weapon.id);
      weapon.orbs.push(orb);
    }
  }

  update(time: number, _delta: number): void {
    for (const weapon of this.weapons) {
      const stats = weapon.def.levels[weapon.level];

      switch (weapon.def.type) {
        case 'projectile':
          if (time - weapon.lastFired >= stats.cooldown) {
            weapon.lastFired = time;
            this.fireProjectile(weapon);
          }
          break;
        case 'melee':
          if (time - weapon.lastFired >= stats.cooldown) {
            weapon.lastFired = time;
            this.fireMelee(weapon);
          }
          break;
        case 'area':
          if (time - weapon.lastFired >= stats.cooldown) {
            weapon.lastFired = time;
            this.fireArea(weapon);
          }
          break;
        case 'orbit':
          this.updateOrbit(weapon, time);
          break;
      }
    }

    // Check projectile-enemy overlap via scene (done in GameScene)
    // Clean up off-screen projectiles
    this.projectiles.getChildren().forEach((p) => {
      const proj = p as Projectile;
      if (!proj.active) return;
      const cam = this.scene.cameras.main;
      const margin = 200;
      if (
        proj.x < cam.scrollX - margin ||
        proj.x > cam.scrollX + cam.width + margin ||
        proj.y < cam.scrollY - margin ||
        proj.y > cam.scrollY + cam.height + margin
      ) {
        proj.deactivate();
      }
    });
  }

  private fireProjectile(weapon: OwnedWeapon): void {
    const stats = weapon.def.levels[weapon.level];
    const living = this.enemies.getChildren().filter(e => (e as Enemy).active) as Enemy[];
    if (living.length === 0) return;

    // Sort by distance
    living.sort((a, b) =>
      Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y) -
      Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y)
    );

    for (let i = 0; i < stats.count; i++) {
      const target = living[i % living.length];
      const angle = Phaser.Math.Angle.Between(
        this.player.x, this.player.y,
        target.x, target.y
      );

      // Spread slightly for multiple projectiles
      const spread = stats.count > 1 ? (i - (stats.count - 1) / 2) * 0.15 : 0;

      const proj = this.projectiles.get(this.player.x, this.player.y, `proj_${weapon.id}`) as Projectile | null;
      if (proj) {
        proj.fire(
          this.player.x, this.player.y,
          angle + spread,
          stats.speed,
          stats.damage,
          stats.pierce
        );
      }
    }
  }

  private fireMelee(weapon: OwnedWeapon): void {
    const stats = weapon.def.levels[weapon.level];
    const dir = this.player.getFacingDir();

    // Create melee hitbox visual
    const directions = stats.count >= 2 ? [1, -1] : [dir.x];

    for (const d of directions) {
      const hitX = this.player.x + d * stats.area * 0.5;
      const hitY = this.player.y;

      // Visual slash effect
      const slash = this.scene.add.rectangle(
        hitX, hitY,
        stats.area, 30,
        weapon.def.color, 0.6
      );
      slash.setDepth(9);
      this.scene.tweens.add({
        targets: slash,
        alpha: 0,
        scaleY: 2,
        duration: stats.duration,
        onComplete: () => slash.destroy(),
      });

      // Damage enemies in area
      const living = this.enemies.getChildren().filter(e => (e as Enemy).active) as Enemy[];
      for (const enemy of living) {
        const dist = Phaser.Math.Distance.Between(hitX, hitY, enemy.x, enemy.y);
        if (dist < stats.area) {
          enemy.takeDamage(stats.damage);
        }
      }
    }
  }

  private fireArea(weapon: OwnedWeapon): void {
    const stats = weapon.def.levels[weapon.level];

    for (let i = 0; i < stats.count; i++) {
      // Drop area at random nearby position or at player
      const offsetX = stats.count > 1 ? Phaser.Math.Between(-100, 100) : 0;
      const offsetY = stats.count > 1 ? Phaser.Math.Between(-100, 100) : 0;
      const ax = this.player.x + offsetX;
      const ay = this.player.y + offsetY;

      // Visual pool
      const pool = this.scene.add.circle(ax, ay, stats.area, weapon.def.color, 0.3);
      pool.setDepth(2);

      // Damage tick
      const tickInterval = 500;
      let elapsed = 0;
      const timer = this.scene.time.addEvent({
        delay: tickInterval,
        repeat: Math.floor(stats.duration / tickInterval) - 1,
        callback: () => {
          elapsed += tickInterval;
          const living = this.enemies.getChildren().filter(e => (e as Enemy).active) as Enemy[];
          for (const enemy of living) {
            const dist = Phaser.Math.Distance.Between(ax, ay, enemy.x, enemy.y);
            if (dist < stats.area) {
              enemy.takeDamage(stats.damage);
            }
          }
          // Pulse effect
          pool.setAlpha(0.15 + 0.15 * Math.sin(elapsed * 0.01));
        },
      });

      // Cleanup
      this.scene.time.delayedCall(stats.duration, () => {
        timer.destroy();
        this.scene.tweens.add({
          targets: pool,
          alpha: 0,
          duration: 300,
          onComplete: () => pool.destroy(),
        });
      });
    }
  }

  private updateOrbit(weapon: OwnedWeapon, _time: number): void {
    if (!weapon.orbs) return;
    const stats = weapon.def.levels[weapon.level];
    const angularSpeed = (stats.speed / 100) * 0.003; // radians per ms-ish

    for (const orb of weapon.orbs) {
      if (!orb.active) continue;
      let angle = orb.getData('angle') as number;
      angle += angularSpeed;
      orb.setData('angle', angle);

      orb.setPosition(
        this.player.x + Math.cos(angle) * stats.area,
        this.player.y + Math.sin(angle) * stats.area
      );

      // Check collision with enemies
      const living = this.enemies.getChildren().filter(e => (e as Enemy).active) as Enemy[];
      for (const enemy of living) {
        const dist = Phaser.Math.Distance.Between(orb.x, orb.y, enemy.x, enemy.y);
        if (dist < 20) {
          enemy.takeDamage(stats.damage);
        }
      }
    }
  }

  /** Get list of possible upgrades for level-up screen */
  getUpgradeOptions(count: number): Array<{ weaponId: string; nextLevel: number; isNew: boolean }> {
    const options: Array<{ weaponId: string; nextLevel: number; isNew: boolean }> = [];

    // Existing weapons that can level up
    for (const w of this.weapons) {
      if (w.level < w.def.maxLevel - 1) {
        options.push({ weaponId: w.id, nextLevel: w.level + 1, isNew: false });
      }
    }

    // New weapons not yet owned
    const ownedIds = new Set(this.weapons.map(w => w.id));
    for (const id of Object.keys(WEAPONS)) {
      if (!ownedIds.has(id)) {
        options.push({ weaponId: id, nextLevel: 0, isNew: true });
      }
    }

    // Shuffle and pick
    Phaser.Utils.Array.Shuffle(options);
    return options.slice(0, count);
  }

  destroy(): void {
    for (const w of this.weapons) {
      if (w.orbs) w.orbs.forEach(o => o.destroy());
    }
    this.projectiles.destroy(true);
    this.areaEffects.destroy(true);
  }
}
