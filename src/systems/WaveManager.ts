import Phaser from 'phaser';
import { WAVES, WaveEntry } from '../config/waveConfig';
import { ENEMIES, EnemyDef } from '../config/enemyConfig';
import { Enemy } from '../entities/Enemy';
import { EnemyPool } from './EnemyPool';
import { MAX_ENEMIES_ON_SCREEN, ENEMY_SPAWN_MARGIN, WORLD_WIDTH, WORLD_HEIGHT, WORLD_BOUND_MARGIN } from '../config/constants';

interface ActiveWave {
  entry: WaveEntry;
  /** Burst repeater (repeats the entire burst at repeatDelay intervals) */
  burstTimer: Phaser.Time.TimerEvent | null;
  /** Per-burst spawner (spawns enemies within a single burst at `interval` intervals) */
  spawnTimer: Phaser.Time.TimerEvent | null;
}

export class WaveManager {
  private scene: Phaser.Scene;
  private enemyPool: EnemyPool;
  private activeWaves: ActiveWave[] = [];
  private activatedIndices = new Set<number>();

  constructor(scene: Phaser.Scene, enemyPool: EnemyPool) {
    this.scene = scene;
    this.enemyPool = enemyPool;
  }

  update(elapsedSeconds: number): void {
    for (let i = 0; i < WAVES.length; i++) {
      if (this.activatedIndices.has(i)) continue;
      if (elapsedSeconds >= WAVES[i].time) {
        this.activatedIndices.add(i);
        this.startWave(WAVES[i]);
      }
    }
  }

  private startWave(entry: WaveEntry): void {
    const wave: ActiveWave = { entry, burstTimer: null, spawnTimer: null };

    // Fire first burst immediately
    this.startBurstSpawner(wave);

    // Schedule repeating bursts
    if (entry.repeat !== 0) {
      wave.burstTimer = this.scene.time.addEvent({
        delay: entry.repeatDelay,
        repeat: entry.repeat === -1 ? -1 : entry.repeat - 1,
        callback: () => this.startBurstSpawner(wave),
      });
    }

    this.activeWaves.push(wave);
  }

  /**
   * Spawns a single burst using one repeating timer instead of N delayedCalls.
   * Cancels previous burst spawner if still running.
   */
  private startBurstSpawner(wave: ActiveWave): void {
    const entry = wave.entry;
    const def = ENEMIES[entry.enemyKey];
    if (!def) return;

    // Cancel previous burst's spawner if it's still running
    if (wave.spawnTimer) {
      wave.spawnTimer.destroy();
      wave.spawnTimer = null;
    }

    if (entry.count <= 1 || entry.interval <= 0) {
      // Single enemy or instant burst — spawn directly
      this.trySpawnEnemy(def, entry.hpMul ?? 1, entry.speedMul ?? 1);
      return;
    }

    // Repeating timer: spawns one enemy per tick, up to entry.count
    let spawned = 0;
    wave.spawnTimer = this.scene.time.addEvent({
      delay: entry.interval,
      repeat: entry.count - 1,
      callback: () => {
        if (this.enemyPool.count < MAX_ENEMIES_ON_SCREEN) {
          this.trySpawnEnemy(def, entry.hpMul ?? 1, entry.speedMul ?? 1);
        }
        spawned++;
        if (spawned >= entry.count && wave.spawnTimer) {
          wave.spawnTimer.destroy();
          wave.spawnTimer = null;
        }
      },
    });

    // Spawn first one immediately (timer fires after first delay)
    if (this.enemyPool.count < MAX_ENEMIES_ON_SCREEN) {
      this.trySpawnEnemy(def, entry.hpMul ?? 1, entry.speedMul ?? 1);
    }
  }

  private trySpawnEnemy(def: EnemyDef, hpMul: number, speedMul: number): void {
    if (this.enemyPool.count >= MAX_ENEMIES_ON_SCREEN) return;
    const pos = this.getSpawnPosition();
    const isElite = !def.isBoss && Math.random() < 0.03;
    const enemy = new Enemy(this.scene, pos.x, pos.y, def, hpMul, speedMul, isElite);
    this.enemyPool.add(enemy);
  }

  private getSpawnPosition(): { x: number; y: number } {
    const cam = this.scene.cameras.main;
    const m = ENEMY_SPAWN_MARGIN;
    const side = Phaser.Math.Between(0, 3);
    let x: number, y: number;

    switch (side) {
      case 0:
        x = Phaser.Math.Between(cam.scrollX - m, cam.scrollX + cam.width + m);
        y = cam.scrollY - m;
        break;
      case 1:
        x = cam.scrollX + cam.width + m;
        y = Phaser.Math.Between(cam.scrollY - m, cam.scrollY + cam.height + m);
        break;
      case 2:
        x = Phaser.Math.Between(cam.scrollX - m, cam.scrollX + cam.width + m);
        y = cam.scrollY + cam.height + m;
        break;
      default:
        x = cam.scrollX - m;
        y = Phaser.Math.Between(cam.scrollY - m, cam.scrollY + cam.height + m);
        break;
    }

    return {
      x: Phaser.Math.Clamp(x, WORLD_BOUND_MARGIN, WORLD_WIDTH - WORLD_BOUND_MARGIN),
      y: Phaser.Math.Clamp(y, WORLD_BOUND_MARGIN, WORLD_HEIGHT - WORLD_BOUND_MARGIN),
    };
  }

  destroy(): void {
    for (const wave of this.activeWaves) {
      if (wave.burstTimer) wave.burstTimer.destroy();
      if (wave.spawnTimer) wave.spawnTimer.destroy();
    }
    this.activeWaves = [];
  }
}
