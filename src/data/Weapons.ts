import { WeaponUpgrade } from '../types/GameTypes';

/**
 * Weapon upgrades available for level-up selection
 * Organized by type and rarity
 */
export const WEAPON_UPGRADES: WeaponUpgrade[] = [
  // Projectile Upgrades
  {
    id: 'proj_damage_1',
    name: '날카로운 투사체',
    description: '투사체 데미지 +10',
    type: 'projectile',
    statBonus: {
      damage: 10
    },
    rarity: 'common'
  },
  {
    id: 'proj_speed_1',
    name: '빠른 발사',
    description: '공격 속도 +0.5',
    type: 'projectile',
    statBonus: {
      attackSpeed: 0.5
    },
    rarity: 'common'
  },
  {
    id: 'proj_velocity_1',
    name: '가속 강화',
    description: '투사체 속도 +100',
    type: 'projectile',
    statBonus: {
      projectileSpeed: 100
    },
    rarity: 'common'
  },
  {
    id: 'proj_damage_2',
    name: '치명적인 투사체',
    description: '투사체 데미지 +25',
    type: 'projectile',
    statBonus: {
      damage: 25
    },
    rarity: 'rare'
  },
  {
    id: 'proj_speed_2',
    name: '연사 강화',
    description: '공격 속도 +1.0',
    type: 'projectile',
    statBonus: {
      attackSpeed: 1.0
    },
    rarity: 'rare'
  },
  {
    id: 'proj_damage_3',
    name: '치명적인 일격',
    description: '투사체 데미지 +50',
    type: 'projectile',
    statBonus: {
      damage: 50
    },
    rarity: 'epic'
  },

  // Melee Upgrades
  {
    id: 'melee_damage_1',
    name: '강한 검날',
    description: '근거리 데미지 +15',
    type: 'melee',
    statBonus: {
      damage: 15
    },
    rarity: 'common'
  },
  {
    id: 'melee_range_1',
    name: '넓은 범위',
    description: '공격 범위 +20',
    type: 'melee',
    statBonus: {
      range: 20
    },
    rarity: 'common'
  },
  {
    id: 'melee_speed_1',
    name: '빠른 휘두름',
    description: '공격 속도 +0.5',
    type: 'melee',
    statBonus: {
      attackSpeed: 0.5
    },
    rarity: 'common'
  },
  {
    id: 'melee_damage_2',
    name: '강력한 검',
    description: '근거리 데미지 +35',
    type: 'melee',
    statBonus: {
      damage: 35
    },
    rarity: 'rare'
  },
  {
    id: 'melee_range_2',
    name: '광범위 공격',
    description: '공격 범위 +40',
    type: 'melee',
    statBonus: {
      range: 40
    },
    rarity: 'rare'
  },
  {
    id: 'melee_damage_3',
    name: '파괴적인 검날',
    description: '근거리 데미지 +60',
    type: 'melee',
    statBonus: {
      damage: 60
    },
    rarity: 'epic'
  },

  // General Upgrades (apply to both)
  {
    id: 'general_speed_1',
    name: '민첩성',
    description: '전체 공격 속도 +0.3',
    type: 'projectile', // Will be applied to both
    statBonus: {
      attackSpeed: 0.3
    },
    rarity: 'common'
  },
  {
    id: 'general_damage_1',
    name: '힘',
    description: '전체 데미지 +5',
    type: 'projectile', // Will be applied to both
    statBonus: {
      damage: 5
    },
    rarity: 'common'
  }
];

/**
 * Get random upgrades for level-up selection
 * @param count Number of upgrades to return
 * @param currentLevel Current player level (affects rarity chances)
 * @returns Array of random upgrades
 */
export function getRandomUpgrades(count: number = 3, currentLevel: number = 1): WeaponUpgrade[] {
  // Filter upgrades based on level (higher level = better drops)
  const availableUpgrades = WEAPON_UPGRADES.filter(upgrade => {
    // Allow common upgrades at any level
    if (upgrade.rarity === 'common') return true;

    // Rare upgrades available from level 3+
    if (upgrade.rarity === 'rare' && currentLevel >= 3) return true;

    // Epic upgrades available from level 5+
    if (upgrade.rarity === 'epic' && currentLevel >= 5) return true;

    // Legendary upgrades available from level 7+
    if (upgrade.rarity === 'legendary' && currentLevel >= 7) return true;

    return false;
  });

  // Shuffle and pick random upgrades
  const shuffled = [...availableUpgrades].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get rarity color for UI display (returns hex number for Phaser graphics)
 */
export function getRarityColor(rarity: string): number {
  switch (rarity) {
    case 'common': return 0xffffff;      // White
    case 'rare': return 0x0088ff;        // Blue
    case 'epic': return 0xaa00ff;        // Purple
    case 'legendary': return 0xffaa00;   // Orange
    default: return 0xffffff;
  }
}

/**
 * Get rarity color as hex string for text styles
 */
export function getRarityColorString(rarity: string): string {
  switch (rarity) {
    case 'common': return '#ffffff';      // White
    case 'rare': return '#0088ff';        // Blue
    case 'epic': return '#aa00ff';        // Purple
    case 'legendary': return '#ffaa00';   // Orange
    default: return '#ffffff';
  }
}
