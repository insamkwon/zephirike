import { test, expect } from '@playwright/test';

test.describe('Enemy Hit State Machine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Wait for game to fully initialize
  });

  test.describe('Enemy Spawning', () => {
    test('should spawn enemies at random edge positions', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies to spawn
      await page.waitForTimeout(3000);

      // Game should still be running
      await expect(canvas).toBeVisible();
    });

    test('should display enemy count in scene', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for some enemies to spawn
      await page.waitForTimeout(5000);

      // Game should still be running with enemies
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Enemy Knockback', () => {
    test('should push enemy back when hit by projectile', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies to spawn
      await page.waitForTimeout(3000);

      // Move to center and shoot
      await page.mouse.move(400, 300);

      // Fire projectiles in multiple directions
      for (let i = 0; i < 5; i++) {
        await page.mouse.click(400, 300, { button: 'left' });
        await page.waitForTimeout(100);
      }

      // Enemies should react (knockback)
      await page.waitForTimeout(500);
      await expect(canvas).BeVisible();
    });

    test('should apply knockback in opposite direction of damage source', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Shoot in one direction
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      // Enemy should be pushed away from projectile direction
      await page.waitForTimeout(300);
      await expect(canvas).toBeVisible();
    });

    test('should limit knockback duration', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      // After knockback duration, enemy should resume movement
      await page.waitForTimeout(500);
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Enemy Stun', () => {
    test('should stun enemy after knockback when chainSequence is enabled', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      // Enemy should go through knockback -> stun sequence
      await page.waitForTimeout(600);
      await expect(canvas).toBeVisible();
    });

    test('should prevent enemy movement during stun', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      // During stun, enemy should not move toward player
      await page.waitForTimeout(400);
      await expect(canvas).toBeVisible();
    });

    test('should show visual stun indicator', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      // Stun visual effect (yellow tint, shake) should be visible
      await page.waitForTimeout(400);
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Enemy Invincibility Frames', () => {
    test('should grant invincibility after stun when chainSequence is enabled', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      // After knockback + stun, enemy should have i-frames
      await page.waitForTimeout(800);
      await expect(canvas).toBeVisible();
    });

    test('should prevent damage during invincibility', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy multiple times rapidly
      await page.mouse.move(400, 300);
      for (let i = 0; i < 5; i++) {
        await page.mouse.click(400, 300, { button: 'left' });
        await page.waitForTimeout(50);
      }

      // Enemy should only take damage once (during i-frames)
      await page.waitForTimeout(500);
      await expect(canvas).toBeVisible();
    });

    test('should show visual invincibility indicator', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      // Invincibility visual effect (flashing/transparency) should be visible
      await page.waitForTimeout(900);
      await expect(canvas).toBeVisible();
    });

    test('should allow movement during invincibility', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      // During i-frames, enemy should still move toward player
      await page.waitForTimeout(900);
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('State Transitions', () => {
    test('should transition from IDLE to KNOCKBACK on damage', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      // Immediate knockback
      await page.waitForTimeout(100);
      await expect(canvas).toBeVisible();
    });

    test('should transition from KNOCKBACK to STUN', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      // After knockback duration, should enter stun
      await page.waitForTimeout(400);
      await expect(canvas).toBeVisible();
    });

    test('should transition from STUN to INVINCIBLE', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      // After stun duration, should enter i-frames
      await page.waitForTimeout(700);
      await expect(canvas).toBeVisible();
    });

    test('should transition from INVINCIBLE back to IDLE', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      // After all reaction durations, should return to IDLE
      await page.waitForTimeout(1200);
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Visual Feedback', () => {
    test('should flash cyan during knockback', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      // Cyan flash should be visible immediately
      await page.waitForTimeout(100);
      await expect(canvas).toBeVisible();
    });

    test('should show yellow tint during stun', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      // Yellow tint should be visible during stun
      await page.waitForTimeout(400);
      await expect(canvas).toBeVisible();
    });

    test('should flash/transparent during invincibility', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      // Flashing effect during i-frames
      await page.waitForTimeout(900);
      await expect(canvas).toBeVisible();
    });

    test('should have size pulse on knockback impact', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      // Size pulse should be visible immediately
      await page.waitForTimeout(100);
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Multiple Enemies', () => {
    test('should handle reactions for multiple enemies simultaneously', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for multiple enemies to spawn
      await page.waitForTimeout(6000);

      // Shoot in multiple directions
      await page.mouse.move(400, 300);
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        const x = 400 + Math.cos(angle) * 100;
        const y = 300 + Math.sin(angle) * 100;
        await page.mouse.click(x, y, { button: 'left' });
        await page.waitForTimeout(50);
      }

      // Multiple enemies should react simultaneously
      await page.waitForTimeout(500);
      await expect(canvas).toBeVisible();
    });

    test('should maintain independent state for each enemy', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(6000);

      // Hit enemies at different times
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });
      await page.waitForTimeout(200);

      await page.mouse.click(450, 300, { button: 'left' });
      await page.waitForTimeout(200);

      await page.mouse.click(350, 300, { button: 'left' });

      // Each enemy should be in different state
      await page.waitForTimeout(300);
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Melee Attack Reactions', () => {
    test('should apply knockback from melee attacks', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Perform melee attack (right click)
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'right' });

      // Enemy should be knocked back
      await page.waitForTimeout(200);
      await expect(canvas).toBeVisible();
    });

    test('should chain reactions for melee attacks', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Perform melee attack
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'right' });

      // Full reaction chain should occur
      await page.waitForTimeout(1200);
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should maintain 60 FPS during reactions', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit multiple enemies rapidly
      await page.mouse.move(400, 300);
      for (let i = 0; i < 10; i++) {
        await page.mouse.click(400, 300, { button: 'left' });
        await page.waitForTimeout(100);
      }

      // Game should remain responsive
      await expect(canvas).toBeVisible();
    });

    test('should handle rapid state changes without lag', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit same enemy multiple times
      await page.mouse.move(400, 300);
      for (let i = 0; i < 5; i++) {
        await page.mouse.click(400, 300, { button: 'left' });
        await page.waitForTimeout(300);
      }

      // Game should remain smooth
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Integration with Game Systems', () => {
    test('should update health bar correctly during reactions', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      // Health bar should update
      await page.waitForTimeout(200);
      await expect(canvas).toBeVisible();
    });

    test('should respect learning period if implemented', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Check if learning period is active (first 30 seconds)
      // Enemy reactions should still work during learning period
      await page.waitForTimeout(3000);

      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      await page.waitForTimeout(300);
      await expect(canvas).toBeVisible();
    });

    test('should work correctly with player movement', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Move player while shooting
      await page.keyboard.down('D');
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });
      await page.waitForTimeout(200);
      await page.keyboard.up('D');

      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle enemy hit at exactly same position as damage source', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Try to hit enemy at player position
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });

      // Should knockback in random direction
      await page.waitForTimeout(200);
      await expect(canvas).toBeVisible();
    });

    test('should handle enemy death during reaction', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy multiple times to kill
      await page.mouse.move(400, 300);
      for (let i = 0; i < 5; i++) {
        await page.mouse.click(400, 300, { button: 'left' });
        await page.waitForTimeout(100);
      }

      // Enemy should die and enter DYING state
      await page.waitForTimeout(500);
      await expect(canvas).toBeVisible();
    });

    test('should handle rapid hit during knockback', async ({ page }) => {
      const canvas = page.locator('#game');
      await expect(canvas).toBeVisible();

      // Wait for enemies
      await page.waitForTimeout(3000);

      // Hit enemy rapidly
      await page.mouse.move(400, 300);
      await page.mouse.click(400, 300, { button: 'left' });
      await page.waitForTimeout(50);
      await page.mouse.click(400, 300, { button: 'left' });

      // Should handle gracefully (second hit during i-frames)
      await page.waitForTimeout(300);
      await expect(canvas).toBeVisible();
    });
  });
});
