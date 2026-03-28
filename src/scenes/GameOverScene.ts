import Phaser from 'phaser';

interface GameOverData {
  victory: boolean;
  time: string;
  kills: number;
  level: number;
  weapons: string[];
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    const cx = this.cameras.main.width / 2;
    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Title
    const titleColor = data.victory ? '#44ff44' : '#ff4444';
    const titleText = data.victory ? 'VICTORY!' : 'GAME OVER';
    this.add.text(cx, 80, titleText, {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: titleColor,
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Subtitle
    const subtitle = data.victory
      ? 'You survived the night!'
      : 'The darkness consumed you...';
    this.add.text(cx, 130, subtitle, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#888888',
    }).setOrigin(0.5);

    // Stats
    const stats = [
      `Time: ${data.time}`,
      `Level: ${data.level}`,
      `Kills: ${data.kills}`,
      '',
      'Weapons:',
      ...data.weapons,
    ];

    this.add.text(cx, 200, stats.join('\n'), {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#cccccc',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5, 0);

    // Restart prompt
    this.add.text(cx, 480, 'Press ENTER or Click to Restart', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#44ddff',
    }).setOrigin(0.5);

    this.add.text(cx, 510, 'Press M for Menu', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#666666',
    }).setOrigin(0.5);

    // Input
    this.input.keyboard!.on('keydown-ENTER', () => {
      this.scene.start('MenuScene');
    });
    this.input.keyboard!.on('keydown-SPACE', () => {
      this.scene.start('MenuScene');
    });
    this.input.keyboard!.on('keydown-M', () => {
      this.scene.start('MenuScene');
    });
    this.input.once('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}
