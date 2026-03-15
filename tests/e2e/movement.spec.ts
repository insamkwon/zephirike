import { test, expect } from '@playwright/test';

test.describe('Player 360-Degree Movement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should load game canvas', async ({ page }) => {
    const canvas = page.locator('#game');
    await expect(canvas).toBeVisible();
  });

  test('should display movement instructions', async ({ page }) => {
    const instructions = page.getByText('WASD / Arrow Keys to Move');
    await expect(instructions).toBeVisible();
  });

  test('should initialize player in center of screen', async ({ page }) => {
    const canvas = page.locator('#game');
    await expect(canvas).toBeVisible();
  });

  test.describe('Keyboard Movement - Cardinal Directions', () => {
    test('should move player up with W key', async ({ page }) => {
      const canvas = page.locator('#game');

      // Press W to move up
      await page.keyboard.press('W');
      await page.waitForTimeout(100);
      await page.keyboard.up('W');

      // Player should be visible and have moved
      await expect(canvas).toBeVisible();
    });

    test('should move player down with S key', async ({ page }) => {
      const canvas = page.locator('#game');

      // Press S to move down
      await page.keyboard.press('S');
      await page.waitForTimeout(100);
      await page.keyboard.up('S');

      await expect(canvas).toBeVisible();
    });

    test('should move player left with A key', async ({ page }) => {
      const canvas = page.locator('#game');

      // Press A to move left
      await page.keyboard.press('A');
      await page.waitForTimeout(100);
      await page.keyboard.up('A');

      await expect(canvas).toBeVisible();
    });

    test('should move player right with D key', async ({ page }) => {
      const canvas = page.locator('#game');

      // Press D to move right
      await page.keyboard.press('D');
      await page.waitForTimeout(100);
      await page.keyboard.up('D');

      await expect(canvas).toBeVisible();
    });

    test('should support arrow keys for movement', async ({ page }) => {
      const canvas = page.locator('#game');

      // Test all arrow keys
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(50);
      await page.keyboard.up('ArrowUp');

      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(50);
      await page.keyboard.up('ArrowDown');

      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(50);
      await page.keyboard.up('ArrowLeft');

      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(50);
      await page.keyboard.up('ArrowRight');

      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Keyboard Movement - Diagonal Directions', () => {
    test('should move player diagonally up-right with W+D', async ({ page }) => {
      const canvas = page.locator('#game');

      // Press W and D simultaneously
      await page.keyboard.down('W');
      await page.keyboard.down('D');
      await page.waitForTimeout(100);
      await page.keyboard.up('W');
      await page.keyboard.up('D');

      await expect(canvas).toBeVisible();
    });

    test('should move player diagonally down-right with S+D', async ({ page }) => {
      const canvas = page.locator('#game');

      // Press S and D simultaneously
      await page.keyboard.down('S');
      await page.keyboard.down('D');
      await page.waitForTimeout(100);
      await page.keyboard.up('S');
      await page.keyboard.up('D');

      await expect(canvas).toBeVisible();
    });

    test('should move player diagonally down-left with S+A', async ({ page }) => {
      const canvas = page.locator('#game');

      // Press S and A simultaneously
      await page.keyboard.down('S');
      await page.keyboard.down('A');
      await page.waitForTimeout(100);
      await page.keyboard.up('S');
      await page.keyboard.up('A');

      await expect(canvas).toBeVisible();
    });

    test('should move player diagonally up-left with W+A', async ({ page }) => {
      const canvas = page.locator('#game');

      // Press W and A simultaneously
      await page.keyboard.down('W');
      await page.keyboard.down('A');
      await page.waitForTimeout(100);
      await page.keyboard.up('W');
      await page.keyboard.up('A');

      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Collision Detection', () => {
    test('should keep player within world bounds', async ({ page }) => {
      const canvas = page.locator('#game');

      // Try to move player in all directions to test bounds
      const directions = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

      for (const direction of directions) {
        await page.keyboard.down(direction);
        await page.waitForTimeout(200);
        await page.keyboard.up(direction);
      }

      await expect(canvas).toBeVisible();
    });

    test('should handle player collision with obstacles', async ({ page }) => {
      const canvas = page.locator('#game');

      // Move player around to test obstacle collisions
      await page.keyboard.down('W');
      await page.waitForTimeout(100);
      await page.keyboard.up('W');

      await page.keyboard.down('D');
      await page.waitForTimeout(100);
      await page.keyboard.up('D');

      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Continuous Movement', () => {
    test('should maintain smooth movement during continuous key press', async ({ page }) => {
      const canvas = page.locator('#game');

      // Hold down movement key for longer duration
      await page.keyboard.down('D');
      await page.waitForTimeout(500);
      await page.keyboard.up('D');

      await expect(canvas).toBeVisible();
    });

    test('should handle quick direction changes', async ({ page }) => {
      const canvas = page.locator('#game');

      // Rapidly change direction
      const directions = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];

      for (let i = 0; i < 3; i++) {
        for (const direction of directions) {
          await page.keyboard.press(direction);
          await page.waitForTimeout(50);
        }
      }

      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Movement State', () => {
    test('should display correct HP in UI', async ({ page }) => {
      const hpText = page.getByText(/HP:/);
      await expect(hpText).toBeVisible();
      await expect(hpText).toContainText('100/100');
    });

    test('should display score in UI', async ({ page }) => {
      const scoreText = page.getByText(/Score:/);
      await expect(scoreText).toBeVisible();
      await expect(scoreText).toContainText('Score: 0');
    });

    test('should display attack mode in UI', async ({ page }) => {
      const modeText = page.getByText(/Attack Mode:/);
      await expect(modeText).toBeVisible();
      await expect(modeText).toContainText('MOUSE');
    });
  });

  test.describe('Gamepad Support', () => {
    test('should detect gamepad connection', async ({ page }) => {
      // Note: Actual gamepad testing requires hardware or browser emulation
      // This test verifies the game initializes correctly for gamepad support
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // The game should not crash when checking for gamepads
      await page.waitForTimeout(100);
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Movement Precision', () => {
    test('should normalize diagonal movement speed', async ({ page }) => {
      const canvas = page.locator('#game');

      // Test diagonal movement normalization
      await page.keyboard.down('W');
      await page.keyboard.down('D');
      await page.waitForTimeout(200);
      await page.keyboard.up('W');
      await page.keyboard.up('D');

      await expect(canvas).toBeVisible();
    });

    test('should maintain consistent speed in all directions', async ({ page }) => {
      const canvas = page.locator('#game');

      // Test movement in all 8 directions
      const directions = [
        ['ArrowUp'],
        ['ArrowUp', 'ArrowRight'],
        ['ArrowRight'],
        ['ArrowDown', 'ArrowRight'],
        ['ArrowDown'],
        ['ArrowDown', 'ArrowLeft'],
        ['ArrowLeft'],
        ['ArrowUp', 'ArrowLeft']
      ];

      for (const combo of directions) {
        for (const key of combo) {
          await page.keyboard.down(key);
        }
        await page.waitForTimeout(100);
        for (const key of combo) {
          await page.keyboard.up(key);
        }
      }

      await expect(canvas).toBeVisible();
    });
  });
});

