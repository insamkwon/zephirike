/**
 * AssetLoader System
 * Provides abstraction for asset loading with easy swap capability
 * Supports both external URLs and internal assets
 */

import Phaser from 'phaser';

/**
 * Asset configuration for a single asset
 */
export interface AssetConfig {
  key: string;           // Phaser cache key
  type: 'image' | 'sprite' | 'sound' | 'music' | 'json' | 'atlas' | 'animation';
  url?: string;          // External URL (optional for internal assets)
  data?: string | object; // Base64 or raw data (optional)
  frameConfig?: Phaser.Types.Loader.FileTypes.ImageFrameConfig;
  atlasURL?: string;     // For atlas type
}

/**
 * Asset collection configuration
 */
export interface AssetCollectionConfig {
  name: string;           // Collection name (e.g., 'characters', 'weapons')
  assets: AssetConfig[];
}

/**
 * Asset source type
 */
export enum AssetSource {
  /** External URL (http/https) */
  EXTERNAL = 'external',
  /** Base64 embedded data */
  BASE64 = 'base64',
  /** Internal asset path */
  INTERNAL = 'internal',
  /** Placeholder generated data */
  PLACEHOLDER = 'placeholder'
}

/**
 * Asset loading options
 */
export interface AssetLoaderOptions {
  source?: AssetSource;
  showProgress?: boolean;
  progressCallback?: (progress: number) => void;
}

/**
 * AssetLoader handles loading game assets with multiple source support
 * Makes it easy to swap external assets for internal ones later
 */
export class AssetLoader {
  private scene: Phaser.Scene;
  private source: AssetSource;
  private showProgress: boolean = false;
  private progressCallback?: (progress: number) => void;
  private progressText?: Phaser.GameObjects.Text;
  private progressBg?: Phaser.GameObjects.Graphics;
  private progressBar?: Phaser.GameObjects.Graphics;

  // Asset collections
  private collections: Map<string, AssetConfig[]> = new Map();

  constructor(scene: Phaser.Scene, options: AssetLoaderOptions = {}) {
    this.scene = scene;
    this.source = options.source || AssetSource.PLACEHOLDER;
    this.showProgress = options.showProgress ?? false;
    this.progressCallback = options.progressCallback;
  }

  /**
   * Register an asset collection
   */
  registerCollection(config: AssetCollectionConfig): void {
    this.collections.set(config.name, config.assets);
  }

  /**
   * Load a single asset
   */
  loadAsset(config: AssetConfig): void {
    switch (config.type) {
      case 'image':
        this.loadImage(config);
        break;
      case 'sprite':
        this.loadSprite(config);
        break;
      case 'sound':
        this.loadSound(config);
        break;
      case 'music':
        this.loadMusic(config);
        break;
      case 'json':
        this.loadJSON(config);
        break;
      case 'atlas':
        this.loadAtlas(config);
        break;
      case 'animation':
        this.loadAnimation(config);
        break;
      default:
        console.warn(`Unknown asset type: ${config.type}`);
    }
  }

  /**
   * Load an entire asset collection
   */
  loadCollection(collectionName: string): void {
    const assets = this.collections.get(collectionName);
    if (!assets) {
      console.warn(`Asset collection not found: ${collectionName}`);
      return;
    }

    assets.forEach(asset => this.loadAsset(asset));
  }

  /**
   * Load all registered collections
   */
  loadAllCollections(): void {
    this.collections.forEach((assets, name) => {
      console.log(`Loading collection: ${name} (${assets.length} assets)`);
      this.loadCollection(name);
    });
  }

  /**
   * Start the preload process
   */
  async preload(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Setup progress listener
      if (this.showProgress) {
        this.createProgressUI();
      }

      this.scene.load.on('progress', (progress: number) => {
        const percent = Math.floor(progress * 100);

        if (this.progressCallback) {
          this.progressCallback(percent);
        }

        if (this.showProgress) {
          this.updateProgressUI(percent);
        }
      });

      this.scene.load.on('complete', () => {
        console.log('Asset loading complete!');
        if (this.showProgress) {
          this.destroyProgressUI();
        }
        resolve();
      });

      this.scene.load.on('error', (file: any) => {
        console.error(`Asset loading error: ${file.key}`);
        if (this.showProgress) {
          this.destroyProgressUI();
        }
        reject(file);
      });

      // Start loading
      this.scene.load.start();
    });
  }

  /**
   * Load an image asset
   */
  private loadImage(config: AssetConfig): void {
    if (this.source === AssetSource.PLACEHOLDER || this.source === AssetSource.BASE64) {
      // Use placeholder/base64 data
      const placeholderData = this.generatePlaceholderImage(config.key);
      this.scene.load.image(config.key, placeholderData);
    } else if (this.source === AssetSource.EXTERNAL && config.url) {
      this.scene.load.image(config.key, config.url);
    } else if (this.source === AssetSource.INTERNAL && config.url) {
      this.scene.load.image(config.key, config.url);
    }
  }

  /**
   * Load a sprite sheet
   */
  private loadSprite(config: AssetConfig): void {
    if (this.source === AssetSource.PLACEHOLDER || this.source === AssetSource.BASE64) {
      const placeholderData = this.generatePlaceholderImage(config.key);
      this.scene.load.spritesheet(config.key, placeholderData, config.frameConfig);
    } else if (config.url) {
      this.scene.load.spritesheet(config.key, config.url, config.frameConfig);
    }
  }

  /**
   * Load a sound effect
   */
  private loadSound(config: AssetConfig): void {
    if (config.url) {
      this.scene.load.audio(config.key, config.url);
    }
  }

  /**
   * Load background music
   */
  private loadMusic(config: AssetConfig): void {
    if (config.url) {
      this.scene.load.audio(config.key, config.url);
    }
  }

  /**
   * Load JSON data
   */
  private loadJSON(config: AssetConfig): void {
    if (config.url) {
      this.scene.load.json(config.key, config.url);
    } else if (config.data && typeof config.data === 'object') {
      // For embedded JSON data, use data URI
      const jsonString = JSON.stringify(config.data);
      const base64 = btoa(jsonString);
      this.scene.load.json(config.key, `data:application/json;base64,${base64}`);
    }
  }

  /**
   * Load texture atlas
   */
  private loadAtlas(config: AssetConfig): void {
    if (config.url && config.atlasURL) {
      this.scene.load.atlas(config.key, config.atlasURL, config.url);
    }
  }

  /**
   * Load animation data
   */
  private loadAnimation(config: AssetConfig): void {
    // Animation data is typically loaded as JSON
    this.loadJSON({ ...config, type: 'json' });
  }

  /**
   * Generate a placeholder image data URL
   */
  private generatePlaceholderImage(key: string): string {
    // Generate pixel art style placeholder based on entity type
    let svg = '';

    switch (key) {
      case 'player':
        svg = this.createPlayerSVG();
        break;
      case 'enemy':
        svg = this.createEnemySVG('#ff4444');
        break;
      case 'enemy-fast':
        svg = this.createEnemySVG('#ff8844');
        break;
      case 'enemy-tank':
        svg = this.createEnemySVG('#8844ff');
        break;
      case 'boss':
        svg = this.createBossSVG();
        break;
      case 'projectile':
        svg = this.createProjectileSVG('#ffff00');
        break;
      case 'melee-slash':
        svg = this.createMeleeSlashSVG();
        break;
      case 'hit-spark':
        svg = this.createSparkSVG('#ffff00');
        break;
      case 'blood':
        svg = this.createBloodSVG();
        break;
      case 'explosion':
        svg = this.createExplosionSVG();
        break;
      default:
        // Fallback to colored rectangle with initial
        const hash = this.hashString(key);
        const r = (hash & 0xFF0000) >> 16;
        const g = (hash & 0x00FF00) >> 8;
        const b = hash & 0x0000FF;
        svg = `
          <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" fill="rgb(${r},${g},${b})"/>
            <text x="16" y="20" font-size="12" text-anchor="middle" fill="white">${key.substring(0, 1)}</text>
          </svg>
        `;
    }

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Create player character SVG (blue hero with sword) - 48x48
   */
  private createPlayerSVG(): string {
    return `
      <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <!-- Body - blue circle -->
        <circle cx="24" cy="24" r="20" fill="#4488ff"/>
        <!-- Face -->
        <circle cx="18" cy="20" r="3" fill="white"/>
        <circle cx="30" cy="20" r="3" fill="white"/>
        <circle cx="18" cy="21" r="1.5" fill="black"/>
        <circle cx="30" cy="21" r="1.5" fill="black"/>
        <!-- Smile -->
        <path d="M18 28 Q24 34 30 28" stroke="white" stroke-width="2" fill="none"/>
        <!-- Shield indicator -->
        <rect x="12" y="8" width="24" height="3" fill="#88ccff" opacity="0.7"/>
      </svg>
    `;
  }

  /**
   * Create enemy character SVG (red monster) - 36x36
   */
  private createEnemySVG(color: string): string {
    return `
      <svg width="36" height="36" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <!-- Body - jagged red shape -->
        <polygon points="18,4 28,12 32,18 28,28 18,32 8,28 4,18 8,12" fill="${color}"/>
        <!-- Angry eyes -->
        <circle cx="14" cy="16" r="4" fill="white"/>
        <circle cx="22" cy="16" r="4" fill="white"/>
        <circle cx="14" cy="17" r="1.5" fill="black"/>
        <circle cx="22" cy="17" r="1.5" fill="black"/>
        <!-- Angry mouth -->
        <path d="M12 26 L18 24 L24 26 L32 24" stroke="black" stroke-width="2" fill="none"/>
      </svg>
    `;
  }

  /**
   * Create boss character SVG (large orange boss) - 80x80
   */
  private createBossSVG(): string {
    return `
      <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <!-- Crown/horns -->
        <polygon points="20,12 26,2 32,12" fill="#ffcc00"/>
        <polygon points="12,16 20,6 28,16" fill="#ffcc00"/>
        <polygon points="52,16 60,6 68,16" fill="#ffcc00"/>
        <!-- Body -->
        <circle cx="40" cy="44" r="30" fill="#ff6622"/>
        <!-- Face -->
        <circle cx="30" cy="38" r="6" fill="white"/>
        <circle cx="50" cy="38" r="6" fill="white"/>
        <circle cx="30" cy="39" r="3" fill="red"/>
        <circle cx="50" cy="39" r="3" fill="red"/>
        <!-- Menacing grin -->
        <path d="M24 56 Q40 76 56 56" stroke="black" stroke-width="3" fill="black"/>
      </svg>
    `;
  }

  /**
   * Create projectile SVG (yellow energy ball)
   */
  private createProjectileSVG(color: string): string {
    return `
      <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <circle cx="8" cy="8" r="6" fill="${color}"/>
        <circle cx="8" cy="8" r="4" fill="#ffffff" opacity="0.7"/>
        <circle cx="8" cy="8" r="2" fill="${color}"/>
      </svg>
    `;
  }

  /**
   * Create melee slash SVG
   */
  private createMeleeSlashSVG(): string {
    return `
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <path d="M8 24 L16 8 L24 24" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.9"/>
        <path d="M8 24 L16 8 L24 24" stroke="#ffff00" stroke-width="1" fill="none"/>
      </svg>
    `;
  }

  /**
   * Create spark effect SVG
   */
  private createSparkSVG(color: string): string {
    return `
      <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <line x1="2" y1="8" x2="14" y2="8" stroke="${color}" stroke-width="2"/>
        <line x1="8" y1="2" x2="8" y2="14" stroke="${color}" stroke-width="2"/>
        <line x1="4" y1="4" x2="12" y2="12" stroke="${color}" stroke-width="2"/>
        <line x1="12" y1="4" x2="4" y2="12" stroke="${color}" stroke-width="2"/>
      </svg>
    `;
  }

  /**
   * Create blood effect SVG
   */
  private createBloodSVG(): string {
    return `
      <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <circle cx="8" cy="8" r="6" fill="#cc0000"/>
        <circle cx="4" cy="12" r="3" fill="#990000"/>
        <circle cx="12" cy="6" r="2" fill="#cc0000"/>
        <circle cx="14" cy="10" r="2" fill="#880000"/>
      </svg>
    `;
  }

  /**
   * Create explosion SVG
   */
  private createExplosionSVG(): string {
    return `
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <polygon points="16,2 18,14 30,16 18,18" fill="#ff6600"/>
        <polygon points="16,2 14,14 2,16 14,18" fill="#ffcc00"/>
        <polygon points="30,16 18,18 16,30 14,18" fill="#ff3300"/>
        <polygon points="2,16 14,18 16,30 18,18" fill="#ff9900"/>
        <circle cx="16" cy="16" r="6" fill="#ffffff" opacity="0.8"/>
      </svg>
    `;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Change asset source (requires scene restart)
   */
  setSource(source: AssetSource): void {
    this.source = source;
    console.log(`Asset source changed to: ${source}`);
  }

  /**
   * Get current asset source
   */
  getSource(): AssetSource {
    return this.source;
  }

  /**
   * Create progress UI during loading
   */
  private createProgressUI(): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Background
    this.progressBg = this.scene.add.graphics();
    this.progressBg.setScrollFactor(0);
    this.progressBg.setDepth(1000);
    this.progressBg.fillStyle(0x000000, 0.7);
    this.progressBg.fillRect(0, 0, width, height);

    // Progress bar background
    this.progressBg.lineStyle(2, 0xffffff, 1);
    this.progressBg.strokeRect(centerX - 150, centerY + 20, 300, 20);

    // Progress bar fill
    this.progressBar = this.scene.add.graphics();
    this.progressBar.setScrollFactor(0);
    this.progressBar.setDepth(1001);

    // Loading text
    this.progressText = this.scene.add.text(centerX, centerY, 'LOADING...', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    });
    this.progressText.setOrigin(0.5);
    this.progressText.setScrollFactor(0);
    this.progressText.setDepth(1002);
  }

  /**
   * Update progress UI
   */
  private updateProgressUI(percent: number): void {
    if (this.progressBar && this.progressText) {
      const width = Math.floor((percent / 100) * 300);

      this.progressBar.clear();
      this.progressBar.fillStyle(0x00ff00, 1);
      this.progressBar.fillRect(
        this.scene.cameras.main.width / 2 - 148,
        this.scene.cameras.main.height / 2 + 22,
        width,
        16
      );

      this.progressText.setText(`LOADING... ${percent}%`);
    }
  }

  /**
   * Destroy progress UI
   */
  private destroyProgressUI(): void {
    if (this.progressBg) this.progressBg.destroy();
    if (this.progressBar) this.progressBar.destroy();
    if (this.progressText) this.progressText.destroy();
  }

  /**
   * Clear all asset collections
   */
  clearCollections(): void {
    this.collections.clear();
  }

  /**
   * Get loaded asset keys from a collection
   */
  getAssetKeys(collectionName: string): string[] {
    const assets = this.collections.get(collectionName);
    return assets ? assets.map(a => a.key) : [];
  }

  /**
   * Check if an asset exists in the cache
   */
  isAssetLoaded(key: string): boolean {
    return this.scene.textures.exists(key) ||
           this.scene.cache.json.exists(key);
  }
}

/**
 * Predefined asset collections for the game
 */
export const ASSET_COLLECTIONS = {
  /** Player assets */
  PLAYER: 'player',
  /** Enemy assets */
  ENEMIES: 'enemies',
  /** Boss assets */
  BOSSES: 'bosses',
  /** Weapons */
  WEAPONS: 'weapons',
  /** UI elements */
  UI: 'ui',
  /** Backgrounds */
  BACKGROUNDS: 'backgrounds',
  /** Effects */
  EFFECTS: 'effects'
};

/**
 * Create default asset configurations
 */
export function createDefaultAssetCollections(): AssetCollectionConfig[] {
  return [
    {
      name: ASSET_COLLECTIONS.PLAYER,
      assets: [
        { key: 'player', type: 'image', url: 'assets/sprites/player.png' },
        { key: 'player-walk', type: 'sprite', url: 'assets/sprites/player-walk.png', frameConfig: { frameWidth: 32, frameHeight: 32 } }
      ]
    },
    {
      name: ASSET_COLLECTIONS.ENEMIES,
      assets: [
        { key: 'enemy', type: 'image', url: 'assets/sprites/enemy.png' },
        { key: 'enemy-fast', type: 'image', url: 'assets/sprites/enemy-fast.png' },
        { key: 'enemy-tank', type: 'image', url: 'assets/sprites/enemy-tank.png' }
      ]
    },
    {
      name: ASSET_COLLECTIONS.BOSSES,
      assets: [
        { key: 'boss', type: 'image', url: 'assets/sprites/boss.png' },
        { key: 'boss-dark', type: 'image', url: 'assets/sprites/boss-dark.png' }
      ]
    },
    {
      name: ASSET_COLLECTIONS.WEAPONS,
      assets: [
        { key: 'projectile', type: 'image', url: 'assets/sprites/projectile.png' },
        { key: 'melee-slash', type: 'image', url: 'assets/sprites/melee-slash.png' }
      ]
    },
    {
      name: ASSET_COLLECTIONS.EFFECTS,
      assets: [
        { key: 'hit-spark', type: 'image', url: 'assets/effects/hit-spark.png' },
        { key: 'blood', type: 'image', url: 'assets/effects/blood.png' },
        { key: 'explosion', type: 'image', url: 'assets/effects/explosion.png' }
      ]
    }
  ];
}
