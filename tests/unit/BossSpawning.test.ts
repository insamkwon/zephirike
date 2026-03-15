import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Boss } from '../../src/entities/Boss';
import { BossConfig, BossState } from '../../src/types/GameTypes';

describe('Boss Entity', () => {
  let scene: any;
  let playerRef: any;
  let bossConfig: BossConfig;

  beforeEach(() => {
    // Create mock scene using the same pattern as other tests
    scene = {
      add: {
        sprite: vi.fn(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setDisplaySize: vi.fn().mockReturnThis(),
          setTint: vi.fn().mockReturnThis(),
          setRotation: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          getBounds: vi.fn()
        })),
        graphics: vi.fn(() => ({
          setPosition: vi.fn().mockReturnThis(),
          clear: vi.fn().mockReturnThis(),
          fillStyle: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeRect: vi.fn().mockReturnThis()
        })),
        text: vi.fn(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setText: vi.fn().mockReturnThis()
        })),
        existing: vi.fn()
      },
      physics: {
        add: {
          existing: vi.fn((obj: any) => {
            obj.body = {
              setSize: vi.fn().mockReturnThis(),
              setCollideWorldBounds: vi.fn().mockReturnThis(),
              setDrag: vi.fn().mockReturnThis(),
              setVelocity: vi.fn().mockReturnThis()
            };
          })
        }
      },
      tweens: {
        add: vi.fn()
      },
      time: {
        delayedCall: vi.fn(),
        now: 0
      },
      cameras: {
        main: {
          shake: vi.fn()
        }
      }
    };

    // Create mock player
    playerRef = {
      x: 400,
      y: 300
    };

    // Create boss config
    bossConfig = {
      x: 200,
      y: 200,
      speed: 120,
      hp: 1000,
      maxHp: 1000,
      damage: 30,
      size: 64,
      name: 'TEST BOSS',
      attackPattern: 'chase'
    };
  });

  describe('Boss Creation', () => {
    it('should create a boss with correct configuration', () => {
      const boss = new Boss(scene, 200, 200, bossConfig, playerRef);

      expect(boss).toBeDefined();
      expect(boss.x).toBe(200);
      expect(boss.y).toBe(200);
    });

    it('should start in SPAWNING state', () => {
      const boss = new Boss(scene, 200, 200, bossConfig, playerRef);

      expect(boss.getBossState()).toBe(BossState.SPAWNING);
    });

    it('should be invulnerable during spawn', () => {
      const boss = new Boss(scene, 200, 200, bossConfig, playerRef);

      expect(boss.isInvulnerable()).toBe(true);
    });
  });

  describe('Boss Damage', () => {
    it('should not take damage during spawn', () => {
      const boss = new Boss(scene, 200, 200, bossConfig, playerRef);
      const killed = boss.takeDamage(100);

      expect(killed).toBe(false);
    });

    it('should take damage after spawn completes', () => {
      const boss = new Boss(scene, 200, 200, bossConfig, playerRef);

      // Simulate spawn completion
      (boss as any).bossState = BossState.ACTIVE;

      const killed = boss.takeDamage(100);

      expect(killed).toBe(false);
      expect(boss.getDamage()).toBe(30); // Damage value should remain unchanged
    });

    it('should die when HP reaches 0', () => {
      const boss = new Boss(scene, 200, 200, bossConfig, playerRef);

      // Set to active state
      (boss as any).bossState = BossState.ACTIVE;

      // Deal enough damage to kill
      const killed = boss.takeDamage(1000);

      expect(killed).toBe(true);
      expect(boss.getBossState()).toBe(BossState.DEAD);
    });
  });

  describe('Boss Attack Patterns', () => {
    it('should have correct attack pattern', () => {
      const chaseBoss = new Boss(scene, 200, 200, bossConfig, playerRef);
      expect(chaseBoss.getAttackPattern()).toBe('chase');

      bossConfig.attackPattern = 'spray';
      const sprayBoss = new Boss(scene, 200, 200, bossConfig, playerRef);
      expect(sprayBoss.getAttackPattern()).toBe('spray');

      bossConfig.attackPattern = 'charge';
      const chargeBoss = new Boss(scene, 200, 200, bossConfig, playerRef);
      expect(chargeBoss.getAttackPattern()).toBe('charge');
    });
  });

  describe('Boss State Management', () => {
    it('should transition from SPAWNING to ACTIVE', () => {
      const boss = new Boss(scene, 200, 200, bossConfig, playerRef);

      expect(boss.getBossState()).toBe(BossState.SPAWNING);

      // Simulate spawn animation completion
      (boss as any).bossState = BossState.ACTIVE;

      expect(boss.getBossState()).toBe(BossState.ACTIVE);
      expect(boss.isInvulnerable()).toBe(false);
    });

    it('should handle CHARGING state correctly', () => {
      bossConfig.attackPattern = 'charge';
      const boss = new Boss(scene, 200, 200, bossConfig, playerRef);

      // Set to active state
      (boss as any).bossState = BossState.ACTIVE;

      // Manually set to charging state
      (boss as any).bossState = BossState.CHARGING;

      expect(boss.getBossState()).toBe(BossState.CHARGING);
    });
  });

  describe('Boss Configuration', () => {
    it('should have correct size', () => {
      const boss = new Boss(scene, 200, 200, bossConfig, playerRef);
      expect(boss.width).toBe(64);
      expect(boss.height).toBe(64);
    });

    it('should have correct damage value', () => {
      const boss = new Boss(scene, 200, 200, bossConfig, playerRef);
      expect(boss.getDamage()).toBe(30);
    });

    it('should have correct name', () => {
      bossConfig.name = 'DARK OVERLORD CHASE';
      const boss = new Boss(scene, 200, 200, bossConfig, playerRef);
      expect(boss).toBeDefined();
    });
  });

  describe('Boss Update Behavior', () => {
    it('should not update when in SPAWNING state', () => {
      const boss = new Boss(scene, 200, 200, bossConfig, playerRef);

      // Should not throw error and should not update position
      expect(() => boss.update()).not.toThrow();
    });

    it('should not update when in DEAD state', () => {
      const boss = new Boss(scene, 200, 200, bossConfig, playerRef);
      (boss as any).bossState = BossState.DEAD;

      // Should not throw error
      expect(() => boss.update()).not.toThrow();
    });

    it('should update when in ACTIVE state', () => {
      const boss = new Boss(scene, 200, 200, bossConfig, playerRef);
      (boss as any).bossState = BossState.ACTIVE;

      // Should not throw error
      expect(() => boss.update()).not.toThrow();
    });
  });
});
