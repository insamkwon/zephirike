import Phaser from 'phaser';
import { ENEMIES } from '../config/enemyConfig';
import { WEAPONS } from '../config/weaponConfig';

/**
 * Survivor.io-style procedural asset generation.
 * Brighter, more vibrant colors — casual mobile game feel.
 */
export function generateAssets(scene: Phaser.Scene): void {
  generateSoftGlow(scene);
  generatePlayer(scene);
  generateEnemies(scene);
  generateDrops(scene);
  generateWeaponProjectiles(scene);
  generateFloorTile(scene);
}

// ── Utility ──

function ctx(scene: Phaser.Scene, key: string, w: number, h: number): {
  c: CanvasRenderingContext2D;
  done: () => void;
} {
  const canvas = scene.textures.createCanvas(key, w, h)!;
  const c = canvas.getContext();
  return {
    c,
    done: () => canvas.refresh(),
  };
}

function radialGrad(
  c: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  innerColor: string, outerColor: string
): CanvasGradient {
  const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, innerColor);
  g.addColorStop(1, outerColor);
  return g;
}

// ── Soft glow texture ──

function generateSoftGlow(scene: Phaser.Scene): void {
  if (scene.textures.exists('soft_glow')) return;
  const { c, done } = ctx(scene, 'soft_glow', 32, 32);
  c.fillStyle = radialGrad(c, 16, 16, 16, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)');
  c.fillRect(0, 0, 32, 32);
  done();
}

// ── Player (32x32) ──

function generatePlayer(scene: Phaser.Scene): void {
  const S = 32;
  const { c, done } = ctx(scene, 'player', S, S);

  // Shadow
  c.fillStyle = 'rgba(0,0,0,0.3)';
  c.beginPath();
  c.ellipse(S / 2, S - 3, 10, 4, 0, 0, Math.PI * 2);
  c.fill();

  // Body/armor — bright blue
  c.fillStyle = '#3388dd';
  roundRect(c, 8, 12, 16, 12, 3);
  c.fillStyle = '#55aaee';
  roundRect(c, 10, 13, 12, 5, 2);

  // Head
  c.fillStyle = '#ffcc88';
  c.beginPath();
  c.arc(S / 2, 9, 7, 0, Math.PI * 2);
  c.fill();

  // Hair
  c.fillStyle = '#664422';
  c.beginPath();
  c.arc(S / 2, 7, 7, Math.PI, Math.PI * 2);
  c.fill();

  // Eyes
  c.fillStyle = '#222266';
  c.fillRect(13, 8, 2, 3);
  c.fillRect(18, 8, 2, 3);
  c.fillStyle = '#ffffff';
  c.fillRect(13, 8, 1, 1);
  c.fillRect(18, 8, 1, 1);

  // Belt
  c.fillStyle = '#996633';
  c.fillRect(8, 23, 16, 2);
  c.fillStyle = '#FFD700';
  c.fillRect(14, 23, 4, 2);

  // Legs
  c.fillStyle = '#2266aa';
  c.fillRect(10, 25, 5, 5);
  c.fillRect(17, 25, 5, 5);

  // Boots
  c.fillStyle = '#554433';
  roundRect(c, 9, 29, 6, 3, 1);
  roundRect(c, 17, 29, 6, 3, 1);

  // Sword
  c.fillStyle = '#dddddd';
  c.fillRect(25, 8, 2, 14);
  c.fillStyle = '#999999';
  c.fillRect(25, 7, 2, 1);
  c.fillStyle = '#FFD700';
  c.fillRect(23, 21, 6, 2);

  done();
}

// ── Enemies ──

function generateEnemies(scene: Phaser.Scene): void {
  for (const [key, def] of Object.entries(ENEMIES)) {
    const s = Math.max(def.size * 4, 32);
    const { c, done } = ctx(scene, `enemy_${key}`, s, s);
    const cx2 = s / 2;
    const cy2 = s / 2;
    const hexColor = '#' + def.color.toString(16).padStart(6, '0');

    switch (key) {
      case 'bat': {
        c.fillStyle = hexColor;
        c.beginPath();
        c.moveTo(cx2, cy2 - 4);
        c.quadraticCurveTo(0, cy2 - 8, 2, cy2 + 6);
        c.quadraticCurveTo(cx2 / 2, cy2, cx2, cy2);
        c.fill();
        c.beginPath();
        c.moveTo(cx2, cy2 - 4);
        c.quadraticCurveTo(s, cy2 - 8, s - 2, cy2 + 6);
        c.quadraticCurveTo(cx2 + cx2 / 2, cy2, cx2, cy2);
        c.fill();
        c.fillStyle = radialGrad(c, cx2, cy2, s / 5, '#cc88ee', hexColor);
        c.beginPath();
        c.arc(cx2, cy2, s / 5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#ff6666';
        c.fillRect(cx2 - 4, cy2 - 3, 3, 3);
        c.fillRect(cx2 + 1, cy2 - 3, 3, 3);
        c.fillStyle = '#ffaaaa';
        c.fillRect(cx2 - 4, cy2 - 3, 1, 1);
        c.fillRect(cx2 + 1, cy2 - 3, 1, 1);
        break;
      }
      case 'skeleton': {
        c.fillStyle = radialGrad(c, cx2, s * 0.3, s / 4, '#ffffff', '#ddddcc');
        c.beginPath();
        c.arc(cx2, s * 0.3, s / 4, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#331133';
        c.fillRect(cx2 - 5, s * 0.25, 4, 5);
        c.fillRect(cx2 + 1, s * 0.25, 4, 5);
        c.fillStyle = '#aa9988';
        c.fillRect(cx2 - 1, s * 0.35, 2, 3);
        c.fillStyle = '#eeeecc';
        c.fillRect(cx2 - 5, s * 0.4, 10, 3);
        c.fillStyle = '#ccccbb';
        for (let i = 0; i < 4; i++) {
          c.fillRect(cx2 - 6, s * 0.5 + i * 4, 12, 2);
        }
        c.fillStyle = hexColor;
        c.fillRect(cx2 - 1, s * 0.45, 2, s * 0.3);
        c.fillStyle = '#bbbbaa';
        c.fillRect(cx2 - 5, s * 0.75, 3, s * 0.2);
        c.fillRect(cx2 + 2, s * 0.75, 3, s * 0.2);
        break;
      }
      case 'ghost': {
        c.fillStyle = radialGrad(c, cx2, cy2 * 0.8, s * 0.4, 'rgba(180,180,255,0.85)', 'rgba(180,180,255,0.1)');
        c.beginPath();
        c.arc(cx2, cy2 * 0.7, s * 0.35, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = 'rgba(180,180,255,0.5)';
        c.beginPath();
        c.moveTo(cx2 - s * 0.3, cy2);
        c.quadraticCurveTo(cx2 - s * 0.15, s * 0.9, cx2, cy2 + 2);
        c.quadraticCurveTo(cx2 + s * 0.15, s * 0.9, cx2 + s * 0.3, cy2);
        c.fill();
        c.fillStyle = '#000066';
        c.beginPath();
        c.arc(cx2 - 5, cy2 * 0.7, 3, 0, Math.PI * 2);
        c.arc(cx2 + 5, cy2 * 0.7, 3, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#6666ff';
        c.beginPath();
        c.arc(cx2 - 5, cy2 * 0.7, 1.5, 0, Math.PI * 2);
        c.arc(cx2 + 5, cy2 * 0.7, 1.5, 0, Math.PI * 2);
        c.fill();
        break;
      }
      case 'zombie': {
        c.fillStyle = radialGrad(c, cx2, cy2, s * 0.4, '#66cc66', hexColor);
        c.beginPath();
        c.arc(cx2, cy2 * 0.7, s * 0.25, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#4d9d4d';
        roundRect(c, cx2 - 8, cy2 - 2, 16, 14, 3);
        c.fillStyle = hexColor;
        c.fillRect(cx2 - 14, cy2, 6, 3);
        c.fillRect(cx2 + 8, cy2, 6, 3);
        c.fillStyle = '#ffee00';
        c.fillRect(cx2 - 4, cy2 * 0.65, 3, 3);
        c.fillRect(cx2 + 1, cy2 * 0.65, 3, 3);
        c.fillStyle = '#447744';
        c.fillRect(cx2 - 5, cy2 + 10, 4, 8);
        c.fillRect(cx2 + 1, cy2 + 10, 4, 8);
        break;
      }
      case 'demon': {
        c.fillStyle = radialGrad(c, cx2, cy2, s * 0.4, '#ff7777', hexColor);
        c.beginPath();
        c.arc(cx2, cy2, s * 0.35, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#aa0000';
        c.beginPath();
        c.moveTo(cx2 - 8, cy2 - s * 0.25);
        c.lineTo(cx2 - 12, cy2 - s * 0.5);
        c.lineTo(cx2 - 3, cy2 - s * 0.2);
        c.fill();
        c.beginPath();
        c.moveTo(cx2 + 8, cy2 - s * 0.25);
        c.lineTo(cx2 + 12, cy2 - s * 0.5);
        c.lineTo(cx2 + 3, cy2 - s * 0.2);
        c.fill();
        c.fillStyle = '#ffcc00';
        c.beginPath();
        c.arc(cx2 - 5, cy2 - 3, 3, 0, Math.PI * 2);
        c.arc(cx2 + 5, cy2 - 3, 3, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#ff2200';
        c.beginPath();
        c.arc(cx2 - 5, cy2 - 3, 1.5, 0, Math.PI * 2);
        c.arc(cx2 + 5, cy2 - 3, 1.5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#330000';
        c.fillRect(cx2 - 5, cy2 + 5, 10, 3);
        c.fillStyle = '#ffffff';
        for (let i = 0; i < 4; i++) c.fillRect(cx2 - 4 + i * 3, cy2 + 5, 2, 2);
        break;
      }
      case 'reaper': {
        c.fillStyle = radialGrad(c, cx2, cy2 * 0.8, s * 0.45, '#442244', '#110011');
        c.beginPath();
        c.arc(cx2, cy2 * 0.7, s * 0.35, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#220022';
        c.beginPath();
        c.moveTo(cx2 - s * 0.35, cy2 * 0.8);
        c.quadraticCurveTo(cx2 - s * 0.4, s * 0.95, cx2, s * 0.95);
        c.quadraticCurveTo(cx2 + s * 0.4, s * 0.95, cx2 + s * 0.35, cy2 * 0.8);
        c.fill();
        c.fillStyle = '#ff2222';
        c.beginPath();
        c.arc(cx2 - 5, cy2 * 0.65, 3, 0, Math.PI * 2);
        c.arc(cx2 + 5, cy2 * 0.65, 3, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = radialGrad(c, cx2 - 5, cy2 * 0.65, 6, 'rgba(255,0,0,0.5)', 'rgba(255,0,0,0)');
        c.fillRect(cx2 - 11, cy2 * 0.65 - 6, 12, 12);
        c.fillStyle = radialGrad(c, cx2 + 5, cy2 * 0.65, 6, 'rgba(255,0,0,0.5)', 'rgba(255,0,0,0)');
        c.fillRect(cx2 - 1, cy2 * 0.65 - 6, 12, 12);
        c.strokeStyle = '#999999';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(cx2 + s * 0.3, cy2 * 0.4);
        c.lineTo(cx2 + s * 0.3, s * 0.9);
        c.stroke();
        c.fillStyle = '#bbbbbb';
        c.beginPath();
        c.moveTo(cx2 + s * 0.3, cy2 * 0.4);
        c.quadraticCurveTo(cx2 + s * 0.5, cy2 * 0.2, cx2 + s * 0.15, cy2 * 0.55);
        c.fill();
        break;
      }
      default: {
        c.fillStyle = radialGrad(c, cx2, cy2, s * 0.4, '#ffffff', hexColor);
        c.beginPath();
        c.arc(cx2, cy2, s * 0.4, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#ff0000';
        c.fillRect(cx2 - 4, cy2 - 3, 3, 3);
        c.fillRect(cx2 + 1, cy2 - 3, 3, 3);
        break;
      }
    }
    done();
  }
}

// ── Drops — brighter, more vibrant ──

function generateDrops(scene: Phaser.Scene): void {
  // XP gem — bright golden diamond
  {
    const { c, done } = ctx(scene, 'xp_gem', 16, 16);
    c.fillStyle = radialGrad(c, 8, 8, 8, '#ffffcc', '#FFB300');
    c.beginPath();
    c.moveTo(8, 0); c.lineTo(16, 8); c.lineTo(8, 16); c.lineTo(0, 8);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.6)';
    c.beginPath();
    c.moveTo(8, 2); c.lineTo(13, 8); c.lineTo(8, 10); c.lineTo(3, 8);
    c.closePath();
    c.fill();
    done();
  }

  // Heart — bright red
  {
    const { c, done } = ctx(scene, 'heart', 20, 20);
    c.fillStyle = radialGrad(c, 10, 8, 10, '#ff7777', '#dd2222');
    c.beginPath();
    c.moveTo(10, 18);
    c.bezierCurveTo(0, 10, 0, 2, 10, 6);
    c.bezierCurveTo(20, 2, 20, 10, 10, 18);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.beginPath();
    c.arc(6, 6, 3, 0, Math.PI * 2);
    c.fill();
    done();
  }

  // Gold coin — vivid yellow
  {
    const { c, done } = ctx(scene, 'gold_coin', 16, 16);
    c.fillStyle = radialGrad(c, 8, 8, 7, '#ffee77', '#ddaa00');
    c.beginPath();
    c.arc(8, 8, 7, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#bb8800';
    c.lineWidth = 1;
    c.stroke();
    c.fillStyle = '#eebb22';
    c.font = 'bold 10px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('$', 8, 9);
    c.fillStyle = 'rgba(255,255,255,0.4)';
    c.beginPath();
    c.arc(6, 6, 3, 0, Math.PI * 2);
    c.fill();
    done();
  }

  // Chest
  {
    const { c, done } = ctx(scene, 'chest', 24, 20);
    c.fillStyle = '#886633';
    roundRect(c, 2, 8, 20, 10, 2);
    c.fillStyle = '#aa7744';
    roundRect(c, 1, 3, 22, 7, 3);
    c.fillStyle = '#775522';
    c.fillRect(1, 9, 22, 1);
    c.fillStyle = '#FFD700';
    roundRect(c, 9, 5, 6, 6, 1);
    c.fillStyle = '#ddaa22';
    c.fillRect(10, 8, 4, 1);
    c.fillStyle = 'rgba(255,255,255,0.2)';
    roundRect(c, 3, 4, 8, 4, 1);
    done();
  }

  // Orb — bright green
  {
    const { c, done } = ctx(scene, 'orb', 20, 20);
    c.fillStyle = radialGrad(c, 10, 10, 10, '#bbffdd', '#33bb66');
    c.beginPath();
    c.arc(10, 10, 9, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = radialGrad(c, 8, 8, 5, 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0)');
    c.beginPath();
    c.arc(8, 8, 5, 0, Math.PI * 2);
    c.fill();
    done();
  }

  // Evolved orb — bright cyan
  {
    const { c, done } = ctx(scene, 'orb_evolved', 24, 24);
    c.fillStyle = radialGrad(c, 12, 12, 12, '#aaffff', '#2299bb');
    c.beginPath();
    c.arc(12, 12, 11, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = radialGrad(c, 10, 10, 6, 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0)');
    c.beginPath();
    c.arc(10, 10, 6, 0, Math.PI * 2);
    c.fill();
    done();
  }
}

// ── Weapon Projectiles ──

function generateWeaponProjectiles(scene: Phaser.Scene): void {
  const allProjectiles = [
    ...Object.entries(WEAPONS).filter(([_, d]) => d.type === 'projectile').map(([id, d]) => ({ id, color: d.color, size: 16 })),
    { id: 'arcane_storm', color: 0xaa44ff, size: 20 },
    { id: 'soul_eater', color: 0xff44ff, size: 20 },
    { id: 'divine_shield', color: 0x44ffff, size: 20 },
    { id: 'soul_drain', color: 0xaa44aa, size: 20 },
    { id: 'divine_flood', color: 0x2288ff, size: 20 },
    { id: 'thunder_god', color: 0xffff00, size: 20 },
  ];

  for (const { id, color, size } of allProjectiles) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const { c, done } = ctx(scene, `proj_${id}`, size, size);
    const half = size / 2;

    c.fillStyle = radialGrad(c, half, half, half, hex, 'rgba(0,0,0,0)');
    c.fillRect(0, 0, size, size);
    c.fillStyle = radialGrad(c, half, half, half * 0.5, '#ffffff', hex);
    c.beginPath();
    c.arc(half, half, half * 0.5, 0, Math.PI * 2);
    c.fill();

    done();
  }
}

// ── Floor Tile — bright grass/outdoor feel ──

function generateFloorTile(scene: Phaser.Scene): void {
  const S = 128;
  const { c, done } = ctx(scene, 'floor_tile', S, S);

  // Base — bright green-grey field
  c.fillStyle = radialGrad(c, S / 2, S / 2, S * 0.7, '#3a5a3a', '#2d4a2d');
  c.fillRect(0, 0, S, S);

  // Subtle grid
  c.strokeStyle = 'rgba(80,120,80,0.2)';
  c.lineWidth = 1;
  c.strokeRect(0, 0, S, S);
  c.strokeRect(0, 0, S / 2, S / 2);

  // Grass-like texture dots
  const rng = new Phaser.Math.RandomDataGenerator(['floor']);
  for (let i = 0; i < 25; i++) {
    const sx = rng.between(2, S - 4);
    const sy = rng.between(2, S - 4);
    const sw = rng.between(2, 5);
    const sh = rng.between(2, 4);
    const alpha = rng.realInRange(0.1, 0.25);
    c.fillStyle = `rgba(60,90,60,${alpha})`;
    c.fillRect(sx, sy, sw, sh);
  }

  // Small grass blades
  c.strokeStyle = 'rgba(70,110,70,0.15)';
  c.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    c.beginPath();
    c.moveTo(rng.between(5, S / 2), rng.between(5, S / 2));
    c.lineTo(rng.between(S / 4, S - 5), rng.between(S / 4, S - 5));
    c.stroke();
  }

  done();
}

// ── Helper: rounded rectangle ──

function roundRect(
  c: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
): void {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
  c.fill();
}
