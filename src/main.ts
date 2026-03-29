import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GAME_WIDTH, GAME_HEIGHT } from './config/constants';

/* ── High-DPI text: patch Phaser text factory so ALL text gets crisp resolution ── */
const TEXT_DPR = Math.min(window.devicePixelRatio || 1, 3);
const _origText = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (
  this: Phaser.GameObjects.GameObjectFactory,
  x: number, y: number, text: string | string[], style?: Phaser.Types.GameObjects.Text.TextStyle,
) {
  const t = _origText.call(this, x, y, text, style);
  t.setResolution(TEXT_DPR);
  return t;
};

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a2a1a',
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  pixelArt: false,
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
};

document.fonts.ready.then(() => {
  new Phaser.Game(config);
});
