import Phaser from 'phaser';
import { EnemyDef } from '../config/enemyConfig';
import { ENEMY_KNOCKBACK_SPEED, ENEMY_DAMAGE_FLASH_MS, ENEMY_KNOCKBACK_MS } from '../config/constants';

let nextEnemyId = 1;

/** Orbit hit cooldown tracking — prevents orbit dealing damage every frame */
const ORB_HIT_COOLDOWN_MS = 500;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly uid: number;
  enemyDef: EnemyDef;
  hp: number;
  maxHp: number;
  damage: number;
  xpValue: number;
  speed: number;
  isElite: boolean;
  /** Per-source hit cooldown timestamps (for orbit weapons, area ticks, etc.) */
  lastHitBy = new Map<string, number>();

  private damageTween: Phaser.Tweens.Tween | null = null;
  private knockedBack = false;

  // AI state
  private aiTimer = 0;
  private aiPhase = 0;
  private charging = false;
  private teleportTimer = 0;
  private zigzagOffset = 0;

  constructor(
    scene: Phaser.Scene, x: number, y: number,
    def: EnemyDef, hpMul = 1, speedMul = 1, elite = false
  ) {
    super(scene, x, y, `enemy_${def.key}`);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.uid = nextEnemyId++;
    this.enemyDef = def;
    this.isElite = elite;

    const eliteMul = elite ? 3 : 1;
    this.maxHp = Math.floor(def.hp * hpMul * eliteMul);
    this.hp = this.maxHp;
    this.damage = Math.floor(def.damage * (elite ? 1.5 : 1));
    this.xpValue = Math.floor(def.xp * (elite ? 5 : 1));
    this.speed = def.speed * speedMul * (elite ? 0.8 : 1);

    this.setDepth(5);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(def.size, -def.size + 8, -def.size + 8);

    // Randomize initial AI state to desync enemies
    this.aiTimer = Phaser.Math.Between(0, 2000);
    this.zigzagOffset = Phaser.Math.Between(0, 1000);

    if (elite) {
      this.setScale(1.5);
      this.setTint(0xffdd44);
      scene.tweens.add({
        targets: this,
        alpha: { from: 1, to: 0.7 },
        yoyo: true, repeat: -1, duration: 400,
      });
    }
  }

  /** Check if this enemy can be hit by a source (cooldown-gated) */
  canBeHitBy(sourceId: string, now: number): boolean {
    const last = this.lastHitBy.get(sourceId);
    if (last !== undefined && now - last < ORB_HIT_COOLDOWN_MS) return false;
    this.lastHitBy.set(sourceId, now);
    return true;
  }

  /** AI-driven movement toward player */
  moveToward(playerX: number, playerY: number, delta: number): void {
    if (this.knockedBack) return;

    this.aiTimer += delta;

    switch (this.enemyDef.ai) {
      case 'chase':
        this.aiChase(playerX, playerY);
        break;
      case 'zigzag':
        this.aiZigzag(playerX, playerY);
        break;
      case 'ranged':
        this.aiRanged(playerX, playerY);
        break;
      case 'teleport':
        this.aiTeleport(playerX, playerY, delta);
        break;
      case 'pack':
        this.aiPack(playerX, playerY);
        break;
      case 'charge':
        this.aiCharge(playerX, playerY);
        break;
    }

    this.setFlipX(playerX < this.x);
  }

  // ── AI Behaviors ──

  private aiChase(px: number, py: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, px, py);
    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
  }

  /** Bat: weaves side to side while approaching */
  private aiZigzag(px: number, py: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, px, py);
    const wobble = Math.sin((this.aiTimer + this.zigzagOffset) * 0.005) * 1.2;
    const finalAngle = angle + wobble;
    this.setVelocity(
      Math.cos(finalAngle) * this.speed,
      Math.sin(finalAngle) * this.speed
    );
  }

  /** Skeleton: approaches to range ~200, then stops and "fires" (damage via proximity pulse) */
  private aiRanged(px: number, py: number): void {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, px, py);
    const angle = Phaser.Math.Angle.Between(this.x, this.y, px, py);

    if (dist > 220) {
      // Approach
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    } else if (dist < 150) {
      // Too close — back away
      this.setVelocity(-Math.cos(angle) * this.speed * 0.5, -Math.sin(angle) * this.speed * 0.5);
    } else {
      // In range — strafe slowly
      const strafeAngle = angle + Math.PI / 2;
      const strafeDir = Math.sin(this.aiTimer * 0.002) > 0 ? 1 : -1;
      this.setVelocity(
        Math.cos(strafeAngle) * this.speed * 0.3 * strafeDir,
        Math.sin(strafeAngle) * this.speed * 0.3 * strafeDir
      );

      // Fire bone projectile every 2s (handled as contact damage burst)
      if (this.aiTimer - this.aiPhase > 2000) {
        this.aiPhase = this.aiTimer;
        this.scene.events.emit('enemy-ranged-attack', this, px, py);
      }
    }
  }

  /** Ghost: fades in/out, periodically teleports closer */
  private aiTeleport(px: number, py: number, delta: number): void {
    this.teleportTimer += delta;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, px, py);

    // Normal movement (slower)
    this.setVelocity(Math.cos(angle) * this.speed * 0.6, Math.sin(angle) * this.speed * 0.6);

    // Flicker effect
    if (this.active) {
      this.setAlpha(0.4 + 0.6 * Math.abs(Math.sin(this.aiTimer * 0.003)));
    }

    // Teleport every 3-5 seconds
    if (this.teleportTimer > Phaser.Math.Between(3000, 5000)) {
      this.teleportTimer = 0;
      // Teleport to random position near player
      const dist = Phaser.Math.Between(100, 200);
      const tAngle = Math.random() * Math.PI * 2;
      this.setPosition(px + Math.cos(tAngle) * dist, py + Math.sin(tAngle) * dist);
      this.setAlpha(0);
      this.scene.tweens.add({
        targets: this, alpha: 1, duration: 300,
      });
    }
  }

  /** Zombie: moves toward player but clumps with nearby zombies */
  private aiPack(px: number, py: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, px, py);
    // Slight random wobble to create organic pack movement
    const wobble = Math.sin(this.aiTimer * 0.002 + this.uid * 0.7) * 0.3;
    this.setVelocity(
      Math.cos(angle + wobble) * this.speed,
      Math.sin(angle + wobble) * this.speed
    );
  }

  /** Demon: pauses, then charges at high speed toward player's position */
  private aiCharge(px: number, py: number): void {
    if (this.charging) return; // mid-charge, velocity already set

    const dist = Phaser.Math.Distance.Between(this.x, this.y, px, py);

    if (dist > 300) {
      // Approach normally
      const angle = Phaser.Math.Angle.Between(this.x, this.y, px, py);
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
      this.aiPhase = 0;
    } else {
      // In charge range — wind up then charge
      this.aiPhase++;
      if (this.aiPhase < 40) {
        // Wind-up: slow down, flash red
        this.setVelocity(0, 0);
        if (this.aiPhase % 10 < 5) this.setTint(0xff0000);
        else this.clearTint();
      } else if (this.aiPhase === 40) {
        // Charge!
        this.charging = true;
        this.clearTint();
        const angle = Phaser.Math.Angle.Between(this.x, this.y, px, py);
        this.setVelocity(
          Math.cos(angle) * this.speed * 4,
          Math.sin(angle) * this.speed * 4
        );
        // End charge after 400ms
        this.scene.time.delayedCall(400, () => {
          if (this.active) {
            this.charging = false;
            this.aiPhase = 0;
          }
        });
      }
    }
  }

  // ── Damage ──

  takeDamage(amount: number): boolean {
    this.hp -= amount;

    this.setTint(this.isElite ? 0xffff88 : 0xffffff);
    if (this.damageTween) this.damageTween.stop();
    this.damageTween = this.scene.tweens.add({
      targets: this,
      duration: ENEMY_DAMAGE_FLASH_MS,
      onComplete: () => {
        if (this.active) {
          if (this.isElite) this.setTint(0xffdd44);
          else this.clearTint();
        }
      },
    });

    const body = this.body as Phaser.Physics.Arcade.Body;
    const vx = body.velocity.x;
    const vy = body.velocity.y;
    const mag = Math.sqrt(vx * vx + vy * vy) || 1;
    body.setVelocity(
      (-vx / mag) * ENEMY_KNOCKBACK_SPEED,
      (-vy / mag) * ENEMY_KNOCKBACK_SPEED
    );
    this.knockedBack = true;
    this.scene.time.delayedCall(ENEMY_KNOCKBACK_MS, () => {
      if (this.active) this.knockedBack = false;
    });

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
