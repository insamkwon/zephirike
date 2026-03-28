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
import { LevelUpUI, UpgradeOption } from '../ui/LevelUpUI';
import { Minimap } from '../ui/Minimap';
import { VFX } from '../systems/VFX';
import { soundEngine } from '../systems/SoundEngine';
import { bgm } from '../systems/BGM';
import { addGold, getMetaBonuses } from '../config/metaConfig';
import { PASSIVES } from '../config/passiveConfig';
import { WeaponDef } from '../config/weaponConfig';
import { TEXT_STYLES } from '../config/styles';
import { EVOLUTIONS } from '../config/evolutionConfig';
import { unlockCharacter } from '../config/characterConfig';
import { MapObjects } from '../systems/MapObjects';
import { BoneProjectilePool } from '../entities/BoneProjectile';
import { ENEMIES } from '../config/enemyConfig';
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
  private minimap!: Minimap;
  private vfx!: VFX;
  private levelUpUI: LevelUpUI | null = null;
  private damageOverlay!: Phaser.GameObjects.Rectangle;
  private gameTimer = 0;
  private paused = false;
  private gameOver = false;
  private startingWeapon = 'magic_bolt';
  private charBonuses: { hpMul: number; speedMul: number; damageMul: number; cooldownMul: number; magnetMul: number } =
    { hpMul: 1, speedMul: 1, damageMul: 1, cooldownMul: 1, magnetMul: 1 };
  private goldEarned = 0;
  private lastKillMilestone = 0;
  private bossWarningShown = new Set<number>();
  private lastWaveTime = 0;
  private xpMul = 1;
  private inHitstop = false;
  private recentKills = 0;
  private recentKillTimer = 0;
  private mapObjects!: MapObjects;
  private bonePool!: BoneProjectilePool;
  private killsPerSample: number[] = [];
  private sampleTimer = 0;
  private sampleKills = 0;
  private totalDamageTaken = 0;

  // Passive tracking
  private ownedPassives = new Map<string, number>();

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { character?: import('../config/characterConfig').CharacterDef; startingWeapon?: string }): void {
    if (data.character) {
      this.startingWeapon = data.character.startingWeapon;
      this.charBonuses = {
        hpMul: data.character.hpMul,
        speedMul: data.character.speedMul,
        damageMul: data.character.damageMul,
        cooldownMul: data.character.cooldownMul,
        magnetMul: data.character.magnetMul,
      };
    } else {
      this.startingWeapon = data.startingWeapon ?? 'magic_bolt';
      this.charBonuses = { hpMul: 1, speedMul: 1, damageMul: 1, cooldownMul: 1, magnetMul: 1 };
    }
    this.gameTimer = 0;
    this.paused = false;
    this.gameOver = false;
    this.levelUpUI = null;
    this.goldEarned = 0;
    this.lastKillMilestone = 0;
    this.lastWaveTime = 0;
    this.bossWarningShown = new Set();
    this.ownedPassives = new Map();
  }

  create(): void {
    soundEngine.init();
    this.vfx = new VFX(this);

    const meta = getMetaBonuses();
    // Combine meta + character bonuses
    const bonuses = {
      bonusHp: meta.bonusHp,
      speedMul: meta.speedMul * this.charBonuses.speedMul,
      damageMul: meta.damageMul * this.charBonuses.damageMul,
      xpMul: meta.xpMul,
      magnetMul: meta.magnetMul * this.charBonuses.magnetMul,
    };
    this.xpMul = bonuses.xpMul;
    // Apply character HP multiplier
    bonuses.bonusHp = Math.floor((100 * this.charBonuses.hpMul - 100) + bonuses.bonusHp);

    this.setupWorld(bonuses);
    this.createSystems();
    this.setupCollisions();
    this.setupEvents();
    this.setupInput();

    // Start BGM via public API
    this.startBGM();
  }

  update(time: number, delta: number): void {
    if (this.paused || this.gameOver) return;

    this.gameTimer += delta / 1000;
    const elapsed = Math.floor(this.gameTimer);

    if (elapsed >= GAME_DURATION_SECONDS) {
      this.endGame(true);
      return;
    }

    this.checkBossWarnings(elapsed);
    this.checkWaveTransitions(elapsed);

    this.player.update(delta);
    this.waveManager.update(elapsed);
    this.weaponManager.update(time);
    this.dropManager.update();
    this.enemyPool.updateEnemies(this.player.x, this.player.y, delta);
    this.minimap.update();

    // Update BGM intensity
    bgm.setIntensity(elapsed, GAME_DURATION_SECONDS);

    // Build HUD info
    const weaponStr = this.weaponManager.weapons
      .map(w => `${w.def.icon}${w.def.name} Lv${w.level + 1}`)
      .join(' ');
    const passiveStr = Array.from(this.ownedPassives.entries())
      .map(([id, lv]) => `${PASSIVES[id].icon}${lv}`)
      .join(' ');
    const evoReady = !!this.weaponManager.getAvailableEvolution(this.ownedPassives);

    this.hud.update(elapsed, weaponStr, this.goldEarned, passiveStr, evoReady);
    this.checkKillStreak();

    // Multi-kill shake tracker
    this.recentKillTimer += delta;
    if (this.recentKillTimer > 500) this.recentKills = 0;

    // Bone projectiles update
    this.bonePool.update(delta, this.player.x, this.player.y, (dmg) => {
      this.player.takeDamage(dmg);
      this.flashDamageOverlay();
      soundEngine.playerHit();
    });

    // Kill rate tracking (sample every 30s)
    this.sampleTimer += delta;
    if (this.sampleTimer >= 30000) {
      this.sampleTimer -= 30000;
      const killsDelta = this.player.kills - this.sampleKills;
      this.sampleKills = this.player.kills;
      this.killsPerSample.push(killsDelta);
    }
  }

  // ── Setup ──

  private setupWorld(bonuses: ReturnType<typeof getMetaBonuses>): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.add.tileSprite(
      WORLD_WIDTH / 2, WORLD_HEIGHT / 2,
      WORLD_WIDTH, WORLD_HEIGHT, 'floor_tile'
    ).setDepth(0);

    this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2, bonuses);

    this.cameras.main.startFollow(this.player, true, 1, 1);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.damageOverlay = this.add.rectangle(
      this.cameras.main.width / 2, this.cameras.main.height / 2,
      this.cameras.main.width, this.cameras.main.height,
      0xff0000, 0
    ).setScrollFactor(0).setDepth(200);
  }

  private createSystems(): void {
    this.enemyPool = new EnemyPool(this);
    this.weaponManager = new WeaponManager(this, this.player, this.enemyPool, this.charBonuses.cooldownMul);
    this.weaponManager.addWeapon(this.startingWeapon);
    this.waveManager = new WaveManager(this, this.enemyPool);
    this.dropManager = new DropManager(this, this.player);
    this.hud = new HUD(this, this.player);
    this.minimap = new Minimap(this, this.player, this.enemyPool);
    this.mapObjects = new MapObjects(this);
    this.bonePool = new BoneProjectilePool(this);
  }

  private setupCollisions(): void {
    // Enemy → Player
    this.physics.add.overlap(
      this.player, this.enemyPool.group,
      (_p, obj) => {
        const enemy = obj as Enemy;
        if (!enemy.active) return;
        this.totalDamageTaken += enemy.damage;
        this.player.takeDamage(enemy.damage);
        this.flashDamageOverlay();
        this.vfx.shake(0.003, 80);
        soundEngine.playerHit();
      },
      undefined, this
    );

    // Projectile → Enemy
    this.physics.add.overlap(
      this.weaponManager.projectiles, this.enemyPool.group,
      (pObj, eObj) => {
        const proj = pObj as Projectile;
        const enemy = eObj as Enemy;
        if (!proj.active || !enemy.active) return;
        proj.onHitEnemy(enemy.uid);
        const killed = enemy.takeDamage(proj.damage);
        this.vfx.damageNumber(enemy.x, enemy.y - 10, proj.damage);
        if (killed) {
          // Hitstop for bosses/elites
          if (enemy.enemyDef.isBoss || enemy.isElite) {
            this.hitstop(enemy.enemyDef.isBoss ? 120 : 50);
          }
        } else {
          soundEngine.hit();
        }
      },
      undefined, this
    );

    // Player and enemies collide with obstacles
    this.physics.add.collider(this.player, this.mapObjects.obstacles);
    this.physics.add.collider(this.enemyPool.group, this.mapObjects.obstacles);

    // Projectiles break destructibles
    this.physics.add.overlap(
      this.weaponManager.projectiles, this.mapObjects.destructibles,
      (pObj, dObj) => {
        const proj = pObj as Projectile;
        if (!proj.active) return;
        this.mapObjects.hitDestructible(dObj as Phaser.GameObjects.GameObject, proj.damage);
      },
      undefined, this
    );
  }

  private setupEvents(): void {
    // Skeleton ranged attack → pooled bone projectile
    this.events.on('enemy-ranged-attack', (enemy: Enemy, px: number, py: number) => {
      if (!enemy.active) return;
      this.bonePool.fire(enemy.x, enemy.y, px, py, enemy.damage);
    });

    // Boss AoE stomp
    this.events.on('boss-aoe', (x: number, y: number, radius: number, damage: number) => {
      const dist = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
      if (dist < radius) {
        this.player.takeDamage(damage);
        this.flashDamageOverlay();
        this.vfx.shake(0.008, 200);
      }
    });

    // Boss summon minions
    this.events.on('boss-summon', (x: number, y: number, count: number) => {
      const batDef = ENEMIES['bat'];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const sx = x + Math.cos(angle) * 60;
        const sy = y + Math.sin(angle) * 60;
        const minion = new Enemy(this, sx, sy, batDef, 2, 1.5);
        this.enemyPool.add(minion);
      }
    });

    this.events.on('enemy-killed', (enemy: Enemy) => {
      this.player.kills++;

      // Multi-kill shake
      this.recentKills++;
      this.recentKillTimer = 0;
      if (this.recentKills >= 5) {
        this.vfx.shake(0.004 * Math.min(this.recentKills / 10, 1), 100);
      }

      this.vfx.deathBurst(enemy.x, enemy.y, enemy.enemyDef.color, enemy.isElite ? 16 : 8);
      soundEngine.kill();
      if (enemy.enemyDef.isBoss) {
        this.vfx.shake(0.015, 500);
        this.vfx.screenFlash(0xff4444, 0.3, 400);
      }

      // Drops
      const xpValue = Math.floor(enemy.xpValue * this.xpMul);
      this.dropManager.spawnXpGem(enemy.x, enemy.y, xpValue);

      // Gold
      const luckGoldBonus = this.player.luckLevel >= 3 ? 1.5 : 1;
      const goldAmount = Math.floor(
        (enemy.enemyDef.isBoss ? 50 : (enemy.isElite ? 10 : Phaser.Math.Between(1, 3)))
        * luckGoldBonus
      );
      this.dropManager.spawnGold(
        enemy.x + Phaser.Math.Between(-10, 10),
        enemy.y + Phaser.Math.Between(-10, 10),
        goldAmount
      );

      // Health drop (luck boosts chance)
      const elapsed = Math.floor(this.gameTimer);
      const bonusChance = Math.floor(elapsed / HEALTH_DROP_SCALING_INTERVAL) * 0.02;
      const luckMul = this.player.luckLevel >= 2 ? 3 : (this.player.luckLevel >= 1 ? 2 : 1);
      if (Math.random() < (HEALTH_DROP_CHANCE + bonusChance) * luckMul) {
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

    // Destructible drops
    this.events.on('destructible-broken', (x: number, y: number) => {
      this.dropManager.spawnXpGem(x, y, Phaser.Math.Between(3, 8));
      this.vfx.deathBurst(x, y, 0xcc6622, 6);
    });
  }

  private setupInput(): void {
    this.input.keyboard!.on('keydown-ESC', () => {
      if (!this.gameOver && !this.levelUpUI && !this.inHitstop) this.togglePause();
    });
    this.input.keyboard!.on('keydown-P', () => {
      if (!this.gameOver && !this.levelUpUI && !this.inHitstop) this.togglePause();
    });
    this.input.keyboard!.on('keydown-M', () => {
      const muted = soundEngine.toggleMute();
      if (muted) bgm.stop();
      else this.startBGM();
    });
  }

  // ── Level Up ──

  private showLevelUp(): void {
    this.paused = true;
    this.physics.pause();
    soundEngine.levelUp();
    this.vfx.screenFlash(0xffdd44, 0.3, 200);

    // XP vacuum — pull all drops toward player
    this.dropManager.vacuumAll();

    // Check evolution
    const evo = this.weaponManager.getAvailableEvolution(this.ownedPassives);
    if (evo) {
      this.showEvolution(evo);
      return;
    }

    // Build combined options: weapons + passives
    const weaponOptions = this.weaponManager.getUpgradeOptions(LEVEL_UP_CHOICES + 2);
    const passiveOptions = this.getPassiveOptions(2);
    const allOptions: UpgradeOption[] = [
      ...weaponOptions.map(o => ({ ...o, isPassive: false })),
      ...passiveOptions,
    ];
    // Shuffle and take LEVEL_UP_CHOICES
    Phaser.Utils.Array.Shuffle(allOptions);
    const finalOptions = allOptions.slice(0, LEVEL_UP_CHOICES);

    const onSelectUpgrade = (weaponId: string) => {
      if (PASSIVES[weaponId]) {
        const currentLv = this.ownedPassives.get(weaponId) ?? 0;
        this.ownedPassives.set(weaponId, currentLv + 1);
        this.player.applyPassive(weaponId, currentLv + 1);
      } else {
        this.weaponManager.addWeapon(weaponId);
      }
      this.levelUpUI = null;
      this.paused = false;
      this.physics.resume();
    };

    this.levelUpUI = new LevelUpUI(
      this, this.player.level, finalOptions,
      this.weaponManager.getOwnedDefs(),
      onSelectUpgrade,
      () => this.showLevelUp() // reroll: re-show level up with new options
    );
  }

  private getPassiveOptions(count: number): UpgradeOption[] {
    const options: UpgradeOption[] = [];
    for (const [id, def] of Object.entries(PASSIVES)) {
      const currentLv = this.ownedPassives.get(id) ?? 0;
      if (currentLv < def.maxLevel) {
        options.push({
          weaponId: id,
          nextLevel: currentLv,
          isNew: currentLv === 0,
        });
      }
    }
    Phaser.Utils.Array.Shuffle(options);
    return options.slice(0, count);
  }

  private showEvolution(evo: { weapon: string; resultDef: WeaponDef }): void {
    soundEngine.evolution();
    this.vfx.evolutionGlow(this.player.x, this.player.y);

    const cam = this.cameras.main;
    const elements: Phaser.GameObjects.GameObject[] = [];

    elements.push(this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.8)
      .setScrollFactor(0).setDepth(300));
    elements.push(this.add.text(cam.width / 2, 100, 'WEAPON EVOLUTION!', {
      ...TEXT_STYLES.heading, fontSize: '32px',
    }).setScrollFactor(0).setDepth(301).setOrigin(0.5));
    elements.push(this.add.text(cam.width / 2, 160, `${evo.resultDef.icon} ${evo.resultDef.name}`, {
      fontSize: '24px', fontFamily: 'monospace', color: '#ffffff',
    }).setScrollFactor(0).setDepth(301).setOrigin(0.5));
    elements.push(this.add.text(cam.width / 2, 200, evo.resultDef.levels[0].description, {
      fontSize: '14px', fontFamily: 'monospace', color: '#aaaaaa',
      wordWrap: { width: 400 }, align: 'center',
    }).setScrollFactor(0).setDepth(301).setOrigin(0.5));
    elements.push(this.add.text(cam.width / 2, 280, 'Press any key to continue', {
      fontSize: '16px', fontFamily: 'monospace', color: '#44ff44',
    }).setScrollFactor(0).setDepth(301).setOrigin(0.5));

    const handler = () => {
      this.input.keyboard!.off('keydown', handler);
      this.input.off('pointerdown', handler);
      elements.forEach(e => e.destroy());
      this.weaponManager.evolve(evo.weapon, evo.resultDef);
      this.paused = false;
      this.physics.resume();
    };
    this.input.keyboard!.on('keydown', handler);
    this.input.on('pointerdown', handler);
  }

  // ── Chest ──

  private openChest(): void {
    const options = this.weaponManager.getUpgradeOptions(1);
    if (options.length > 0) {
      this.weaponManager.addWeapon(options[0].weaponId);
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
        targets: text, alpha: 1, y: cam.height * 0.35,
        duration: 300, hold: 1000, yoyo: true,
        onComplete: () => text.destroy(),
      });
    }
  }

  // ── Boss Warnings ──

  private checkBossWarnings(elapsed: number): void {
    const bossTimings = [295, 595, 775];
    for (const t of bossTimings) {
      if (elapsed >= t && !this.bossWarningShown.has(t)) {
        this.bossWarningShown.add(t);
        this.vfx.bossWarning();
        soundEngine.bossWarning();
      }
    }
  }

  // ── Wave Transitions ──

  private checkWaveTransitions(elapsed: number): void {
    const waveTimes = [30, 60, 90, 120, 180, 240, 300, 420, 600, 780];
    for (const t of waveTimes) {
      if (elapsed >= t && this.lastWaveTime < t) {
        this.lastWaveTime = t;
        soundEngine.waveTransition();
        const cam = this.cameras.main;
        const waveNum = waveTimes.indexOf(t) + 2;
        const text = this.add.text(cam.width / 2, cam.height * 0.25, `Wave ${waveNum}`,
          TEXT_STYLES.announcement
        ).setScrollFactor(0).setDepth(300).setOrigin(0.5).setAlpha(0);
        this.tweens.add({
          targets: text, alpha: 1, scale: { from: 0.5, to: 1 },
          duration: 400, hold: 800, yoyo: true,
          onComplete: () => text.destroy(),
        });
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

  // ── Hitstop ──

  private hitstop(durationMs: number): void {
    if (this.inHitstop) return;
    this.inHitstop = true;
    this.physics.pause();
    // Use real setTimeout — Phaser's delayedCall respects timeScale,
    // so it would never fire if we set timeScale to 0.
    setTimeout(() => {
      this.inHitstop = false;
      if (!this.paused && !this.gameOver) {
        this.physics.resume();
      }
    }, durationMs);
  }

  // ── Pause ──

  private togglePause(): void {
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause();
      bgm.stop();
      this.add.text(
        this.cameras.main.width / 2, this.cameras.main.height / 2,
        'PAUSED\n\nESC/P resume | M mute',
        {
          fontSize: '22px', fontFamily: 'monospace', color: '#ffffff',
          align: 'center', stroke: '#000', strokeThickness: 3,
        }
      ).setScrollFactor(0).setDepth(400).setOrigin(0.5).setName('pauseText');
    } else {
      this.physics.resume();
      this.startBGM();
      const pt = this.children.getByName('pauseText');
      if (pt) pt.destroy();
    }
  }

  // ── End Game ──

  private endGame(victory: boolean): void {
    this.gameOver = true;
    this.physics.pause();
    bgm.stop();

    // Achievement checks
    if (this.player.kills >= 500) unlockCharacter('rogue');
    const hasEvolved = this.weaponManager.weapons.some(w =>
      EVOLUTIONS.some(e => e.result.id === w.id)
    );
    if (hasEvolved) unlockCharacter('warlock');

    // Fanfare
    if (victory) {
      soundEngine.victory();
      this.vfx.screenFlash(0xffdd44, 0.5, 600);
    } else {
      soundEngine.death();
      this.vfx.shake(0.01, 400);
    }

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
      dpsHistory: this.killsPerSample,
      peakDps: this.killsPerSample.length > 0 ? Math.max(...this.killsPerSample) : 0,
      damageTaken: this.totalDamageTaken,
    });
  }

  // ── Helpers ──

  private startBGM(): void {
    const ctx = soundEngine.getContext();
    const dest = soundEngine.getDestination();
    if (ctx && dest && !soundEngine.isMuted) bgm.start(ctx, dest);
  }

  private flashDamageOverlay(): void {
    this.damageOverlay.setAlpha(DAMAGE_OVERLAY_ALPHA);
    this.tweens.add({ targets: this.damageOverlay, alpha: 0, duration: DAMAGE_OVERLAY_FADE_MS });
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
