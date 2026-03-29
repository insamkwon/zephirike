import Phaser from 'phaser';
import { CHARACTERS, getUnlockedCharacters, CharacterDef } from '../config/characterConfig';
import { META_UPGRADES, getGold, setGold, getUpgradeLevel, setUpgradeLevel } from '../config/metaConfig';
import { soundEngine } from '../systems/SoundEngine';
import { TEXT_STYLES, UI_COLORS, FONT_FAMILY } from '../config/styles';
import { drawGradientCard, drawCardBorder, drawGlassPanel, drawPillButton, addPanelBlur, removePanelBlur } from '../ui/UIHelpers';

export class MenuScene extends Phaser.Scene {
  private selectedChar = 0;
  private charCards: Phaser.GameObjects.Container[] = [];
  private shopMode = false;
  private shopElements: Phaser.GameObjects.GameObject[] = [];
  private shopBlur: Phaser.FX.Blur | null = null;
  private unlocked!: Set<string>;
  private availableChars: CharacterDef[] = [];
  private bgParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    soundEngine.init();
    const cam = this.cameras.main;
    const cx = cam.width / 2;
    const h = cam.height;

    // Bright gradient-simulated background
    cam.setBackgroundColor('#1a3a2a');

    // Subtle vignette for depth
    try { cam.postFX.addVignette(0.5, 0.5, 0.88, 0.2); } catch {}

    this.unlocked = getUnlockedCharacters();
    this.availableChars = CHARACTERS.filter(c => this.unlocked.has(c.id));

    const sy = Math.max(30, (h - 440) / 2);

    this.createBgParticles();

    // Title — big, bold, white with glow
    const title = this.add.text(cx, sy, 'ZEPHIRIKE', {
      ...TEXT_STYLES.title, fontSize: '52px',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: title, alpha: 1, y: { from: sy - 25, to: sy },
      duration: 500, ease: 'Cubic.easeOut',
    });
    try { title.preFX?.addGlow(0xFFD700, 3, 0, false, 0.06, 10); } catch {}

    // Gold display — pill badge
    const goldY = sy + 55;
    const goldBg = this.add.graphics();
    goldBg.fillStyle(0x000000, 0.3);
    goldBg.fillRoundedRect(cx - 60, goldY - 14, 120, 28, 14);
    goldBg.setAlpha(0);
    this.tweens.add({ targets: goldBg, alpha: 1, duration: 400, delay: 200 });

    const goldText = this.add.text(cx, goldY, `\uD83E\uDE99 ${getGold()}`, {
      fontSize: '16px', fontFamily: FONT_FAMILY, fontStyle: '700',
      color: '#FFD700',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: goldText, alpha: 1, duration: 400, delay: 200 });

    // Character header
    const charHeader = this.add.text(cx, sy + 90, 'Choose Character', {
      fontSize: '14px', fontFamily: FONT_FAMILY, fontStyle: '600',
      color: '#b0c4de',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: charHeader, alpha: 1, duration: 400, delay: 250 });

    // Character cards — bright with colored borders
    const cardWidth = 190;
    const cardHeight = 160;
    const gap = 24;
    const total = this.availableChars.length;
    const totalW = total * cardWidth + (total - 1) * gap;
    const startX = (cam.width - totalW) / 2 + cardWidth / 2;
    const cardsY = sy + 190;

    this.charCards = [];
    for (let i = 0; i < total; i++) {
      const ch = this.availableChars[i];
      const container = this.add.container(startX + i * (cardWidth + gap), cardsY);

      const cardGfx = this.add.graphics();
      drawGradientCard(cardGfx, 0, 0, cardWidth, cardHeight, 14, 0x1e3028);
      const borderColor = i === 0 ? UI_COLORS.borderGold : UI_COLORS.borderSubtle;
      drawCardBorder(cardGfx, 0, 0, cardWidth, cardHeight, 14, borderColor, i === 0 ? 2.5 : 1.5);

      const icon = this.add.text(0, -48, ch.icon, { fontSize: '36px' }).setOrigin(0.5);
      const name = this.add.text(0, -10, ch.name, {
        fontSize: '17px', fontFamily: FONT_FAMILY, fontStyle: '700',
        color: '#ffffff',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5);
      const desc = this.add.text(0, 16, ch.description, {
        fontSize: '12px', fontFamily: FONT_FAMILY, fontStyle: '500',
        color: '#b0c4de',
        wordWrap: { width: 165 }, align: 'center',
      }).setOrigin(0.5);

      const stats: string[] = [];
      if (ch.hpMul !== 1) stats.push(`HP:${ch.hpMul > 1 ? '+' : ''}${Math.round((ch.hpMul - 1) * 100)}%`);
      if (ch.damageMul !== 1) stats.push(`DMG:${ch.damageMul > 1 ? '+' : ''}${Math.round((ch.damageMul - 1) * 100)}%`);
      if (ch.speedMul !== 1) stats.push(`SPD:${ch.speedMul > 1 ? '+' : ''}${Math.round((ch.speedMul - 1) * 100)}%`);

      const statText = this.add.text(0, 50, stats.join(' '), {
        fontSize: '11px', fontFamily: FONT_FAMILY, fontStyle: '700',
        color: '#4FC3F7',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5);

      container.add([cardGfx, icon, name, desc, statText]);
      container.setSize(cardWidth, cardHeight).setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        this.selectChar(i);
        this.tweens.add({
          targets: container, scale: 1.05, y: cardsY - 4,
          duration: 120, ease: 'Cubic.easeOut',
        });
      });
      container.on('pointerout', () => {
        this.tweens.add({
          targets: container, scale: 1, y: cardsY,
          duration: 120, ease: 'Cubic.easeOut',
        });
      });
      container.on('pointerdown', () => this.startGame());

      container.setScale(0.8).setAlpha(0);
      this.tweens.add({
        targets: container, scale: 1, alpha: 1,
        duration: 350, delay: 300 + i * 70, ease: 'Back.easeOut',
      });

      this.charCards.push(container);
    }

    // Locked characters
    const lockedChars = CHARACTERS.filter(c => !this.unlocked.has(c.id));
    if (lockedChars.length > 0) {
      let lockY = cardsY + 105;
      for (const lc of lockedChars) {
        const lockText = this.add.text(cx, lockY, `\uD83D\uDD12 ${lc.name} — ${lc.unlockCondition}`, {
          fontSize: '12px', fontFamily: FONT_FAMILY, fontStyle: '500',
          color: '#708090',
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: lockText, alpha: 0.7, duration: 300, delay: 500 });
        lockY += 24;
      }
    }

    // Pill buttons — bright, colorful
    const btnY = sy + 345;
    this.createPillButton(cx - 110, btnY, 'START', 0x44BB44, () => this.startGame(), 550);
    this.createPillButton(cx + 110, btnY, 'UPGRADES', 0xFF9500, () => this.toggleShop(), 600);

    // Controls hint
    const controls = this.add.text(cx, sy + 390, 'WASD/Arrows: Move   Auto-fire   M: Mute   ESC: Pause', {
      fontSize: '12px', fontFamily: FONT_FAMILY, fontStyle: '500',
      color: '#708090',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: controls, alpha: 1, duration: 300, delay: 650 });

    // Best score
    const bestTime = localStorage.getItem('zephirike_best_time');
    const bestKills = localStorage.getItem('zephirike_best_kills');
    if (bestTime) {
      const best = this.add.text(cx, sy + 415, `Best: ${bestTime}  Kills: ${bestKills ?? '0'}`, {
        fontSize: '13px', fontFamily: FONT_FAMILY, fontStyle: '600',
        color: '#FFD700',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: best, alpha: 0.8, duration: 300, delay: 700 });
    }

    // Keyboard
    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT', () => this.selectChar(Math.max(0, this.selectedChar - 1)));
    kb.on('keydown-RIGHT', () => this.selectChar(Math.min(total - 1, this.selectedChar + 1)));
    kb.on('keydown-A', () => this.selectChar(Math.max(0, this.selectedChar - 1)));
    kb.on('keydown-D', () => this.selectChar(Math.min(total - 1, this.selectedChar + 1)));
    kb.on('keydown-ENTER', () => { if (this.shopMode) this.toggleShop(); else this.startGame(); });
    kb.on('keydown-SPACE', () => this.startGame());
    kb.on('keydown-U', () => this.toggleShop());
  }

  private createBgParticles(): void {
    if (!this.textures.exists('soft_glow')) return;
    try {
      this.bgParticles = this.add.particles(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        'soft_glow',
        {
          x: { min: 0, max: this.cameras.main.width },
          y: { min: 0, max: this.cameras.main.height },
          speed: { min: 8, max: 25 },
          scale: { min: 0.1, max: 0.35 },
          alpha: { start: 0.15, end: 0 },
          lifespan: { min: 3000, max: 6000 },
          tint: [0x44aa66, 0x66cc88, 0xFFD700],
          blendMode: Phaser.BlendModes.ADD,
          frequency: 250,
          maxAliveParticles: 25,
        },
      );
      this.bgParticles.setDepth(-1);
    } catch { /* no particles */ }
  }

  private createPillButton(
    x: number, y: number, label: string, color: number, onClick: () => void, delay = 0,
  ): void {
    const pillW = 140;
    const pillH = 42;

    const bg = this.add.graphics();
    drawPillButton(bg, x, y, pillW, pillH, color, 0.9);
    bg.setAlpha(0);
    this.tweens.add({ targets: bg, alpha: 1, duration: 300, delay });

    const btn = this.add.text(x, y, label, {
      fontSize: '16px', fontFamily: FONT_FAMILY, fontStyle: '800',
      color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0);
    this.tweens.add({ targets: btn, alpha: 1, duration: 300, delay });

    btn.on('pointerover', () => {
      this.tweens.add({ targets: [btn, bg], scale: 1.08, duration: 100, ease: 'Cubic.easeOut' });
    });
    btn.on('pointerout', () => {
      this.tweens.add({ targets: [btn, bg], scale: 1, duration: 100, ease: 'Cubic.easeOut' });
    });
    btn.on('pointerdown', () => {
      this.tweens.add({
        targets: btn, scale: 0.92, duration: 50, yoyo: true,
        onComplete: onClick,
      });
    });
  }

  private selectChar(index: number): void {
    this.selectedChar = index;
    this.charCards.forEach((card, i) => {
      const cardGfx = card.getAt(0) as Phaser.GameObjects.Graphics;
      const cw = 190;
      const ch = 160;
      cardGfx.clear();
      drawGradientCard(cardGfx, 0, 0, cw, ch, 14, 0x1e3028);
      const color = i === index ? UI_COLORS.borderGold : UI_COLORS.borderSubtle;
      drawCardBorder(cardGfx, 0, 0, cw, ch, 14, color, i === index ? 2.5 : 1.5);
    });
  }

  private startGame(): void {
    if (this.shopMode) return;
    const ch = this.availableChars[this.selectedChar];
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', { character: ch });
    });
  }

  private toggleShop(): void {
    if (this.shopMode) {
      removePanelBlur(this, this.shopBlur);
      this.shopBlur = null;
      this.shopElements.forEach(e => e.destroy());
      this.shopElements = [];
      this.shopMode = false;
      return;
    }
    this.shopMode = true;
    this.shopBlur = addPanelBlur(this);
    const cam = this.cameras.main;

    const overlay = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0)
      .setDepth(50);
    this.tweens.add({ targets: overlay, fillAlpha: 0.7, duration: 200 });
    this.shopElements.push(overlay);

    const panelW = 520;
    const panelH = Math.min(cam.height - 60, META_UPGRADES.length * 65 + 120);
    const shopPanel = this.add.graphics().setDepth(50);
    drawGlassPanel(shopPanel, cam.width / 2, cam.height / 2, panelW, panelH, 18, 0.85);
    this.shopElements.push(shopPanel);

    const shopTitle = this.add.text(cam.width / 2, cam.height / 2 - panelH / 2 + 30, 'PERMANENT UPGRADES', {
      ...TEXT_STYLES.heading, fontSize: '22px',
    }).setDepth(51).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: shopTitle, alpha: 1, duration: 200 });
    this.shopElements.push(shopTitle);

    const goldDisplay = this.add.text(cam.width / 2, cam.height / 2 - panelH / 2 + 58, `\uD83E\uDE99 ${getGold()}`, {
      fontSize: '16px', fontFamily: FONT_FAMILY, fontStyle: '700',
      color: '#FFD700',
      stroke: '#000000', strokeThickness: 3,
    }).setDepth(51).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: goldDisplay, alpha: 1, duration: 200, delay: 50 });
    this.shopElements.push(goldDisplay);

    const rowStartY = cam.height / 2 - panelH / 2 + 100;
    META_UPGRADES.forEach((upgrade, i) => {
      const y = rowStartY + i * 60;
      const currentLevel = getUpgradeLevel(upgrade.id);
      const maxed = currentLevel >= upgrade.maxLevel;
      const cost = maxed ? 0 : upgrade.costPerLevel[currentLevel];

      const row = this.add.container(cam.width / 2, y).setDepth(52);

      const rowBg = this.add.graphics();
      rowBg.fillStyle(0x1e3028, 0.7);
      rowBg.fillRoundedRect(-240, -22, 480, 44, 10);
      rowBg.lineStyle(1, UI_COLORS.borderSubtle, 0.3);
      rowBg.strokeRoundedRect(-240, -22, 480, 44, 10);

      const iconText = this.add.text(-210, 0, `${upgrade.icon} ${upgrade.name}`, {
        fontSize: '14px', fontFamily: FONT_FAMILY, fontStyle: '600',
        color: '#ffffff',
      }).setOrigin(0, 0.5);

      const pipsText = '\u25CF'.repeat(currentLevel) + '\u25CB'.repeat(upgrade.maxLevel - currentLevel);
      const levelText = this.add.text(10, 0, pipsText, {
        fontSize: '13px', fontFamily: FONT_FAMILY, color: '#4FC3F7',
      }).setOrigin(0.5);

      const costStr = maxed ? 'MAX' : `${cost}g`;
      const costColor = maxed ? '#66DD66' : (getGold() >= cost ? '#FFD700' : '#FF4444');
      const costText = this.add.text(190, 0, costStr, {
        fontSize: '14px', fontFamily: FONT_FAMILY, fontStyle: '700', color: costColor,
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5);

      row.add([rowBg, iconText, levelText, costText]);
      row.setSize(480, 44);

      if (!maxed && getGold() >= cost) {
        row.setInteractive({ useHandCursor: true });
        row.on('pointerover', () => {
          rowBg.clear();
          rowBg.fillStyle(0x2a4a38, 0.8);
          rowBg.fillRoundedRect(-240, -22, 480, 44, 10);
          rowBg.lineStyle(2, UI_COLORS.borderGold, 0.5);
          rowBg.strokeRoundedRect(-240, -22, 480, 44, 10);
        });
        row.on('pointerout', () => {
          rowBg.clear();
          rowBg.fillStyle(0x1e3028, 0.7);
          rowBg.fillRoundedRect(-240, -22, 480, 44, 10);
          rowBg.lineStyle(1, UI_COLORS.borderSubtle, 0.3);
          rowBg.strokeRoundedRect(-240, -22, 480, 44, 10);
        });
        row.on('pointerdown', () => {
          setGold(getGold() - cost);
          setUpgradeLevel(upgrade.id, currentLevel + 1);
          soundEngine.goldPickup();
          this.toggleShop();
          this.toggleShop();
        });
      }

      row.setAlpha(0);
      this.tweens.add({ targets: row, alpha: 1, duration: 200, delay: 100 + i * 40 });
      this.shopElements.push(row);
    });

    const closeHint = this.add.text(cam.width / 2, cam.height / 2 + panelH / 2 - 25, 'Press U or ENTER to close', {
      fontSize: '12px', fontFamily: FONT_FAMILY, fontStyle: '500',
      color: '#708090',
    }).setDepth(51).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: closeHint, alpha: 0.7, duration: 200, delay: 400 });
    this.shopElements.push(closeHint);
  }
}
