/**
 * WeaponPool System
 * Manages the collection of available weapons and provides random selection
 */

import {
  Weapon,
  WeaponDefinition,
  WeaponRarity,
  WeaponPoolConfig,
  WeaponType,
  WeaponCategory,
  DamageType
} from '../types/WeaponTypes';

/**
 * Default weapon pool configuration
 */
const DEFAULT_POOL_CONFIG: WeaponPoolConfig = {
  poolSize: 3,
  commonWeight: 50,
  uncommonWeight: 30,
  rareWeight: 15,
  epicWeight: 4,
  legendaryWeight: 1,
  allowDuplicates: false,
  maxDuplicates: 1
};

/**
 * Weapon definitions for the game
 */
export const WEAPON_DEFINITIONS: WeaponDefinition[] = [
  // PROJECTILE WEAPONS
  {
    id: 'magic_wand',
    name: 'Magic Wand',
    description: 'Fires magic bolts at the nearest enemy',
    type: WeaponType.PROJECTILE,
    category: WeaponCategory.OFFENSIVE,
    damageType: DamageType.MAGICAL,
    baseDamage: 10,
    baseFireRate: 1.0,
    baseRange: 300,
    baseProjectileSpeed: 400,
    damageGrowth: 2,
    fireRateGrowth: 0.1,
    rangeGrowth: 10,
    maxLevel: 8,
    rarityWeights: {
      [WeaponRarity.COMMON]: 60,
      [WeaponRarity.UNCOMMON]: 30,
      [WeaponRarity.RARE]: 10
    }
  },
  {
    id: 'fireball',
    name: 'Fireball',
    description: 'Launches explosive fireballs that deal area damage',
    type: WeaponType.PROJECTILE,
    category: WeaponCategory.OFFENSIVE,
    damageType: DamageType.FIRE,
    baseDamage: 25,
    baseFireRate: 0.6,
    baseRange: 400,
    baseProjectileSpeed: 350,
    baseArea: 50,
    damageGrowth: 5,
    fireRateGrowth: 0.05,
    rangeGrowth: 15,
    maxLevel: 8,
    rarityWeights: {
      [WeaponRarity.UNCOMMON]: 50,
      [WeaponRarity.RARE]: 35,
      [WeaponRarity.EPIC]: 15
    }
  },
  {
    id: 'lightning_bolt',
    name: 'Lightning Bolt',
    description: 'Strikes enemies with chain lightning',
    type: WeaponType.PROJECTILE,
    category: WeaponCategory.OFFENSIVE,
    damageType: DamageType.LIGHTNING,
    baseDamage: 15,
    baseFireRate: 0.8,
    baseRange: 350,
    baseProjectileSpeed: 600,
    damageGrowth: 3,
    fireRateGrowth: 0.08,
    rangeGrowth: 12,
    maxLevel: 8,
    rarityWeights: {
      [WeaponRarity.RARE]: 50,
      [WeaponRarity.EPIC]: 40,
      [WeaponRarity.LEGENDARY]: 10
    }
  },

  // MELEE WEAPONS
  {
    id: 'sword',
    name: 'War Sword',
    description: 'A reliable sword for close combat',
    type: WeaponType.MELEE,
    category: WeaponCategory.OFFENSIVE,
    damageType: DamageType.PHYSICAL,
    baseDamage: 20,
    baseFireRate: 1.2,
    baseRange: 50,
    baseArea: 30,
    damageGrowth: 4,
    fireRateGrowth: 0.15,
    rangeGrowth: 5,
    maxLevel: 8,
    rarityWeights: {
      [WeaponRarity.COMMON]: 70,
      [WeaponRarity.UNCOMMON]: 25,
      [WeaponRarity.RARE]: 5
    }
  },
  {
    id: 'ice_blade',
    name: 'Frost Blade',
    description: 'Slows enemies with chilling strikes',
    type: WeaponType.MELEE,
    category: WeaponCategory.OFFENSIVE,
    damageType: DamageType.ICE,
    baseDamage: 15,
    baseFireRate: 1.0,
    baseRange: 60,
    baseArea: 35,
    damageGrowth: 3,
    fireRateGrowth: 0.12,
    rangeGrowth: 8,
    maxLevel: 8,
    rarityWeights: {
      [WeaponRarity.UNCOMMON]: 40,
      [WeaponRarity.RARE]: 40,
      [WeaponRarity.EPIC]: 20
    }
  },

  // AREA WEAPONS
  {
    id: 'holy_cross',
    name: 'Holy Cross',
    description: 'Summons a damaging cross pattern',
    type: WeaponType.AREA,
    category: WeaponCategory.OFFENSIVE,
    damageType: DamageType.MAGICAL,
    baseDamage: 30,
    baseFireRate: 0.5,
    baseRange: 100,
    baseArea: 80,
    damageGrowth: 6,
    fireRateGrowth: 0.05,
    rangeGrowth: 10,
    maxLevel: 8,
    rarityWeights: {
      [WeaponRarity.RARE]: 60,
      [WeaponRarity.EPIC]: 30,
      [WeaponRarity.LEGENDARY]: 10
    }
  },
  {
    id: 'poison_cloud',
    name: 'Poison Cloud',
    description: 'Creates a lingering poison zone',
    type: WeaponType.AREA,
    category: WeaponCategory.OFFENSIVE,
    damageType: DamageType.POISON,
    baseDamage: 8,
    baseFireRate: 0.3,
    baseRange: 150,
    baseArea: 100,
    baseDuration: 3000,
    damageGrowth: 2,
    fireRateGrowth: 0.02,
    rangeGrowth: 15,
    maxLevel: 8,
    rarityWeights: {
      [WeaponRarity.UNCOMMON]: 50,
      [WeaponRarity.RARE]: 40,
      [WeaponRarity.EPIC]: 10
    }
  },

  // ORBITAL WEAPONS
  {
    id: 'aura',
    name: 'Protective Aura',
    description: 'Damages enemies near the player',
    type: WeaponType.ORBITAL,
    category: WeaponCategory.OFFENSIVE,
    damageType: DamageType.MAGICAL,
    baseDamage: 5,
    baseFireRate: 2.0,
    baseRange: 60,
    baseArea: 40,
    damageGrowth: 1,
    fireRateGrowth: 0.2,
    rangeGrowth: 5,
    maxLevel: 8,
    rarityWeights: {
      [WeaponRarity.COMMON]: 50,
      [WeaponRarity.UNCOMMON]: 35,
      [WeaponRarity.RARE]: 15
    }
  },
  {
    id: 'orbiting_shield',
    name: 'Orbiting Shield',
    description: 'Rotating shields that damage and protect',
    type: WeaponType.ORBITAL,
    category: WeaponCategory.DEFENSIVE,
    damageType: DamageType.PHYSICAL,
    baseDamage: 12,
    baseFireRate: 0.8,
    baseRange: 80,
    baseArea: 50,
    damageGrowth: 2,
    fireRateGrowth: 0.1,
    rangeGrowth: 8,
    maxLevel: 8,
    rarityWeights: {
      [WeaponRarity.RARE]: 50,
      [WeaponRarity.EPIC]: 35,
      [WeaponRarity.LEGENDARY]: 15
    }
  },

  // PASSIVE ABILITIES
  {
    id: 'max_hp_boost',
    name: 'Vitality',
    description: 'Increases maximum HP',
    type: WeaponType.PASSIVE,
    category: WeaponCategory.DEFENSIVE,
    damageType: DamageType.PHYSICAL,
    baseDamage: 0,
    baseFireRate: 0,
    baseRange: 0,
    damageGrowth: 0,
    fireRateGrowth: 0,
    rangeGrowth: 0,
    maxLevel: 5,
    rarityWeights: {
      [WeaponRarity.COMMON]: 80,
      [WeaponRarity.UNCOMMON]: 20
    }
  },
  {
    id: 'speed_boost',
    name: 'Agility',
    description: 'Increases movement speed',
    type: WeaponType.PASSIVE,
    category: WeaponCategory.UTILITY,
    damageType: DamageType.PHYSICAL,
    baseDamage: 0,
    baseFireRate: 0,
    baseRange: 0,
    damageGrowth: 0,
    fireRateGrowth: 0,
    rangeGrowth: 0,
    maxLevel: 5,
    rarityWeights: {
      [WeaponRarity.COMMON]: 70,
      [WeaponRarity.UNCOMMON]: 30
    }
  }
];

/**
 * WeaponPool class manages available weapons and generates random selections
 */
export class WeaponPool {
  private config: WeaponPoolConfig;
  private availableWeapons: Map<string, WeaponDefinition>;
  private randomSeed: number;

  constructor(config: Partial<WeaponPoolConfig> = {}) {
    this.config = { ...DEFAULT_POOL_CONFIG, ...config };
    this.availableWeapons = new Map();
    this.randomSeed = Date.now();

    // Initialize weapon pool with definitions
    WEAPON_DEFINITIONS.forEach(def => {
      this.availableWeapons.set(def.id, def);
    });
  }

  /**
   * Get all available weapon IDs
   */
  getAvailableWeaponIds(): string[] {
    return Array.from(this.availableWeapons.keys());
  }

  /**
   * Get a weapon definition by ID
   */
  getWeaponDefinition(id: string): WeaponDefinition | undefined {
    return this.availableWeapons.get(id);
  }

  /**
   * Create a weapon instance from a definition with specified rarity and level
   */
  createWeapon(id: string, rarity: WeaponRarity, level: number = 1): Weapon | null {
    const definition = this.availableWeapons.get(id);
    if (!definition) {
      return null;
    }

    if (level < 1 || level > definition.maxLevel) {
      return null;
    }

    // Calculate stats based on level and rarity
    const levelBonus = level - 1;
    const rarityMultiplier = this.getRarityMultiplier(rarity);

    const weapon: Weapon = {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      type: definition.type,
      category: definition.category,
      rarity: rarity,
      damageType: definition.damageType,
      damage: Math.floor((definition.baseDamage + definition.damageGrowth * levelBonus) * rarityMultiplier),
      fireRate: Number(((definition.baseFireRate + definition.fireRateGrowth * levelBonus) * rarityMultiplier).toFixed(2)),
      range: Math.floor((definition.baseRange + definition.rangeGrowth * levelBonus) * rarityMultiplier),
      projectileSpeed: definition.baseProjectileSpeed ? Math.floor(definition.baseProjectileSpeed * rarityMultiplier) : undefined,
      duration: definition.baseDuration ? Math.floor(definition.baseDuration * (1 + levelBonus * 0.1)) : undefined,
      area: definition.baseArea ? Math.floor(definition.baseArea * (1 + levelBonus * 0.15)) : undefined,
      sprite: definition.sprite,
      level: level,
      maxLevel: definition.maxLevel,
      experience: 0
    };

    return weapon;
  }

  /**
   * Get a random rarity based on weights
   */
  getRandomRarity(def?: WeaponDefinition): WeaponRarity {
    let weights: { [key in WeaponRarity]?: number };

    if (def && def.rarityWeights) {
      weights = def.rarityWeights;
    } else {
      weights = {
        [WeaponRarity.COMMON]: this.config.commonWeight,
        [WeaponRarity.UNCOMMON]: this.config.uncommonWeight,
        [WeaponRarity.RARE]: this.config.rareWeight,
        [WeaponRarity.EPIC]: this.config.epicWeight,
        [WeaponRarity.LEGENDARY]: this.config.legendaryWeight
      };
    }

    return this.weightedRandom(weights);
  }

  /**
   * Select random weapons from the pool
   */
  selectRandomWeapons(count: number = this.config.poolSize, existingWeapons: Weapon[] = []): Weapon[] {
    const selected: Weapon[] = [];
    const availableIds = this.getAvailableWeaponIds();
    const existingIds = new Set(existingWeapons.map(w => w.id));
    const duplicateCount = new Map<string, number>();

    // Count existing duplicates
    existingWeapons.forEach(w => {
      duplicateCount.set(w.id, (duplicateCount.get(w.id) || 0) + 1);
    });

    let attempts = 0;
    const maxAttempts = count * 10;

    while (selected.length < count && attempts < maxAttempts) {
      attempts++;

      // Randomly select a weapon ID
      const randomId = availableIds[Math.floor(this.seededRandom() * availableIds.length)];
      const definition = this.availableWeapons.get(randomId);

      if (!definition) continue;

      // Check duplicate constraints
      if (!this.config.allowDuplicates && existingIds.has(randomId)) {
        continue;
      }

      if (this.config.allowDuplicates && (duplicateCount.get(randomId) || 0) >= this.config.maxDuplicates) {
        continue;
      }

      // Get random rarity for this weapon
      const rarity = this.getRandomRarity(definition);

      // Determine level (1 for new weapons, existing level + 1 for upgrades)
      const existingWeapon = existingWeapons.find(w => w.id === randomId);
      const level = existingWeapon ? existingWeapon.level : 1;

      // Don't exceed max level
      if (existingWeapon && level >= existingWeapon.maxLevel) {
        continue;
      }

      // Create weapon instance
      const weapon = this.createWeapon(randomId, rarity, level);
      if (weapon) {
        selected.push(weapon);
        existingIds.add(randomId); // Track selected weapons to prevent duplicates
        duplicateCount.set(randomId, (duplicateCount.get(randomId) || 0) + 1);
      }
    }

    return selected;
  }

  /**
   * Get weapon options for player selection (upgrade or new weapon)
   */
  getWeaponOptions(existingWeapons: Weapon[], count: number = 3): Array<{ weapon: Weapon; canUpgrade: boolean }> {
    const options: Array<{ weapon: Weapon; canUpgrade: boolean }> = [];

    // Get existing weapons that can be upgraded
    const upgradableWeapons = existingWeapons.filter(w => w.level < w.maxLevel);

    // Mix of new weapons and upgrade options
    const upgradeCount = Math.min(Math.ceil(count / 2), upgradableWeapons.length);
    const newWeaponCount = count - upgradeCount;

    // Add upgrade options
    for (let i = 0; i < upgradeCount; i++) {
      if (upgradableWeapons.length === 0) break;

      const randomIndex = Math.floor(this.seededRandom() * upgradableWeapons.length);
      const weapon = upgradableWeapons[randomIndex];
      upgradableWeapons.splice(randomIndex, 1);

      const upgradedWeapon = this.createWeapon(
        weapon.id,
        weapon.rarity,
        weapon.level + 1
      );

      if (upgradedWeapon) {
        options.push({
          weapon: upgradedWeapon,
          canUpgrade: true
        });
      }
    }

    // Add new weapon options
    const newWeapons = this.selectRandomWeapons(newWeaponCount, existingWeapons);
    newWeapons.forEach(weapon => {
      options.push({
        weapon,
        canUpgrade: false
      });
    });

    // Shuffle options
    return this.shuffleArray(options);
  }

  /**
   * Upgrade a weapon to the next level
   */
  upgradeWeapon(weapon: Weapon): Weapon | null {
    if (weapon.level >= weapon.maxLevel) {
      return null;
    }

    return this.createWeapon(weapon.id, weapon.rarity, weapon.level + 1);
  }

  /**
   * Get rarity multiplier for stats
   */
  private getRarityMultiplier(rarity: WeaponRarity): number {
    const multipliers: { [key in WeaponRarity]: number } = {
      [WeaponRarity.COMMON]: 1.0,
      [WeaponRarity.UNCOMMON]: 1.2,
      [WeaponRarity.RARE]: 1.5,
      [WeaponRarity.EPIC]: 2.0,
      [WeaponRarity.LEGENDARY]: 2.5
    };
    return multipliers[rarity];
  }

  /**
   * Weighted random selection
   */
  private weightedRandom<T>(weights: { [key: string]: number }): T {
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    let random = this.seededRandom() * totalWeight;

    for (const [key, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) {
        return key as unknown as T;
      }
    }

    return Object.keys(weights)[0] as unknown as T;
  }

  /**
   * Seeded random number generator for reproducibility
   */
  private seededRandom(): number {
    this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
    return this.randomSeed / 233280;
  }

  /**
   * Shuffle array using seeded random
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.seededRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Reset random seed
   */
  resetSeed(seed?: number): void {
    this.randomSeed = seed || Date.now();
  }

  /**
   * Get pool configuration
   */
  getConfig(): WeaponPoolConfig {
    return { ...this.config };
  }

  /**
   * Update pool configuration
   */
  updateConfig(updates: Partial<WeaponPoolConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

/**
 * Singleton instance for global access
 */
let weaponPoolInstance: WeaponPool | null = null;

export function getWeaponPool(config?: Partial<WeaponPoolConfig>): WeaponPool {
  if (!weaponPoolInstance) {
    weaponPoolInstance = new WeaponPool(config);
  }
  return weaponPoolInstance;
}

export function resetWeaponPool(): void {
  weaponPoolInstance = null;
}
