import Phaser from 'phaser';
import { EnemyConfig, EnemyState, EnemyType, HitEvent, HitCallbackManager } from '../types/GameTypes';
import { EnemyStateMachine } from './EnemyStateMachine';

// 적 타입별 기본 설정 (난이도 조정됨 - 한방 사 방지)
const ENEMY_STATS: Record<EnemyType, { size: number; speed: number; hp: number; damage: number }> = {
  slime: { size: 32, speed: 60, hp: 60, damage: 10 }, // HP: 35→60 (약 2배)
  skeleton: { size: 40, speed: 80, hp: 100, damage: 15 }, // HP: 60→100 (약 1.7배)
  bat: { size: 36, speed: 120, hp: 50, damage: 8 } // HP: 30→50 (약 1.7배)
};

export class Enemy extends Phaser.GameObjects.Container {
  private physicsBody: Phaser.Physics.Arcade.Body;
  private sprite: Phaser.GameObjects.Sprite;
  private config: EnemyConfig;
  private playerRef: Phaser.GameObjects.Container;
  private healthBar: Phaser.GameObjects.Graphics;
  private stateMachine: EnemyStateMachine;
  private originalTint: number = 0xffffff;
  private static nextEnemyId: number = 0;
  private enemyId: string;
  private hitCallbackManager: HitCallbackManager;
  private maxHp: number;  // 최대 HP 저장
  private currentHp: number;  // 현재 HP 저장

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig, playerRef: Phaser.GameObjects.Container) {
    super(scene, x, y);
    this.config = config;
    this.playerRef = playerRef;

    // Generate unique enemy ID
    this.enemyId = `enemy_${Enemy.nextEnemyId++}`;

    // Get hit callback manager instance
    this.hitCallbackManager = HitCallbackManager.getInstance();

    // Determine enemy type and get corresponding stats
    const enemyType: EnemyType = config.type || 'slime';
    const stats = ENEMY_STATS[enemyType];

    // HP 초기화 (config에 지정된 HP 또는 기본 스탯 사용)
    this.maxHp = config.hp || stats.hp;
    this.currentHp = this.maxHp;

    // Create enemy sprite with appropriate key
    this.sprite = scene.add.sprite(0, 0, enemyType);
    this.sprite.setOrigin(0.5);
    this.sprite.setDisplaySize(stats.size, stats.size);
    this.originalTint = this.sprite.tintTopLeft;
    this.add(this.sprite);

    // Create animation for sprite (if multiple frames exist)
    if (scene.textures.exists(enemyType)) {
      const frameCount = scene.textures.get(enemyType).frameTotal;
      if (frameCount > 1) {
        scene.anims.create({
          key: `${enemyType}_anim`,
          frames: scene.anims.generateFrameNumbers(enemyType, { start: 0, end: frameCount - 1 }),
          frameRate: 8,
          repeat: -1
        });
        this.sprite.play(`${enemyType}_anim`);
      }
    }

    // Create health bar (position based on enemy size)
    this.healthBar = scene.add.graphics();
    const healthBarOffset = -stats.size / 2 - 10;
    this.healthBar.setPosition(-stats.size / 2, healthBarOffset);
    this.add(this.healthBar);
    this.updateHealthBar();

    // Enable physics with size based on enemy type
    scene.physics.add.existing(this);
    this.physicsBody = this.body as Phaser.Physics.Arcade.Body;
    this.physicsBody.setSize(stats.size - 4, stats.size - 4);
    this.physicsBody.setCollideWorldBounds(true);

    this.setSize(stats.size, stats.size);
    scene.add.existing(this);

    // Initialize state machine with default config if not provided
    const defaultReactionConfig = config.reactionConfig || {
      knockback: {
        enabled: true,
        force: 200,
        duration: 300,
        decay: 0.8
      },
      stun: {
        enabled: true,
        duration: 200
      },
      invincibility: {
        enabled: true,
        duration: 500
      },
      chainSequence: true
    };

    this.stateMachine = new EnemyStateMachine(scene, defaultReactionConfig);

    // Register state change callbacks for visual feedback
    this.setupStateCallbacks();
  }

  update(): void {
    // Update state machine
    this.stateMachine.update();

    // Handle movement based on state
    if (this.stateMachine.canMove()) {
      this.updateMovement();
    } else {
      // Stop movement if stunned or in knockback
      this.physicsBody.setVelocity(0, 0);
    }

    // Apply knockback velocity if in knockback state
    if (this.stateMachine.isKnockback()) {
      const knockbackVelocity = this.stateMachine.getKnockbackVelocity(this.x, this.y);
      if (knockbackVelocity) {
        this.physicsBody.setVelocity(knockbackVelocity.x, knockbackVelocity.y);
      }
    }

    // 스프라이트 회전 제거 - 탑다운 게임에서 정면을 바라보는 것이 더 자연스러움
  }

  /**
   * Update movement towards player
   */
  private updateMovement(): void {
    const dx = this.playerRef.x - this.x;
    const dy = this.playerRef.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;

      this.physicsBody.setVelocity(
        normalizedX * this.config.speed,
        normalizedY * this.config.speed
      );
    } else {
      this.physicsBody.setVelocity(0);
    }
  }

  /**
   * Setup visual feedback callbacks for state changes
   */
  private setupStateCallbacks(): void {
    // KNOCKBACK state: visual knockback effect
    this.stateMachine.onStateEnter(EnemyState.KNOCKBACK, () => {
      this.onKnockbackStart();
    });

    // STUN state: stun visual effect
    this.stateMachine.onStateEnter(EnemyState.STUN, () => {
      this.onStunStart();
    });

    this.stateMachine.onStateExit(EnemyState.STUN, () => {
      this.onStunEnd();
    });

    // INVINCIBLE state: invincibility visual effect
    this.stateMachine.onStateEnter(EnemyState.INVINCIBLE, () => {
      this.onInvincibilityStart();
    });

    this.stateMachine.onStateExit(EnemyState.INVINCIBLE, () => {
      this.onInvincibilityEnd();
    });

    // DYING state: death preparation
    this.stateMachine.onStateEnter(EnemyState.DYING, () => {
      this.onDyingStart();
    });
  }

  /**
   * Knockback start: flash effect
   */
  private onKnockbackStart(): void {
    // Flash with cyan tint and additive blend mode
    this.sprite.setTint(0x00ffff);
    this.sprite.setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.6,
      duration: 100,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        if (!this.stateMachine.isInvincible()) {
          this.sprite.setBlendMode(Phaser.BlendModes.NORMAL);
          this.sprite.setAlpha(1);
        }
      }
    });

    // Size pulse for impact
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 1.3,
      duration: 100,
      yoyo: true,
      ease: Phaser.Math.Easing.Quadratic.Out
    });
  }

  /**
   * Stun start: visual stun indicator
   */
  private onStunStart(): void {
    // Yellow tint for stunned state
    this.sprite.setTint(0xffff00);

    // Shake effect
    this.scene.tweens.add({
      targets: this,
      x: this.x + (Math.random() - 0.5) * 3,
      y: this.y + (Math.random() - 0.5) * 3,
      duration: 50,
      yoyo: true,
      repeat: 3
    });

    // Don't scale down - keep enemies visible
    // Just add a slight pulse effect instead
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 1.1,
      duration: 100,
      yoyo: true,
      repeat: 1,
      ease: Phaser.Math.Easing.Sine.InOut
    });
  }

  /**
   * Stun end: restore normal state
   */
  private onStunEnd(): void {
    // Scale is already restored by yoyo tween, just restore tint
    this.sprite.setTint(0xffffff);
  }

  /**
   * Invincibility start: transparency effect
   */
  private onInvincibilityStart(): void {
    // Flashing effect during i-frames - keep enemies more visible
    this.sprite.setAlpha(0.7);
    this.sprite.setTint(0xffffff);

    // Create flashing tween
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1.0,
      duration: 100,
      yoyo: true,
      repeat: -1, // Continuous flashing
      onComplete: () => {
        // This won't be called because of infinite repeat,
        // but the tween will be stopped manually
      }
    });
  }

  /**
   * Invincibility end: restore normal state
   */
  private onInvincibilityEnd(): void {
    // Stop any existing tweens on sprite
    this.scene.tweens.killTweensOf(this.sprite);

    // Restore normal appearance
    this.sprite.setAlpha(1);
    this.sprite.setTint(this.originalTint);
    this.sprite.setBlendMode(Phaser.BlendModes.NORMAL);
    this.sprite.setScale(1);
  }

  /**
   * Dying start: prepare for death
   */
  private onDyingStart(): void {
    // Stop all movement
    this.physicsBody.setVelocity(0, 0);

    // Stop all tweens
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.killTweensOf(this);
  }

  takeDamage(
    amount: number,
    damageSourceX?: number,
    damageSourceY?: number,
    damageType: 'projectile' | 'melee' | 'other' = 'other'
  ): boolean {
    // Check if enemy can take damage
    if (!this.stateMachine.canTakeDamage()) {
      return false;
    }

    // Apply damage to current HP
    this.currentHp -= amount;

    // Apply state machine reactions
    // Use player position as damage source if not provided
    const sourceX = damageSourceX ?? this.playerRef.x;
    const sourceY = damageSourceY ?? this.playerRef.y;

    this.stateMachine.applyDamage(amount, sourceX, sourceY);

    // Emit hit event for combat feedback
    const hitEvent: HitEvent = {
      damage: amount,
      targetX: this.x,
      targetY: this.y,
      sourceX: sourceX,
      sourceY: sourceY,
      damageType: damageType,
      targetId: this.enemyId,
      timestamp: this.scene.time.now,
      isCritical: false // TODO: Implement critical hit logic later
    };

    this.hitCallbackManager.emitHitEvent(hitEvent);

    // Update health bar
    this.updateHealthBar();

    // Check if dead
    if (this.currentHp <= 0) {
      this.stateMachine.enterDying();
      this.die();
      return true;
    }

    return false;
  }

  private updateHealthBar(): void {
    this.healthBar.clear();

    const barWidth = 24;
    const barHeight = 4;
    const healthPercent = Math.max(0, this.currentHp / this.maxHp);

    // Background (red)
    this.healthBar.fillStyle(0xff0000, 0.8);
    this.healthBar.fillRect(0, 0, barWidth, barHeight);

    // Health (green)
    this.healthBar.fillStyle(0x00ff00, 0.8);
    this.healthBar.fillRect(0, 0, barWidth * healthPercent, barHeight);
  }

  private die(): void {
    // Note: Death effects are now handled by ParticleManager in GameScene
    // This method only handles enemy cleanup

    // Destroy after a short delay
    this.scene.time.delayedCall(50, () => {
      this.destroy();
    });
  }

  /**
   * Get current enemy state
   */
  getState(): EnemyState {
    return this.stateMachine.getCurrentState();
  }

  /**
   * Check if enemy is in a specific state
   */
  isState(state: EnemyState): boolean {
    return this.stateMachine.isState(state);
  }

  /**
   * Check if enemy is stunned
   */
  isStunned(): boolean {
    return this.stateMachine.isStunned();
  }

  /**
   * Check if enemy is invincible
   */
  isInvincible(): boolean {
    return this.stateMachine.isInvincible();
  }

  /**
   * Check if enemy can move
   */
  canMove(): boolean {
    return this.stateMachine.canMove();
  }

  /**
   * Get state machine (for testing/debugging)
   */
  getStateMachine(): EnemyStateMachine {
    return this.stateMachine;
  }

  getDamage(): number {
    return this.config.damage;
  }

  /**
   * Clean up when enemy is destroyed
   */
  destroy(): void {
    // Clean up state machine
    this.stateMachine.destroy();

    // Stop all tweens
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.killTweensOf(this);

    // Call parent destroy
    super.destroy();
  }
}
