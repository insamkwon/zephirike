import Phaser from 'phaser';
import { Weapon, WeaponRarity } from '../types/WeaponTypes';

/**
 * Visual representation of a weapon card for the selection UI
 * Displays weapon information in an attractive card format
 */
export class WeaponCard extends Phaser.GameObjects.Container {
  private background!: Phaser.GameObjects.Graphics;
  private icon!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private typeText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private descriptionText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private rarityBorder!: Phaser.GameObjects.Graphics;
  private hoverTween?: Phaser.Tweens.Tween;

  private weapon: Weapon;
  private isHovered: boolean = false;
  private isSelected: boolean = false;

  // Card dimensions
  private static readonly CARD_WIDTH = 280;
  private static readonly CARD_HEIGHT = 380;
  private static readonly CARD_PADDING = 15;

  // Rarity colors
  private static readonly RARITY_COLORS: Record<WeaponRarity, number> = {
    [WeaponRarity.COMMON]: 0x808080,
    [WeaponRarity.UNCOMMON]: 0x00ff00,
    [WeaponRarity.RARE]: 0x0080ff,
    [WeaponRarity.EPIC]: 0x800080,
    [WeaponRarity.LEGENDARY]: 0xffd700
  };

  constructor(scene: Phaser.Scene, x: number, y: number, weapon: Weapon) {
    super(scene, x, y);

    this.weapon = weapon;

    // Create card elements
    this.createBackground();
    this.createRarityBorder();
    this.createIcon();
    this.createTextElements();

    // Set interactive
    this.setSize(WeaponCard.CARD_WIDTH, WeaponCard.CARD_HEIGHT);
    this.setInteractive();

    // Setup hover events
    this.setupInteractions();

    // Add to scene
    scene.add.existing(this);
  }

  private createBackground(): void {
    this.background = this.scene.add.graphics();

    // Draw card background with dark semi-transparent fill
    this.background.fillStyle(0x1a1a2e, 0.95);
    this.background.fillRoundedRect(
      -WeaponCard.CARD_WIDTH / 2,
      -WeaponCard.CARD_HEIGHT / 2,
      WeaponCard.CARD_WIDTH,
      WeaponCard.CARD_HEIGHT,
      10
    );

    // Add inner border
    this.background.lineStyle(2, 0x4a4a6a, 0.8);
    this.background.strokeRoundedRect(
      -WeaponCard.CARD_WIDTH / 2 + 2,
      -WeaponCard.CARD_HEIGHT / 2 + 2,
      WeaponCard.CARD_WIDTH - 4,
      WeaponCard.CARD_HEIGHT - 4,
      8
    );

    this.add(this.background);
  }

  private createRarityBorder(): void {
    this.rarityBorder = this.scene.add.graphics();

    const rarityColor = WeaponCard.RARITY_COLORS[this.weapon.rarity];
    this.rarityBorder.lineStyle(4, rarityColor, 1);
    this.rarityBorder.strokeRoundedRect(
      -WeaponCard.CARD_WIDTH / 2,
      -WeaponCard.CARD_HEIGHT / 2,
      WeaponCard.CARD_WIDTH,
      WeaponCard.CARD_HEIGHT,
      10
    );

    this.add(this.rarityBorder);
  }

  private createIcon(): void {
    this.icon = this.scene.add.graphics();

    const iconSize = 80;
    const iconX = 0;
    const iconY = -WeaponCard.CARD_HEIGHT / 2 + WeaponCard.CARD_PADDING + iconSize / 2;

    // Draw weapon icon based on type
    this.drawWeaponIcon(iconX, iconY, iconSize);

    // Add glow effect
    const rarityColor = WeaponCard.RARITY_COLORS[this.weapon.rarity];
    this.icon.lineStyle(3, rarityColor, 0.6);
    this.icon.strokeCircle(iconX, iconY, iconSize / 2 + 5);

    this.add(this.icon);
  }

  private drawWeaponIcon(x: number, y: number, size: number): void {
    const color = this.getWeaponColor();

    this.icon.fillStyle(color, 1);

    // Draw different icon shapes based on weapon type
    switch (this.weapon.type) {
      case 'PROJECTILE':
        // Draw blaster/cannon shape
        this.icon.fillRect(x - size / 4, y - size / 6, size / 2, size / 3);
        this.icon.fillRect(x - size / 8, y - size / 3, size / 4, size / 6);
        this.icon.fillRect(x + size / 8, y + size / 6, size / 8, size / 6);
        break;

      case 'MELEE':
        // Draw sword shape
        this.icon.fillRect(x - size / 8, y - size / 3, size / 4, size / 1.5);
        this.icon.fillRect(x - size / 4, y - size / 8, size / 2, size / 8);
        break;

      case 'AREA':
        // Draw explosion/circle shape
        this.icon.fillCircle(x, y, size / 3);
        this.icon.lineStyle(3, color, 0.8);
        this.icon.strokeCircle(x, y, size / 2.5);
        break;

      case 'ORBITAL':
        // Draw orbital ring shape
        this.icon.lineStyle(4, color, 1);
        this.icon.strokeCircle(x, y, size / 3);
        this.icon.fillCircle(x, y, size / 8);
        break;

      default:
        // Default generic icon
        this.icon.fillCircle(x, y, size / 3);
    }
  }

  private getWeaponColor(): number {
    switch (this.weapon.damageType) {
      case 'PHYSICAL': return 0xffaa00;
      case 'MAGICAL': return 0x00ffff;
      case 'FIRE': return 0xff4400;
      case 'ICE': return 0x00ccff;
      case 'LIGHTNING': return 0xffff00;
      case 'POISON': return 0x00ff00;
      default: return 0xffffff;
    }
  }

  private createTextElements(): void {
    const startY = -WeaponCard.CARD_HEIGHT / 2 + WeaponCard.CARD_PADDING + 80 + 15;
    let currentY = startY;

    // Weapon name and level
    this.titleText = this.scene.add.text(
      -WeaponCard.CARD_WIDTH / 2 + WeaponCard.CARD_PADDING,
      currentY,
      `${this.weapon.name} (Lv.${this.weapon.level})`,
      {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'left',
        wordWrap: { width: WeaponCard.CARD_WIDTH - WeaponCard.CARD_PADDING * 2 }
      }
    );
    this.titleText.setOrigin(0, 0);
    this.add(this.titleText);

    currentY += 30;

    // Weapon type
    this.typeText = this.scene.add.text(
      -WeaponCard.CARD_WIDTH / 2 + WeaponCard.CARD_PADDING,
      currentY,
      `${this.weapon.type} - ${this.weapon.rarity}`,
      {
        fontSize: '14px',
        color: '#aaaaaa',
        fontFamily: 'Courier New',
        fontStyle: 'italic',
        align: 'left'
      }
    );
    this.typeText.setOrigin(0, 0);
    this.add(this.typeText);

    currentY += 30;

    // Stats
    const statsText = this.formatStats();
    this.statsText = this.scene.add.text(
      -WeaponCard.CARD_WIDTH / 2 + WeaponCard.CARD_PADDING,
      currentY,
      statsText,
      {
        fontSize: '14px',
        color: '#00ff00',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'left',
        lineSpacing: 5
      }
    );
    this.statsText.setOrigin(0, 0);
    this.add(this.statsText);

    currentY += 70;

    // Description
    this.descriptionText = this.scene.add.text(
      -WeaponCard.CARD_WIDTH / 2 + WeaponCard.CARD_PADDING,
      currentY,
      this.weapon.description,
      {
        fontSize: '12px',
        color: '#cccccc',
        fontFamily: 'Courier New',
        align: 'left',
        wordWrap: { width: WeaponCard.CARD_WIDTH - WeaponCard.CARD_PADDING * 2 },
        lineSpacing: 4
      }
    );
    this.descriptionText.setOrigin(0, 0);
    this.add(this.descriptionText);

    currentY += 60;

    // Level progress
    const progressText = `Level: ${this.weapon.level}/${this.weapon.maxLevel}`;
    this.levelText = this.scene.add.text(
      -WeaponCard.CARD_WIDTH / 2 + WeaponCard.CARD_PADDING,
      currentY,
      progressText,
      {
        fontSize: '13px',
        color: '#ffaa00',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'left'
      }
    );
    this.levelText.setOrigin(0, 0);
    this.add(this.levelText);
  }

  private formatStats(): string {
    const stats = [
      `Damage: ${this.weapon.damage}`,
      `Fire Rate: ${this.weapon.fireRate}/s`,
      `Range: ${this.weapon.range}`
    ];

    if (this.weapon.projectileSpeed) {
      stats.push(`Speed: ${this.weapon.projectileSpeed}`);
    }

    if (this.weapon.area) {
      stats.push(`Area: ${this.weapon.area}`);
    }

    return stats.join('\n');
  }

  private setupInteractions(): void {
    this.on('pointerover', () => {
      this.onHover();
    });

    this.on('pointerout', () => {
      this.onHoverOut();
    });

    this.on('pointerdown', () => {
      this.onClick();
    });
  }

  private onHover(): void {
    if (this.isHovered) return;
    this.isHovered = true;

    // Scale up animation
    if (this.hoverTween) {
      this.hoverTween.destroy();
    }

    this.hoverTween = this.scene.tweens.add({
      targets: this,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 150,
      ease: 'Power2'
    });

    // Add glow effect
    this.background.lineStyle(3, 0xffffff, 0.5);
    this.background.strokeRoundedRect(
      -WeaponCard.CARD_WIDTH / 2,
      -WeaponCard.CARD_HEIGHT / 2,
      WeaponCard.CARD_WIDTH,
      WeaponCard.CARD_HEIGHT,
      10
    );
  }

  private onHoverOut(): void {
    if (!this.isHovered) return;
    this.isHovered = false;

    // Scale down animation
    if (this.hoverTween) {
      this.hoverTween.destroy();
    }

    this.hoverTween = this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: 'Power2'
    });

    // Remove glow effect
    this.background.lineStyle(2, 0x4a4a6a, 0.8);
    this.background.strokeRoundedRect(
      -WeaponCard.CARD_WIDTH / 2 + 2,
      -WeaponCard.CARD_HEIGHT / 2 + 2,
      WeaponCard.CARD_WIDTH - 4,
      WeaponCard.CARD_HEIGHT - 4,
      8
    );
  }

  private onClick(): void {
    this.isSelected = !this.isSelected;

    if (this.isSelected) {
      // Add selection highlight
      this.background.lineStyle(4, 0x00ff00, 1);
      this.background.strokeRoundedRect(
        -WeaponCard.CARD_WIDTH / 2,
        -WeaponCard.CARD_HEIGHT / 2,
        WeaponCard.CARD_WIDTH,
        WeaponCard.CARD_HEIGHT,
        10
      );
    } else {
      // Remove selection highlight
      this.background.lineStyle(2, 0x4a4a6a, 0.8);
      this.background.strokeRoundedRect(
        -WeaponCard.CARD_WIDTH / 2 + 2,
        -WeaponCard.CARD_HEIGHT / 2 + 2,
        WeaponCard.CARD_WIDTH - 4,
        WeaponCard.CARD_HEIGHT - 4,
        8
      );
    }

    // Emit selection event
    this.emit('weaponSelected', this.weapon, this.isSelected);
  }

  /**
   * Reset the card to unselected state
   */
  public deselect(): void {
    if (this.isSelected) {
      this.isSelected = false;
      this.background.lineStyle(2, 0x4a4a6a, 0.8);
      this.background.strokeRoundedRect(
        -WeaponCard.CARD_WIDTH / 2 + 2,
        -WeaponCard.CARD_HEIGHT / 2 + 2,
        WeaponCard.CARD_WIDTH - 4,
        WeaponCard.CARD_HEIGHT - 4,
        8
      );
    }
  }

  /**
   * Get the weapon associated with this card
   */
  public getWeapon(): Weapon {
    return this.weapon;
  }

  /**
   * Check if the card is selected
   */
  public isCardSelected(): boolean {
    return this.isSelected;
  }

  /**
   * Safely destroy the card and its resources
   * Override to handle scene shutdown where input may be null
   */
  public destroy(): void {
    // Stop any hover tweens
    if (this.hoverTween) {
      this.hoverTween.destroy();
      this.hoverTween = undefined;
    }

    // Remove all event listeners
    this.removeAllListeners();

    // Call parent destroy
    super.destroy();
  }
}
