/**
 * Unit tests for WeaponPool and WeaponSelector systems
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  WeaponPool,
  getWeaponPool,
  resetWeaponPool
} from '../../src/systems/WeaponPool';
import {
  WeaponSelector,
  createLevelUpOptions,
  createInitialWeaponOptions,
  SelectionStrategy
} from '../../src/systems/WeaponSelector';
import {
  Weapon,
  WeaponRarity,
  WeaponType,
  WeaponCategory,
  DamageType,
  PlayerState
} from '../../src/types/WeaponTypes';

describe('WeaponPool System', () => {
  let weaponPool: WeaponPool;

  beforeEach(() => {
    weaponPool = new WeaponPool();
    resetWeaponPool();
  });

  describe('Initialization', () => {
    it('should create weapon pool with default config', () => {
      const config = weaponPool.getConfig();
      expect(config.poolSize).toBe(3);
      expect(config.commonWeight).toBe(50);
      expect(config.allowDuplicates).toBe(false);
    });

    it('should create weapon pool with custom config', () => {
      const customPool = new WeaponPool({
        poolSize: 5,
        allowDuplicates: true
      });
      const config = customPool.getConfig();
      expect(config.poolSize).toBe(5);
      expect(config.allowDuplicates).toBe(true);
    });

    it('should initialize with weapon definitions', () => {
      const weaponIds = weaponPool.getAvailableWeaponIds();
      expect(weaponIds.length).toBeGreaterThan(0);
      expect(weaponIds).toContain('magic_wand');
      expect(weaponIds).toContain('sword');
    });
  });

  describe('Weapon Creation', () => {
    it('should create weapon with correct base stats at level 1', () => {
      const weapon = weaponPool.createWeapon('magic_wand', WeaponRarity.COMMON, 1);
      expect(weapon).not.toBeNull();
      expect(weapon?.name).toBe('Magic Wand');
      expect(weapon?.level).toBe(1);
      expect(weapon?.damage).toBe(10);
      expect(weapon?.fireRate).toBe(1.0);
      expect(weapon?.range).toBe(300);
    });

    it('should create weapon with increased stats at higher level', () => {
      const weapon1 = weaponPool.createWeapon('magic_wand', WeaponRarity.COMMON, 1);
      const weapon5 = weaponPool.createWeapon('magic_wand', WeaponRarity.COMMON, 5);

      expect(weapon5?.damage).toBeGreaterThan(weapon1!.damage);
      expect(weapon5?.fireRate).toBeGreaterThan(weapon1!.fireRate);
      expect(weapon5?.range).toBeGreaterThan(weapon1!.range);
      expect(weapon5?.level).toBe(5);
    });

    it('should apply rarity multiplier correctly', () => {
      const common = weaponPool.createWeapon('magic_wand', WeaponRarity.COMMON, 1);
      const rare = weaponPool.createWeapon('magic_wand', WeaponRarity.RARE, 1);
      const legendary = weaponPool.createWeapon('magic_wand', WeaponRarity.LEGENDARY, 1);

      expect(common?.damage).toBe(10);
      expect(rare?.damage).toBe(15); // 10 * 1.5
      expect(legendary?.damage).toBe(25); // 10 * 2.5
    });

    it('should return null for invalid weapon ID', () => {
      const weapon = weaponPool.createWeapon('invalid_id', WeaponRarity.COMMON, 1);
      expect(weapon).toBeNull();
    });

    it('should return null for invalid level', () => {
      const weapon0 = weaponPool.createWeapon('magic_wand', WeaponRarity.COMMON, 0);
      const weapon10 = weaponPool.createWeapon('magic_wand', WeaponRarity.COMMON, 10);

      expect(weapon0).toBeNull();
      expect(weapon10).toBeNull();
    });

    it('should create weapon with correct type and category', () => {
      const projectile = weaponPool.createWeapon('magic_wand', WeaponRarity.COMMON, 1);
      const melee = weaponPool.createWeapon('sword', WeaponRarity.COMMON, 1);
      const passive = weaponPool.createWeapon('max_hp_boost', WeaponRarity.COMMON, 1);

      expect(projectile?.type).toBe(WeaponType.PROJECTILE);
      expect(projectile?.category).toBe(WeaponCategory.OFFENSIVE);

      expect(melee?.type).toBe(WeaponType.MELEE);
      expect(melee?.category).toBe(WeaponCategory.OFFENSIVE);

      expect(passive?.type).toBe(WeaponType.PASSIVE);
      expect(passive?.category).toBe(WeaponCategory.DEFENSIVE);
    });

    it('should create weapon with correct damage type', () => {
      const fire = weaponPool.createWeapon('fireball', WeaponRarity.COMMON, 1);
      const ice = weaponPool.createWeapon('ice_blade', WeaponRarity.COMMON, 1);
      const lightning = weaponPool.createWeapon('lightning_bolt', WeaponRarity.COMMON, 1);

      expect(fire?.damageType).toBe(DamageType.FIRE);
      expect(ice?.damageType).toBe(DamageType.ICE);
      expect(lightning?.damageType).toBe(DamageType.LIGHTNING);
    });

    it('should set max level correctly', () => {
      const weapon = weaponPool.createWeapon('magic_wand', WeaponRarity.COMMON, 1);
      expect(weapon?.maxLevel).toBe(8);
    });
  });

  describe('Random Weapon Selection', () => {
    it('should select requested number of weapons', () => {
      const weapons = weaponPool.selectRandomWeapons(3, []);
      expect(weapons.length).toBe(3);
    });

    it('should not select duplicates when disallowed', () => {
      const weapons = weaponPool.selectRandomWeapons(5, []);
      const ids = new Set(weapons.map(w => w.id));
      expect(ids.size).toBe(5);
    });

    it('should allow duplicates when configured', () => {
      const pool = new WeaponPool({ allowDuplicates: true, maxDuplicates: 2 });
      const weapons = pool.selectRandomWeapons(5, []);
      // With small pool, duplicates should occur
      expect(weapons.length).toBe(5);
    });

    it('should respect max duplicates limit', () => {
      const pool = new WeaponPool({ allowDuplicates: true, maxDuplicates: 2 });
      const existingWeapons = [
        pool.createWeapon('magic_wand', WeaponRarity.COMMON, 1)!,
        pool.createWeapon('magic_wand', WeaponRarity.COMMON, 1)!
      ];
      const weapons = pool.selectRandomWeapons(3, existingWeapons);

      const magicWandCount = weapons.filter(w => w.id === 'magic_wand').length;
      expect(magicWandCount).toBeLessThanOrEqual(2);
    });

    it('should not include existing weapons when selecting new ones', () => {
      const existingWeapons = [
        weaponPool.createWeapon('magic_wand', WeaponRarity.COMMON, 1)!,
        weaponPool.createWeapon('sword', WeaponRarity.COMMON, 1)!
      ];

      const newWeapons = weaponPool.selectRandomWeapons(3, existingWeapons);
      const existingIds = new Set(existingWeapons.map(w => w.id));

      for (const weapon of newWeapons) {
        expect(existingIds.has(weapon.id)).toBe(false);
      }
    });

    it('should select weapons with varied rarities', () => {
      const weapons = weaponPool.selectRandomWeapons(20, []);
      const rarities = new Set(weapons.map(w => w.rarity));
      expect(rarities.size).toBeGreaterThan(1);
    });
  });

  describe('Weapon Options Generation', () => {
    it('should generate upgrade options for existing weapons', () => {
      const existingWeapons = [
        weaponPool.createWeapon('magic_wand', WeaponRarity.COMMON, 1)!
      ];

      const options = weaponPool.getWeaponOptions(existingWeapons, 3);

      const upgradeOption = options.find(opt => opt.canUpgrade);
      expect(upgradeOption).toBeDefined();
      expect(upgradeOption?.weapon.level).toBe(2);
    });

    it('should not offer upgrade for max level weapons', () => {
      const existingWeapons = [
        weaponPool.createWeapon('magic_wand', WeaponRarity.COMMON, 8)!
      ];

      const options = weaponPool.getWeaponOptions(existingWeapons, 3);
      const upgradeOptions = options.filter(opt => opt.canUpgrade);

      expect(upgradeOptions.length).toBe(0);
    });

    it('should mix new and upgrade options', () => {
      const existingWeapons = [
        weaponPool.createWeapon('magic_wand', WeaponRarity.COMMON, 1)!
      ];

      const options = weaponPool.getWeaponOptions(existingWeapons, 3);

      const hasUpgrade = options.some(opt => opt.canUpgrade);
      const hasNew = options.some(opt => !opt.canUpgrade);

      expect(hasUpgrade).toBe(true);
      expect(hasNew).toBe(true);
    });
  });

  describe('Weapon Upgrade', () => {
    it('should upgrade weapon to next level', () => {
      const weapon = weaponPool.createWeapon('magic_wand', WeaponRarity.COMMON, 1)!;
      const upgraded = weaponPool.upgradeWeapon(weapon);

      expect(upgraded).not.toBeNull();
      expect(upgraded?.level).toBe(2);
      expect(upgraded?.damage).toBeGreaterThan(weapon.damage);
    });

    it('should return null when upgrading max level weapon', () => {
      const weapon = weaponPool.createWeapon('magic_wand', WeaponRarity.COMMON, 8)!;
      const upgraded = weaponPool.upgradeWeapon(weapon);

      expect(upgraded).toBeNull();
    });

    it('should preserve weapon properties on upgrade', () => {
      const weapon = weaponPool.createWeapon('magic_wand', WeaponRarity.COMMON, 1)!;
      const upgraded = weaponPool.upgradeWeapon(weapon)!;

      expect(upgraded.id).toBe(weapon.id);
      expect(upgraded.name).toBe(weapon.name);
      expect(upgraded.rarity).toBe(weapon.rarity);
      expect(upgraded.type).toBe(weapon.type);
    });
  });

  describe('Rarity System', () => {
    it('should return valid rarity from random selection', () => {
      const rarity = weaponPool.getRandomRarity();
      expect(Object.values(WeaponRarity)).toContain(rarity);
    });

    it('should respect rarity weights from weapon definition', () => {
      // Magic wand has higher chance for common rarities
      const rarities: WeaponRarity[] = [];
      for (let i = 0; i < 100; i++) {
        rarities.push(weaponPool.getRandomRarity(
          weaponPool.getWeaponDefinition('magic_wand')
        ));
      }

      const commonCount = rarities.filter(r => r === WeaponRarity.COMMON).length;
      expect(commonCount).toBeGreaterThan(40); // Should be most common
    });

    it('should have correct rarity multipliers', () => {
      const common = weaponPool.createWeapon('magic_wand', WeaponRarity.COMMON, 1);
      const uncommon = weaponPool.createWeapon('magic_wand', WeaponRarity.UNCOMMON, 1);
      const rare = weaponPool.createWeapon('magic_wand', WeaponRarity.RARE, 1);
      const epic = weaponPool.createWeapon('magic_wand', WeaponRarity.EPIC, 1);
      const legendary = weaponPool.createWeapon('magic_wand', WeaponRarity.LEGENDARY, 1);

      expect(legendary!.damage).toBeGreaterThan(epic!.damage);
      expect(epic!.damage).toBeGreaterThan(rare!.damage);
      expect(rare!.damage).toBeGreaterThan(uncommon!.damage);
      expect(uncommon!.damage).toBeGreaterThan(common!.damage);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      weaponPool.updateConfig({ poolSize: 5 });
      const config = weaponPool.getConfig();
      expect(config.poolSize).toBe(5);
    });

    it('should reset seed for reproducibility', () => {
      weaponPool.resetSeed(12345);
      const weapons1 = weaponPool.selectRandomWeapons(3, []);

      weaponPool.resetSeed(12345);
      const weapons2 = weaponPool.selectRandomWeapons(3, []);

      expect(weapons1[0].id).toBe(weapons2[0].id);
      expect(weapons1[1].id).toBe(weapons2[1].id);
      expect(weapons1[2].id).toBe(weapons2[2].id);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getWeaponPool', () => {
      const pool1 = getWeaponPool();
      const pool2 = getWeaponPool();
      expect(pool1).toBe(pool2);
    });

    it('should reset singleton', () => {
      const pool1 = getWeaponPool();
      resetWeaponPool();
      const pool2 = getWeaponPool();
      expect(pool1).not.toBe(pool2);
    });
  });
});

describe('WeaponSelector System', () => {
  let selector: WeaponSelector;
  let mockPlayerState: PlayerState;

  beforeEach(() => {
    selector = new WeaponSelector();
    mockPlayerState = {
      level: 5,
      currentWeapons: [],
      hp: 100,
      maxHp: 100,
      killCount: 50,
      playTime: 300
    };
  });

  describe('Initialization', () => {
    it('should create selector with default config', () => {
      const config = selector.getConfig();
      expect(config.optionCount).toBe(3);
      expect(config.strategy).toBe(SelectionStrategy.BALANCED);
    });

    it('should create selector with custom config', () => {
      const customSelector = new WeaponSelector({
        optionCount: 5,
        strategy: SelectionStrategy.OFFENSIVE
      });
      const config = customSelector.getConfig();
      expect(config.optionCount).toBe(5);
      expect(config.strategy).toBe(SelectionStrategy.OFFENSIVE);
    });
  });

  describe('Random Strategy', () => {
    beforeEach(() => {
      selector.setStrategy(SelectionStrategy.RANDOM);
    });

    it('should generate random weapon options', () => {
      const result = selector.generateOptions(mockPlayerState);
      expect(result.options.length).toBe(3);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should provide mix of new and upgrade options', () => {
      mockPlayerState.currentWeapons = [
        selector['weaponPool'].createWeapon('magic_wand', WeaponRarity.COMMON, 1)!
      ];

      const result = selector.generateOptions(mockPlayerState);
      const hasUpgrade = result.options.some(opt => opt.canUpgrade);
      expect(hasUpgrade).toBe(true);
    });
  });

  describe('Balanced Strategy', () => {
    beforeEach(() => {
      selector.setStrategy(SelectionStrategy.BALANCED);
    });

    it('should suggest defensive options when lacking defense', () => {
      mockPlayerState.currentWeapons = [
        selector['weaponPool'].createWeapon('magic_wand', WeaponRarity.COMMON, 1)!,
        selector['weaponPool'].createWeapon('sword', WeaponRarity.COMMON, 1)!
      ];

      const result = selector.generateOptions(mockPlayerState);
      const hasDefensive = result.options.some(
        opt => opt.weapon.category === WeaponCategory.DEFENSIVE
      );
      expect(hasDefensive).toBe(true);
    });

    it('should suggest offensive options when lacking offense', () => {
      mockPlayerState.currentWeapons = [
        selector['weaponPool'].createWeapon('max_hp_boost', WeaponRarity.COMMON, 1)!
      ];

      const result = selector.generateOptions(mockPlayerState);
      const hasOffensive = result.options.some(
        opt => opt.weapon.category === WeaponCategory.OFFENSIVE
      );
      expect(hasOffensive).toBe(true);
    });
  });

  describe('Offensive Strategy', () => {
    beforeEach(() => {
      selector.setStrategy(SelectionStrategy.OFFENSIVE);
    });

    it('should prioritize offensive weapons', () => {
      const result = selector.generateOptions(mockPlayerState);
      const offensiveCount = result.options.filter(
        opt => opt.weapon.category === WeaponCategory.OFFENSIVE
      ).length;
      expect(offensiveCount).toBeGreaterThan(0);
    });
  });

  describe('Defensive Strategy', () => {
    beforeEach(() => {
      selector.setStrategy(SelectionStrategy.DEFENSIVE);
    });

    it('should prioritize defensive weapons when HP is low', () => {
      mockPlayerState.hp = 20;
      mockPlayerState.maxHp = 100;

      const result = selector.generateOptions(mockPlayerState);
      const defensiveCount = result.options.filter(
        opt => opt.weapon.category === WeaponCategory.DEFENSIVE
      ).length;
      expect(defensiveCount).toBeGreaterThan(0);
    });

    it('should mix defensive and offensive when HP is high', () => {
      mockPlayerState.hp = 90;
      mockPlayerState.maxHp = 100;

      const result = selector.generateOptions(mockPlayerState);
      const defensiveCount = result.options.filter(
        opt => opt.weapon.category === WeaponCategory.DEFENSIVE
      ).length;
      expect(defensiveCount).toBeLessThan(result.options.length);
    });
  });

  describe('Complement Strategy', () => {
    beforeEach(() => {
      selector.setStrategy(SelectionStrategy.COMPLEMENT);
    });

    it('should suggest missing weapon types', () => {
      mockPlayerState.currentWeapons = [
        selector['weaponPool'].createWeapon('magic_wand', WeaponRarity.COMMON, 1)!
      ];

      const result = selector.generateOptions(mockPlayerState);
      const types = new Set(result.options.map(opt => opt.weapon.type));
      expect(types.size).toBeGreaterThan(1);
    });

    it('should fill gaps in weapon categories', () => {
      mockPlayerState.currentWeapons = [
        selector['weaponPool'].createWeapon('magic_wand', WeaponRarity.COMMON, 1)!
      ];

      const result = selector.generateOptions(mockPlayerState);
      const hasMelee = result.options.some(
        opt => opt.weapon.type === WeaponType.MELEE
      );
      expect(hasMelee).toBe(true);
    });
  });

  describe('Strategy Updates', () => {
    it('should update strategy', () => {
      selector.setStrategy(SelectionStrategy.OFFENSIVE);
      expect(selector.getStrategy()).toBe(SelectionStrategy.OFFENSIVE);
    });

    it('should update configuration', () => {
      selector.updateConfig({ optionCount: 5 });
      const config = selector.getConfig();
      expect(config.optionCount).toBe(5);
    });
  });
});

describe('Helper Functions', () => {
  describe('createLevelUpOptions', () => {
    it('should create options for level up', () => {
      const playerState: PlayerState = {
        level: 5,
        currentWeapons: [],
        hp: 100,
        maxHp: 100,
        killCount: 50,
        playTime: 300
      };

      const options = createLevelUpOptions(playerState, SelectionStrategy.RANDOM);
      expect(options.length).toBe(3);
    });

    it('should use balanced strategy by default', () => {
      const playerState: PlayerState = {
        level: 5,
        currentWeapons: [],
        hp: 100,
        maxHp: 100,
        killCount: 50,
        playTime: 300
      };

      const options = createLevelUpOptions(playerState);
      expect(options.length).toBe(3);
    });
  });

  describe('createInitialWeaponOptions', () => {
    it('should create initial weapon selection', () => {
      const weapons = createInitialWeaponOptions(3);
      expect(weapons.length).toBe(3);
      expect(weapons[0].level).toBe(1);
    });

    it('should respect count parameter', () => {
      const weapons = createInitialWeaponOptions(5);
      expect(weapons.length).toBe(5);
    });
  });
});
