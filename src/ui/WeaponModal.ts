import Phaser from 'phaser';
import { Weapon, WeaponOption } from '../types/WeaponTypes';
import { WeaponCard } from './WeaponCard';

/**
 * Modal/overlay component for weapon selection
 * Displays weapon cards in a grid layout for player to choose from
 */
export class WeaponModal extends Phaser.GameObjects.Container {
  private background!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private weaponCards: WeaponCard[] = [];
  private closeShortcutText!: Phaser.GameObjects.Text;

  private onWeaponSelectCallback?: (weapon: Weapon) => void;
  private onCloseCallback?: () => void;

  private isVisible: boolean = false;
  private isTransitioning: boolean = false;

  // Modal dimensions
  private static readonly MODAL_WIDTH = 900;
  private static readonly MODAL_HEIGHT = 600;
  private static readonly CARD_SPACING = 20;
  private static readonly CARDS_PER_ROW = 3;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // Create modal elements
    this.createBackground();
    this.createTextElements();

    // Set depth to appear above everything
    this.setDepth(1000);

    // Initially hidden
    this.setVisible(false);
    this.alpha = 0;

    // Add to scene
    scene.add.existing(this);

    // Center the modal
    this.positionModal();
  }

  private createBackground(): void {
    this.background = this.scene.add.graphics();

    // Semi-transparent dark overlay
    this.background.fillStyle(0x000000, 0.85);
    this.background.fillRect(
      -this.scene.cameras.main.width / 2,
      -this.scene.cameras.main.height / 2,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height
    );

    // Modal container background
    this.background.fillStyle(0x1a1a2e, 0.95);
    this.background.fillRoundedRect(
      -WeaponModal.MODAL_WIDTH / 2,
      -WeaponModal.MODAL_HEIGHT / 2,
      WeaponModal.MODAL_WIDTH,
      WeaponModal.MODAL_HEIGHT,
      15
    );

    // Modal border
    this.background.lineStyle(3, 0x4a4a6a, 1);
    this.background.strokeRoundedRect(
      -WeaponModal.MODAL_WIDTH / 2,
      -WeaponModal.MODAL_HEIGHT / 2,
      WeaponModal.MODAL_WIDTH,
      WeaponModal.MODAL_HEIGHT,
      15
    );

    // Add inner glow effect
    this.background.lineStyle(2, 0x6a6a8a, 0.5);
    this.background.strokeRoundedRect(
      -WeaponModal.MODAL_WIDTH / 2 + 5,
      -WeaponModal.MODAL_HEIGHT / 2 + 5,
      WeaponModal.MODAL_WIDTH - 10,
      WeaponModal.MODAL_HEIGHT - 10,
      12
    );

    this.add(this.background);
  }

  private createTextElements(): void {
    // Title
    this.titleText = this.scene.add.text(
      0,
      -WeaponModal.MODAL_HEIGHT / 2 + 40,
      'WEAPON SELECTION',
      {
        fontSize: '36px',
        color: '#ffd700',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 6
      }
    );
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);

    // Instruction text
    this.instructionText = this.scene.add.text(
      0,
      -WeaponModal.MODAL_HEIGHT / 2 + 90,
      'Choose a weapon to add to your arsenal',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Courier New',
        fontStyle: 'italic',
        align: 'center'
      }
    );
    this.instructionText.setOrigin(0.5);
    this.add(this.instructionText);

    // Close shortcut text
    this.closeShortcutText = this.scene.add.text(
      0,
      WeaponModal.MODAL_HEIGHT / 2 - 30,
      'Press ESC or click outside to close',
      {
        fontSize: '16px',
        color: '#aaaaaa',
        fontFamily: 'Courier New',
        fontStyle: 'italic',
        align: 'center'
      }
    );
    this.closeShortcutText.setOrigin(0.5);
    this.add(this.closeShortcutText);

    // Make modal dismissible by clicking outside
    this.setSize(
      this.scene.cameras.main.width,
      this.scene.cameras.main.height
    );
    this.setInteractive();

    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Check if click is outside the modal area
      const modalLeft = -WeaponModal.MODAL_WIDTH / 2;
      const modalRight = WeaponModal.MODAL_WIDTH / 2;
      const modalTop = -WeaponModal.MODAL_HEIGHT / 2;
      const modalBottom = WeaponModal.MODAL_HEIGHT / 2;

      if (pointer.x < modalLeft || pointer.x > modalRight ||
          pointer.y < modalTop || pointer.y > modalBottom) {
        this.close();
      }
    });
  }

  private positionModal(): void {
    // Position the modal at the center of the screen
    this.x = this.scene.cameras.main.width / 2;
    this.y = this.scene.cameras.main.height / 2;
  }

  /**
   * Show the modal with weapon options
   */
  public show(weaponOptions: WeaponOption[]): void {
    if (this.isVisible || this.isTransitioning) return;

    this.isTransitioning = true;
    this.isVisible = true;

    // Clear previous cards
    this.clearWeaponCards();

    // Create new weapon cards
    this.createWeaponCards(weaponOptions);

    // Update instruction text
    if (weaponOptions.length === 1) {
      this.instructionText.setText('Level up! Choose your upgrade:');
    } else {
      this.instructionText.setText('Choose a weapon to add to your arsenal:');
    }

    // Show modal with fade-in animation
    this.setVisible(true);
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.isTransitioning = false;
      }
    });

    // Pause game scene (optional - depends on game design)
    // this.scene.scene.pause();
  }

  /**
   * Close the modal
   */
  public close(): void {
    if (!this.isVisible || this.isTransitioning) return;

    this.isTransitioning = true;

    // Fade out animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.isVisible = false;
        this.setVisible(false);
        this.isTransitioning = false;
        this.clearWeaponCards();

        // Resume game scene
        // this.scene.scene.resume();

        // Call close callback
        if (this.onCloseCallback) {
          this.onCloseCallback();
        }
      }
    });
  }

  /**
   * Create weapon cards and arrange them in a grid
   */
  private createWeaponCards(weaponOptions: WeaponOption[]): void {
    const cardWidth = 280;
    const cardHeight = 380;
    const spacing = WeaponModal.CARD_SPACING;
    const cardsPerRow = WeaponModal.CARDS_PER_ROW;

    // Calculate starting position to center the cards
    const totalWidth = Math.min(weaponOptions.length, cardsPerRow) * cardWidth +
                      (Math.min(weaponOptions.length, cardsPerRow) - 1) * spacing;
    const startX = -totalWidth / 2 + cardWidth / 2;

    // Calculate starting Y position (below title and instructions)
    const startY = -WeaponModal.MODAL_HEIGHT / 2 + 140;

    weaponOptions.forEach((option, index) => {
      const row = Math.floor(index / cardsPerRow);
      const col = index % cardsPerRow;

      const x = startX + col * (cardWidth + spacing);
      const y = startY + row * (cardHeight + spacing);

      const card = new WeaponCard(this.scene, x, y, option.weapon);

      // Card selection handler
      card.on('weaponSelected', (weapon: Weapon, isSelected: boolean) => {
        if (isSelected && this.onWeaponSelectCallback) {
          // Deselect other cards
          this.weaponCards.forEach(c => {
            if (c !== card) {
              c.deselect();
            }
          });

          // Auto-close and select after a short delay
          this.scene.time.delayedCall(200, () => {
            this.onWeaponSelectCallback!(weapon);
            this.close();
          });
        }
      });

      this.weaponCards.push(card);
      this.add(card);
    });
  }

  /**
   * Clear all weapon cards from the modal
   */
  private clearWeaponCards(): void {
    this.weaponCards.forEach(card => {
      card.destroy();
    });
    this.weaponCards = [];
  }

  /**
   * Set callback for when a weapon is selected
   */
  public onWeaponSelect(callback: (weapon: Weapon) => void): void {
    this.onWeaponSelectCallback = callback;
  }

  /**
   * Set callback for when the modal is closed
   */
  public onClose(callback: () => void): void {
    this.onCloseCallback = callback;
  }

  /**
   * Check if the modal is currently visible
   */
  public isModalVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Handle keyboard input
   */
  public handleKeyDown(key: string): void {
    if (!this.isVisible) return;

    if (key === 'ESC' || key === 'Escape') {
      this.close();
    }
  }

  /**
   * Update modal position (useful for window resize)
   */
  public updatePosition(): void {
    this.positionModal();
  }

  /**
   * Safely destroy the modal and its resources
   * Override to handle scene shutdown where input may be null
   */
  public destroy(): void {
    // Stop any ongoing tweens
    if (this.scene && this.scene.tweens) {
      this.scene.tweens.killTweensOf(this);
    }

    // Clear weapon cards first
    this.clearWeaponCards();

    // Remove event listeners
    this.removeAllListeners();

    // Call parent destroy
    super.destroy();
  }
}
