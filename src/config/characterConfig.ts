export interface CharacterDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  startingWeapon: string;
  /** Stat multipliers (1.0 = default) */
  hpMul: number;
  speedMul: number;
  damageMul: number;
  cooldownMul: number;  // lower = faster
  magnetMul: number;
  unlockCondition: string;
  unlocked: boolean;    // default state
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'knight',
    name: 'Knight',
    icon: '🛡️',
    description: 'Balanced warrior. Starts with Whip.',
    startingWeapon: 'whip',
    hpMul: 1.2,
    speedMul: 0.9,
    damageMul: 1.0,
    cooldownMul: 1.0,
    magnetMul: 1.0,
    unlockCondition: 'Available from start',
    unlocked: true,
  },
  {
    id: 'mage',
    name: 'Mage',
    icon: '🔮',
    description: 'Glass cannon. Starts with Magic Bolt.',
    startingWeapon: 'magic_bolt',
    hpMul: 0.8,
    speedMul: 1.0,
    damageMul: 1.3,
    cooldownMul: 0.9,
    magnetMul: 1.2,
    unlockCondition: 'Reach Level 10 in any run',
    unlocked: true,
  },
  {
    id: 'rogue',
    name: 'Rogue',
    icon: '🗡️',
    description: 'Fast and lucky. Starts with Garlic.',
    startingWeapon: 'garlic',
    hpMul: 0.9,
    speedMul: 1.3,
    damageMul: 0.9,
    cooldownMul: 0.85,
    magnetMul: 1.5,
    unlockCondition: 'Kill 500 enemies in a single run',
    unlocked: false,
  },
  {
    id: 'warlock',
    name: 'Warlock',
    icon: '👁️',
    description: 'Dark power. Starts with Lightning.',
    startingWeapon: 'lightning',
    hpMul: 0.7,
    speedMul: 1.0,
    damageMul: 1.5,
    cooldownMul: 1.1,
    magnetMul: 0.8,
    unlockCondition: 'Evolve any weapon',
    unlocked: false,
  },
];

const STORAGE_KEY = 'zephirike_unlocks';

export function getUnlockedCharacters(): Set<string> {
  const always = new Set(CHARACTERS.filter(c => c.unlocked).map(c => c.id));
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (data.characters) {
      for (const id of data.characters) always.add(id);
    }
  } catch { /* ignore */ }
  return always;
}

export function unlockCharacter(id: string): void {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (!data.characters) data.characters = [];
    if (!data.characters.includes(id)) data.characters.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function getUnlockedAchievements(): Set<string> {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return new Set(data.achievements ?? []);
  } catch { return new Set(); }
}

export function unlockAchievement(id: string): void {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (!data.achievements) data.achievements = [];
    if (!data.achievements.includes(id)) data.achievements.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}
