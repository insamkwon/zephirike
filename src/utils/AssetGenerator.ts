import Phaser from 'phaser';
import { ENEMIES } from '../config/enemyConfig';
import { WEAPONS } from '../config/weaponConfig';

/** Generate all sprites procedurally — no external assets needed */
export function generateAssets(scene: Phaser.Scene): void {
  // Player sprite (16x16 knight-like)
  const pg = scene.add.graphics();
  pg.fillStyle(0x4488ff, 1);
  pg.fillRect(2, 0, 12, 4);   // helmet
  pg.fillStyle(0xffcc88, 1);
  pg.fillRect(4, 4, 8, 4);    // face
  pg.fillStyle(0x3366cc, 1);
  pg.fillRect(2, 8, 12, 6);   // body
  pg.fillStyle(0x2244aa, 1);
  pg.fillRect(3, 14, 4, 2);   // left leg
  pg.fillRect(9, 14, 4, 2);   // right leg
  pg.generateTexture('player', 16, 16);
  pg.destroy();

  // Enemy sprites
  for (const [key, def] of Object.entries(ENEMIES)) {
    const g = scene.add.graphics();
    const s = def.size * 2;
    g.fillStyle(def.color, 1);
    if (def.isBoss) {
      // Boss: bigger, with horns
      g.fillRect(2, 4, s - 4, s - 4);
      g.fillStyle(0xff0000, 1);
      g.fillTriangle(2, 4, 0, 0, 6, 4);
      g.fillTriangle(s - 2, 4, s, 0, s - 6, 4);
      // Eyes
      g.fillStyle(0xff0000, 1);
      g.fillRect(s * 0.25, s * 0.35, 3, 3);
      g.fillRect(s * 0.6, s * 0.35, 3, 3);
    } else {
      g.fillCircle(s / 2, s / 2, s / 2 - 1);
      // Eyes
      g.fillStyle(0xff0000, 1);
      g.fillRect(s * 0.3, s * 0.3, 2, 2);
      g.fillRect(s * 0.6, s * 0.3, 2, 2);
    }
    g.generateTexture(`enemy_${key}`, s, s);
    g.destroy();
  }

  // XP gem (small diamond shape)
  const xpg = scene.add.graphics();
  xpg.fillStyle(0xffdd44, 1);
  xpg.fillTriangle(4, 0, 8, 4, 4, 8);
  xpg.fillTriangle(4, 0, 0, 4, 4, 8);
  xpg.generateTexture('xp_gem', 8, 8);
  xpg.destroy();

  // Heart (health pickup)
  const hg = scene.add.graphics();
  hg.fillStyle(0xff4444, 1);
  hg.fillCircle(4, 4, 4);
  hg.fillCircle(10, 4, 4);
  hg.fillTriangle(0, 5, 7, 13, 14, 5);
  hg.generateTexture('heart', 14, 14);
  hg.destroy();

  // Orb (orbit weapon)
  const og = scene.add.graphics();
  og.fillStyle(0x44ffaa, 1);
  og.fillCircle(6, 6, 6);
  og.fillStyle(0xaaffdd, 0.6);
  og.fillCircle(4, 4, 3);
  og.generateTexture('orb', 12, 12);
  og.destroy();

  // Projectile textures for each weapon
  for (const [id, def] of Object.entries(WEAPONS)) {
    if (def.type === 'projectile') {
      const wg = scene.add.graphics();
      wg.fillStyle(def.color, 1);
      wg.fillCircle(4, 4, 4);
      wg.fillStyle(0xffffff, 0.5);
      wg.fillCircle(3, 3, 2);
      wg.generateTexture(`proj_${id}`, 8, 8);
      wg.destroy();
    }
  }

  // Floor tile
  const fg = scene.add.graphics();
  fg.fillStyle(0x222233, 1);
  fg.fillRect(0, 0, 64, 64);
  fg.lineStyle(1, 0x333344, 0.3);
  fg.strokeRect(0, 0, 64, 64);
  // Add some subtle noise dots
  fg.fillStyle(0x2a2a3a, 1);
  for (let i = 0; i < 8; i++) {
    fg.fillRect(
      Phaser.Math.Between(2, 60),
      Phaser.Math.Between(2, 60),
      2, 2
    );
  }
  fg.generateTexture('floor_tile', 64, 64);
  fg.destroy();
}
