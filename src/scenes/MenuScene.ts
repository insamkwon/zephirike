import Phaser from 'phaser';
import { HighScoreManager } from '../systems/HighScoreManager';
import { MetaProgressionManager } from '../systems/MetaProgressionManager';
import { UpgradePopup } from '../ui/UpgradePopup';

/**
 * Main Menu Scene - Game start screen
 * Retro Arcade Fantasy RPG 스타일
 */
export class MenuScene extends Phaser.Scene {
  private startButton!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private titleContainer!: Phaser.GameObjects.Container;
  private rankingPanel!: Phaser.GameObjects.Container;
  private isRankingVisible: boolean = false;
  private rankingKeyHandler: (() => void) | null = null;
  private upgradePopup: UpgradePopup | null = null;
  private isUpgradeVisible: boolean = false;
  private upgradeKeyHandler: (() => void) | null = null;
  private upgradeGoldText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  preload(): void {
    // Load placeholder assets
    this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // 동적 배경 - 어두운 그라데이션
    const bg = this.add.graphics();
    bg.setScrollFactor(0);

    // 상단 부분
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height * 0.5);

    // 하단 부분 (더 어둡게)
    bg.fillStyle(0x0f0f23, 1);
    bg.fillRect(0, height * 0.5, width, height * 0.5);

    // 배경 장식 - 마법 서클 패턴
    this.createMagicCircles(width, height);

    // 타이틀 컨테이너 (애니메이션용)
    this.titleContainer = this.add.container(width / 2, height / 3);

    // 타이틀 배경 패널
    const titlePanel = this.add.graphics();
    titlePanel.fillStyle(0x1a1a2e, 0.9);
    titlePanel.fillRoundedRect(-180, -70, 360, 140, 20);

    // 패널 보더 - 이중 테두리
    titlePanel.lineStyle(3, 0x4a4a8a, 1);
    titlePanel.strokeRoundedRect(-180, -70, 360, 140, 20);
    titlePanel.lineStyle(1, 0x6a6aaa, 0.5);
    titlePanel.strokeRoundedRect(-176, -66, 352, 132, 16);

    // 상단 글로우 라인
    titlePanel.fillStyle(0x6366f1, 0.8);
    titlePanel.fillRoundedRect(-180, -70, 360, 4, { tl: 20, tr: 20, bl: 0, br: 0 });

    this.titleContainer.add(titlePanel);

    // 메인 타이틀 - 제피라이크
    this.titleText = this.add.text(0, -10, '제피라이크', {
      fontSize: '56px',
      color: '#e0e7ff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", sans-serif',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#1e1b4b',
      strokeThickness: 6,
      shadow: {
        offsetX: 0,
        offsetY: 4,
        color: '#000000',
        blur: 8
      }
    });
    this.titleText.setOrigin(0.5);
    this.titleContainer.add(this.titleText);

    // 영문 서브타이틀
    const subtitle = this.add.text(0, 40, 'ZEPHIRIKE', {
      fontSize: '22px',
      color: '#818cf8',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontStyle: 'bold',
      align: 'center',
      letterSpacing: 10
    });
    subtitle.setOrigin(0.5);
    this.titleContainer.add(subtitle);

    // 타이틀 플로팅 애니메이션
    this.tweens.add({
      targets: this.titleContainer,
      y: height / 3 - 10,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: Phaser.Math.Easing.Sine.InOut
    });

    // 타이틀 글로우 펄스
    this.tweens.add({
      targets: this.titleText,
      alpha: 0.85,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: Phaser.Math.Easing.Sine.InOut
    });

    // 스타트 버튼 컨테이너
    this.startButton = this.add.container(width / 2, height / 2 + 80);

    // 버튼 배경 - 다층 구조
    const buttonBg = this.add.graphics();

    // 그림자
    buttonBg.fillStyle(0x000000, 0.4);
    buttonBg.fillRoundedRect(-122, -32, 244, 64, 16);

    // 메인 배경
    buttonBg.fillStyle(0x1e3a5f, 1);
    buttonBg.fillRoundedRect(-120, -30, 240, 60, 14);

    // 보더
    buttonBg.lineStyle(2, 0x3b82f6, 1);
    buttonBg.strokeRoundedRect(-120, -30, 240, 60, 14);

    // 상단 하이라이트
    buttonBg.fillStyle(0x60a5fa, 0.6);
    buttonBg.fillRoundedRect(-120, -30, 240, 4, { tl: 14, tr: 14, bl: 0, br: 0 });

    this.startButton.add(buttonBg);

    // 버튼 텍스트
    const buttonText = this.add.text(0, 0, '게임 시작', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", sans-serif',
      fontStyle: 'bold',
      stroke: '#1e3a8a',
      strokeThickness: 3
    });
    buttonText.setOrigin(0.5);
    this.startButton.add(buttonText);

    // 버튼 아이콘 (검)
    const swordIcon = this.add.text(-90, 0, '⚔', {
      fontSize: '24px'
    });
    swordIcon.setOrigin(0.5);
    this.startButton.add(swordIcon);

    this.startButton.setSize(240, 60);

    // 버튼 인터랙티브
    (this.startButton as any).setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        this.animateButtonHover(buttonBg, buttonText, swordIcon, true);
      })
      .on('pointerout', () => {
        this.animateButtonHover(buttonBg, buttonText, swordIcon, false);
      })
      .on('pointerdown', () => {
        this.animateButtonPress(buttonBg);
        this.time.delayedCall(100, () => this.startGame());
      });

    // 프롬프트 텍스트
    this.promptText = this.add.text(width / 2, height - 60, '스페이스바 또는 클릭하여 시작', {
      fontSize: '17px',
      color: '#94a3b8',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", sans-serif',
      fontStyle: '500'
    });
    this.promptText.setOrigin(0.5);

    // 프롬프트 깜빡임
    this.tweens.add({
      targets: this.promptText,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: Phaser.Math.Easing.Sine.InOut
    });

    // 강화 버튼 (게임 시작 버튼 아래)
    this.createUpgradeButton(width, height);

    // 랭킹 버튼 (강화 버튼 아래)
    this.createMainRankingButton(width, height);

    // 안내 텍스트 - 하단
    const controlsHint = this.add.text(width / 2, height - 30, 'WASD: 이동  |  마우스: 공격 방향  |  U: 강화  |  H: 랭킹', {
      fontSize: '14px',
      color: '#64748b',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    });
    controlsHint.setOrigin(0.5);

    // 스페이스바로 시작
    this.input.keyboard!.on('keydown-SPACE', () => {
      if (!this.isUpgradeVisible && !this.isRankingVisible) {
        this.startGame();
      }
    });

    // 엔터키로도 시작
    this.input.keyboard!.on('keydown-ENTER', () => {
      if (!this.isUpgradeVisible && !this.isRankingVisible) {
        this.startGame();
      }
    });

    // H 키로 랭킹 토글
    this.input.keyboard!.on('keydown-H', () => {
      if (!this.isUpgradeVisible) {
        this.toggleRanking();
      }
    });

    // U 키로 강화 토글
    this.input.keyboard!.on('keydown-U', () => {
      if (!this.isRankingVisible) {
        this.toggleUpgrades();
      }
    });

    // 랭킹 표시 버튼 (하단 우측)
    this.createRankingButton(width, height);
  }

  /**
   * 랭킹 버튼 생성
   */
  private createRankingButton(width: number, height: number): void {
    const buttonX = width - 100;
    const buttonY = height - 40;

    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x1a1a2e, 0.8);
    buttonBg.fillRoundedRect(buttonX - 60, buttonY - 18, 120, 36, 18);
    buttonBg.lineStyle(2, 0x8b6914, 0.6);
    buttonBg.strokeRoundedRect(buttonX - 60, buttonY - 18, 120, 36, 18);
    buttonBg.setDepth(100);

    const buttonText = this.add.text(buttonX, buttonY, '🏆 RANKING (H)', {
      fontSize: '14px',
      color: '#d4af37',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5);
    buttonText.setDepth(101);

    const rankingButton = this.add.container(buttonX, buttonY);
    rankingButton.add([buttonBg, buttonText]);
    rankingButton.setSize(120, 36);
    rankingButton.setDepth(102);

    (rankingButton as any).setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        buttonBg.clear();
        buttonBg.fillStyle(0x2a2a3e, 0.9);
        buttonBg.fillRoundedRect(buttonX - 60, buttonY - 18, 120, 36, 18);
        buttonBg.lineStyle(2, 0xd4af37, 1);
        buttonBg.strokeRoundedRect(buttonX - 60, buttonY - 18, 120, 36, 18);
        buttonText.setColor('#f4e4c1');
      })
      .on('pointerout', () => {
        buttonBg.clear();
        buttonBg.fillStyle(0x1a1a2e, 0.8);
        buttonBg.fillRoundedRect(buttonX - 60, buttonY - 18, 120, 36, 18);
        buttonBg.lineStyle(2, 0x8b6914, 0.6);
        buttonBg.strokeRoundedRect(buttonX - 60, buttonY - 18, 120, 36, 18);
        buttonText.setColor('#d4af37');
      })
      .on('pointerdown', () => {
        this.toggleRanking();
      });
  }

  /**
   * 강화 버튼 생성
   */
  private createUpgradeButton(width: number, height: number): void {
    const buttonX = width / 2;
    const buttonY = height / 2 + 140;

    const buttonBg = this.add.graphics();

    // 그림자
    buttonBg.fillStyle(0x000000, 0.4);
    buttonBg.fillRoundedRect(-102, -27, 204, 54, 14);

    // 메인 배경 - 녹색 테마
    buttonBg.fillStyle(0x1a3a2a, 1);
    buttonBg.fillRoundedRect(-100, -25, 200, 50, 12);

    // 보더 - 녹색
    buttonBg.lineStyle(2, 0x4ade80, 1);
    buttonBg.strokeRoundedRect(-100, -25, 200, 50, 12);

    // 상단 하이라이트
    buttonBg.fillStyle(0x4ade80, 0.5);
    buttonBg.fillRoundedRect(-100, -25, 200, 3, { tl: 12, tr: 12, bl: 0, br: 0 });

    const button = this.add.container(buttonX, buttonY);
    button.add(buttonBg);

    // 버튼 텍스트
    const buttonText = this.add.text(0, 0, '⬆ 영구 강화', {
      fontSize: '20px',
      color: '#bbf7d0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", sans-serif',
      fontStyle: 'bold',
      stroke: '#0a2a1a',
      strokeThickness: 3
    });
    buttonText.setOrigin(0.5);
    button.add(buttonText);

    // 키 힌트
    const keyHint = this.add.text(70, 0, '[U]', {
      fontSize: '14px',
      color: '#4ade80',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold'
    });
    keyHint.setOrigin(0.5);
    button.add(keyHint);

    // 골드 표시
    const gold = MetaProgressionManager.getGold();
    this.upgradeGoldText = this.add.text(0, 32, `🪙 ${gold.toLocaleString()}`, {
      fontSize: '14px',
      color: '#FFD700',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.upgradeGoldText.setOrigin(0.5);
    button.add(this.upgradeGoldText);

    button.setSize(200, 50);

    (button as any).setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        buttonBg.clear();
        buttonBg.fillStyle(0x000000, 0.5);
        buttonBg.fillRoundedRect(-104, -29, 208, 58, 14);
        buttonBg.fillStyle(0x2a4a3a, 1);
        buttonBg.fillRoundedRect(-100, -25, 200, 50, 12);
        buttonBg.lineStyle(3, 0xbbf7d0, 1);
        buttonBg.strokeRoundedRect(-100, -25, 200, 50, 12);
        buttonBg.fillStyle(0xbbf7d0, 0.7);
        buttonBg.fillRoundedRect(-100, -25, 200, 3, { tl: 12, tr: 12, bl: 0, br: 0 });
        buttonText.setScale(1.05);
        keyHint.setColor('#bbf7d0');
      })
      .on('pointerout', () => {
        buttonBg.clear();
        buttonBg.fillStyle(0x000000, 0.4);
        buttonBg.fillRoundedRect(-102, -27, 204, 54, 14);
        buttonBg.fillStyle(0x1a3a2a, 1);
        buttonBg.fillRoundedRect(-100, -25, 200, 50, 12);
        buttonBg.lineStyle(2, 0x4ade80, 1);
        buttonBg.strokeRoundedRect(-100, -25, 200, 50, 12);
        buttonBg.fillStyle(0x4ade80, 0.5);
        buttonBg.fillRoundedRect(-100, -25, 200, 3, { tl: 12, tr: 12, bl: 0, br: 0 });
        buttonText.setScale(1);
        keyHint.setColor('#4ade80');
      })
      .on('pointerdown', () => {
        buttonBg.clear();
        buttonBg.fillStyle(0x0a2a1a, 1);
        buttonBg.fillRoundedRect(-98, -23, 196, 46, 10);
        buttonBg.lineStyle(2, 0x4ade80, 1);
        buttonBg.strokeRoundedRect(-98, -23, 196, 46, 10);
        this.time.delayedCall(100, () => this.toggleUpgrades());
      });

    // 플로팅 애니메이션
    this.tweens.add({
      targets: button,
      y: buttonY - 5,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: Phaser.Math.Easing.Sine.InOut
    });
  }

  /**
   * 강화 팝업 토글
   */
  private toggleUpgrades(): void {
    if (this.isUpgradeVisible) {
      this.hideUpgrades();
    } else {
      this.showUpgrades();
    }
  }

  private showUpgrades(): void {
    if (this.isUpgradeVisible) return;

    this.upgradePopup = new UpgradePopup(this);
    this.upgradePopup.show();
    this.isUpgradeVisible = true;

    // 키보드 핸들러
    this.upgradeKeyHandler = () => {
      if (this.isUpgradeVisible) {
        this.hideUpgrades();
      }
    };
    this.input.keyboard!.on('keydown-ESC', this.upgradeKeyHandler);
  }

  private hideUpgrades(): void {
    if (!this.isUpgradeVisible || !this.upgradePopup) return;

    if (this.upgradeKeyHandler) {
      this.input.keyboard!.off('keydown-ESC', this.upgradeKeyHandler);
      this.upgradeKeyHandler = null;
    }

    this.upgradePopup.hide();
    this.isUpgradeVisible = false;

    // 골드 텍스트 업데이트
    if (this.upgradeGoldText) {
      const gold = MetaProgressionManager.getGold();
      this.upgradeGoldText.setText(`🪙 ${gold.toLocaleString()}`);
    }

    this.time.delayedCall(300, () => {
      this.upgradePopup = null;
    });
  }

  /**
   * 메인 랭킹 버튼 생성 (강화 버튼 아래)
   */
  private createMainRankingButton(width: number, height: number): void {
    const buttonX = width / 2;
    const buttonY = height / 2 + 195;

    const buttonBg = this.add.graphics();

    // 그림자
    buttonBg.fillStyle(0x000000, 0.4);
    buttonBg.fillRoundedRect(-102, -27, 204, 54, 14);

    // 메인 배경 - 금색 테마
    buttonBg.fillStyle(0x4a3c1a, 1);
    buttonBg.fillRoundedRect(-100, -25, 200, 50, 12);

    // 보더 - 금색
    buttonBg.lineStyle(2, 0xd4af37, 1);
    buttonBg.strokeRoundedRect(-100, -25, 200, 50, 12);

    // 상단 하이라이트
    buttonBg.fillStyle(0xd4af37, 0.5);
    buttonBg.fillRoundedRect(-100, -25, 200, 3, { tl: 12, tr: 12, bl: 0, br: 0 });

    const button = this.add.container(buttonX, buttonY);
    button.add(buttonBg);

    // 버튼 텍스트
    const buttonText = this.add.text(0, 0, '🏆 하이 스코어 랭킹', {
      fontSize: '20px',
      color: '#f4e4c1',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", sans-serif',
      fontStyle: 'bold',
      stroke: '#2a1a00',
      strokeThickness: 3
    });
    buttonText.setOrigin(0.5);
    button.add(buttonText);

    // 키 힌트
    const keyHint = this.add.text(70, 0, '[H]', {
      fontSize: '14px',
      color: '#d4af37',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold'
    });
    keyHint.setOrigin(0.5);
    button.add(keyHint);

    button.setSize(200, 50);

    (button as any).setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        buttonBg.clear();
        buttonBg.fillStyle(0x000000, 0.5);
        buttonBg.fillRoundedRect(-104, -29, 208, 58, 14);
        buttonBg.fillStyle(0x5a4c2a, 1);
        buttonBg.fillRoundedRect(-100, -25, 200, 50, 12);
        buttonBg.lineStyle(3, 0xf4e4c1, 1);
        buttonBg.strokeRoundedRect(-100, -25, 200, 50, 12);
        buttonBg.fillStyle(0xf4e4c1, 0.7);
        buttonBg.fillRoundedRect(-100, -25, 200, 3, { tl: 12, tr: 12, bl: 0, br: 0 });
        buttonText.setScale(1.05);
        keyHint.setColor('#f4e4c1');
      })
      .on('pointerout', () => {
        buttonBg.clear();
        buttonBg.fillStyle(0x000000, 0.4);
        buttonBg.fillRoundedRect(-102, -27, 204, 54, 14);
        buttonBg.fillStyle(0x4a3c1a, 1);
        buttonBg.fillRoundedRect(-100, -25, 200, 50, 12);
        buttonBg.lineStyle(2, 0xd4af37, 1);
        buttonBg.strokeRoundedRect(-100, -25, 200, 50, 12);
        buttonBg.fillStyle(0xd4af37, 0.5);
        buttonBg.fillRoundedRect(-100, -25, 200, 3, { tl: 12, tr: 12, bl: 0, br: 0 });
        buttonText.setScale(1);
        keyHint.setColor('#d4af37');
      })
      .on('pointerdown', () => {
        buttonBg.clear();
        buttonBg.fillStyle(0x3a2c0a, 1);
        buttonBg.fillRoundedRect(-98, -23, 196, 46, 10);
        buttonBg.lineStyle(2, 0xd4af37, 1);
        buttonBg.strokeRoundedRect(-98, -23, 196, 46, 10);
        this.time.delayedCall(100, () => this.toggleRanking());
      });

    // 부드러운 플로팅 애니메이션
    this.tweens.add({
      targets: button,
      y: buttonY - 5,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: Phaser.Math.Easing.Sine.InOut
    });
  }

  /**
   * 랭킹 토글
   */
  private toggleRanking(): void {
    if (this.isRankingVisible) {
      this.hideRanking();
    } else {
      this.showRanking();
    }
  }

  /**
   * 랭킹 표시
   */
  private showRanking(): void {
    if (this.isRankingVisible) return;

    const { width, height } = this.cameras.main;
    const scores = HighScoreManager.loadHighScores();

    // 오버레이 - 시각용 Graphics (단순 배경)
    // 컨테이너가 화면 중앙에 있으므로, 왼쪽 상단부터 채우려면 (-width/2, -height/2) 위치
    const overlay = this.add.graphics();
    overlay.setPosition(-width / 2, -height / 2);
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(200);

    // 클릭 가능한 Zone (전체 화면 덮기) - 컨테이너 기준 위치
    const overlayZone = this.add.zone(0, 0, width, height);
    overlayZone.setDepth(201);
    overlayZone.setInteractive({ useHandCursor: false })
      .on('pointerdown', () => {
        this.hideRanking();
      });

    // 패널
    const panelWidth = 500;
    const panelHeight = scores.length > 0 ? 250 + scores.length * 50 : 250;
    const panelY = height / 2;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1a1a2e, 0.95);
    panelBg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 20);

    // 보더
    panelBg.lineStyle(3, 0x8b6914, 0.8);
    panelBg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 20);

    // 상단 장식 바
    panelBg.fillStyle(0x8b6914, 1);
    panelBg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, 6, { tl: 20, tr: 20, bl: 0, br: 0 });

    // 패널 컨테이너
    this.rankingPanel = this.add.container(width / 2, panelY);
    this.rankingPanel.setDepth(201);
    this.rankingPanel.add([overlay, overlayZone, panelBg]);

    // 타이틀
    const title = this.add.text(0, -panelHeight / 2 + 45, '🏆 하이 스코어 랭킹', {
      fontSize: '24px',
      color: '#f4e4c1',
      fontFamily: '"Georgia", serif',
      fontStyle: 'bold',
      stroke: '#1a1a1a',
      strokeThickness: 4
    });
    title.setOrigin(0.5);
    this.rankingPanel.add(title);

    if (scores.length === 0) {
      const noScores = this.add.text(0, 0, '아직 기록이 없습니다', {
        fontSize: '16px',
        color: '#9a8a6a',
        fontFamily: '"Courier New", monospace'
      });
      noScores.setOrigin(0.5);
      this.rankingPanel.add(noScores);
    } else {
      scores.forEach((score, index) => {
        const medals = ['🥇', '🥈', '🥉', '🏅', '🏅'];
        const medal = medals[index] || '🏅';

        const entryBg = this.add.graphics();
        entryBg.fillStyle(index % 2 === 0 ? 0x1a1a2e : 0x0f0f1a, 0.5);
        entryBg.fillRoundedRect(-panelWidth / 2 + 30, -panelHeight / 2 + 90 + index * 45, panelWidth - 60, 40, 8);
        this.rankingPanel.add(entryBg);

        const rankText = this.add.text(-panelWidth / 2 + 50, -panelHeight / 2 + 90 + index * 45, `${medal}`, {
          fontSize: '24px'
        });
        this.rankingPanel.add(rankText);

        const scoreText = this.add.text(0, -panelHeight / 2 + 90 + index * 45, `${score.score.toLocaleString()} 점`, {
          fontSize: '18px',
          color: '#f4e4c1',
          fontFamily: '"Courier New", monospace',
          fontStyle: 'bold'
        });
        scoreText.setOrigin(0.5);
        this.rankingPanel.add(scoreText);

        const dateText = this.add.text(panelWidth / 2 - 50, -panelHeight / 2 + 90 + index * 45, score.formattedDate, {
          fontSize: '12px',
          color: '#6a6a5a',
          fontFamily: '"Courier New", monospace'
        });
        dateText.setOrigin(1, 0.5);
        this.rankingPanel.add(dateText);
      });
    }

    // 닫기 힌트
    const hint = this.add.text(0, panelHeight / 2 - 30, 'H 또는 ESC로 닫기', {
      fontSize: '14px',
      color: '#6a6a5a',
      fontFamily: '"Courier New", monospace'
    });
    hint.setOrigin(0.5);
    this.rankingPanel.add(hint);

    // 페이드인
    this.rankingPanel.setScale(0.8);
    this.rankingPanel.setAlpha(0);

    this.tweens.add({
      targets: this.rankingPanel,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 300,
      ease: Phaser.Math.Easing.Back.Out
    });

    this.isRankingVisible = true;

    // 키보드로 닫기 - once 대신 이벤트 리스너 추가
    this.setupRankingKeyboardHandlers();
  }

  /**
   * 랭킹 키보드 핸들러 설정
   */
  private setupRankingKeyboardHandlers(): void {
    // 기존 핸들러 제거
    if (this.rankingKeyHandler) {
      this.input.keyboard!.off('keydown-ESC', this.rankingKeyHandler);
      this.input.keyboard!.off('keydown-H', this.rankingKeyHandler);
    }

    // 새 핸들러 생성
    this.rankingKeyHandler = () => {
      if (this.isRankingVisible) {
        this.hideRanking();
      }
    };

    this.input.keyboard!.on('keydown-ESC', this.rankingKeyHandler);
    this.input.keyboard!.on('keydown-H', this.rankingKeyHandler);
  }

  /**
   * 랭킹 키보드 핸들러 정리
   */
  private cleanupRankingKeyboardHandlers(): void {
    if (this.rankingKeyHandler) {
      this.input.keyboard!.off('keydown-ESC', this.rankingKeyHandler);
      this.input.keyboard!.off('keydown-H', this.rankingKeyHandler);
      this.rankingKeyHandler = null;
    }
  }

  /**
   * 랭킹 숨김
   */
  private hideRanking(): void {
    if (!this.isRankingVisible || !this.rankingPanel) return;

    // 키보드 핸들러 정리
    this.cleanupRankingKeyboardHandlers();

    this.tweens.add({
      targets: this.rankingPanel,
      scaleX: 0.8,
      scaleY: 0.8,
      alpha: 0,
      duration: 200,
      ease: Phaser.Math.Easing.Back.In,
      onComplete: () => {
        this.rankingPanel.destroy();
        this.rankingPanel = null as any;
        this.isRankingVisible = false;
      }
    });
  }

  /**
   * 배경 장식용 마법 서클 생성
   */
  private createMagicCircles(width: number, height: number): void {
    const circles = this.add.graphics();
    circles.setScrollFactor(0);
    circles.setAlpha(0.1);

    // 중앙 큰 서클
    circles.lineStyle(2, 0x6366f1, 0.3);
    circles.strokeCircle(width / 2, height / 2, 200);

    circles.lineStyle(1, 0x818cf8, 0.2);
    circles.strokeCircle(width / 2, height / 2, 250);

    // 회전 애니메이션
    this.tweens.add({
      targets: circles,
      angle: 360,
      duration: 60000,
      repeat: -1,
      ease: Phaser.Math.Easing.Linear
    });
  }

  /**
   * 버튼 호버 애니메이션
   */
  private animateButtonHover(
    bg: Phaser.GameObjects.Graphics,
    text: Phaser.GameObjects.Text,
    icon: Phaser.GameObjects.Text,
    isHover: boolean
  ): void {
    const scale = isHover ? 1.08 : 1;
    const textColor = isHover ? '#fef08a' : '#ffffff';

    bg.clear();

    // 그림자
    bg.fillStyle(0x000000, isHover ? 0.5 : 0.4);
    bg.fillRoundedRect(-124, -34, 248, 68, 16);

    // 메인 배경 (호버 시 더 밝게)
    bg.fillStyle(isHover ? 0x2563eb : 0x1e3a5f, 1);
    bg.fillRoundedRect(-120, -30, 240, 60, 14);

    // 보더 (호버 시 글로우)
    bg.lineStyle(isHover ? 3 : 2, isHover ? 0x60a5fa : 0x3b82f6, 1);
    bg.strokeRoundedRect(-120, -30, 240, 60, 14);

    // 상단 하이라이트
    bg.fillStyle(isHover ? 0x93c5fd : 0x60a5fa, 0.8);
    bg.fillRoundedRect(-120, -30, 240, 4, { tl: 14, tr: 14, bl: 0, br: 0 });

    text.setScale(scale);
    text.setColor(textColor);
    icon.setScale(scale);
  }

  /**
   * 버튼 프레스 애니메이션
   */
  private animateButtonPress(bg: Phaser.GameObjects.Graphics): void {
    bg.clear();
    bg.fillStyle(0x1d4ed8, 1);
    bg.fillRoundedRect(-118, -28, 236, 56, 12);
    bg.lineStyle(2, 0x3b82f6, 1);
    bg.strokeRoundedRect(-118, -28, 236, 56, 12);
  }

  startGame(): void {
    // Stop any running tweens
    this.tweens.killAll();

    // Transition to game scene
    this.scene.start('GameScene');
  }

  update(): void {
    // Hover effect
    const pointer = this.input.activePointer;
    if (pointer.x > 0 && pointer.x < this.cameras.main.width &&
        pointer.y > 0 && pointer.y < this.cameras.main.height) {
      // Check if hovering over button area
      const buttonX = this.cameras.main.width / 2;
      const buttonY = this.cameras.main.height / 2 + 50;
      const dx = pointer.x - buttonX;
      const dy = pointer.y - buttonY;
      if (Math.abs(dx) < 100 && Math.abs(dy) < 25) {
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = 'default';
      }
    }
  }
}
