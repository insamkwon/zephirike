import Phaser from 'phaser';

/**
 * AssetGenerator - 프로그래매틱하게 게임 리소스 생성
 * Phaser Graphics를 사용하여 실제 리소스와 유사한 텍스처 생성
 * 나중에 실제 리소스로 교체하기 쉽도록 설계
 */
export class AssetGenerator {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 모든 게임 리소스 생성
   */
  generateAllAssets(): void {
    this.generateBackgroundTiles();
    this.generateObstacleSprites();
    this.generatePlayerSprite();
    this.generateEnemySprites();
    this.generateBossSprite();
    this.generateProjectileSprites();
    this.generateItemSprites();
    this.generateParticleTextures();
  }

  // ==================== BACKGROUND TILES ====================

  /**
   * 배경 타일 생성 (타일맵용)
   */
  private generateBackgroundTiles(): void {
    // 기본 바닥 타일 (어두운 돌 바닥)
    this.generateFloorTile();

    // 그리드 라인 타일 (배경 패턴용)
    this.generateGridTile();

    // 벽 타일
    this.generateWallTile();
  }

  /**
   * 기본 바닥 타일 (매우 밝은 색상으로 변경)
   */
  private generateFloorTile(): void {
    const key = 'floor_tile';
    if (this.scene.textures.exists(key)) return;

    const tileSize = 64;
    const canvas = this.scene.textures.createCanvas(key, tileSize, tileSize);

    if (!canvas) return;

    const ctx = canvas.getContext();

    // 기본 배경 (매우 밝은 녹-회색 톤)
    ctx.fillStyle = '#4a5a4a';
    ctx.fillRect(0, 0, tileSize, tileSize);

    // 돌 패턴 (밝은 색상)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const x = i * 22 + 2;
        const y = j * 22 + 2;
        const w = 18;
        const h = 18;

        // 돌 기본 색상 (밝은 녹-회색)
        const shade = Math.random() * 15;
        ctx.fillStyle = `rgb(${70 + shade}, ${90 + shade}, ${75 + shade})`;
        ctx.fillRect(x, y, w, h);

        // 돌 가장자리 (밝은 테두리)
        ctx.strokeStyle = '#5a6a5a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);

        // 돌 텍스처 (작은 점들)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let k = 0; k < 3; k++) {
          const dotX = x + 3 + Math.random() * 12;
          const dotY = y + 3 + Math.random() * 12;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    canvas.refresh();
  }

  /**
   * 그리드 라인 타일 (배경 패턴)
   */
  private generateGridTile(): void {
    const key = 'grid_tile';
    if (this.scene.textures.exists(key)) return;

    const tileSize = 64;
    const canvas = this.scene.textures.createCanvas(key, tileSize, tileSize);

    if (!canvas) return;

    const ctx = canvas.getContext();

    // 투명 배경
    ctx.clearRect(0, 0, tileSize, tileSize);

    // 미세한 그리드 라인
    ctx.strokeStyle = 'rgba(100, 100, 150, 0.1)';
    ctx.lineWidth = 1;

    // 바깥 테두리
    ctx.strokeRect(0, 0, tileSize, tileSize);

    // 십자 라인
    ctx.beginPath();
    ctx.moveTo(tileSize / 2, 0);
    ctx.lineTo(tileSize / 2, tileSize);
    ctx.moveTo(0, tileSize / 2);
    ctx.lineTo(tileSize, tileSize / 2);
    ctx.stroke();

    canvas.refresh();
  }

  /**
   * 벽 타일
   */
  private generateWallTile(): void {
    const key = 'wall_tile';
    if (this.scene.textures.exists(key)) return;

    const tileSize = 64;
    const canvas = this.scene.textures.createCanvas(key, tileSize, tileSize);

    if (!canvas) return;

    const ctx = canvas.getContext();

    // 벽 기본 색상
    ctx.fillStyle = '#2d2d44';
    ctx.fillRect(0, 0, tileSize, tileSize);

    // 벽돌 패턴
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;

    const brickHeight = 16;
    const brickWidth = 32;

    for (let row = 0; row < 4; row++) {
      const offset = (row % 2) * (brickWidth / 2);
      for (let col = -1; col < 3; col++) {
        const x = col * brickWidth + offset;
        const y = row * brickHeight;
        ctx.strokeRect(x, y, brickWidth, brickHeight - 2);

        // 벽돌 텍스처
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(x + 2, y + 2, 4, 4);
      }
    }

    canvas.refresh();
  }

  // ==================== OBSTACLE SPRITES ====================

  /**
   * 장애물 스프라이트 생성
   */
  private generateObstacleSprites(): void {
    this.generateRockObstacle();
    this.generateTreeObstacle();
    this.generateWallObstacle();
    this.generateDebrisObstacle();
  }

  /**
   * 바위 장애물
   */
  private generateRockObstacle(): void {
    const sizes = [32, 48, 64];
    const sizes_px = sizes.map(s => s * 2);

    sizes_px.forEach((size) => {
      const key = `rock_${size}`;
      if (this.scene.textures.exists(key)) return;

      const canvas = this.scene.textures.createCanvas(key, size, size);

      if (!canvas) return;

      const ctx = canvas.getContext();
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2 - 4;

      // 바위 그림자
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(centerX + 3, centerY + 3, radius, radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // 바위 기본 형태 (매우 어두운 색상)
      ctx.fillStyle = '#1a1510';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX + radius * 0.8, centerY - radius * 0.3);
      ctx.lineTo(centerX + radius, centerY + radius * 0.2);
      ctx.lineTo(centerX + radius * 0.6, centerY + radius);
      ctx.lineTo(centerX - radius * 0.5, centerY + radius * 0.8);
      ctx.lineTo(centerX - radius, centerY + radius * 0.3);
      ctx.lineTo(centerX - radius * 0.7, centerY - radius * 0.5);
      ctx.closePath();
      ctx.fill();

      // 바위 하이라이트
      ctx.fillStyle = '#2a2520';
      ctx.beginPath();
      ctx.moveTo(centerX - radius * 0.5, centerY - radius * 0.3);
      ctx.lineTo(centerX, centerY - radius * 0.6);
      ctx.lineTo(centerX + radius * 0.3, centerY - radius * 0.4);
      ctx.lineTo(centerX, centerY);
      ctx.closePath();
      ctx.fill();

      // 바위 그림자 영역
      ctx.fillStyle = '#0a0500';
      ctx.beginPath();
      ctx.moveTo(centerX + radius * 0.3, centerY + radius * 0.2);
      ctx.lineTo(centerX + radius * 0.6, centerY + radius);
      ctx.lineTo(centerX - radius * 0.3, centerY + radius * 0.7);
      ctx.lineTo(centerX, centerY + radius * 0.3);
      ctx.closePath();
      ctx.fill();

      // 밝은 외곽선 (가독성 향상)
      ctx.strokeStyle = '#8a7a6a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX + radius * 0.8, centerY - radius * 0.3);
      ctx.lineTo(centerX + radius, centerY + radius * 0.2);
      ctx.lineTo(centerX + radius * 0.6, centerY + radius);
      ctx.lineTo(centerX - radius * 0.5, centerY + radius * 0.8);
      ctx.lineTo(centerX - radius, centerY + radius * 0.3);
      ctx.lineTo(centerX - radius * 0.7, centerY - radius * 0.5);
      ctx.closePath();
      ctx.stroke();

      // 균열 텍스처
      ctx.strokeStyle = '#0a0500';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - 5, centerY - 5);
      ctx.lineTo(centerX + 3, centerY + 5);
      ctx.stroke();

      canvas.refresh();
    });
  }

  /**
   * 나무 장애물
   */
  private generateTreeObstacle(): void {
    const key = 'tree';
    if (this.scene.textures.exists(key)) return;

    const size = 64;
    const canvas = this.scene.textures.createCanvas(key, size, size);

    if (!canvas) return;

    const ctx = canvas.getContext();
    const centerX = size / 2;
    const centerY = size / 2;

    // 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 25, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 나무 기둥
    const trunkGradient = ctx.createLinearGradient(centerX - 6, centerY, centerX + 6, centerY);
    trunkGradient.addColorStop(0, '#4a3728');
    trunkGradient.addColorStop(0.5, '#6b4423');
    trunkGradient.addColorStop(1, '#3a2718');
    ctx.fillStyle = trunkGradient;
    ctx.fillRect(centerX - 6, centerY + 5, 12, 25);

    // 나무 껍질 텍스처
    ctx.strokeStyle = '#2a1708';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = centerY + 8 + i * 4;
      ctx.beginPath();
      ctx.moveTo(centerX - 5, y);
      ctx.lineTo(centerX + 5, y + 2);
      ctx.stroke();
    }

    // 나뭇잎 (여러 겹) - 매우 진한 녹색
    const leafLayers = [
      { y: centerY - 10, r: 22, color: '#0a2a05' },
      { y: centerY - 18, r: 18, color: '#1a3a15' },
      { y: centerY - 24, r: 14, color: '#2a5a25' }
    ];

    leafLayers.forEach((layer, i) => {
      // 그림자
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(centerX + 3, layer.y + 3, layer.r, 0, Math.PI * 2);
      ctx.fill();

      // 나뭇잎
      const leafGradient = ctx.createRadialGradient(
        centerX - 5, layer.y - 5, 0,
        centerX, layer.y, layer.r
      );
      leafGradient.addColorStop(0, i === leafLayers.length - 1 ? '#3aba35' : layer.color);
      leafGradient.addColorStop(1, layer.color);
      ctx.fillStyle = leafGradient;
      ctx.beginPath();
      ctx.arc(centerX, layer.y, layer.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // 밝은 외곽선 (가독성 향상)
    ctx.strokeStyle = '#8aba85';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY - 18, 22, 0, Math.PI * 2);
    ctx.stroke();

    // 나뭇잎 하이라이트
    ctx.fillStyle = 'rgba(60, 140, 60, 0.5)';
    ctx.beginPath();
    ctx.arc(centerX - 8, centerY - 28, 5, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  /**
   * 벽 장애물 (돌벽)
   */
  private generateWallObstacle(): void {
    const variants = ['h', 'v']; // horizontal, vertical

    variants.forEach(variant => {
      const key = `wall_${variant}`;
      if (this.scene.textures.exists(key)) return;

      const width = variant === 'h' ? 80 : 32;
      const height = variant === 'h' ? 32 : 80;
      const canvas = this.scene.textures.createCanvas(key, width, height);

      if (!canvas) return;

      const ctx = canvas.getContext();

      // 기본 배경 - 매우 어두운 색상
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(0, 0, width, height);

      // 벽돌 패턴
      const brickW = variant === 'h' ? 20 : 16;
      const brickH = variant === 'h' ? 16 : 20;
      const rows = Math.ceil(height / brickH);
      const cols = Math.ceil(width / brickW);

      for (let row = 0; row < rows; row++) {
        const offset = (row % 2) * (brickW / 2);
        for (let col = -1; col < cols + 1; col++) {
          const x = col * brickW + offset;
          const y = row * brickH;

          // 벽돌 - 매우 어두운 회색
          const shade = (row + col) % 3;
          ctx.fillStyle = shade === 0 ? '#2a2a3a' : shade === 1 ? '#1a1a2a' : '#0a0a1a';
          ctx.fillRect(x, y, brickW - 2, brickH - 2);

          // 벽돌 테두리
          ctx.strokeStyle = '#050510';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, brickW - 2, brickH - 2);
        }
      }

      // 밝은 외곽선 (가독성 향상)
      ctx.strokeStyle = '#7a7a8a';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, width - 4, height - 4);

      // 상단 하이라이트
      ctx.fillStyle = 'rgba(150, 150, 180, 0.2)';
      ctx.fillRect(0, 0, width, 3);

      // 하단 그림자
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, height - 3, width, 3);

      canvas.refresh();
    });
  }

  /**
   * 잔해 장애물 (파괴 가능)
   */
  private generateDebrisObstacle(): void {
    const key = 'debris';
    if (this.scene.textures.exists(key)) return;

    const size = 40;
    const canvas = this.scene.textures.createCanvas(key, size, size);

    if (!canvas) return;

    const ctx = canvas.getContext();
    const centerX = size / 2;
    const centerY = size / 2;

    // 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 15, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 나무 판자 기본 - 매우 어두운 갈색
    ctx.fillStyle = '#1a0a05';
    ctx.fillRect(centerX - 15, centerY - 10, 30, 20);

    // 나무 결
    ctx.strokeStyle = '#0a0502';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(centerX - 12, centerY - 6 + i * 5);
      ctx.lineTo(centerX + 12, centerY - 5 + i * 5);
      ctx.stroke();
    }

    // 균열 (파괴 가능 표시) - 매우 어두운 색상
    ctx.strokeStyle = '#000502';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 5, centerY - 8);
    ctx.lineTo(centerX, centerY);
    ctx.lineTo(centerX + 5, centerY + 8);
    ctx.stroke();

    // 못
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(centerX - 8, centerY - 3, 2, 0, Math.PI * 2);
    ctx.arc(centerX + 8, centerY + 3, 2, 0, Math.PI * 2);
    ctx.fill();

    // 하이라이트
    ctx.fillStyle = 'rgba(80, 40, 10, 0.3)';
    ctx.fillRect(centerX - 14, centerY - 9, 28, 3);

    // 밝은 외곽선 (가독성 향상)
    ctx.strokeStyle = '#8a6a4a';
    ctx.lineWidth = 3;
    ctx.strokeRect(centerX - 16, centerY - 11, 32, 22);

    // 붉은 테두리 (파괴 가능 표시) - 더 명확하게
    ctx.strokeStyle = 'rgba(255, 80, 80, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - 16, centerY - 11, 32, 22);

    canvas.refresh();
  }

  // ==================== PLAYER SPRITE ====================

  /**
   * 플레이어 스프라이트 생성 (사람 형태 - 궁수/전사)
   * 상체가 명확하게 보이는 인간형 캐릭터
   */
  private generatePlayerSprite(): void {
    const key = 'player_hero';
    if (this.scene.textures.exists(key)) return;

    const size = 64;
    const canvas = this.scene.textures.createCanvas(key, size, size);

    if (!canvas) return;

    const ctx = canvas.getContext();
    const centerX = size / 2;
    const centerY = size / 2;

    // 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 22, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // ===== 다리/하체 =====
    // 왼쪽 다리
    ctx.fillStyle = '#2a3a5a';
    ctx.fillRect(centerX - 8, centerY + 6, 6, 14);
    // 오른쪽 다리
    ctx.fillRect(centerX + 2, centerY + 6, 6, 14);

    // ===== 몸통 (갑옷) =====
    const bodyGradient = ctx.createLinearGradient(centerX - 10, centerY - 10, centerX + 10, centerY + 10);
    bodyGradient.addColorStop(0, '#4a6a9a');
    bodyGradient.addColorStop(0.5, '#3a5a8a');
    bodyGradient.addColorStop(1, '#2a4a7a');
    ctx.fillStyle = bodyGradient;

    // 갑옷 형태 (어깨 넓은 형태)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 18); // 목 아래
    ctx.lineTo(centerX + 14, centerY - 12); // 오른쪽 어깨
    ctx.lineTo(centerX + 12, centerY + 8); // 오른쪽 옆구리
    ctx.lineTo(centerX, centerY + 10); // 중앙 아래
    ctx.lineTo(centerX - 12, centerY + 8); // 왼쪽 옆구리
    ctx.lineTo(centerX - 14, centerY - 12); // 왼쪽 어깨
    ctx.closePath();
    ctx.fill();

    // 갑옷 디테일 (가슴띠)
    ctx.strokeStyle = '#1a2a4a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 12, centerY - 4);
    ctx.lineTo(centerX + 12, centerY - 4);
    ctx.stroke();

    // 벨트
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(centerX - 12, centerY + 4, 24, 4);
    // 벨트 버클
    ctx.fillStyle = '#8a7a6a';
    ctx.fillRect(centerX - 3, centerY + 4, 6, 4);

    // ===== 머리 =====
    // 머리 형태 (약간 긴 타원)
    const headGradient = ctx.createRadialGradient(centerX - 2, centerY - 20, 0, centerX, centerY - 18, 14);
    headGradient.addColorStop(0, '#ffdbac');
    headGradient.addColorStop(0.8, '#f5c69a');
    headGradient.addColorStop(1, '#e5b08a');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY - 18, 11, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // 머리카락 (밝은 갈색)
    ctx.fillStyle = '#6a5a4a';
    ctx.beginPath();
    ctx.arc(centerX, centerY - 22, 11, Math.PI, 0);
    ctx.fill();

    // 머리카락 텍스처
    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const hairX = centerX - 8 + i * 4;
      ctx.moveTo(hairX, centerY - 22);
      ctx.lineTo(hairX + (Math.random() - 0.5) * 2, centerY - 18);
      ctx.stroke();
    }

    // ===== 눈 =====
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(centerX - 4, centerY - 18, 3, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(centerX + 4, centerY - 18, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 눈동자 (갈색)
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.arc(centerX - 4, centerY - 18, 1.5, 0, Math.PI * 2);
    ctx.arc(centerX + 4, centerY - 18, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 눈 하이라이트
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 19, 0.8, 0, Math.PI * 2);
    ctx.arc(centerX + 5, centerY - 19, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // ===== 활과 화살 (손에 들고 있음) =====
    // 활 (오른쪽)
    const bowColor = '#7a5a3a';
    ctx.strokeStyle = bowColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX + 18, centerY - 4, 12, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.stroke();

    // 활시위
    ctx.strokeStyle = '#9a8a7a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX + 6, centerY - 14);
    ctx.lineTo(centerX + 6, centerY + 6);
    ctx.stroke();

    // ===== 팔 =====
    // 왼쪽 팔 (활을 잡은 모습)
    ctx.fillStyle = '#3a5a8a';
    ctx.beginPath();
    ctx.moveTo(centerX - 12, centerY - 10);
    ctx.lineTo(centerX - 16, centerY - 2);
    ctx.lineTo(centerX - 14, centerY + 4);
    ctx.lineTo(centerX - 10, centerY);
    ctx.closePath();
    ctx.fill();

    // 오른쪽 팔
    ctx.beginPath();
    ctx.moveTo(centerX + 12, centerY - 10);
    ctx.lineTo(centerX + 18, centerY - 6);
    ctx.lineTo(centerX + 20, centerY);
    ctx.lineTo(centerX + 14, centerY);
    ctx.closePath();
    ctx.fill();

    // ===== 갑옷 어깨 장식 =====
    ctx.fillStyle = '#5a7aaa';
    ctx.beginPath();
    ctx.arc(centerX - 14, centerY - 12, 3, 0, Math.PI * 2);
    ctx.arc(centerX + 14, centerY - 12, 3, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  // ==================== ENEMY SPRITES ====================

  /**
   * 적 스프라이트 생성 (슬라임, 해골, 박쥐)
   */
  private generateEnemySprites(): void {
    this.generateSlimeSprite();
    this.generateSkeletonSprite();
    this.generateBatSprite();
  }

  /**
   * 슬라임 스프라이트 (기본 적)
   */
  private generateSlimeSprite(): void {
    const key = 'slime';
    if (this.scene.textures.exists(key)) return;

    const size = 32;
    const canvas = this.scene.textures.createCanvas(key, size, size);

    if (!canvas) return;

    const ctx = canvas.getContext();
    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size / 2 - 4;

    // 그림자
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 2, baseRadius, baseRadius, 0, 0, Math.PI * 2);
    ctx.fill();

    // 몸통 (녹색)
    ctx.fillStyle = '#44cc44';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 2, baseRadius - 2, baseRadius + 1, 0, 0, Math.PI * 2);
    ctx.fill();

    // 하이라이트 (밝은 녹색)
    ctx.fillStyle = '#88ff88';
    ctx.beginPath();
    ctx.ellipse(centerX - 4, centerY - 2, 4, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // 눈
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - 5, centerY - 2, 3, 0, Math.PI * 2);
    ctx.arc(centerX + 5, centerY - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // 눈 하이라이트
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX - 4, centerY - 3, 1, 0, Math.PI * 2);
    ctx.arc(centerX + 6, centerY - 3, 1, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  /**
   * 해골 스프라이트 (중간 적)
   */
  private generateSkeletonSprite(): void {
    const key = 'skeleton';
    if (this.scene.textures.exists(key)) return;

    const size = 40;
    const canvas = this.scene.textures.createCanvas(key, size, size);

    if (!canvas) return;

    const ctx = canvas.getContext();
    const centerX = size / 2;
    const centerY = size / 2;

    // 머리
    ctx.fillStyle = '#ddddcc';
    ctx.beginPath();
    ctx.arc(centerX, centerY - 12, 8, 0, Math.PI * 2);
    ctx.fill();

    // 눈구멍
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 13, 2, 0, Math.PI * 2);
    ctx.arc(centerX + 3, centerY - 13, 2, 0, Math.PI * 2);
    ctx.fill();

    // 노란 눈빛
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 13, 1, 0, Math.PI * 2);
    ctx.arc(centerX + 3, centerY - 13, 1, 0, Math.PI * 2);
    ctx.fill();

    // 몸통 (척추)
    ctx.fillStyle = '#ccccbb';
    ctx.fillRect(centerX - 3, centerY - 4, 6, 12);

    // 갈비뼈
    ctx.fillRect(centerX - 8, centerY - 2, 16, 2);
    ctx.fillRect(centerX - 7, centerY + 2, 14, 2);
    ctx.fillRect(centerX - 6, centerY + 6, 12, 2);

    // 팔
    ctx.fillRect(centerX - 12, centerY - 2, 4, 2);
    ctx.fillRect(centerX + 8, centerY - 2, 4, 2);

    // 다리
    ctx.fillRect(centerX - 5, centerY + 8, 3, 8);
    ctx.fillRect(centerX + 2, centerY + 8, 3, 8);

    canvas.refresh();
  }

  /**
   * 박쥐 스프라이트 (빠른 적)
   */
  private generateBatSprite(): void {
    const key = 'bat';
    if (this.scene.textures.exists(key)) return;

    const size = 36;
    const canvas = this.scene.textures.createCanvas(key, size, size);

    if (!canvas) return;

    const ctx = canvas.getContext();
    const centerX = size / 2;
    const centerY = size / 2;

    // 몸통
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 왼쪽 날개 (올림간 상태)
    ctx.fillStyle = '#444444';
    ctx.beginPath();
    ctx.moveTo(centerX - 4, centerY);
    ctx.lineTo(centerX - 12, centerY - 3);
    ctx.lineTo(centerX - 4, centerY + 4);
    ctx.closePath();
    ctx.fill();

    // 오른쪽 날개
    ctx.beginPath();
    ctx.moveTo(centerX + 4, centerY);
    ctx.lineTo(centerX + 12, centerY - 3);
    ctx.lineTo(centerX + 4, centerY + 4);
    ctx.closePath();
    ctx.fill();

    // 귀
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.moveTo(centerX - 3, centerY - 6);
    ctx.lineTo(centerX - 5, centerY - 10);
    ctx.lineTo(centerX - 1, centerY - 6);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX + 3, centerY - 6);
    ctx.lineTo(centerX + 5, centerY - 10);
    ctx.lineTo(centerX + 1, centerY - 6);
    ctx.fill();

    // 붉은 눈
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(centerX - 2, centerY - 4, 1.5, 0, Math.PI * 2);
    ctx.arc(centerX + 2, centerY - 4, 1.5, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  // ==================== BOSS SPRITE ====================

  /**
   * 보스 스프라이트 생성
   */
  private generateBossSprite(): void {
    const key = 'boss';
    if (this.scene.textures.exists(key)) return;

    const size = 80;
    const canvas = this.scene.textures.createCanvas(key, size, size);

    if (!canvas) return;

    const ctx = canvas.getContext();
    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size / 2 - 4;

    // 외부 광효과 (보라색)
    const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, baseRadius);
    gradient.addColorStop(0, 'rgba(136, 0, 255, 0.6)');
    gradient.addColorStop(0.7, 'rgba(102, 0, 204, 0.3)');
    gradient.addColorStop(1, 'rgba(68, 0, 136, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
    ctx.fill();

    // 몸통
    ctx.fillStyle = '#6600cc';
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius - 8, 0, Math.PI * 2);
    ctx.fill();

    // 갑옷 패턴
    ctx.strokeStyle = '#8833dd';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius - 12, angle, angle + 0.3);
      ctx.stroke();
    }

    // 눈 (빛나는 붉은색)
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(centerX - 10, centerY - 8, 6, 0, Math.PI * 2);
    ctx.arc(centerX + 10, centerY - 8, 6, 0, Math.PI * 2);
    ctx.fill();

    // 눈 하이라이트
    ctx.fillStyle = '#ff6666';
    ctx.beginPath();
    ctx.arc(centerX - 8, centerY - 10, 3, 0, Math.PI * 2);
    ctx.arc(centerX + 12, centerY - 10, 3, 0, Math.PI * 2);
    ctx.fill();

    // 입
    ctx.fillStyle = '#330066';
    ctx.beginPath();
    ctx.moveTo(centerX - 15, centerY + 10);
    ctx.lineTo(centerX, centerY + 18);
    ctx.lineTo(centerX + 15, centerY + 10);
    ctx.closePath();
    ctx.fill();

    // 손톱/발톱
    ctx.fillStyle = '#9933ff';
    for (let i = 0; i < 3; i++) {
      const clawAngle = -0.5 + (i * 0.5);
      ctx.beginPath();
      ctx.arc(centerX + Math.cos(clawAngle) * (baseRadius - 5),
              centerY + 10 + Math.sin(clawAngle) * 10,
              4, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 3; i++) {
      const clawAngle = Math.PI - 0.5 + (i * 0.5);
      ctx.beginPath();
      ctx.arc(centerX + Math.cos(clawAngle) * (baseRadius - 5),
              centerY + 10 + Math.sin(clawAngle) * 10,
              4, 0, Math.PI * 2);
      ctx.fill();
    }

    canvas.refresh();
  }

  // ==================== PROJECTILE SPRITES ====================

  /**
   * 투사체 스프라이트 생성
   */
  private generateProjectileSprites(): void {
    this.generateArrowProjectile();  // 원거리: 화살
    this.generateSwordSlash();       // 근거리: 검격 효과
  }

  /**
   * 화살 투사체 (원거리 공격용)
   */
  private generateArrowProjectile(): void {
    const key = 'projectile';
    if (this.scene.textures.exists(key)) return;

    const size = 48;
    const canvas = this.scene.textures.createCanvas(key, size, size);

    if (!canvas) return;

    const ctx = canvas.getContext();
    const centerX = size / 2;
    const centerY = size / 2;

    // 화살이 오른쪽을 향하도록 그림 (회전해서 사용)

    // 궤적 효과 (빛나는 자국)
    const trailGradient = ctx.createLinearGradient(0, centerY, centerX, centerY);
    trailGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    trailGradient.addColorStop(0.5, 'rgba(255, 220, 100, 0.3)');
    trailGradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
    ctx.fillStyle = trailGradient;

    // 궤적 형태
    ctx.beginPath();
    ctx.moveTo(4, centerY - 2);
    ctx.lineTo(centerX - 10, centerY);
    ctx.lineTo(4, centerY + 2);
    ctx.closePath();
    ctx.fill();

    // 화살대 (나무)
    ctx.fillStyle = '#8a6a4a';
    ctx.fillRect(0, centerY - 2, centerX, 4);

    // 화살대 디테일 (나무 결)
    ctx.strokeStyle = '#6a4a3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(centerX, centerY);
    ctx.stroke();

    // 깃털 (화살 뒷부분)
    ctx.fillStyle = '#c44';
    ctx.beginPath();
    ctx.moveTo(4, centerY);
    ctx.lineTo(-2, centerY - 6);
    ctx.lineTo(-2, centerY + 6);
    ctx.closePath();
    ctx.fill();

    // 깃털 하이라이트
    ctx.strokeStyle = '#f88';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(2, centerY);
    ctx.lineTo(-1, centerY - 4);
    ctx.stroke();

    // 화살촉 (금속)
    ctx.fillStyle = '#aaa';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 2);
    ctx.lineTo(centerX + 8, centerY - 4);
    ctx.lineTo(centerX + 14, centerY);
    ctx.lineTo(centerX + 8, centerY + 4);
    ctx.lineTo(centerX, centerY + 2);
    ctx.closePath();
    ctx.fill();

    // 화살촉 하이라이트
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(centerX + 2, centerY - 1);
    ctx.lineTo(centerX + 6, centerY - 2);
    ctx.lineTo(centerX + 10, centerY);
    ctx.lineTo(centerX + 6, centerY + 2);
    ctx.lineTo(centerX + 2, centerY + 1);
    ctx.closePath();
    ctx.fill();

    // 빛나는 효과 (화살촉 끝)
    ctx.fillStyle = 'rgba(255, 255, 200, 0.6)';
    ctx.beginPath();
    ctx.arc(centerX + 14, centerY, 4, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  /**
   * 근접 공격 효과 (검격 - 검은색 테두리와 흰색 내부)
   */
  private generateSwordSlash(): void {
    const key = 'slash';
    if (this.scene.textures.exists(key)) return;

    const size = 80;
    const canvas = this.scene.textures.createCanvas(key, size, size);

    if (!canvas) return;

    const ctx = canvas.getContext();
    const centerX = size / 2;
    const centerY = size / 2;

    // 바깥쪽 검은색 테두리 (강조)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, -Math.PI * 0.7, Math.PI * 0.5);
    ctx.stroke();

    // 중간층 (회색)
    ctx.strokeStyle = 'rgba(100, 100, 120, 0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 29, -Math.PI * 0.7, Math.PI * 0.5);
    ctx.stroke();

    // 내부 흰색 (날카로운 느낌)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 28, -Math.PI * 0.7, Math.PI * 0.5);
    ctx.stroke();

    // 빛나는 효과 (중심부)
    const glowGradient = ctx.createRadialGradient(centerX + 15, centerY, 0, centerX + 15, centerY, 20);
    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(centerX + 15, centerY, 20, 0, Math.PI * 2);
    ctx.fill();

    // 이동선 효과 (속도감)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const offset = i * 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 24 - offset, -Math.PI * 0.7, Math.PI * 0.5);
      ctx.stroke();
    }

    canvas.refresh();
  }

  // ==================== ITEM SPRITES ====================

  /**
   * 아이템 스프라이트 생성
   */
  private generateItemSprites(): void {
    this.generateGemSprites();
    this.generateHeartSprite();
  }

  /**
   * 경험치 보석 (초록, 파랑, 보라)
   */
  private generateGemSprites(): void {
    const colors = [
      { name: 'gem_green', color: '#44ff44', darkColor: '#228822' },
      { name: 'gem_blue', color: '#4488ff', darkColor: '#224488' },
      { name: 'gem_purple', color: '#aa44ff', darkColor: '#6622aa' }
    ];

    colors.forEach(({ name, color, darkColor }) => {
      if (this.scene.textures.exists(name)) return;

      const size = 16;
      const canvas = this.scene.textures.createCanvas(name, size, size);

      if (!canvas) return;

      const ctx = canvas.getContext();
      const centerX = size / 2;
      const centerY = size / 2;

      // 다이아몬드 형태
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 6);
      ctx.lineTo(centerX + 5, centerY);
      ctx.lineTo(centerX, centerY + 6);
      ctx.lineTo(centerX - 5, centerY);
      ctx.closePath();
      ctx.fill();

      // 하이라이트
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 6);
      ctx.lineTo(centerX + 2, centerY - 2);
      ctx.lineTo(centerX, centerY);
      ctx.lineTo(centerX - 2, centerY - 2);
      ctx.closePath();
      ctx.fill();

      // 그림자
      ctx.fillStyle = darkColor;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + 5, centerY);
      ctx.lineTo(centerX, centerY + 6);
      ctx.lineTo(centerX, centerY);
      ctx.closePath();
      ctx.fill();

      canvas.refresh();
    });
  }

  /**
   * HP 하트
   */
  private generateHeartSprite(): void {
    const key = 'heart';
    if (this.scene.textures.exists(key)) return;

    const size = 24;
    const canvas = this.scene.textures.createCanvas(key, size, size);

    if (!canvas) return;

    const ctx = canvas.getContext();
    const centerX = size / 2;
    const centerY = size / 2;

    // 하트 모양
    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 6);
    ctx.bezierCurveTo(centerX, centerY + 2, centerX - 6, centerY - 2, centerX - 8, centerY - 4);
    ctx.bezierCurveTo(centerX - 10, centerY - 6, centerX - 10, centerY - 10, centerX - 6, centerY - 10);
    ctx.bezierCurveTo(centerX - 2, centerY - 10, centerX, centerY - 6, centerX, centerY - 4);
    ctx.bezierCurveTo(centerX, centerY - 6, centerX + 2, centerY - 10, centerX + 6, centerY - 10);
    ctx.bezierCurveTo(centerX + 10, centerY - 10, centerX + 10, centerY - 6, centerX + 8, centerY - 4);
    ctx.bezierCurveTo(centerX + 6, centerY - 2, centerX, centerY + 2, centerX, centerY + 6);
    ctx.fill();

    // 하이라이트
    ctx.fillStyle = '#ff8888';
    ctx.beginPath();
    ctx.arc(centerX - 4, centerY - 6, 2, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  // ==================== PARTICLE TEXTURES ====================

  /**
   * 파티클 텍스처 생성
   */
  private generateParticleTextures(): void {
    this.generateExplosionParticle();
    this.generateSparkle();
  }

  /**
   * 폭발 파티클
   */
  private generateExplosionParticle(): void {
    const key = 'particle_explosion';
    if (this.scene.textures.exists(key)) return;

    const size = 8;
    const canvas = this.scene.textures.createCanvas(key, size, size);

    if (!canvas) return;

    const ctx = canvas.getContext();
    const centerX = size / 2;
    const centerY = size / 2;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
    gradient.addColorStop(0, '#ffaa00');
    gradient.addColorStop(0.5, '#ff6600');
    gradient.addColorStop(1, 'rgba(255, 102, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  /**
   * 반짝임 효과
   */
  private generateSparkle(): void {
    const key = 'sparkle';
    if (this.scene.textures.exists(key)) return;

    const size = 12;
    const canvas = this.scene.textures.createCanvas(key, size, size);

    if (!canvas) return;

    const ctx = canvas.getContext();
    const centerX = size / 2;
    const centerY = size / 2;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 4, centerY);
    ctx.lineTo(centerX + 4, centerY);
    ctx.moveTo(centerX, centerY - 4);
    ctx.lineTo(centerX, centerY + 4);
    ctx.stroke();

    canvas.refresh();
  }

  // ==================== HELPERS ====================

  /**
   * 생성된 리소스 키 목록 반환
   */
  static getAssetKeys(): string[] {
    return [
      // Background tiles
      'floor_tile',
      'grid_tile',
      'wall_tile',
      'wall_h',
      'wall_v',

      // Obstacles
      'rock_64',
      'rock_96',
      'rock_128',
      'tree',
      'debris',

      // Characters
      'player_hero',
      'slime',
      'skeleton',
      'bat',
      'boss',

      // Projectiles
      'projectile',
      'slash',

      // Items
      'gem_green',
      'gem_blue',
      'gem_purple',
      'heart',

      // Particles
      'particle_explosion',
      'sparkle'
    ];
  }
}
