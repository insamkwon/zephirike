export type EnemyAI = 'chase' | 'zigzag' | 'ranged' | 'teleport' | 'pack' | 'charge' | 'boss';

export interface EnemyDef {
  key: string;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  xp: number;
  color: number;
  size: number;
  ai: EnemyAI;
  isBoss?: boolean;
}

export const ENEMIES: Record<string, EnemyDef> = {
  bat: {
    key: 'bat',
    name: 'Bat',
    hp: 8,
    speed: 80,
    damage: 5,
    xp: 1,
    color: 0x8844aa,
    size: 8,
    ai: 'zigzag',
  },
  skeleton: {
    key: 'skeleton',
    name: 'Skeleton',
    hp: 20,
    speed: 50,
    damage: 10,
    xp: 3,
    color: 0xcccccc,
    size: 10,
    ai: 'ranged',
  },
  zombie: {
    key: 'zombie',
    name: 'Zombie',
    hp: 40,
    speed: 30,
    damage: 15,
    xp: 5,
    color: 0x44aa44,
    size: 12,
    ai: 'pack',
  },
  ghost: {
    key: 'ghost',
    name: 'Ghost',
    hp: 15,
    speed: 90,
    damage: 8,
    xp: 4,
    color: 0xaaaaff,
    size: 10,
    ai: 'teleport',
  },
  demon: {
    key: 'demon',
    name: 'Demon',
    hp: 60,
    speed: 55,
    damage: 20,
    xp: 8,
    color: 0xff4444,
    size: 14,
    ai: 'charge',
  },
  reaper: {
    key: 'reaper',
    name: 'Reaper',
    hp: 300,
    speed: 40,
    damage: 30,
    xp: 50,
    color: 0x220022,
    size: 20,
    ai: 'boss',
    isBoss: true,
  },
};
