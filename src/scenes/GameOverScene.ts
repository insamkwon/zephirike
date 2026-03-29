import Phaser from 'phaser';
import { getGold } from '../config/metaConfig';
import { TEXT_STYLES, FONT_FAMILY } from '../config/styles';
import { drawGlassPanel, drawPillButton } from '../ui/UIHelpers';

interface GameOverData {
  victory: boolean;
  time: string;
  kills: number;
  level: number;
  gold: number;
  weapons: string[];
  dpsHistory?: number[];
  peakDps?: number;
  damageTaken?: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    const cam = this.cameras.main;
    const cx = cam.width / 2;
    const h = cam.height;
    cam.setBackgroundColor('#1a2a1a');
    cam.fadeIn(400, 0, 0, 0);

    try { cam.postFX.addVignette(0.5, 0.5, 0.88, 0.2); } catch {}

    const baseY = Math.max(30, (h - 480) / 2);

    // Title — big, bright
    const titleColor = data.victory ? '#FFD700' : '#FF4444';
    const titleText = data.victory ? 'VICTORY!' : 'GAME OVER';
    const title = this.add.text(cx, baseY, titleText, {
      ...TEXT_STYLES.title, color: titleColor, fontSize: '48px',
    }).setOrigin(0.5).setScale(0).setAlpha(0);
    this.tweens.add({
      targets: title, scale: 1, alpha: 1,
      duration: 500, ease: 'Back.easeOut',
    });
    const glowColor = data.victory ? 0xFFD700 : 0xFF4444;
    try { title.preFX?.addGlow(glowColor, 3, 0, false, 0.08, 10); } catch {}

    const subtitle = data.victory ? 'You survived!' : 'Better luck next time...';
    const subText = this.add.text(cx, baseY + 52, subtitle, {
      fontSize: '15px', fontFamily: FONT_FAMILY, fontStyle: '600',
      color: '#b0c4de',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: subText, alpha: 1, duration: 300, delay: 200 });

    // Stats
    const stats = [
      ['Time', data.time],
      ['Level', `${data.level}`],
      ['Kills', `${data.kills}`],
      ['Gold Earned', `+${data.gold}`],
      ['Total Gold', `${getGold()}`],
    ];
    if (data.peakDps) stats.push(['Peak Kill Rate', `${data.peakDps}/30s`]);
    if (data.damageTaken) stats.push(['Damage Taken', `${data.damageTaken}`]);

    // Glass panel behind stats
    const panelH = stats.length * 32 + 30;
    const panelY = baseY + 90 + panelH / 2;
    const statsPanel = this.add.graphics().setAlpha(0);
    drawGlassPanel(statsPanel, cx, panelY, 400, panelH, 16, 0.75);
    this.tweens.add({ targets: statsPanel, alpha: 1, duration: 250, delay: 250 });

    let sy = baseY + 100;
    stats.forEach(([label, value], i) => {
      const labelObj = this.add.text(cx - 150, sy, label, {
        fontSize: '14px', fontFamily: FONT_FAMILY, fontStyle: '500',
        color: '#b0c4de',
      }).setOrigin(0, 0.5).setAlpha(0);

      const isGold = label === 'Gold Earned' || label === 'Total Gold';
      const valueColor = isGold ? '#FFD700' : '#ffffff';
      const valueObj = this.add.text(cx + 150, sy, value, {
        fontSize: '16px', fontFamily: FONT_FAMILY, fontStyle: '700',
        color: valueColor,
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(1, 0.5).setAlpha(0);

      labelObj.setX(cx - 170);
      valueObj.setX(cx + 170);
      this.tweens.add({
        targets: labelObj, alpha: 1, x: cx - 150,
        duration: 250, delay: 300 + i * 50, ease: 'Cubic.easeOut',
      });
      this.tweens.add({
        targets: valueObj, alpha: 1, x: cx + 150,
        duration: 250, delay: 300 + i * 50, ease: 'Cubic.easeOut',
      });

      sy += 32;
    });

    const sepDelay = 300 + stats.length * 50;
    sy += 10;

    // DPS graph
    if (data.dpsHistory && data.dpsHistory.length > 1) {
      this.time.delayedCall(sepDelay + 100, () => {
        this.drawDpsGraph(cx, sy, 370, 90, data.dpsHistory!);
      });
      sy += 125;
    }

    // Weapons build summary
    if (data.weapons.length > 0) {
      const buildLabel = this.add.text(cx, sy, 'Build:', {
        fontSize: '14px', fontFamily: FONT_FAMILY, fontStyle: '600',
        color: '#b0c4de',
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: buildLabel, alpha: 1, duration: 200, delay: sepDelay + 200 });
      sy += 24;

      const buildText = this.add.text(cx, sy, data.weapons.join('  '), {
        fontSize: '13px', fontFamily: FONT_FAMILY, fontStyle: '500', color: '#b0c4de',
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: buildText, alpha: 1, duration: 200, delay: sepDelay + 250 });
    }

    // Continue button — bright green pill
    const actionY = h - 55;
    const btnBg = this.add.graphics();
    drawPillButton(btnBg, cx, actionY, 240, 42, 0x44BB44, 0.9);
    btnBg.setAlpha(0);
    this.tweens.add({ targets: btnBg, alpha: 1, duration: 300, delay: sepDelay + 400 });

    const actionText = this.add.text(cx, actionY, 'Continue', {
      fontSize: '18px', fontFamily: FONT_FAMILY, fontStyle: '800',
      color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: actionText, alpha: 1, duration: 300, delay: sepDelay + 400,
      onComplete: () => {
        this.tweens.add({
          targets: [actionText, btnBg], scale: { from: 1, to: 1.05 },
          yoyo: true, repeat: -1, duration: 800, ease: 'Sine.easeInOut',
        });
      },
    });

    this.add.text(cx, h - 26, 'Spend gold on upgrades in the menu!', {
      fontSize: '12px', fontFamily: FONT_FAMILY, fontStyle: '500',
      color: '#708090',
    }).setOrigin(0.5);

    this.input.keyboard!.on('keydown-ENTER', () => this.goToMenu());
    this.input.keyboard!.on('keydown-SPACE', () => this.goToMenu());
    this.input.once('pointerdown', () => this.goToMenu());
  }

  private goToMenu(): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }

  private drawDpsGraph(cx: number, y: number, w: number, graphH: number, dps: number[]): void {
    const x = cx - w / 2;
    const maxDps = Math.max(...dps, 1);

    const bg = this.add.graphics();
    drawGlassPanel(bg, cx, y + graphH / 2, w + 20, graphH + 30, 12, 0.5);

    this.add.text(cx, y - 10, 'Kill Rate Over Time', {
      fontSize: '11px', fontFamily: FONT_FAMILY, fontStyle: '600', color: '#708090',
    }).setOrigin(0.5);

    const barW = Math.max(3, (w - 10) / dps.length - 1);
    for (let i = 0; i < dps.length; i++) {
      const barH = (dps[i] / maxDps) * (graphH - 10);
      const bx = x + 5 + i * ((w - 10) / dps.length);
      const by = y + graphH - 5;

      const intensity = dps[i] / maxDps;
      // Green → Orange gradient based on intensity
      const color = Phaser.Display.Color.GetColor(
        Math.floor(80 + 175 * intensity),
        Math.floor(180 - 80 * intensity),
        Math.floor(50 + 50 * intensity),
      );

      const barGfx = this.add.graphics();
      const targetH = barH;
      this.tweens.addCounter({
        from: 0, to: targetH, duration: 300, delay: i * 30, ease: 'Cubic.easeOut',
        onUpdate: (tween) => {
          const currentH = tween.getValue() as number;
          barGfx.clear();
          barGfx.fillStyle(color, 0.9);
          barGfx.fillRoundedRect(bx, by - currentH, barW, currentH, 2);
        },
      });
    }

    this.add.text(x, y + graphH + 2, '0:00', {
      fontSize: '9px', fontFamily: FONT_FAMILY, color: '#708090',
    });
    const totalMin = dps.length * 0.5;
    this.add.text(x + w, y + graphH + 2, `${totalMin.toFixed(0)}:00`, {
      fontSize: '9px', fontFamily: FONT_FAMILY, color: '#708090',
    }).setOrigin(1, 0);
  }
}
