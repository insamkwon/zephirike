import Phaser from 'phaser';
import { WeaponUpgrade } from '../types/GameTypes';
import { getRarityColor, getRarityColorString } from '../data/Weapons';

/**
 * LevelUpScene - Displayed when player levels up
 * Shows weapon upgrade options and handles selection
 */
export class LevelUpScene extends Phaser.Scene {
  private upgrades: WeaponUpgrade[] = [];
  private selectedUpgradeIndex: number = 0;
  private upgradeCards: Phaser.GameObjects.Container[] = [];
  private background!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  // Cursor key for navigation (managed by Phaser event system)

  constructor() {
    super({ key: 'LevelUpScene' });
  }

  init(data: { upgrades: WeaponUpgrade[] }): void {
    this.upgrades = data.upgrades || [];
    this.selectedUpgradeIndex = 0;
  }

  create(): void {
    // Don't pause the game scene - let it handle pausing via isGameActive flag
    // This ensures input and physics continue working correctly

    // Create semi-transparent background overlay
    this.background = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.8
    );
    this.background.setScrollFactor(0);
    this.background.setDepth(100);

    // Title
    this.titleText = this.add.text(
      this.cameras.main.width / 2,
      100,
      '레벨 업!',
      {
        fontSize: '64px',
        color: '#ffff00',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 8
      }
    );
    this.titleText.setOrigin(0.5);
    this.titleText.setScrollFactor(0);
    this.titleText.setDepth(101);

    // Instructions
    this.instructionText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - 80,
      '← → 키 또는 마우스로 선택 • 스페이스바 또는 클릭으로 선택',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center'
      }
    );
    this.instructionText.setOrigin(0.5);
    this.instructionText.setScrollFactor(0);
    this.instructionText.setDepth(101);

    // Setup keyboard controls
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    const spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const escapeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Keyboard navigation
    this.input.keyboard!.on('keydown-' + 'LEFT', () => this.navigateSelection(-1));
    this.input.keyboard!.on('keydown-' + 'RIGHT', () => this.navigateSelection(1));
    spaceKey.on('down', () => this.selectUpgrade());
    escapeKey.on('down', () => this.selectUpgrade()); // ESC also selects (for convenience)

    // Create upgrade cards
    this.createUpgradeCards();

    // Mouse interaction
    this.setupMouseInteraction();

    // Animate entrance
    this.animateEntrance();
  }

  private createUpgradeCards(): void {
    const cardWidth = 250;
    const spacing = 20;
    const totalWidth = (this.upgrades.length * cardWidth) + ((this.upgrades.length - 1) * spacing);
    const startX = (this.cameras.main.width - totalWidth) / 2 + cardWidth / 2;

    this.upgrades.forEach((upgrade, index) => {
      const x = startX + index * (cardWidth + spacing);
      const y = this.cameras.main.height / 2;

      const card = this.createUpgradeCard(upgrade, x, y, index);
      this.upgradeCards.push(card);
    });

    // Update selection highlight
    this.updateSelectionHighlight();
  }

  private createUpgradeCard(upgrade: WeaponUpgrade, x: number, y: number, index: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const cardWidth = 250;
    const cardHeight = 300;

    // Card background
    const background = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x1a1a2e);
    background.setStrokeStyle(3, getRarityColor(upgrade.rarity));
    background.setInteractive({ useHandCursor: true });

    // Rarity indicator
    const rarityText = this.add.text(
      -cardWidth / 2 + 10,
      -cardHeight / 2 + 15,
      upgrade.rarity.toUpperCase(),
      {
        fontSize: '14px',
        color: getRarityColorString(upgrade.rarity),
        fontFamily: 'Courier New',
        fontStyle: 'bold'
      }
    );

    // Weapon type icon/text
    const typeText = this.add.text(
      0,
      -cardHeight / 2 + 15,
      upgrade.type === 'projectile' ? '🎯 원거리' : '⚔️ 근거리',
      {
        fontSize: '14px',
        color: '#888888',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
      }
    );
    typeText.setOrigin(0.5);

    // Upgrade name
    const nameText = this.add.text(
      0,
      -cardHeight / 2 + 60,
      upgrade.name,
      {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: cardWidth - 20 }
      }
    );
    nameText.setOrigin(0.5);

    // Description
    const descriptionText = this.add.text(
      0,
      -cardHeight / 2 + 110,
      upgrade.description,
      {
        fontSize: '18px',
        color: '#00ff00',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: cardWidth - 20 }
      }
    );
    descriptionText.setOrigin(0.5);

    // Highlight border (initially hidden)
    const highlight = this.add.rectangle(x, y, cardWidth + 10, cardHeight + 10, 0xffff00, 0);
    highlight.setDepth(100);

    // Store reference to highlight (not added to container to avoid getData issues)
    container.setData('highlight', highlight);
    container.setData('background', background);
    container.setData('upgradeIndex', index);

    // Add all elements except highlight to container
    container.add([background, rarityText, typeText, nameText, descriptionText]);
    container.setDepth(101);

    // Card hover effect
    background.on('pointerover', () => {
      this.selectedUpgradeIndex = index;
      this.updateSelectionHighlight();
    });

    // Card click to select
    background.on('pointerdown', () => {
      this.selectedUpgradeIndex = index;
      this.selectUpgrade();
    });

    return container;
  }

  private setupMouseInteraction(): void {
    // Mouse click to select
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Check if click is on a card
      const clickedCard = this.upgradeCards.find(card => {
        const background = card.getData('background') as Phaser.GameObjects.Rectangle;
        if (!background) return false;
        const bounds = background.getBounds();
        return bounds.contains(pointer.x, pointer.y);
      });

      if (clickedCard) {
        const index = clickedCard.getData('upgradeIndex');
        this.selectedUpgradeIndex = index;
        this.updateSelectionHighlight();
      }
    });

    // Mouse wheel navigation
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any, _deltaX: number, deltaY: number, _deltaZ: number) => {
      const direction = deltaY > 0 ? 1 : -1;
      this.navigateSelection(direction);
    });
  }

  private navigateSelection(direction: number): void {
    this.selectedUpgradeIndex += direction;

    // Wrap around
    if (this.selectedUpgradeIndex < 0) {
      this.selectedUpgradeIndex = this.upgrades.length - 1;
    } else if (this.selectedUpgradeIndex >= this.upgrades.length) {
      this.selectedUpgradeIndex = 0;
    }

    this.updateSelectionHighlight();
  }

  private updateSelectionHighlight(): void {
    this.upgradeCards.forEach((card, index) => {
      const highlight = card.getData('highlight') as Phaser.GameObjects.Rectangle;
      const background = card.getData('background') as Phaser.GameObjects.Rectangle;

      // Safety check
      if (!highlight || !background || !this.upgrades[index]) return;

      if (index === this.selectedUpgradeIndex) {
        highlight.setAlpha(0.3);
        background.setStrokeStyle(5, 0xffff00);

        // Scale up selected card
        this.tweens.add({
          targets: card,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 150,
          ease: 'Power2'
        });
      } else {
        highlight.setAlpha(0);
        background.setStrokeStyle(3, getRarityColor(this.upgrades[index].rarity));

        // Scale down non-selected cards
        this.tweens.add({
          targets: card,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
          ease: 'Power2'
        });
      }
    });
  }

  private selectUpgrade(): void {
    const selectedUpgrade = this.upgrades[this.selectedUpgradeIndex];

    // Emit event to GameScene with selected upgrade
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.emit('upgrade-selected', selectedUpgrade);
    }

    // Exit animation
    this.animateExit(() => {
      this.scene.stop('LevelUpScene');
      // Emit event to resume game
      if (gameScene) {
        gameScene.events.emit('levelup-complete');
      }
    });
  }

  private animateEntrance(): void {
    // Fade in background
    this.background.setAlpha(0);
    this.tweens.add({
      targets: this.background,
      alpha: 0.8,
      duration: 300,
      ease: 'Power2'
    });

    // Slide in title
    this.titleText.setY(this.titleText.y - 100);
    this.tweens.add({
      targets: this.titleText,
      y: 100,
      duration: 400,
      ease: 'Back.out'
    });

    // Scale in cards
    this.upgradeCards.forEach((card, index) => {
      card.setScale(0);
      this.tweens.add({
        targets: card,
        scaleX: 1,
        scaleY: 1,
        duration: 300,
        delay: index * 100,
        ease: 'Back.out'
      });
    });

    // Fade in instruction
    this.instructionText.setAlpha(0);
    this.tweens.add({
      targets: this.instructionText,
      alpha: 1,
      duration: 300,
      delay: 400
    });
  }

  private animateExit(callback: () => void): void {
    // Fade out everything
    this.tweens.add({
      targets: [this.background, this.titleText, this.instructionText, ...this.upgradeCards],
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: callback
    });
  }

  update(): void {
    // Mouse wheel navigation is handled via event listener in create()
  }
}
