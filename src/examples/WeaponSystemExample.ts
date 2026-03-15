/**
 * Weapon System Integration Example
 * Demonstrates how to integrate the weapon pool and selector into the game
 */

import { WeaponPool, WeaponSelector, SelectionStrategy, PlayerState } from '../systems';
import { Weapon, WeaponRarity } from '../types/WeaponTypes';

/**
 * Example: Game weapon manager
 */
export class GameWeaponManager {
  private weaponPool: WeaponPool;
  private weaponSelector: WeaponSelector;
  private playerWeapons: Weapon[] = [];
  // Player level tracking (currently unused but reserved for future features)
  // private playerLevel: number = 1;

  constructor() {
    // Initialize weapon pool with game-specific configuration
    this.weaponPool = new WeaponPool({
      poolSize: 3,
      allowDuplicates: false,
      commonWeight: 50,
      uncommonWeight: 30,
      rareWeight: 15,
      epicWeight: 4,
      legendaryWeight: 1
    });

    // Initialize weapon selector with balanced strategy
    this.weaponSelector = new WeaponSelector({
      optionCount: 3,
      strategy: SelectionStrategy.BALANCED,
      considerExistingWeapons: true,
      balanceSynergy: true
    });
  }

  /**
   * Generate initial weapon options at game start
   */
  generateInitialOptions(): Weapon[] {
    console.log('🎮 Generating initial weapon options...');
    const options = this.weaponPool.selectRandomWeapons(3, []);

    console.log(`\n✨ Generated ${options.length} initial weapons:`);
    options.forEach((weapon, index) => {
      console.log(`  ${index + 1}. ${weapon.name} (${weapon.rarity})`);
      console.log(`     Damage: ${weapon.damage}, Fire Rate: ${weapon.fireRate}/s`);
    });

    return options;
  }

  /**
   * Select initial weapon
   */
  selectInitialWeapon(weapon: Weapon): void {
    console.log(`\n✅ Selected: ${weapon.name}`);
    this.playerWeapons.push(weapon);
    this.logCurrentBuild();
  }

  /**
   * Generate level-up options
   */
  generateLevelUpOptions(playerState: PlayerState): Array<{ weapon: Weapon; canUpgrade: boolean; reason?: string }> {
    console.log(`\n⬆️  Generating level-up options for player level ${playerState.level}...`);

    // Adjust strategy based on player state
    this.adjustStrategyBasedOnState(playerState);

    const result = this.weaponSelector.generateOptions(playerState);

    console.log(`\n✨ Generated ${result.options.length} options:`);
    result.options.forEach((option, index) => {
      const type = option.canUpgrade ? '🔼 UPGRADE' : '🆕 NEW';
      console.log(`  ${index + 1}. ${type}: ${option.weapon.name} (Lv.${option.weapon.level} ${option.weapon.rarity})`);
      console.log(`     Damage: ${option.weapon.damage}, Fire Rate: ${option.weapon.fireRate}/s`);
      if (option.reason) {
        console.log(`     Reason: ${option.reason}`);
      }
    });

    return result.options;
  }

  /**
   * Process weapon selection from level-up screen
   */
  selectLevelUpOption(option: { weapon: Weapon; canUpgrade: boolean }): void {
    if (option.canUpgrade) {
      // Upgrade existing weapon
      const existingIndex = this.playerWeapons.findIndex(w => w.id === option.weapon.id);
      if (existingIndex !== -1) {
        const oldWeapon = this.playerWeapons[existingIndex];
        console.log(`\n🔼 Upgrading ${oldWeapon.name} from Lv.${oldWeapon.level} to Lv.${option.weapon.level}...`);

        this.playerWeapons[existingIndex] = option.weapon;
        this.logCurrentBuild();
      }
    } else {
      // Add new weapon
      console.log(`\n✅ Adding new weapon: ${option.weapon.name}`);
      this.playerWeapons.push(option.weapon);
      this.logCurrentBuild();
    }
  }

  /**
   * Get current player weapons
   */
  getPlayerWeapons(): Weapon[] {
    return [...this.playerWeapons];
  }

  /**
   * Get total weapon stats (for UI display)
   */
  getTotalStats() {
    return {
      totalDamage: this.playerWeapons.reduce((sum, w) => sum + w.damage, 0),
      averageFireRate: this.playerWeapons.reduce((sum, w) => sum + w.fireRate, 0) / this.playerWeapons.length || 0,
      weaponCount: this.playerWeapons.length,
      maxLevelWeapons: this.playerWeapons.filter(w => w.level >= w.maxLevel).length
    };
  }

  /**
   * Adjust selection strategy based on player state
   */
  private adjustStrategyBasedOnState(playerState: PlayerState): void {
    const hpPercent = playerState.hp / playerState.maxHp;

    // Prioritize defense when HP is low
    if (hpPercent < 0.3) {
      console.log('💔 Low HP! Switching to DEFENSIVE strategy');
      this.weaponSelector.setStrategy(SelectionStrategy.DEFENSIVE);
    }
    // Use complement strategy when player has many weapons
    else if (playerState.currentWeapons.length >= 4) {
      console.log('🔄 Many weapons! Using COMPLEMENT strategy');
      this.weaponSelector.setStrategy(SelectionStrategy.COMPLEMENT);
    }
    // Default to balanced
    else {
      this.weaponSelector.setStrategy(SelectionStrategy.BALANCED);
    }
  }

  /**
   * Log current build for debugging
   */
  private logCurrentBuild(): void {
    console.log('\n📦 Current Build:');
    this.playerWeapons.forEach((weapon, index) => {
      const levelStatus = weapon.level >= weapon.maxLevel ? 'MAX' : `Lv.${weapon.level}`;
      console.log(`  ${index + 1}. ${weapon.name} (${levelStatus} ${weapon.rarity})`);
    });

    const stats = this.getTotalStats();
    console.log(`\n📊 Total Stats:`);
    console.log(`  Total Damage: ${stats.totalDamage}`);
    console.log(`  Avg Fire Rate: ${stats.averageFireRate.toFixed(2)}/s`);
    console.log(`  Weapons: ${stats.weaponCount}`);
    console.log(`  Max Level: ${stats.maxLevelWeapons}`);
  }
}

/**
 * Example usage
 */
export function exampleUsage() {
  console.log('=== Weapon System Integration Example ===\n');

  const manager = new GameWeaponManager();

  // 1. Generate initial options
  const initialOptions = manager.generateInitialOptions();

  // 2. Player selects first weapon
  manager.selectInitialWeapon(initialOptions[0]);

  // 3. Simulate player state
  const playerState: PlayerState = {
    level: 2,
    currentWeapons: manager.getPlayerWeapons(),
    hp: 85,
    maxHp: 100,
    killCount: 25,
    playTime: 180
  };

  // 4. Generate level-up options
  const levelUpOptions = manager.generateLevelUpOptions(playerState);

  // 5. Player selects upgrade option
  if (levelUpOptions[0].canUpgrade) {
    manager.selectLevelUpOption(levelUpOptions[0]);
  } else {
    manager.selectLevelUpOption(levelUpOptions[1]);
  }

  // 6. Simulate another level-up with low HP
  console.log('\n⚠️  Player took damage!');
  playerState.hp = 25;
  playerState.level = 3;
  playerState.currentWeapons = manager.getPlayerWeapons();

  const lowHpOptions = manager.generateLevelUpOptions(playerState);
  manager.selectLevelUpOption(lowHpOptions[0]);

  console.log('\n=== Example Complete ===');
}

/**
 * Example: Testing weapon rarity distribution
 */
export function testRarityDistribution() {
  console.log('=== Testing Rarity Distribution ===\n');

  const pool = new WeaponPool();
  const iterations = 1000;
  const rarityCounts: { [key: string]: number } = {
    COMMON: 0,
    UNCOMMON: 0,
    RARE: 0,
    EPIC: 0,
    LEGENDARY: 0
  };

  console.log(`Generating ${iterations} random weapons...\n`);

  for (let i = 0; i < iterations; i++) {
    const weapons = pool.selectRandomWeapons(1, []);
    weapons.forEach(weapon => {
      rarityCounts[weapon.rarity]++;
    });
  }

  console.log('Rarity Distribution:');
  Object.entries(rarityCounts).forEach(([rarity, count]) => {
    const percentage = ((count / iterations) * 100).toFixed(2);
    console.log(`  ${rarity.padEnd(12)}: ${count.toString().padStart(4)} (${percentage}%)`);
  });

  console.log('\n=== Test Complete ===');
}

/**
 * Example: Testing weapon upgrade progression
 */
export function testWeaponProgression() {
  console.log('=== Testing Weapon Progression ===\n');

  const pool = new WeaponPool();
  const weaponId = 'magic_wand';

  console.log(`Testing progression for: ${weaponId}\n`);

  for (let level = 1; level <= 8; level++) {
    const common = pool.createWeapon(weaponId, WeaponRarity.COMMON, level);
    const rare = pool.createWeapon(weaponId, WeaponRarity.RARE, level);

    console.log(`Level ${level}:`);
    console.log(`  COMMON: ${common!.damage} damage, ${common!.fireRate}/s`);
    console.log(`  RARE:   ${rare!.damage} damage, ${rare!.fireRate}/s`);
  }

  console.log('\n=== Test Complete ===');
}

// Run examples if this file is executed directly
if (typeof window === 'undefined') {
  // Uncomment to run examples
  // exampleUsage();
  // testRarityDistribution();
  // testWeaponProgression();
}
