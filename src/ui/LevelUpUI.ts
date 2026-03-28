import Phaser from 'phaser';
import { WEAPONS, WeaponDef } from '../config/weaponConfig';
import { PASSIVES } from '../config/passiveConfig';
import { LEVEL_UP_CHOICES, REROLL_COST } from '../config/constants';
import { TEXT_STYLES } from '../config/styles';
import { getGold, setGold } from '../config/metaConfig';
import { soundEngine } from '../systems/SoundEngine';

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
}

export class LevelUpUI {
  private scene: Phaser.Scene;
  private elements: Phaser.GameObjects.GameObject[] = [];
  private keyHandler: ((event: KeyboardEvent) => void) | null = null;
  private onSelect: (weaponId: string) => void;
  private onReroll: (() => void) | null;

  constructor(
    scene: Phaser.Scene,
    playerLevel: number,
    options: UpgradeOption[],
    ownedWeaponDefs: Map<string, WeaponDef>,
    onSelect: (weaponId: string) => void,
    onReroll?: () => void
  ) {
    this.scene = scene;
    this.onSelect = onSelect;
    this.onReroll = onReroll ?? null;
    this.build(playerLevel, options, ownedWeaponDefs);
  }

  private build(
    playerLevel: number,
    options: UpgradeOption[],
    ownedWeaponDefs: Map<string, WeaponDef>
  ): void {
    const cam = this.scene.cameras.main;
    const w = cam.width;
    const h = cam.height;

    const overlay = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
      .setScrollFactor(0).setDepth(300);
    this.elements.push(overlay);

    const title = this.scene.add.text(w / 2, 75, `LEVEL UP! (Lv.${playerLevel})`, TEXT_STYLES.heading)
      .setScrollFactor(0).setDepth(301).setOrigin(0.5);
    this.elements.push(title);

    const subtitle = this.scene.add.text(w / 2, 108, 'Choose an upgrade:', {
      ...TEXT_STYLES.caption,
    }).setScrollFactor(0).setDepth(301).setOrigin(0.5);
    this.elements.push(subtitle);

    // Cards
    const cardWidth = 200;
    const gap = 20;
    const count = Math.min(options.length, LEVEL_UP_CHOICES);
    const totalWidth = count * cardWidth + (count - 1) * gap;
    const startX = (w - totalWidth) / 2 + cardWidth / 2;

    for (let i = 0; i < count; i++) {
      const opt = options[i];
      const cardData = this.resolveCardData(opt, ownedWeaponDefs);
      if (!cardData) continue;
      this.buildCard(startX + i * (cardWidth + gap), h / 2 + 10, cardWidth, opt.weaponId, cardData, i);
    }

    // Reroll button
    const canReroll = this.onReroll && getGold() >= REROLL_COST;
    const rerollColor = canReroll ? '#ffdd44' : '#555555';
    const rerollBtn = this.scene.add.text(w / 2, h - 50, `[ Reroll - ${REROLL_COST}g ] (R)`, {
      ...TEXT_STYLES.body, color: rerollColor,
    }).setScrollFactor(0).setDepth(302).setOrigin(0.5);

    if (canReroll) {
      rerollBtn.setInteractive({ useHandCursor: true });
      rerollBtn.on('pointerover', () => rerollBtn.setScale(1.1));
      rerollBtn.on('pointerout', () => rerollBtn.setScale(1));
      rerollBtn.on('pointerdown', () => this.doReroll());
    }
    this.elements.push(rerollBtn);

    // Keyboard
    this.keyHandler = (event: KeyboardEvent) => {
      const key = event.key;
      if (key >= '1' && key <= '9') {
        const num = parseInt(key);
        if (num >= 1 && num <= count) {
          this.select(options[num - 1].weaponId);
        }
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
        label: opt.isNew ? 'NEW!' : `Lv.${opt.nextLevel + 1}`,
        labelColor: '#88bbff',
        description: passive.descriptions[opt.nextLevel] ?? '',
      };
    }
    const def = ownedDefs.get(opt.weaponId) ?? WEAPONS[opt.weaponId];
    if (!def) return null;
    return {
      icon: def.icon,
      name: def.name,
      label: opt.isNew ? 'NEW!' : `Lv.${opt.nextLevel + 1}`,
      labelColor: opt.isNew ? '#44ff44' : '#ffdd44',
      description: def.levels[opt.nextLevel]?.description ?? '',
    };
  }

  private buildCard(
    cx: number, cy: number, cardWidth: number,
    weaponId: string, data: CardData, index: number
  ): void {
    const container = this.scene.add.container(cx, cy);
    container.setScrollFactor(0).setDepth(302);

    const bg = this.scene.add.rectangle(0, 0, cardWidth, 200, 0x222244, 0.9);
    bg.setStrokeStyle(2, 0x444466);

    const icon = this.scene.add.text(0, -65, data.icon, { fontSize: '32px' }).setOrigin(0.5);
    const labelText = this.scene.add.text(0, -35, data.label, {
      fontSize: '11px', fontFamily: 'monospace', color: data.labelColor,
    }).setOrigin(0.5);
    const nameText = this.scene.add.text(0, -18, data.name, {
      ...TEXT_STYLES.body, fontSize: '14px',
    }).setOrigin(0.5);
    const descText = this.scene.add.text(0, 12, data.description, {
      ...TEXT_STYLES.caption, fontSize: '10px',
      wordWrap: { width: 170 }, align: 'center',
    }).setOrigin(0.5);
    const keyHint = this.scene.add.text(0, 70, `[${index + 1}]`, {
      fontSize: '18px', fontFamily: 'monospace', color: '#555555',
    }).setOrigin(0.5);

    container.add([bg, icon, labelText, nameText, descText, keyHint]);
    container.setSize(cardWidth, 200).setInteractive();
    container.on('pointerover', () => bg.setStrokeStyle(2, 0xffdd44));
    container.on('pointerout', () => bg.setStrokeStyle(2, 0x444466));
    container.on('pointerdown', () => this.select(weaponId));
    this.elements.push(container);
  }

  private select(weaponId: string): void {
    this.destroy();
    this.onSelect(weaponId);
  }

  destroy(): void {
    if (this.keyHandler) {
      this.scene.input.keyboard!.off('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    for (const el of this.elements) el.destroy();
    this.elements = [];
  }
}
