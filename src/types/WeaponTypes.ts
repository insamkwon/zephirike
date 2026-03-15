/**
 * Weapon Types and Interfaces for Zephirike
 * Defines the complete weapon system including types, rarities, and upgrade mechanics
 */

/**
 * Weapon rarity levels that affect stat ranges and spawn weights
 */
export enum WeaponRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

/**
 * Different weapon types with unique behaviors
 */
export enum WeaponType {
  PROJECTILE = 'PROJECTILE',     // Single target projectiles (e.g., magic wand)
  MELEE = 'MELEE',                // Close range attacks (e.g., sword)
  AREA = 'AREA',                  // Area of effect (e.g., explosion)
  ORBITAL = 'ORBITAL',            // Rotating around player (e.g., aura)
  PASSIVE = 'PASSIVE'             // Passive bonuses (e.g., max HP increase)
}

/**
 * Weapon categories for logical grouping
 */
export enum WeaponCategory {
  OFFENSIVE = 'OFFENSIVE',        // Damage-dealing weapons
  DEFENSIVE = 'DEFENSIVE',        // Defensive abilities
  UTILITY = 'UTILITY'             // Utility/buff abilities
}

/**
 * Damage types for strategic depth
 */
export enum DamageType {
  PHYSICAL = 'PHYSICAL',
  MAGICAL = 'MAGICAL',
  FIRE = 'FIRE',
  ICE = 'ICE',
  LIGHTNING = 'LIGHTNING',
  POISON = 'POISON'
}

/**
 * Base weapon interface with core attributes
 */
export interface Weapon {
  id: string;
  name: string;
  description: string;
  type: WeaponType;
  category: WeaponCategory;
  rarity: WeaponRarity;
  damageType: DamageType;

  // Core stats
  damage: number;
  fireRate: number;           // attacks per second
  range: number;
  projectileSpeed?: number;
  duration?: number;          // for effects
  area?: number;              // area of effect radius

  // Visual and audio
  sprite?: string;
  soundEffect?: string;

  // Progression
  level: number;
  maxLevel: number;
  experience: number;
}

/**
 * Weapon upgrade option presented to player
 */
export interface WeaponOption {
  weapon: Weapon;
  canUpgrade: boolean;
  reason?: string;            // e.g., "Max level reached"
}

/**
 * Weapon definition for pool initialization
 */
export interface WeaponDefinition {
  id: string;
  name: string;
  description: string;
  type: WeaponType;
  category: WeaponCategory;
  damageType: DamageType;

  // Base stats (at level 1)
  baseDamage: number;
  baseFireRate: number;
  baseRange: number;
  baseProjectileSpeed?: number;
  baseDuration?: number;
  baseArea?: number;

  // Growth per level
  damageGrowth: number;       // percentage or flat amount
  fireRateGrowth: number;
  rangeGrowth: number;

  // Visual
  sprite?: string;

  // Rarity weights (chance to spawn in pool)
  rarityWeights: {
    [key in WeaponRarity]?: number;
  };

  // Maximum level
  maxLevel: number;
}

/**
 * Weapon pool configuration
 */
export interface WeaponPoolConfig {
  poolSize: number;           // How many weapons in the pool
  commonWeight: number;
  uncommonWeight: number;
  rareWeight: number;
  epicWeight: number;
  legendaryWeight: number;

  // Duplicate handling
  allowDuplicates: boolean;
  maxDuplicates: number;
}

/**
 * Selection result from weapon pool
 */
export interface WeaponSelectionResult {
  options: WeaponOption[];
  timestamp: number;
}
