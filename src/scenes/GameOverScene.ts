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
  dpsHistory?: number[];  // DPS samples every 30s
  peakDps?: number;
  damageTaken?: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    const cx = this.cameras.main.width / 2;
    const h = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#0a0a1a');

    const titleColor = data.victory ? '#44ff44' : '#ff4444';
    const titleText = data.victory ? 'VICTORY!' : 'GAME OVER';
    this.add.text(cx, 45, titleText, { ...TEXT_STYLES.title, color: titleColor }).setOrigin(0.5);

    const subtitle = data.victory ? 'You survived the night!' : 'The darkness consumed you...';
    this.add.text(cx, 88, subtitle, { ...TEXT_STYLES.caption }).setOrigin(0.5);

    // Stats grid
    const stats = [
      ['Time', data.time],
      ['Level', `${data.level}`],
      ['Kills', `${data.kills}`],
      ['Gold Earned', `+${data.gold}`],
      ['Total Gold', `${getGold()}`],
    ];
    if (data.peakDps) stats.push(['Peak DPS', `${data.peakDps}`]);
    if (data.damageTaken) stats.push(['Damage Taken', `${data.damageTaken}`]);

    let sy = 115;
    for (const [label, value] of stats) {
      this.add.text(cx - 100, sy, label, { ...TEXT_STYLES.caption, color: '#888888' }).setOrigin(0, 0.5);
      this.add.text(cx + 100, sy, value, { ...TEXT_STYLES.body, fontSize: '13px' }).setOrigin(1, 0.5);
      sy += 22;
    }

    // DPS graph (if data available)
    if (data.dpsHistory && data.dpsHistory.length > 1) {
      this.drawDpsGraph(cx, sy + 15, 300, 80, data.dpsHistory);
      sy += 110;
    }

    // Weapons
    if (data.weapons.length > 0) {
      this.add.text(cx, sy, 'Build:', { ...TEXT_STYLES.caption, color: '#888888' }).setOrigin(0.5);
      sy += 18;
      this.add.text(cx, sy, data.weapons.join('  '), {
        fontSize: '11px', fontFamily: 'monospace', color: '#aaaaaa',
      }).setOrigin(0.5);
    }

    // Actions
    this.add.text(cx, h - 50, 'Press ENTER to Continue', {
      ...TEXT_STYLES.body, color: '#44ddff',
    }).setOrigin(0.5);

    this.add.text(cx, h - 28, 'Spend gold on upgrades in the menu!', {
      ...TEXT_STYLES.caption, color: '#555555',
    }).setOrigin(0.5);

    this.input.keyboard!.on('keydown-ENTER', () => this.scene.start('MenuScene'));
    this.input.keyboard!.on('keydown-SPACE', () => this.scene.start('MenuScene'));
    this.input.once('pointerdown', () => this.scene.start('MenuScene'));
  }

  private drawDpsGraph(cx: number, y: number, w: number, graphH: number, dps: number[]): void {
    const x = cx - w / 2;
    const maxDps = Math.max(...dps, 1);

    // Background
    this.add.rectangle(cx, y + graphH / 2, w, graphH, 0x111122, 0.5);

    // Label
    this.add.text(cx, y - 8, 'DPS Over Time', {
      fontSize: '10px', fontFamily: 'monospace', color: '#666666',
    }).setOrigin(0.5);

    // Draw bars
    const barW = Math.max(2, (w - 10) / dps.length - 1);
    for (let i = 0; i < dps.length; i++) {
      const barH = (dps[i] / maxDps) * (graphH - 10);
      const bx = x + 5 + i * ((w - 10) / dps.length);
      const by = y + graphH - 5 - barH;

      const intensity = dps[i] / maxDps;
      const color = Phaser.Display.Color.GetColor(
        Math.floor(100 + 155 * intensity),
        Math.floor(100 + 100 * (1 - intensity)),
        100
      );

      this.add.rectangle(bx + barW / 2, by + barH / 2, barW, barH, color, 0.8);
    }

    // Axis labels
    this.add.text(x, y + graphH + 2, '0:00', {
      fontSize: '8px', fontFamily: 'monospace', color: '#555555',
    });
    const totalMin = dps.length * 0.5;
    this.add.text(x + w, y + graphH + 2, `${totalMin.toFixed(0)}:00`, {
      fontSize: '8px', fontFamily: 'monospace', color: '#555555',
    }).setOrigin(1, 0);
  }
}
