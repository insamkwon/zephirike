import Phaser from 'phaser';
import {
  PLAYER_SPEED,
  PLAYER_MAX_HP,
  PLAYER_INVINCIBILITY_MS,
  DAMAGE_FLASH_DURATION,
  DIAGONAL_FACTOR,
  XP_BASE_REQUIRED,
  XP_GROWTH_FACTOR,
} from '../config/constants';

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpToNext: number;
  kills: number;
  facingRight: boolean;
  invincible: boolean;
  private speed: number;
  private lastMoveX: number;
  private wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private arrows: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(10);
    this.setCollideWorldBounds(true);

    this.hp = PLAYER_MAX_HP;
    this.maxHp = PLAYER_MAX_HP;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = XP_BASE_REQUIRED;
    this.kills = 0;
    this.facingRight = true;
    this.invincible = false;
    this.speed = PLAYER_SPEED;
    this.lastMoveX = 1;

    const kb = scene.input.keyboard!;
    this.wasd = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.arrows = kb.createCursorKeys();
  }

  update(): void {
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
  }

  getFacingDir(): { x: number; y: number } {
    return { x: this.lastMoveX > 0 ? 1 : -1, y: 0 };
  }

  takeDamage(amount: number): void {
    if (this.invincible || this.hp <= 0) return;

    this.hp = Math.max(0, this.hp - amount);
    this.invincible = true;
    this.setAlpha(0.5);

    this.setTint(0xff0000);
    this.scene.time.delayedCall(DAMAGE_FLASH_DURATION, () => {
      this.clearTint();
    });

    this.scene.time.delayedCall(PLAYER_INVINCIBILITY_MS, () => {
      this.invincible = false;
      this.setAlpha(1);
    });

    if (this.hp <= 0) {
      this.scene.events.emit('player-death');
    }
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /** Returns true if player leveled up */
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
}
