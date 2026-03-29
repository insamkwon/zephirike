import Phaser from 'phaser';
import { EnemyDef } from '../config/enemyConfig';
import {
  ENEMY_KNOCKBACK_SPEED, ENEMY_DAMAGE_FLASH_MS, ENEMY_KNOCKBACK_MS,
  BOSS_CHARGE_SPEED_MUL, BOSS_CHARGE_DURATION, BOSS_AOE_RADIUS, BOSS_AOE_DAMAGE,
  BOSS_SUMMON_COUNT, BOSS_PHASE_INTERVAL,
} from '../config/constants';

let nextEnemyId = 1;

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
  lastHitBy = new Map<string, number>();

  private damageTween: Phaser.Tweens.Tween | null = null;
  private knockedBack = false;
  private dying = false;

  // AI state
  private aiTimer = 0;
  private aiPhase = 0;
  private charging = false;
  private teleportTimer = 0;
  private zigzagOffset = 0;
  private chargeTrailTimer = 0;

  // Boss state
  private bossPhase = 0;
  private bossPhaseTimer = 0;
  private bossCharging = false;

  constructor(
    scene: Phaser.Scene, x: number, y: number,
    def: EnemyDef, hpMul = 1, speedMul = 1, elite = false,
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
    const spriteSize = Math.max(def.size * 4, 32);
    const hitRadius = def.size * 1.0;
    body.setCircle(hitRadius, spriteSize / 2 - hitRadius, spriteSize / 2 - hitRadius);

    this.aiTimer = Phaser.Math.Between(0, 2000);
    this.zigzagOffset = Phaser.Math.Between(0, 1000);

    if (elite) {
      this.setScale(1.5);
      this.setTint(0xffdd44);
      scene.tweens.add({
        targets: this, alpha: { from: 1, to: 0.7 },
        yoyo: true, repeat: -1, duration: 400,
      });
      try { this.preFX?.addGlow(0xffdd44, 3, 0, false, 0.1, 8); } catch {}
    }

    if (def.isBoss) {
      try { this.preFX?.addGlow(0xff0000, 4, 0, false, 0.15, 12); } catch {}
    }
  }

  /** Safe check: is this enemy alive and its scene still running? */
  private get alive(): boolean {
    return this.active && !this.dying && !!this.scene;
  }

  canBeHitBy(sourceId: string, now: number): boolean {
    const last = this.lastHitBy.get(sourceId);
    if (last !== undefined && now - last < ORB_HIT_COOLDOWN_MS) return false;
    this.lastHitBy.set(sourceId, now);
    return true;
  }

  moveToward(playerX: number, playerY: number, delta: number): void {
    if (this.knockedBack || !this.body || this.dying) return;

    this.aiTimer += delta;

    switch (this.enemyDef.ai) {
      case 'chase': this.aiChase(playerX, playerY); break;
      case 'zigzag': this.aiZigzag(playerX, playerY); break;
      case 'ranged': this.aiRanged(playerX, playerY); break;
      case 'teleport': this.aiTeleport(playerX, playerY, delta); break;
      case 'pack': this.aiPack(playerX, playerY); break;
      case 'charge': this.aiCharge(playerX, playerY, delta); break;
      case 'boss': this.aiBoss(playerX, playerY, delta); break;
    }

    this.setFlipX(playerX < this.x);
  }

  // ── AI Behaviors ──

  private aiChase(px: number, py: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, px, py);
    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
  }

  private aiZigzag(px: number, py: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, px, py);
    const wobble = Math.sin((this.aiTimer + this.zigzagOffset) * 0.005) * 1.2;
    const finalAngle = angle + wobble;
    this.setVelocity(Math.cos(finalAngle) * this.speed, Math.sin(finalAngle) * this.speed);
  }

  private aiRanged(px: number, py: number): void {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, px, py);
    const angle = Phaser.Math.Angle.Between(this.x, this.y, px, py);

    if (dist > 220) {
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    } else if (dist < 150) {
      this.setVelocity(-Math.cos(angle) * this.speed * 0.5, -Math.sin(angle) * this.speed * 0.5);
    } else {
      const strafeAngle = angle + Math.PI / 2;
      const strafeDir = Math.sin(this.aiTimer * 0.002) > 0 ? 1 : -1;
      this.setVelocity(
        Math.cos(strafeAngle) * this.speed * 0.3 * strafeDir,
        Math.sin(strafeAngle) * this.speed * 0.3 * strafeDir,
      );

      if (this.aiTimer - this.aiPhase > 2000) {
        this.aiPhase = this.aiTimer;
        this.setTint(0xffffff);
        this.scene.time.delayedCall(80, () => {
          if (this.alive) {
            if (this.isElite) this.setTint(0xffdd44);
            else this.clearTint();
          }
        });
        this.scene.events.emit('enemy-ranged-attack', this, px, py);
      }
    }
  }

  private aiTeleport(px: number, py: number, delta: number): void {
    this.teleportTimer += delta;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, px, py);
    this.setVelocity(Math.cos(angle) * this.speed * 0.6, Math.sin(angle) * this.speed * 0.6);

    if (this.active) {
      this.setAlpha(0.4 + 0.6 * Math.abs(Math.sin(this.aiTimer * 0.003)));
    }

    if (this.teleportTimer > Phaser.Math.Between(3000, 5000)) {
      this.teleportTimer = 0;
      this.scene.events.emit('enemy-teleport', this.x, this.y);
      const dist = Phaser.Math.Between(100, 200);
      const tAngle = Math.random() * Math.PI * 2;
      this.setPosition(px + Math.cos(tAngle) * dist, py + Math.sin(tAngle) * dist);
      this.setAlpha(0);
      this.scene.events.emit('enemy-teleport', this.x, this.y);
      this.scene.tweens.add({
        targets: this, alpha: 0.8, duration: 250, ease: 'Cubic.easeOut',
      });
    }
  }

  private aiPack(px: number, py: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, px, py);
    const wobble = Math.sin(this.aiTimer * 0.002 + this.uid * 0.7) * 0.3;
    this.setVelocity(
      Math.cos(angle + wobble) * this.speed,
      Math.sin(angle + wobble) * this.speed,
    );
  }

  private aiCharge(px: number, py: number, delta: number): void {
    if (this.charging) {
      this.chargeTrailTimer += delta;
      if (this.chargeTrailTimer > 60) {
        this.chargeTrailTimer = 0;
        if (this.scene) this.scene.events.emit('enemy-charge-trail', this.x, this.y);
      }
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, px, py);

    if (dist > 300) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, px, py);
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
      this.aiPhase = 0;
    } else {
      this.aiPhase++;
      if (this.aiPhase < 40) {
        this.setVelocity(0, 0);
        if (this.aiPhase % 10 < 5) this.setTint(0xff0000);
        else this.clearTint();
        if (this.aiPhase === 1) {
          this.scene.tweens.add({
            targets: this,
            scale: { from: this.isElite ? 1.5 : 1, to: this.isElite ? 1.7 : 1.15 },
            duration: 600, ease: 'Sine.easeInOut',
          });
        }
      } else if (this.aiPhase === 40) {
        this.charging = true;
        this.chargeTrailTimer = 0;
        this.clearTint();
        this.setScale(this.isElite ? 1.5 : 1);
        const angle = Phaser.Math.Angle.Between(this.x, this.y, px, py);
        this.setVelocity(Math.cos(angle) * this.speed * 4, Math.sin(angle) * this.speed * 4);
        this.scene.time.delayedCall(400, () => {
          if (this.alive) { this.charging = false; this.aiPhase = 0; }
        });
      }
    }
  }

  private aiBoss(px: number, py: number, delta: number): void {
    this.bossPhaseTimer += delta;
    if (this.bossCharging) return;

    if (this.bossPhaseTimer > BOSS_PHASE_INTERVAL) {
      this.bossPhaseTimer = 0;
      this.bossPhase = (this.bossPhase + 1) % 3;
    }

    switch (this.bossPhase) {
      case 0:
        this.aiChase(px, py);
        break;

      case 1:
        this.bossCharging = true;
        this.setTint(0xff0000);
        this.setVelocity(0, 0);
        this.scene.tweens.add({
          targets: this, scale: { from: 1, to: 1.3 },
          duration: 400, ease: 'Cubic.easeIn',
        });
        this.scene.time.delayedCall(500, () => {
          if (!this.alive) return;
          this.setScale(1);
          const angle = Phaser.Math.Angle.Between(this.x, this.y, px, py);
          this.setVelocity(
            Math.cos(angle) * this.speed * BOSS_CHARGE_SPEED_MUL,
            Math.sin(angle) * this.speed * BOSS_CHARGE_SPEED_MUL,
          );
          this.scene.time.delayedCall(BOSS_CHARGE_DURATION, () => {
            if (this.alive) { this.bossCharging = false; this.clearTint(); }
          });
        });
        break;

      case 2:
        this.setVelocity(0, 0);
        this.scene.events.emit('boss-aoe-vfx', this.x, this.y, BOSS_AOE_RADIUS);
        this.scene.events.emit('boss-aoe', this.x, this.y, BOSS_AOE_RADIUS, BOSS_AOE_DAMAGE);
        this.scene.events.emit('boss-summon', this.x, this.y, BOSS_SUMMON_COUNT);
        break;
    }
  }

  // ── Damage ──

  takeDamage(amount: number): boolean {
    if (this.dying) return false;
    this.hp -= amount;

    this.setTint(this.isElite ? 0xffff88 : 0xffffff);
    if (this.damageTween) this.damageTween.stop();
    this.damageTween = this.scene.tweens.add({
      targets: this, duration: ENEMY_DAMAGE_FLASH_MS,
      onComplete: () => {
        if (this.alive) {
          if (this.isElite) this.setTint(0xffdd44);
          else this.clearTint();
        }
      },
    });

    // Knockback
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      const vx = body.velocity.x;
      const vy = body.velocity.y;
      const mag = Math.sqrt(vx * vx + vy * vy) || 1;
      body.setVelocity(
        (-vx / mag) * ENEMY_KNOCKBACK_SPEED,
        (-vy / mag) * ENEMY_KNOCKBACK_SPEED,
      );
      this.knockedBack = true;
      this.scene.time.delayedCall(ENEMY_KNOCKBACK_MS, () => {
        if (this.alive) this.knockedBack = false;
      });
    }

    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  private die(): void {
    if (this.dying) return;
    this.dying = true;

    this.scene.events.emit('enemy-killed', this);
    this.setVelocity(0, 0);
    if (this.body) this.body.enable = false;

    // Single tween — no chained callbacks that can crash
    const duration = this.enemyDef.isBoss ? 400 : (this.isElite ? 280 : 200);
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      rotation: this.rotation + (this.enemyDef.isBoss ? 4 : 2),
      duration,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        if (this.scene) this.destroy();
      },
    });
  }
}
