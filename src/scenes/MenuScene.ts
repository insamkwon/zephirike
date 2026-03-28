import Phaser from 'phaser';
import { CHARACTERS, getUnlockedCharacters, CharacterDef } from '../config/characterConfig';
import { META_UPGRADES, getGold, setGold, getUpgradeLevel, setUpgradeLevel } from '../config/metaConfig';
import { soundEngine } from '../systems/SoundEngine';
import { TEXT_STYLES } from '../config/styles';

export class MenuScene extends Phaser.Scene {
  private selectedChar = 0;
  private charCards: Phaser.GameObjects.Container[] = [];
  private shopMode = false;
  private shopElements: Phaser.GameObjects.GameObject[] = [];
  private unlocked!: Set<string>;
  private availableChars: CharacterDef[] = [];

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    soundEngine.init();
    const cx = this.cameras.main.width / 2;
    this.cameras.main.setBackgroundColor('#0a0a1a');

    this.unlocked = getUnlockedCharacters();
    this.availableChars = CHARACTERS.filter(c => this.unlocked.has(c.id));

    // Title
    this.add.text(cx, 50, 'ZEPHIRIKE', TEXT_STYLES.title).setOrigin(0.5);
    this.add.text(cx, 90, `Gold: ${getGold()}`, {
      ...TEXT_STYLES.hudLabel, color: '#ffdd44',
    }).setOrigin(0.5);

    // Character selection
    this.add.text(cx, 120, 'Choose Character', {
      ...TEXT_STYLES.body, color: '#ffdd44',
    }).setOrigin(0.5);

    const cardWidth = 160;
    const gap = 15;
    const total = this.availableChars.length;
    const totalW = total * cardWidth + (total - 1) * gap;
    const startX = (this.cameras.main.width - totalW) / 2 + cardWidth / 2;

    this.charCards = [];
    for (let i = 0; i < total; i++) {
      const ch = this.availableChars[i];
      const container = this.add.container(startX + i * (cardWidth + gap), 220);

      const bg = this.add.rectangle(0, 0, cardWidth, 130, 0x222244, 0.8);
      bg.setStrokeStyle(2, i === 0 ? 0xffdd44 : 0x444466);

      const icon = this.add.text(0, -40, ch.icon, { fontSize: '28px' }).setOrigin(0.5);
      const name = this.add.text(0, -10, ch.name, {
        ...TEXT_STYLES.body, fontSize: '14px',
      }).setOrigin(0.5);
      const desc = this.add.text(0, 15, ch.description, {
        ...TEXT_STYLES.caption, fontSize: '9px',
        wordWrap: { width: 140 }, align: 'center',
      }).setOrigin(0.5);

      // Stats hint
      const stats: string[] = [];
      if (ch.hpMul !== 1) stats.push(`HP:${ch.hpMul > 1 ? '+' : ''}${Math.round((ch.hpMul - 1) * 100)}%`);
      if (ch.damageMul !== 1) stats.push(`DMG:${ch.damageMul > 1 ? '+' : ''}${Math.round((ch.damageMul - 1) * 100)}%`);
      if (ch.speedMul !== 1) stats.push(`SPD:${ch.speedMul > 1 ? '+' : ''}${Math.round((ch.speedMul - 1) * 100)}%`);

      const statText = this.add.text(0, 42, stats.join(' '), {
        fontSize: '8px', fontFamily: 'monospace', color: '#88aaff',
      }).setOrigin(0.5);

      container.add([bg, icon, name, desc, statText]);
      container.setSize(cardWidth, 130).setInteractive();
      container.on('pointerover', () => this.selectChar(i));
      container.on('pointerdown', () => this.startGame());
      this.charCards.push(container);
    }

    // Locked characters preview
    const lockedChars = CHARACTERS.filter(c => !this.unlocked.has(c.id));
    if (lockedChars.length > 0) {
      let lockY = 310;
      for (const lc of lockedChars) {
        this.add.text(cx, lockY, `${lc.icon} ${lc.name} — ${lc.unlockCondition}`, {
          ...TEXT_STYLES.caption, color: '#555555',
        }).setOrigin(0.5);
        lockY += 18;
      }
    }

    // Buttons
    this.createButton(cx - 100, 380, 'START', '#44ff44', () => this.startGame());
    this.createButton(cx + 100, 380, 'UPGRADES', '#44ddff', () => this.toggleShop());

    // Controls
    this.add.text(cx, 420, 'WASD/Arrows: Move | Auto-fire | M: Mute | ESC: Pause', {
      fontSize: '10px', fontFamily: 'monospace', color: '#444444',
    }).setOrigin(0.5);

    // High score
    const bestTime = localStorage.getItem('zephirike_best_time');
    const bestKills = localStorage.getItem('zephirike_best_kills');
    if (bestTime) {
      this.add.text(cx, 445, `Best: ${bestTime} | Kills: ${bestKills ?? '0'}`, {
        ...TEXT_STYLES.caption, color: '#444444',
      }).setOrigin(0.5);
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

  private createButton(x: number, y: number, label: string, color: string, onClick: () => void): void {
    const btn = this.add.text(x, y, `[ ${label} ]`, {
      ...TEXT_STYLES.body, color,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setScale(1.1));
    btn.on('pointerout', () => btn.setScale(1));
    btn.on('pointerdown', onClick);
  }

  private selectChar(index: number): void {
    this.selectedChar = index;
    this.charCards.forEach((card, i) => {
      const bg = card.getAt(0) as Phaser.GameObjects.Rectangle;
      bg.setStrokeStyle(2, i === index ? 0xffdd44 : 0x444466);
    });
  }

  private startGame(): void {
    if (this.shopMode) return;
    const ch = this.availableChars[this.selectedChar];
    this.scene.start('GameScene', { character: ch });
  }

  private toggleShop(): void {
    if (this.shopMode) {
      this.shopElements.forEach(e => e.destroy());
      this.shopElements = [];
      this.shopMode = false;
      return;
    }
    this.shopMode = true;
    const cam = this.cameras.main;

    const overlay = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.85).setDepth(50);
    this.shopElements.push(overlay);

    this.shopElements.push(this.add.text(cam.width / 2, 40, 'PERMANENT UPGRADES', {
      ...TEXT_STYLES.heading, fontSize: '20px',
    }).setDepth(51).setOrigin(0.5));

    this.shopElements.push(this.add.text(cam.width / 2, 65, `Gold: ${getGold()}`, {
      ...TEXT_STYLES.hudLabel, color: '#ffdd44',
    }).setDepth(51).setOrigin(0.5));

    META_UPGRADES.forEach((upgrade, i) => {
      const y = 100 + i * 65;
      const currentLevel = getUpgradeLevel(upgrade.id);
      const maxed = currentLevel >= upgrade.maxLevel;
      const cost = maxed ? 0 : upgrade.costPerLevel[currentLevel];

      const row = this.add.container(cam.width / 2, y).setDepth(52);
      const bg = this.add.rectangle(0, 0, 500, 50, 0x222244, 0.9);
      const icon = this.add.text(-220, 0, `${upgrade.icon} ${upgrade.name}`, {
        ...TEXT_STYLES.body, fontSize: '13px',
      }).setOrigin(0, 0.5);

      const levelStr = '\u25A0'.repeat(currentLevel) + '\u25A1'.repeat(upgrade.maxLevel - currentLevel);
      const levelText = this.add.text(0, 0, levelStr, {
        fontSize: '13px', fontFamily: 'monospace', color: '#44ddff',
      }).setOrigin(0.5);

      const costStr = maxed ? 'MAXED' : `${cost}g`;
      const costColor = maxed ? '#44ff44' : (getGold() >= cost ? '#ffdd44' : '#ff4444');
      const costText = this.add.text(180, 0, costStr, {
        fontSize: '13px', fontFamily: 'monospace', color: costColor,
      }).setOrigin(0.5);

      row.add([bg, icon, levelText, costText]);
      row.setSize(500, 50);

      if (!maxed && getGold() >= cost) {
        row.setInteractive({ useHandCursor: true });
        row.on('pointerover', () => bg.setFillStyle(0x333366));
        row.on('pointerout', () => bg.setFillStyle(0x222244));
        row.on('pointerdown', () => {
          setGold(getGold() - cost);
          setUpgradeLevel(upgrade.id, currentLevel + 1);
          soundEngine.goldPickup();
          this.toggleShop();
          this.toggleShop();
        });
      }
      this.shopElements.push(row);
    });

    this.shopElements.push(this.add.text(cam.width / 2, cam.height - 35, 'Press U or ENTER to close', {
      ...TEXT_STYLES.caption, color: '#555555',
    }).setDepth(51).setOrigin(0.5));
  }
}
