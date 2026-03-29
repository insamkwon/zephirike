/** Survivor.io-inspired Casual Mobile Game — Design System */

export const FONT_FAMILY = '"Nunito", "Outfit", -apple-system, "Segoe UI", sans-serif';

const shadow = (blur = 4, offsetY = 2, alpha = 0.5): Phaser.Types.GameObjects.Text.TextShadow => ({
  offsetX: 0, offsetY, color: `rgba(0,0,0,${alpha})`, blur, stroke: false, fill: true,
});

export const TEXT_STYLES = {
  title: {
    fontSize: '52px',
    fontFamily: FONT_FAMILY,
    fontStyle: '800',
    color: '#ffffff',
    stroke: '#1a1a3a',
    strokeThickness: 6,
    shadow: shadow(12, 4, 0.7),
  },
  heading: {
    fontSize: '28px',
    fontFamily: FONT_FAMILY,
    fontStyle: '700',
    color: '#FFD700',
    stroke: '#3a2a00',
    strokeThickness: 3,
    shadow: shadow(8, 3, 0.6),
  },
  body: {
    fontSize: '15px',
    fontFamily: FONT_FAMILY,
    fontStyle: '600',
    color: '#ffffff',
    shadow: shadow(3, 1, 0.4),
  },
  caption: {
    fontSize: '13px',
    fontFamily: FONT_FAMILY,
    fontStyle: '500',
    color: '#b0b8d0',
    shadow: shadow(2, 1, 0.3),
  },
  hudLabel: {
    fontSize: '15px',
    fontFamily: FONT_FAMILY,
    fontStyle: '700',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 3,
    shadow: shadow(4, 2, 0.6),
  },
  announcement: {
    fontSize: '26px',
    fontFamily: FONT_FAMILY,
    fontStyle: '800',
    color: '#FFD700',
    stroke: '#000000',
    strokeThickness: 4,
    shadow: shadow(8, 3, 0.6),
  },
  damage: {
    fontSize: '15px',
    fontFamily: FONT_FAMILY,
    fontStyle: '800',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 3,
  },
  damageCrit: {
    fontSize: '22px',
    fontFamily: FONT_FAMILY,
    fontStyle: '800',
    color: '#FFD700',
    stroke: '#000000',
    strokeThickness: 4,
    shadow: shadow(6, 2, 0.6),
  },
} as const;

/** Centralized color tokens — bright casual mobile game palette */
export const UI_COLORS = {
  // Backgrounds — semi-dark for contrast but not gothic
  bgDeep: 0x1a2a1a,
  bgPanel: 0x2a3a28,
  bgPanelHover: 0x3a4a38,
  bgGlassColor: 0x1a2820,
  bgGlassAlpha: 0.75,

  // Borders
  borderSubtle: 0x4a6a48,
  borderActive: 0x66cc66,
  borderGold: 0xFFD700,

  // Accents — vibrant, lively
  accent: 0xFFD700,
  accentCyan: 0x4FC3F7,
  accentGreen: 0x66DD66,
  accentRed: 0xFF4444,
  accentOrange: 0xFF9500,

  // HP/XP bars
  hpHigh: 0x44DD44,
  hpMid: 0xFFAA00,
  hpLow: 0xFF3333,
  xpBar: 0x4FC3F7,

  // Card colors (Survivor.io style)
  cardWeapon: 0xFFB300,
  cardPassive: 0x4CAF50,
  cardNew: 0x66DD66,

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#b0c4de',
  textDim: '#708090',
  textGold: '#FFD700',
  textCyan: '#4FC3F7',
  textGreen: '#66DD66',
  textRed: '#FF4444',
  textOrange: '#FF9500',
} as const;
