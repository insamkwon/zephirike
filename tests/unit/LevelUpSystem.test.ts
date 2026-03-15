import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Player } from '../../src/entities/Player';
import { PlayerConfig } from '../../src/types/GameTypes';
import { AttackMode } from '../../src/types';
import Phaser from 'phaser';
import { createTestScene } from './setup';

describe('Player Level-Up System', () => {
  let player: Player;
  let scene: Phaser.Scene;
  let playerConfig: PlayerConfig;

  beforeEach(() => {
    // Create a test scene
    scene = createTestScene();

    // Create player config
    playerConfig = {
      x: 400,
      y: 300,
      speed: 200,
      hp: 100,
      maxHp: 100,
      attackSpeed: 2,
      attackRange: 50,
      damage: 25,
      level: 1,
      experience: 0,
      experienceToNextLevel: 100
    };

    // Create player
    player = new Player(scene, playerConfig.x, playerConfig.y, playerConfig);
  });

  describe('Initial State', () => {
    it('should start with level 1', () => {
      expect(player.getLevel()).toBe(1);
    });

    it('should start with 0 experience', () => {
      expect(player.getExperience()).toBe(0);
    });

    it('should have correct experience to next level', () => {
      expect(player.getExperienceToNextLevel()).toBe(100);
    });

    it('should have zero progress at start', () => {
      expect(player.getExperienceProgress()).toBe(0);
    });
  });

  describe('Experience Gain', () => {
    it('should add experience correctly', () => {
      const leveledUp = player.gainExperience(25);
      expect(player.getExperience()).toBe(25);
      expect(leveledUp).toBe(false);
    });

    it('should accumulate experience over multiple gains', () => {
      player.gainExperience(30);
      player.gainExperience(20);
      player.gainExperience(10);
      expect(player.getExperience()).toBe(60);
    });

    it('should trigger level up when reaching threshold', () => {
      const leveledUp = player.gainExperience(100);
      expect(leveledUp).toBe(true);
      expect(player.getLevel()).toBe(2);
    });

    it('should carry over excess XP to next level', () => {
      player.gainExperience(150); // 100 for level up + 50 excess
      expect(player.getLevel()).toBe(2);
      expect(player.getExperience()).toBe(50);
    });
  });

  describe('Level Progression', () => {
    it('should increase level correctly', () => {
      player.gainExperience(100);
      expect(player.getLevel()).toBe(2);

      player.gainExperience(150); // Level 2 requires 150 XP
      expect(player.getLevel()).toBe(3);
    });

    it('should increase XP requirement exponentially', () => {
      const firstLevelReq = player.getExperienceToNextLevel();
      player.gainExperience(100);
      const secondLevelReq = player.getExperienceToNextLevel();

      expect(secondLevelReq).toBeGreaterThan(firstLevelReq);
      // Formula: 100 * 1.5^(level-1)
      // Level 1 -> 2: 100 * 1.5^0 = 100
      // Level 2 -> 3: 100 * 1.5^1 = 150
      expect(secondLevelReq).toBe(150);
    });

    it('should calculate progress correctly', () => {
      player.gainExperience(50);
      expect(player.getExperienceProgress()).toBe(0.5);

      player.gainExperience(25);
      expect(player.getExperienceProgress()).toBe(0.75);
    });

    it('should reset progress after level up', () => {
      player.gainExperience(100);
      expect(player.getLevel()).toBe(2);
      expect(player.getExperienceProgress()).toBe(0);
    });
  });

  describe('Weapon Upgrade Application', () => {
    it('should apply projectile damage upgrade', () => {
      const baseDamage = player.getTotalDamage('projectile');
      const upgrade = {
        id: 'test_proj_dmg',
        name: 'Test Projectile Damage',
        description: '+10 Damage',
        type: 'projectile' as const,
        statBonus: { damage: 10 },
        rarity: 'common' as const
      };

      player.applyWeaponUpgrade(upgrade);
      expect(player.getTotalDamage('projectile')).toBe(baseDamage + 10);
    });

    it('should apply melee damage upgrade', () => {
      const baseDamage = player.getTotalDamage('melee');
      const upgrade = {
        id: 'test_melee_dmg',
        name: 'Test Melee Damage',
        description: '+15 Damage',
        type: 'melee' as const,
        statBonus: { damage: 15 },
        rarity: 'common' as const
      };

      player.applyWeaponUpgrade(upgrade);
      expect(player.getTotalDamage('melee')).toBe(baseDamage + 15);
    });

    it('should apply attack speed upgrade', () => {
      const baseSpeed = player.getTotalAttackSpeed('projectile');
      const upgrade = {
        id: 'test_atk_speed',
        name: 'Test Attack Speed',
        description: '+0.5 Attack Speed',
        type: 'projectile' as const,
        statBonus: { attackSpeed: 0.5 },
        rarity: 'common' as const
      };

      player.applyWeaponUpgrade(upgrade);
      expect(player.getTotalAttackSpeed('projectile')).toBe(baseSpeed + 0.5);
    });

    it('should apply melee range upgrade', () => {
      const baseRange = player.getTotalMeleeRange();
      const upgrade = {
        id: 'test_melee_range',
        name: 'Test Melee Range',
        description: '+20 Range',
        type: 'melee' as const,
        statBonus: { range: 20 },
        rarity: 'common' as const
      };

      player.applyWeaponUpgrade(upgrade);
      expect(player.getTotalMeleeRange()).toBe(baseRange + 20);
    });

    it('should apply projectile speed upgrade', () => {
      const baseSpeed = player.getTotalProjectileSpeed();
      const upgrade = {
        id: 'test_proj_speed',
        name: 'Test Projectile Speed',
        description: '+100 Projectile Speed',
        type: 'projectile' as const,
        statBonus: { projectileSpeed: 100 },
        rarity: 'common' as const
      };

      player.applyWeaponUpgrade(upgrade);
      expect(player.getTotalProjectileSpeed()).toBe(baseSpeed + 100);
    });

    it('should stack multiple upgrades of same type', () => {
      const baseDamage = player.getTotalDamage('projectile');

      const upgrade1 = {
        id: 'test_dmg_1',
        name: 'Test Damage 1',
        description: '+10 Damage',
        type: 'projectile' as const,
        statBonus: { damage: 10 },
        rarity: 'common' as const
      };

      const upgrade2 = {
        id: 'test_dmg_2',
        name: 'Test Damage 2',
        description: '+15 Damage',
        type: 'projectile' as const,
        statBonus: { damage: 15 },
        rarity: 'rare' as const
      };

      player.applyWeaponUpgrade(upgrade1);
      player.applyWeaponUpgrade(upgrade2);

      expect(player.getTotalDamage('projectile')).toBe(baseDamage + 25);
    });

    it('should keep weapon bonuses separate', () => {
      const projectileUpgrade = {
        id: 'test_proj',
        name: 'Test Projectile',
        description: '+20 Damage',
        type: 'projectile' as const,
        statBonus: { damage: 20 },
        rarity: 'common' as const
      };

      const meleeUpgrade = {
        id: 'test_melee',
        name: 'Test Melee',
        description: '+30 Damage',
        type: 'melee' as const,
        statBonus: { damage: 30 },
        rarity: 'rare' as const
      };

      player.applyWeaponUpgrade(projectileUpgrade);
      player.applyWeaponUpgrade(meleeUpgrade);

      expect(player.getTotalDamage('projectile')).toBe(25 + 20); // base + 20
      expect(player.getTotalDamage('melee')).toBe(25 + 30); // base + 30
    });
  });

  describe('Level-Up Event Emission', () => {
    it('should emit level-up event when leveling up', () => {
      const eventSpy = vi.fn();
      scene.events.on('player-level-up', eventSpy);

      player.gainExperience(100);

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 2,
          experience: 0,
          experienceToNextLevel: 150
        })
      );
    });

    it('should emit event with correct data', () => {
      const eventSpy = vi.fn();
      scene.events.on('player-level-up', eventSpy);

      player.gainExperience(150); // Level up with 50 excess XP

      const eventData = eventSpy.mock.calls[0][0];
      expect(eventData.level).toBe(2);
      expect(eventData.experience).toBe(50);
      expect(eventData.experienceToNextLevel).toBe(150);
    });
  });

  describe('XP Curve and Progression', () => {
    it('should follow exponential curve for XP requirements', () => {
      // Level 1 -> 2: 100 XP
      expect(player.getExperienceToNextLevel()).toBe(100);

      player.gainExperience(100);
      // Level 2 -> 3: 150 XP (100 * 1.5^1)
      expect(player.getExperienceToNextLevel()).toBe(150);

      player.gainExperience(150);
      // Level 3 -> 4: 225 XP (100 * 1.5^2)
      expect(player.getExperienceToNextLevel()).toBe(225);

      player.gainExperience(225);
      // Level 4 -> 5: 337.5 -> 337 XP (100 * 1.5^3)
      expect(player.getExperienceToNextLevel()).toBe(337);
    });

    it('should allow multiple level ups from large XP gain', () => {
      // Gain enough XP for 3 level ups
      player.gainExperience(500); // 100 + 150 + 225 + 25 excess

      expect(player.getLevel()).toBe(4);
      expect(player.getExperience()).toBe(25);
    });
  });

  describe('Weapon Bonus State Management', () => {
    it('should return weapon bonuses correctly', () => {
      const upgrade = {
        id: 'test_upgrade',
        name: 'Test Upgrade',
        description: '+10 Damage, +0.5 Speed',
        type: 'projectile' as const,
        statBonus: { damage: 10, attackSpeed: 0.5 },
        rarity: 'rare' as const
      };

      player.applyWeaponUpgrade(upgrade);
      const bonuses = player.getWeaponBonuses();

      expect(bonuses.projectile.damage).toBe(10);
      expect(bonuses.projectile.attackSpeed).toBe(0.5);
      expect(bonuses.melee.damage).toBe(0);
    });
  });
});
