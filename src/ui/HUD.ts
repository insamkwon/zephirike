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
  private weaponIcons!: Phaser.GameObjects.Text;


  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.create();
  }

  private create(): void {
    const w = this.scene.cameras.main.width;

    // XP bar at very top (full width)
    this.xpBarBg = this.scene.add.rectangle(w / 2, 6, w - 20, 8, 0x333333)
      .setScrollFactor(0).setDepth(100);
    this.xpBarFill = this.scene.add.rectangle(10, 6, 0, 8, 0x44ddff)
      .setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);

    // HP bar below XP
    this.hpBarBg = this.scene.add.rectangle(80, 22, 120, 10, 0x333333)
      .setScrollFactor(0).setDepth(100);
    this.hpBarFill = this.scene.add.rectangle(21, 22, 118, 10, 0xff4444)
      .setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);

    // Level display
    this.levelText = this.scene.add.text(10, 30, 'Lv.1', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setScrollFactor(0).setDepth(102);

    // Timer
    this.timerText = this.scene.add.text(w / 2, 22, '00:00', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(102).setOrigin(0.5);

    // Kill count
    this.killText = this.scene.add.text(w - 10, 22, 'Kills: 0', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 2,
    }).setScrollFactor(0).setDepth(102).setOrigin(1, 0.5);

    // Weapon icons
    this.weaponIcons = this.scene.add.text(10, 50, '', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setScrollFactor(0).setDepth(102);
  }

  update(elapsedSeconds: number, weaponInfo: string): void {

    // HP bar
    const hpRatio = this.player.hp / this.player.maxHp;
    this.hpBarFill.setSize(118 * hpRatio, 10);
    // Color shift red->green
    if (hpRatio > 0.5) {
      this.hpBarFill.setFillStyle(0x44ff44);
    } else if (hpRatio > 0.25) {
      this.hpBarFill.setFillStyle(0xffaa00);
    } else {
      this.hpBarFill.setFillStyle(0xff4444);
    }

    // XP bar
    const xpRatio = this.player.xp / this.player.xpToNext;
    const maxW = this.scene.cameras.main.width - 20;
    this.xpBarFill.setSize(maxW * xpRatio, 8);

    // Level
    this.levelText.setText(`Lv.${this.player.level}`);

    // Timer
    const remaining = Math.max(0, GAME_DURATION_SECONDS - elapsedSeconds);
    const min = Math.floor(remaining / 60);
    const sec = Math.floor(remaining % 60);
    this.timerText.setText(`${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`);

    // Kills
    this.killText.setText(`Kills: ${this.player.kills}`);

    // Weapons
    this.weaponIcons.setText(weaponInfo);
  }

  destroy(): void {
    this.hpBarBg.destroy();
    this.hpBarFill.destroy();
    this.xpBarBg.destroy();
    this.xpBarFill.destroy();
    this.levelText.destroy();
    this.timerText.destroy();
    this.killText.destroy();
    this.weaponIcons.destroy();
  }
}
