import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { GAME_DURATION_SECONDS } from '../config/constants';
import { UI_COLORS, FONT_FAMILY } from '../config/styles';
import { drawRoundedBar } from './UIHelpers';

const MARGIN = 10;
const XP_H = 10;
const XP_RADIUS = 5;

/** Weapon/passive slot size */
const SLOT_SIZE = 36;
const SLOT_GAP = 4;
const SLOT_RADIUS = 8;

export class HUD {
  private scene: Phaser.Scene;
  private player: Player;

  private barGraphics!: Phaser.GameObjects.Graphics;
  private slotGraphics!: Phaser.GameObjects.Graphics;
  private levelBadge!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private killText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private weaponSlotTexts: Phaser.GameObjects.Text[] = [];
  private passiveSlotTexts: Phaser.GameObjects.Text[] = [];
  private evoIndicator!: Phaser.GameObjects.Text;

  private lastLevel = 1;
  private evoPulseTween: Phaser.Tweens.Tween | null = null;
  private timerPulseTween: Phaser.Tweens.Tween | null = null;
  private lastTimerUrgency = 0;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.create();
  }

  private create(): void {
    const w = this.scene.cameras.main.width;
    const d = 100;

    // Bar graphics for XP
    this.barGraphics = this.scene.add.graphics()
      .setScrollFactor(0).setDepth(d + 1);

    // Slot graphics (weapon/passive grid)
    this.slotGraphics = this.scene.add.graphics()
      .setScrollFactor(0).setDepth(d);

    // Level badge (left of XP bar)
    this.levelBadge = this.scene.add.text(MARGIN + 20, 4 + XP_H / 2, 'Lv.1', {
      fontSize: '12px', fontFamily: FONT_FAMILY, fontStyle: '800',
      color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(d + 3).setOrigin(0.5);

    // Timer (top center, big and clear)
    this.timerText = this.scene.add.text(w / 2, 22, '15:00', {
      fontSize: '22px', fontFamily: FONT_FAMILY, fontStyle: '800',
      color: '#ffffff',
      stroke: '#000000', strokeThickness: 4,
    }).setScrollFactor(0).setDepth(d + 2).setOrigin(0.5);

    // Kill count (top right, compact)
    this.killText = this.scene.add.text(w - MARGIN - 70, 8, '0', {
      fontSize: '14px', fontFamily: FONT_FAMILY, fontStyle: '700',
      color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(d + 2).setOrigin(0, 0);

    // Kill icon label
    this.scene.add.text(w - MARGIN - 84, 8, '\u2694', {
      fontSize: '14px',
    }).setScrollFactor(0).setDepth(d + 2).setOrigin(0, 0);

    // Gold (top right, below kills)
    this.goldText = this.scene.add.text(w - MARGIN - 70, 28, '0', {
      fontSize: '14px', fontFamily: FONT_FAMILY, fontStyle: '700',
      color: '#FFD700',
      stroke: '#000000', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(d + 2).setOrigin(0, 0);

    // Gold icon
    this.scene.add.text(w - MARGIN - 84, 28, '\uD83E\uDE99', {
      fontSize: '14px',
    }).setScrollFactor(0).setDepth(d + 2).setOrigin(0, 0);

    // 6 weapon slot labels (bottom-left)
    const h = this.scene.cameras.main.height;
    for (let i = 0; i < 6; i++) {
      const sx = MARGIN + (i % 3) * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE / 2;
      const sy = h - MARGIN - (1 - Math.floor(i / 3)) * (SLOT_SIZE + SLOT_GAP) - SLOT_SIZE / 2;
      const t = this.scene.add.text(sx, sy, '', {
        fontSize: '18px',
      }).setScrollFactor(0).setDepth(d + 2).setOrigin(0.5);
      this.weaponSlotTexts.push(t);
    }

    // Passive slots (below weapon slots)
    for (let i = 0; i < 5; i++) {
      const sx = MARGIN + i * (24 + 2) + 12;
      const sy = h - MARGIN - 2 * (SLOT_SIZE + SLOT_GAP) - 12;
      const t = this.scene.add.text(sx, sy, '', {
        fontSize: '12px',
      }).setScrollFactor(0).setDepth(d + 2).setOrigin(0.5);
      this.passiveSlotTexts.push(t);
    }

    // Evolution indicator (center top, below timer)
    this.evoIndicator = this.scene.add.text(w / 2, 46, '', {
      fontSize: '14px', fontFamily: FONT_FAMILY, fontStyle: '800',
      color: '#FFD700',
      stroke: '#000000', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(d + 2).setOrigin(0.5);
  }

  update(
    elapsedSeconds: number,
    weaponInfo: string,
    gold = 0,
    passiveInfo = '',
    evolutionReady = false,
  ): void {
    const w = this.scene.cameras.main.width;
    const h = this.scene.cameras.main.height;
    const xpRatio = this.player.xp / this.player.xpToNext;

    this.barGraphics.clear();
    this.slotGraphics.clear();

    // XP bar (full width at very top)
    drawRoundedBar(
      this.barGraphics,
      MARGIN + 40, 4, w - MARGIN * 2 - 40, XP_H, xpRatio, XP_RADIUS,
      0x1a2a20, UI_COLORS.xpBar, 0.6,
    );

    // Level badge
    if (this.player.level !== this.lastLevel) {
      this.lastLevel = this.player.level;
      this.levelBadge.setText(`Lv.${this.player.level}`);
      this.scene.tweens.add({
        targets: this.levelBadge,
        scale: { from: 1.8, to: 1 },
        duration: 300, ease: 'Back.easeOut',
      });
    } else {
      this.levelBadge.setText(`Lv.${this.player.level}`);
    }

    // Timer
    const remaining = Math.max(0, GAME_DURATION_SECONDS - elapsedSeconds);
    const min = Math.floor(remaining / 60);
    const sec = Math.floor(remaining % 60);
    this.timerText.setText(`${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`);

    let urgency = 0;
    if (remaining <= 60) urgency = 2;
    else if (remaining <= 180) urgency = 1;

    if (urgency !== this.lastTimerUrgency) {
      this.lastTimerUrgency = urgency;
      if (this.timerPulseTween) { this.timerPulseTween.stop(); this.timerText.setScale(1); }
      if (urgency === 2) {
        this.timerText.setColor('#FF4444');
        this.timerPulseTween = this.scene.tweens.add({
          targets: this.timerText,
          scale: { from: 1, to: 1.15 },
          yoyo: true, repeat: -1, duration: 400, ease: 'Sine.easeInOut',
        });
      } else if (urgency === 1) {
        this.timerText.setColor('#FF9500');
      } else {
        this.timerText.setColor('#ffffff');
      }
    }

    // Kills/Gold
    const killStr = `${this.player.kills}`;
    if (this.killText.text !== killStr) this.killText.setText(killStr);
    this.goldText.setText(`${gold}`);

    // Weapon slots (bottom-left grid)
    const weapons = weaponInfo.split(' ').filter(s => s.length > 0);
    for (let i = 0; i < 6; i++) {
      const sx = MARGIN + (i % 3) * (SLOT_SIZE + SLOT_GAP);
      const sy = h - MARGIN - (1 - Math.floor(i / 3)) * (SLOT_SIZE + SLOT_GAP) - SLOT_SIZE;

      // Draw slot bg
      this.slotGraphics.fillStyle(0x1a2a20, 0.7);
      this.slotGraphics.fillRoundedRect(sx, sy, SLOT_SIZE, SLOT_SIZE, SLOT_RADIUS);
      this.slotGraphics.lineStyle(1, 0xffffff, 0.1);
      this.slotGraphics.strokeRoundedRect(sx, sy, SLOT_SIZE, SLOT_SIZE, SLOT_RADIUS);

      if (i < weapons.length) {
        // Extract icon (first emoji) from weapon string
        const match = weapons[i].match(/^([\p{Emoji}\u200d]+)/u);
        const icon = match ? match[1] : weapons[i].charAt(0);
        this.weaponSlotTexts[i].setText(icon);
        // Active slot highlight
        this.slotGraphics.lineStyle(1.5, UI_COLORS.cardWeapon, 0.4);
        this.slotGraphics.strokeRoundedRect(sx, sy, SLOT_SIZE, SLOT_SIZE, SLOT_RADIUS);
      } else {
        this.weaponSlotTexts[i].setText('');
      }
    }

    // Passive icons
    const passives = passiveInfo.split(' ').filter(s => s.length > 0);
    for (let i = 0; i < 5; i++) {
      if (i < passives.length) {
        this.passiveSlotTexts[i].setText(passives[i]);
      } else {
        this.passiveSlotTexts[i].setText('');
      }
    }

    // Evolution indicator
    if (evolutionReady) {
      if (this.evoIndicator.text === '') {
        this.evoIndicator.setText('EVOLUTION READY!');
        this.evoPulseTween = this.scene.tweens.add({
          targets: this.evoIndicator,
          scale: { from: 1, to: 1.2 },
          alpha: { from: 1, to: 0.5 },
          yoyo: true, repeat: -1, duration: 500, ease: 'Sine.easeInOut',
        });
      }
    } else {
      if (this.evoIndicator.text !== '') {
        this.evoIndicator.setText('');
        if (this.evoPulseTween) { this.evoPulseTween.stop(); this.evoPulseTween = null; }
        this.evoIndicator.setScale(1).setAlpha(1);
      }
    }
  }

  flashGold(): void {
    this.scene.tweens.add({
      targets: this.goldText,
      scale: { from: 1.4, to: 1 },
      duration: 200, ease: 'Back.easeOut',
    });
  }

  flashKills(): void {
    this.scene.tweens.add({
      targets: this.killText,
      scale: { from: 1.5, to: 1 },
      duration: 250, ease: 'Back.easeOut',
    });
  }

  destroy(): void {
    if (this.evoPulseTween) this.evoPulseTween.stop();
    if (this.timerPulseTween) this.timerPulseTween.stop();
    [this.barGraphics, this.slotGraphics, this.levelBadge, this.timerText,
     this.killText, this.goldText, this.evoIndicator,
     ...this.weaponSlotTexts, ...this.passiveSlotTexts,
    ].forEach(el => el.destroy());
  }
}
