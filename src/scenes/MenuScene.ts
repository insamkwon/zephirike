import Phaser from 'phaser';
import { STARTING_WEAPONS, WEAPONS } from '../config/weaponConfig';

export class MenuScene extends Phaser.Scene {
  private selectedWeapon: number = 0;
  private weaponCards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const cx = this.cameras.main.width / 2;

    // Background
    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Title
    this.add.text(cx, 80, 'ZEPHIRIKE', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#ff4444',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, 125, 'Vampire Survivors', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#888888',
    }).setOrigin(0.5);

    // Weapon selection
    this.add.text(cx, 180, 'Choose Starting Weapon', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffdd44',
    }).setOrigin(0.5);

    // Display weapon options
    const startX = cx - (STARTING_WEAPONS.length - 1) * 100;
    for (let i = 0; i < STARTING_WEAPONS.length; i++) {
      const wid = STARTING_WEAPONS[i];
      const def = WEAPONS[wid];
      const wx = startX + i * 200;
      const wy = 280;

      const container = this.add.container(wx, wy);

      const bg = this.add.rectangle(0, 0, 150, 120, 0x222244, 0.8);
      bg.setStrokeStyle(2, i === 0 ? 0xffdd44 : 0x444466);

      const icon = this.add.text(0, -30, def.icon, {
        fontSize: '32px',
      }).setOrigin(0.5);

      const name = this.add.text(0, 10, def.name, {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#ffffff',
      }).setOrigin(0.5);

      const desc = this.add.text(0, 35, def.levels[0].description, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#aaaaaa',
        wordWrap: { width: 130 },
        align: 'center',
      }).setOrigin(0.5);

      container.add([bg, icon, name, desc]);
      container.setSize(150, 120);
      container.setInteractive();

      container.on('pointerover', () => {
        this.selectWeapon(i);
      });

      container.on('pointerdown', () => {
        this.startGame();
      });

      this.weaponCards.push(container);
    }

    // Keyboard nav
    this.input.keyboard!.on('keydown-LEFT', () => {
      this.selectWeapon(Math.max(0, this.selectedWeapon - 1));
    });
    this.input.keyboard!.on('keydown-RIGHT', () => {
      this.selectWeapon(Math.min(STARTING_WEAPONS.length - 1, this.selectedWeapon + 1));
    });
    this.input.keyboard!.on('keydown-A', () => {
      this.selectWeapon(Math.max(0, this.selectedWeapon - 1));
    });
    this.input.keyboard!.on('keydown-D', () => {
      this.selectWeapon(Math.min(STARTING_WEAPONS.length - 1, this.selectedWeapon + 1));
    });
    this.input.keyboard!.on('keydown-ENTER', () => {
      this.startGame();
    });
    this.input.keyboard!.on('keydown-SPACE', () => {
      this.startGame();
    });

    // Controls info
    this.add.text(cx, 420, 'WASD / Arrow Keys to move', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#666666',
    }).setOrigin(0.5);

    this.add.text(cx, 445, 'Weapons fire automatically!', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#666666',
    }).setOrigin(0.5);

    this.add.text(cx, 490, 'Press ENTER or Click to Start', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#44ff44',
    }).setOrigin(0.5);

    // High score
    const bestTime = localStorage.getItem('zephirike_best_time');
    const bestKills = localStorage.getItem('zephirike_best_kills');
    if (bestTime) {
      this.add.text(cx, 540, `Best: ${bestTime} | Kills: ${bestKills ?? '0'}`, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#888888',
      }).setOrigin(0.5);
    }
  }

  private selectWeapon(index: number): void {
    this.selectedWeapon = index;
    this.weaponCards.forEach((card, i) => {
      const bg = card.getAt(0) as Phaser.GameObjects.Rectangle;
      bg.setStrokeStyle(2, i === index ? 0xffdd44 : 0x444466);
    });
  }

  private startGame(): void {
    this.scene.start('GameScene', {
      startingWeapon: STARTING_WEAPONS[this.selectedWeapon],
    });
  }
}
