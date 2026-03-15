import Phaser from 'phaser';

/**
 * HUDManager - 통합 HUD 관리자
 * 컴팩트하고 읽기 쉬운 모던 RPG UI
 */
export class HUDManager {
  private scene: Phaser.Scene;
  private leftPanel!: Phaser.GameObjects.Container;
  private rightPanel!: Phaser.GameObjects.Container;
  private hpBarBg!: Phaser.GameObjects.Graphics;
  private hpBarFill!: Phaser.GameObjects.Graphics;
  private hpBarGlow!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private xpBarBg!: Phaser.GameObjects.Graphics;
  private xpBarFill!: Phaser.GameObjects.Graphics;
  private xpText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private waveCounter!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;

  // 심박동 애니메이션 상태
  private isCriticalHP: boolean = false;
  private heartbeatTween?: Phaser.Tweens.Tween;

  // HP 바 색상
  private readonly HP_COLORS = {
    safe: 0x00e676,      // 밝은 녹색
    warning: 0xffab00,   // 밝은 주황
    danger: 0xff5252,    // 밝은 빨강
    critical: 0xff1744   // 핫핑크 (위험 시)
  };

  // XP 바 색상
  private readonly XP_COLOR = 0x2979ff;
  private readonly XP_GLOW = 0x448aff;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    this.createLeftPanel();
    this.createRightPanel();
  }

  /**
   * 왼쪽 패널 - 캐릭터 상태
   * 컴팩트하고 읽기 쉬운 모던 디자인
   */
  private createLeftPanel(): void {
    const panelX = 12;
    const panelY = 12;
    const panelWidth = 200;  // 220 → 200 (공격 모드 제거로 축소)
    const panelHeight = 68;  // 72 → 68

    this.leftPanel = this.scene.add.container(panelX, panelY);
    this.leftPanel.setScrollFactor(0);
    this.leftPanel.setDepth(100);

    // 패널 배경 (얇고 깔끔한 디자인)
    const panelBg = this.scene.add.graphics();
    panelBg.setScrollFactor(0);

    // 그림자 (얇게)
    panelBg.fillStyle(0x000000, 0.3);
    panelBg.fillRoundedRect(2, 2, panelWidth, panelHeight, 8);

    // 메인 배경 (반투명 어두운 배경)
    panelBg.fillStyle(0x0f0f1a, 0.75);
    panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight, 8);

    // 상단 강조 선 (얇고 섬세하게)
    panelBg.fillStyle(0x6366f1, 0.8);
    panelBg.fillRoundedRect(0, 0, panelWidth, 2, { tl: 8, tr: 8, bl: 0, br: 0 });

    // 테두리 (얇게)
    panelBg.lineStyle(1, 0x3f3f5a, 0.5);
    panelBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, 8);

    this.leftPanel.add(panelBg);

    // HP 바 영역
    this.createHPBar(panelWidth);

    // XP 바 영역
    this.createXPBar(panelWidth);

    // 하단 정보 행
    this.createInfoRow(panelWidth);

    this.scene.add.existing(this.leftPanel);
  }

  /**
   * HP 바 생성 - 개선된 가독성
   */
  private createHPBar(panelWidth: number): void {
    const barX = 8;
    const barY = 8;
    const barWidth = panelWidth - 16;
    const barHeight = 16;

    // HP 바 배경
    this.hpBarBg = this.scene.add.graphics();
    this.hpBarBg.fillStyle(0x1a1a2e, 1);
    this.hpBarBg.fillRoundedRect(barX, barY, barWidth, barHeight, 4);

    this.leftPanel.add(this.hpBarBg);

    // HP 바 글로우 효과 (위험 시 사용)
    this.hpBarGlow = this.scene.add.graphics();
    this.hpBarGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.leftPanel.add(this.hpBarGlow);

    // HP 바 필
    this.hpBarFill = this.scene.add.graphics();
    this.leftPanel.add(this.hpBarFill);

    // HP 텍스트 (더 크고 읽기 쉽게)
    this.hpText = this.scene.add.text(
      barX + barWidth / 2,
      barY + barHeight / 2,
      '100/100',
      {
        fontSize: '13px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    this.hpText.setOrigin(0.5);
    this.leftPanel.add(this.hpText);
  }

  /**
   * XP 바 생성
   */
  private createXPBar(panelWidth: number): void {
    const barX = 8;
    const barY = 26;
    const barWidth = panelWidth - 16;
    const barHeight = 4;

    // XP 바 배경
    this.xpBarBg = this.scene.add.graphics();
    this.xpBarBg.fillStyle(0x1a1a2e, 1);
    this.xpBarBg.fillRoundedRect(barX, barY, barWidth, barHeight, 2);
    this.leftPanel.add(this.xpBarBg);

    // XP 바 필
    this.xpBarFill = this.scene.add.graphics();
    this.leftPanel.add(this.xpBarFill);

    // XP 텍스트 (숨김)
    this.xpText = this.scene.add.text(0, 0, '', {
      fontSize: '1px',
      color: 'transparent'
    });
    this.leftPanel.add(this.xpText);
  }

  /**
   * 하단 정보 행 생성 - 컴팩트 레이아웃
   */
  private createInfoRow(panelWidth: number): void {
    const rowY = 38;
    const padding = 8;

    // 레벨 (왼쪽)
    this.levelText = this.scene.add.text(
      padding,
      rowY,
      'Lv.5',
      {
        fontSize: '16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#fbbf24',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    this.leftPanel.add(this.levelText);

    // 점수 (중앙, 더 크게)
    this.scoreText = this.scene.add.text(
      panelWidth / 2,
      rowY,
      '1,250',
      {
        fontSize: '16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    this.scoreText.setOrigin(0.5, 0);
    this.leftPanel.add(this.scoreText);
  }

  /**
   * 오른쪽 패널 - 게임 진행 정보 (웨이브 + 타이머)
   */
  private createRightPanel(): void {
    const panelWidth = 110;  // 100 → 110으로 확장 (한글 표시를 위해)
    const panelHeight = 62;  // 56 → 62로 확장
    const panelX = this.scene.cameras.main.width - panelWidth - 12;
    const panelY = 12;

    this.rightPanel = this.scene.add.container(panelX, panelY);
    this.rightPanel.setScrollFactor(0);
    this.rightPanel.setDepth(100);

    // 패널 배경
    const panelBg = this.scene.add.graphics();
    panelBg.setScrollFactor(0);

    // 그림자
    panelBg.fillStyle(0x000000, 0.4);
    panelBg.fillRoundedRect(2, 2, panelWidth, panelHeight, 8);

    // 메인 배경
    panelBg.fillStyle(0x0f0f1a, 0.85);
    panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight, 8);

    // 상단 강조 (웨이브 컬러 - 더 밝게)
    panelBg.fillStyle(0xff9500, 1);
    panelBg.fillRoundedRect(0, 0, panelWidth, 3, { tl: 8, tr: 8, bl: 0, br: 0 });

    // 테두리 (더 선명하게)
    panelBg.lineStyle(1.5, 0xff9500, 0.6);
    panelBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, 8);

    this.rightPanel.add(panelBg);

    // 웨이브 텍스트 (한글)
    this.waveText = this.scene.add.text(
      panelWidth / 2,
      7,
      '웨이브',
      {
        fontSize: '11px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", sans-serif',
        color: '#ffb347',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    this.waveText.setOrigin(0.5);
    this.rightPanel.add(this.waveText);

    // 웨이브 카운터 (더 크고 선명하게)
    this.waveCounter = this.scene.add.text(
      panelWidth / 2,
      24,
      '3',
      {
        fontSize: '26px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 3
      }
    );
    this.waveCounter.setOrigin(0.5);
    this.rightPanel.add(this.waveCounter);

    // 타이머
    this.timerText = this.scene.add.text(
      panelWidth / 2,
      46,
      '05:23',
      {
        fontSize: '16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", monospace',
        color: '#4ade80',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    this.timerText.setOrigin(0.5);
    this.rightPanel.add(this.timerText);

    this.scene.add.existing(this.rightPanel);
  }

  /**
   * HP 업데이트
   */
  updateHP(current: number, max: number): void {
    const percent = Math.max(0, Math.min(1, current / max));
    const barWidth = 184; // panelWidth(200) - 16
    const barHeight = 16;
    const barX = 8;
    const barY = 8;

    // HP %에 따른 색상 결정
    let fillColor = this.HP_COLORS.safe;
    let isCritical = false;

    if (percent <= 0.25) {
      fillColor = this.HP_COLORS.critical;
      isCritical = true;
    } else if (percent <= 0.5) {
      fillColor = this.HP_COLORS.warning;
    } else if (percent <= 0.75) {
      fillColor = this.HP_COLORS.danger;
    }

    // HP 바 그리기
    this.hpBarFill.clear();

    // 글로우 효과 (위험 시)
    if (isCritical) {
      this.hpBarGlow.clear();
      this.hpBarGlow.fillStyle(0xff1744, 0.3);
      this.hpBarGlow.fillRoundedRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 6);
    } else {
      this.hpBarGlow.clear();
    }

    // 메인 바
    const fillWidth = Math.max(4, barWidth * percent);
    this.hpBarFill.fillStyle(fillColor, 1);
    this.hpBarFill.fillRoundedRect(barX, barY, fillWidth, barHeight, 4);

    // 하이라이트 (상단)
    this.hpBarFill.fillStyle(0xffffff, 0.3);
    this.hpBarFill.fillRoundedRect(barX, barY, fillWidth, 2, { tl: 4, tr: 4, bl: 0, br: 0 });

    // HP 텍스트 업데이트
    this.hpText.setText(`${Math.ceil(current)}/${max}`);

    // 텍스트 색상도 HP 상태에 따라 변경
    const textColor = isCritical ? '#ff6b6b' : '#ffffff';
    this.hpText.setColor(textColor);

    // 위험 상태 변경 시 심박동 효과 토글
    if (isCritical && !this.isCriticalHP) {
      this.startHeartbeat();
    } else if (!isCritical && this.isCriticalHP) {
      this.stopHeartbeat();
    }
    this.isCriticalHP = isCritical;
  }

  /**
   * 심박동 효과 시작
   */
  private startHeartbeat(): void {
    if (this.heartbeatTween) {
      this.heartbeatTween.destroy();
    }

    this.heartbeatTween = this.scene.tweens.add({
      targets: [this.hpBarFill, this.hpBarBg, this.hpText],
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: Phaser.Math.Easing.Sine.InOut
    });

    this.scene.tweens.add({
      targets: this.hpText,
      alpha: 0.6,
      duration: 300,
      yoyo: true,
      repeat: -1
    });
  }

  /**
   * 심박동 효과 중지
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTween) {
      this.heartbeatTween.destroy();
      this.heartbeatTween = undefined;
    }

    this.scene.tweens.killTweensOf([this.hpBarFill, this.hpBarBg, this.hpText]);
    this.hpBarFill.setScale(1);
    this.hpBarBg.setScale(1);
    this.hpText.setAlpha(1);
  }

  /**
   * XP 업데이트
   */
  updateXP(current: number, required: number): void {
    const percent = Math.max(0, Math.min(1, current / required));
    const barWidth = 184;
    const barHeight = 4;
    const barX = 8;
    const barY = 26;

    this.xpBarFill.clear();

    const fillWidth = Math.max(2, barWidth * percent);

    // 그라데이션 효과
    this.xpBarFill.fillStyle(this.XP_GLOW, 1);
    this.xpBarFill.fillRoundedRect(barX, barY, fillWidth, barHeight / 2, { tl: 2, tr: 2, bl: 0, br: 0 });

    this.xpBarFill.fillStyle(this.XP_COLOR, 1);
    this.xpBarFill.fillRoundedRect(barX, barY + 2, fillWidth, barHeight / 2, { tl: 0, tr: 0, bl: 2, br: 2 });
  }

  /**
   * 레벨 업데이트
   */
  updateLevel(level: number): void {
    this.levelText.setText(`Lv.${level}`);

    this.scene.tweens.add({
      targets: this.levelText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 150,
      yoyo: true,
      ease: Phaser.Math.Easing.Back.Out
    });
  }

  /**
   * 점수 업데이트
   */
  updateScore(score: number): void {
    this.scoreText.setText(`${score.toLocaleString()}`);
  }

  /**
   * 웨이브 업데이트
   */
  updateWave(wave: number, _killed: number, _total: number): void {
    this.waveCounter.setText(`${wave}`);

    this.scene.tweens.add({
      targets: this.waveCounter,
      scale: 1.2,
      duration: 100,
      yoyo: true,
      ease: Phaser.Math.Easing.Quadratic.Out
    });
  }

  /**
   * 타이머 업데이트
   */
  updateTimer(timeText: string): void {
    this.timerText.setText(timeText);

    const [minutes, seconds] = timeText.split(':').map(Number);
    const totalSeconds = minutes * 60 + seconds;

    if (totalSeconds < 30) {
      this.timerText.setColor('#ef4444');
    } else if (totalSeconds < 60) {
      this.timerText.setColor('#fbbf24');
    } else {
      this.timerText.setColor('#4ade80');
    }
  }

  /**
   * 화면 크기 변경 시 오른쪽 패널 위치 재조정
   */
  resize(): void {
    const panelWidth = 110;
    const panelX = this.scene.cameras.main.width - panelWidth - 12;
    this.rightPanel.setX(panelX);
  }

  /**
   * 파괴
   */
  destroy(): void {
    this.stopHeartbeat();
    this.leftPanel.destroy();
    this.rightPanel.destroy();
  }
}
