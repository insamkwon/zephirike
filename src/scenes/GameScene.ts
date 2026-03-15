import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { Obstacle, ObstacleConfig } from '../entities/Obstacle';
import { PlayerConfig, EnemyConfig, EnemyType, BossConfig, TimerEventData, WeaponUpgrade } from '../types/GameTypes';
import { ParticleManager, ParticleType } from '../systems/ParticleManager';
import { GameTimer } from '../systems/GameTimer';
import { WeaponModal } from '../ui/WeaponModal';
import { HUDManager } from '../ui/HUDManager';
import { HighScoreManager } from '../systems/HighScoreManager';
import { Weapon, WeaponOption, WeaponType, WeaponRarity, WeaponCategory, DamageType } from '../types/WeaponTypes';
import { getRandomUpgrades } from '../data/Weapons';
import { AssetGenerator } from '../utils/AssetGenerator';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private obstacles!: Phaser.GameObjects.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: any;
  private mousePointer!: Phaser.Input.Pointer;
  private score: number = 0;
  private hudManager!: HUDManager;
  private enemySpawnRate: number = 1800; // Slightly faster spawns (was 2000)
  private enemySpawnTimer!: Phaser.Time.TimerEvent; // Reference to spawn timer for proper management
  private gameStartTime: number = 0;
  private isGameActive: boolean = true;

  // Learning period state
  private learningPeriodDuration: number = 15000; // 15 seconds (was 20000) - shorter learning period
  private isLearningPeriod: boolean = true;
  private learningPeriodOverlay!: Phaser.GameObjects.Graphics;
  private playerShield!: Phaser.GameObjects.Graphics;
  private normalEnemySpawnRate: number = 1800; // Slightly faster (was 2000)
  private learningPeriodSpawnRate: number = 6000; // Faster learning spawns (was 8000)

  // Boss system
  private boss!: Boss | null;
  private bossSpawnTime: number = 180000; // 3 minutes in milliseconds
  // Timer is managed by Phaser's event system, no direct reference needed
  private bossWarningText!: Phaser.GameObjects.Text;
  private bossWarningOverlay!: Phaser.GameObjects.Graphics;
  private isBossActive: boolean = false;

  // Particle system
  private particleManager!: ParticleManager;

  // Game timer system
  private gameTimer!: GameTimer;

  // Weapon selection system
  private weaponModal!: WeaponModal;

  // Wave system
  private currentWave: number = 1;
  private enemiesSpawnedInWave: number = 0;
  private enemiesKilledInWave: number = 0;
  private enemiesPerWave: number = 10;
  private isWaveActive: boolean = true;
  private isWaveBreak: boolean = false;

  // Strategic phase after boss defeat
  private isStrategicPhase: boolean = false;
  private strategicPhaseText!: Phaser.GameObjects.Text;
  private bossesDefeated: number = 0;
  private bossDefeatText: Phaser.GameObjects.Text | null = null;
  private strategicOverlay: Phaser.GameObjects.Graphics | null = null;

  // Game over restart flag
  private isRestarting: boolean = false;

  // Pause system
  private isPaused: boolean = false;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private pausePanel!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'GameScene' });
    // Groups will be initialized in create()
  }

  preload(): void {
    // Generate all game assets programmatically
    // 나중에 실제 리소스로 교체하기 쉽도록 AssetGenerator 사용
    const generator = new AssetGenerator(this);
    generator.generateAllAssets();
  }

  create(): void {
    // Scene 재시작 시 플래그 초기화
    this.isRestarting = false;

    this.gameStartTime = this.time.now;

    // Create background with tile pattern
    this.createBackground();

    // Initialize groups
    this.enemies = this.add.group();
    this.obstacles = this.add.group();

    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D,SPACE');
    this.mousePointer = this.input.activePointer;

    // Create player
    const playerConfig: PlayerConfig = {
      x: this.cameras.main.width / 2,
      y: this.cameras.main.height / 2,
      speed: 200,
      hp: 100,
      maxHp: 100,
      attackSpeed: 2,
      attackRange: 300,
      damage: 30
    };
    this.player = new Player(this, playerConfig.x, playerConfig.y, playerConfig);

    // Initialize particle manager
    this.particleManager = new ParticleManager(this);

    // Initialize game timer
    this.initializeGameTimer();

    // Initialize weapon selection modal
    this.initializeWeaponModal();

    // Setup UI
    this.setupUI();

    // Setup learning period
    this.setupLearningPeriod();

    // Setup boss spawning
    this.setupBossSpawning();

    // Setup collisions
    this.setupCollisions();

    // Setup attack input
    this.setupAttackInput();

    // Create obstacles
    this.createObstacles();

    // Start enemy spawning
    this.startEnemySpawning();

    // Setup level-up event listeners
    this.setupLevelUpSystem();
  }

  private setupUI(): void {
    // Create HUD Manager with new design
    this.hudManager = new HUDManager(this);

    // Initialize with current values
    this.hudManager.updateHP(this.player.getHp(), this.player.getMaxHp());
    this.hudManager.updateLevel(this.player.getLevel());
    this.hudManager.updateXP(this.player.getExperience(), this.player.getExperienceToNextLevel());
    this.hudManager.updateScore(this.score);
    this.hudManager.updateWave(this.currentWave, this.enemiesKilledInWave, this.enemiesPerWave);
    this.hudManager.updateTimer('00:00');
  }

  private initializeGameTimer(): void {
    // Create game timer with 1-second update interval
    this.gameTimer = new GameTimer(this, {
      updateInterval: 1000,
      enableMilestones: true,
      milestoneInterval: 30 // 30-second milestones
    });

    // Listen to timer update events
    this.events.on(GameTimer.EVENT_UPDATE, (data: TimerEventData) => {
      this.onTimerUpdate(data);
    });

    // Listen to milestone events
    this.events.on(GameTimer.EVENT_MILESTONE, (data: TimerEventData & { milestoneNumber: number; milestoneTime: number }) => {
      this.onTimerMilestone(data);
    });

    // Start the timer
    this.gameTimer.start();

    console.log('GameTimer initialized and started');
  }

  private initializeWeaponModal(): void {
    // Create weapon modal
    this.weaponModal = new WeaponModal(this);

    // Setup weapon selection callback
    this.weaponModal.onWeaponSelect((weapon: Weapon) => {
      this.handleWeaponSelection(weapon);
    });

    // Setup close callback
    this.weaponModal.onClose(() => {
      console.log('Weapon modal closed');
    });

    console.log('WeaponModal initialized');
  }

  private onTimerUpdate(data: TimerEventData): void {
    // Update timer display (both canvas and HTML)
    this.updateTimerDisplay(data.formattedTime);

    // Log time update for debugging
    console.log(`Timer update: ${data.formattedTime} (${data.seconds}s)`);
  }

  private onTimerMilestone(data: TimerEventData & { milestoneNumber: number; milestoneTime: number }): void {
    // Show milestone notification
    const milestoneText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 100,
      `${data.milestoneTime}s MILESTONE REACHED!`,
      {
        fontSize: '36px',
        color: '#ff00ff',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 8
      }
    );
    milestoneText.setOrigin(0.5);
    milestoneText.setScrollFactor(0);
    milestoneText.setDepth(200);

    // Fade out milestone text
    this.tweens.add({
      targets: milestoneText,
      alpha: 0,
      duration: 2000,
      delay: 1500,
      onComplete: () => {
        milestoneText.destroy();
      }
    });

    console.log(`Milestone ${data.milestoneNumber}: ${data.milestoneTime}s reached`);
  }

  private setupBossSpawning(): void {
    // Create boss warning overlay (starts invisible)
    this.bossWarningOverlay = this.add.graphics();
    this.bossWarningOverlay.setScrollFactor(0);
    this.bossWarningOverlay.setDepth(150);
    this.bossWarningOverlay.setVisible(false);

    // Create boss warning text (starts invisible)
    this.bossWarningText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 100,
      '경고!\n보스 접근 중!',
      {
        fontSize: '64px',
        color: '#ff0000',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 8
      }
    );
    this.bossWarningText.setOrigin(0.5);
    this.bossWarningText.setScrollFactor(0);
    this.bossWarningText.setDepth(200);
    this.bossWarningText.setVisible(false);

    // Start boss spawn timer (3 minutes)
    this.time.addEvent({
      delay: this.bossSpawnTime,
      callback: this.triggerBossSpawn,
      callbackScope: this
    });
  }

  private triggerBossSpawn(): void {
    if (!this.isGameActive || this.isBossActive) {
      return;
    }

    // Show warning overlay and text (canvas)
    this.bossWarningOverlay.setVisible(true);
    this.bossWarningOverlay.clear();
    this.bossWarningOverlay.fillStyle(0xff0000, 0.1);
    this.bossWarningOverlay.fillRect(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height
    );

    this.bossWarningText.setVisible(true);

    // Show HTML boss warning
    const bossWarningEl = document.getElementById('boss-warning');
    if (bossWarningEl) {
      bossWarningEl.classList.add('show');
    }

    // Flash warning effect
    this.tweens.add({
      targets: [this.bossWarningOverlay, this.bossWarningText],
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        // Hide warnings and spawn boss
        this.bossWarningOverlay.setVisible(false);
        this.bossWarningText.setVisible(false);
        // Hide HTML boss warning
        if (bossWarningEl) {
          bossWarningEl.classList.remove('show');
        }
        this.spawnBoss();
      }
    });

    // Pause regular enemy spawning during boss fight
    // The enemy spawn timer will be cleaned up when we restart it after boss defeat

    // Clear existing enemies to focus on boss
    this.enemies.getChildren().forEach((enemy) => {
      enemy.destroy();
    });
  }

  private spawnBoss(): void {
    if (!this.isGameActive) return;

    this.isBossActive = true;

    // Calculate spawn position (at edge of screen)
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;

    switch (side) {
      case 0: // Top
        x = this.cameras.main.width / 2;
        y = -80;
        break;
      case 1: // Right
        x = this.cameras.main.width + 80;
        y = this.cameras.main.height / 2;
        break;
      case 2: // Bottom
        x = this.cameras.main.width / 2;
        y = this.cameras.main.height + 80;
        break;
      case 3: // Left
        x = -80;
        y = this.cameras.main.height / 2;
        break;
    }

    // Random attack pattern
    const attackPatterns: Array<'chase' | 'spray' | 'charge'> = ['chase', 'spray', 'charge'];
    const randomPattern = attackPatterns[Math.floor(Math.random() * attackPatterns.length)];

    const bossConfig: BossConfig = {
      x,
      y,
      speed: 120,
      hp: 1000,
      maxHp: 1000,
      damage: 30,
      size: 64,
      name: `DARK OVERLORD ${randomPattern.toUpperCase()}`,
      attackPattern: randomPattern
    };

    this.boss = new Boss(this, x, y, bossConfig, this.player as any);

    // Setup boss collision
    this.setupBossCollisions();

    // Show boss spawn announcement
    const announcementText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      `${bossConfig.name}\nHAS APPEARED!`,
      {
        fontSize: '48px',
        color: '#ff0000',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 8
      }
    );
    announcementText.setOrigin(0.5);
    announcementText.setScrollFactor(0);
    announcementText.setDepth(250);

    // Fade out announcement
    this.tweens.add({
      targets: announcementText,
      alpha: 0,
      duration: 3000,
      delay: 2000,
      onComplete: () => {
        announcementText.destroy();
      }
    });

    // Screen shake on boss spawn
    this.cameras.main.shake(1000, 0.01);
  }

  private setupBossCollisions(): void {
    if (!this.boss) return;

    // Player-boss collision
    this.physics.add.overlap(
      this.player as any,
      this.boss as any,
      () => this.handlePlayerBossCollision(),
      undefined,
      this
    );

    // Projectile-boss collision
    this.physics.add.overlap(
      this.player.getProjectiles() as any,
      this.boss as any,
      (projectile: any) => this.handleProjectileBossCollision(projectile),
      undefined,
      this
    );

    // Boss-obstacle collision (boss can destroy destructible obstacles on contact)
    this.physics.add.collider(
      this.boss as any,
      this.obstacles as any,
      (boss: any, obstacle: any) => this.handleBossObstacleCollision(boss, obstacle),
      undefined,
      this
    );
  }

  private handlePlayerBossCollision(): void {
    if (!this.boss || !this.isGameActive) return;

    // Boss is invulnerable during spawn animation
    if (this.boss.isInvulnerable()) {
      return;
    }

    const damage = this.boss.getDamage();
    this.player.takeDamage(damage);
    this.updateUI();

    if (this.player.isDead()) {
      this.endGame();
    }
  }

  private handleProjectileBossCollision(projectile: any): void {
    if (!this.boss || !this.isGameActive) return;

    // Boss is invulnerable during spawn animation
    if (this.boss.isInvulnerable()) {
      return;
    }

    const damage = projectile.getData('damage');
    const isMelee = projectile.getData('isMelee');
    const isCrit = this.isCriticalHit();

    // Create hit effect with particles at precise hit location
    const particleType = isMelee ? ParticleType.SPARKS : ParticleType.BLOOD;
    const particleCount = isMelee ? 12 : 8;

    // Get boss size for hit location calculation
    const bossWidth = this.boss.width || 64;
    const bossHeight = this.boss.height || 64;

    // Use precise hit location calculation
    this.particleManager.createHitEffectAtLocation(
      this.boss.x,
      this.boss.y,
      bossWidth,
      bossHeight,
      projectile.x,
      projectile.y,
      damage,
      particleType,
      particleCount,
      isCrit
    );

    // Pass projectile position for knockback (if boss supports it)
    const killed = this.boss.takeDamage(damage, projectile.x, projectile.y);

    // Destroy projectile on impact (except melee which handles its own cleanup)
    if (!isMelee && projectile.active) {
      projectile.destroy();
    }

    if (killed) {
      this.handleBossDefeated();
    }
  }

  private handleBossObstacleCollision(bossEntity: any, obstacle: any): void {
    // Boss destroys destructible obstacles on contact
    if (obstacle.isDestructible() && bossEntity) {
      // Create debris effect
      this.particleManager.emitParticles({
        type: ParticleType.DEBRIS,
        x: obstacle.x,
        y: obstacle.y,
        count: 10
      });

      obstacle.destroy();
    }
  }

  private handleBossDefeated(): void {
    if (!this.boss) return;

    // Award massive points for boss kill
    this.score += 5000;
    this.updateUI();

    // Trigger strategic phase transition
    this.onBossDestroyed();
  }


  private setupLearningPeriod(): void {
    // Set initial spawn rate to learning period rate
    this.enemySpawnRate = this.learningPeriodSpawnRate;

    // Create learning period overlay (subtle visual only, no text)
    this.learningPeriodOverlay = this.add.graphics();
    this.learningPeriodOverlay.setScrollFactor(0);
    this.learningPeriodOverlay.setDepth(50);
    this.updateLearningPeriodOverlay();

    // Create player shield effect (no text UI)
    this.playerShield = this.add.graphics();
    this.playerShield.setScrollFactor(0);
    this.playerShield.setDepth(75);

    // Start learning period timer (no reference needed)
    this.time.addEvent({
      delay: this.learningPeriodDuration,
      callback: this.endLearningPeriod,
      callbackScope: this
    });
  }

  private updateLearningPeriodOverlay(): void {
    this.learningPeriodOverlay.clear();

    // Add subtle blue tint to indicate safety
    this.learningPeriodOverlay.fillStyle(0x00aaff, 0.05);
    this.learningPeriodOverlay.fillRect(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height
    );

    // Add border to indicate learning period
    this.learningPeriodOverlay.lineStyle(4, 0x00ffff, 0.3);
    this.learningPeriodOverlay.strokeRect(
      10,
      10,
      this.cameras.main.width - 20,
      this.cameras.main.height - 20
    );
  }

  private updateLearningPeriodUI(): void {
    if (!this.isLearningPeriod) return;

    // Update player shield effect only (no text UI)
    this.playerShield.clear();
    this.playerShield.lineStyle(3, 0x00ffff, 0.5);
    this.playerShield.strokeCircle(
      this.player.x,
      this.player.y,
      30
    );

    // Add shield glow effect
    this.playerShield.lineStyle(2, 0x00ffff, 0.2);
    this.playerShield.strokeCircle(
      this.player.x,
      this.player.y,
      35
    );
  }

  private endLearningPeriod(): void {
    this.isLearningPeriod = false;

    // Restore normal enemy spawn rate and restart spawning
    this.enemySpawnRate = this.normalEnemySpawnRate;
    this.restartEnemySpawning();

    // Fade out learning period overlay and shield
    this.tweens.add({
      targets: [this.learningPeriodOverlay, this.playerShield],
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        this.learningPeriodOverlay.destroy();
        this.playerShield.destroy();
      }
    });

    // Show "LEARNING PERIOD ENDED" message
    const endText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      '학습 기간 종료!\n\n행운을 빕니다!',
      {
        fontSize: '48px',
        color: '#ff0000',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 8
      }
    );
    endText.setOrigin(0.5);
    endText.setScrollFactor(0);
    endText.setDepth(200);

    // Fade out and destroy the end message
    this.tweens.add({
      targets: endText,
      alpha: 0,
      duration: 3000,
      delay: 2000,
      onComplete: () => {
        endText.destroy();
      }
    });
  }

  private setupCollisions(): void {
    // Player-enemy collision
    this.physics.add.overlap(
      this.player as any,
      this.enemies,
      (player: any, enemy: any) => this.handlePlayerEnemyCollision(player, enemy),
      undefined,
      this
    );

    // Player-obstacle collision (physically blocks player)
    this.physics.add.collider(
      this.player as any,
      this.obstacles,
      undefined,
      undefined,
      this
    );

    // Enemy-obstacle collision (enemies go around obstacles)
    this.physics.add.collider(
      this.enemies as any,
      this.obstacles,
      undefined,
      undefined,
      this
    );

    // Projectile-enemy collision
    this.physics.add.overlap(
      this.player.getProjectiles() as any,
      this.enemies,
      (projectile: any, enemy: any) => this.handleProjectileEnemyCollision(projectile, enemy),
      undefined,
      this
    );

    // Projectile-obstacle collision (destructible obstacles can be hit)
    this.physics.add.overlap(
      this.player.getProjectiles() as any,
      this.obstacles as any,
      (projectile: any, obstacle: any) => this.handleProjectileObstacleCollision(projectile, obstacle),
      undefined,
      this
    );
  }

  private setupAttackInput(): void {
    // Mouse click to attack
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isGameActive) return;

      // Left click for projectile, right click for melee
      if (pointer.leftButtonDown()) {
        this.player.performAttack('projectile');
      } else if (pointer.rightButtonDown()) {
        this.player.performAttack('melee');
      }
    });

    // Space bar to attack with current weapon
    this.wasd.SPACE.on('down', () => {
      if (!this.isGameActive) return;
      this.player.performAttack(this.player.getCurrentWeapon());
    });

    // TAB key to toggle attack mode (MOUSE <-> AUTO)
    this.input.keyboard!.on('keydown-TAB', () => {
      if (!this.isGameActive) return;
      this.player.toggleAttackMode();
    });

    // Number keys to switch weapons
    this.input.keyboard!.on('keydown-ONE', () => {
      this.player.switchWeapon('projectile');
    });
    this.input.keyboard!.on('keydown-TWO', () => {
      this.player.switchWeapon('melee');
    });

    // E key to open weapon selection modal
    this.input.keyboard!.on('keydown-E', () => {
      if (!this.isGameActive) return;
      this.openWeaponSelection();
    });

    // H key to open high scores screen
    this.input.keyboard!.on('keydown-H', () => {
      this.openHighScores();
    });

    // ESC key to toggle pause
    this.input.keyboard!.on('keydown-ESC', () => {
      this.togglePause();
    });

    // Q key to quit to menu (only when paused)
    this.input.keyboard!.on('keydown-Q', () => {
      if (this.isPaused) {
        this.quitToMenu();
      }
    });

    // Game Over restart handlers - only work when game is NOT active
    const tryRestart = () => {
      if (!this.isGameActive && !this.isRestarting) {
        this.handleGameOverRestart();
      }
    };

    // Space, R, or click to restart when game is over
    this.input.keyboard!.on('keydown-SPACE', tryRestart);
    this.input.keyboard!.on('keydown-R', tryRestart);

    // Click to restart when game is over (check isGameActive in handler)
    this.input.on('pointerdown', () => {
      if (this.isPaused) {
        this.resumeGame();
        return;
      }
      if (!this.isGameActive && !this.isRestarting) {
        this.handleGameOverRestart();
      }
    });

    // Browser visibility change - auto pause when tab becomes inactive
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * 브라우저 탭 비활성화 감지
   */
  private handleVisibilityChange = (): void => {
    if (document.hidden && this.isGameActive && !this.isPaused) {
      // 탭이 비활성화되면 자동 일시정지
      this.pauseGame();
    }
  };

  private createBackground(): void {
    // Set much brighter background color for maximum contrast with obstacles
    this.cameras.main.setBackgroundColor('#3a4a3a');

    // Create tiled background pattern
    const bgWidth = this.cameras.main.width;
    const bgHeight = this.cameras.main.height;
    const tileSize = 64;

    const bg = this.add.tileSprite(0, 0, bgWidth, bgHeight, 'floor_tile');
    bg.setOrigin(0, 0);
    bg.setDepth(-100); // Behind everything

    // Add subtle grid overlay
    const gridWidth = Math.ceil(bgWidth / tileSize) + 1;
    const gridHeight = Math.ceil(bgHeight / tileSize) + 1;

    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        if ((x + y) % 3 === 0) {
          const gridTile = this.add.image(x * tileSize, y * tileSize, 'grid_tile');
          gridTile.setOrigin(0, 0);
          gridTile.setDepth(-99);
        }
      }
    }

    // Add corner wall decorations
    const wallTiles = [
      { x: 0, y: 0, key: 'wall_h' },
      { x: 0, y: 0, key: 'wall_v' },
      { x: bgWidth - 80, y: 0, key: 'wall_h' },
      { x: bgWidth - 32, y: 0, key: 'wall_v' },
      { x: 0, y: bgHeight - 32, key: 'wall_h' },
      { x: 0, y: bgHeight - 80, key: 'wall_v' },
      { x: bgWidth - 80, y: bgHeight - 32, key: 'wall_h' },
      { x: bgWidth - 32, y: bgHeight - 80, key: 'wall_v' }
    ];

    wallTiles.forEach(tile => {
      const wall = this.add.image(tile.x, tile.y, tile.key);
      wall.setOrigin(0, 0);
      wall.setDepth(-50);
    });
  }

  private createObstacles(): void {
    // Random obstacle generation
    const obstacleConfigs: ObstacleConfig[] = [];

    const mapWidth = this.cameras.main.width;
    const mapHeight = this.cameras.main.height;
    const padding = 100; // Padding from edges
    const playerSafeZone = 150; // Safe zone around player spawn

    const playerX = this.player?.x ?? mapWidth / 2;
    const playerY = this.player?.y ?? mapHeight / 2;

    // Random number of obstacles (8-15)
    const numObstacles = Math.floor(Math.random() * 8) + 8;

    for (let i = 0; i < numObstacles; i++) {
      let config: ObstacleConfig | null = null;
      let attempts = 0;
      const maxAttempts = 20;

      while (!config && attempts < maxAttempts) {
        attempts++;

        const randomX = padding + Math.random() * (mapWidth - padding * 2);
        const randomY = padding + Math.random() * (mapHeight - padding * 2);

        // Check distance from player (safe zone)
        const distToPlayer = Math.sqrt(
          Math.pow(randomX - playerX, 2) + Math.pow(randomY - playerY, 2)
        );

        if (distToPlayer < playerSafeZone) continue;

        // Check distance from other obstacles (avoid overlap)
        let overlaps = false;
        for (const existing of obstacleConfigs) {
          const dist = Math.sqrt(
            Math.pow(randomX - existing.x, 2) + Math.pow(randomY - existing.y, 2)
          );
          if (dist < 80) {
            overlaps = true;
            break;
          }
        }

        if (overlaps) continue;

        // Random obstacle type
        const typeRoll = Math.random();
        let type: 'rock' | 'tree' | 'wall' | 'debris';
        let width: number;
        let height: number;
        let isDestructible: boolean;
        let hp: number | undefined;

        if (typeRoll < 0.35) {
          // Rock (35%) - sprite 크기에 맞춤
          const sizeRoll = Math.random();
          if (sizeRoll < 0.33) {
            width = height = 32; // rock_64
          } else if (sizeRoll < 0.66) {
            width = height = 48; // rock_96
          } else {
            width = height = 64; // rock_128
          }
          type = 'rock';
          isDestructible = false;
        } else if (typeRoll < 0.6) {
          // Tree (25%) - sprite 크기 64x64에 맞춤
          width = height = 64;
          type = 'tree';
          isDestructible = false;
        } else if (typeRoll < 0.8) {
          // Wall (20%) - sprite 크기에 맞춤
          const horizontal = Math.random() > 0.5;
          if (horizontal) {
            width = 80; // wall_h
            height = 32;
          } else {
            width = 32; // wall_v
            height = 80;
          }
          type = 'wall';
          isDestructible = false;
        } else {
          // Debris (20%) - sprite 크기 40x40에 맞춤
          width = height = 40;
          type = 'debris';
          isDestructible = true;
          hp = 30 + Math.floor(Math.random() * 20);
        }

        config = {
          x: randomX,
          y: randomY,
          width,
          height,
          type,
          isDestructible,
          hp
        };
      }

      if (config) {
        obstacleConfigs.push(config);
      }
    }

    // Create all obstacles
    obstacleConfigs.forEach(config => {
      const obstacle = new Obstacle(this, config);
      this.obstacles.add(obstacle as any);
    });
  }

  private startEnemySpawning(): void {
    // Remove existing spawn timer if it exists
    if (this.enemySpawnTimer) {
      this.enemySpawnTimer.destroy();
    }

    // Create new spawn timer with current rate
    this.enemySpawnTimer = this.time.addEvent({
      delay: this.enemySpawnRate,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });

    console.log(`Enemy spawning started with rate: ${this.enemySpawnRate}ms`);
  }

  private restartEnemySpawning(): void {
    // Restart spawning with updated rate (called when learning period ends)
    this.startEnemySpawning();
  }

  private setupLevelUpSystem(): void {
    // Listen for player level-up event
    this.events.on('player-level-up', (data: { level: number; experience: number; experienceToNextLevel: number }) => {
      console.log('Level-up event received:', data);
      this.showLevelUpScene();
    });

    // Listen for upgrade selection from LevelUpScene
    this.events.on('upgrade-selected', (upgrade: WeaponUpgrade) => {
      console.log('Upgrade selected:', upgrade);
      this.player.applyWeaponUpgrade(upgrade);
      this.updateUI();

      // Show upgrade confirmation
      this.showUpgradeConfirmation(upgrade);
    });

    // Listen for levelup complete event from LevelUpScene
    this.events.on('levelup-complete', () => {
      console.log('LevelUp complete, resuming game');
      this.isGameActive = true;
      this.physics.resume();
    });
  }

  private showLevelUpScene(): void {
    // Pause game and physics
    this.isGameActive = false;
    this.physics.pause();

    // Get random upgrades
    const currentLevel = this.player.getLevel();
    const upgrades = getRandomUpgrades(3, currentLevel);

    // Launch level-up scene
    this.scene.launch('LevelUpScene', { upgrades });
  }

  private showUpgradeConfirmation(upgrade: WeaponUpgrade): void {
    const confirmationText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      `${upgrade.name} APPLIED!\n${upgrade.description}`,
      {
        fontSize: '32px',
        color: '#00ff00',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 6
      }
    );
    confirmationText.setOrigin(0.5);
    confirmationText.setScrollFactor(0);
    confirmationText.setDepth(300);

    // Fade out
    this.tweens.add({
      targets: confirmationText,
      alpha: 0,
      duration: 2000,
      delay: 1500,
      onComplete: () => {
        confirmationText.destroy();
        this.isGameActive = true; // Resume game
      }
    });
  }

  private spawnEnemy(): void {
    if (!this.isGameActive || this.isWaveBreak || this.isStrategicPhase) return;

    // Check wave completion
    if (this.enemiesSpawnedInWave >= this.enemiesPerWave) {
      this.completeWave();
      return;
    }

    // Spawn enemy at random edge position
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x = 0;
    let y = 0;

    switch (side) {
      case 0: // Top
        x = Math.random() * this.cameras.main.width;
        y = -30;
        break;
      case 1: // Right
        x = this.cameras.main.width + 30;
        y = Math.random() * this.cameras.main.height;
        break;
      case 2: // Bottom
        x = Math.random() * this.cameras.main.width;
        y = this.cameras.main.height + 30;
        break;
      case 3: // Left
        x = -30;
        y = Math.random() * this.cameras.main.height;
        break;
    }

    // Select enemy type based on wave difficulty
    // Wave 1-2: Only slimes
    // Wave 3-4: Slimes + Skeletons
    // Wave 5+: All enemy types including Bats
    let enemyType: EnemyType = 'slime';
    const roll = Math.random();

    if (this.currentWave >= 5) {
      // All types available
      if (roll < 0.4) enemyType = 'slime';
      else if (roll < 0.7) enemyType = 'skeleton';
      else enemyType = 'bat';
    } else if (this.currentWave >= 3) {
      // Slime and Skeleton
      enemyType = roll < 0.6 ? 'slime' : 'skeleton';
    }

    // Scale enemy difficulty with wave number (steeper scaling)
    const waveMultiplier = 1 + (this.currentWave - 1) * 0.18; // Was 0.15
    const enemyConfig: EnemyConfig = {
      x,
      y,
      type: enemyType,
      speed: 80 + Math.random() * 40,
      hp: Math.floor(40 * waveMultiplier),
      damage: Math.floor(10 * waveMultiplier)
    };

    const enemy = new Enemy(this, x, y, enemyConfig, this.player as any);
    this.enemies.add(enemy as any);
    this.enemiesSpawnedInWave++;

    console.log(`Spawned ${enemyType} ${this.enemiesSpawnedInWave}/${this.enemiesPerWave} in wave ${this.currentWave}`);
  }

  private completeWave(): void {
    if (!this.isWaveActive) return;

    console.log(`Wave ${this.currentWave} spawn complete!`);
    // Wait for all enemies to be killed
  }

  private advanceWave(): void {
    this.currentWave++;
    this.enemiesSpawnedInWave = 0;
    this.enemiesKilledInWave = 0;
    this.enemiesPerWave = Math.floor(12 + this.currentWave * 2.5); // More enemies (was 10 + wave * 2)

    // Reduce spawn rate more aggressively with each wave (faster spawns)
    this.enemySpawnRate = Math.max(700, 1800 - (this.currentWave - 1) * 120); // Was 2000 - wave * 100
    this.startEnemySpawning();

    // Show wave announcement
    const waveText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      `웨이브 ${this.currentWave}`,
      {
        fontSize: '64px',
        color: '#ff8800',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 8
      }
    );
    waveText.setOrigin(0.5);
    waveText.setScrollFactor(0);
    waveText.setDepth(200);

    this.tweens.add({
      targets: waveText,
      alpha: 0,
      scale: 1.5,
      duration: 1500,
      onComplete: () => {
        waveText.destroy();
      }
    });

    this.updateWaveUI();
    console.log(`Advanced to wave ${this.currentWave} with ${this.enemiesPerWave} enemies`);
  }

  private updateWaveUI(): void {
    this.hudManager.updateWave(this.currentWave, this.enemiesKilledInWave, this.enemiesPerWave);
  }

  private handlePlayerEnemyCollision(player: Player, enemy: any): void {
    if (!this.isGameActive) return;

    // During learning period, player is immune to damage
    if (this.isLearningPeriod) {
      // Push enemy away slightly to prevent overlap
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const pushDistance = 30;
        const pushX = (dx / distance) * pushDistance;
        const pushY = (dy / distance) * pushDistance;

        enemy.x += pushX;
        enemy.y += pushY;
      }
      return;
    }

    const damage = enemy.getDamage();
    player.takeDamage(damage);
    this.updateUI();

    if (player.isDead()) {
      this.endGame();
    }
  }

  private handleProjectileEnemyCollision(projectile: any, enemy: any): void {
    if (!this.isGameActive) return;

    const damage = projectile.getData('damage');
    const isMelee = projectile.getData('isMelee');
    const isCrit = this.isCriticalHit();

    // Create hit effect with particles at precise hit location
    const particleType = isMelee ? ParticleType.SPARKS : ParticleType.BLOOD;
    const particleCount = isMelee ? 12 : 8;

    // Get enemy size for hit location calculation
    const enemyWidth = enemy.width || 24;
    const enemyHeight = enemy.height || 24;

    // Use precise hit location calculation
    this.particleManager.createHitEffectAtLocation(
      enemy.x,
      enemy.y,
      enemyWidth,
      enemyHeight,
      projectile.x,
      projectile.y,
      damage,
      particleType,
      particleCount,
      isCrit
    );

    // Pass projectile position as damage source for knockback direction
    const damageType = isMelee ? 'melee' : 'projectile';
    const killed = enemy.takeDamage(damage, projectile.x, projectile.y, damageType);

    // Destroy projectile on impact (except melee which handles its own cleanup)
    if (!isMelee && projectile.active) {
      projectile.destroy();
    }

    if (killed) {
      // Create death effect with intensity
      this.particleManager.createDeathEffectWithIntensity(
        enemy.x,
        enemy.y,
        ParticleType.BLOOD,
        isCrit ? 1.5 : 1.0 // Bigger explosion for crits
      );
      this.score += 100;

      // Award experience points (no visual feedback to avoid clutter)
      const xpGained = 25; // 25 XP per enemy kill
      const leveledUp = this.player.gainExperience(xpGained);

      if (leveledUp) {
        console.log(`Player leveled up! Now level ${this.player.getLevel()}`);
      }

      // Wave system: track enemy kills
      this.enemiesKilledInWave++;
      console.log(`Enemy killed: ${this.enemiesKilledInWave}/${this.enemiesPerWave} in wave ${this.currentWave}`);

      // Check if wave is complete (all spawned enemies killed)
      if (this.enemiesKilledInWave >= this.enemiesPerWave) {
        console.log(`Wave ${this.currentWave} complete!`);
        // Start a brief break before next wave
        this.startWaveBreak();
      }

      this.updateUI();
    }
  }

  private handleProjectileObstacleCollision(projectile: any, obstacle: Obstacle): void {
    if (!this.isGameActive) return;

    // Only destructible obstacles can be hit
    if (!obstacle.isDestructible()) {
      // Create spark effect at precise hit location for indestructible obstacles
      const obstacleWidth = obstacle.width || 40;
      const obstacleHeight = obstacle.height || 40;
      const hitLoc = this.particleManager['calculateHitLocation'](
        obstacle.x,
        obstacle.y,
        obstacleWidth,
        obstacleHeight,
        projectile.x,
        projectile.y
      );
      this.particleManager.emitParticles({
        type: ParticleType.SPARKS,
        x: hitLoc.x,
        y: hitLoc.y,
        count: 5
      });

      // Destroy projectile but don't damage obstacle
      if (projectile.active) {
        projectile.destroy();
      }
      return;
    }

    const damage = projectile.getData('damage');
    const isMelee = projectile.getData('isMelee');
    const isCrit = this.isCriticalHit();

    // Create hit effect at precise hit location
    const obstacleWidth = obstacle.width || 40;
    const obstacleHeight = obstacle.height || 40;

    // Use precise hit location calculation
    this.particleManager.createHitEffectAtLocation(
      obstacle.x,
      obstacle.y,
      obstacleWidth,
      obstacleHeight,
      projectile.x,
      projectile.y,
      damage,
      ParticleType.DEBRIS,
      isMelee ? 15 : 10,
      isCrit
    );

    const destroyed = obstacle.takeDamage(damage);

    // Destroy projectile on impact (except melee which handles its own cleanup)
    if (!isMelee && projectile.active) {
      projectile.destroy();
    }

    // Award points for destroying obstacles
    if (destroyed) {
      // Create death effect with intensity for obstacles
      this.particleManager.createDeathEffectWithIntensity(
        obstacle.x,
        obstacle.y,
        ParticleType.DEBRIS,
        isCrit ? 1.5 : 1.0
      );
      this.score += 50;
      this.updateUI();
    }
  }

  /**
   * Determine if a hit is a critical hit
   * 15% chance for critical hits
   * @returns true if critical hit, false otherwise
   */
  private isCriticalHit(): boolean {
    return Math.random() < 0.15;
  }

  private startWaveBreak(): void {
    this.isWaveBreak = true;
    console.log(`Starting wave break before wave ${this.currentWave + 1}`);

    // Show wave break notification
    const breakText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      `웨이브 ${this.currentWave} 완료!\n다음 웨이브 준비 중...`,
      {
        fontSize: '48px',
        color: '#00ff00',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 8
      }
    );
    breakText.setOrigin(0.5);
    breakText.setScrollFactor(0);
    breakText.setDepth(200);

    // Fade out and advance wave after 3 seconds
    this.tweens.add({
      targets: breakText,
      alpha: 0,
      duration: 2000,
      delay: 1000,
      onComplete: () => {
        breakText.destroy();
        this.advanceWave();
        this.isWaveBreak = false;
      }
    });
  }

  private onBossDestroyed(): void {
    if (!this.isBossActive) return;

    console.log('Boss destroyed!');

    this.bossesDefeated++;
    this.isBossActive = false;
    this.boss = null;

    // Clear remaining enemies
    this.enemies.getChildren().forEach((enemy) => {
      enemy.destroy();
    });

    // Clean up any existing boss defeat text
    if (this.bossDefeatText && this.bossDefeatText.active) {
      this.bossDefeatText.destroy();
    }

    // Show boss defeat message
    this.bossDefeatText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      `보스 처치!\n승리!`,
      {
        fontSize: '64px',
        color: '#ffff00',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 8
      }
    );
    this.bossDefeatText.setOrigin(0.5);
    this.bossDefeatText.setScrollFactor(0);
    this.bossDefeatText.setDepth(250);

    // Animate defeat text and transition to strategic phase
    this.tweens.add({
      targets: this.bossDefeatText,
      alpha: 0,
      scale: 1.5,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        // Clean up defeat text
        if (this.bossDefeatText && this.bossDefeatText.active) {
          this.bossDefeatText.destroy();
          this.bossDefeatText = null;
        }
        // Enter strategic phase
        this.enterStrategicPhase();
      }
    });
  }

  private enterStrategicPhase(): void {
    this.isStrategicPhase = true;
    console.log('Entering strategic phase - build selection time!');

    // Clean up any existing strategic overlay
    if (this.strategicOverlay && this.strategicOverlay.active) {
      this.strategicOverlay.destroy();
    }

    // Show strategic phase overlay
    this.strategicOverlay = this.add.graphics();
    this.strategicOverlay.setScrollFactor(0);
    this.strategicOverlay.setDepth(150);
    this.strategicOverlay.fillStyle(0x000033, 0.7);
    this.strategicOverlay.fillRect(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height
    );

    // Show strategic phase text
    this.strategicPhaseText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 3,
      `전략 단계\n업그레이드를 신중하게 선택하세요!\n처치한 보스: ${this.bossesDefeated}`,
      {
        fontSize: '36px',
        color: '#00ffff',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 6
      }
    );
    this.strategicPhaseText.setOrigin(0.5);
    this.strategicPhaseText.setScrollFactor(0);
    this.strategicPhaseText.setDepth(200);

    // Show weapon selection modal with bonus options
    this.showStrategicWeaponSelection();

    // Auto-exit strategic phase after 30 seconds if no selection
    this.time.addEvent({
      delay: 30000,
      callback: () => this.exitStrategicPhase(),
      callbackScope: this
    });
  }

  private showStrategicWeaponSelection(): void {
    // Get multiple upgrade options (strategic phase gives more choices)
    const currentLevel = this.player.getLevel();
    const upgrades = getRandomUpgrades(5, currentLevel); // 5 options instead of normal 3

    // Launch level-up scene with more options
    this.scene.launch('LevelUpScene', { upgrades });
  }

  private exitStrategicPhase(): void {
    this.isStrategicPhase = false;
    console.log('Exiting strategic phase - resuming game!');

    // Hide strategic phase UI
    if (this.strategicPhaseText && this.strategicPhaseText.active) {
      this.strategicPhaseText.destroy();
    }

    // Clean up strategic overlay
    if (this.strategicOverlay && this.strategicOverlay.active) {
      this.strategicOverlay.destroy();
      this.strategicOverlay = null;
    }

    // Resume spawning with increased difficulty
    this.currentWave++;
    this.enemiesSpawnedInWave = 0;
    this.enemiesKilledInWave = 0;
    this.enemiesPerWave = Math.floor(12 + this.currentWave * 3); // More enemies (was 10 + wave * 3)
    this.enemySpawnRate = Math.max(700, 1800 - (this.currentWave - 1) * 120); // Faster spawns
    this.startEnemySpawning();

    this.updateWaveUI();

    // Show resume notification
    const resumeText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      `게임 재개!\n웨이브 ${this.currentWave}`,
      {
        fontSize: '48px',
        color: '#ff00ff',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 8
      }
    );
    resumeText.setOrigin(0.5);
    resumeText.setScrollFactor(0);
    resumeText.setDepth(200);

    this.tweens.add({
      targets: resumeText,
      alpha: 0,
      duration: 1500,
      onComplete: () => {
        resumeText.destroy();
      }
    });
  }

  private updateUI(): void {
    // Update UI elements via HUDManager
    this.hudManager.updateHP(this.player.getHp(), this.player.getMaxHp());
    this.hudManager.updateScore(this.score);
    this.hudManager.updateXP(this.player.getExperience(), this.player.getExperienceToNextLevel());
    this.hudManager.updateWave(this.currentWave, this.enemiesKilledInWave, this.enemiesPerWave);
  }

  private updateTimerDisplay(timeText: string): void {
    // Update HUDManager timer
    this.hudManager.updateTimer(timeText);
  }

  // hideLearningPeriodOverlay removed - HTML overlay no longer exists

  private endGame(): void {
    this.isGameActive = false;

    // Stop the game timer
    let finalTime = '00:00';
    if (this.gameTimer && this.gameTimer.isActive()) {
      this.gameTimer.stop();
      finalTime = this.gameTimer.getFormattedTime();
      console.log(`Game ended at: ${finalTime}`);
    }

    // Save high score
    const isNewHighScore = HighScoreManager.saveHighScore(this.score);
    const rank = isNewHighScore ? HighScoreManager.getScoreRank(this.score) : 0;

    // Create game over screen with high score info
    this.displayGameOverScreen(finalTime, isNewHighScore, rank);
  }

  private displayGameOverScreen(finalTime: string, isNewHighScore: boolean, rank: number): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // 어두운 오버레이
    const overlay = this.add.graphics();
    overlay.setScrollFactor(0);
    overlay.setDepth(150);
    overlay.fillStyle(0x0a0a15, 0.92);
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    // 결과 패널 컨테이너
    const panelContainer = this.add.container(centerX, centerY);
    panelContainer.setDepth(200);

    const panelWidth = 420;
    const panelHeight = 380;

    // 패널 배경
    const panelBg = this.add.graphics();

    // 그림자
    panelBg.fillStyle(0x000000, 0.6);
    panelBg.fillRoundedRect(-panelWidth/2 + 8, -panelHeight/2 + 8, panelWidth, panelHeight, 20);

    // 메인 배경 - 어두운 보라색 계열
    panelBg.fillStyle(0x1a1a2e, 0.98);
    panelBg.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 16);

    // 보더 - 이중 테두리
    panelBg.lineStyle(3, 0x4a3a5a, 1);
    panelBg.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 16);

    panelBg.lineStyle(1, 0x6a5a7a, 0.5);
    panelBg.strokeRoundedRect(-panelWidth/2 + 4, -panelHeight/2 + 4, panelWidth - 8, panelHeight - 8, 12);

    // 상단 강조 선 (빨간 - 게임 오버 표시)
    panelBg.fillStyle(0xdc2626, 0.8);
    panelBg.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, 5, { tl: 16, tr: 16, bl: 0, br: 0 });

    // 하단 선
    panelBg.fillStyle(0x374151, 0.5);
    panelBg.fillRoundedRect(-panelWidth/2, panelHeight/2 - 5, panelWidth, 5, { tl: 0, tr: 0, bl: 16, br: 16 });

    panelContainer.add(panelBg);

    // 게임 오버 타이틀
    const gameOverText = this.add.text(
      0,
      -panelHeight/2 + 55,
      '게임 오버',
      {
        fontSize: '52px',
        color: '#ef4444',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", sans-serif',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#450a0a',
        strokeThickness: 6,
        shadow: {
          offsetX: 0,
          offsetY: 4,
          color: '#000000',
          blur: 6
        }
      }
    );
    gameOverText.setOrigin(0.5);
    panelContainer.add(gameOverText);

    // 영문 서브타이틀
    const gameOverSub = this.add.text(
      0,
      -panelHeight/2 + 95,
      'GAME OVER',
      {
        fontSize: '18px',
        color: '#f87171',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontStyle: 'bold',
        align: 'center',
        letterSpacing: 6
      }
    );
    gameOverSub.setOrigin(0.5);
    panelContainer.add(gameOverSub);

    // 구분선
    const separator1 = this.add.graphics();
    separator1.lineStyle(1, 0x374151, 0.8);
    separator1.lineBetween(-panelWidth/2 + 30, -panelHeight/2 + 130, panelWidth/2 - 30, -panelHeight/2 + 130);
    panelContainer.add(separator1);

    // 최종 점수 섹션
    const scoreLabel = this.add.text(
      0,
      -panelHeight/2 + 165,
      '최종 점수',
      {
        fontSize: '14px',
        color: '#9ca3af',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontStyle: '500'
      }
    );
    scoreLabel.setOrigin(0.5);
    panelContainer.add(scoreLabel);

    const scoreValue = this.add.text(
      0,
      -panelHeight/2 + 200,
      `${this.score.toLocaleString()}점`,
      {
        fontSize: '42px',
        color: '#fbbf24',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", sans-serif',
        fontStyle: 'bold',
        stroke: '#78350f',
        strokeThickness: 3
      }
    );
    scoreValue.setOrigin(0.5);
    panelContainer.add(scoreValue);

    // 점수 아이콘
    const scoreIcon = this.add.text(
      0,
      -panelHeight/2 + 235,
      '💰 🏆 ⚔',
      {
        fontSize: '20px'
      }
    );
    scoreIcon.setOrigin(0.5);
    panelContainer.add(scoreIcon);

    // 구분선 2
    const separator2 = this.add.graphics();
    separator2.lineStyle(1, 0x374151, 0.8);
    separator2.lineBetween(-panelWidth/2 + 30, -panelHeight/2 + 260, panelWidth/2 - 30, -panelHeight/2 + 260);
    panelContainer.add(separator2);

    // 생존 시간
    const timeLabel = this.add.text(
      0,
      -panelHeight/2 + 290,
      '생존 시간',
      {
        fontSize: '13px',
        color: '#9ca3af',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontStyle: '500'
      }
    );
    timeLabel.setOrigin(0.5);
    panelContainer.add(timeLabel);

    const timeValue = this.add.text(
      0,
      -panelHeight/2 + 315,
      finalTime,
      {
        fontSize: '24px',
        color: '#60a5fa',
        fontFamily: '-apple-system, BlinkMacSystemFont, monospace',
        fontStyle: 'bold',
        stroke: '#1e3a8a',
        strokeThickness: 2
      }
    );
    timeValue.setOrigin(0.5);
    panelContainer.add(timeValue);

    // 하이스코어 알림
    let rankContainer: Phaser.GameObjects.Container | null = null;
    if (isNewHighScore && rank > 0) {
      rankContainer = this.add.container(0, panelHeight/2 - 80);

      const medals = ['🥇', '🥈', '🥉'];
      const medal = medals[rank - 1] || `🏅`;

      // 랭크 배경
      const rankBg = this.add.graphics();
      rankBg.fillStyle(0x78350f, 0.9);
      rankBg.fillRoundedRect(-130, -30, 260, 60, 12);
      rankBg.lineStyle(2, 0xfbbf24, 1);
      rankBg.strokeRoundedRect(-130, -30, 260, 60, 12);

      rankContainer.add(rankBg);

      // 랭크 텍스트
      const rankText = this.add.text(
        0,
        0,
        `${medal} 신기록! ${rank}등`,
        {
          fontSize: '20px',
          color: '#fef08a',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontStyle: 'bold',
          align: 'center',
          stroke: '#78350f',
          strokeThickness: 2
        }
      );
      rankText.setOrigin(0.5);
      rankContainer.add(rankText);

      panelContainer.add(rankContainer);

      // 펄스 애니메이션
      this.tweens.add({
        targets: [rankContainer, rankBg],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: Phaser.Math.Easing.Sine.InOut
      });

      // 빛나는 효과
      this.tweens.add({
        targets: rankText,
        alpha: 0.7,
        duration: 400,
        yoyo: true,
        repeat: -1
      });
    }

    // 재시작 프롬프트
    const restartPrompt = this.add.text(
      0,
      panelHeight/2 - 25,
      '화면 클릭 또는 스페이스바로 처음 화면으로',
      {
        fontSize: '14px',
        color: '#6b7280',
        fontFamily: '"Courier New", monospace',
        fontStyle: 'bold'
      }
    );
    restartPrompt.setOrigin(0.5);
    panelContainer.add(restartPrompt);

    // 프롬프트 깜빡임
    this.tweens.add({
      targets: restartPrompt,
      alpha: 0.4,
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    // 패널 등장 애니메이션
    panelContainer.setScale(0.3);
    panelContainer.setAlpha(0);

    this.tweens.add({
      targets: panelContainer,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 500,
      ease: Phaser.Math.Easing.Back.Out
    });

    // 게임 오버 텍스트 흔들림
    this.tweens.add({
      targets: gameOverText,
      angle: 2,
      duration: 100,
      yoyo: true,
      repeat: 3,
      delay: 500
    });

    // 재시작을 위해 isRestarting 플래그 초기화
    this.isRestarting = false;
  }

  /**
   * 게임 오버 후 시작 화면으로 이동
   */
  private handleGameOverRestart(): void {
    if (this.isRestarting) return;

    this.isRestarting = true;

    // 시작 화면으로 이동
    this.scene.start('MenuScene');
  }

  private openHighScores(): void {
    // Pause the game if it's active
    if (this.isGameActive) {
      this.isGameActive = false;
      this.scene.pause();
    }

    // Launch high scores scene
    this.scene.launch('HighScoreScene');
  }


  private openWeaponSelection(): void {
    // Generate random weapon options for demonstration
    const weaponOptions = this.generateRandomWeaponOptions(3);

    // Show the weapon modal
    this.weaponModal.show(weaponOptions);
  }

  private generateRandomWeaponOptions(count: number): WeaponOption[] {
    const options: WeaponOption[] = [];

    // Sample weapon definitions to create random options
    const sampleWeapons: Weapon[] = [
      {
        id: 'blaster',
        name: 'Blaster',
        description: 'Standard energy blaster. Reliable and efficient.',
        type: WeaponType.PROJECTILE,
        category: WeaponCategory.OFFENSIVE,
        rarity: WeaponRarity.COMMON,
        damageType: DamageType.MAGICAL,
        damage: 25,
        fireRate: 2,
        range: 300,
        projectileSpeed: 400,
        level: 1,
        maxLevel: 8,
        experience: 0
      },
      {
        id: 'shotgun',
        name: 'Scatter Shot',
        description: 'Fires multiple projectiles in a spread pattern.',
        type: WeaponType.PROJECTILE,
        category: WeaponCategory.OFFENSIVE,
        rarity: WeaponRarity.RARE,
        damageType: DamageType.PHYSICAL,
        damage: 15,
        fireRate: 1.5,
        range: 200,
        projectileSpeed: 350,
        level: 1,
        maxLevel: 8,
        experience: 0
      },
      {
        id: 'sword',
        name: 'Energy Sword',
        description: 'Close-range energy blade for melee combat.',
        type: WeaponType.MELEE,
        category: WeaponCategory.OFFENSIVE,
        rarity: WeaponRarity.COMMON,
        damageType: DamageType.PHYSICAL,
        damage: 40,
        fireRate: 1.5,
        range: 60,
        level: 1,
        maxLevel: 8,
        experience: 0
      },
      {
        id: 'nova',
        name: 'Plasma Nova',
        description: 'Creates an expanding plasma field around you.',
        type: WeaponType.AREA,
        category: WeaponCategory.OFFENSIVE,
        rarity: WeaponRarity.EPIC,
        damageType: DamageType.MAGICAL,
        damage: 35,
        fireRate: 1,
        range: 150,
        area: 100,
        level: 1,
        maxLevel: 8,
        experience: 0
      },
      {
        id: 'minigun',
        name: 'Vulcan Minigun',
        description: 'Extremely rapid-fire weapon with devastating output.',
        type: WeaponType.PROJECTILE,
        category: WeaponCategory.OFFENSIVE,
        rarity: WeaponRarity.LEGENDARY,
        damageType: DamageType.PHYSICAL,
        damage: 12,
        fireRate: 8,
        range: 350,
        projectileSpeed: 500,
        level: 1,
        maxLevel: 8,
        experience: 0
      }
    ];

    // Randomly select weapons
    const shuffled = [...sampleWeapons].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, sampleWeapons.length));

    selected.forEach(weapon => {
      options.push({
        weapon: weapon,
        canUpgrade: true
      });
    });

    return options;
  }

  private handleWeaponSelection(weapon: Weapon): void {
    console.log(`Weapon selected: ${weapon.name} (${weapon.type})`);

    // For now, just log the selection
    // In a full implementation, this would:
    // 1. Add the weapon to the player's inventory
    // 2. Update player stats
    // 3. Apply weapon effects
    // 4. Save the weapon data

    // Show a notification
    const notification = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 50,
      `WEAPON ACQUIRED!\n\n${weapon.name}\n${weapon.description}`,
      {
        fontSize: '24px',
        color: '#00ff00',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 6
      }
    );
    notification.setOrigin(0.5);
    notification.setScrollFactor(0);
    notification.setDepth(300);

    // Fade out notification
    this.tweens.add({
      targets: notification,
      alpha: 0,
      duration: 2000,
      delay: 1500,
      onComplete: () => {
        notification.destroy();
      }
    });
  }

  // showKillFeedback removed - damage numbers provide sufficient feedback

  update(): void {
    if (!this.isGameActive) return;
    if (this.isPaused) return;

    // Update player with enemies for auto-targeting
    this.player.update(this.cursors, this.wasd, this.mousePointer, this.enemies);

    // Update enemies
    this.enemies.getChildren().forEach((enemy) => {
      (enemy as Enemy).update();
    });

    // Update boss
    if (this.boss && this.isBossActive) {
      this.boss.update();
    }

    // Create projectile trail effects
    this.player.getProjectiles().getChildren().forEach((projectile: any) => {
      // Only create trails for projectiles (not melee hitboxes)
      if (!projectile.getData('isMelee') && projectile.active) {
        // Random chance to create trail particle for performance
        if (Math.random() < 0.3) {
          this.particleManager.createProjectileTrail(projectile.x, projectile.y);
        }
      }
    });

    // Update learning period shield position
    if (this.isLearningPeriod && this.playerShield) {
      this.updateLearningPeriodUI();
    }

    // Clean up old projectiles
    const currentTime = this.time.now;
    this.player.getProjectiles().getChildren().forEach((projectile: any) => {
      const createdAt = projectile.getData('createdAt');
      if (createdAt && currentTime - createdAt > 3000) {
        projectile.destroy();
      }
    });

    // Increase difficulty over time (only after learning period ends) - more aggressive scaling
    if (!this.isLearningPeriod) {
      const elapsedTime = currentTime - this.gameStartTime;
      if (elapsedTime > 60000 && this.enemySpawnRate > 1000) {
        this.enemySpawnRate = 1000; // Was 1200 - faster spawns
      } else if (elapsedTime > 120000 && this.enemySpawnRate > 600) {
        this.enemySpawnRate = 600; // Was 800 - faster spawns
      }
    }
  }

  /**
   * Scene 종료 시 리소스 정리
   */
  public shutdown(): void {
    // 기타 정리가 필요한 리소스들
    if (this.weaponModal) {
      this.weaponModal.destroy();
    }
    // 이벤트 리스너 제거
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  // ==================== PAUSE SYSTEM ====================

  /**
   * 일시정지 토글
   */
  private togglePause(): void {
    if (!this.isGameActive) return;

    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  /**
   * 게임 일시정지
   */
  private pauseGame(): void {
    if (this.isPaused) return;

    this.isPaused = true;
    this.physics.pause();

    // Show pause UI
    this.showPauseUI();
  }

  /**
   * 게임 재개
   */
  private resumeGame(): void {
    if (!this.isPaused) return;

    this.isPaused = false;
    this.physics.resume();

    // Hide pause UI
    this.hidePauseUI();
  }

  /**
   * 일시정지 UI 표시 - Dark Fantasy Glassmorphism Design
   */
  private showPauseUI(): void {
    const { width, height } = this.cameras.main;

    // Blur effect on game (using Phaser's built-in post-processing would be ideal, but using overlay for compatibility)
    const overlay = this.add.graphics();

    // Create vignette effect gradient
    overlay.fillGradientStyle(0, 0, 0, 0, 0.6, 0.7, 0.75, 0.85);
    overlay.fillRect(0, 0, width, height);

    // Add subtle blue tint for fantasy atmosphere
    overlay.fillStyle(0x1a1a3a, 0.3);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(500);

    // Create decorative border pattern
    const borderPattern = this.add.graphics();
    borderPattern.lineStyle(2, 0x4a3c2a, 0.5);
    const borderSpacing = 40;
    for (let x = 0; x < width; x += borderSpacing) {
      borderPattern.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += borderSpacing) {
      borderPattern.lineBetween(0, y, width, y);
    }
    borderPattern.setAlpha(0.15);
    borderPattern.setDepth(501);

    // Main panel container
    const panelWidth = 580;
    const panelHeight = 620;
    this.pausePanel = this.add.container(width / 2, height / 2);
    this.pausePanel.setDepth(502);

    // Glassmorphism panel background
    const panelBg = this.add.graphics();

    // Main panel body with gradient
    panelBg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f0f1a, 0x0f0f1a, 0.92);
    panelBg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 24);

    // Inner glow effect (lighter border)
    panelBg.lineStyle(2, 0x8b7355, 0.4);
    panelBg.strokeRoundedRect(-panelWidth / 2 + 4, -panelHeight / 2 + 4, panelWidth - 8, panelHeight - 8, 20);

    // Outer border (gold-bronze)
    panelBg.lineStyle(3, 0x8b6914, 0.8);
    panelBg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 24);

    // Corner decorations (ornate corners)
    const cornerSize = 30;
    const cornerOffset = 8;

    // Top-left corner
    panelBg.lineStyle(3, 0xd4af37, 1);
    panelBg.beginPath();
    panelBg.moveTo(-panelWidth / 2 + cornerOffset, -panelHeight / 2 + cornerSize);
    panelBg.lineTo(-panelWidth / 2 + cornerOffset, -panelHeight / 2 + cornerOffset);
    panelBg.lineTo(-panelWidth / 2 + cornerSize, -panelHeight / 2 + cornerOffset);
    panelBg.strokePath();

    // Top-right corner
    panelBg.beginPath();
    panelBg.moveTo(panelWidth / 2 - cornerOffset, -panelHeight / 2 + cornerSize);
    panelBg.lineTo(panelWidth / 2 - cornerOffset, -panelHeight / 2 + cornerOffset);
    panelBg.lineTo(panelWidth / 2 - cornerSize, -panelHeight / 2 + cornerOffset);
    panelBg.strokePath();

    // Bottom-left corner
    panelBg.beginPath();
    panelBg.moveTo(-panelWidth / 2 + cornerOffset, panelHeight / 2 - cornerSize);
    panelBg.lineTo(-panelWidth / 2 + cornerOffset, panelHeight / 2 - cornerOffset);
    panelBg.lineTo(-panelWidth / 2 + cornerSize, panelHeight / 2 - cornerOffset);
    panelBg.strokePath();

    // Bottom-right corner
    panelBg.beginPath();
    panelBg.moveTo(panelWidth / 2 - cornerOffset, panelHeight / 2 - cornerSize);
    panelBg.lineTo(panelWidth / 2 - cornerOffset, panelHeight / 2 - cornerOffset);
    panelBg.lineTo(panelWidth / 2 - cornerSize, panelHeight / 2 - cornerOffset);
    panelBg.strokePath();

    this.pausePanel.add(panelBg);

    // Title section with "runes" decoration
    const titleY = -panelHeight / 2 + 65;

    // Decorative line above title
    const titleLineTop = this.add.graphics();
    titleLineTop.lineStyle(2, 0x8b6914, 0.8);
    titleLineTop.lineBetween(-80, titleY - 45, 80, titleY - 45);
    this.pausePanel.add(titleLineTop);

    // Rune symbols on sides
    const runeLeft = this.add.text(-panelWidth / 2 + 35, titleY - 5, '⚔', {
      fontSize: '24px',
      color: '#8b6914'
    });
    runeLeft.setOrigin(0.5);
    this.pausePanel.add(runeLeft);

    const runeRight = this.add.text(panelWidth / 2 - 35, titleY - 5, '⚔', {
      fontSize: '24px',
      color: '#8b6914'
    });
    runeRight.setOrigin(0.5);
    this.pausePanel.add(runeRight);

    // Main title with fantasy styling
    const pausedTitle = this.add.text(
      0,
      titleY,
      'PAUSED',
      {
        fontSize: '56px',
        color: '#f4e4c1',
        fontFamily: '"Georgia", "Times New Roman", serif',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#1a1a1a',
        strokeThickness: 8,
        shadow: {
          offsetX: 0,
          offsetY: 6,
          color: '#000000',
          blur: 12
        }
      }
    );
    pausedTitle.setOrigin(0.5);
    this.pausePanel.add(pausedTitle);

    // Subtitle with glow effect
    const pausedSubtitle = this.add.text(
      0,
      titleY + 40,
      '⚸ GAME PAUSED ⚸',
      {
        fontSize: '16px',
        color: '#9a8a6a',
        fontFamily: '"Courier New", monospace',
        fontStyle: 'bold',
        letterSpacing: 8
      }
    );
    pausedSubtitle.setOrigin(0.5);
    this.pausePanel.add(pausedSubtitle);

    // Decorative line below title
    const titleLineBottom = this.add.graphics();
    titleLineBottom.lineStyle(2, 0x8b6914, 0.8);
    titleLineBottom.lineBetween(-80, titleY + 65, 80, titleY + 65);
    this.pausePanel.add(titleLineBottom);

    // Stats panel section
    const statsY = titleY + 100;
    const statsPanelHeight = 320; // 높이 증가 (더 많은 정보 표시)

    // Stats background panel
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0a0a12, 0.6);
    statsBg.fillRoundedRect(-panelWidth / 2 + 30, statsY, panelWidth - 60, statsPanelHeight, 12);
    statsBg.lineStyle(1, 0x3a3a4a, 0.5);
    statsBg.strokeRoundedRect(-panelWidth / 2 + 30, statsY, panelWidth - 60, statsPanelHeight, 12);
    this.pausePanel.add(statsBg);

    // Game stats header
    const gameTime = this.formatTime(this.time.now - this.gameStartTime);
    const statsHeader = this.add.text(
      0,
      statsY + 20,
      `━━━ WAVE ${this.currentWave} ━━━ ${gameTime} ━━━ LV.${this.player?.getLevel() || 1} ━━`,
      {
        fontSize: '14px',
        color: '#8b7355',
        fontFamily: '"Courier New", monospace',
        fontStyle: 'bold',
        letterSpacing: 2
      }
    );
    statsHeader.setOrigin(0.5);
    this.pausePanel.add(statsHeader);

    // HP Bar with fancy design
    const hpY = statsY + 60;
    const hpPercent = this.player ? Math.round((this.player.getHp() / this.player.getMaxHp()) * 100) : 0;
    const hpColor = hpPercent < 30 ? 0xff3333 : hpPercent < 60 ? 0xffaa33 : 0x33cc66;
    const hpBarWidth = panelWidth - 100;

    // HP label
    const hpLabel = this.add.text(-panelWidth / 2 + 50, hpY - 15, 'HP', {
      fontSize: '12px',
      color: '#9a8a6a',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold'
    });
    hpLabel.setOrigin(0, 0.5);
    this.pausePanel.add(hpLabel);

    // HP value
    const hpValue = this.add.text(panelWidth / 2 - 50, hpY - 15, `${this.player?.getHp() || 0}/${this.player?.getMaxHp() || 100}`, {
      fontSize: '12px',
      color: '#e0d0b0',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold'
    });
    hpValue.setOrigin(1, 0.5);
    this.pausePanel.add(hpValue);

    // HP bar background
    const hpBarBg = this.add.graphics();
    hpBarBg.fillStyle(0x1a1a1a, 1);
    hpBarBg.fillRoundedRect(-hpBarWidth / 2, hpY, hpBarWidth, 12, 6);
    this.pausePanel.add(hpBarBg);

    // HP bar fill with gradient effect
    const hpBarFill = this.add.graphics();
    hpBarFill.fillStyle(hpColor, 1);
    hpBarFill.fillRoundedRect(-hpBarWidth / 2, hpY, hpBarWidth * (hpPercent / 100), 12, 6);
    this.pausePanel.add(hpBarFill);

    // HP bar glow
    const hpBarGlow = this.add.graphics();
    hpBarGlow.fillStyle(hpColor, 0.3);
    hpBarGlow.fillRoundedRect(-hpBarWidth / 2, hpY - 2, hpBarWidth * (hpPercent / 100), 16, 8);
    this.pausePanel.add(hpBarGlow);

    // EXP Bar
    const expY = hpY + 35;
    const currentExp = this.player?.getExperience() || 0;
    const expToLevel = this.player?.getExperienceToNextLevel() || 100;
    const expPercent = Math.round((currentExp / expToLevel) * 100);

    // EXP label
    const expLabel = this.add.text(-panelWidth / 2 + 50, expY - 15, 'EXP', {
      fontSize: '12px',
      color: '#9a8a6a',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold'
    });
    expLabel.setOrigin(0, 0.5);
    this.pausePanel.add(expLabel);

    // EXP value
    const expValue = this.add.text(panelWidth / 2 - 50, expY - 15, `${currentExp}/${expToLevel}`, {
      fontSize: '12px',
      color: '#e0d0b0',
      fontFamily: '"Courier New", monospace',
      fontStyle: 'bold'
    });
    expValue.setOrigin(1, 0.5);
    this.pausePanel.add(expValue);

    // EXP bar background
    const expBarBg = this.add.graphics();
    expBarBg.fillStyle(0x1a1a1a, 1);
    expBarBg.fillRoundedRect(-hpBarWidth / 2, expY, hpBarWidth, 12, 6);
    this.pausePanel.add(expBarBg);

    // EXP bar fill (blue-magic color)
    const expBarFill = this.add.graphics();
    expBarFill.fillStyle(0x4488ff, 1);
    expBarFill.fillRoundedRect(-hpBarWidth / 2, expY, hpBarWidth * (expPercent / 100), 12, 6);
    this.pausePanel.add(expBarFill);

    // EXP bar glow
    const expBarGlow = this.add.graphics();
    expBarGlow.fillStyle(0x4488ff, 0.3);
    expBarGlow.fillRoundedRect(-hpBarWidth / 2, expY - 2, hpBarWidth * (expPercent / 100), 16, 8);
    this.pausePanel.add(expBarGlow);

    // Kill counter with fancy icon
    const killY = expY + 40;
    const killText = this.add.text(
      0,
      killY,
      `💀 ENEMIES SLAIN: ${this.score.toLocaleString()}`,
      {
        fontSize: '16px',
        color: '#f4e4c1',
        fontFamily: '"Georgia", serif',
        fontStyle: 'bold',
        stroke: '#1a1a1a',
        strokeThickness: 4
      }
    );
    killText.setOrigin(0.5);
    this.pausePanel.add(killText);

    // Damage & Attack Speed section
    const statsY2 = killY + 40;
    const currentWeapon = this.player?.getCurrentWeapon() || 'projectile';
    const weaponIcon = currentWeapon === 'projectile' ? '🏹' : '⚔️';
    const weaponName = currentWeapon === 'projectile' ? 'Spirit Bow' : 'Shadow Blade';
    const damage = this.player ? Math.round(this.player.getTotalDamage(currentWeapon)) : 0;
    const attackSpeed = this.player ? Math.round(this.player.getTotalAttackSpeed(currentWeapon) * 10) / 10 : 1;

    // Weapon stats label
    const weaponStatsLabel = this.add.text(
      0,
      statsY2,
      `${weaponIcon} ${weaponName} STATS`,
      {
        fontSize: '12px',
        color: '#9a8a6a',
        fontFamily: '"Courier New", monospace',
        fontStyle: 'bold',
        letterSpacing: 2
      }
    );
    weaponStatsLabel.setOrigin(0.5);
    this.pausePanel.add(weaponStatsLabel);

    // Damage stat
    const damageText = this.add.text(
      -panelWidth / 4 - 10,
      statsY2 + 30,
      `⚔ DAMAGE: ${damage}`,
      {
        fontSize: '14px',
        color: '#ff6666',
        fontFamily: '"Courier New", monospace',
        fontStyle: 'bold'
      }
    );
    damageText.setOrigin(0.5);
    this.pausePanel.add(damageText);

    // Attack Speed stat
    const speedText = this.add.text(
      panelWidth / 4 + 10,
      statsY2 + 30,
      `⚡ SPEED: ${attackSpeed}/s`,
      {
        fontSize: '14px',
        color: '#66ccff',
        fontFamily: '"Courier New", monospace',
        fontStyle: 'bold'
      }
    );
    speedText.setOrigin(0.5);
    this.pausePanel.add(speedText);

    // Weapon section (reuse variables from above)
    const weaponY = statsY + statsPanelHeight + 25;

    const weaponPanel = this.add.container(0, weaponY);

    // Weapon background
    const weaponBg = this.add.graphics();
    weaponBg.fillStyle(0x0a0a12, 0.5);
    weaponBg.fillRoundedRect(-150, -20, 300, 40, 20);
    weaponBg.lineStyle(1, 0x3a3a4a, 0.5);
    weaponBg.strokeRoundedRect(-150, -20, 300, 40, 20);
    weaponPanel.add(weaponBg);

    const weaponText = this.add.text(0, 0, `${weaponIcon} ${weaponName}`, {
      fontSize: '18px',
      color: '#e0d0b0',
      fontFamily: '"Georgia", serif',
      fontStyle: 'bold'
    });
    weaponText.setOrigin(0.5);
    weaponPanel.add(weaponText);

    const weaponHint = this.add.text(0, 22, 'Press TAB to switch', {
      fontSize: '11px',
      color: '#6a6a5a',
      fontFamily: '"Courier New", monospace'
    });
    weaponHint.setOrigin(0.5);
    weaponPanel.add(weaponHint);

    this.pausePanel.add(weaponPanel);

    // Action buttons section
    const actionY = panelHeight / 2 - 70;

    // Resume button styling
    const resumeBtnBg = this.add.graphics();
    resumeBtnBg.fillStyle(0x2a2a3a, 0.9);
    resumeBtnBg.fillRoundedRect(-120, actionY - 20, 240, 40, 20);
    resumeBtnBg.lineStyle(2, 0x4488ff, 1);
    resumeBtnBg.strokeRoundedRect(-120, actionY - 20, 240, 40, 20);
    this.pausePanel.add(resumeBtnBg);

    const resumeBtnText = this.add.text(
      0,
      actionY,
      '▶ RESUME',
      {
        fontSize: '16px',
        color: '#88bbff',
        fontFamily: '"Courier New", monospace',
        fontStyle: 'bold',
        letterSpacing: 4
      }
    );
    resumeBtnText.setOrigin(0.5);
    this.pausePanel.add(resumeBtnText);

    // Quit hint
    const quitText = this.add.text(
      0,
      panelHeight / 2 - 25,
      'Press Q to return to menu',
      {
        fontSize: '12px',
        color: '#6a6a5a',
        fontFamily: '"Courier New", monospace'
      }
    );
    quitText.setOrigin(0.5);
    this.pausePanel.add(quitText);

    // Subtle floating animation for the panel
    this.tweens.add({
      targets: this.pausePanel,
      y: height / 2 - 5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: Phaser.Math.Easing.Sine.InOut
    });

    // Pulse animation for resume button
    this.tweens.add({
      targets: [resumeBtnBg, resumeBtnText],
      alpha: 0.7,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // Panel entrance animation with scale and fade
    this.pausePanel.setScale(0.5);
    this.pausePanel.setAlpha(0);
    this.tweens.add({
      targets: this.pausePanel,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 400,
      ease: Phaser.Math.Easing.Back.Out
    });

    // Store overlay reference
    this.pauseOverlay = this.add.container(0, 0);
    this.pauseOverlay.add(overlay);
    this.pauseOverlay.add(borderPattern);
    this.pauseOverlay.add(this.pausePanel);
    this.pauseOverlay.setDepth(500);
  }

  /**
   * 일시정지 UI 숨김
   */
  private hidePauseUI(): void {
    if (this.pauseOverlay) {
      this.tweens.add({
        targets: this.pausePanel,
        scaleX: 0.8,
        scaleY: 0.8,
        alpha: 0,
        duration: 200,
        ease: Phaser.Math.Easing.Back.In,
        onComplete: () => {
          this.pauseOverlay.destroy();
          this.pauseOverlay = null as any;
          this.pausePanel = null as any;
        }
      });
    }
  }

  /**
   * 메뉴로 나가기
   */
  private quitToMenu(): void {
    this.isPaused = false;
    this.scene.start('MenuScene');
  }

  /**
   * 시간 포맷 (초 → MM:SS)
   */
  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
