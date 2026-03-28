import Phaser from 'phaser';
import { EnemyDef } from '../config/enemyConfig';
import { ENEMY_KNOCKBACK_SPEED, ENEMY_DAMAGE_FLASH_MS } from '../config/constants';

let nextEnemyId = 1;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly uid: number;
  enemyDef: EnemyDef;
  hp: number;
  maxHp: number;
  damage: number;
  xpValue: number;
  speed: number;
  private damageTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, def: EnemyDef, hpMul = 1, speedMul = 1) {
    super(scene, x, y, `enemy_${def.key}`);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.uid = nextEnemyId++;
    this.enemyDef = def;
    this.maxHp = Math.floor(def.hp * hpMul);
    this.hp = this.maxHp;
    this.damage = def.damage;
    this.xpValue = def.xp;
    this.speed = def.speed * speedMul;

    this.setDepth(5);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(def.size, -def.size + 8, -def.size + 8);
  }

  chasePlayer(playerX: number, playerY: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
    this.setVelocity(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed
    );
    this.setFlipX(playerX < this.x);
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;

    // Flash white
    this.setTint(0xffffff);
    if (this.damageTween) this.damageTween.stop();
    this.damageTween = this.scene.tweens.add({
      targets: this,
      duration: ENEMY_DAMAGE_FLASH_MS,
      onComplete: () => {
        if (this.active) this.clearTint();
      },
    });

    // Knockback — reverse current velocity briefly
    const body = this.body as Phaser.Physics.Arcade.Body;
    const vx = body.velocity.x;
    const vy = body.velocity.y;
    const mag = Math.sqrt(vx * vx + vy * vy) || 1;
    body.setVelocity(
      (-vx / mag) * ENEMY_KNOCKBACK_SPEED,
      (-vy / mag) * ENEMY_KNOCKBACK_SPEED
    );

    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  private die(): void {
    this.scene.events.emit('enemy-killed', this);
    this.destroy();
  }
}
