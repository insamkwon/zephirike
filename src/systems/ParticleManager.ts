import Phaser from 'phaser';

/**
 * Particle effect types for different damage scenarios
 */
export enum ParticleType {
  BLOOD = 'blood',           // Red droplets for biological enemies
  SPARKS = 'sparks',         // Yellow/orange sparks for energy hits
  DEBRIS = 'debris',         // Brown/gray chunks for obstacles
  IMPACT = 'impact',         // White flash on direct hit
  EXPLOSION = 'explosion'    // Larger explosion for death
}

/**
 * Configuration for particle effects
 */
export interface ParticleConfig {
  type: ParticleType;
  x: number;
  y: number;
  count?: number;
  scale?: number;
  speed?: number;
  lifespan?: number;
  color?: number;
}

/**
 * Damage number configuration
 */
export interface DamageNumberConfig {
  x: number;
  y: number;
  damage: number;
  color?: number;
  scale?: number;
  isCrit?: boolean;
}

/**
 * Screen flash configuration
 */
export interface ScreenFlashConfig {
  color?: number; // Flash color (default: white)
  intensity?: number; // Flash intensity 0-1 (default: 0.3)
  duration?: number; // Flash duration in ms (default: 100)
}

/**
 * Hit location information for precise particle placement
 */
export interface HitLocation {
  x: number;
  y: number;
  normalX?: number; // Direction away from hit (for directional particles)
  normalY?: number;
}

/**
 * Manages all particle effects and damage numbers in the game
 * Provides visual feedback for combat interactions
 */
export class ParticleManager {
  private scene: Phaser.Scene;
  private particleEmitters: Map<ParticleType, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();
  private damageNumbers: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.damageNumbers = scene.add.group();
    this.initializeParticleTextures();
    this.initializeParticleEmitters();
  }

  /**
   * Create placeholder textures for particles using Graphics
   * These will be replaced with actual assets later
   */
  private initializeParticleTextures(): void {
    // Blood particle (red circle)
    if (!this.scene.textures.exists('particle-blood')) {
      const bloodGraphics = this.scene.make.graphics();
      bloodGraphics.fillStyle(0xff0000, 1);
      bloodGraphics.fillCircle(4, 4, 4);
      bloodGraphics.generateTexture('particle-blood', 8, 8);
      bloodGraphics.destroy();
    }

    // Spark particle (yellow star)
    if (!this.scene.textures.exists('particle-spark')) {
      const sparkGraphics = this.scene.make.graphics();
      sparkGraphics.fillStyle(0xffff00, 1);
      sparkGraphics.fillTriangle(4, 0, 8, 8, 0, 8);
      sparkGraphics.generateTexture('particle-spark', 8, 8);
      sparkGraphics.destroy();
    }

    // Debris particle (brown square)
    if (!this.scene.textures.exists('particle-debris')) {
      const debrisGraphics = this.scene.make.graphics();
      debrisGraphics.fillStyle(0x8B4513, 1);
      debrisGraphics.fillRect(0, 0, 6, 6);
      debrisGraphics.generateTexture('particle-debris', 6, 6);
      debrisGraphics.destroy();
    }

    // Impact particle (white circle)
    if (!this.scene.textures.exists('particle-impact')) {
      const impactGraphics = this.scene.make.graphics();
      impactGraphics.fillStyle(0xffffff, 1);
      impactGraphics.fillCircle(3, 3, 3);
      impactGraphics.generateTexture('particle-impact', 6, 6);
      impactGraphics.destroy();
    }

    // Explosion particle (orange/red gradient)
    if (!this.scene.textures.exists('particle-explosion')) {
      const explosionGraphics = this.scene.make.graphics();
      explosionGraphics.fillStyle(0xff6600, 1);
      explosionGraphics.fillCircle(6, 6, 6);
      explosionGraphics.generateTexture('particle-explosion', 12, 12);
      explosionGraphics.destroy();
    }
  }

  /**
   * Initialize all particle emitters with their specific configurations
   */
  private initializeParticleEmitters(): void {
    // Blood particle emitter - for biological enemy hits
    const bloodEmitter = this.scene.add.particles(0, 0, 'particle-blood', {
      speed: { min: 60, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0.2 },
      alpha: { start: 1, end: 0 },
      gravityY: 200,
      lifespan: { min: 400, max: 800 },
      quantity: 1,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false
    });
    this.particleEmitters.set(ParticleType.BLOOD, bloodEmitter);

    // Sparks particle emitter - for energy/melee hits
    const sparksEmitter = this.scene.add.particles(0, 0, 'particle-spark', {
      speed: { min: 100, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0.1 },
      alpha: { start: 1, end: 0 },
      gravityY: 100,
      lifespan: { min: 300, max: 600 },
      quantity: 1,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false
    });
    this.particleEmitters.set(ParticleType.SPARKS, sparksEmitter);

    // Debris particle emitter - for obstacles and structures
    const debrisEmitter = this.scene.add.particles(0, 0, 'particle-debris', {
      speed: { min: 40, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0.3 },
      alpha: { start: 1, end: 0 },
      gravityY: 300,
      lifespan: { min: 500, max: 1000 },
      quantity: 1,
      emitting: false
    });
    this.particleEmitters.set(ParticleType.DEBRIS, debrisEmitter);

    // Impact particle emitter - for instant hit feedback
    const impactEmitter = this.scene.add.particles(0, 0, 'particle-impact', {
      speed: { min: 80, max: 180 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      gravityY: 50,
      lifespan: { min: 200, max: 400 },
      quantity: 1,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false
    });
    this.particleEmitters.set(ParticleType.IMPACT, impactEmitter);

    // Explosion particle emitter - for death effects
    const explosionEmitter = this.scene.add.particles(0, 0, 'particle-explosion', {
      speed: { min: 80, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0.1 },
      alpha: { start: 1, end: 0 },
      gravityY: 100,
      lifespan: { min: 600, max: 1200 },
      quantity: 1,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false
    });
    this.particleEmitters.set(ParticleType.EXPLOSION, explosionEmitter);
  }

  /**
   * Emit particles at a specific location
   * @param config Particle configuration
   */
  public emitParticles(config: ParticleConfig): void {
    const emitter = this.particleEmitters.get(config.type);
    if (!emitter) {
      console.warn(`Particle emitter for type ${config.type} not found`);
      return;
    }

    const count = config.count || 10;
    const x = config.x;
    const y = config.y;

    // Emit particles at the specified location
    emitter.emitParticleAt(x, y, count);

    // Add screen shake for bigger impacts
    if (count >= 15) {
      this.addScreenShake(5, 100);
    }
  }

  /**
   * Create a damage number that floats up and fades out
   * @param config Damage number configuration
   */
  public createDamageNumber(config: DamageNumberConfig): void {
    const damage = config.damage;
    const isCrit = config.isCrit || (Math.random() < 0.15); // 15% crit chance

    // Determine color based on damage type
    let color = config.color || 0xffffff;
    if (isCrit) {
      color = 0xffff00; // Yellow for crits
    }

    // Create text object
    const damageText = this.scene.add.text(
      config.x,
      config.y,
      isCrit ? `${Math.floor(damage)}!` : Math.floor(damage).toString(),
      {
        fontSize: isCrit ? 'bold 24px' : 'bold 18px',
        color: `#${color.toString(16).padStart(6, '0')}`,
        fontFamily: 'Arial Black, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }
    );

    damageText.setOrigin(0.5);
    damageText.setDepth(1000); // Ensure damage numbers appear on top

    // Add to group for tracking
    this.damageNumbers.add(damageText);

    // Animate damage number
    const floatDistance = 40 + Math.random() * 20;
    const duration = 800;

    this.scene.tweens.add({
      targets: damageText,
      y: config.y - floatDistance,
      alpha: 0,
      scale: isCrit ? 1.5 : 1,
      duration: duration,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onComplete: () => {
        damageText.destroy();
      }
    });

    // Add slight horizontal variation for more natural look
    const horizontalDrift = (Math.random() - 0.5) * 30;
    this.scene.tweens.add({
      targets: damageText,
      x: config.x + horizontalDrift,
      duration: duration,
      ease: 'Sine.easeOut'
    });
  }

  /**
   * Create a combined hit effect with particles and damage number
   * @param x X coordinate
   * @param y Y coordinate
   * @param damage Damage amount
   * @param particleType Type of particles to emit
   * @param particleCount Number of particles to emit
   * @param isCrit Whether this is a critical hit
   */
  public createHitEffect(
    x: number,
    y: number,
    damage: number,
    particleType: ParticleType = ParticleType.BLOOD,
    particleCount: number = 8,
    isCrit: boolean = false
  ): void {
    // Emit particles
    this.emitParticles({
      type: particleType,
      x: x,
      y: y,
      count: particleCount
    });

    // Create damage number
    this.createDamageNumber({
      x: x,
      y: y - 10,
      damage: damage,
      isCrit: isCrit
    });

    // Add impact flash
    this.emitParticles({
      type: ParticleType.IMPACT,
      x: x,
      y: y,
      count: 3
    });

    // Add screen flash for critical hits or high damage
    // Screen flash for crits (15% chance) or damage > 25
    if (isCrit || damage > 25) {
      const flashColor = isCrit ? 0xffff00 : 0xffffff; // Yellow for crits, white for heavy hits
      const flashIntensity = isCrit ? 0.25 : 0.2; // Slightly more intense for crits
      this.addScreenFlash({
        color: flashColor,
        intensity: flashIntensity,
        duration: 80
      });
    }
  }

  /**
   * Create death explosion effect
   * @param x X coordinate
   * @param y Y coordinate
   * @param particleType Type of particles (blood for enemies, debris for obstacles)
   */
  public createDeathEffect(
    x: number,
    y: number,
    particleType: ParticleType = ParticleType.BLOOD
  ): void {
    // Large explosion
    this.emitParticles({
      type: ParticleType.EXPLOSION,
      x: x,
      y: y,
      count: 20
    });

    // Type-specific particles
    this.emitParticles({
      type: particleType,
      x: x,
      y: y,
      count: 25
    });

    // Add screen shake for death
    this.addScreenShake(8, 150);
  }

  /**
   * Add screen shake effect
   * @param intensity Shake intensity
   * @param duration Shake duration in ms
   */
  private addScreenShake(intensity: number, duration: number): void {
    const camera = this.scene.cameras.main;

    this.scene.tweens.add({
      targets: camera,
      x: camera.x + intensity,
      y: camera.y + intensity,
      duration: duration / 4,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        camera.setPosition(0, 0);
      }
    });
  }

  /**
   * Add screen flash effect for impactful hits
   * Creates a full-screen flash overlay that fades out quickly
   * @param config Screen flash configuration
   */
  public addScreenFlash(config: ScreenFlashConfig = {}): void {
    const flashColor = config.color || 0xffffff;
    const intensity = config.intensity ?? 0.3;
    const duration = config.duration ?? 100;

    // Create flash overlay graphics
    const flashOverlay = this.scene.add.graphics();
    flashOverlay.fillStyle(flashColor, intensity);
    flashOverlay.fillRect(
      -this.scene.cameras.main.width / 2,
      -this.scene.cameras.main.height / 2,
      this.scene.cameras.main.width * 2,
      this.scene.cameras.main.height * 2
    );
    flashOverlay.setDepth(9999); // Ensure it appears on top of everything
    flashOverlay.setScrollFactor(0); // Don't move with camera

    // Fade out and destroy
    this.scene.tweens.add({
      targets: flashOverlay,
      alpha: 0,
      duration: duration,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onComplete: () => {
        flashOverlay.destroy();
      }
    });
  }

  /**
   * Create projectile trail effect
   * @param x X coordinate
   * @param y Y coordinate
   */
  public createProjectileTrail(x: number, y: number): void {
    this.emitParticles({
      type: ParticleType.SPARKS,
      x: x,
      y: y,
      count: 2
    });
  }

  /**
   * Clean up all particle emitters and damage numbers
   */
  public destroy(): void {
    this.particleEmitters.forEach((emitter) => {
      emitter.destroy();
    });
    this.particleEmitters.clear();

    this.damageNumbers.destroy();
  }

  /**
   * Get particle emitter by type (for advanced customization)
   * @param type Particle type
   * @returns Particle emitter or undefined
   */
  public getEmitter(type: ParticleType): Phaser.GameObjects.Particles.ParticleEmitter | undefined {
    return this.particleEmitters.get(type);
  }

  /**
   * Calculate hit location on a target from projectile position
   * Returns the approximate point where projectile hit the target
   * @param targetX Target center X
   * @param targetY Target center Y
   * @param targetWidth Target width
   * @param targetHeight Target height
   * @param projectileX Projectile X position
   * @param projectileY Projectile Y position
   * @returns Hit location with position and normal direction
   */
  public calculateHitLocation(
    targetX: number,
    targetY: number,
    targetWidth: number,
    targetHeight: number,
    projectileX: number,
    projectileY: number
  ): HitLocation {
    // Calculate direction from target to projectile
    const dx = projectileX - targetX;
    const dy = projectileY - targetY;

    // Calculate the half-sizes of the target
    const halfWidth = targetWidth / 2;
    const halfHeight = targetHeight / 2;

    // Determine which edge was hit by comparing the angle
    // const angle = Math.atan2(dy, dx); // Calculated but not directly used
    // const absAngle = Math.abs(angle); // Calculated but not directly used
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Calculate intersection point on target edge
    let hitX = targetX;
    let hitY = targetY;
    let normalX = 0;
    let normalY = 0;

    // Determine hit edge based on direction and aspect ratio
    const aspectRatio = halfWidth / halfHeight;

    if (absDy > absDx * aspectRatio) {
      // Hit top or bottom edge
      hitY = targetY + (dy > 0 ? halfHeight : -halfHeight);
      // Interpolate X position at edge
      const t = halfHeight / absDy;
      hitX = targetX + dx * t;
      normalX = 0;
      normalY = dy > 0 ? -1 : 1;
    } else {
      // Hit left or right edge
      hitX = targetX + (dx > 0 ? halfWidth : -halfWidth);
      // Interpolate Y position at edge
      const t = halfWidth / absDx;
      hitY = targetY + dy * t;
      normalX = dx > 0 ? -1 : 1;
      normalY = 0;
    }

    // Clamp hit position to target bounds
    hitX = Math.max(targetX - halfWidth, Math.min(targetX + halfWidth, hitX));
    hitY = Math.max(targetY - halfHeight, Math.min(targetY + halfHeight, hitY));

    return {
      x: hitX,
      y: hitY,
      normalX,
      normalY
    };
  }

  /**
   * Create hit effect at precise hit location
   * Uses projectile position to calculate exact hit point on target
   * @param targetX Target center X
   * @param targetY Target center Y
   * @param targetWidth Target width
   * @param targetHeight Target height
   * @param projectileX Projectile X position
   * @param projectileY Projectile Y position
   * @param damage Damage amount
   * @param particleType Type of particles to emit
   * @param particleCount Number of particles to emit
   * @param isCrit Whether this is a critical hit (optional, will randomize if not provided)
   */
  public createHitEffectAtLocation(
    targetX: number,
    targetY: number,
    targetWidth: number,
    targetHeight: number,
    projectileX: number,
    projectileY: number,
    damage: number,
    particleType: ParticleType = ParticleType.BLOOD,
    particleCount: number = 8,
    isCrit?: boolean
  ): void {
    // Calculate precise hit location
    const hitLocation = this.calculateHitLocation(
      targetX,
      targetY,
      targetWidth,
      targetHeight,
      projectileX,
      projectileY
    );

    // Emit particles at hit location
    this.emitParticles({
      type: particleType,
      x: hitLocation.x,
      y: hitLocation.y,
      count: particleCount
    });

    // Create damage number slightly above hit location
    this.createDamageNumber({
      x: hitLocation.x,
      y: hitLocation.y - 15,
      damage: damage,
      isCrit: isCrit !== undefined ? isCrit : Math.random() < 0.15
    });

    // Add impact flash at hit location
    this.emitParticles({
      type: ParticleType.IMPACT,
      x: hitLocation.x,
      y: hitLocation.y,
      count: 3
    });

    // If we have a normal direction, emit some directional particles
    if (hitLocation.normalX !== undefined && hitLocation.normalY !== undefined) {
      this.emitDirectionalParticles(
        hitLocation.x,
        hitLocation.y,
        hitLocation.normalX,
        hitLocation.normalY,
        particleType,
        Math.floor(particleCount / 2)
      );
    }
  }

  /**
   * Emit directional particles that follow the hit normal
   * @param x X coordinate
   * @param y Y coordinate
   * @param normalX Normal X direction (-1 to 1)
   * @param normalY Normal Y direction (-1 to 1)
   * @param particleType Type of particles
   * @param count Number of particles
   */
  private emitDirectionalParticles(
    x: number,
    y: number,
    _normalX: number, // Intentionally unused for future implementation
    _normalY: number, // Intentionally unused for future implementation
    particleType: ParticleType,
    count: number
  ): void {
    const emitter = this.particleEmitters.get(particleType);
    if (!emitter) return;

    // Calculate base angle from normal
    // const baseAngle = Math.atan2(normalY, normalX);

    // Emit particles with directional bias
    for (let i = 0; i < count; i++) {
      // Add some spread to the direction
      // const spread = (Math.random() - 0.5) * Math.PI / 2; // ±45 degrees
      // const angle = baseAngle + spread; // Calculated but not directly used

      // Set emitter angle for this particle
      // const speed = emitter.config.speed || { min: 100, max: 200 };
      // const speedValue = typeof speed === 'object'
      //   ? (speed as { min: number; max: number }).min + Math.random() * ((speed as { min: number; max: number }).max - (speed as { min: number; max: number }).min)
      //   : speed;

      // Emit particle with calculated angle
      emitter.emitParticleAt(x, y, 1);

      // Manually set particle velocity (this is a simplified approach)
      // In a more advanced implementation, you'd modify individual particle properties
    }
  }

  /**
   * Create death effect at target location
   * @param x X coordinate
   * @param y Y coordinate
   * @param particleType Type of particles (blood for enemies, debris for obstacles)
   * @param intensity Intensity multiplier (1.0 = normal, 2.0 = double particles)
   */
  public createDeathEffectWithIntensity(
    x: number,
    y: number,
    particleType: ParticleType = ParticleType.BLOOD,
    intensity: number = 1.0
  ): void {
    // Large explosion
    this.emitParticles({
      type: ParticleType.EXPLOSION,
      x: x,
      y: y,
      count: Math.floor(20 * intensity)
    });

    // Type-specific particles
    this.emitParticles({
      type: particleType,
      x: x,
      y: y,
      count: Math.floor(25 * intensity)
    });

    // Add screen shake for death
    this.addScreenShake(8 * intensity, 150);

    // Add screen flash for intense deaths
    if (intensity >= 1.5) {
      this.addScreenFlash({
        color: particleType === ParticleType.BLOOD ? 0xff0000 : 0xff6600,
        intensity: 0.2,
        duration: 150
      });
    }
  }
}
