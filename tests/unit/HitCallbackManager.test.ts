import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HitCallbackManager } from '../../src/systems/HitCallbackManager';
import { HitCallback, HitEvent, HitCallbackFilter } from '../../src/types/GameTypes';

describe('HitCallbackManager', () => {
  let manager: HitCallbackManager;
  let mockCallback1: HitCallback;
  let mockCallback2: HitCallback;
  let mockCallback3: HitCallback;

  beforeEach(() => {
    // Create a fresh instance for each test
    manager = new HitCallbackManager();

    // Create mock callbacks
    mockCallback1 = vi.fn();
    mockCallback2 = vi.fn();
    mockCallback3 = vi.fn();
  });

  describe('Basic Callback Registration', () => {
    it('should register a callback successfully', () => {
      const unregister = manager.register(mockCallback1);
      expect(typeof unregister).toBe('function');
      expect(manager.getCallbackCount()).toBe(1);
    });

    it('should execute registered callbacks when emitHitEvent is called', () => {
      manager.register(mockCallback1);

      const hitEvent: HitEvent = {
        damage: 25,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_1',
        timestamp: 1000
      };

      manager.emitHitEvent(hitEvent);

      expect(mockCallback1).toHaveBeenCalledTimes(1);
      expect(mockCallback1).toHaveBeenCalledWith(hitEvent);
    });

    it('should execute multiple registered callbacks in order', () => {
      const callOrder: number[] = [];

      const callback1: HitCallback = (event) => callOrder.push(1);
      const callback2: HitCallback = (event) => callOrder.push(2);
      const callback3: HitCallback = (event) => callOrder.push(3);

      manager.register(callback1, { priority: 1 });
      manager.register(callback2, { priority: 3 });
      manager.register(callback3, { priority: 2 });

      const hitEvent: HitEvent = {
        damage: 25,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_1',
        timestamp: 1000
      };

      manager.emitHitEvent(hitEvent);

      // Should execute in priority order: 3, 2, 1
      expect(callOrder).toEqual([2, 3, 1]);
    });

    it('should unregister a callback using the returned function', () => {
      const unregister = manager.register(mockCallback1);
      expect(manager.getCallbackCount()).toBe(1);

      unregister();
      expect(manager.getCallbackCount()).toBe(0);

      const hitEvent: HitEvent = {
        damage: 25,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_1',
        timestamp: 1000
      };

      manager.emitHitEvent(hitEvent);
      expect(mockCallback1).not.toHaveBeenCalled();
    });
  });

  describe('Callback Filtering', () => {
    it('should filter callbacks by damage type', () => {
      const projectileCallback = vi.fn();
      const meleeCallback = vi.fn();

      manager.register(projectileCallback, {
        filter: { damageType: ['projectile'] }
      });

      manager.register(meleeCallback, {
        filter: { damageType: ['melee'] }
      });

      const projectileEvent: HitEvent = {
        damage: 25,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_1',
        timestamp: 1000
      };

      const meleeEvent: HitEvent = {
        damage: 30,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'melee',
        targetId: 'enemy_2',
        timestamp: 2000
      };

      manager.emitHitEvent(projectileEvent);
      expect(projectileCallback).toHaveBeenCalledTimes(1);
      expect(meleeCallback).not.toHaveBeenCalled();

      manager.emitHitEvent(meleeEvent);
      expect(meleeCallback).toHaveBeenCalledTimes(1);
      expect(projectileCallback).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should filter callbacks by minimum damage', () => {
      const highDamageCallback = vi.fn();

      manager.register(highDamageCallback, {
        filter: { minDamage: 50 }
      });

      const lowDamageEvent: HitEvent = {
        damage: 25,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_1',
        timestamp: 1000
      };

      const highDamageEvent: HitEvent = {
        damage: 75,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_2',
        timestamp: 2000
      };

      manager.emitHitEvent(lowDamageEvent);
      expect(highDamageCallback).not.toHaveBeenCalled();

      manager.emitHitEvent(highDamageEvent);
      expect(highDamageCallback).toHaveBeenCalledTimes(1);
    });

    it('should filter callbacks by maximum damage', () => {
      const lowDamageCallback = vi.fn();

      manager.register(lowDamageCallback, {
        filter: { maxDamage: 30 }
      });

      const lowDamageEvent: HitEvent = {
        damage: 25,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_1',
        timestamp: 1000
      };

      const highDamageEvent: HitEvent = {
        damage: 75,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_2',
        timestamp: 2000
      };

      manager.emitHitEvent(lowDamageEvent);
      expect(lowDamageCallback).toHaveBeenCalledTimes(1);

      manager.emitHitEvent(highDamageEvent);
      expect(lowDamageCallback).toHaveBeenCalledTimes(1); // Still 1, not called for high damage
    });

    it('should filter callbacks by critical hit status', () => {
      const critCallback = vi.fn();

      manager.register(critCallback, {
        filter: { isCritical: true }
      });

      const normalHitEvent: HitEvent = {
        damage: 25,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_1',
        timestamp: 1000,
        isCritical: false
      };

      const critHitEvent: HitEvent = {
        damage: 50,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_2',
        timestamp: 2000,
        isCritical: true
      };

      manager.emitHitEvent(normalHitEvent);
      expect(critCallback).not.toHaveBeenCalled();

      manager.emitHitEvent(critHitEvent);
      expect(critCallback).toHaveBeenCalledTimes(1);
    });

    it('should apply multiple filters simultaneously', () => {
      const filteredCallback = vi.fn();

      manager.register(filteredCallback, {
        filter: {
          damageType: ['projectile'],
          minDamage: 30,
          maxDamage: 70
        }
      });

      const validEvent: HitEvent = {
        damage: 50,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_1',
        timestamp: 1000
      };

      const invalidTypeEvent: HitEvent = {
        damage: 50,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'melee',
        targetId: 'enemy_2',
        timestamp: 2000
      };

      const tooLowDamageEvent: HitEvent = {
        damage: 20,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_3',
        timestamp: 3000
      };

      const tooHighDamageEvent: HitEvent = {
        damage: 100,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_4',
        timestamp: 4000
      };

      manager.emitHitEvent(validEvent);
      expect(filteredCallback).toHaveBeenCalledTimes(1);

      manager.emitHitEvent(invalidTypeEvent);
      expect(filteredCallback).toHaveBeenCalledTimes(1); // Still 1

      manager.emitHitEvent(tooLowDamageEvent);
      expect(filteredCallback).toHaveBeenCalledTimes(1); // Still 1

      manager.emitHitEvent(tooHighDamageEvent);
      expect(filteredCallback).toHaveBeenCalledTimes(1); // Still 1
    });
  });

  describe('One-Time Callbacks', () => {
    it('should remove one-time callbacks after execution', () => {
      manager.register(mockCallback1, { once: true });

      expect(manager.getCallbackCount()).toBe(1);

      const hitEvent: HitEvent = {
        damage: 25,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_1',
        timestamp: 1000
      };

      manager.emitHitEvent(hitEvent);
      expect(mockCallback1).toHaveBeenCalledTimes(1);
      expect(manager.getCallbackCount()).toBe(0);

      // Callback should not be called again
      manager.emitHitEvent(hitEvent);
      expect(mockCallback1).toHaveBeenCalledTimes(1);
    });

    it('should not remove one-time callbacks if they are filtered out', () => {
      manager.register(mockCallback1, {
        once: true,
        filter: { damageType: ['projectile'] }
      });

      const meleeEvent: HitEvent = {
        damage: 30,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'melee',
        targetId: 'enemy_1',
        timestamp: 1000
      };

      manager.emitHitEvent(meleeEvent);
      expect(mockCallback1).not.toHaveBeenCalled();
      expect(manager.getCallbackCount()).toBe(1); // Should still be registered

      const projectileEvent: HitEvent = {
        damage: 25,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_2',
        timestamp: 2000
      };

      manager.emitHitEvent(projectileEvent);
      expect(mockCallback1).toHaveBeenCalledTimes(1);
      expect(manager.getCallbackCount()).toBe(0); // Now removed
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in callbacks gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });

      const normalCallback = vi.fn();

      manager.register(errorCallback);
      manager.register(normalCallback);

      const hitEvent: HitEvent = {
        damage: 25,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_1',
        timestamp: 1000
      };

      // Should not throw
      expect(() => manager.emitHitEvent(hitEvent)).not.toThrow();

      // Error callback should be called
      expect(errorCallback).toHaveBeenCalledTimes(1);

      // Normal callback should still be called
      expect(normalCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Management Methods', () => {
    it('should unregister all callbacks', () => {
      manager.register(mockCallback1);
      manager.register(mockCallback2);
      manager.register(mockCallback3);

      expect(manager.getCallbackCount()).toBe(3);

      manager.unregisterAll();

      expect(manager.getCallbackCount()).toBe(0);
      expect(manager.hasCallbacks()).toBe(false);
    });

    it('should check if callbacks are registered', () => {
      expect(manager.hasCallbacks()).toBe(false);

      manager.register(mockCallback1);

      expect(manager.hasCallbacks()).toBe(true);
    });

    it('should return correct callback count', () => {
      expect(manager.getCallbackCount()).toBe(0);

      manager.register(mockCallback1);
      expect(manager.getCallbackCount()).toBe(1);

      manager.register(mockCallback2);
      expect(manager.getCallbackCount()).toBe(2);

      const unregister1 = manager.register(mockCallback3);
      expect(manager.getCallbackCount()).toBe(3);

      unregister1();
      expect(manager.getCallbackCount()).toBe(2);
    });

    it('should destroy and reset the manager', () => {
      manager.register(mockCallback1);
      manager.register(mockCallback2);

      expect(manager.getCallbackCount()).toBe(2);

      manager.destroy();

      expect(manager.getCallbackCount()).toBe(0);
      expect(manager.hasCallbacks()).toBe(false);
    });
  });

  describe('Priority Execution', () => {
    it('should execute callbacks with higher priority first', () => {
      const executionOrder: string[] = [];

      const lowPriorityCallback: HitCallback = (event) => executionOrder.push('low');
      const mediumPriorityCallback: HitCallback = (event) => executionOrder.push('medium');
      const highPriorityCallback: HitCallback = (event) => executionOrder.push('high');

      manager.register(lowPriorityCallback, { priority: 1 });
      manager.register(highPriorityCallback, { priority: 100 });
      manager.register(mediumPriorityCallback, { priority: 50 });

      const hitEvent: HitEvent = {
        damage: 25,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_1',
        timestamp: 1000
      };

      manager.emitHitEvent(hitEvent);

      expect(executionOrder).toEqual(['high', 'medium', 'low']);
    });

    it('should execute callbacks with same priority in registration order', () => {
      const executionOrder: string[] = [];

      const callback1: HitCallback = (event) => executionOrder.push('first');
      const callback2: HitCallback = (event) => executionOrder.push('second');
      const callback3: HitCallback = (event) => executionOrder.push('third');

      manager.register(callback1, { priority: 10 });
      manager.register(callback2, { priority: 10 });
      manager.register(callback3, { priority: 10 });

      const hitEvent: HitEvent = {
        damage: 25,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_1',
        timestamp: 1000
      };

      manager.emitHitEvent(hitEvent);

      expect(executionOrder).toEqual(['first', 'second', 'third']);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance from getInstance', () => {
      const instance1 = HitCallbackManager.getInstance();
      const instance2 = HitCallbackManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should share callbacks across getInstance instances', () => {
      const instance1 = HitCallbackManager.getInstance();
      const instance2 = HitCallbackManager.getInstance();

      instance1.register(mockCallback1);

      expect(instance2.getCallbackCount()).toBe(1);

      const hitEvent: HitEvent = {
        damage: 25,
        targetX: 100,
        targetY: 200,
        sourceX: 50,
        sourceY: 150,
        damageType: 'projectile',
        targetId: 'enemy_1',
        timestamp: 1000
      };

      instance2.emitHitEvent(hitEvent);

      expect(mockCallback1).toHaveBeenCalledTimes(1);
    });
  });
});
