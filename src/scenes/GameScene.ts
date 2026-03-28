import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Drop } from '../entities/Drop';
import { WeaponManager } from '../weapons/WeaponManager';
import { Projectile } from '../weapons/Projectile';
import { EnemyPool } from '../systems/EnemyPool';
import { WaveManager } from '../systems/WaveManager';
import { DropManager } from '../systems/DropManager';
import { HUD } from '../ui/HUD';
import { LevelUpUI } from '../ui/LevelUpUI';
import {
  WORLD_WIDTH, WORLD_HEIGHT,
  GAME_DURATION_SECONDS,
  LEVEL_UP_CHOICES,
  HEALTH_DROP_CHANCE,
  HEALTH_DROP_SCALING_INTERVAL,
  DAMAGE_OVERLAY_ALPHA,
  DAMAGE_OVERLAY_FADE_MS,
} from '../config/constants';

/**
 * Main gameplay scene — acts as a thin orchestrator that wires systems together.
 * All heavy logic lives in dedicated managers.
 */
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemyPool!: EnemyPool;
  private weaponManager!: WeaponManager;
  private waveManager!: WaveManager;
  private dropManager!: DropManager;
  private hud!: HUD;
  private levelUpUI: LevelUpUI | null = null;
  private damageOverlay!: Phaser.GameObjects.Rectangle;
  private gameTimer = 0;
  private paused = false;
  private gameOver = false;
  private startingWeapon = 'magic_bolt';

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { startingWeapon?: string }): void {
    this.startingWeapon = data.startingWeapon ?? 'magic_bolt';
    this.gameTimer = 0;
    this.paused = false;
    this.gameOver = false;
    this.levelUpUI = null;
  }

  create(): void {
    this.setupWorld();
    this.createSystems();
    this.setupCollisions();
    this.setupEvents();
    this.setupInput();
  }

  update(time: number, delta: number): void {
    if (this.paused || this.gameOver) return;

    this.gameTimer += delta / 1000;
    const elapsed = Math.floor(this.gameTimer);

    if (elapsed >= GAME_DURATION_SECONDS) {
      this.endGame(true);
      return;
    }

    this.player.update();
    this.waveManager.update(elapsed);
    this.weaponManager.update(time);
    this.dropManager.update();
    this.enemyPool.updateEnemies(this.player.x, this.player.y);
    this.hud.update(elapsed, this.buildWeaponInfo());
  }

  // ── Setup ──

  private setupWorld(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.add.tileSprite(
      WORLD_WIDTH / 2, WORLD_HEIGHT / 2,
      WORLD_WIDTH, WORLD_HEIGHT, 'floor_tile'
    ).setDepth(0);

    this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.damageOverlay = this.add.rectangle(
      this.cameras.main.width / 2, this.cameras.main.height / 2,
      this.cameras.main.width, this.cameras.main.height,
      0xff0000, 0
    ).setScrollFactor(0).setDepth(200);
  }

  private createSystems(): void {
    this.enemyPool = new EnemyPool(this);
    this.weaponManager = new WeaponManager(this, this.player, this.enemyPool);
    this.weaponManager.addWeapon(this.startingWeapon);
    this.waveManager = new WaveManager(this, this.enemyPool);
    this.dropManager = new DropManager(this, this.player);
    this.hud = new HUD(this, this.player);
  }

  private setupCollisions(): void {
    // Enemy → Player contact damage
    this.physics.add.overlap(
      this.player, this.enemyPool.group,
      (_p, obj) => {
        const enemy = obj as Enemy;
        if (!enemy.active) return;
        this.player.takeDamage(enemy.damage);
        this.flashDamageOverlay();
      },
      undefined, this
    );

    // Projectile → Enemy hit
    this.physics.add.overlap(
      this.weaponManager.projectiles, this.enemyPool.group,
      (pObj, eObj) => {
        const proj = pObj as Projectile;
        const enemy = eObj as Enemy;
        if (!proj.active || !enemy.active) return;
        proj.onHitEnemy(enemy.uid);
        enemy.takeDamage(proj.damage);
      },
      undefined, this
    );
  }

  private setupEvents(): void {
    this.events.on('enemy-killed', (enemy: Enemy) => {
      this.player.kills++;
      this.dropManager.spawnXpGem(enemy.x, enemy.y, enemy.xpValue);

      // Health drop chance scales up over time
      const elapsed = Math.floor(this.gameTimer);
      const bonusChance = Math.floor(elapsed / HEALTH_DROP_SCALING_INTERVAL) * 0.02;
      if (Math.random() < HEALTH_DROP_CHANCE + bonusChance) {
        this.dropManager.spawnHealthDrop(enemy.x, enemy.y);
      }
    });

    this.events.on('drop-collected', (drop: Drop) => {
      if (drop.dropType === 'xp') {
        if (this.player.addXp(drop.value)) {
          this.showLevelUp();
        }
      } else if (drop.dropType === 'health') {
        this.player.heal(drop.value);
      }
    });

    this.events.on('player-death', () => {
      if (this.gameOver) return;
      this.gameOver = true;
      this.endGame(false);
    });
  }

  private setupInput(): void {
    this.input.keyboard!.on('keydown-ESC', () => {
      if (!this.gameOver && !this.levelUpUI) this.togglePause();
    });
    this.input.keyboard!.on('keydown-P', () => {
      if (!this.gameOver && !this.levelUpUI) this.togglePause();
    });
  }

  // ── Level Up ──

  private showLevelUp(): void {
    this.paused = true;
    this.physics.pause();

    const options = this.weaponManager.getUpgradeOptions(LEVEL_UP_CHOICES);
    this.levelUpUI = new LevelUpUI(
      this,
      this.player.level,
      options,
      this.weaponManager.getOwnedDefs(),
      (weaponId) => {
        this.weaponManager.addWeapon(weaponId);
        this.levelUpUI = null;
        this.paused = false;
        this.physics.resume();
      }
    );
  }

  // ── Pause ──

  private togglePause(): void {
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause();
      this.add.text(
        this.cameras.main.width / 2, this.cameras.main.height / 2,
        'PAUSED\n\nPress ESC or P to resume',
        {
          fontSize: '28px', fontFamily: 'monospace', color: '#ffffff',
          align: 'center', stroke: '#000', strokeThickness: 3,
        }
      ).setScrollFactor(0).setDepth(400).setOrigin(0.5).setName('pauseText');
    } else {
      this.physics.resume();
      const pt = this.children.getByName('pauseText');
      if (pt) pt.destroy();
    }
  }

  // ── End Game ──

  private endGame(victory: boolean): void {
    this.gameOver = true;
    this.physics.pause();

    const timeStr = this.formatTime(Math.floor(this.gameTimer));
    const prevBest = parseInt(localStorage.getItem('zephirike_best_kills') ?? '0');
    if (this.player.kills > prevBest) {
      localStorage.setItem('zephirike_best_kills', this.player.kills.toString());
      localStorage.setItem('zephirike_best_time', timeStr);
    }

    this.scene.start('GameOverScene', {
      victory,
      time: timeStr,
      kills: this.player.kills,
      level: this.player.level,
      weapons: this.weaponManager.weapons.map(w => `${w.def.icon} ${w.def.name} Lv.${w.level + 1}`),
    });
  }

  // ── Helpers ──

  private flashDamageOverlay(): void {
    this.damageOverlay.setAlpha(DAMAGE_OVERLAY_ALPHA);
    this.tweens.add({
      targets: this.damageOverlay,
      alpha: 0,
      duration: DAMAGE_OVERLAY_FADE_MS,
    });
  }

  private buildWeaponInfo(): string {
    return this.weaponManager.weapons
      .map(w => `${w.def.icon} ${w.def.name} Lv.${w.level + 1}`)
      .join('  ');
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
