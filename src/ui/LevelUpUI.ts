import Phaser from 'phaser';
import { WEAPONS, WeaponDef } from '../config/weaponConfig';
import { PASSIVES } from '../config/passiveConfig';
import { LEVEL_UP_CHOICES, REROLL_COST } from '../config/constants';
import { TEXT_STYLES, FONT_FAMILY } from '../config/styles';
import { getGold, setGold } from '../config/metaConfig';
import { soundEngine } from '../systems/SoundEngine';
import { drawWeaponCard, drawPassiveCard, drawPillButton, addPanelBlur, removePanelBlur } from './UIHelpers';

export interface UpgradeOption {
  weaponId: string;
  nextLevel: number;
  isNew: boolean;
}

interface CardData {
  icon: string;
  name: string;
  label: string;
  labelColor: string;
  description: string;
  isPassive: boolean;
}

export class LevelUpUI {
  private scene: Phaser.Scene;
  private elements: Phaser.GameObjects.GameObject[] = [];
  private keyHandler: ((event: KeyboardEvent) => void) | null = null;
  private onSelect: (weaponId: string) => void;
  private onReroll: (() => void) | null;
  private blur: Phaser.FX.Blur | null = null;

  constructor(
    scene: Phaser.Scene,
    playerLevel: number,
    options: UpgradeOption[],
    ownedWeaponDefs: Map<string, WeaponDef>,
    onSelect: (weaponId: string) => void,
    onReroll?: () => void,
  ) {
    this.scene = scene;
    this.onSelect = onSelect;
    this.onReroll = onReroll ?? null;
    this.blur = addPanelBlur(scene);
    this.build(playerLevel, options, ownedWeaponDefs);
  }

  private build(
    playerLevel: number,
    options: UpgradeOption[],
    ownedWeaponDefs: Map<string, WeaponDef>,
  ): void {
    const cam = this.scene.cameras.main;
    const w = cam.width;
    const h = cam.height;

    // Dark overlay
    const overlay = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0)
      .setScrollFactor(0).setDepth(300);
    this.scene.tweens.add({ targets: overlay, fillAlpha: 0.65, duration: 200 });
    this.elements.push(overlay);

    // Header — "LEVEL UP!" with golden glow
    const headerY = h * 0.08;
    const title = this.scene.add.text(w / 2, headerY, 'LEVEL UP!', {
      ...TEXT_STYLES.heading, fontSize: '36px', color: '#FFD700',
      stroke: '#000000', strokeThickness: 5,
    }).setScrollFactor(0).setDepth(301).setOrigin(0.5).setScale(0).setAlpha(0);
    this.scene.tweens.add({
      targets: title, scale: 1, alpha: 1, duration: 350, ease: 'Back.easeOut',
    });
    this.elements.push(title);

    // Level badge
    const levelBadge = this.scene.add.text(w / 2, headerY + 40, `Lv.${playerLevel}`, {
      fontSize: '16px', fontFamily: FONT_FAMILY, fontStyle: '800',
      color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(301).setOrigin(0.5).setAlpha(0);
    this.scene.tweens.add({ targets: levelBadge, alpha: 1, duration: 300, delay: 100 });
    this.elements.push(levelBadge);

    // Subtitle
    const subtitle = this.scene.add.text(w / 2, headerY + 62, 'Choose an upgrade', {
      fontSize: '14px', fontFamily: FONT_FAMILY, fontStyle: '600',
      color: '#b0c4de',
    }).setScrollFactor(0).setDepth(301).setOrigin(0.5).setAlpha(0);
    this.scene.tweens.add({ targets: subtitle, alpha: 1, duration: 200, delay: 150 });
    this.elements.push(subtitle);

    // Cards — larger, Survivor.io style
    const cardWidth = 200;
    const cardHeight = 280;
    const gap = 24;
    const count = Math.min(options.length, LEVEL_UP_CHOICES);
    const totalWidth = count * cardWidth + (count - 1) * gap;
    const startX = (w - totalWidth) / 2 + cardWidth / 2;

    for (let i = 0; i < count; i++) {
      const opt = options[i];
      const cardData = this.resolveCardData(opt, ownedWeaponDefs);
      if (!cardData) continue;
      this.buildCard(
        startX + i * (cardWidth + gap),
        h * 0.50,
        cardWidth, cardHeight,
        opt.weaponId, cardData, i, opt.isNew,
      );
    }

    // Reroll button — bright pill style
    const canReroll = this.onReroll && getGold() >= REROLL_COST;
    const rerollY = h - 50;

    const rerollBg = this.scene.add.graphics().setScrollFactor(0).setDepth(302);
    const pillW = 170;
    const pillH = 40;
    if (canReroll) {
      drawPillButton(rerollBg, w / 2, rerollY, pillW, pillH, 0xFF9500, 0.85);
    } else {
      drawPillButton(rerollBg, w / 2, rerollY, pillW, pillH, 0x444444, 0.4);
    }
    rerollBg.setAlpha(0);
    this.scene.tweens.add({ targets: rerollBg, alpha: 1, duration: 200, delay: 400 });
    this.elements.push(rerollBg);

    const rerollColor = canReroll ? '#ffffff' : '#666666';
    const rerollBtn = this.scene.add.text(w / 2, rerollY, `Reroll (${REROLL_COST}g) [R]`, {
      fontSize: '14px', fontFamily: FONT_FAMILY, fontStyle: '700',
      color: rerollColor,
      stroke: '#000000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(303).setOrigin(0.5).setAlpha(0);
    this.scene.tweens.add({ targets: rerollBtn, alpha: 1, duration: 200, delay: 400 });

    if (canReroll) {
      rerollBtn.setInteractive({ useHandCursor: true });
      rerollBtn.on('pointerover', () => {
        this.scene.tweens.add({ targets: [rerollBtn, rerollBg], scale: 1.08, duration: 100 });
      });
      rerollBtn.on('pointerout', () => {
        this.scene.tweens.add({ targets: [rerollBtn, rerollBg], scale: 1, duration: 100 });
      });
      rerollBtn.on('pointerdown', () => this.doReroll());
    }
    this.elements.push(rerollBtn);

    // Keyboard
    this.keyHandler = (event: KeyboardEvent) => {
      const key = event.key;
      if (key >= '1' && key <= '9') {
        const num = parseInt(key);
        if (num >= 1 && num <= count) this.select(options[num - 1].weaponId);
      } else if (key === 'r' || key === 'R') {
        if (canReroll) this.doReroll();
      }
    };
    this.scene.input.keyboard!.on('keydown', this.keyHandler);
  }

  private doReroll(): void {
    if (!this.onReroll || getGold() < REROLL_COST) return;
    setGold(getGold() - REROLL_COST);
    soundEngine.reroll();
    this.destroy();
    this.onReroll();
  }

  private resolveCardData(opt: UpgradeOption, ownedDefs: Map<string, WeaponDef>): CardData | null {
    const passive = PASSIVES[opt.weaponId];
    if (passive) {
      return {
        icon: passive.icon,
        name: passive.name,
        label: opt.isNew ? 'NEW' : `Lv.${opt.nextLevel + 1}`,
        labelColor: opt.isNew ? '#66DD66' : '#4FC3F7',
        description: passive.descriptions[opt.nextLevel] ?? '',
        isPassive: true,
      };
    }
    const def = ownedDefs.get(opt.weaponId) ?? WEAPONS[opt.weaponId];
    if (!def) return null;
    return {
      icon: def.icon,
      name: def.name,
      label: opt.isNew ? 'NEW' : `Lv.${opt.nextLevel + 1}`,
      labelColor: opt.isNew ? '#66DD66' : '#FFD700',
      description: def.levels[opt.nextLevel]?.description ?? '',
      isPassive: false,
    };
  }

  private buildCard(
    cx: number, cy: number, cw: number, ch: number,
    weaponId: string, data: CardData, index: number, isNew: boolean,
  ): void {
    const container = this.scene.add.container(cx, cy);
    container.setScrollFactor(0).setDepth(302);

    // Card background — weapon=gold, passive=green
    const cardGfx = this.scene.add.graphics();
    if (data.isPassive) {
      drawPassiveCard(cardGfx, 0, 0, cw, ch, 16);
    } else {
      drawWeaponCard(cardGfx, 0, 0, cw, ch, 16);
    }

    // Icon circle
    const iconBgColor = data.isPassive ? 0x4CAF50 : 0xFFB300;
    const iconBg = this.scene.add.graphics();
    iconBg.fillStyle(iconBgColor, 0.3);
    iconBg.fillCircle(0, -80, 34);
    iconBg.lineStyle(2, iconBgColor, 0.5);
    iconBg.strokeCircle(0, -80, 34);

    const icon = this.scene.add.text(0, -80, data.icon, { fontSize: '40px' }).setOrigin(0.5);

    // Label badge (NEW / Lv.X) — colored pill
    const labelBadgeColor = isNew ? 0x66DD66 : (data.isPassive ? 0x4CAF50 : 0xFFB300);
    const labelBg = this.scene.add.graphics();
    const lw = isNew ? 50 : 46;
    labelBg.fillStyle(labelBadgeColor, 0.25);
    labelBg.fillRoundedRect(-lw / 2, -50, lw, 22, 11);
    labelBg.lineStyle(1, labelBadgeColor, 0.5);
    labelBg.strokeRoundedRect(-lw / 2, -50, lw, 22, 11);

    const labelText = this.scene.add.text(0, -39, data.label, {
      fontSize: '12px', fontFamily: FONT_FAMILY, fontStyle: '800', color: data.labelColor,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Name
    const nameText = this.scene.add.text(0, -14, data.name, {
      fontSize: '17px', fontFamily: FONT_FAMILY, fontStyle: '700',
      color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Separator line
    const sep = this.scene.add.graphics();
    const sepColor = data.isPassive ? 0x4CAF50 : 0xFFB300;
    sep.lineStyle(1, sepColor, 0.3);
    sep.lineBetween(-cw / 2 + 20, 4, cw / 2 - 20, 4);

    // Description
    const descText = this.scene.add.text(0, 24, data.description, {
      fontSize: '12px', fontFamily: FONT_FAMILY, fontStyle: '500',
      color: '#b0c4de',
      wordWrap: { width: cw - 30 }, align: 'center',
    }).setOrigin(0.5, 0);

    // Key hint [1] [2] [3]
    const keyHintBg = this.scene.add.graphics();
    keyHintBg.fillStyle(0xffffff, 0.1);
    keyHintBg.fillRoundedRect(-16, ch / 2 - 40, 32, 24, 8);

    const keyHint = this.scene.add.text(0, ch / 2 - 28, `${index + 1}`, {
      fontSize: '16px', fontFamily: FONT_FAMILY, fontStyle: '800',
      color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    container.add([cardGfx, iconBg, icon, labelBg, labelText, nameText, sep, descText, keyHintBg, keyHint]);
    container.setSize(cw, ch).setInteractive();

    // Hover effects
    container.on('pointerover', () => {
      this.scene.tweens.add({
        targets: container, scale: 1.05, y: cy - 5,
        duration: 120, ease: 'Cubic.easeOut',
      });
    });
    container.on('pointerout', () => {
      this.scene.tweens.add({
        targets: container, scale: 1, y: cy,
        duration: 120, ease: 'Cubic.easeOut',
      });
    });
    container.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: container, scale: 0.95, duration: 60, yoyo: true,
        onComplete: () => this.select(weaponId),
      });
    });

    // Staggered entrance — slide up from below
    container.setScale(0.7).setAlpha(0).setY(cy + 60);
    this.scene.tweens.add({
      targets: container, scale: 1, alpha: 1, y: cy,
      duration: 350, delay: 150 + index * 80, ease: 'Back.easeOut',
    });

    this.elements.push(container);
  }

  private select(weaponId: string): void {
    this.destroy();
    this.onSelect(weaponId);
  }

  destroy(): void {
    removePanelBlur(this.scene, this.blur);
    this.blur = null;
    if (this.keyHandler) {
      this.scene.input.keyboard!.off('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    for (const el of this.elements) el.destroy();
    this.elements = [];
  }
}
