import Phaser from 'phaser';
import { ENEMIES } from '../config/enemyConfig';
import { WEAPONS } from '../config/weaponConfig';

/** Generate all sprites procedurally — no external assets needed */
export function generateAssets(scene: Phaser.Scene): void {
  generatePlayer(scene);
  generateEnemies(scene);
  generateDrops(scene);
  generateWeaponProjectiles(scene);
  generateFloorTile(scene);
}

function generatePlayer(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  // Hair
  g.fillStyle(0x553311, 1);
  g.fillRect(3, 0, 10, 3);
  // Head
  g.fillStyle(0xffcc88, 1);
  g.fillRect(4, 3, 8, 5);
  // Eyes
  g.fillStyle(0x222266, 1);
  g.fillRect(5, 4, 2, 2);
  g.fillRect(9, 4, 2, 2);
  // Mouth
  g.fillStyle(0xcc8866, 1);
  g.fillRect(6, 6, 4, 1);
  // Armor body
  g.fillStyle(0x3366cc, 1);
  g.fillRect(3, 8, 10, 5);
  // Armor detail
  g.fillStyle(0x4488ee, 1);
  g.fillRect(5, 9, 6, 3);
  // Belt
  g.fillStyle(0x886633, 1);
  g.fillRect(3, 12, 10, 1);
  // Legs
  g.fillStyle(0x2244aa, 1);
  g.fillRect(4, 13, 3, 3);
  g.fillRect(9, 13, 3, 3);
  // Boots
  g.fillStyle(0x553311, 1);
  g.fillRect(3, 15, 4, 1);
  g.fillRect(9, 15, 4, 1);
  // Sword hint
  g.fillStyle(0xcccccc, 1);
  g.fillRect(13, 6, 2, 7);
  g.fillStyle(0xdddd44, 1);
  g.fillRect(13, 5, 2, 1);
  g.generateTexture('player', 16, 16);
  g.destroy();
}

function generateEnemies(scene: Phaser.Scene): void {
  for (const [key, def] of Object.entries(ENEMIES)) {
    const g = scene.add.graphics();
    const s = def.size * 2;

    if (def.isBoss) {
      // Boss: skull-like shape
      g.fillStyle(def.color, 1);
      g.fillRect(2, 4, s - 4, s - 6);
      g.fillRect(4, 2, s - 8, 2);
      // Horns
      g.fillStyle(0xcc0000, 1);
      g.fillTriangle(1, 6, 3, 0, 5, 6);
      g.fillTriangle(s - 1, 6, s - 3, 0, s - 5, 6);
      // Glowing eyes
      g.fillStyle(0xff0000, 1);
      g.fillRect(Math.floor(s * 0.25), Math.floor(s * 0.35), 3, 3);
      g.fillRect(Math.floor(s * 0.6), Math.floor(s * 0.35), 3, 3);
      // Jaw
      g.fillStyle(def.color * 0.8, 1);
      g.fillRect(4, s - 4, s - 8, 3);
      // Teeth
      g.fillStyle(0xffffff, 1);
      for (let i = 0; i < 4; i++) {
        g.fillRect(5 + i * 3, s - 5, 2, 2);
      }
    } else {
      // Regular enemies: varied shapes
      switch (key) {
        case 'bat':
          // Wings
          g.fillStyle(def.color, 1);
          g.fillTriangle(0, s / 2, s / 2, s / 3, s / 4, s * 0.7);
          g.fillTriangle(s, s / 2, s / 2, s / 3, s * 0.75, s * 0.7);
          // Body
          g.fillStyle(def.color + 0x111111, 1);
          g.fillCircle(s / 2, s / 2, s / 4);
          // Eyes
          g.fillStyle(0xff4444, 1);
          g.fillRect(s / 2 - 3, s / 2 - 2, 2, 2);
          g.fillRect(s / 2 + 1, s / 2 - 2, 2, 2);
          break;

        case 'skeleton':
          // Skull
          g.fillStyle(0xeeeeee, 1);
          g.fillCircle(s / 2, s / 3, s / 4);
          // Body (ribcage)
          g.fillStyle(def.color, 1);
          g.fillRect(s / 3, s / 2 - 1, s / 3, s / 3);
          // Ribs
          g.lineStyle(1, 0xaaaaaa);
          for (let i = 0; i < 3; i++) {
            g.strokeRect(s / 3 + 1, s / 2 + i * 3, s / 3 - 2, 1);
          }
          // Eyes
          g.fillStyle(0x000000, 1);
          g.fillRect(s / 2 - 3, s / 3 - 2, 2, 3);
          g.fillRect(s / 2 + 1, s / 3 - 2, 2, 3);
          // Legs
          g.fillStyle(0xcccccc, 1);
          g.fillRect(s / 3 + 1, s * 0.7, 2, s / 4);
          g.fillRect(s * 0.55, s * 0.7, 2, s / 4);
          break;

        case 'ghost':
          // Ghostly body
          g.fillStyle(def.color, 0.7);
          g.fillCircle(s / 2, s / 3, s / 3);
          g.fillRect(s / 6, s / 3, s * 0.67, s / 2);
          // Wavy bottom
          for (let i = 0; i < 3; i++) {
            g.fillCircle(s / 4 + i * (s / 4), s * 0.8, s / 8);
          }
          // Eyes
          g.fillStyle(0x000066, 1);
          g.fillCircle(s / 2 - 3, s / 3, 2);
          g.fillCircle(s / 2 + 3, s / 3, 2);
          break;

        default:
          // Generic circular enemy
          g.fillStyle(def.color, 1);
          g.fillCircle(s / 2, s / 2, s / 2 - 1);
          // Eyes
          g.fillStyle(0xff0000, 1);
          g.fillRect(s * 0.3, s * 0.3, 2, 2);
          g.fillRect(s * 0.6, s * 0.3, 2, 2);
          // Mouth
          g.fillStyle(0x000000, 1);
          g.fillRect(s * 0.35, s * 0.6, s * 0.3, 2);
          break;
      }
    }

    g.generateTexture(`enemy_${key}`, s, s);
    g.destroy();
  }
}

function generateDrops(scene: Phaser.Scene): void {
  // XP gem (diamond)
  let g = scene.add.graphics();
  g.fillStyle(0xffdd44, 1);
  g.fillTriangle(4, 0, 8, 4, 4, 8);
  g.fillTriangle(4, 0, 0, 4, 4, 8);
  g.fillStyle(0xffee88, 1);
  g.fillTriangle(4, 1, 7, 4, 4, 7);
  g.generateTexture('xp_gem', 8, 8);
  g.destroy();

  // Heart
  g = scene.add.graphics();
  g.fillStyle(0xff4444, 1);
  g.fillCircle(4, 4, 4);
  g.fillCircle(10, 4, 4);
  g.fillTriangle(0, 5, 7, 13, 14, 5);
  g.fillStyle(0xff8888, 1);
  g.fillCircle(3, 3, 2);
  g.generateTexture('heart', 14, 14);
  g.destroy();

  // Gold coin
  g = scene.add.graphics();
  g.fillStyle(0xddaa22, 1);
  g.fillCircle(5, 5, 5);
  g.fillStyle(0xffcc44, 1);
  g.fillCircle(5, 5, 4);
  g.fillStyle(0xddaa22, 1);
  g.fillRect(4, 2, 3, 7); // $ symbol stripe
  g.fillStyle(0xffdd66, 1);
  g.fillCircle(4, 4, 2);
  g.generateTexture('gold_coin', 10, 10);
  g.destroy();

  // Treasure chest
  g = scene.add.graphics();
  // Chest body
  g.fillStyle(0x886633, 1);
  g.fillRect(1, 4, 14, 8);
  // Lid
  g.fillStyle(0xaa8844, 1);
  g.fillRect(0, 2, 16, 4);
  g.fillStyle(0x664422, 1);
  g.fillRect(0, 5, 16, 1);
  // Latch
  g.fillStyle(0xffdd44, 1);
  g.fillRect(6, 3, 4, 3);
  g.fillStyle(0xddaa22, 1);
  g.fillRect(7, 4, 2, 1);
  // Base shadow
  g.fillStyle(0x553311, 1);
  g.fillRect(1, 11, 14, 1);
  g.generateTexture('chest', 16, 12);
  g.destroy();

  // Orb (orbit weapon)
  g = scene.add.graphics();
  g.fillStyle(0x44ffaa, 1);
  g.fillCircle(6, 6, 6);
  g.fillStyle(0xaaffdd, 0.6);
  g.fillCircle(4, 4, 3);
  g.fillStyle(0xffffff, 0.3);
  g.fillCircle(3, 3, 1);
  g.generateTexture('orb', 12, 12);
  g.destroy();
}

function generateWeaponProjectiles(scene: Phaser.Scene): void {
  for (const [id, def] of Object.entries(WEAPONS)) {
    if (def.type === 'projectile') {
      const g = scene.add.graphics();
      g.fillStyle(def.color, 1);
      g.fillCircle(4, 4, 4);
      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(3, 3, 2);
      // Trail hint
      g.fillStyle(def.color, 0.3);
      g.fillCircle(2, 4, 3);
      g.generateTexture(`proj_${id}`, 8, 8);
      g.destroy();
    }
  }

  // Evolved weapon projectiles
  const evolvedProjectiles = [
    { id: 'arcane_storm', color: 0xaa44ff },
    { id: 'soul_eater', color: 0xff44ff },
    { id: 'divine_shield', color: 0x44ffff },
  ];
  for (const ep of evolvedProjectiles) {
    const g = scene.add.graphics();
    g.fillStyle(ep.color, 1);
    g.fillCircle(6, 6, 6);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(4, 4, 3);
    g.fillStyle(ep.color, 0.3);
    g.fillCircle(3, 6, 5);
    g.generateTexture(`proj_${ep.id}`, 12, 12);
    g.destroy();
  }

  // Evolved orb texture
  const og = scene.add.graphics();
  og.fillStyle(0x44ffff, 1);
  og.fillCircle(7, 7, 7);
  og.fillStyle(0xaaffff, 0.6);
  og.fillCircle(5, 5, 4);
  og.fillStyle(0xffffff, 0.4);
  og.fillCircle(4, 4, 2);
  og.generateTexture('orb_evolved', 14, 14);
  og.destroy();
}

function generateFloorTile(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  // Base
  g.fillStyle(0x1a1a2e, 1);
  g.fillRect(0, 0, 64, 64);
  // Grid lines
  g.lineStyle(1, 0x252540, 0.4);
  g.strokeRect(0, 0, 64, 64);
  g.strokeRect(0, 0, 32, 32);
  // Stone texture dots
  g.fillStyle(0x1e1e35, 1);
  const rng = new Phaser.Math.RandomDataGenerator(['floor']);
  for (let i = 0; i < 12; i++) {
    g.fillRect(rng.between(2, 60), rng.between(2, 60), rng.between(1, 3), rng.between(1, 3));
  }
  // Occasional crack
  g.lineStyle(1, 0x151528, 0.3);
  g.beginPath();
  g.moveTo(rng.between(5, 30), rng.between(5, 30));
  g.lineTo(rng.between(20, 55), rng.between(20, 55));
  g.strokePath();
  g.generateTexture('floor_tile', 64, 64);
  g.destroy();
}
