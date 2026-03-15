import Phaser from 'phaser';

/**
 * Configuration for obstacle creation
 */
export interface ObstacleConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'rock' | 'tree' | 'wall' | 'debris';
  isDestructible: boolean;
  hp?: number; // Only for destructible obstacles
}

/**
 * Obstacle class for static collision objects
 * Can be either static (indestructible) or destructible
 */
export class Obstacle extends Phaser.GameObjects.Container {
  private physicsBody: Phaser.Physics.Arcade.Body;
  private graphics!: Phaser.GameObjects.Graphics;
  private config: ObstacleConfig;

  constructor(scene: Phaser.Scene, config: ObstacleConfig) {
    super(scene, config.x, config.y);
    this.config = config;

    // Create visual representation based on type
    this.createVisual();

    // Enable physics
    scene.physics.add.existing(this);
    this.physicsBody = this.body as Phaser.Physics.Arcade.Body;
    this.physicsBody.setImmovable(true); // Obstacles don't move when collided with
    this.physicsBody.setCollideWorldBounds(true);

    // Set collision box size
    this.setSize(config.width, config.height);
    this.physicsBody.setSize(config.width, config.height);

    scene.add.existing(this);
  }

  private createVisual(): void {
    const { width, height, type } = this.config;

    // Use sprite textures based on obstacle type
    let textureKey = '';
    let useSprite = false;

    switch (type) {
      case 'rock':
        // Choose appropriate rock size based on dimensions
        if (width <= 32) {
          textureKey = 'rock_64';
        } else if (width <= 48) {
          textureKey = 'rock_96';
        } else {
          textureKey = 'rock_128';
        }
        useSprite = true;
        break;
      case 'tree':
        textureKey = 'tree';
        useSprite = true;
        break;
      case 'wall':
        // Use horizontal or vertical wall based on dimensions
        textureKey = width > height ? 'wall_h' : 'wall_v';
        useSprite = true;
        break;
      case 'debris':
        textureKey = 'debris';
        useSprite = true;
        break;
    }

    if (useSprite && this.scene.textures.exists(textureKey)) {
      // Use sprite texture
      const sprite = this.scene.add.sprite(0, 0, textureKey);
      sprite.setOrigin(0.5);

      // Scale sprite to match obstacle dimensions
      // Parse size from texture key (e.g., 'rock_64' -> 64)
      let textureSize = 64; // default
      const sizeMatch = textureKey.match(/(\d+)$/);
      if (sizeMatch) {
        textureSize = parseInt(sizeMatch[1], 10);
      } else if (textureKey === 'tree') {
        textureSize = 64;
      } else if (textureKey.startsWith('wall_h')) {
        textureSize = 80; // width
      } else if (textureKey.startsWith('wall_v')) {
        textureSize = 80; // height
      } else if (textureKey === 'debris') {
        textureSize = 40;
      }

      const scaleX = width / textureSize;
      const scaleY = height / textureSize;
      sprite.setScale(scaleX, scaleY);

      this.add(sprite);

      // Store reference for damage effects
      this.graphics = sprite as any;
    } else {
      // Fallback to graphics if texture doesn't exist
      this.graphics = this.scene.add.graphics();

      let color = 0x888888;
      let alpha = 1.0;

      switch (type) {
        case 'rock':
          color = 0x666666;
          alpha = 0.9;
          break;
        case 'tree':
          color = 0x228B22;
          alpha = 0.8;
          break;
        case 'wall':
          color = 0x444444;
          alpha = 1.0;
          break;
        case 'debris':
          color = 0x8B4513;
          alpha = 0.7;
          break;
      }

      this.graphics.fillStyle(color, alpha);
      this.graphics.fillRect(-width / 2, -height / 2, width, height);
      this.graphics.lineStyle(2, 0x000000, 0.5);
      this.graphics.strokeRect(-width / 2, -height / 2, width, height);

      this.add(this.graphics);
    }
  }

  /**
   * Take damage (only for destructible obstacles)
   * Returns true if obstacle is destroyed
   */
  takeDamage(amount: number): boolean {
    if (!this.config.isDestructible) {
      return false;
    }

    const currentHp = this.config.hp ?? 50;
    const newHp = currentHp - amount;

    if (newHp <= 0) {
      this.destroy();
      return true;
    }

    // Flash red when damaged
    this.scene.tweens.add({
      targets: this.graphics,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 1
    });

    // Update HP
    this.config.hp = newHp;
    return false;
  }

  /**
   * Check if obstacle is destructible
   */
  isDestructible(): boolean {
    return this.config.isDestructible;
  }

  /**
   * Get obstacle type
   */
  getType(): string {
    return this.config.type;
  }

  /**
   * Get obstacle dimensions
   */
  getDimensions(): { width: number; height: number } {
    return {
      width: this.config.width,
      height: this.config.height
    };
  }
}
