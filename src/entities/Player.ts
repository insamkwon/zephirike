import Phaser from 'phaser';
import { PlayerConfig, AttackDirection, AttackType, ProjectileConfig, RotationMode, WeaponUpgrade } from '../types/GameTypes';
import { AttackMode } from '../types';

/**
 * Interface for analog movement input (gamepad or virtual joystick)
 */
export interface AnalogInput {
  x: number; // -1 to 1
  y: number; // -1 to 1
  isActive: boolean;
}

export class Player extends Phaser.GameObjects.Container {
  private physicsBody: Phaser.Physics.Arcade.Body;
  private sprite: Phaser.GameObjects.Sprite;
  private attackIndicator: Phaser.GameObjects.Graphics;
  private config: PlayerConfig;
  private attackDirection: AttackDirection;
  private currentWeapon: AttackType;
  private lastAttackTime: number = 0;
  private projectiles: Phaser.GameObjects.Group;
  private attackMode: AttackMode = AttackMode.MOUSE; // Default to mouse aiming
  private currentAnalogInput: AnalogInput = { x: 0, y: 0, isActive: false };
  private rotationMode: RotationMode; // ATTACK or MOVEMENT based rotation
  private lastMovementAngle: number = 0; // Track last movement direction for attack aiming

  // Experience and Leveling System
  private level: number;
  private experience: number;
  private experienceToNextLevel: number;

  // Weapon bonuses from upgrades
  private weaponBonuses: {
    projectile: { damage: number; attackSpeed: number; projectileSpeed: number };
    melee: { damage: number; attackSpeed: number; range: number };
  };

  constructor(scene: Phaser.Scene, x: number, y: number, config: PlayerConfig) {
    super(scene, x, y);
    this.config = config;
    this.attackDirection = { angle: 0, isAttacking: false };
    this.currentWeapon = 'projectile';
    this.projectiles = scene.add.group();
    this.rotationMode = config.rotationMode || 'MOVEMENT'; // Default to MOVEMENT mode (face movement direction)

    // Initialize level and experience
    this.level = config.level || 1;
    this.experience = config.experience || 0;
    this.experienceToNextLevel = config.experienceToNextLevel || 100;

    // Initialize weapon bonuses
    this.weaponBonuses = {
      projectile: { damage: 0, attackSpeed: 0, projectileSpeed: 0 },
      melee: { damage: 0, attackSpeed: 0, range: 0 }
    };

    // Create player sprite
    this.sprite = scene.add.sprite(0, 0, 'player_hero');
    this.sprite.setOrigin(0.5);
    this.sprite.setDisplaySize(48, 48);

    // Add player animation if available
    if (scene.textures.exists('player_hero')) {
      const frameCount = scene.textures.get('player_hero').frameTotal;
      if (frameCount > 1) {
        scene.anims.create({
          key: 'player_idle',
          frames: scene.anims.generateFrameNumbers('player_hero', { start: 0, end: frameCount - 1 }),
          frameRate: 8,
          repeat: -1
        });
        this.sprite.play('player_idle');
      }
    }

    this.add(this.sprite);

    // Create attack direction indicator
    this.attackIndicator = scene.add.graphics();
    this.add(this.attackIndicator);

    // Enable physics
    scene.physics.add.existing(this);
    this.physicsBody = this.body as Phaser.Physics.Arcade.Body;
    this.physicsBody.setSize(36, 36);
    this.physicsBody.setCollideWorldBounds(true);
    this.physicsBody.setDrag(300, 300);

    this.setSize(48, 48);
    scene.add.existing(this);
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, wasd: any, mousePointer: Phaser.Input.Pointer, enemies?: Phaser.GameObjects.Group): void {
    this.updateGamepadInput();
    this.handleMovement(cursors, wasd);
    this.updateAttackDirection(mousePointer);
    this.updateAttackIndicator();
    // 스프라이트 회전 제거 - 탑다운 게임에서 정면을 바라보는 것이 더 자연스러움

    // Auto attack when enemies are in range (works for both MOUSE and AUTO mode)
    // Direction is set by updateAttackDirection based on mode
    if (enemies) {
      this.performAutoAttack(enemies);
    }
  }

  /**
   * Update gamepad input for 360-degree analog movement
   */
  private updateGamepadInput(): void {
    // Check for connected gamepads
    const gamepads = this.scene.input.gamepad?.gamepads;

    if (gamepads && gamepads.length > 0) {
      // Use the first connected gamepad
      const gamepad = gamepads[0];

      if (gamepad) {
        // Get left stick axis values (-1 to 1)
        const axisX = gamepad.axes[0]?.getValue() ?? 0; // Left stick X
        const axisY = gamepad.axes[1]?.getValue() ?? 0; // Left stick Y

        // Apply deadzone to prevent drift
        const deadzone = 0.15;
        this.currentAnalogInput.x = Math.abs(axisX) > deadzone ? axisX : 0;
        this.currentAnalogInput.y = Math.abs(axisY) > deadzone ? axisY : 0;
        this.currentAnalogInput.isActive = this.currentAnalogInput.x !== 0 || this.currentAnalogInput.y !== 0;
      }
    } else {
      // Reset analog input if no gamepad connected
      this.currentAnalogInput = { x: 0, y: 0, isActive: false };
    }
  }

  /**
   * Handle 360-degree movement from keyboard or gamepad
   */
  private handleMovement(cursors: Phaser.Types.Input.Keyboard.CursorKeys, wasd: any): void {
    const speed = this.config.speed;

    // Reset velocity
    this.physicsBody.setVelocity(0);

    // Prefer analog input (gamepad) if active
    if (this.currentAnalogInput.isActive) {
      this.applyAnalogMovement(this.currentAnalogInput, speed);
      return;
    }

    // Keyboard movement (8-directional with proper normalization)
    let velocityX = 0;
    let velocityY = 0;

    if (cursors.left.isDown || wasd.A.isDown) {
      velocityX = -1;
    }
    if (cursors.right.isDown || wasd.D.isDown) {
      velocityX = 1;
    }
    if (cursors.up.isDown || wasd.W.isDown) {
      velocityY = -1;
    }
    if (cursors.down.isDown || wasd.S.isDown) {
      velocityY = 1;
    }

    // Apply movement with proper normalization
    if (velocityX !== 0 || velocityY !== 0) {
      this.applyNormalizedMovement(velocityX, velocityY, speed);
    }
  }

  /**
   * Apply analog movement for true 360-degree control
   */
  private applyAnalogMovement(analog: AnalogInput, speed: number): void {
    // Calculate velocity from analog stick input
    const velocityX = analog.x * speed;
    const velocityY = analog.y * speed;

    // Normalize if magnitude exceeds speed
    const magnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    if (magnitude > speed) {
      const normalizedX = velocityX / magnitude;
      const normalizedY = velocityY / magnitude;
      this.physicsBody.setVelocity(
        normalizedX * speed,
        normalizedY * speed
      );
      // Update last movement direction for analog input
      this.lastMovementAngle = Math.atan2(normalizedY, normalizedX);
    } else {
      this.physicsBody.setVelocity(velocityX, velocityY);
      // Update last movement direction
      this.lastMovementAngle = Math.atan2(velocityY, velocityX);
    }
  }

  /**
   * Apply normalized movement for keyboard input
   */
  private applyNormalizedMovement(velocityX: number, velocityY: number, speed: number): void {
    // Normalize diagonal movement to prevent faster diagonal movement
    const magnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

    if (magnitude > 0) {
      this.physicsBody.setVelocity(
        (velocityX / magnitude) * speed,
        (velocityY / magnitude) * speed
      );

      // Update last movement direction when moving
      this.lastMovementAngle = Math.atan2(velocityY, velocityX);
    }
  }

  private updateAttackDirection(mousePointer: Phaser.Input.Pointer): void {
    if (this.attackMode === AttackMode.MOUSE) {
      // MOUSE mode: Calculate angle from player to mouse position
      const dx = mousePointer.worldX - this.x;
      const dy = mousePointer.worldY - this.y;
      this.attackDirection.angle = Math.atan2(dy, dx);
    } else if (this.attackMode === AttackMode.AUTO) {
      // AUTO mode: Attack in last movement direction
      // Don't aim at enemies - just shoot where the player is facing
      this.attackDirection.angle = this.lastMovementAngle;
    }
  }

  private updateAttackIndicator(): void {
    this.attackIndicator.clear();

    // ===== 개선된 방향 표시 =====
    const indicatorLength = 35;
    const endX = Math.cos(this.attackDirection.angle) * indicatorLength;
    const endY = Math.sin(this.attackDirection.angle) * indicatorLength;

    // 궤적 효과 (점진적으로 줄어드는 원들)
    for (let i = 0; i < 3; i++) {
      const trailRadius = 4 - i;
      const trailAlpha = 0.6 - i * 0.2;
      const trailX = Math.cos(this.attackDirection.angle) * (indicatorLength - i * 8);
      const trailY = Math.sin(this.attackDirection.angle) * (indicatorLength - i * 8);

      this.attackIndicator.fillStyle(0x00aaff, trailAlpha);
      this.attackIndicator.fillCircle(trailX, trailY, trailRadius);
    }

    // 메인 화살선 (그라데이션 효과를 위해 선을 두번 그림)
    // 외부 글로우
    this.attackIndicator.lineStyle(4, 0x0088cc, 0.4);
    this.attackIndicator.beginPath();
    this.attackIndicator.moveTo(0, 0);
    this.attackIndicator.lineTo(endX, endY);
    this.attackIndicator.strokePath();

    // 내부 밝은 선
    this.attackIndicator.lineStyle(2, 0x66ddff, 0.9);
    this.attackIndicator.beginPath();
    this.attackIndicator.moveTo(0, 0);
    this.attackIndicator.lineTo(endX, endY);
    this.attackIndicator.strokePath();

    // 끝점 강조 원 (반짝이는 효과)
    const pulseRadius = 6 + Math.sin(this.scene.time.now * 0.01) * 2;
    this.attackIndicator.fillStyle(0x66ddff, 0.6);
    this.attackIndicator.fillCircle(endX, endY, pulseRadius);
    this.attackIndicator.fillStyle(0x66ddff, 0.3);
    this.attackIndicator.fillCircle(endX, endY, pulseRadius + 3);

    // 화살촉 모양 (삼각형)
    const arrowSize = 10;
    const angle1 = this.attackDirection.angle - 0.4;
    const angle2 = this.attackDirection.angle + 0.4;

    this.attackIndicator.fillStyle(0x66ddff, 1);
    this.attackIndicator.beginPath();
    this.attackIndicator.moveTo(endX, endY);
    this.attackIndicator.lineTo(
      endX - Math.cos(angle1) * arrowSize,
      endY - Math.sin(angle1) * arrowSize
    );
    this.attackIndicator.lineTo(
      endX - Math.cos(angle2) * arrowSize,
      endY - Math.sin(angle2) * arrowSize
    );
    this.attackIndicator.closePath();
    this.attackIndicator.fillPath();

    // Draw range circle if attacking
    if (this.attackDirection.isAttacking) {
      this.attackIndicator.lineStyle(2, 0xff4444, 0.5);
      this.attackIndicator.strokeCircle(0, 0, this.config.attackRange);
    }
  }

  performAttack(attackType: AttackType): void {
    const currentTime = this.scene.time.now;
    const totalAttackSpeed = this.getTotalAttackSpeed(attackType);
    const attackCooldown = 1000 / totalAttackSpeed;

    if (currentTime - this.lastAttackTime < attackCooldown) {
      return;
    }

    this.lastAttackTime = currentTime;
    this.attackDirection.isAttacking = true;

    if (attackType === 'projectile') {
      this.fireProjectile();
    } else {
      this.performMeleeAttack();
    }

    // Reset attack flag after a short duration
    this.scene.time.delayedCall(200, () => {
      this.attackDirection.isAttacking = false;
    });
  }

  private fireProjectile(): void {
    const projectileConfig: ProjectileConfig = {
      x: this.x,
      y: this.y,
      angle: this.attackDirection.angle,
      speed: this.getTotalProjectileSpeed(),
      damage: this.getTotalDamage('projectile'),
      duration: 2000
    };

    // Create projectile sprite
    const projectile = this.scene.add.rectangle(
      projectileConfig.x,
      projectileConfig.y,
      12,
      12,
      0x00ffff
    ) as any;

    // Enable physics
    this.scene.physics.add.existing(projectile);
    const projectileBody = projectile.body as Phaser.Physics.Arcade.Body;
    
    // Set velocity based on angle
    projectileBody.setVelocity(
      Math.cos(projectileConfig.angle) * projectileConfig.speed,
      Math.sin(projectileConfig.angle) * projectileConfig.speed
    );

    // Store config data on projectile
    projectile.setData('damage', projectileConfig.damage);
    projectile.setData('createdAt', this.scene.time.now);

    // Add to projectiles group
    this.projectiles.add(projectile);

    // Auto-destroy after duration
    this.scene.time.delayedCall(projectileConfig.duration, () => {
      if (projectile.active) {
        projectile.destroy();
      }
    });
  }

  private performMeleeAttack(): void {
    // Create melee attack hitbox
    const hitboxX = this.x + Math.cos(this.attackDirection.angle) * 20;
    const hitboxY = this.y + Math.sin(this.attackDirection.angle) * 20;

    const hitbox = this.scene.add.circle(
      hitboxX,
      hitboxY,
      this.getTotalMeleeRange(),
      0xff6600,
      0.3
    );

    // Store hitbox data
    hitbox.setData('damage', this.getTotalDamage('melee'));
    hitbox.setData('isMelee', true);
    hitbox.setData('createdAt', this.scene.time.now);

    // Add to projectiles group for collision detection
    this.projectiles.add(hitbox);

    // Visual feedback - slash effect
    this.scene.tweens.add({
      targets: hitbox,
      scale: 1.5,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        hitbox.destroy();
      }
    });
  }

  /**
   * Perform automatic attack when in AUTO mode
   * Finds any enemy within detection range and attacks in movement direction
   */
  performAutoAttack(enemies: Phaser.GameObjects.Group): void {
    // Use wider detection range (3x attack range for finding targets)
    const detectionRange = this.config.attackRange * 3;
    let hasEnemyInRange = false;

    // Check if any enemy is within detection range
    enemies.getChildren().forEach((enemy) => {
      const enemyObj = enemy as any;
      const distance = Phaser.Math.Distance.Between(
        this.x,
        this.y,
        enemyObj.x,
        enemyObj.y
      );

      if (distance <= detectionRange) {
        hasEnemyInRange = true;
      }
    });

    // Attack if there's any enemy in detection range
    // Attack direction is already set to lastMovementAngle
    if (hasEnemyInRange) {
      this.performAttack(this.currentWeapon);
    }
  }

  getProjectiles(): Phaser.GameObjects.Group {
    return this.projectiles;
  }

  getAttackDirection(): AttackDirection {
    return this.attackDirection;
  }

  getAttackMode(): AttackMode {
    return this.attackMode;
  }

  setAttackMode(mode: AttackMode): void {
    this.attackMode = mode;
  }

  toggleAttackMode(): AttackMode {
    this.attackMode = this.attackMode === AttackMode.MOUSE
      ? AttackMode.AUTO
      : AttackMode.MOUSE;
    return this.attackMode;
  }

  getRotationMode(): RotationMode {
    return this.rotationMode;
  }

  setRotationMode(mode: RotationMode): void {
    this.rotationMode = mode;
  }

  toggleRotationMode(): RotationMode {
    this.rotationMode = this.rotationMode === 'ATTACK' ? 'MOVEMENT' : 'ATTACK';
    return this.rotationMode;
  }

  getCurrentWeapon(): AttackType {
    return this.currentWeapon;
  }

  switchWeapon(weaponType: AttackType): void {
    this.currentWeapon = weaponType;
  }

  takeDamage(amount: number): void {
    this.config.hp -= amount;
    if (this.config.hp < 0) {
      this.config.hp = 0;
    }

    // Flash red when damaged
    this.sprite.setTint(0xff0000);
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.5,
      duration: 80,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.sprite.setAlpha(1);
        this.sprite.setTint(0xffffff);
      }
    });

    // Screen shake effect
    const cam = this.scene.cameras.main;
    cam.shake(100, 0.02);
  }

  getHp(): number {
    return this.config.hp;
  }

  getMaxHp(): number {
    return this.config.maxHp ?? this.config.hp ?? 100;
  }

  isDead(): boolean {
    return this.config.hp <= 0;
  }

  /**
   * Get the current movement angle in radians
   * Returns the angle the player is currently moving in
   */
  getMovementAngle(): number {
    const velocity = this.physicsBody.velocity;

    if (velocity.x === 0 && velocity.y === 0) {
      return this.lastMovementAngle; // Return last movement direction if stationary
    }

    return Math.atan2(velocity.y, velocity.x);
  }

  /**
   * Get current movement speed
   */
  getCurrentSpeed(): number {
    const velocity = this.physicsBody.velocity;
    return Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  }

  /**
   * Check if player is currently moving
   */
  isMoving(): boolean {
    return this.getCurrentSpeed() > 0;
  }

  /**
   * Get current analog input (for testing)
   */
  getCurrentAnalogInput(): AnalogInput {
    return { ...this.currentAnalogInput };
  }

  /**
   * Set analog input directly (for testing/virtual joystick support)
   */
  setAnalogInput(x: number, y: number): void {
    const deadzone = 0.15;
    this.currentAnalogInput.x = Math.abs(x) > deadzone ? Math.max(-1, Math.min(1, x)) : 0;
    this.currentAnalogInput.y = Math.abs(y) > deadzone ? Math.max(-1, Math.min(1, y)) : 0;
    this.currentAnalogInput.isActive = this.currentAnalogInput.x !== 0 || this.currentAnalogInput.y !== 0;
  }

  // ========== EXPERIENCE AND LEVELING SYSTEM ==========

  /**
   * Add experience points and check for level up
   * @param amount Amount of XP to add
   * @returns true if leveled up, false otherwise
   */
  gainExperience(amount: number): boolean {
    this.experience += amount;
    console.log(`Gained ${amount} XP. Total: ${this.experience}/${this.experienceToNextLevel}`);

    let leveledUp = false;

    // Check for multiple level ups (in case of large XP gain)
    while (this.experience >= this.experienceToNextLevel) {
      this.levelUp();
      leveledUp = true;
    }

    return leveledUp;
  }

  /**
   * Level up the player
   * @returns true always (level up occurred)
   */
  private levelUp(): boolean {
    this.level++;
    this.experience -= this.experienceToNextLevel; // Carry over excess XP

    // Increase XP requirement for next level (exponential curve)
    this.experienceToNextLevel = Math.floor(100 * Math.pow(1.5, this.level - 1));

    console.log(`LEVEL UP! Now level ${this.level}. Next level at ${this.experienceToNextLevel} XP`);

    // Emit level up event for GameScene to handle UI
    this.scene.events.emit('player-level-up', {
      level: this.level,
      experience: this.experience,
      experienceToNextLevel: this.experienceToNextLevel
    });

    return true;
  }

  /**
   * Apply a weapon upgrade to the player
   * @param upgrade The weapon upgrade to apply
   */
  applyWeaponUpgrade(upgrade: WeaponUpgrade): void {
    const bonuses = upgrade.statBonus;

    // Apply general bonuses to both weapons (check FIRST to avoid double application)
    if (upgrade.id.startsWith('general_')) {
      if (bonuses.damage) {
        this.weaponBonuses.projectile.damage += bonuses.damage;
        this.weaponBonuses.melee.damage += bonuses.damage;
      }
      if (bonuses.attackSpeed) {
        this.weaponBonuses.projectile.attackSpeed += bonuses.attackSpeed;
        this.weaponBonuses.melee.attackSpeed += bonuses.attackSpeed;
      }
      if (bonuses.projectileSpeed) {
        this.weaponBonuses.projectile.projectileSpeed += bonuses.projectileSpeed;
      }
      if (bonuses.range) {
        this.weaponBonuses.melee.range += bonuses.range;
      }
    } else {
      // Apply bonuses based on weapon type (only if NOT a general upgrade)
      if (upgrade.type === 'projectile') {
        if (bonuses.damage) this.weaponBonuses.projectile.damage += bonuses.damage;
        if (bonuses.attackSpeed) this.weaponBonuses.projectile.attackSpeed += bonuses.attackSpeed;
        if (bonuses.projectileSpeed) this.weaponBonuses.projectile.projectileSpeed += bonuses.projectileSpeed;
      } else if (upgrade.type === 'melee') {
        if (bonuses.damage) this.weaponBonuses.melee.damage += bonuses.damage;
        if (bonuses.attackSpeed) this.weaponBonuses.melee.attackSpeed += bonuses.attackSpeed;
        if (bonuses.range) this.weaponBonuses.melee.range += bonuses.range;
      }
    }

    console.log(`Applied upgrade: ${upgrade.name}`);
    console.log('Projectile bonuses:', this.weaponBonuses.projectile);
    console.log('Melee bonuses:', this.weaponBonuses.melee);
  }

  /**
   * Get total damage including bonuses for a weapon type
   */
  getTotalDamage(weaponType: AttackType): number {
    const baseDamage = this.config.damage;
    const bonus = weaponType === 'projectile'
      ? this.weaponBonuses.projectile.damage
      : this.weaponBonuses.melee.damage;
    return baseDamage + bonus;
  }

  /**
   * Get total attack speed including bonuses for a weapon type
   */
  getTotalAttackSpeed(weaponType: AttackType): number {
    const baseSpeed = this.config.attackSpeed;
    const bonus = weaponType === 'projectile'
      ? this.weaponBonuses.projectile.attackSpeed
      : this.weaponBonuses.melee.attackSpeed;
    return baseSpeed + bonus;
  }

  /**
   * Get total range including bonuses for melee weapon
   */
  getTotalMeleeRange(): number {
    return this.config.attackRange + this.weaponBonuses.melee.range;
  }

  /**
   * Get total projectile speed including bonuses
   */
  getTotalProjectileSpeed(): number {
    return 400 + this.weaponBonuses.projectile.projectileSpeed; // 400 is base speed
  }

  // ========== GETTERS FOR LEVELING SYSTEM ==========

  getLevel(): number {
    return this.level;
  }

  getExperience(): number {
    return this.experience;
  }

  getExperienceToNextLevel(): number {
    return this.experienceToNextLevel;
  }

  getExperienceProgress(): number {
    return this.experience / this.experienceToNextLevel;
  }

  getWeaponBonuses() {
    return { ...this.weaponBonuses };
  }
}
