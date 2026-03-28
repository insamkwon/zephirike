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
import { VFX } from '../systems/VFX';
import { soundEngine } from '../systems/SoundEngine';
import { addGold, getMetaBonuses } from '../config/metaConfig';
import {
  WORLD_WIDTH, WORLD_HEIGHT,
  GAME_DURATION_SECONDS,
  LEVEL_UP_CHOICES,
  HEALTH_DROP_CHANCE,
  HEALTH_DROP_SCALING_INTERVAL,
  DAMAGE_OVERLAY_ALPHA,
  DAMAGE_OVERLAY_FADE_MS,
} from '../config/constants';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemyPool!: EnemyPool;
  private weaponManager!: WeaponManager;
  private waveManager!: WaveManager;
  private dropManager!: DropManager;
  private hud!: HUD;
  private vfx!: VFX;
  private levelUpUI: LevelUpUI | null = null;
  private damageOverlay!: Phaser.GameObjects.Rectangle;
  private gameTimer = 0;
  private paused = false;
  private gameOver = false;
  private startingWeapon = 'magic_bolt';
  private goldEarned = 0;
  private lastKillMilestone = 0;
  private bossWarningShown = new Set<number>();
  private damageMul = 1;
  private xpMul = 1;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { startingWeapon?: string }): void {
    this.startingWeapon = data.startingWeapon ?? 'magic_bolt';
    this.gameTimer = 0;
    this.paused = false;
    this.gameOver = false;
    this.levelUpUI = null;
    this.goldEarned = 0;
    this.lastKillMilestone = 0;
    this.bossWarningShown = new Set();
  }

  create(): void {
    soundEngine.init();
    this.vfx = new VFX(this);

    const bonuses = getMetaBonuses();
    this.damageMul = bonuses.damageMul;
    this.xpMul = bonuses.xpMul;

    this.setupWorld(bonuses);
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

    // Boss warnings at key moments
    this.checkBossWarnings(elapsed);

    this.player.update();
    this.waveManager.update(elapsed);
    this.weaponManager.update(time);
    this.dropManager.update();
    this.enemyPool.updateEnemies(this.player.x, this.player.y);
    this.hud.update(elapsed, this.buildWeaponInfo());

    // Kill streak check
    this.checkKillStreak();
  }

  // ── Setup ──

  private setupWorld(bonuses: ReturnType<typeof getMetaBonuses>): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.add.tileSprite(
      WORLD_WIDTH / 2, WORLD_HEIGHT / 2,
      WORLD_WIDTH, WORLD_HEIGHT, 'floor_tile'
    ).setDepth(0);

    this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    // Apply meta bonuses
    this.player.maxHp += bonuses.bonusHp;
    this.player.hp = this.player.maxHp;

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
    this.physics.add.overlap(
      this.player, this.enemyPool.group,
      (_p, obj) => {
        const enemy = obj as Enemy;
        if (!enemy.active) return;
        this.player.takeDamage(enemy.damage);
        this.flashDamageOverlay();
        this.vfx.shake(0.003, 80);
        soundEngine.playerHit();
      },
      undefined, this
    );

    this.physics.add.overlap(
      this.weaponManager.projectiles, this.enemyPool.group,
      (pObj, eObj) => {
        const proj = pObj as Projectile;
        const enemy = eObj as Enemy;
        if (!proj.active || !enemy.active) return;
        proj.onHitEnemy(enemy.uid);
        const dmg = Math.floor(proj.damage * this.damageMul);
        const killed = enemy.takeDamage(dmg);
        this.vfx.damageNumber(enemy.x, enemy.y - 10, dmg);
        if (!killed) soundEngine.hit();
      },
      undefined, this
    );
  }

  private setupEvents(): void {
    this.events.on('enemy-killed', (enemy: Enemy) => {
      this.player.kills++;

      // VFX + Sound
      this.vfx.deathBurst(enemy.x, enemy.y, enemy.enemyDef.color);
      soundEngine.kill();
      if (enemy.enemyDef.isBoss) {
        this.vfx.shake(0.015, 500);
        this.vfx.screenFlash(0xff4444, 0.3, 400);
      }

      // Drops
      const xpValue = Math.floor(enemy.xpValue * this.xpMul);
      this.dropManager.spawnXpGem(enemy.x, enemy.y, xpValue);

      // Gold from kills
      const goldAmount = enemy.enemyDef.isBoss ? 50 : (enemy.isElite ? 10 : Phaser.Math.Between(1, 3));
      this.dropManager.spawnGold(
        enemy.x + Phaser.Math.Between(-10, 10),
        enemy.y + Phaser.Math.Between(-10, 10),
        goldAmount
      );

      // Health drop
      const elapsed = Math.floor(this.gameTimer);
      const bonusChance = Math.floor(elapsed / HEALTH_DROP_SCALING_INTERVAL) * 0.02;
      if (Math.random() < HEALTH_DROP_CHANCE + bonusChance) {
        this.dropManager.spawnHealthDrop(enemy.x, enemy.y);
      }

      // Elite enemies drop chests
      if (enemy.isElite) {
        this.dropManager.spawnChest(enemy.x, enemy.y);
      }
    });

    this.events.on('drop-collected', (drop: Drop) => {
      switch (drop.dropType) {
        case 'xp':
          this.vfx.pickupSparkle(drop.x, drop.y);
          soundEngine.xpPickup();
          if (this.player.addXp(drop.value)) {
            this.showLevelUp();
          }
          break;
        case 'health':
          this.player.heal(drop.value);
          soundEngine.healthPickup();
          this.vfx.pickupSparkle(drop.x, drop.y);
          break;
        case 'gold':
          this.goldEarned += drop.value;
          addGold(drop.value);
          soundEngine.goldPickup();
          break;
        case 'chest':
          this.openChest();
          this.vfx.chestBurst(drop.x, drop.y);
          soundEngine.chestOpen();
          break;
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
    this.input.keyboard!.on('keydown-M', () => {
      soundEngine.toggleMute();
    });
  }

  // ── Level Up ──

  private showLevelUp(): void {
    this.paused = true;
    this.physics.pause();
    soundEngine.levelUp();
    this.vfx.screenFlash(0xffdd44, 0.3, 200);

    // Check for weapon evolution first
    const evo = this.weaponManager.getAvailableEvolution();
    if (evo) {
      this.showEvolution(evo);
      return;
    }

    const options = this.weaponManager.getUpgradeOptions(LEVEL_UP_CHOICES);
    this.levelUpUI = new LevelUpUI(
      this, this.player.level, options,
      this.weaponManager.getOwnedDefs(),
      (weaponId) => {
        this.weaponManager.addWeapon(weaponId);
        this.levelUpUI = null;
        this.paused = false;
        this.physics.resume();
      }
    );
  }

  private showEvolution(evo: { weapon1: string; weapon2: string; resultDef: import('../config/weaponConfig').WeaponDef }): void {
    soundEngine.evolution();
    this.vfx.evolutionGlow(this.player.x, this.player.y);

    const cam = this.cameras.main;
    const elements: Phaser.GameObjects.GameObject[] = [];

    const overlay = this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.8)
      .setScrollFactor(0).setDepth(300);
    elements.push(overlay);

    const title = this.add.text(cam.width / 2, 100, 'WEAPON EVOLUTION!', {
      fontSize: '32px', fontFamily: 'monospace', color: '#ffdd44',
      stroke: '#000', strokeThickness: 4,
    }).setScrollFactor(0).setDepth(301).setOrigin(0.5);
    elements.push(title);

    const desc = this.add.text(cam.width / 2, 160, `${evo.resultDef.icon} ${evo.resultDef.name}`, {
      fontSize: '24px', fontFamily: 'monospace', color: '#ffffff',
    }).setScrollFactor(0).setDepth(301).setOrigin(0.5);
    elements.push(desc);

    const detail = this.add.text(cam.width / 2, 200, evo.resultDef.levels[0].description, {
      fontSize: '14px', fontFamily: 'monospace', color: '#aaaaaa',
      wordWrap: { width: 400 }, align: 'center',
    }).setScrollFactor(0).setDepth(301).setOrigin(0.5);
    elements.push(detail);

    const hint = this.add.text(cam.width / 2, 280, 'Press any key to continue', {
      fontSize: '16px', fontFamily: 'monospace', color: '#44ff44',
    }).setScrollFactor(0).setDepth(301).setOrigin(0.5);
    elements.push(hint);

    const handler = () => {
      this.input.keyboard!.off('keydown', handler);
      this.input.off('pointerdown', handler);
      elements.forEach(e => e.destroy());
      this.weaponManager.evolve(evo.weapon1, evo.weapon2, evo.resultDef);
      this.paused = false;
      this.physics.resume();
    };
    this.input.keyboard!.on('keydown', handler);
    this.input.on('pointerdown', handler);
  }

  // ── Chest ──

  private openChest(): void {
    // Give a random weapon upgrade
    const options = this.weaponManager.getUpgradeOptions(1);
    if (options.length > 0) {
      this.weaponManager.addWeapon(options[0].weaponId);
      // Show brief notification
      const cam = this.cameras.main;
      const def = this.weaponManager.weapons.find(w => w.id === options[0].weaponId)?.def;
      const msg = def
        ? `${def.icon} ${def.name} ${options[0].isNew ? 'obtained!' : 'leveled up!'}`
        : 'Weapon upgraded!';

      const text = this.add.text(cam.width / 2, cam.height * 0.4, msg, {
        fontSize: '18px', fontFamily: 'monospace', color: '#ffdd44',
        stroke: '#000', strokeThickness: 3,
      }).setScrollFactor(0).setDepth(300).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: text,
        alpha: 1,
        y: cam.height * 0.35,
        duration: 300,
        hold: 1000,
        yoyo: true,
        onComplete: () => text.destroy(),
      });
    }
  }

  // ── Boss Warnings ──

  private checkBossWarnings(elapsed: number): void {
    const bossTimings = [295, 595, 775]; // 5s before each boss
    for (const t of bossTimings) {
      if (elapsed >= t && !this.bossWarningShown.has(t)) {
        this.bossWarningShown.add(t);
        this.vfx.bossWarning();
        soundEngine.bossWarning();
      }
    }
  }

  // ── Kill Streak ──

  private checkKillStreak(): void {
    const kills = this.player.kills;
    const milestones = [25, 50, 100, 200, 300, 500];
    for (const m of milestones) {
      if (kills >= m && this.lastKillMilestone < m) {
        this.lastKillMilestone = m;
        this.vfx.killStreak(m);
      }
    }
  }

  // ── Pause ──

  private togglePause(): void {
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause();
      this.add.text(
        this.cameras.main.width / 2, this.cameras.main.height / 2,
        'PAUSED\n\nESC/P to resume | M to mute',
        {
          fontSize: '24px', fontFamily: 'monospace', color: '#ffffff',
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
      gold: this.goldEarned,
      weapons: this.weaponManager.weapons.map(w => `${w.def.icon} ${w.def.name} Lv.${w.level + 1}`),
    });
  }

  // ── Helpers ──

  private flashDamageOverlay(): void {
    this.damageOverlay.setAlpha(DAMAGE_OVERLAY_ALPHA);
    this.tweens.add({ targets: this.damageOverlay, alpha: 0, duration: DAMAGE_OVERLAY_FADE_MS });
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
