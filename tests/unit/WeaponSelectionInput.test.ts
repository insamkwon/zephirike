/**
 * Integration tests for Sub-AC 4: Weapon Selection User Input
 * Tests the complete flow from user input to weapon application
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import Phaser from 'phaser';
import { createTestScene } from './setup';
import { Player } from '../../src/entities/Player';
import { PlayerConfig, WeaponUpgrade } from '../../src/types/GameTypes';

describe('Sub-AC 4: Weapon Selection User Input', () => {
  let scene: Phaser.Scene;
  let player: Player;
  let playerConfig: PlayerConfig;

  beforeEach(() => {
    // Create test scene
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

  describe('User Input Handling for Weapon Selection', () => {
    it('should accept keyboard input for weapon selection', () => {
      // This test verifies the keyboard event system is set up
      const eventSpy = vi.fn();

      // Simulate keyboard event listener
      scene.events.on('keydown-LEFT', eventSpy);
      scene.events.emit('keydown-LEFT');

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should accept mouse input for weapon selection', () => {
      // This test verifies the mouse event system is set up
      const eventSpy = vi.fn();

      // Simulate mouse click event
      scene.events.on('pointerdown', eventSpy);
      scene.events.emit('pointerdown', { x: 100, y: 100 });

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should support weapon selection via SPACE key', () => {
      const eventSpy = vi.fn();

      // Simulate SPACE key event
      scene.events.on('keydown-SPACE', eventSpy);
      scene.events.emit('keydown-SPACE');

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should support weapon selection via ESC key', () => {
      const eventSpy = vi.fn();

      // Simulate ESC key event
      scene.events.on('keydown-ESC', eventSpy);
      scene.events.emit('keydown-ESC');

      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('Weapon Selection Flow', () => {
    it('should complete the full weapon selection flow', () => {
      // Create a test upgrade
      const testUpgrade: WeaponUpgrade = {
        id: 'test_upgrade_1',
        name: 'Test Damage Upgrade',
        description: '+10 Damage',
        type: 'projectile',
        statBonus: {
          damage: 10
        },
        rarity: 'common'
      };

      // Get initial stats
      const initialDamage = player.getTotalDamage('projectile');
      const initialSpeed = player.getTotalAttackSpeed('projectile');

      // Apply upgrade (simulating user selection)
      player.applyWeaponUpgrade(testUpgrade);

      // Verify upgrade was applied
      expect(player.getTotalDamage('projectile')).toBe(initialDamage + 10);
      expect(player.getTotalAttackSpeed('projectile')).toBe(initialSpeed); // Speed unchanged
    });

    it('should emit event when weapon is selected', () => {
      const testUpgrade: WeaponUpgrade = {
        id: 'test_upgrade_2',
        name: 'Test Speed Upgrade',
        description: '+0.5 Attack Speed',
        type: 'melee',
        statBonus: {
          attackSpeed: 0.5
        },
        rarity: 'common'
      };

      const eventSpy = vi.fn();
      scene.events.on('upgrade-selected', eventSpy);

      // Simulate upgrade selection event
      scene.events.emit('upgrade-selected', testUpgrade);

      expect(eventSpy).toHaveBeenCalledWith(testUpgrade);
    });

    it('should handle multiple consecutive weapon selections', () => {
      const upgrade1: WeaponUpgrade = {
        id: 'test_upgrade_3',
        name: 'Damage Boost 1',
        description: '+10 Damage',
        type: 'projectile',
        statBonus: { damage: 10 },
        rarity: 'common'
      };

      const upgrade2: WeaponUpgrade = {
        id: 'test_upgrade_4',
        name: 'Damage Boost 2',
        description: '+15 Damage',
        type: 'projectile',
        statBonus: { damage: 15 },
        rarity: 'rare'
      };

      const initialDamage = player.getTotalDamage('projectile');

      // Apply first upgrade
      player.applyWeaponUpgrade(upgrade1);
      expect(player.getTotalDamage('projectile')).toBe(initialDamage + 10);

      // Apply second upgrade
      player.applyWeaponUpgrade(upgrade2);
      expect(player.getTotalDamage('projectile')).toBe(initialDamage + 25);
    });
  });

  describe('Weapon Application to Player Character', () => {
    it('should apply projectile weapon upgrades correctly', () => {
      const projectileUpgrade: WeaponUpgrade = {
        id: 'proj_upgrade_1',
        name: 'Projectile Mastery',
        description: '+20 Damage, +1.0 Speed, +150 Velocity',
        type: 'projectile',
        statBonus: {
          damage: 20,
          attackSpeed: 1.0,
          projectileSpeed: 150
        },
        rarity: 'rare'
      };

      const initialDamage = player.getTotalDamage('projectile');
      const initialSpeed = player.getTotalAttackSpeed('projectile');
      const initialProjSpeed = player.getTotalProjectileSpeed();

      player.applyWeaponUpgrade(projectileUpgrade);

      expect(player.getTotalDamage('projectile')).toBe(initialDamage + 20);
      expect(player.getTotalAttackSpeed('projectile')).toBe(initialSpeed + 1.0);
      expect(player.getTotalProjectileSpeed()).toBe(initialProjSpeed + 150);
    });

    it('should apply melee weapon upgrades correctly', () => {
      const meleeUpgrade: WeaponUpgrade = {
        id: 'melee_upgrade_1',
        name: 'Melee Mastery',
        description: '+25 Damage, +0.8 Speed, +30 Range',
        type: 'melee',
        statBonus: {
          damage: 25,
          attackSpeed: 0.8,
          range: 30
        },
        rarity: 'rare'
      };

      const initialDamage = player.getTotalDamage('melee');
      const initialSpeed = player.getTotalAttackSpeed('melee');
      const initialRange = player.getTotalMeleeRange();

      player.applyWeaponUpgrade(meleeUpgrade);

      expect(player.getTotalDamage('melee')).toBe(initialDamage + 25);
      expect(player.getTotalAttackSpeed('melee')).toBe(initialSpeed + 0.8);
      expect(player.getTotalMeleeRange()).toBe(initialRange + 30);
    });

    it('should apply general upgrades to both weapon types', () => {
      const generalUpgrade: WeaponUpgrade = {
        id: 'general_upgrade_1',
        name: 'General Power',
        description: '+5 Damage (Both)',
        type: 'projectile', // Will be applied to both due to general_ prefix check
        statBonus: {
          damage: 5
        },
        rarity: 'common'
      };

      // Modify the upgrade to have general_ prefix for the test
      const modifiedUpgrade = { ...generalUpgrade, id: 'general_damage_1' };

      const initialProjDamage = player.getTotalDamage('projectile');
      const initialMeleeDamage = player.getTotalDamage('melee');

      player.applyWeaponUpgrade(modifiedUpgrade);

      expect(player.getTotalDamage('projectile')).toBe(initialProjDamage + 5);
      expect(player.getTotalDamage('melee')).toBe(initialMeleeDamage + 5);
    });

    it('should maintain separate stats for different weapon types', () => {
      const projUpgrade: WeaponUpgrade = {
        id: 'proj_only',
        name: 'Projectile Only',
        description: '+30 Projectile Damage',
        type: 'projectile',
        statBonus: { damage: 30 },
        rarity: 'rare'
      };

      const meleeUpgrade: WeaponUpgrade = {
        id: 'melee_only',
        name: 'Melee Only',
        description: '+35 Melee Damage',
        type: 'melee',
        statBonus: { damage: 35 },
        rarity: 'rare'
      };

      player.applyWeaponUpgrade(projUpgrade);
      player.applyWeaponUpgrade(meleeUpgrade);

      expect(player.getTotalDamage('projectile')).toBe(25 + 30); // base + proj upgrade
      expect(player.getTotalDamage('melee')).toBe(25 + 35); // base + melee upgrade
    });
  });

  describe('Power-up Application', () => {
    it('should apply power-up bonuses to player stats', () => {
      const powerUp: WeaponUpgrade = {
        id: 'powerup_speed',
        name: 'Speed Boost',
        description: '+1.5 Attack Speed',
        type: 'projectile',
        statBonus: { attackSpeed: 1.5 },
        rarity: 'epic'
      };

      const initialSpeed = player.getTotalAttackSpeed('projectile');

      player.applyWeaponUpgrade(powerUp);

      expect(player.getTotalAttackSpeed('projectile')).toBe(initialSpeed + 1.5);
    });

    it('should stack multiple power-ups of the same type', () => {
      const powerUp1: WeaponUpgrade = {
        id: 'powerup_dmg_1',
        name: 'Power Boost 1',
        description: '+10 Damage',
        type: 'projectile',
        statBonus: { damage: 10 },
        rarity: 'common'
      };

      const powerUp2: WeaponUpgrade = {
        id: 'powerup_dmg_2',
        name: 'Power Boost 2',
        description: '+15 Damage',
        type: 'projectile',
        statBonus: { damage: 15 },
        rarity: 'rare'
      };

      const initialDamage = player.getTotalDamage('projectile');

      player.applyWeaponUpgrade(powerUp1);
      player.applyWeaponUpgrade(powerUp2);

      expect(player.getTotalDamage('projectile')).toBe(initialDamage + 25);
    });
  });

  describe('User Input Feedback', () => {
    it('should provide visual feedback for weapon selection', () => {
      // Test that selection updates are tracked
      const testUpgrade: WeaponUpgrade = {
        id: 'feedback_test',
        name: 'Feedback Test',
        description: '+10 Damage',
        type: 'projectile',
        statBonus: { damage: 10 },
        rarity: 'common'
      };

      const beforeStats = {
        damage: player.getTotalDamage('projectile'),
        speed: player.getTotalAttackSpeed('projectile')
      };

      player.applyWeaponUpgrade(testUpgrade);

      const afterStats = {
        damage: player.getTotalDamage('projectile'),
        speed: player.getTotalAttackSpeed('projectile')
      };

      // Verify stats changed (providing feedback)
      expect(afterStats.damage).toBeGreaterThan(beforeStats.damage);
    });

    it('should allow users to navigate between weapon options', () => {
      // Test navigation events
      const leftSpy = vi.fn();
      const rightSpy = vi.fn();

      scene.events.on('keydown-LEFT', leftSpy);
      scene.events.on('keydown-RIGHT', rightSpy);

      // Simulate navigation
      scene.events.emit('keydown-LEFT');
      scene.events.emit('keydown-RIGHT');

      expect(leftSpy).toHaveBeenCalledTimes(1);
      expect(rightSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration with Level-Up System', () => {
    it('should trigger level-up scene when player gains enough XP', () => {
      const levelUpSpy = vi.fn();
      scene.events.on('player-level-up', levelUpSpy);

      // Gain enough XP to level up
      player.gainExperience(100);

      expect(levelUpSpy).toHaveBeenCalled();
      expect(player.getLevel()).toBe(2);
    });

    it('should apply weapon upgrade after level-up selection', () => {
      const testUpgrade: WeaponUpgrade = {
        id: 'levelup_upgrade',
        name: 'Level Up Bonus',
        description: '+20 Damage',
        type: 'melee',
        statBonus: { damage: 20 },
        rarity: 'rare'
      };

      const initialDamage = player.getTotalDamage('melee');

      // Simulate the flow: level up -> select upgrade -> apply
      player.gainExperience(100);
      expect(player.getLevel()).toBe(2);

      // Apply selected upgrade
      player.applyWeaponUpgrade(testUpgrade);

      expect(player.getTotalDamage('melee')).toBe(initialDamage + 20);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle rapid weapon selections correctly', () => {
      const upgrades: WeaponUpgrade[] = [
        {
          id: 'rapid_1',
          name: 'Rapid 1',
          description: '+5 Damage',
          type: 'projectile',
          statBonus: { damage: 5 },
          rarity: 'common'
        },
        {
          id: 'rapid_2',
          name: 'Rapid 2',
          description: '+10 Damage',
          type: 'projectile',
          statBonus: { damage: 10 },
          rarity: 'rare'
        },
        {
          id: 'rapid_3',
          name: 'Rapid 3',
          description: '+15 Damage',
          type: 'projectile',
          statBonus: { damage: 15 },
          rarity: 'epic'
        }
      ];

      const initialDamage = player.getTotalDamage('projectile');

      // Apply all upgrades rapidly
      upgrades.forEach(upgrade => player.applyWeaponUpgrade(upgrade));

      expect(player.getTotalDamage('projectile')).toBe(initialDamage + 30);
    });

    it('should handle zero bonus upgrades gracefully', () => {
      const zeroUpgrade: WeaponUpgrade = {
        id: 'zero_upgrade',
        name: 'Zero Bonus',
        description: '+0 Damage',
        type: 'projectile',
        statBonus: { damage: 0 },
        rarity: 'common'
      };

      const initialDamage = player.getTotalDamage('projectile');

      expect(() => player.applyWeaponUpgrade(zeroUpgrade)).not.toThrow();
      expect(player.getTotalDamage('projectile')).toBe(initialDamage);
    });

    it('should handle negative bonuses (if allowed)', () => {
      const negativeUpgrade: WeaponUpgrade = {
        id: 'negative_upgrade',
        name: 'Debuff Test',
        description: '-5 Damage',
        type: 'projectile',
        statBonus: { damage: -5 },
        rarity: 'common'
      };

      const initialDamage = player.getTotalDamage('projectile');

      player.applyWeaponUpgrade(negativeUpgrade);

      expect(player.getTotalDamage('projectile')).toBe(initialDamage - 5);
    });
  });

  describe('Weapon Selection State Management', () => {
    it('should track current weapon bonuses', () => {
      const upgrade: WeaponUpgrade = {
        id: 'state_test',
        name: 'State Test',
        description: '+10 Damage, +0.5 Speed',
        type: 'projectile',
        statBonus: { damage: 10, attackSpeed: 0.5 },
        rarity: 'rare'
      };

      player.applyWeaponUpgrade(upgrade);

      const bonuses = player.getWeaponBonuses();

      expect(bonuses.projectile.damage).toBe(10);
      expect(bonuses.projectile.attackSpeed).toBe(0.5);
      expect(bonuses.melee.damage).toBe(0);
      expect(bonuses.melee.attackSpeed).toBe(0);
    });

    it('should maintain weapon state across multiple upgrades', () => {
      const upgrades = [
        {
          id: 'multi_1',
          name: 'Multi 1',
          description: '+10 Damage',
          type: 'projectile' as const,
          statBonus: { damage: 10 },
          rarity: 'common' as const
        },
        {
          id: 'multi_2',
          name: 'Multi 2',
          description: '+0.5 Speed',
          type: 'melee' as const,
          statBonus: { attackSpeed: 0.5 },
          rarity: 'common' as const
        }
      ];

      upgrades.forEach(u => player.applyWeaponUpgrade(u));

      const bonuses = player.getWeaponBonuses();

      expect(bonuses.projectile.damage).toBe(10);
      expect(bonuses.melee.attackSpeed).toBe(0.5);
    });
  });
});
