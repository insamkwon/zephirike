import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { GAME_DURATION_SECONDS } from '../config/constants';

export class HUD {
  private scene: Phaser.Scene;
  private player: Player;

  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private xpBarBg!: Phaser.GameObjects.Rectangle;
  private xpBarFill!: Phaser.GameObjects.Rectangle;
  private levelText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private weaponIcons!: Phaser.GameObjects.Text;
  private passiveIcons!: Phaser.GameObjects.Text;
  private evoIndicator!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.create();
  }

  private create(): void {
    const w = this.scene.cameras.main.width;
    const d = 100; // base depth

    // XP bar (full width at top)
    this.xpBarBg = this.scene.add.rectangle(w / 2, 6, w - 20, 8, 0x333333)
      .setScrollFactor(0).setDepth(d);
    this.xpBarFill = this.scene.add.rectangle(10, 6, 0, 8, 0x44ddff)
      .setScrollFactor(0).setDepth(d + 1).setOrigin(0, 0.5);

    // HP bar
    this.hpBarBg = this.scene.add.rectangle(80, 22, 120, 10, 0x333333)
      .setScrollFactor(0).setDepth(d);
    this.hpBarFill = this.scene.add.rectangle(21, 22, 118, 10, 0xff4444)
      .setScrollFactor(0).setDepth(d + 1).setOrigin(0, 0.5);

    const textStyle = { fontSize: '12px', fontFamily: 'monospace', stroke: '#000000', strokeThickness: 2 };

    // Level
    this.levelText = this.scene.add.text(10, 30, 'Lv.1', { ...textStyle, color: '#ffffff' })
      .setScrollFactor(0).setDepth(d + 2);

    // Timer (center)
    this.timerText = this.scene.add.text(w / 2, 22, '15:00', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(d + 2).setOrigin(0.5);

    // Kills (top right)
    this.killText = this.scene.add.text(w - 10, 16, 'Kills: 0', { ...textStyle, color: '#ffdd44' })
      .setScrollFactor(0).setDepth(d + 2).setOrigin(1, 0.5);

    // Gold (below kills)
    this.goldText = this.scene.add.text(w - 10, 32, 'Gold: 0', { ...textStyle, color: '#ddaa22' })
      .setScrollFactor(0).setDepth(d + 2).setOrigin(1, 0.5);

    // Weapon icons (left side)
    this.weaponIcons = this.scene.add.text(10, 48, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ffffff',
    }).setScrollFactor(0).setDepth(d + 2);

    // Passive icons (below weapons)
    this.passiveIcons = this.scene.add.text(10, 80, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#88bbff',
    }).setScrollFactor(0).setDepth(d + 2);

    // Evolution ready indicator
    this.evoIndicator = this.scene.add.text(w / 2, 40, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffdd44',
      stroke: '#000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(d + 2).setOrigin(0.5);
  }

  update(
    elapsedSeconds: number,
    weaponInfo: string,
    gold = 0,
    passiveInfo = '',
    evolutionReady = false
  ): void {
    // HP bar
    const hpRatio = this.player.hp / this.player.maxHp;
    this.hpBarFill.setSize(118 * hpRatio, 10);
    if (hpRatio > 0.5) this.hpBarFill.setFillStyle(0x44ff44);
    else if (hpRatio > 0.25) this.hpBarFill.setFillStyle(0xffaa00);
    else this.hpBarFill.setFillStyle(0xff4444);

    // XP bar
    const xpRatio = this.player.xp / this.player.xpToNext;
    const maxW = this.scene.cameras.main.width - 20;
    this.xpBarFill.setSize(maxW * xpRatio, 8);

    this.levelText.setText(`Lv.${this.player.level}`);

    // Timer
    const remaining = Math.max(0, GAME_DURATION_SECONDS - elapsedSeconds);
    const min = Math.floor(remaining / 60);
    const sec = Math.floor(remaining % 60);
    this.timerText.setText(`${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`);
    // Timer urgency color
    if (remaining <= 60) this.timerText.setColor('#ff4444');
    else if (remaining <= 180) this.timerText.setColor('#ffaa00');
    else this.timerText.setColor('#ffffff');

    this.killText.setText(`Kills: ${this.player.kills}`);
    this.goldText.setText(`Gold: ${gold}`);
    this.weaponIcons.setText(weaponInfo);
    this.passiveIcons.setText(passiveInfo);
    this.evoIndicator.setText(evolutionReady ? '✨ Evolution Ready! ✨' : '');
  }

  destroy(): void {
    [this.hpBarBg, this.hpBarFill, this.xpBarBg, this.xpBarFill,
     this.levelText, this.timerText, this.killText, this.goldText,
     this.weaponIcons, this.passiveIcons, this.evoIndicator
    ].forEach(el => el.destroy());
  }
}
