import Phaser from 'phaser';
import { META_UPGRADES, getUpgradeCost } from '../data/MetaUpgrades';
import { MetaProgressionManager } from '../systems/MetaProgressionManager';
import { MetaUpgradeDefinition } from '../types/GameTypes';

export class UpgradePopup {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;
  private goldText: Phaser.GameObjects.Text | null = null;
  private cardContainers: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(): void {
    const { width, height } = this.scene.cameras.main;

    const panelWidth = 520;
    const panelHeight = 480;

    // Overlay
    const overlay = this.scene.add.graphics();
    overlay.setPosition(-width / 2, -height / 2);
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(200);

    // Click zone to dismiss
    const overlayZone = this.scene.add.zone(0, 0, width, height);
    overlayZone.setDepth(201);
    overlayZone.setInteractive({ useHandCursor: false })
      .on('pointerdown', () => this.hide());

    // Panel background
    const panelBg = this.scene.add.graphics();

    // Shadow
    panelBg.fillStyle(0x000000, 0.5);
    panelBg.fillRoundedRect(-panelWidth / 2 + 6, -panelHeight / 2 + 6, panelWidth, panelHeight, 16);

    // Main bg
    panelBg.fillStyle(0x111827, 0.98);
    panelBg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);

    // Border
    panelBg.lineStyle(2, 0x4ade80, 0.6);
    panelBg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);

    // Inner border
    panelBg.lineStyle(1, 0x374151, 0.4);
    panelBg.strokeRoundedRect(-panelWidth / 2 + 4, -panelHeight / 2 + 4, panelWidth - 8, panelHeight - 8, 12);

    // Top accent bar - gradient green
    panelBg.fillStyle(0x4ade80, 0.8);
    panelBg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, 4, { tl: 16, tr: 16, bl: 0, br: 0 });

    // Main container
    this.container = this.scene.add.container(width / 2, height / 2);
    this.container.setDepth(202);
    this.container.add([overlay, overlayZone, panelBg]);

    // Title section
    const titleIcon = this.scene.add.text(-60, -panelHeight / 2 + 35, '⬆', { fontSize: '28px' });
    titleIcon.setOrigin(0.5);
    this.container.add(titleIcon);

    const title = this.scene.add.text(0, -panelHeight / 2 + 35, '영구 강화', {
      fontSize: '26px',
      color: '#f0fdf4',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // Gold display with background
    const goldBg = this.scene.add.graphics();
    goldBg.fillStyle(0x78350f, 0.5);
    goldBg.fillRoundedRect(-80, -panelHeight / 2 + 56, 160, 28, 14);
    goldBg.lineStyle(1, 0xfbbf24, 0.4);
    goldBg.strokeRoundedRect(-80, -panelHeight / 2 + 56, 160, 28, 14);
    this.container.add(goldBg);

    const gold = MetaProgressionManager.getGold();
    this.goldText = this.scene.add.text(0, -panelHeight / 2 + 70, `🪙 ${gold.toLocaleString()} G`, {
      fontSize: '16px',
      color: '#FFD700',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.goldText.setOrigin(0.5);
    this.container.add(this.goldText);

    // Separator
    const sep = this.scene.add.graphics();
    sep.lineStyle(1, 0x374151, 0.6);
    sep.lineBetween(-panelWidth / 2 + 20, -panelHeight / 2 + 92, panelWidth / 2 - 20, -panelHeight / 2 + 92);
    this.container.add(sep);

    // Upgrade cards
    this.createUpgradeCards(panelWidth, panelHeight);

    // Close hint
    const hint = this.scene.add.text(0, panelHeight / 2 - 22, 'U 또는 ESC로 닫기', {
      fontSize: '12px',
      color: '#4b5563',
      fontFamily: '"Courier New", monospace'
    });
    hint.setOrigin(0.5);
    this.container.add(hint);

    // Fade in
    this.container.setScale(0.85);
    this.container.setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 300,
      ease: Phaser.Math.Easing.Back.Out
    });
  }

  private createUpgradeCards(panelWidth: number, panelHeight: number): void {
    this.cardContainers.forEach(c => c.destroy());
    this.cardContainers = [];

    const startY = -panelHeight / 2 + 108;
    const cardHeight = 64;
    const cardGap = 6;
    const cardWidth = panelWidth - 50;
    const gold = MetaProgressionManager.getGold();

    META_UPGRADES.forEach((def, index) => {
      const y = startY + index * (cardHeight + cardGap);
      const card = this.createSingleCard(def, y, cardWidth, cardHeight, gold);
      this.container!.add(card);
      this.cardContainers.push(card);
    });
  }

  private createSingleCard(
    def: MetaUpgradeDefinition,
    y: number,
    cardWidth: number,
    cardHeight: number,
    gold: number
  ): Phaser.GameObjects.Container {
    const card = this.scene.add.container(0, y);
    const currentLevel = MetaProgressionManager.getUpgradeLevel(def.id);
    const isMaxed = currentLevel >= def.maxLevel;
    const cost = isMaxed ? 0 : getUpgradeCost(def, currentLevel);
    const canAfford = gold >= cost && !isMaxed;
    const halfW = cardWidth / 2;

    // Card background
    const bg = this.scene.add.graphics();
    const bgColor = isMaxed ? 0x14532d : 0x1f2937;
    bg.fillStyle(bgColor, 0.8);
    bg.fillRoundedRect(-halfW, 0, cardWidth, cardHeight, 10);

    // Left accent bar (color by stat type)
    const accentColors: Record<string, number> = {
      maxHp: 0xef4444,
      damage: 0xf97316,
      speed: 0x3b82f6,
      attackSpeed: 0xa855f7,
      attackRange: 0x06b6d4
    };
    const accent = accentColors[def.stat] || 0x4ade80;
    bg.fillStyle(accent, isMaxed ? 0.6 : 0.9);
    bg.fillRoundedRect(-halfW, 0, 5, cardHeight, { tl: 10, tr: 0, bl: 10, br: 0 });

    // Border (subtle)
    if (canAfford) {
      bg.lineStyle(1, 0x4ade80, 0.4);
      bg.strokeRoundedRect(-halfW, 0, cardWidth, cardHeight, 10);
    }

    card.add(bg);

    // Icon (large, left side)
    const icon = this.scene.add.text(-halfW + 28, cardHeight / 2, def.icon, {
      fontSize: '26px'
    });
    icon.setOrigin(0.5);
    card.add(icon);

    // Name
    const name = this.scene.add.text(-halfW + 54, 10, def.name, {
      fontSize: '15px',
      color: isMaxed ? '#86efac' : '#e5e7eb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", sans-serif',
      fontStyle: 'bold'
    });
    card.add(name);

    // Effect description
    const currentBonus = def.baseValue * currentLevel;
    const nextBonus = def.baseValue * (currentLevel + 1);
    const fmt = def.baseValue < 1 ? 2 : 0;
    const effectStr = isMaxed
      ? `+${currentBonus.toFixed(fmt)} (MAX)`
      : `+${currentBonus.toFixed(fmt)}  →  +${nextBonus.toFixed(fmt)}`;
    const effectText = this.scene.add.text(-halfW + 54, 28, effectStr, {
      fontSize: '11px',
      color: isMaxed ? '#4ade80' : '#9ca3b8',
      fontFamily: '"Courier New", monospace'
    });
    card.add(effectText);

    // Progress bar
    const barX = -halfW + 54;
    const barY = 46;
    const barWidth = 140;
    const barHeight = 8;

    // Bar background
    const barBg = this.scene.add.graphics();
    barBg.fillStyle(0x111827, 1);
    barBg.fillRoundedRect(barX, barY, barWidth, barHeight, 4);
    card.add(barBg);

    // Bar fill
    const barFill = this.scene.add.graphics();
    const fillWidth = (currentLevel / def.maxLevel) * barWidth;
    if (fillWidth > 0) {
      barFill.fillStyle(isMaxed ? 0x4ade80 : accent, 0.9);
      barFill.fillRoundedRect(barX, barY, Math.max(fillWidth, 6), barHeight, 4);
    }
    card.add(barFill);

    // Level pips
    for (let i = 0; i < def.maxLevel; i++) {
      const pipX = barX + (i / def.maxLevel) * barWidth;
      if (i > 0) {
        const pip = this.scene.add.graphics();
        pip.fillStyle(0x000000, 0.5);
        pip.fillRect(pipX, barY, 1, barHeight);
        card.add(pip);
      }
    }

    // Level text on bar
    const levelStr = `${currentLevel}/${def.maxLevel}`;
    const levelText = this.scene.add.text(barX + barWidth + 6, barY + barHeight / 2, levelStr, {
      fontSize: '10px',
      color: isMaxed ? '#4ade80' : '#6b7280',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold'
    });
    levelText.setOrigin(0, 0.5);
    card.add(levelText);

    // Buy button (right side)
    if (isMaxed) {
      const maxBadge = this.scene.add.graphics();
      maxBadge.fillStyle(0x166534, 0.8);
      maxBadge.fillRoundedRect(halfW - 72, 14, 60, 36, 8);
      maxBadge.lineStyle(1, 0x4ade80, 0.6);
      maxBadge.strokeRoundedRect(halfW - 72, 14, 60, 36, 8);
      card.add(maxBadge);

      const maxText = this.scene.add.text(halfW - 42, cardHeight / 2, 'MAX', {
        fontSize: '14px',
        color: '#4ade80',
        fontFamily: '"Courier New", monospace',
        fontStyle: 'bold'
      });
      maxText.setOrigin(0.5);
      card.add(maxText);
    } else {
      // Buy button background
      const btnBg = this.scene.add.graphics();
      const btnColor = canAfford ? 0x166534 : 0x1f2937;
      const btnBorder = canAfford ? 0x4ade80 : 0x374151;
      btnBg.fillStyle(btnColor, canAfford ? 0.9 : 0.5);
      btnBg.fillRoundedRect(halfW - 95, 10, 82, 44, 8);
      btnBg.lineStyle(canAfford ? 2 : 1, btnBorder, canAfford ? 0.8 : 0.3);
      btnBg.strokeRoundedRect(halfW - 95, 10, 82, 44, 8);
      card.add(btnBg);

      // Cost text
      const costLabel = this.scene.add.text(halfW - 54, 22, `🪙 ${cost}`, {
        fontSize: '13px',
        color: canAfford ? '#FFD700' : '#6b7280',
        fontFamily: '"Courier New", monospace',
        fontStyle: 'bold'
      });
      costLabel.setOrigin(0.5);
      card.add(costLabel);

      // "구매" or "부족" label
      const actionLabel = this.scene.add.text(halfW - 54, 40, canAfford ? '구매' : '부족', {
        fontSize: '11px',
        color: canAfford ? '#bbf7d0' : '#4b5563',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", sans-serif',
        fontStyle: 'bold'
      });
      actionLabel.setOrigin(0.5);
      card.add(actionLabel);

      if (canAfford) {
        // Interactive zone for buy button
        const btnZone = this.scene.add.zone(halfW - 54, 32, 82, 44);
        btnZone.setInteractive({ useHandCursor: true })
          .on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0x22c55e, 0.9);
            btnBg.fillRoundedRect(halfW - 95, 10, 82, 44, 8);
            btnBg.lineStyle(2, 0xbbf7d0, 1);
            btnBg.strokeRoundedRect(halfW - 95, 10, 82, 44, 8);
          })
          .on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0x166534, 0.9);
            btnBg.fillRoundedRect(halfW - 95, 10, 82, 44, 8);
            btnBg.lineStyle(2, 0x4ade80, 0.8);
            btnBg.strokeRoundedRect(halfW - 95, 10, 82, 44, 8);
          })
          .on('pointerdown', () => {
            this.purchaseUpgrade(def.id, card);
          });
        card.add(btnZone);
      }
    }

    return card;
  }

  private purchaseUpgrade(upgradeId: string, card: Phaser.GameObjects.Container): void {
    const success = MetaProgressionManager.purchaseUpgrade(upgradeId);
    if (!success) return;

    // Flash effect on card
    const flash = this.scene.add.graphics();
    flash.fillStyle(0x4ade80, 0.3);
    flash.fillRoundedRect(-card.width / 2 || -235, 0, 470, 64, 10);
    card.add(flash);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy()
    });

    // Screen shake (subtle)
    this.scene.cameras.main.shake(80, 0.003);

    // Update gold text
    const gold = MetaProgressionManager.getGold();
    if (this.goldText) {
      this.goldText.setText(`🪙 ${gold.toLocaleString()} G`);
      this.scene.tweens.add({
        targets: this.goldText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 150,
        yoyo: true,
        ease: Phaser.Math.Easing.Back.Out
      });
    }

    // Rebuild all cards after short delay
    this.scene.time.delayedCall(200, () => {
      if (!this.container) return;
      const panelWidth = 520;
      const panelHeight = 480;
      this.createUpgradeCards(panelWidth, panelHeight);
    });
  }

  hide(): void {
    if (!this.container) return;

    this.scene.tweens.add({
      targets: this.container,
      scaleX: 0.85,
      scaleY: 0.85,
      alpha: 0,
      duration: 200,
      ease: Phaser.Math.Easing.Back.In,
      onComplete: () => {
        if (this.container) {
          this.container.destroy();
          this.container = null;
        }
      }
    });
  }

  isPopupVisible(): boolean {
    return this.container !== null;
  }
}
