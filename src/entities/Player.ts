import Phaser from 'phaser';
import {
  PLAYER_SPEED,
  PLAYER_MAX_HP,
  PLAYER_INVINCIBILITY_MS,
  DAMAGE_FLASH_DURATION,
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
  private cursors!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private lastMoveX: number;

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
    this.xpToNext = 10;
    this.kills = 0;
    this.facingRight = true;
    this.invincible = false;
    this.speed = PLAYER_SPEED;
    this.lastMoveX = 1;

    const kb = scene.input.keyboard!;
    this.cursors = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    // Also allow arrow keys
    const arrows = scene.input.keyboard!.createCursorKeys();
    this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);

    this.cursors = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.arrowKeys = arrows;
  }

  private arrowKeys!: Phaser.Types.Input.Keyboard.CursorKeys;

  update(): void {
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.arrowKeys.left.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.arrowKeys.right.isDown) vx += 1;
    if (this.cursors.up.isDown || this.arrowKeys.up.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.arrowKeys.down.isDown) vy += 1;

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      const f = 0.7071; // 1/sqrt(2)
      vx *= f;
      vy *= f;
    }

    this.setVelocity(vx * this.speed, vy * this.speed);

    // Track facing direction
    if (vx !== 0) {
      this.lastMoveX = vx;
      this.facingRight = vx > 0;
      this.setFlipX(!this.facingRight);
    }
  }

  /** Returns normalized facing direction */
  getFacingDir(): { x: number; y: number } {
    return { x: this.lastMoveX > 0 ? 1 : -1, y: 0 };
  }

  takeDamage(amount: number): void {
    if (this.invincible || this.hp <= 0) return;

    this.hp = Math.max(0, this.hp - amount);
    this.invincible = true;
    this.setAlpha(0.5);

    // Flash effect
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

  addXp(amount: number): boolean {
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(10 * Math.pow(1.3, this.level - 1));
      return true; // leveled up
    }
    return false;
  }
}
