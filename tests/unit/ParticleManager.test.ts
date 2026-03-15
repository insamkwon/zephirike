import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParticleManager, ParticleType } from '../../src/systems/ParticleManager';
import Phaser from 'phaser';

// Mock Phaser.Math.Easing
vi.mock('phaser', () => ({
  default: {
    Math: {
      Easing: {
        Quadratic: {
          Out: 'Quadratic.Out'
        }
      }
    },
    BlendModes: {
      ADD: 'ADD',
      NORMAL: 'NORMAL'
    }
  }
}));

// Mock Phaser.Scene for testing
class MockScene {
  public add: any;
  public time: any;
  public tweens: any;
  public cameras: any;
  public textures: any;
  public make: any;

  constructor() {
    this.textures = {
      exists: vi.fn(() => false)
    };

    this.make = {
      graphics: vi.fn(() => ({
        fillStyle: vi.fn(),
        fillCircle: vi.fn(),
        fillTriangle: vi.fn(),
        fillRect: vi.fn(),
        generateTexture: vi.fn(),
        destroy: vi.fn()
      }))
    };

    this.add = {
      group: vi.fn(() => ({
        add: vi.fn(),
        destroy: vi.fn()
      })),
      particles: vi.fn((x: number, y: number, key: string, config: any) => ({
        emitParticleAt: vi.fn(),
        explode: vi.fn(),
        destroy: vi.fn()
      })),
      text: vi.fn((x: number, y: number, text: string, style: any) => {
        const textObj = {
          setOrigin: vi.fn(function(this: any) { return this; }),
          setDepth: vi.fn(function(this: any) { return this; }),
          setAlpha: vi.fn(function(this: any) { return this; }),
          setScale: vi.fn(function(this: any) { return this; }),
          destroy: vi.fn()
        };
        return textObj;
      }),
      graphics: vi.fn(() => {
        const graphicsObj: any = {
          fillStyle: vi.fn(function(this: any) { return this; }),
          fillRect: vi.fn(function(this: any) { return this; }),
          clear: vi.fn(function(this: any) { return this; }),
          setDepth: vi.fn(function(this: any) { return this; }),
          setScrollFactor: vi.fn(function(this: any) { return this; }),
          destroy: vi.fn(),
          lineStyle: vi.fn(function(this: any) { return this; }),
          strokeRect: vi.fn(function(this: any) { return this; }),
          fillCircle: vi.fn(function(this: any) { return this; }),
          strokeCircle: vi.fn(function(this: any) { return this; }),
          alpha: 1,
          x: 0,
          y: 0
        };
        return graphicsObj;
      })
    };

    this.time = {
      delayedCall: vi.fn(),
      now: 0
    };

    this.tweens = {
      add: vi.fn()
    };

    this.cameras = {
      main: {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        setPosition: vi.fn()
      }
    };
  }
}

describe('ParticleManager', () => {
  let particleManager: ParticleManager;
  let mockScene: MockScene;

  beforeEach(() => {
    mockScene = new MockScene();
    particleManager = new ParticleManager(mockScene as any);
  });

  describe('Initialization', () => {
    it('should create particle manager successfully', () => {
      expect(particleManager).toBeDefined();
      expect(particleManager instanceof ParticleManager).toBe(true);
    });

    it('should initialize particle textures', () => {
      // Verify texture generation was called
      expect(mockScene.make.graphics).toHaveBeenCalled();
    });

    it('should initialize particle emitters for all types', () => {
      // Verify particle emitters were created
      expect(mockScene.add.particles).toHaveBeenCalled();
    });
  });

  describe('emitParticles', () => {
    it('should emit particles with valid type', () => {
      const emitterSpy = vi.fn();
      mockScene.add.particles = vi.fn(() => ({
        emitParticleAt: emitterSpy,
        explode: vi.fn(),
        destroy: vi.fn()
      }));

      const testManager = new ParticleManager(mockScene as any);

      testManager.emitParticles({
        type: ParticleType.BLOOD,
        x: 100,
        y: 100,
        count: 10
      });

      // Should have created emitters during initialization
      expect(mockScene.add.particles).toHaveBeenCalled();
    });

    it('should handle invalid particle type gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      particleManager.emitParticles({
        type: 'invalid' as ParticleType,
        x: 100,
        y: 100,
        count: 10
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Particle emitter for type')
      );

      consoleSpy.mockRestore();
    });

    it('should use default count when not specified', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      particleManager.emitParticles({
        type: ParticleType.BLOOD,
        x: 100,
        y: 100
      });

      // Should not throw error with default count
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('count')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('createDamageNumber', () => {
    it('should create damage number at specified position', () => {
      // Mock Math.random to ensure non-crit behavior (deterministic test)
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1.0);

      const textSpy = vi.fn((x: number, y: number, text: string, style: any) => ({
        setOrigin: vi.fn(function(this: any) { return this; }),
        setDepth: vi.fn(function(this: any) { return this; }),
        setAlpha: vi.fn(function(this: any) { return this; }),
        setScale: vi.fn(function(this: any) { return this; }),
        destroy: vi.fn()
      }));
      mockScene.add.text = textSpy;

      particleManager.createDamageNumber({
        x: 100,
        y: 100,
        damage: 25
      });

      expect(textSpy).toHaveBeenCalledWith(
        100,
        100, // createDamageNumber uses the y value directly
        '25',
        expect.objectContaining({
          color: '#ffffff',
          fontSize: 'bold 18px'
        })
      );

      randomSpy.mockRestore();
    });

    it('should format damage as integer', () => {
      // Mock Math.random to ensure non-crit behavior (deterministic test)
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1.0);

      const textSpy = vi.fn((x: number, y: number, text: string, style: any) => ({
        setOrigin: vi.fn(function(this: any) { return this; }),
        setDepth: vi.fn(function(this: any) { return this; }),
        setAlpha: vi.fn(function(this: any) { return this; }),
        setScale: vi.fn(function(this: any) { return this; }),
        destroy: vi.fn()
      }));
      mockScene.add.text = textSpy;

      particleManager.createDamageNumber({
        x: 100,
        y: 100,
        damage: 25.7
      });

      expect(textSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        '25', // Should be floored
        expect.any(Object)
      );

      randomSpy.mockRestore();
    });

    it('should show critical hit indicator for high damage', () => {
      const textSpy = vi.fn((x: number, y: number, text: string, style: any) => ({
        setOrigin: vi.fn(function(this: any) { return this; }),
        setDepth: vi.fn(function(this: any) { return this; }),
        setAlpha: vi.fn(function(this: any) { return this; }),
        setScale: vi.fn(function(this: any) { return this; }),
        destroy: vi.fn()
      }));
      mockScene.add.text = textSpy;

      // Force crit by setting isCrit to true
      particleManager.createDamageNumber({
        x: 100,
        y: 100,
        damage: 50,
        isCrit: true
      });

      const callArgs = textSpy.mock.calls[0];
      const damageText = callArgs[2]; // Third argument is the text
      const styleConfig = callArgs[3]; // Fourth argument is the style config

      expect(damageText).toContain('!'); // Crit indicator
      expect(styleConfig.fontSize).toContain('24'); // Larger font for crit
    });
  });

  describe('createHitEffect', () => {
    it('should create combined hit effect with particles and damage number', () => {
      const textSpy = vi.fn((x: number, y: number, text: string, style: any) => ({
        setOrigin: vi.fn(function(this: any) { return this; }),
        setDepth: vi.fn(function(this: any) { return this; }),
        setAlpha: vi.fn(function(this: any) { return this; }),
        setScale: vi.fn(function(this: any) { return this; }),
        destroy: vi.fn()
      }));
      mockScene.add.text = textSpy;

      particleManager.createHitEffect(
        100,
        100,
        25,
        ParticleType.BLOOD,
        8
      );

      // Should create damage number
      expect(textSpy).toHaveBeenCalled();
    });

    it('should use default values when not specified', () => {
      const textSpy = vi.fn((x: number, y: number, text: string, style: any) => ({
        setOrigin: vi.fn(function(this: any) { return this; }),
        setDepth: vi.fn(function(this: any) { return this; }),
        setAlpha: vi.fn(function(this: any) { return this; }),
        setScale: vi.fn(function(this: any) { return this; }),
        destroy: vi.fn()
      }));
      mockScene.add.text = textSpy;

      particleManager.createHitEffect(
        100,
        100,
        25
      );

      // Should still create damage number with defaults
      expect(textSpy).toHaveBeenCalled();
    });
  });

  describe('createDeathEffect', () => {
    it('should create explosion effect on death', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      particleManager.createDeathEffect(
        100,
        100,
        ParticleType.BLOOD
      );

      // Should not throw errors
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should use blood as default particle type', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      particleManager.createDeathEffect(
        100,
        100
      );

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('createProjectileTrail', () => {
    it('should create projectile trail effect', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      particleManager.createProjectileTrail(100, 100);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('addScreenFlash', () => {
    it('should create screen flash overlay graphics', () => {
      const graphicsSpy = vi.fn(() => ({
        fillStyle: vi.fn(function(this: any) { return this; }),
        fillRect: vi.fn(function(this: any) { return this; }),
        setDepth: vi.fn(function(this: any) { return this; }),
        setScrollFactor: vi.fn(function(this: any) { return this; }),
        destroy: vi.fn(),
        alpha: 1,
        x: 0,
        y: 0
      }));
      mockScene.add.graphics = graphicsSpy;

      particleManager.addScreenFlash();

      expect(graphicsSpy).toHaveBeenCalled();
    });

    it('should use default values when config not provided', () => {
      const graphicsSpy = vi.fn(() => ({
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        setDepth: vi.fn(),
        setScrollFactor: vi.fn()
      }));
      mockScene.add.graphics = graphicsSpy;

      particleManager.addScreenFlash();

      expect(graphicsSpy).toHaveBeenCalled();
    });

    it('should use custom color when provided', () => {
      const graphicsMock = {
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        setDepth: vi.fn(),
        setScrollFactor: vi.fn()
      };
      mockScene.add.graphics = vi.fn(() => graphicsMock);
      // graphicsMock already defined, use it directly

      particleManager.addScreenFlash({ color: 0xffff00 });

      expect(graphicsMock.fillStyle).toHaveBeenCalledWith(0xffff00, expect.any(Number));
    });

    it('should use custom intensity when provided', () => {
      const graphicsMock = {
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        setDepth: vi.fn(),
        setScrollFactor: vi.fn()
      };
      mockScene.add.graphics = vi.fn(() => graphicsMock);
      // graphicsMock already defined, use it directly

      particleManager.addScreenFlash({ intensity: 0.5 });

      expect(graphicsMock.fillStyle).toHaveBeenCalledWith(expect.any(Number), 0.5);
    });

    it('should use custom duration when provided', () => {
      const graphicsMock = {
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        setDepth: vi.fn(),
        setScrollFactor: vi.fn()
      };
      mockScene.add.graphics = vi.fn(() => graphicsMock);
      // graphicsMock already defined, use it directly
      const tweenSpy = vi.fn();
      mockScene.tweens.add = tweenSpy;

      particleManager.addScreenFlash({ duration: 200 });

      expect(tweenSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 200
        })
      );
    });

    it('should set high depth to appear on top', () => {
      const graphicsMock = {
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        setDepth: vi.fn(),
        setScrollFactor: vi.fn()
      };
      mockScene.add.graphics = vi.fn(() => graphicsMock);
      // graphicsMock already defined, use it directly

      particleManager.addScreenFlash();

      expect(graphicsMock.setDepth).toHaveBeenCalledWith(9999);
    });

    it('should set scroll factor to 0 for fixed position', () => {
      const graphicsMock = {
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        setDepth: vi.fn(),
        setScrollFactor: vi.fn()
      };
      mockScene.add.graphics = vi.fn(() => graphicsMock);
      // graphicsMock already defined, use it directly

      particleManager.addScreenFlash();

      expect(graphicsMock.setScrollFactor).toHaveBeenCalledWith(0);
    });

    it('should create fade out tween', () => {
      const graphicsMock = {
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        setDepth: vi.fn(),
        setScrollFactor: vi.fn()
      };
      mockScene.add.graphics = vi.fn(() => graphicsMock);
      // graphicsMock already defined, use it directly
      const tweenSpy = vi.fn();
      mockScene.tweens.add = tweenSpy;

      particleManager.addScreenFlash();

      expect(tweenSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: graphicsMock,
          alpha: 0,
          ease: Phaser.Math.Easing.Quadratic.Out
        })
      );
    });

    it('should destroy flash overlay after fade completes', () => {
      const graphicsMock = {
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        setDepth: vi.fn(),
        setScrollFactor: vi.fn(),
        destroy: vi.fn()
      };
      mockScene.add.graphics = vi.fn(() => graphicsMock);
      // graphicsMock already defined, use it directly
      const tweenSpy = vi.fn();
      mockScene.tweens.add = tweenSpy;

      particleManager.addScreenFlash();

      const tweenConfig = tweenSpy.mock.calls[0][0];
      expect(tweenConfig.onComplete).toBeDefined();

      // Execute the onComplete callback
      tweenConfig.onComplete();

      expect(graphicsMock.destroy).toHaveBeenCalled();
    });
  });

  describe('createHitEffect with Screen Flash', () => {
    it('should trigger screen flash for critical hits', () => {
      const graphicsSpy = vi.fn(() => ({
        fillStyle: vi.fn(function(this: any) { return this; }),
        fillRect: vi.fn(function(this: any) { return this; }),
        setDepth: vi.fn(function(this: any) { return this; }),
        setScrollFactor: vi.fn(function(this: any) { return this; }),
        destroy: vi.fn(),
        alpha: 1,
        x: 0,
        y: 0
      }));
      mockScene.add.graphics = graphicsSpy;
      const textSpy = vi.fn((x: number, y: number, text: string, style: any) => ({
        setOrigin: vi.fn(function(this: any) { return this; }),
        setDepth: vi.fn(function(this: any) { return this; }),
        setAlpha: vi.fn(function(this: any) { return this; }),
        setScale: vi.fn(function(this: any) { return this; }),
        destroy: vi.fn()
      }));
      mockScene.add.text = textSpy;

      particleManager.createHitEffect(
        100,
        100,
        25,
        ParticleType.BLOOD,
        8,
        true // isCrit
      );

      // Screen flash should be created for crits
      expect(graphicsSpy).toHaveBeenCalled();
    });

    it('should trigger screen flash for high damage (> 25)', () => {
      const graphicsSpy = vi.fn(() => ({
        fillStyle: vi.fn(function(this: any) { return this; }),
        fillRect: vi.fn(function(this: any) { return this; }),
        setDepth: vi.fn(function(this: any) { return this; }),
        setScrollFactor: vi.fn(function(this: any) { return this; }),
        destroy: vi.fn(),
        alpha: 1,
        x: 0,
        y: 0
      }));
      mockScene.add.graphics = graphicsSpy;
      const textSpy = vi.fn((x: number, y: number, text: string, style: any) => ({
        setOrigin: vi.fn(function(this: any) { return this; }),
        setDepth: vi.fn(function(this: any) { return this; }),
        setAlpha: vi.fn(function(this: any) { return this; }),
        setScale: vi.fn(function(this: any) { return this; }),
        destroy: vi.fn()
      }));
      mockScene.add.text = textSpy;

      particleManager.createHitEffect(
        100,
        100,
        30, // High damage
        ParticleType.BLOOD,
        8,
        false // not crit
      );

      // Screen flash should be created for high damage
      expect(graphicsSpy).toHaveBeenCalled();
    });

    it('should not trigger screen flash for low damage non-crit hits', () => {
      const graphicsSpy = vi.fn(() => ({
        fillStyle: vi.fn(function(this: any) { return this; }),
        fillRect: vi.fn(function(this: any) { return this; }),
        setDepth: vi.fn(function(this: any) { return this; }),
        setScrollFactor: vi.fn(function(this: any) { return this; }),
        destroy: vi.fn(),
        alpha: 1,
        x: 0,
        y: 0
      }));
      mockScene.add.graphics = graphicsSpy;
      const textSpy = vi.fn((x: number, y: number, text: string, style: any) => ({
        setOrigin: vi.fn(function(this: any) { return this; }),
        setDepth: vi.fn(function(this: any) { return this; }),
        setAlpha: vi.fn(function(this: any) { return this; }),
        setScale: vi.fn(function(this: any) { return this; }),
        destroy: vi.fn()
      }));
      mockScene.add.text = textSpy;

      particleManager.createHitEffect(
        100,
        100,
        15, // Low damage
        ParticleType.BLOOD,
        8,
        false // not crit
      );

      // Screen flash should not be created for low damage non-crit
      expect(graphicsSpy).not.toHaveBeenCalled();
    });

    it('should use yellow flash for critical hits', () => {
      const graphicsMock = {
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        setDepth: vi.fn(),
        setScrollFactor: vi.fn(),
        destroy: vi.fn()
      };
      mockScene.add.graphics = vi.fn(() => graphicsMock);
      // graphicsMock already defined, use it directly
      mockScene.add.text = vi.fn((x: number, y: number, text: string, style: any) => ({
        setOrigin: vi.fn(function(this: any) { return this; }),
        setDepth: vi.fn(function(this: any) { return this; }),
        setAlpha: vi.fn(function(this: any) { return this; }),
        setScale: vi.fn(function(this: any) { return this; }),
        destroy: vi.fn()
      }));

      particleManager.createHitEffect(
        100,
        100,
        25,
        ParticleType.BLOOD,
        8,
        true // isCrit
      );

      // Should use yellow color for crits
      expect(graphicsMock.fillStyle).toHaveBeenCalledWith(0xffff00, expect.any(Number));
    });

    it('should use white flash for high damage non-crit hits', () => {
      const graphicsMock = {
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        setDepth: vi.fn(),
        setScrollFactor: vi.fn(),
        destroy: vi.fn()
      };
      mockScene.add.graphics = vi.fn(() => graphicsMock);
      // graphicsMock already defined, use it directly
      mockScene.add.text = vi.fn((x: number, y: number, text: string, style: any) => ({
        setOrigin: vi.fn(function(this: any) { return this; }),
        setDepth: vi.fn(function(this: any) { return this; }),
        setAlpha: vi.fn(function(this: any) { return this; }),
        setScale: vi.fn(function(this: any) { return this; }),
        destroy: vi.fn()
      }));

      particleManager.createHitEffect(
        100,
        100,
        30, // High damage
        ParticleType.BLOOD,
        8,
        false // not crit
      );

      // Should use white color for heavy hits
      expect(graphicsMock.fillStyle).toHaveBeenCalledWith(0xffffff, expect.any(Number));
    });
  });

  describe('destroy', () => {
    it('should clean up all emitters and damage numbers', () => {
      const groupDestroySpy = vi.fn();
      mockScene.add.group = vi.fn(() => ({
        add: vi.fn(),
        destroy: groupDestroySpy
      }));

      const testManager = new ParticleManager(mockScene as any);

      testManager.destroy();

      expect(groupDestroySpy).toHaveBeenCalled();
    });
  });

  describe('getEmitter', () => {
    it('should return emitter for valid type', () => {
      const emitter = particleManager.getEmitter(ParticleType.BLOOD);
      expect(emitter).toBeDefined();
    });

    it('should return undefined for invalid type', () => {
      const emitter = particleManager.getEmitter('invalid' as ParticleType);
      expect(emitter).toBeUndefined();
    });
  });

  describe('Particle Types', () => {
    it('should support all required particle types', () => {
      const types = [
        ParticleType.BLOOD,
        ParticleType.SPARKS,
        ParticleType.DEBRIS,
        ParticleType.IMPACT,
        ParticleType.EXPLOSION
      ];

      types.forEach(type => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        particleManager.emitParticles({
          type,
          x: 100,
          y: 100,
          count: 5
        });

        expect(consoleSpy).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
      });
    });
  });

  describe('Hit Location Calculation', () => {
    it('should calculate hit location on right edge', () => {
      const hitLocation = particleManager.calculateHitLocation(
        100, // targetX
        100, // targetY
        50,  // targetWidth
        50,  // targetHeight
        200, // projectileX (to the right)
        100  // projectileY (same Y)
      );

      expect(hitLocation.x).toBeGreaterThan(100); // Should be on right edge
      expect(hitLocation.y).toBeCloseTo(100, 0); // Should be at same Y
      expect(hitLocation.normalX).toBe(-1); // Normal points left
      expect(hitLocation.normalY).toBe(0);
    });

    it('should calculate hit location on left edge', () => {
      const hitLocation = particleManager.calculateHitLocation(
        100, 100, 50, 50,
        0, 100
      );

      expect(hitLocation.x).toBeLessThan(100);
      expect(hitLocation.y).toBeCloseTo(100, 0);
      expect(hitLocation.normalX).toBe(1);
      expect(hitLocation.normalY).toBe(0);
    });

    it('should calculate hit location on top edge', () => {
      const hitLocation = particleManager.calculateHitLocation(
        100, 100, 50, 50,
        100, 0
      );

      expect(hitLocation.x).toBeCloseTo(100, 0);
      expect(hitLocation.y).toBeLessThan(100);
      expect(hitLocation.normalX).toBe(0);
      expect(hitLocation.normalY).toBe(1);
    });

    it('should calculate hit location on bottom edge', () => {
      const hitLocation = particleManager.calculateHitLocation(
        100, 100, 50, 50,
        100, 200
      );

      expect(hitLocation.x).toBeCloseTo(100, 0);
      expect(hitLocation.y).toBeGreaterThan(100);
      expect(hitLocation.normalX).toBe(0);
      expect(hitLocation.normalY).toBe(-1);
    });

    it('should calculate diagonal hit location correctly', () => {
      const hitLocation = particleManager.calculateHitLocation(
        100, 100, 50, 50,
        200, 50
      );

      expect(hitLocation.x).toBeDefined();
      expect(hitLocation.y).toBeDefined();
      expect(hitLocation.normalX).toBeDefined();
      expect(hitLocation.normalY).toBeDefined();
      
      const normalLength = Math.sqrt(
        (hitLocation.normalX || 0) ** 2 +
        (hitLocation.normalY || 0) ** 2
      );
      expect(normalLength).toBeCloseTo(1, 1);
    });
  });

  describe('createHitEffectAtLocation', () => {
    it('should create hit effect at calculated hit location', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      particleManager.createHitEffectAtLocation(
        100, 100, 50, 50, 200, 100,
        25, ParticleType.BLOOD, 10
      );

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('createDeathEffectWithIntensity', () => {
    it('should create death effect with intensity multiplier', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      particleManager.createDeathEffectWithIntensity(
        100, 100, ParticleType.BLOOD, 1.5
      );

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should use default intensity of 1.0', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      particleManager.createDeathEffectWithIntensity(
        100, 100, ParticleType.BLOOD
      );

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});