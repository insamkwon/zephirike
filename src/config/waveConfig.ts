/** Wave definitions — which enemies spawn at what times */

export interface WaveEntry {
  time: number;       // seconds from game start
  enemyKey: string;
  count: number;      // spawn per burst
  interval: number;   // ms between spawns in burst
  repeat: number;     // repeat bursts (-1 = until next wave)
  repeatDelay: number;// ms between bursts
  hpMul?: number;     // HP multiplier
  speedMul?: number;  // speed multiplier
}

export const WAVES: WaveEntry[] = [
  // 0:00 - Bats only
  { time: 0,   enemyKey: 'bat',      count: 3,  interval: 400, repeat: -1, repeatDelay: 3000 },
  // 0:30 - Add skeletons
  { time: 30,  enemyKey: 'skeleton',  count: 2,  interval: 500, repeat: -1, repeatDelay: 4000 },
  // 1:00 - More bats, faster
  { time: 60,  enemyKey: 'bat',      count: 5,  interval: 300, repeat: -1, repeatDelay: 2500 },
  // 1:30 - Zombies join
  { time: 90,  enemyKey: 'zombie',   count: 2,  interval: 600, repeat: -1, repeatDelay: 4000 },
  // 2:00 - Ghosts
  { time: 120, enemyKey: 'ghost',    count: 3,  interval: 400, repeat: -1, repeatDelay: 3500 },
  // 3:00 - Surge wave
  { time: 180, enemyKey: 'bat',      count: 10, interval: 200, repeat: -1, repeatDelay: 2000, hpMul: 1.5 },
  { time: 180, enemyKey: 'skeleton', count: 5,  interval: 300, repeat: -1, repeatDelay: 3000, hpMul: 1.5 },
  // 4:00 - Demons
  { time: 240, enemyKey: 'demon',    count: 2,  interval: 800, repeat: -1, repeatDelay: 5000 },
  // 5:00 - First boss
  { time: 300, enemyKey: 'reaper',   count: 1,  interval: 0,   repeat: 0,  repeatDelay: 0 },
  // 5:00 - Continued regular spawns, harder
  { time: 300, enemyKey: 'ghost',    count: 5,  interval: 300, repeat: -1, repeatDelay: 2500, hpMul: 2 },
  { time: 300, enemyKey: 'demon',    count: 3,  interval: 500, repeat: -1, repeatDelay: 3500, hpMul: 1.5 },
  // 7:00 - Mass waves
  { time: 420, enemyKey: 'zombie',   count: 8,  interval: 200, repeat: -1, repeatDelay: 2000, hpMul: 2.5, speedMul: 1.3 },
  { time: 420, enemyKey: 'skeleton', count: 6,  interval: 250, repeat: -1, repeatDelay: 2000, hpMul: 2, speedMul: 1.2 },
  // 10:00 - Second boss
  { time: 600, enemyKey: 'reaper',   count: 1,  interval: 0,   repeat: 0,  repeatDelay: 0, hpMul: 2 },
  // 10:00 - Endgame swarm
  { time: 600, enemyKey: 'bat',      count: 15, interval: 100, repeat: -1, repeatDelay: 1500, hpMul: 3, speedMul: 1.5 },
  { time: 600, enemyKey: 'demon',    count: 5,  interval: 400, repeat: -1, repeatDelay: 2500, hpMul: 2.5, speedMul: 1.3 },
  // 13:00 - Final boss
  { time: 780, enemyKey: 'reaper',   count: 1,  interval: 0,   repeat: 0,  repeatDelay: 0, hpMul: 4 },
  { time: 780, enemyKey: 'ghost',    count: 10, interval: 150, repeat: -1, repeatDelay: 1500, hpMul: 3, speedMul: 1.5 },
];
