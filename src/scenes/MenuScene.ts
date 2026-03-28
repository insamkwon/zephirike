import Phaser from 'phaser';
import { STARTING_WEAPONS, WEAPONS } from '../config/weaponConfig';
import { META_UPGRADES, getGold, setGold, getUpgradeLevel, setUpgradeLevel } from '../config/metaConfig';
import { soundEngine } from '../systems/SoundEngine';

export class MenuScene extends Phaser.Scene {
  private selectedWeapon = 0;
  private weaponCards: Phaser.GameObjects.Container[] = [];
  private shopMode = false;
  private shopElements: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    soundEngine.init();
    const cx = this.cameras.main.width / 2;
    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Title
    this.add.text(cx, 60, 'ZEPHIRIKE', {
      fontSize: '48px', fontFamily: 'monospace', color: '#ff4444',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, 100, 'Vampire Survivors', {
      fontSize: '16px', fontFamily: 'monospace', color: '#666666',
    }).setOrigin(0.5);

    // Gold display
    this.add.text(cx, 130, `Gold: ${getGold()}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffdd44',
    }).setOrigin(0.5);

    // Weapon selection
    this.add.text(cx, 165, 'Choose Starting Weapon', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffdd44',
    }).setOrigin(0.5);

    const startX = cx - (STARTING_WEAPONS.length - 1) * 100;
    for (let i = 0; i < STARTING_WEAPONS.length; i++) {
      const wid = STARTING_WEAPONS[i];
      const def = WEAPONS[wid];
      const wx = startX + i * 200;

      const container = this.add.container(wx, 250);
      const bg = this.add.rectangle(0, 0, 150, 100, 0x222244, 0.8);
      bg.setStrokeStyle(2, i === 0 ? 0xffdd44 : 0x444466);

      const icon = this.add.text(0, -25, def.icon, { fontSize: '28px' }).setOrigin(0.5);
      const name = this.add.text(0, 5, def.name, {
        fontSize: '13px', fontFamily: 'monospace', color: '#ffffff',
      }).setOrigin(0.5);
      const desc = this.add.text(0, 28, def.levels[0].description, {
        fontSize: '9px', fontFamily: 'monospace', color: '#aaaaaa',
        wordWrap: { width: 130 }, align: 'center',
      }).setOrigin(0.5);

      container.add([bg, icon, name, desc]);
      container.setSize(150, 100).setInteractive();
      container.on('pointerover', () => this.selectWeapon(i));
      container.on('pointerdown', () => this.startGame());
      this.weaponCards.push(container);
    }

    // Buttons
    this.createButton(cx - 100, 380, 'START', '#44ff44', () => this.startGame());
    this.createButton(cx + 100, 380, 'UPGRADES', '#44ddff', () => this.toggleShop());

    // Controls
    this.add.text(cx, 430, 'WASD/Arrows: Move | Weapons auto-fire | M: Mute', {
      fontSize: '11px', fontFamily: 'monospace', color: '#555555',
    }).setOrigin(0.5);

    // High score
    const bestTime = localStorage.getItem('zephirike_best_time');
    const bestKills = localStorage.getItem('zephirike_best_kills');
    if (bestTime) {
      this.add.text(cx, 460, `Best: ${bestTime} | Kills: ${bestKills ?? '0'}`, {
        fontSize: '11px', fontFamily: 'monospace', color: '#555555',
      }).setOrigin(0.5);
    }

    // Keyboard nav
    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT', () => this.selectWeapon(Math.max(0, this.selectedWeapon - 1)));
    kb.on('keydown-RIGHT', () => this.selectWeapon(Math.min(STARTING_WEAPONS.length - 1, this.selectedWeapon + 1)));
    kb.on('keydown-A', () => this.selectWeapon(Math.max(0, this.selectedWeapon - 1)));
    kb.on('keydown-D', () => this.selectWeapon(Math.min(STARTING_WEAPONS.length - 1, this.selectedWeapon + 1)));
    kb.on('keydown-ENTER', () => {
      if (this.shopMode) this.toggleShop();
      else this.startGame();
    });
    kb.on('keydown-SPACE', () => this.startGame());
    kb.on('keydown-U', () => this.toggleShop());
  }

  private createButton(x: number, y: number, label: string, color: string, onClick: () => void): void {
    const btn = this.add.text(x, y, `[ ${label} ]`, {
      fontSize: '16px', fontFamily: 'monospace', color,
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setScale(1.1));
    btn.on('pointerout', () => btn.setScale(1));
    btn.on('pointerdown', onClick);
  }

  private selectWeapon(index: number): void {
    this.selectedWeapon = index;
    this.weaponCards.forEach((card, i) => {
      const bg = card.getAt(0) as Phaser.GameObjects.Rectangle;
      bg.setStrokeStyle(2, i === index ? 0xffdd44 : 0x444466);
    });
  }

  private startGame(): void {
    if (this.shopMode) return;
    this.scene.start('GameScene', {
      startingWeapon: STARTING_WEAPONS[this.selectedWeapon],
    });
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

    const overlay = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.85)
      .setDepth(50);
    this.shopElements.push(overlay);

    const title = this.add.text(cam.width / 2, 40, 'PERMANENT UPGRADES', {
      fontSize: '22px', fontFamily: 'monospace', color: '#ffdd44',
      stroke: '#000', strokeThickness: 3,
    }).setDepth(51).setOrigin(0.5);
    this.shopElements.push(title);

    const goldLabel = this.add.text(cam.width / 2, 70, `Gold: ${getGold()}`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffdd44',
    }).setDepth(51).setOrigin(0.5);
    this.shopElements.push(goldLabel);

    META_UPGRADES.forEach((upgrade, i) => {
      const y = 110 + i * 70;
      const currentLevel = getUpgradeLevel(upgrade.id);
      const maxed = currentLevel >= upgrade.maxLevel;
      const cost = maxed ? 0 : upgrade.costPerLevel[currentLevel];

      const row = this.add.container(cam.width / 2, y).setDepth(52);

      const bg = this.add.rectangle(0, 0, 500, 55, 0x222244, 0.9);
      const icon = this.add.text(-220, 0, `${upgrade.icon} ${upgrade.name}`, {
        fontSize: '14px', fontFamily: 'monospace', color: '#ffffff',
      }).setOrigin(0, 0.5);

      const levelStr = `${'■'.repeat(currentLevel)}${'□'.repeat(upgrade.maxLevel - currentLevel)}`;
      const levelText = this.add.text(0, 0, levelStr, {
        fontSize: '14px', fontFamily: 'monospace', color: '#44ddff',
      }).setOrigin(0.5);

      const costStr = maxed ? 'MAXED' : `${cost}g`;
      const costColor = maxed ? '#44ff44' : (getGold() >= cost ? '#ffdd44' : '#ff4444');
      const costText = this.add.text(180, 0, costStr, {
        fontSize: '14px', fontFamily: 'monospace', color: costColor,
      }).setOrigin(0.5);

      row.add([bg, icon, levelText, costText]);
      row.setSize(500, 55);

      if (!maxed && getGold() >= cost) {
        row.setInteractive({ useHandCursor: true });
        row.on('pointerover', () => bg.setFillStyle(0x333366));
        row.on('pointerout', () => bg.setFillStyle(0x222244));
        row.on('pointerdown', () => {
          setGold(getGold() - cost);
          setUpgradeLevel(upgrade.id, currentLevel + 1);
          soundEngine.goldPickup();
          // Refresh shop
          this.toggleShop();
          this.toggleShop();
        });
      }

      this.shopElements.push(row);
    });

    const closeHint = this.add.text(cam.width / 2, cam.height - 40, 'Press U or ENTER to close', {
      fontSize: '12px', fontFamily: 'monospace', color: '#666666',
    }).setDepth(51).setOrigin(0.5);
    this.shopElements.push(closeHint);
  }
}
