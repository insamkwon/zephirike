/**
 * WeaponSelector System
 * Provides intelligent weapon option generation with bias towards player needs
 */

import {
  Weapon,
  WeaponOption,
  WeaponType,
  WeaponCategory,
  WeaponSelectionResult
} from '../types/WeaponTypes';
import { WeaponPool } from './WeaponPool';

/**
 * Player state for smart weapon selection
 */
export interface PlayerState {
  level: number;
  currentWeapons: Weapon[];
  hp: number;
  maxHp: number;
  killCount: number;
  playTime: number;           // seconds
  preferredDamageTypes?: string[];
}

/**
 * Selection strategy for weapon options
 */
export enum SelectionStrategy {
  RANDOM = 'RANDOM',           // Pure random selection
  BALANCED = 'BALANCED',       // Balance between offense and defense
  OFFENSIVE = 'OFFENSIVE',     // Focus on damage weapons
  DEFENSIVE = 'DEFENSIVE',     // Focus on defensive/utility
  COMPLEMENT = 'COMPLEMENT'    // Fill gaps in current build
}

/**
 * Configuration for weapon selector
 */
export interface WeaponSelectorConfig {
  optionCount: number;         // Number of options to present
  strategy: SelectionStrategy;
  considerExistingWeapons: boolean;
  balanceSynergy: boolean;     // Prefer weapons that synergize with current build
  rarityLuckBonus: number;     // Bonus to higher rarity chances (0-1)
}

/**
 * Default configuration
 */
const DEFAULT_SELECTOR_CONFIG: WeaponSelectorConfig = {
  optionCount: 3,
  strategy: SelectionStrategy.BALANCED,
  considerExistingWeapons: true,
  balanceSynergy: true,
  rarityLuckBonus: 0.1
};

/**
 * WeaponSelector provides intelligent weapon selection based on game state
 */
export class WeaponSelector {
  private config: WeaponSelectorConfig;
  private weaponPool: WeaponPool;

  constructor(config: Partial<WeaponSelectorConfig> = {}, weaponPool?: WeaponPool) {
    this.config = { ...DEFAULT_SELECTOR_CONFIG, ...config };
    this.weaponPool = weaponPool || new WeaponPool();
  }

  /**
   * Generate weapon options for player selection
   */
  generateOptions(playerState: PlayerState): WeaponSelectionResult {
    let options: WeaponOption[];

    switch (this.config.strategy) {
      case SelectionStrategy.RANDOM:
        options = this.generateRandomOptions(playerState);
        break;
      case SelectionStrategy.BALANCED:
        options = this.generateBalancedOptions(playerState);
        break;
      case SelectionStrategy.OFFENSIVE:
        options = this.generateOffensiveOptions(playerState);
        break;
      case SelectionStrategy.DEFENSIVE:
        options = this.generateDefensiveOptions(playerState);
        break;
      case SelectionStrategy.COMPLEMENT:
        options = this.generateComplementOptions(playerState);
        break;
      default:
        options = this.generateRandomOptions(playerState);
    }

    return {
      options,
      timestamp: Date.now()
    };
  }

  /**
   * Generate completely random weapon options
   */
  private generateRandomOptions(playerState: PlayerState): WeaponOption[] {
    const weaponOptions = this.weaponPool.getWeaponOptions(
      playerState.currentWeapons,
      this.config.optionCount
    );

    return weaponOptions.map(option => ({
      weapon: option.weapon,
      canUpgrade: option.canUpgrade,
      reason: option.canUpgrade ? 'Upgrade available' : 'New weapon'
    }));
  }

  /**
   * Generate balanced options (mix of offense, defense, utility)
   */
  private generateBalancedOptions(playerState: PlayerState): WeaponOption[] {
    const currentCategories = this.getCurrentWeaponCategories(playerState.currentWeapons);
    const offensiveCount = currentCategories.get(WeaponCategory.OFFENSIVE) || 0;
    const defensiveCount = currentCategories.get(WeaponCategory.DEFENSIVE) || 0;
    const utilityCount = currentCategories.get(WeaponCategory.UTILITY) || 0;

    const options: WeaponOption[] = [];
    const optionCount = this.config.optionCount;

    // Find the category with minimum count (prioritize underrepresented categories)
    const minCount = Math.min(offensiveCount, defensiveCount, utilityCount);

    // Completely missing categories (count === 0) get highest priority
    // Order: offense > defense > utility (offense is most critical when missing)
    const missingCategories: Array<{ category: WeaponCategory; count: number }> = [];
    if (offensiveCount === 0) missingCategories.push({ category: WeaponCategory.OFFENSIVE, count: offensiveCount });
    if (defensiveCount === 0) missingCategories.push({ category: WeaponCategory.DEFENSIVE, count: defensiveCount });
    if (utilityCount === 0) missingCategories.push({ category: WeaponCategory.UTILITY, count: utilityCount });

    if (missingCategories.length > 0) {
      // Prioritize first missing category based on offense > defense > utility order
      const priorityCategory = missingCategories[0].category;
      options.push(...this.getCategoryOptions(priorityCategory, playerState, Math.ceil(optionCount / 2)));
    } else {
      // All categories present, use standard tie-breaking logic
      // Prioritize defense > utility > offense when there are ties
      if (defensiveCount === minCount) {
        // Need more defense (prioritize defense in ties)
        options.push(...this.getCategoryOptions(WeaponCategory.DEFENSIVE, playerState, Math.ceil(optionCount / 2)));
      } else if (utilityCount === minCount) {
        // Need more utility
        options.push(...this.getCategoryOptions(WeaponCategory.UTILITY, playerState, Math.ceil(optionCount / 2)));
      } else if (offensiveCount === minCount) {
        // Need more offense (least priority since players usually have enough)
        options.push(...this.getCategoryOptions(WeaponCategory.OFFENSIVE, playerState, Math.ceil(optionCount / 2)));
      }
    }

    // Fill remaining slots with balanced options
    const remaining = optionCount - options.length;
    if (remaining > 0) {
      options.push(...this.weaponPool.getWeaponOptions(playerState.currentWeapons, remaining));
    }

    return options.slice(0, optionCount);
  }

  /**
   * Generate offensive-focused options
   */
  private generateOffensiveOptions(playerState: PlayerState): WeaponOption[] {
    const offensiveOptions = this.getCategoryOptions(
      WeaponCategory.OFFENSIVE,
      playerState,
      this.config.optionCount
    );

    // If not enough offensive options, fill with others
    const remaining = this.config.optionCount - offensiveOptions.length;
    if (remaining > 0) {
      offensiveOptions.push(...this.weaponPool.getWeaponOptions(playerState.currentWeapons, remaining));
    }

    return offensiveOptions.slice(0, this.config.optionCount);
  }

  /**
   * Generate defensive-focused options
   */
  private generateDefensiveOptions(playerState: PlayerState): WeaponOption[] {
    const hpPercent = playerState.hp / playerState.maxHp;

    // Prioritize defensive if low HP
    let defensiveCount = this.config.optionCount;
    if (hpPercent > 0.5) {
      defensiveCount = Math.ceil(this.config.optionCount / 2);
    }

    const defensiveOptions = this.getCategoryOptions(
      WeaponCategory.DEFENSIVE,
      playerState,
      defensiveCount
    );

    // Fill remaining with other options
    const remaining = this.config.optionCount - defensiveOptions.length;
    if (remaining > 0) {
      // When HP is high, ensure we get non-defensive options for variety
      if (hpPercent > 0.5) {
        // Try to get offensive and utility options first
        const offensiveOpts = this.getCategoryOptions(
          WeaponCategory.OFFENSIVE,
          playerState,
          Math.ceil(remaining / 2)
        );
        defensiveOptions.push(...offensiveOpts);

        const remaining2 = remaining - offensiveOpts.length;
        if (remaining2 > 0) {
          const utilityOpts = this.getCategoryOptions(
            WeaponCategory.UTILITY,
            playerState,
            remaining2
          );
          defensiveOptions.push(...utilityOpts);
        }

        // If still need more, fill with random (excluding defensive if possible)
        const remaining3 = this.config.optionCount - defensiveOptions.length;
        if (remaining3 > 0) {
          defensiveOptions.push(...this.weaponPool.getWeaponOptions(playerState.currentWeapons, remaining3));
        }
      } else {
        // When HP is low, just fill with whatever is available
        defensiveOptions.push(...this.weaponPool.getWeaponOptions(playerState.currentWeapons, remaining));
      }
    }

    return defensiveOptions.slice(0, this.config.optionCount);
  }

  /**
   * Generate complementary options (fill gaps in build)
   */
  private generateComplementOptions(playerState: PlayerState): WeaponOption[] {
    const currentTypes = this.getCurrentWeaponTypes(playerState.currentWeapons);

    const options: WeaponOption[] = [];

    // Prioritize missing weapon types
    const allTypes = Object.values(WeaponType);
    const missingTypes = allTypes.filter(type => !currentTypes.has(type));

    for (const type of missingTypes.slice(0, this.config.optionCount)) {
      const weapon = this.getRandomWeaponByType(type, playerState);
      if (weapon) {
        options.push({
          weapon,
          canUpgrade: false,
          reason: `New ${type} type`
        });
      }
    }

    // Fill remaining with upgrades or random
    const remaining = this.config.optionCount - options.length;
    if (remaining > 0) {
      options.push(...this.weaponPool.getWeaponOptions(playerState.currentWeapons, remaining));
    }

    return options.slice(0, this.config.optionCount);
  }

  /**
   * Get options filtered by category
   * Directly creates weapons of the specified category instead of filtering from getWeaponOptions
   */
  private getCategoryOptions(
    category: WeaponCategory,
    playerState: PlayerState,
    count: number
  ): WeaponOption[] {
    const options: WeaponOption[] = [];
    let found = 0;

    // First, try to get upgrades for existing weapons in this category
    const categoryWeapons = playerState.currentWeapons.filter(w => w.category === category);
    const upgradableCategoryWeapons = categoryWeapons.filter(w => w.level < w.maxLevel);

    // Add upgrade options for weapons in this category
    for (const weapon of upgradableCategoryWeapons) {
      if (found >= count) break;

      const upgraded = this.weaponPool.createWeapon(weapon.id, weapon.rarity, weapon.level + 1);
      if (upgraded) {
        options.push({
          weapon: upgraded,
          canUpgrade: true,
          reason: `Upgrade ${weapon.name}`
        });
        found++;
      }
    }

    // If we still need more options, get new weapons of this category
    if (found < count) {
      const weaponIds = this.weaponPool.getAvailableWeaponIds();

      // Filter weapon IDs by category
      const categoryWeaponIds = weaponIds.filter(id => {
        const def = this.weaponPool.getWeaponDefinition(id);
        return def && def.category === category;
      });

      // Get existing weapon IDs to avoid duplicates
      const existingIds = new Set(playerState.currentWeapons.map(w => w.id));
      const availableIds = categoryWeaponIds.filter(id => !existingIds.has(id));

      // Shuffle and pick
      const shuffledIds = this.shuffleArray(availableIds);
      for (const id of shuffledIds) {
        if (found >= count) break;

        const rarity = this.weaponPool.getRandomRarity();
        const weapon = this.weaponPool.createWeapon(id, rarity, 1);

        if (weapon) {
          options.push({
            weapon,
            canUpgrade: false,
            reason: `New ${category} weapon`
          });
          found++;
        }
      }
    }

    return options.slice(0, count);
  }

  /**
   * Get a random weapon by type
   */
  private getRandomWeaponByType(type: WeaponType, _playerState: PlayerState): Weapon | null {
    const weaponIds = this.weaponPool.getAvailableWeaponIds();
    const filteredIds = weaponIds.filter(id => {
      const def = this.weaponPool.getWeaponDefinition(id);
      return def && def.type === type;
    });

    if (filteredIds.length === 0) return null;

    const randomId = filteredIds[Math.floor(Math.random() * filteredIds.length)];
    const rarity = this.weaponPool.getRandomRarity();

    return this.weaponPool.createWeapon(randomId, rarity, 1);
  }

  /**
   * Get current weapon categories
   */
  private getCurrentWeaponCategories(weapons: Weapon[]): Map<WeaponCategory, number> {
    const categories = new Map<WeaponCategory, number>();

    for (const weapon of weapons) {
      categories.set(weapon.category, (categories.get(weapon.category) || 0) + 1);
    }

    return categories;
  }

  /**
   * Get current weapon types
   */
  private getCurrentWeaponTypes(weapons: Weapon[]): Set<WeaponType> {
    const types = new Set<WeaponType>();

    for (const weapon of weapons) {
      types.add(weapon.type);
    }

    return types;
  }

  /**
   * Shuffle array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Update selector configuration
   */
  updateConfig(updates: Partial<WeaponSelectorConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current configuration
   */
  getConfig(): WeaponSelectorConfig {
    return { ...this.config };
  }

  /**
   * Set selection strategy
   */
  setStrategy(strategy: SelectionStrategy): void {
    this.config.strategy = strategy;
  }

  /**
   * Get current strategy
   */
  getStrategy(): SelectionStrategy {
    return this.config.strategy;
  }
}

/**
 * Helper function to create weapon options for level-up screen
 */
export function createLevelUpOptions(
  playerState: PlayerState,
  strategy: SelectionStrategy = SelectionStrategy.BALANCED
): WeaponOption[] {
  const selector = new WeaponSelector({ strategy });
  const result = selector.generateOptions(playerState);
  return result.options;
}

/**
 * Helper function to create initial weapon selection
 */
export function createInitialWeaponOptions(count: number = 3): Weapon[] {
  const pool = new WeaponPool();
  return pool.selectRandomWeapons(count, []);
}
