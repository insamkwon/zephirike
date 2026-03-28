import Phaser from 'phaser';
import { EnemyDef } from '../config/enemyConfig';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
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

    this.enemyDef = def;
    this.maxHp = Math.floor(def.hp * hpMul);
    this.hp = this.maxHp;
    this.damage = def.damage;
    this.xpValue = def.xp;
    this.speed = def.speed * speedMul;

    this.setDepth(5);
    // Body size based on enemy
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(def.size, -def.size + 8, -def.size + 8);
  }

  chasePlayer(playerX: number, playerY: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
    this.setVelocity(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed
    );

    // Flip sprite based on direction
    this.setFlipX(playerX < this.x);
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;

    // Flash white
    this.setTint(0xffffff);
    if (this.damageTween) this.damageTween.stop();
    this.damageTween = this.scene.tweens.add({
      targets: this,
      duration: 80,
      onComplete: () => {
        if (this.active) this.clearTint();
      },
    });

    // Knockback
    const body = this.body as Phaser.Physics.Arcade.Body;
    const vx = body.velocity.x;
    const vy = body.velocity.y;
    const mag = Math.sqrt(vx * vx + vy * vy) || 1;
    body.setVelocity((-vx / mag) * 100, (-vy / mag) * 100);
    this.scene.time.delayedCall(100, () => {
      // Resume chase on next frame
    });

    if (this.hp <= 0) {
      this.die();
      return true; // killed
    }
    return false;
  }

  die(): void {
    this.scene.events.emit('enemy-killed', this);
    this.destroy();
  }
}
