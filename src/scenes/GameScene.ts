import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { XpGem } from '../entities/XpGem';
import { WeaponManager } from '../weapons/WeaponManager';
import { WaveManager } from '../systems/WaveManager';
import { DropManager } from '../systems/DropManager';
import { HUD } from '../ui/HUD';
import { WORLD_WIDTH, WORLD_HEIGHT, GAME_DURATION_SECONDS } from '../config/constants';
import { Projectile } from '../weapons/Projectile';
import { WEAPONS } from '../config/weaponConfig';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private weaponManager!: WeaponManager;
  private waveManager!: WaveManager;
  private dropManager!: DropManager;
  private hud!: HUD;
  private gameTimer: number = 0;
  private paused: boolean = false;
  private gameOver: boolean = false;
  private startingWeapon: string = 'magic_bolt';
  private damageOverlay!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { startingWeapon?: string }): void {
    this.startingWeapon = data.startingWeapon ?? 'magic_bolt';
    this.gameTimer = 0;
    this.paused = false;
    this.gameOver = false;
  }

  create(): void {
    // World bounds
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Floor tiling
    this.add.tileSprite(
      WORLD_WIDTH / 2, WORLD_HEIGHT / 2,
      WORLD_WIDTH, WORLD_HEIGHT,
      'floor_tile'
    ).setDepth(0);

    // Player at center
    this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Enemy group
    this.enemyGroup = this.physics.add.group({
      classType: Enemy,
      runChildUpdate: false,
    });

    // Weapon manager
    this.weaponManager = new WeaponManager(this, this.player, this.enemyGroup);
    this.weaponManager.addWeapon(this.startingWeapon);

    // Wave manager
    this.waveManager = new WaveManager(this, this.enemyGroup, this.player);

    // Drop manager
    this.dropManager = new DropManager(this, this.player);

    // HUD
    this.hud = new HUD(this, this.player);

    // Damage overlay (red flash on edges when hit)
    this.damageOverlay = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0xff0000, 0
    ).setScrollFactor(0).setDepth(200);

    // -- Collisions --

    // Enemy touches player = damage
    this.physics.add.overlap(
      this.player,
      this.enemyGroup,
      (_player, _enemy) => {
        const enemy = _enemy as Enemy;
        if (!enemy.active) return;
        this.player.takeDamage(enemy.damage);

        // Flash screen
        this.damageOverlay.setAlpha(0.3);
        this.tweens.add({
          targets: this.damageOverlay,
          alpha: 0,
          duration: 200,
        });
      },
      undefined,
      this
    );

    // Projectile hits enemy
    this.physics.add.overlap(
      this.weaponManager.projectiles,
      this.enemyGroup,
      (_proj, _enemy) => {
        const proj = _proj as Projectile;
        const enemy = _enemy as Enemy;
        if (!proj.active || !enemy.active) return;

        proj.onHitEnemy(enemy.getData('id') ?? enemy.x * 1000 + enemy.y);
        enemy.takeDamage(proj.damage);
      },
      undefined,
      this
    );

    // -- Events --

    this.events.on('enemy-killed', (enemy: Enemy) => {
      this.player.kills++;
      this.dropManager.spawnXpGem(enemy.x, enemy.y, enemy.xpValue);

      // Small chance of health drop
      if (Math.random() < 0.05) {
        this.dropManager.spawnHealthDrop(enemy.x, enemy.y);
      }
    });

    this.events.on('xp-collected', (gem: XpGem) => {
      const leveledUp = this.player.addXp(gem.xpValue);
      if (leveledUp) {
        this.showLevelUp();
      }
    });

    this.events.on('player-death', () => {
      if (this.gameOver) return;
      this.gameOver = true;
      this.endGame(false);
    });

    // Pause key
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.gameOver) return;
      this.togglePause();
    });
    this.input.keyboard!.on('keydown-P', () => {
      if (this.gameOver) return;
      this.togglePause();
    });
  }

  update(time: number, delta: number): void {
    if (this.paused || this.gameOver) return;

    this.gameTimer += delta / 1000;
    const elapsedSeconds = Math.floor(this.gameTimer);

    // Check win condition
    if (elapsedSeconds >= GAME_DURATION_SECONDS) {
      this.endGame(true);
      return;
    }

    // Update systems
    this.player.update();
    this.waveManager.update(elapsedSeconds);
    this.weaponManager.update(time, delta);
    this.dropManager.update();

    // Update all enemies to chase player
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    for (const enemy of enemies) {
      if (enemy.active) {
        enemy.chasePlayer(this.player.x, this.player.y);
      }
    }

    // Cleanup far-off enemies (despawn if too far from player)
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist > 1200) {
        enemy.destroy();
      }
    }

    // Build weapon info string for HUD
    const weaponStr = this.weaponManager.weapons
      .map(w => `${w.def.icon} ${w.def.name} Lv.${w.level + 1}`)
      .join('  ');

    this.hud.update(elapsedSeconds, weaponStr);
  }

  private showLevelUp(): void {
    this.paused = true;
    this.physics.pause();

    // Get upgrade options
    const options = this.weaponManager.getUpgradeOptions(3);

    // Create level-up overlay
    const overlay = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000, 0.7
    ).setScrollFactor(0).setDepth(300);

    const title = this.add.text(
      this.cameras.main.width / 2, 80,
      `LEVEL UP! (Lv.${this.player.level})`,
      {
        fontSize: '28px',
        fontFamily: 'monospace',
        color: '#ffdd44',
        stroke: '#000',
        strokeThickness: 3,
      }
    ).setScrollFactor(0).setDepth(301).setOrigin(0.5);

    const subtitle = this.add.text(
      this.cameras.main.width / 2, 115,
      'Choose an upgrade:',
      {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#aaaaaa',
      }
    ).setScrollFactor(0).setDepth(301).setOrigin(0.5);

    const cards: Phaser.GameObjects.Container[] = [];
    const uiElements = [overlay, title, subtitle];

    const cardWidth = 200;
    const totalWidth = options.length * cardWidth + (options.length - 1) * 20;
    const startX = (this.cameras.main.width - totalWidth) / 2 + cardWidth / 2;

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const def = this.weaponManager.weapons.find(w => w.id === opt.weaponId)?.def
        ?? WEAPONS[opt.weaponId];

      if (!def) continue;

      const cx = startX + i * (cardWidth + 20);
      const cy = this.cameras.main.height / 2 + 20;

      const container = this.add.container(cx, cy);
      container.setScrollFactor(0).setDepth(302);

      const bg = this.add.rectangle(0, 0, cardWidth, 220, 0x222244, 0.9);
      bg.setStrokeStyle(2, 0x444466);

      const icon = this.add.text(0, -70, def.icon, { fontSize: '36px' }).setOrigin(0.5);

      const label = opt.isNew ? 'NEW!' : `Lv.${opt.nextLevel + 1}`;
      const labelColor = opt.isNew ? '#44ff44' : '#ffdd44';
      const labelText = this.add.text(0, -40, label, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: labelColor,
      }).setOrigin(0.5);

      const nameText = this.add.text(0, -20, def.name, {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: '#ffffff',
      }).setOrigin(0.5);

      const descText = this.add.text(0, 15, def.levels[opt.nextLevel].description, {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#aaaaaa',
        wordWrap: { width: 170 },
        align: 'center',
      }).setOrigin(0.5);

      // Key hint
      const keyHint = this.add.text(0, 80, `[${i + 1}]`, {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: '#666666',
      }).setOrigin(0.5);

      container.add([bg, icon, labelText, nameText, descText, keyHint]);
      container.setSize(cardWidth, 220);
      container.setInteractive();

      container.on('pointerover', () => {
        bg.setStrokeStyle(2, 0xffdd44);
      });
      container.on('pointerout', () => {
        bg.setStrokeStyle(2, 0x444466);
      });
      container.on('pointerdown', () => {
        this.selectUpgrade(opt.weaponId, uiElements, cards);
      });

      cards.push(container);
    }

    // Keyboard shortcuts
    const keyHandler = (event: KeyboardEvent) => {
      const num = parseInt(event.key);
      if (num >= 1 && num <= options.length) {
        this.selectUpgrade(options[num - 1].weaponId, uiElements, cards);
        this.input.keyboard!.off('keydown', keyHandler);
      }
    };
    this.input.keyboard!.on('keydown', keyHandler);
  }

  private selectUpgrade(
    weaponId: string,
    uiElements: Phaser.GameObjects.GameObject[],
    cards: Phaser.GameObjects.Container[]
  ): void {
    this.weaponManager.addWeapon(weaponId);

    // Clean up UI
    uiElements.forEach(el => el.destroy());
    cards.forEach(c => c.destroy());

    // Resume
    this.paused = false;
    this.physics.resume();
  }

  private togglePause(): void {
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause();
      // Show pause text
      const pt = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        'PAUSED\n\nPress ESC or P to resume',
        {
          fontSize: '28px',
          fontFamily: 'monospace',
          color: '#ffffff',
          align: 'center',
          stroke: '#000',
          strokeThickness: 3,
        }
      ).setScrollFactor(0).setDepth(400).setOrigin(0.5);
      pt.setName('pauseText');
    } else {
      this.physics.resume();
      // Remove pause text
      const pt = this.children.getByName('pauseText');
      if (pt) pt.destroy();
    }
  }

  private endGame(victory: boolean): void {
    this.gameOver = true;
    this.physics.pause();

    // Save high score
    const timeStr = this.formatTime(Math.floor(this.gameTimer));
    const prevBestKills = parseInt(localStorage.getItem('zephirike_best_kills') ?? '0');
    if (this.player.kills > prevBestKills) {
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

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
