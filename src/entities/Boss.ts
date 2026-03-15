import Phaser from 'phaser';
import { BossConfig, BossState } from '../types/GameTypes';

export class Boss extends Phaser.GameObjects.Container {
  private physicsBody: Phaser.Physics.Arcade.Body;
  private sprite: Phaser.GameObjects.Sprite;
  private config: BossConfig;
  private playerRef: Phaser.GameObjects.Container;
  private healthBar: Phaser.GameObjects.Graphics;
  private healthBarBackground: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private bossState: BossState = BossState.SPAWNING;
  private chargeVelocity: { x: number; y: number } = { x: 0, y: 0 };
  private attackTimer: number = 0;
  private attackPattern: 'chase' | 'spray' | 'charge';
  private glowEffect: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, config: BossConfig, playerRef: Phaser.GameObjects.Container) {
    super(scene, x, y);
    this.config = config;
    this.playerRef = playerRef;
    this.attackPattern = config.attackPattern;

    // Create boss sprite with proper key
    this.sprite = scene.add.sprite(0, 0, 'boss');
    this.sprite.setOrigin(0.5);
    this.sprite.setDisplaySize(config.size, config.size);

    // Add boss animation if available
    if (scene.textures.exists('boss')) {
      const frameCount = scene.textures.get('boss').frameTotal;
      if (frameCount > 1) {
        scene.anims.create({
          key: 'boss_anim',
          frames: scene.anims.generateFrameNumbers('boss', { start: 0, end: frameCount - 1 }),
          frameRate: 8,
          repeat: -1
        });
        this.sprite.play('boss_anim');
      }
    }

    this.add(this.sprite);

    // Create glowing aura effect around boss
    this.glowEffect = scene.add.graphics();
    this.add(this.glowEffect);
    this.updateGlowEffect();

    // Create boss health bar (larger and more prominent)
    this.healthBarBackground = scene.add.graphics();
    this.healthBarBackground.setPosition(-config.size / 2, -config.size - 30);
    this.add(this.healthBarBackground);

    this.healthBar = scene.add.graphics();
    this.healthBar.setPosition(-config.size / 2, -config.size - 30);
    this.add(this.healthBar);
    this.updateHealthBar();

    // Create boss name text
    this.nameText = scene.add.text(0, -config.size - 45, config.name, {
      fontSize: '16px',
      color: '#ff0000',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      align: 'center'
    });
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);

    // Enable physics
    scene.physics.add.existing(this);
    this.physicsBody = this.body as Phaser.Physics.Arcade.Body;
    this.physicsBody.setSize(config.size - 5, config.size - 5);
    this.physicsBody.setCollideWorldBounds(true);
    this.physicsBody.setDrag(200, 200);

    this.setSize(config.size, config.size);
    scene.add.existing(this);

    // Spawn animation
    this.playSpawnAnimation();
  }

  private updateGlowEffect(): void {
    this.glowEffect.clear();
    const glowSize = this.config.size + 15;
    const centerX = 0;
    const centerY = 0;

    // Outer glow ring
    this.glowEffect.lineStyle(3, 0xff0000, 0.6);
    this.glowEffect.strokeCircle(centerX, centerY, glowSize / 2);

    // Inner glow ring
    this.glowEffect.lineStyle(2, 0xff4444, 0.4);
    this.glowEffect.strokeCircle(centerX, centerY, glowSize / 2 - 5);
  }

  private playSpawnAnimation(): void {
    this.sprite.setScale(0);
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 1,
      duration: 1000,
      ease: 'Elastic.easeOut',
      onComplete: () => {
        this.bossState = BossState.ACTIVE;
        // Start continuous pulse effect after spawn
        this.startPulseEffect();
      }
    });

    // Flash effect during spawn
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3,
      duration: 200,
      yoyo: true,
      repeat: 4
    });

    // Pulse the glow effect during spawn
    this.scene.tweens.add({
      targets: this.glowEffect,
      alpha: 0.3,
      duration: 300,
      yoyo: true,
      repeat: 5
    });
  }

  private startPulseEffect(): void {
    // Continuous pulsing glow effect
    this.scene.tweens.add({
      targets: this.glowEffect,
      alpha: 0.3,
      scale: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1 // Infinite loop
    });
  }

  update(): void {
    if (this.bossState === BossState.SPAWNING) {
      return;
    }

    if (this.bossState === BossState.DEAD) {
      return;
    }

    switch (this.attackPattern) {
      case 'chase':
        this.updateChasePattern();
        break;
      case 'spray':
        this.updateSprayPattern();
        break;
      case 'charge':
        this.updateChargePattern();
        break;
    }

    // Rotate sprite to face player
    const dx = this.playerRef.x - this.x;
    const dy = this.playerRef.y - this.y;
    const angle = Math.atan2(dy, dx);
    this.sprite.setRotation(angle);
  }

  private updateChasePattern(): void {
    // Continuously chase player (similar to regular enemy but faster)
    const dx = this.playerRef.x - this.x;
    const dy = this.playerRef.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy); // Used for calculating desired distance

    if (distance > 10) {
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

  private updateSprayPattern(): void {
    // Move in a circular pattern around player
    const dx = this.playerRef.x - this.x;
    const dy = this.playerRef.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Maintain distance and circle
    const desiredDistance = 200;
    const angle = Math.atan2(dy, dx);
    const circleSpeed = 0.02;

    // Adjust speed based on distance - slow down if at optimal distance, speed up if too far/close
    let speedModifier = 1.0;
    if (Math.abs(distance - desiredDistance) < 50) {
      speedModifier = 0.8; // Slow down when at optimal distance
    } else if (distance > desiredDistance + 100 || distance < desiredDistance - 100) {
      speedModifier = 1.2; // Speed up when too far or too close
    }

    const targetX = this.playerRef.x - Math.cos(angle + circleSpeed) * desiredDistance;
    const targetY = this.playerRef.y - Math.sin(angle + circleSpeed) * desiredDistance;

    const moveX = targetX - this.x;
    const moveY = targetY - this.y;
    const moveDistance = Math.sqrt(moveX * moveX + moveY * moveY);

    if (moveDistance > 5) {
      this.physicsBody.setVelocity(
        (moveX / moveDistance) * this.config.speed * speedModifier,
        (moveY / moveDistance) * this.config.speed * speedModifier
      );
    }
  }

  private updateChargePattern(): void {
    const currentTime = this.scene.time.now;

    if (this.bossState === BossState.CHARGING) {
      // Continue charging in the set direction
      this.physicsBody.setVelocity(this.chargeVelocity.x, this.chargeVelocity.y);

      // Stop charging after 1 second or if hit wall
      if (currentTime - this.attackTimer > 1000) {
        this.bossState = BossState.ACTIVE;
        this.physicsBody.setVelocity(0, 0);
      }
    } else {
      // Move towards player slowly
      const dx = this.playerRef.x - this.x;
      const dy = this.playerRef.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy); // Used for calculating desired distance

      if (distance > 10) {
        const normalizedX = dx / distance;
        const normalizedY = dy / distance;

        this.physicsBody.setVelocity(
          normalizedX * (this.config.speed * 0.5),
          normalizedY * (this.config.speed * 0.5)
        );
      }

      // Charge every 3 seconds
      if (currentTime - this.attackTimer > 3000) {
        this.startCharge();
      }
    }
  }

  private startCharge(): void {
    this.bossState = BossState.CHARGING;
    this.attackTimer = this.scene.time.now;

    // Calculate charge direction towards player
    const dx = this.playerRef.x - this.x;
    const dy = this.playerRef.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy); // Used for calculating desired distance

    if (distance > 0) {
      const chargeSpeed = this.config.speed * 2.5; // 2.5x speed during charge
      this.chargeVelocity = {
        x: (dx / distance) * chargeSpeed,
        y: (dy / distance) * chargeSpeed
      };
    }

    // Visual warning before charge
    this.sprite.setTint(0xffff00); // Yellow tint during charge

    // Reset tint after charge
    this.scene.time.delayedCall(1000, () => {
      this.sprite.setTint(0xff0000); // Back to red
    });
  }

  takeDamage(amount: number, damageSourceX?: number, damageSourceY?: number): boolean {
    if (this.bossState === BossState.SPAWNING) {
      return false; // Invulnerable during spawn
    }

    this.config.hp -= amount;

    // Use damage source position for knockback direction (if provided)
    const sourceX = damageSourceX ?? this.playerRef.x;
    const sourceY = damageSourceY ?? this.playerRef.y;

    // Apply knockback away from damage source
    const dx = this.x - sourceX;
    const dy = this.y - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0 && this.physicsBody) {
      const knockbackForce = 150; // Boss is heavier, so less knockback
      const knockbackDuration = 200;

      // Apply velocity away from damage source
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;

      this.physicsBody.setVelocity(
        normalizedX * knockbackForce,
        normalizedY * knockbackForce
      );

      // Reset velocity after knockback duration
      this.scene.time.delayedCall(knockbackDuration, () => {
        if (this.physicsBody && this.bossState === BossState.ACTIVE) {
          this.physicsBody.setVelocity(0, 0);
        }
      });
    }

    // Flash white when damaged
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 1
    });

    // Update health bar
    this.updateHealthBar();

    // Check if dead
    if (this.config.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  private updateHealthBar(): void {
    this.healthBar.clear();
    this.healthBarBackground.clear();

    const barWidth = this.config.size;
    const barHeight = 8;
    const healthPercent = Math.max(0, this.config.hp / this.config.maxHp);

    // Background (dark red)
    this.healthBarBackground.fillStyle(0x8b0000, 0.8);
    this.healthBarBackground.fillRect(0, 0, barWidth, barHeight);

    // Health (bright red)
    this.healthBar.fillStyle(0xff0000, 0.9);
    this.healthBar.fillRect(0, 0, barWidth * healthPercent, barHeight);

    // Border
    this.healthBar.lineStyle(2, 0xffffff, 1);
    this.healthBar.strokeRect(0, 0, barWidth, barHeight);
  }

  private die(): void {
    this.bossState = BossState.DEAD;

    // Create dramatic death effect with multiple particle explosions
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        const particles = this.scene.add.particles(0, 0, 'enemy', {
          speed: { min: 100, max: 200 },
          scale: { start: 0.8, end: 0 },
          lifespan: 800,
          quantity: 15,
          alpha: { start: 1, end: 0 },
          tint: [0xff0000, 0xffff00, 0xff8800]
        });

        const offsetX = (Math.random() - 0.5) * this.config.size;
        const offsetY = (Math.random() - 0.5) * this.config.size;
        particles.explode(15, this.x + offsetX, this.y + offsetY);

        this.scene.time.delayedCall(800, () => {
          particles.destroy();
        });
      });
    }

    // Screen shake effect
    this.scene.cameras.main.shake(500, 0.02);

    // Destroy after all effects complete
    this.scene.time.delayedCall(1500, () => {
      this.destroy();
    });
  }

  getDamage(): number {
    return this.config.damage;
  }

  getBossState(): BossState {
    return this.bossState;
  }

  getAttackPattern(): string {
    return this.attackPattern;
  }

  isInvulnerable(): boolean {
    return this.bossState === BossState.SPAWNING;
  }
}
