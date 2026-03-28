import Phaser from 'phaser';
import { WEAPONS, WeaponDef } from '../config/weaponConfig';
import { PASSIVES } from '../config/passiveConfig';
import { LEVEL_UP_CHOICES } from '../config/constants';

export interface UpgradeOption {
  weaponId: string;
  nextLevel: number;
  isNew: boolean;
}

/**
 * Self-contained level-up overlay UI.
 * Creates its own display objects and cleans them all up on selection.
 */
export class LevelUpUI {
  private scene: Phaser.Scene;
  private elements: Phaser.GameObjects.GameObject[] = [];
  private keyHandler: ((event: KeyboardEvent) => void) | null = null;
  private onSelect: (weaponId: string) => void;

  constructor(
    scene: Phaser.Scene,
    playerLevel: number,
    options: UpgradeOption[],
    ownedWeaponDefs: Map<string, WeaponDef>,
    onSelect: (weaponId: string) => void
  ) {
    this.scene = scene;
    this.onSelect = onSelect;
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

    // Overlay
    const overlay = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
      .setScrollFactor(0).setDepth(300);
    this.elements.push(overlay);

    // Title
    const title = this.scene.add.text(w / 2, 80, `LEVEL UP! (Lv.${playerLevel})`, {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#ffdd44',
      stroke: '#000',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(301).setOrigin(0.5);
    this.elements.push(title);

    const subtitle = this.scene.add.text(w / 2, 115, 'Choose an upgrade:', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
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
      // Check if this is a passive item
      const passive = PASSIVES[opt.weaponId];
      if (passive) {
        const fakeDef: WeaponDef = {
          id: passive.id,
          name: passive.name,
          type: 'area',
          icon: passive.icon,
          color: 0x88bbff,
          maxLevel: passive.maxLevel,
          levels: passive.descriptions.map(d => ({
            damage: 0, cooldown: 0, count: 0, pierce: 0, area: 0,
            speed: 0, duration: 0, description: d,
          })),
        };
        this.buildCard(startX + i * (cardWidth + gap), h / 2 + 20, cardWidth, opt, fakeDef, i);
      } else {
        const def = ownedWeaponDefs.get(opt.weaponId) ?? WEAPONS[opt.weaponId];
        if (!def) continue;
        this.buildCard(startX + i * (cardWidth + gap), h / 2 + 20, cardWidth, opt, def, i);
      }
    }

    // Keyboard shortcuts — cleaned up properly
    this.keyHandler = (event: KeyboardEvent) => {
      const key = event.key;
      if (key >= '1' && key <= '9') {
        const num = parseInt(key);
        if (num >= 1 && num <= count) {
          this.select(options[num - 1].weaponId);
        }
      }
    };
    this.scene.input.keyboard!.on('keydown', this.keyHandler);
  }

  private buildCard(
    cx: number, cy: number, cardWidth: number,
    opt: UpgradeOption, def: WeaponDef, index: number
  ): void {
    const container = this.scene.add.container(cx, cy);
    container.setScrollFactor(0).setDepth(302);

    const bg = this.scene.add.rectangle(0, 0, cardWidth, 220, 0x222244, 0.9);
    bg.setStrokeStyle(2, 0x444466);

    const icon = this.scene.add.text(0, -70, def.icon, { fontSize: '36px' }).setOrigin(0.5);

    const label = opt.isNew ? 'NEW!' : `Lv.${opt.nextLevel + 1}`;
    const labelColor = opt.isNew ? '#44ff44' : '#ffdd44';
    const labelText = this.scene.add.text(0, -40, label, {
      fontSize: '12px', fontFamily: 'monospace', color: labelColor,
    }).setOrigin(0.5);

    const nameText = this.scene.add.text(0, -20, def.name, {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5);

    const descText = this.scene.add.text(0, 15, def.levels[opt.nextLevel].description, {
      fontSize: '11px', fontFamily: 'monospace', color: '#aaaaaa',
      wordWrap: { width: 170 }, align: 'center',
    }).setOrigin(0.5);

    const keyHint = this.scene.add.text(0, 80, `[${index + 1}]`, {
      fontSize: '20px', fontFamily: 'monospace', color: '#666666',
    }).setOrigin(0.5);

    container.add([bg, icon, labelText, nameText, descText, keyHint]);
    container.setSize(cardWidth, 220);
    container.setInteractive();

    container.on('pointerover', () => bg.setStrokeStyle(2, 0xffdd44));
    container.on('pointerout', () => bg.setStrokeStyle(2, 0x444466));
    container.on('pointerdown', () => this.select(opt.weaponId));

    this.elements.push(container);
  }

  private select(weaponId: string): void {
    this.destroy();
    this.onSelect(weaponId);
  }

  destroy(): void {
    // Always remove the keyboard handler
    if (this.keyHandler) {
      this.scene.input.keyboard!.off('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    for (const el of this.elements) {
      el.destroy();
    }
    this.elements = [];
  }
}
