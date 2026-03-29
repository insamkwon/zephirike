import Phaser from 'phaser';
import {
  PLAYER_SPEED,
  PLAYER_MAX_HP,
  PLAYER_INVINCIBILITY_MS,
  DAMAGE_FLASH_DURATION,
  DIAGONAL_FACTOR,
  XP_BASE_REQUIRED,
  XP_GROWTH_FACTOR,
  PLAYER_MAGNET_RANGE,
} from '../config/constants';

export interface PlayerBonuses {
  bonusHp: number;
  speedMul: number;
  damageMul: number;
  xpMul: number;
  magnetMul: number;
}

const HP_BAR_W = 40;
const HP_BAR_H = 5;
const HP_BAR_OFFSET_Y = 20;
const HP_BAR_RADIUS = 2;

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpToNext: number;
  kills: number;
  facingRight: boolean;
  invincible: boolean;
  magnetRange: number;
  metaDamageMul: number;

  // Passive bonuses (accumulated during run)
  armorReduction = 0;
  cooldownReduction = 0;
  luckLevel = 0;
  mightBonus = 0;
  recoveryLevel = 0;
  private recoveryTimer = 0;

  private speed: number;
  private lastMoveX: number;
  private wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private arrows: Phaser.Types.Input.Keyboard.CursorKeys;
  private invincBlink: Phaser.Tweens.Tween | null = null;

  /** HP bar graphics — follows player in world space */
  private hpBarGfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, bonuses?: PlayerBonuses) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(10);
    this.setCollideWorldBounds(true);

    // Player glow (preFX)
    try {
      this.preFX?.addGlow(0x44aaff, 2, 0, false, 0.1, 10);
    } catch { /* Canvas renderer fallback */ }

    const b = bonuses ?? { bonusHp: 0, speedMul: 1, damageMul: 1, xpMul: 1, magnetMul: 1 };
    this.maxHp = PLAYER_MAX_HP + b.bonusHp;
    this.hp = this.maxHp;
    this.speed = PLAYER_SPEED * b.speedMul;
    this.magnetRange = PLAYER_MAGNET_RANGE * b.magnetMul;
    this.metaDamageMul = b.damageMul;

    this.level = 1;
    this.xp = 0;
    this.xpToNext = XP_BASE_REQUIRED;
    this.kills = 0;
    this.facingRight = true;
    this.invincible = false;
    this.lastMoveX = 1;

    const kb = scene.input.keyboard!;
    this.wasd = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.arrows = kb.createCursorKeys();

    // Create HP bar graphics (world-space, follows player)
    this.hpBarGfx = scene.add.graphics().setDepth(11);
  }

  update(delta?: number): void {
    let vx = 0;
    let vy = 0;

    if (this.wasd.left.isDown || this.arrows.left.isDown) vx -= 1;
    if (this.wasd.right.isDown || this.arrows.right.isDown) vx += 1;
    if (this.wasd.up.isDown || this.arrows.up.isDown) vy -= 1;
    if (this.wasd.down.isDown || this.arrows.down.isDown) vy += 1;

    if (vx !== 0 && vy !== 0) {
      vx *= DIAGONAL_FACTOR;
      vy *= DIAGONAL_FACTOR;
    }

    this.setVelocity(vx * this.speed, vy * this.speed);

    if (vx !== 0) {
      this.lastMoveX = vx;
      this.facingRight = vx > 0;
      this.setFlipX(!this.facingRight);
    }

    // HP recovery passive with visual feedback
    if (this.recoveryLevel > 0 && delta) {
      this.recoveryTimer += delta;
      const interval = this.recoveryLevel >= 2 ? 3000 : 5000;
      const amount = this.recoveryLevel >= 3 ? 2 : 1;
      if (this.recoveryTimer >= interval) {
        this.recoveryTimer -= interval;
        if (this.hp < this.maxHp) {
          this.heal(amount);
          this.scene.events.emit('player-heal', this.x, this.y, amount);
        }
      }
    }

    // Update HP bar position and drawing
    this.drawHpBar();
  }

  private drawHpBar(): void {
    this.hpBarGfx.clear();
    const ratio = this.hp / this.maxHp;
    const bx = this.x - HP_BAR_W / 2;
    const by = this.y + HP_BAR_OFFSET_Y;

    // Background
    this.hpBarGfx.fillStyle(0x000000, 0.5);
    this.hpBarGfx.fillRoundedRect(bx, by, HP_BAR_W, HP_BAR_H, HP_BAR_RADIUS);

    // Fill color based on HP ratio
    let color: number;
    if (ratio > 0.5) color = 0x44DD44;
    else if (ratio > 0.25) color = 0xFFAA00;
    else color = 0xFF3333;

    const fillW = Math.max(ratio * HP_BAR_W, ratio > 0 ? HP_BAR_RADIUS * 2 : 0);
    if (fillW > 0) {
      this.hpBarGfx.fillStyle(color, 1);
      this.hpBarGfx.fillRoundedRect(bx, by, fillW, HP_BAR_H, HP_BAR_RADIUS);
      // Shine
      this.hpBarGfx.fillStyle(0xffffff, 0.3);
      this.hpBarGfx.fillRoundedRect(bx + 1, by + 1, fillW - 2, 2, 1);
    }
  }

  getFacingDir(): { x: number; y: number } {
    return { x: this.lastMoveX > 0 ? 1 : -1, y: 0 };
  }

  takeDamage(amount: number): void {
    if (this.invincible || this.hp <= 0) return;

    const reduced = Math.max(1, Math.floor(amount * (1 - this.armorReduction)));
    this.hp = Math.max(0, this.hp - reduced);
    this.invincible = true;

    // Damage flash — red tint
    this.setTint(0xff0000);
    this.scene.time.delayedCall(DAMAGE_FLASH_DURATION, () => {
      if (this.active) this.clearTint();
    });

    // Invincibility blink
    if (this.invincBlink) this.invincBlink.stop();
    this.invincBlink = this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.3, to: 0.9 },
      yoyo: true,
      repeat: -1,
      duration: 80,
    });

    this.scene.time.delayedCall(PLAYER_INVINCIBILITY_MS, () => {
      this.invincible = false;
      if (this.invincBlink) {
        this.invincBlink.stop();
        this.invincBlink = null;
      }
      this.setAlpha(1);
    });

    if (this.hp <= 0) {
      this.scene.events.emit('player-death');
    }
  }

  heal(amount: number): void {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    if (this.hp > before) {
      this.setTint(0x44ff44);
      this.scene.time.delayedCall(120, () => {
        if (this.active) this.clearTint();
      });
    }
  }

  addXp(amount: number): boolean {
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(XP_BASE_REQUIRED * Math.pow(XP_GROWTH_FACTOR, this.level - 1));
      return true;
    }
    return false;
  }

  applyPassive(passiveId: string, level: number): void {
    switch (passiveId) {
      case 'armor': this.armorReduction = level * 0.05; break;
      case 'haste': this.cooldownReduction = level * 0.05; break;
      case 'luck': this.luckLevel = level; break;
      case 'might': this.mightBonus = level * 0.10; break;
      case 'recovery': this.recoveryLevel = level; break;
    }
  }
}
