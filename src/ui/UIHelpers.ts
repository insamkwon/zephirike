import Phaser from 'phaser';
import { UI_COLORS } from '../config/styles';

/** Draw a frosted-glass style rounded panel — dark semi-transparent */
export function drawGlassPanel(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  radius = 14, alpha: number = UI_COLORS.bgGlassAlpha,
): void {
  g.fillStyle(0x1a2a20, alpha);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, radius);
  // Top-edge highlight
  g.lineStyle(1.5, 0xffffff, 0.08);
  g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, radius);
}

/** Bright panel — white semi-transparent for survivor.io style */
export function drawBrightPanel(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  radius = 16, alpha = 0.95,
): void {
  const left = x - w / 2;
  const top = y - h / 2;
  // Bright fill
  g.fillStyle(0xffffff, alpha);
  g.fillRoundedRect(left, top, w, h, radius);
  // Subtle shadow border
  g.lineStyle(2, 0x000000, 0.08);
  g.strokeRoundedRect(left, top, w, h, radius);
}

/** Draw a gradient card with colored top band */
export function drawGradientCard(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  radius = 16, baseColor = 0x2a3a2a, alpha = 0.92,
): void {
  const left = x - w / 2;
  const top = y - h / 2;
  g.fillStyle(baseColor, alpha);
  g.fillRoundedRect(left, top, w, h, radius);
  // Top highlight band
  g.fillStyle(0xffffff, 0.06);
  g.fillRoundedRect(left, top, w, h * 0.4, { tl: radius, tr: radius, bl: 0, br: 0 });
  // Rim
  g.lineStyle(1.5, 0xffffff, 0.08);
  g.strokeRoundedRect(left, top, w, h, radius);
}

/** Weapon card background (golden) */
export function drawWeaponCard(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  radius = 16,
): void {
  const left = x - w / 2;
  const top = y - h / 2;
  // Golden gradient simulation
  g.fillStyle(0x3a3020, 0.95);
  g.fillRoundedRect(left, top, w, h, radius);
  // Golden top band
  g.fillStyle(0xFFB300, 0.15);
  g.fillRoundedRect(left, top, w, h * 0.4, { tl: radius, tr: radius, bl: 0, br: 0 });
  // Gold border
  g.lineStyle(2, 0xFFB300, 0.6);
  g.strokeRoundedRect(left, top, w, h, radius);
}

/** Passive card background (green) */
export function drawPassiveCard(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  radius = 16,
): void {
  const left = x - w / 2;
  const top = y - h / 2;
  // Green gradient simulation
  g.fillStyle(0x1e3a1e, 0.95);
  g.fillRoundedRect(left, top, w, h, radius);
  // Green top band
  g.fillStyle(0x4CAF50, 0.15);
  g.fillRoundedRect(left, top, w, h * 0.4, { tl: radius, tr: radius, bl: 0, br: 0 });
  // Green border
  g.lineStyle(2, 0x4CAF50, 0.6);
  g.strokeRoundedRect(left, top, w, h, radius);
}

/** Draw a rounded progress bar (background + fill) */
export function drawRoundedBar(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  ratio: number, radius: number,
  bgColor: number, fillColor: number,
  bgAlpha = 0.6,
): void {
  g.fillStyle(bgColor, bgAlpha);
  g.fillRoundedRect(x, y, w, h, radius);
  const fillW = Math.max(ratio * w, ratio > 0 ? radius * 2 : 0);
  if (fillW > 0) {
    g.fillStyle(fillColor, 1);
    g.fillRoundedRect(x, y, fillW, h, radius);
    // Bright top shine on fill
    g.fillStyle(0xffffff, 0.2);
    g.fillRoundedRect(x + 1, y + 1, fillW - 2, Math.max(h / 3, 2), radius);
  }
}

/** Pill-shaped button background */
export function drawPillButton(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  color: number, alpha = 0.9,
): void {
  const r = h / 2;
  g.fillStyle(color, alpha);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
  // Shine on top half
  g.fillStyle(0xffffff, 0.2);
  g.fillRoundedRect(x - w / 2 + 2, y - h / 2 + 2, w - 4, h * 0.4, { tl: r, tr: r, bl: 0, br: 0 });
}

/** Circular icon badge */
export function drawIconBadge(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, radius: number,
  bgColor: number, alpha = 0.8,
): void {
  g.fillStyle(bgColor, alpha);
  g.fillCircle(x, y, radius);
  // Inner shine
  g.fillStyle(0xffffff, 0.15);
  g.fillCircle(x - radius * 0.2, y - radius * 0.2, radius * 0.6);
}

/** Add background blur to the camera for overlay panels */
export function addPanelBlur(scene: Phaser.Scene): Phaser.FX.Blur | null {
  try {
    return scene.cameras.main.postFX.addBlur(0, 0, 0, 1.5);
  } catch {
    return null;
  }
}

/** Remove a previously added blur effect */
export function removePanelBlur(scene: Phaser.Scene, blur: Phaser.FX.Blur | null): void {
  if (blur) {
    try { scene.cameras.main.postFX.remove(blur); } catch { /* noop */ }
  }
}

/** Draw a card border (for hover/select state changes) */
export function drawCardBorder(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  radius: number, color: number, thickness = 2, alpha = 1,
): void {
  g.lineStyle(thickness, color, alpha);
  g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, radius);
}
