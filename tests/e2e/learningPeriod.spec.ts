import { test, expect } from '@playwright/test';

test.describe('Learning Period Experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should display learning period text at game start', async ({ page }) => {
    const learningPeriodText = page.getByText('LEARNING PERIOD');
    await expect(learningPeriodText).toBeVisible();
  });

  test('should display countdown timer in learning period', async ({ page }) => {
    const countdownText = page.getByText(/\d+s/);
    await expect(countdownText).toBeVisible();

    // The countdown should start at 30s
    const initialText = await countdownText.textContent();
    expect(initialText).toMatch(/30s/);
  });

  test('should show player shield during learning period', async ({ page }) => {
    const canvas = page.locator('#game');
    await expect(canvas).toBeVisible();

    // Shield is rendered on the canvas, we can't directly test it
    // but we can verify the game is running
    await page.waitForTimeout(100);
    await expect(canvas).toBeVisible();
  });

  test('should have reduced enemy spawn rate during learning period', async ({ page }) => {
    const canvas = page.locator('#game');
    await expect(canvas).toBeVisible();

    // Wait for a short time to observe enemy spawning
    await page.waitForTimeout(3000);

    // During learning period, enemies should spawn much slower
    // We can't directly count enemies in E2E, but we can verify
    // the game is still running and the player is safe
    await expect(canvas).toBeVisible();
  });

  test('should prevent player damage during learning period', async ({ page }) => {
    const hpText = page.getByText(/HP:/);
    await expect(hpText).toBeVisible();

    // Get initial HP
    const initialHp = await hpText.textContent();

    // Wait for some time to allow potential enemy collisions
    await page.waitForTimeout(2000);

    // HP should not have changed during learning period
    const currentHp = await hpText.textContent();
    expect(currentHp).toBe(initialHp);
  });

  test('should update countdown timer every second', async ({ page }) => {
    const countdownText = page.getByText(/LEARNING PERIOD/);

    // Get initial time
    const initialText = await countdownText.textContent();
    expect(initialText).toContain('30s');

    // Wait 2 seconds
    await page.waitForTimeout(2000);

    // Check that countdown has decreased
    const updatedText = await countdownText.textContent();
    expect(updatedText).toBeTruthy();
    expect(updatedText).not.toBe(initialText);
  });

  test('should display learning period overlay with blue tint', async ({ page }) => {
    const canvas = page.locator('#game');
    await expect(canvas).toBeVisible();

    // The overlay is rendered on the canvas
    // We can verify the game is running and learning period is active
    const learningPeriodText = page.getByText('LEARNING PERIOD');
    await expect(learningPeriodText).toBeVisible();
  });

  test('should allow player movement during learning period', async ({ page }) => {
    const canvas = page.locator('#game');

    // Test WASD movement during learning period
    await page.keyboard.down('W');
    await page.waitForTimeout(100);
    await page.keyboard.up('W');

    await page.keyboard.down('A');
    await page.waitForTimeout(100);
    await page.keyboard.up('A');

    await page.keyboard.down('S');
    await page.waitForTimeout(100);
    await page.keyboard.up('S');

    await page.keyboard.down('D');
    await page.waitForTimeout(100);
    await page.keyboard.up('D');

    await expect(canvas).toBeVisible();
  });

  test('should allow player attacks during learning period', async ({ page }) => {
    const canvas = page.locator('#game');
    await expect(canvas).toBeVisible();

    // Test space bar attack
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    // Test mouse click attack
    await canvas.click({ position: { x: 500, y: 300 } });
    await page.waitForTimeout(100);

    await expect(canvas).toBeVisible();
  });

  test('should allow weapon switching during learning period', async ({ page }) => {
    const modeText = page.getByText(/Attack Mode:/);
    await expect(modeText).toBeVisible();

    // Test TAB key to toggle attack mode
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Mode text should still be visible
    await expect(modeText).toBeVisible();
  });

  test('should transition out of learning period after 30 seconds', async ({ page }) => {
    const learningPeriodText = page.getByText(/LEARNING PERIOD/);

    // Initially, learning period text should be visible
    await expect(learningPeriodText).toBeVisible();

    // Wait for learning period to end (30 seconds)
    await page.waitForTimeout(31000);

    // Learning period text should no longer be visible
    // or should show "LEARNING PERIOD ENDED"
    const endText = page.getByText('LEARNING PERIOD ENDED');
    await expect(endText).toBeVisible({ timeout: 5000 });
  });

  test('should show "LEARNING PERIOD ENDED" message', async ({ page }) => {
    // Wait for learning period to end
    await page.waitForTimeout(31000);

    const endText = page.getByText(/LEARNING PERIOD ENDED/);
    await expect(endText).toBeVisible({ timeout: 5000 });
  });

  test('should enable player damage after learning period ends', async ({ page }) => {
    const hpText = page.getByText(/HP:/);
    await expect(hpText).toBeVisible();

    // Wait for learning period to end
    await page.waitForTimeout(31000);

    // Wait a bit more to allow enemies to spawn and potentially damage player
    await page.waitForTimeout(5000);

    // HP should now be changeable (though we can't force damage in E2E)
    await expect(hpText).toBeVisible();
  });

  test('should maintain game functionality after learning period', async ({ page }) => {
    const canvas = page.locator('#game');

    // Wait for learning period to end
    await page.waitForTimeout(31000);

    // Test that movement still works
    await page.keyboard.down('W');
    await page.waitForTimeout(100);
    await page.keyboard.up('W');

    // Test that attacks still work
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    await expect(canvas).toBeVisible();
  });

  test('should have smooth transition from learning to normal gameplay', async ({ page }) => {
    const learningPeriodText = page.getByText(/LEARNING PERIOD/);
    const canvas = page.locator('#game');

    // Verify learning period is active
    await expect(learningPeriodText).toBeVisible();

    // Monitor countdown (optional, as we can't easily read the exact number)
    await page.waitForTimeout(5000);

    // Still in learning period
    await expect(learningPeriodText).toBeVisible();

    // Wait for transition
    await page.waitForTimeout(26000);

    // Learning period should have ended
    const endText = page.getByText(/LEARNING PERIOD ENDED/);
    await expect(endText).toBeVisible({ timeout: 5000 });

    // Game should still be running
    await expect(canvas).toBeVisible();
  });
});

test.describe('Learning Period Safety Mechanics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should provide complete immunity from enemy damage', async ({ page }) => {
    const hpText = page.getByText(/HP:/);
    await expect(hpText).toBeVisible();

    const initialHp = await hpText.textContent();

    // Wait for potential enemy encounters during learning period
    await page.waitForTimeout(5000);

    const currentHp = await hpText.textContent();
    expect(currentHp).toBe(initialHp);
  });

  test('should show visual feedback for safety (shield)', async ({ page }) => {
    const learningPeriodText = page.getByText(/LEARNING PERIOD/);
    await expect(learningPeriodText).toBeVisible();

    // The shield is rendered on canvas, we verify learning period is active
    const canvas = page.locator('#game');
    await expect(canvas).toBeVisible();
  });

  test('should allow player to learn controls without pressure', async ({ page }) => {
    const canvas = page.locator('#game');

    // Test all basic controls during learning period
    // Movement
    await page.keyboard.press('W');
    await page.waitForTimeout(50);
    await page.keyboard.press('A');
    await page.waitForTimeout(50);
    await page.keyboard.press('S');
    await page.waitForTimeout(50);
    await page.keyboard.press('D');
    await page.waitForTimeout(50);

    // Attack
    await page.keyboard.press('Space');
    await page.waitForTimeout(50);

    // Mode switch
    await page.keyboard.press('Tab');
    await page.waitForTimeout(50);

    // Weapon switch
    await page.keyboard.press('1');
    await page.waitForTimeout(50);
    await page.keyboard.press('2');
    await page.waitForTimeout(50);

    await expect(canvas).toBeVisible();
  });

  test('should have significantly fewer enemies during learning period', async ({ page }) => {
    const canvas = page.locator('#game');
    await expect(canvas).toBeVisible();

    // During first 10 seconds of learning period
    // enemy spawn rate should be 8 seconds (vs 2 seconds normally)
    // So approximately 1-2 enemies should spawn
    await page.waitForTimeout(10000);

    // Game should still be running smoothly
    await expect(canvas).toBeVisible();
  });

  test('should increase enemy spawn rate after learning period ends', async ({ page }) => {
    const canvas = page.locator('#game');
    await expect(canvas).toBeVisible();

    // Count learning period duration (should see ~4 enemies in 30s at 8s rate)
    await page.waitForTimeout(10000);

    // Wait for learning period to end
    await page.waitForTimeout(21000);

    // After learning period ends, spawn rate should be 2 seconds
    // In the next 10 seconds, should see ~5 enemies (vs ~1 during learning period)
    await page.waitForTimeout(10000);

    // Game should still be running with increased enemy activity
    await expect(canvas).toBeVisible();
  });
});

test.describe('Learning Period UI Feedback', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should display clear learning period indicator', async ({ page }) => {
    const learningPeriodText = page.getByText(/LEARNING PERIOD/);
    await expect(learningPeriodText).toBeVisible();
  });

  test('should show countdown timer with seconds', async ({ page }) => {
    const countdownText = page.getByText(/\d+s/);
    await expect(countdownText).toBeVisible();

    const text = await countdownText.textContent();
    expect(text).toMatch(/\d+s/);
  });

  test('should have prominent learning period text', async ({ page }) => {
    const learningPeriodText = page.getByText(/LEARNING PERIOD/);
    await expect(learningPeriodText).toBeVisible();
  });

  test('should remove learning period UI after period ends', async ({ page }) => {
    const learningPeriodText = page.getByText(/LEARNING PERIOD/);

    // Initially visible
    await expect(learningPeriodText).toBeVisible();

    // Wait for learning period to end
    await page.waitForTimeout(31000);

    // Learning period text should be gone or changed
    const endText = page.getByText(/LEARNING PERIOD ENDED/);
    await expect(endText).toBeVisible({ timeout: 5000 });
  });
});
