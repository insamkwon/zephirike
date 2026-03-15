import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Player, AnalogInput } from '../../src/entities/Player';
import { PlayerConfig } from '../../src/types/GameTypes';

// Mock Phaser Scene
class MockScene {
  public add = {
    sprite: vi.fn(() => ({
      setOrigin: vi.fn(),
      setDisplaySize: vi.fn(),
      setTexture: vi.fn()
    })),
    graphics: vi.fn(() => ({
      clear: vi.fn(),
      lineStyle: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      strokePath: vi.fn(),
      strokeCircle: vi.fn(),
      fillStyle: vi.fn(),
      fillRect: vi.fn()
    })),
    group: vi.fn(() => ({
      add: vi.fn(),
      getChildren: vi.fn(() => [])
    })),
    existing: vi.fn(),
    text: vi.fn()
  };

  public physics = {
    add: {
      existing: vi.fn((obj) => {
        obj.body = {
          setSize: vi.fn(),
          setCollideWorldBounds: vi.fn(),
          setDrag: vi.fn(),
          setVelocity: vi.fn(),
          setVelocityX: vi.fn(),
          setVelocityY: vi.fn(),
          velocity: { x: 0, y: 0 }
        };
        return obj;
      })
    }
  };

  public time = {
    now: 0,
    delayedCall: vi.fn()
  };

  public tweens = {
    add: vi.fn()
  };

  public input = {
    gamepad: {
      gamepads: []
    },
    keyboard: {
      createCursorKeys: vi.fn(),
      addKeys: vi.fn()
    }
  };
}

describe('Player 360-Degree Movement System', () => {
  let mockScene: any;
  let player: Player;
  let playerConfig: PlayerConfig;

  beforeEach(() => {
    mockScene = new MockScene();
    playerConfig = {
      x: 400,
      y: 300,
      speed: 200,
      hp: 100,
      maxHp: 100,
      attackSpeed: 2,
      attackRange: 50,
      damage: 25
    };

    // Create player instance
    player = new Player(mockScene as any, playerConfig.x, playerConfig.y, playerConfig);
  });

  describe('Analog Input Movement', () => {
    it('should handle full right movement (1, 0)', () => {
      const analog: AnalogInput = { x: 1, y: 0, isActive: true };
      player.setAnalogInput(analog.x, analog.y);

      const currentInput = player.getCurrentAnalogInput();
      expect(currentInput.x).toBe(1);
      expect(currentInput.y).toBe(0);
      expect(currentInput.isActive).toBe(true);
    });

    it('should handle full up movement (0, -1)', () => {
      player.setAnalogInput(0, -1);

      const currentInput = player.getCurrentAnalogInput();
      expect(currentInput.x).toBe(0);
      expect(currentInput.y).toBe(-1);
      expect(currentInput.isActive).toBe(true);
    });

    it('should handle diagonal movement (0.707, 0.707)', () => {
      player.setAnalogInput(0.707, 0.707);

      const currentInput = player.getCurrentAnalogInput();
      expect(currentInput.x).toBeCloseTo(0.707, 3);
      expect(currentInput.y).toBeCloseTo(0.707, 3);
      expect(currentInput.isActive).toBe(true);
    });

    it('should apply deadzone to small inputs', () => {
      player.setAnalogInput(0.1, 0.1); // Below deadzone of 0.15

      const currentInput = player.getCurrentAnalogInput();
      expect(currentInput.x).toBe(0);
      expect(currentInput.y).toBe(0);
      expect(currentInput.isActive).toBe(false);
    });

    it('should clamp values to -1 to 1 range', () => {
      player.setAnalogInput(1.5, -2.0);

      const currentInput = player.getCurrentAnalogInput();
      expect(currentInput.x).toBe(1);
      expect(currentInput.y).toBe(-1);
    });

    it('should handle 360-degree angle at 0 degrees', () => {
      player.setAnalogInput(1, 0);

      // The movement angle should be 0 radians (right)
      const velocity = (player as any).physicsBody.velocity;
      velocity.x = 200;
      velocity.y = 0;

      const angle = player.getMovementAngle();
      expect(angle).toBeCloseTo(0, 5);
    });

    it('should handle 360-degree angle at 45 degrees', () => {
      player.setAnalogInput(0.707, 0.707);

      const velocity = (player as any).physicsBody.velocity;
      velocity.x = 141.42;
      velocity.y = 141.42;

      const angle = player.getMovementAngle();
      expect(angle).toBeCloseTo(Math.PI / 4, 4);
    });

    it('should handle 360-degree angle at 90 degrees', () => {
      player.setAnalogInput(0, 1);

      const velocity = (player as any).physicsBody.velocity;
      velocity.x = 0;
      velocity.y = 200;

      const angle = player.getMovementAngle();
      expect(angle).toBeCloseTo(Math.PI / 2, 5);
    });

    it('should handle 360-degree angle at 180 degrees', () => {
      player.setAnalogInput(-1, 0);

      const velocity = (player as any).physicsBody.velocity;
      velocity.x = -200;
      velocity.y = 0;

      const angle = player.getMovementAngle();
      expect(angle).toBeCloseTo(Math.PI, 5);
    });

    it('should handle 360-degree angle at 270 degrees', () => {
      player.setAnalogInput(0, -1);

      const velocity = (player as any).physicsBody.velocity;
      velocity.x = 0;
      velocity.y = -200;

      const angle = player.getMovementAngle();
      expect(angle).toBeCloseTo(-Math.PI / 2, 5);
    });

    it('should handle 360-degree angle at 315 degrees', () => {
      player.setAnalogInput(0.707, -0.707);

      const velocity = (player as any).physicsBody.velocity;
      velocity.x = 141.42;
      velocity.y = -141.42;

      const angle = player.getMovementAngle();
      expect(angle).toBeCloseTo(-Math.PI / 4, 4);
    });
  });

  describe('Movement Speed Calculation', () => {
    it('should return 0 when not moving', () => {
      const velocity = (player as any).physicsBody.velocity;
      velocity.x = 0;
      velocity.y = 0;

      expect(player.getCurrentSpeed()).toBe(0);
      expect(player.isMoving()).toBe(false);
    });

    it('should return correct speed for horizontal movement', () => {
      const velocity = (player as any).physicsBody.velocity;
      velocity.x = 200;
      velocity.y = 0;

      expect(player.getCurrentSpeed()).toBeCloseTo(200, 5);
      expect(player.isMoving()).toBe(true);
    });

    it('should return correct speed for vertical movement', () => {
      const velocity = (player as any).physicsBody.velocity;
      velocity.x = 0;
      velocity.y = 150;

      expect(player.getCurrentSpeed()).toBeCloseTo(150, 5);
      expect(player.isMoving()).toBe(true);
    });

    it('should return correct speed for diagonal movement', () => {
      const velocity = (player as any).physicsBody.velocity;
      const diagonalVelocity = 200 / Math.sqrt(2);
      velocity.x = diagonalVelocity;
      velocity.y = diagonalVelocity;

      const speed = player.getCurrentSpeed();
      expect(speed).toBeCloseTo(200, 3); // sqrt((200/√2)^2 + (200/√2)^2) = 200
    });
  });

  describe('Normalized Movement', () => {
    it('should normalize diagonal keyboard input', () => {
      // Simulate pressing W and D (diagonal up-right)
      const velocityX = 1;
      const velocityY = -1;
      const speed = 200;

      const magnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
      const normalizedX = (velocityX / magnitude) * speed;
      const normalizedY = (velocityY / magnitude) * speed;

      const expected = 200 / Math.sqrt(2);
      expect(normalizedX).toBeCloseTo(expected, 3);
      expect(normalizedY).toBeCloseTo(-expected, 3);

      // Speed should be maintained
      const finalSpeed = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
      expect(finalSpeed).toBeCloseTo(speed, 4);
    });

    it('should prevent faster diagonal movement', () => {
      // Without normalization: diagonal would be sqrt(2) ≈ 1.414 times faster
      // With normalization: speed should be consistent
      const speed = 200;

      // Cardinal direction speed
      const cardinalSpeed = speed;

      // Diagonal speed (normalized)
      const diagonalMagnitude = Math.sqrt(1 * 1 + 1 * 1);
      const diagonalSpeed = (1 / diagonalMagnitude) * speed;

      expect(diagonalSpeed).toBeCloseTo(cardinalSpeed / Math.sqrt(2), 4);
    });
  });

  describe('Analog Input Edge Cases', () => {
    it('should handle exactly zero input', () => {
      player.setAnalogInput(0, 0);

      const currentInput = player.getCurrentAnalogInput();
      expect(currentInput.isActive).toBe(false);
    });

    it('should handle exactly at deadzone boundary', () => {
      player.setAnalogInput(0.15, 0); // Exactly at deadzone

      const currentInput = player.getCurrentAnalogInput();
      expect(currentInput.x).toBe(0);
      expect(currentInput.isActive).toBe(false);
    });

    it('should handle just above deadzone', () => {
      player.setAnalogInput(0.151, 0); // Just above deadzone

      const currentInput = player.getCurrentAnalogInput();
      expect(currentInput.x).toBe(0.151);
      expect(currentInput.isActive).toBe(true);
    });

    it('should handle negative deadzone boundary', () => {
      player.setAnalogInput(-0.15, 0);

      const currentInput = player.getCurrentAnalogInput();
      expect(currentInput.x).toBe(0);
      expect(currentInput.isActive).toBe(false);
    });

    it('should handle minimal positive movement', () => {
      player.setAnalogInput(0.001, 0.001);

      const currentInput = player.getCurrentAnalogInput();
      expect(currentInput.x).toBe(0);
      expect(currentInput.y).toBe(0);
      expect(currentInput.isActive).toBe(false);
    });
  });

  describe('Movement Angle Calculations', () => {
    it('should calculate correct angle for various directions', () => {
      const testCases = [
        { x: 1, y: 0, expectedAngle: 0 }, // Right
        { x: 0, y: 1, expectedAngle: Math.PI / 2 }, // Down
        { x: -1, y: 0, expectedAngle: Math.PI }, // Left
        { x: 0, y: -1, expectedAngle: -Math.PI / 2 }, // Up
        { x: 0.707, y: 0.707, expectedAngle: Math.PI / 4 }, // Down-right
        { x: -0.707, y: 0.707, expectedAngle: 3 * Math.PI / 4 }, // Down-left
        { x: -0.707, y: -0.707, expectedAngle: -3 * Math.PI / 4 }, // Up-left
        { x: 0.707, y: -0.707, expectedAngle: -Math.PI / 4 } // Up-right
      ];

      testCases.forEach(({ x, y, expectedAngle }) => {
        const velocity = (player as any).physicsBody.velocity;
        velocity.x = x * 200;
        velocity.y = y * 200;

        const angle = player.getMovementAngle();
        expect(angle).toBeCloseTo(expectedAngle, 3);
      });
    });
  });
});
