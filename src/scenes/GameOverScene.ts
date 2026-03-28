import Phaser from 'phaser';
import { getGold } from '../config/metaConfig';
import { TEXT_STYLES } from '../config/styles';

interface GameOverData {
  victory: boolean;
  time: string;
  kills: number;
  level: number;
  gold: number;
  weapons: string[];
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    const cx = this.cameras.main.width / 2;
    this.cameras.main.setBackgroundColor('#0a0a1a');

    const titleColor = data.victory ? '#44ff44' : '#ff4444';
    const titleText = data.victory ? 'VICTORY!' : 'GAME OVER';
    this.add.text(cx, 60, titleText, { ...TEXT_STYLES.title, color: titleColor }).setOrigin(0.5);

    const subtitle = data.victory ? 'You survived the night!' : 'The darkness consumed you...';
    this.add.text(cx, 110, subtitle, {
      fontSize: '14px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(0.5);

    // Stats
    const stats = [
      `Time Survived: ${data.time}`,
      `Level Reached: ${data.level}`,
      `Enemies Slain: ${data.kills}`,
      `Gold Earned: ${data.gold}`,
      `Total Gold: ${getGold()}`,
    ];

    this.add.text(cx, 170, stats.join('\n'), {
      fontSize: '14px', fontFamily: 'monospace', color: '#cccccc',
      align: 'center', lineSpacing: 8,
    }).setOrigin(0.5, 0);

    // Weapons used
    if (data.weapons.length > 0) {
      this.add.text(cx, 310, 'Weapons:', {
        fontSize: '12px', fontFamily: 'monospace', color: '#888888',
      }).setOrigin(0.5);

      this.add.text(cx, 335, data.weapons.join('\n'), {
        fontSize: '12px', fontFamily: 'monospace', color: '#aaaaaa',
        align: 'center', lineSpacing: 4,
      }).setOrigin(0.5, 0);
    }

    // Actions
    this.add.text(cx, 470, 'Press ENTER to Continue', {
      fontSize: '18px', fontFamily: 'monospace', color: '#44ddff',
    }).setOrigin(0.5);

    this.add.text(cx, 500, 'Spend gold on permanent upgrades in the menu!', {
      fontSize: '11px', fontFamily: 'monospace', color: '#666666',
    }).setOrigin(0.5);

    this.input.keyboard!.on('keydown-ENTER', () => this.scene.start('MenuScene'));
    this.input.keyboard!.on('keydown-SPACE', () => this.scene.start('MenuScene'));
    this.input.once('pointerdown', () => this.scene.start('MenuScene'));
  }
}
