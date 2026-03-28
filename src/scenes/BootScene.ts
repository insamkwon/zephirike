import Phaser from 'phaser';
import { generateAssets } from '../utils/AssetGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Generate all procedural textures
    generateAssets(this);

    // Go to menu
    this.scene.start('MenuScene');
  }
}
