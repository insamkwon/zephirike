import Phaser from 'phaser';
import { HighScoreManager, HighScore } from '../systems/HighScoreManager';

export class HighScoreScene extends Phaser.Scene {
  private background!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private scoreTexts: Phaser.GameObjects.Text[] = [];
  private noScoresText!: Phaser.GameObjects.Text;
  private backButton!: Phaser.GameObjects.Text;
  private clearButton!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'HighScoreScene' });
  }

  create(): void {
    // Create semi-transparent background
    this.background = this.add.graphics();
    this.background.setScrollFactor(0);
    this.background.setDepth(100);
    this.background.fillStyle(0x000000, 0.85);
    this.background.fillRect(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height
    );

    // Create title
    this.titleText = this.add.text(
      this.cameras.main.width / 2,
      80,
      '🏆 최고 점수 🏆',
      {
        fontSize: '48px',
        color: '#ffd700',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 8
      }
    );
    this.titleText.setOrigin(0.5);
    this.titleText.setScrollFactor(0);
    this.titleText.setDepth(150);

    // Load and display high scores
    this.displayHighScores();

    // Create back button
    this.backButton = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - 80,
      '← 게임으로 돌아가기',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 4
      }
    );
    this.backButton.setOrigin(0.5);
    this.backButton.setScrollFactor(0);
    this.backButton.setDepth(150);
    this.backButton.setInteractive({ useHandCursor: true });

    // Back button hover effect
    this.backButton.on('pointerover', () => {
      this.backButton.setScale(1.1);
      this.backButton.setColor('#ffff00');
    });

    this.backButton.on('pointerout', () => {
      this.backButton.setScale(1);
      this.backButton.setColor('#ffffff');
    });

    this.backButton.on('pointerdown', () => {
      this.scene.stop();
      // If game scene exists, resume it
      const gameScene = this.scene.get('GameScene');
      if (gameScene) {
        this.scene.resume('GameScene');
      } else {
        this.scene.start('GameScene');
      }
    });

    // Create clear scores button (small, at bottom right)
    this.clearButton = this.add.text(
      this.cameras.main.width - 100,
      this.cameras.main.height - 30,
      '초기화',
      {
        fontSize: '14px',
        color: '#ff4444',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center'
      }
    );
    this.clearButton.setOrigin(1, 1);
    this.clearButton.setScrollFactor(0);
    this.clearButton.setDepth(150);
    this.clearButton.setInteractive({ useHandCursor: true });

    this.clearButton.on('pointerover', () => {
      this.clearButton.setColor('#ff0000');
    });

    this.clearButton.on('pointerout', () => {
      this.clearButton.setColor('#ff4444');
    });

    this.clearButton.on('pointerdown', () => {
      this.clearScores();
    });

    // Add keyboard shortcut to close
    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.stop();
      const gameScene = this.scene.get('GameScene');
      if (gameScene) {
        this.scene.resume('GameScene');
      } else {
        this.scene.start('GameScene');
      }
    });

    // Play entrance animation
    this.playEntranceAnimation();
  }

  private displayHighScores(): void {
    const scores = HighScoreManager.loadHighScores();

    if (scores.length === 0) {
      // No scores yet
      this.noScoresText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        '아직 기록이 없습니다!\n게임을 하고 기록을 세우세요!',
        {
          fontSize: '28px',
          color: '#888888',
          fontFamily: 'Courier New',
          fontStyle: 'bold',
          align: 'center'
        }
      );
      this.noScoresText.setOrigin(0.5);
      this.noScoresText.setScrollFactor(0);
      this.noScoresText.setDepth(150);
      return;
    }

    // Display top 5 scores
    const startY = 180;
    const lineHeight = 70;

    scores.forEach((highScore: HighScore, index: number) => {
      const y = startY + (index * lineHeight);

      // Rank medal
      let medal = '';
      let rankColor = '#ffffff';

      switch (index) {
        case 0:
          medal = '🥇';
          rankColor = '#ffd700'; // Gold
          break;
        case 1:
          medal = '🥈';
          rankColor = '#c0c0c0'; // Silver
          break;
        case 2:
          medal = '🥉';
          rankColor = '#cd7f32'; // Bronze
          break;
        default:
          medal = `#${index + 1}`;
          rankColor = '#ffffff';
      }

      // Score entry container
      const scoreEntry = this.add.text(
        this.cameras.main.width / 2,
        y,
        `${medal}   ${highScore.score.toLocaleString()}   ${highScore.formattedDate}`,
        {
          fontSize: '24px',
          color: rankColor,
          fontFamily: 'Courier New',
          fontStyle: 'bold',
          align: 'center',
          stroke: '#000000',
          strokeThickness: 4
        }
      );
      scoreEntry.setOrigin(0.5);
      scoreEntry.setScrollFactor(0);
      scoreEntry.setDepth(150);

      this.scoreTexts.push(scoreEntry);
    });

    // Add statistics at bottom
    const statsY = startY + (scores.length * lineHeight) + 40;
    const highestScore = HighScoreManager.getHighestScore();
    const averageScore = HighScoreManager.getAverageScore();

    const statsText = this.add.text(
      this.cameras.main.width / 2,
      statsY,
      `📊 최고: ${highestScore.toLocaleString()}   |   평균: ${averageScore.toLocaleString()}`,
      {
        fontSize: '18px',
        color: '#00ff00',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center'
      }
    );
    statsText.setOrigin(0.5);
    statsText.setScrollFactor(0);
    statsText.setDepth(150);

    this.scoreTexts.push(statsText);
  }

  private clearScores(): void {
    // Confirmation dialog
    const confirmOverlay = this.add.graphics();
    confirmOverlay.setScrollFactor(0);
    confirmOverlay.setDepth(200);
    confirmOverlay.fillStyle(0x000000, 0.9);
    confirmOverlay.fillRect(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height
    );

    const confirmText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 50,
      '모든 최고 점수를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!',
      {
        fontSize: '32px',
        color: '#ff4444',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 6
      }
    );
    confirmText.setOrigin(0.5);
    confirmText.setScrollFactor(0);
    confirmText.setDepth(250);

    // Yes button
    const yesButton = this.add.text(
      this.cameras.main.width / 2 - 100,
      this.cameras.main.height / 2 + 60,
      '예',
      {
        fontSize: '28px',
        color: '#ff4444',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 4
      }
    );
    yesButton.setOrigin(0.5);
    yesButton.setScrollFactor(0);
    yesButton.setDepth(250);
    yesButton.setInteractive({ useHandCursor: true });

    yesButton.on('pointerover', () => {
      yesButton.setScale(1.1);
      yesButton.setColor('#ff0000');
    });

    yesButton.on('pointerout', () => {
      yesButton.setScale(1);
      yesButton.setColor('#ff4444');
    });

    yesButton.on('pointerdown', () => {
      HighScoreManager.clearHighScores();
      this.refreshScores();
      confirmOverlay.destroy();
      confirmText.destroy();
      yesButton.destroy();
      noButton.destroy();
    });

    // No button
    const noButton = this.add.text(
      this.cameras.main.width / 2 + 100,
      this.cameras.main.height / 2 + 60,
      '아니오',
      {
        fontSize: '28px',
        color: '#44ff44',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 4
      }
    );
    noButton.setOrigin(0.5);
    noButton.setScrollFactor(0);
    noButton.setDepth(250);
    noButton.setInteractive({ useHandCursor: true });

    noButton.on('pointerover', () => {
      noButton.setScale(1.1);
      noButton.setColor('#00ff00');
    });

    noButton.on('pointerout', () => {
      noButton.setScale(1);
      noButton.setColor('#44ff44');
    });

    noButton.on('pointerdown', () => {
      confirmOverlay.destroy();
      confirmText.destroy();
      yesButton.destroy();
      noButton.destroy();
    });
  }

  private refreshScores(): void {
    // Clear existing score texts
    this.scoreTexts.forEach(text => text.destroy());
    this.scoreTexts = [];

    if (this.noScoresText) {
      this.noScoresText.destroy();
    }

    // Redisplay scores
    this.displayHighScores();
  }

  private playEntranceAnimation(): void {
    // Fade in background
    this.background.setAlpha(0);
    this.tweens.add({
      targets: this.background,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });

    // Slide in title
    this.titleText.setY(this.titleText.y - 100);
    this.tweens.add({
      targets: this.titleText,
      y: 80,
      duration: 500,
      delay: 200,
      ease: 'Back.easeOut'
    });

    // Stagger fade in scores
    this.scoreTexts.forEach((text, index) => {
      text.setAlpha(0);
      this.tweens.add({
        targets: text,
        alpha: 1,
        duration: 300,
        delay: 400 + (index * 100),
        ease: 'Power2'
      });
    });

    // Fade in buttons
    this.backButton.setAlpha(0);
    this.clearButton.setAlpha(0);
    this.tweens.add({
      targets: [this.backButton, this.clearButton],
      alpha: 1,
      duration: 300,
      delay: 800,
      ease: 'Power2'
    });
  }
}
