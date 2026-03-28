import Phaser from 'phaser';
import { WAVES, WaveEntry } from '../config/waveConfig';
import { ENEMIES, EnemyDef } from '../config/enemyConfig';
import { Enemy } from '../entities/Enemy';
import { EnemyPool } from './EnemyPool';
import { MAX_ENEMIES_ON_SCREEN, ENEMY_SPAWN_MARGIN, WORLD_WIDTH, WORLD_HEIGHT, WORLD_BOUND_MARGIN } from '../config/constants';

interface ActiveWave {
  entry: WaveEntry;
  timer: Phaser.Time.TimerEvent | null;
  burstCount: number;
}

export class WaveManager {
  private scene: Phaser.Scene;
  private enemyPool: EnemyPool;
  private activeWaves: ActiveWave[];
  private activatedIndices: Set<number>;

  constructor(scene: Phaser.Scene, enemyPool: EnemyPool) {
    this.scene = scene;
    this.enemyPool = enemyPool;
    this.activeWaves = [];
    this.activatedIndices = new Set();
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
    const wave: ActiveWave = { entry, timer: null, burstCount: 0 };
    this.spawnBurst(wave);

    if (entry.repeat !== 0) {
      wave.timer = this.scene.time.addEvent({
        delay: entry.repeatDelay,
        repeat: entry.repeat === -1 ? -1 : entry.repeat - 1,
        callback: () => this.spawnBurst(wave),
      });
    }

    this.activeWaves.push(wave);
  }

  private spawnBurst(wave: ActiveWave): void {
    const entry = wave.entry;
    const def = ENEMIES[entry.enemyKey];
    if (!def) return;

    let delay = 0;
    for (let i = 0; i < entry.count; i++) {
      if (this.enemyPool.count >= MAX_ENEMIES_ON_SCREEN) break;

      this.scene.time.delayedCall(delay, () => {
        this.spawnEnemy(def, entry.hpMul ?? 1, entry.speedMul ?? 1);
      });
      delay += entry.interval;
    }
    wave.burstCount++;
  }

  private spawnEnemy(def: EnemyDef, hpMul: number, speedMul: number): void {
    const pos = this.getSpawnPosition();
    // 3% chance of elite enemy (non-boss)
    const isElite = !def.isBoss && Math.random() < 0.03;
    const enemy = new Enemy(this.scene, pos.x, pos.y, def, hpMul, speedMul, isElite);
    this.enemyPool.add(enemy);
  }

  private getSpawnPosition(): { x: number; y: number } {
    const cam = this.scene.cameras.main;
    const margin = ENEMY_SPAWN_MARGIN;
    const side = Phaser.Math.Between(0, 3);
    let x: number, y: number;

    switch (side) {
      case 0:
        x = Phaser.Math.Between(cam.scrollX - margin, cam.scrollX + cam.width + margin);
        y = cam.scrollY - margin;
        break;
      case 1:
        x = cam.scrollX + cam.width + margin;
        y = Phaser.Math.Between(cam.scrollY - margin, cam.scrollY + cam.height + margin);
        break;
      case 2:
        x = Phaser.Math.Between(cam.scrollX - margin, cam.scrollX + cam.width + margin);
        y = cam.scrollY + cam.height + margin;
        break;
      default:
        x = cam.scrollX - margin;
        y = Phaser.Math.Between(cam.scrollY - margin, cam.scrollY + cam.height + margin);
        break;
    }

    x = Phaser.Math.Clamp(x, WORLD_BOUND_MARGIN, WORLD_WIDTH - WORLD_BOUND_MARGIN);
    y = Phaser.Math.Clamp(y, WORLD_BOUND_MARGIN, WORLD_HEIGHT - WORLD_BOUND_MARGIN);
    return { x, y };
  }

  destroy(): void {
    for (const wave of this.activeWaves) {
      if (wave.timer) wave.timer.destroy();
    }
    this.activeWaves = [];
  }
}
