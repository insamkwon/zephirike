import Phaser from 'phaser';

/**
 * Main Menu Scene - Game start screen
 * Retro Arcade Fantasy RPG 스타일
 */
export class MenuScene extends Phaser.Scene {
  private startButton!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private titleContainer!: Phaser.GameObjects.Container;

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

    // 안내 텍스트 - 하단
    const controlsHint = this.add.text(width / 2, height - 30, 'WASD: 이동  |  마우스: 공격 방향', {
      fontSize: '14px',
      color: '#64748b',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    });
    controlsHint.setOrigin(0.5);

    // 스페이스바로 시작
    this.input.keyboard!.on('keydown-SPACE', () => {
      this.startGame();
    });

    // 엔터키로도 시작
    this.input.keyboard!.on('keydown-ENTER', () => {
      this.startGame();
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
