export interface MetaUpgradeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  maxLevel: number;
  costPerLevel: number[];
  effect: (level: number) => number; // returns the bonus value
}

export const META_UPGRADES: MetaUpgradeDef[] = [
  {
    id: 'max_hp',
    name: 'Max HP',
    icon: '❤️',
    description: '+10 Max HP per level',
    maxLevel: 5,
    costPerLevel: [100, 200, 400, 800, 1500],
    effect: (level) => level * 10,
  },
  {
    id: 'move_speed',
    name: 'Move Speed',
    icon: '👟',
    description: '+5% speed per level',
    maxLevel: 5,
    costPerLevel: [100, 200, 400, 800, 1500],
    effect: (level) => level * 0.05,
  },
  {
    id: 'damage',
    name: 'Damage',
    icon: '⚔️',
    description: '+8% damage per level',
    maxLevel: 5,
    costPerLevel: [150, 300, 600, 1200, 2000],
    effect: (level) => level * 0.08,
  },
  {
    id: 'xp_gain',
    name: 'XP Gain',
    icon: '⭐',
    description: '+10% XP per level',
    maxLevel: 5,
    costPerLevel: [100, 250, 500, 1000, 1800],
    effect: (level) => level * 0.10,
  },
  {
    id: 'magnet',
    name: 'Magnet Range',
    icon: '🧲',
    description: '+20% pickup range per level',
    maxLevel: 5,
    costPerLevel: [80, 160, 320, 640, 1200],
    effect: (level) => level * 0.20,
  },
];

const STORAGE_KEY_GOLD = 'zephirike_gold';
const STORAGE_KEY_UPGRADES = 'zephirike_meta_upgrades';

export function getGold(): number {
  return parseInt(localStorage.getItem(STORAGE_KEY_GOLD) ?? '0');
}

export function setGold(amount: number): void {
  localStorage.setItem(STORAGE_KEY_GOLD, Math.floor(amount).toString());
}

export function addGold(amount: number): void {
  setGold(getGold() + amount);
}

export function getUpgradeLevel(upgradeId: string): number {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY_UPGRADES) ?? '{}');
    return data[upgradeId] ?? 0;
  } catch {
    return 0;
  }
}

export function setUpgradeLevel(upgradeId: string, level: number): void {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY_UPGRADES) ?? '{}');
    data[upgradeId] = level;
    localStorage.setItem(STORAGE_KEY_UPGRADES, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/** Get all meta bonuses for the current run */
export function getMetaBonuses(): {
  bonusHp: number;
  speedMul: number;
  damageMul: number;
  xpMul: number;
  magnetMul: number;
} {
  const upgrades = META_UPGRADES;
  return {
    bonusHp: upgrades[0].effect(getUpgradeLevel('max_hp')),
    speedMul: 1 + upgrades[1].effect(getUpgradeLevel('move_speed')),
    damageMul: 1 + upgrades[2].effect(getUpgradeLevel('damage')),
    xpMul: 1 + upgrades[3].effect(getUpgradeLevel('xp_gain')),
    magnetMul: 1 + upgrades[4].effect(getUpgradeLevel('magnet')),
  };
}
