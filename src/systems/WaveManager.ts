import Phaser from 'phaser';
import { WAVES, WaveEntry } from '../config/waveConfig';
import { ENEMIES, EnemyDef } from '../config/enemyConfig';
import { Enemy } from '../entities/Enemy';
import { MAX_ENEMIES_ON_SCREEN, ENEMY_SPAWN_MARGIN } from '../config/constants';

interface ActiveWave {
  entry: WaveEntry;
  timer: Phaser.Time.TimerEvent | null;
  spawnCount: number;
  burstCount: number;
}

export class WaveManager {
  private scene: Phaser.Scene;
  private enemyGroup: Phaser.Physics.Arcade.Group;
  private activeWaves: ActiveWave[];
  private activatedIndices: Set<number>;
  constructor(
    scene: Phaser.Scene,
    enemyGroup: Phaser.Physics.Arcade.Group,
    _playerRef: { x: number; y: number }
  ) {
    this.scene = scene;
    this.enemyGroup = enemyGroup;
    this.activeWaves = [];
    this.activatedIndices = new Set();
  }

  update(elapsedSeconds: number): void {
    // Check if new waves should activate
    for (let i = 0; i < WAVES.length; i++) {
      if (this.activatedIndices.has(i)) continue;
      if (elapsedSeconds >= WAVES[i].time) {
        this.activatedIndices.add(i);
        this.startWave(WAVES[i]);
      }
    }
  }

  private startWave(entry: WaveEntry): void {
    const wave: ActiveWave = {
      entry,
      timer: null,
      spawnCount: 0,
      burstCount: 0,
    };

    // Spawn first burst immediately
    this.spawnBurst(wave);

    // Set up repeating bursts if needed
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

    let spawned = 0;
    let delay = 0;
    for (let i = 0; i < entry.count; i++) {
      // Check max enemies cap
      const currentCount = this.enemyGroup.getChildren().filter(e => (e as Enemy).active).length;
      if (currentCount >= MAX_ENEMIES_ON_SCREEN) break;

      this.scene.time.delayedCall(delay, () => {
        this.spawnEnemy(def, entry.hpMul ?? 1, entry.speedMul ?? 1);
      });
      delay += entry.interval;
      spawned++;
    }
    wave.burstCount++;
  }

  private spawnEnemy(def: EnemyDef, hpMul: number, speedMul: number): void {
    const pos = this.getSpawnPosition();
    const enemy = new Enemy(this.scene, pos.x, pos.y, def, hpMul, speedMul);
    this.enemyGroup.add(enemy);
  }

  private getSpawnPosition(): { x: number; y: number } {
    const cam = this.scene.cameras.main;
    const margin = ENEMY_SPAWN_MARGIN;

    // Random side: 0=top, 1=right, 2=bottom, 3=left
    const side = Phaser.Math.Between(0, 3);
    let x: number, y: number;

    switch (side) {
      case 0: // top
        x = Phaser.Math.Between(cam.scrollX - margin, cam.scrollX + cam.width + margin);
        y = cam.scrollY - margin;
        break;
      case 1: // right
        x = cam.scrollX + cam.width + margin;
        y = Phaser.Math.Between(cam.scrollY - margin, cam.scrollY + cam.height + margin);
        break;
      case 2: // bottom
        x = Phaser.Math.Between(cam.scrollX - margin, cam.scrollX + cam.width + margin);
        y = cam.scrollY + cam.height + margin;
        break;
      default: // left
        x = cam.scrollX - margin;
        y = Phaser.Math.Between(cam.scrollY - margin, cam.scrollY + cam.height + margin);
        break;
    }

    // Clamp to world bounds
    x = Phaser.Math.Clamp(x, 50, 3950);
    y = Phaser.Math.Clamp(y, 50, 3950);

    return { x, y };
  }

  /** Stop all active wave timers */
  destroy(): void {
    for (const wave of this.activeWaves) {
      if (wave.timer) wave.timer.destroy();
    }
    this.activeWaves = [];
  }
}
