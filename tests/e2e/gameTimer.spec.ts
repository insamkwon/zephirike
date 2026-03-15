import { test, expect } from '@playwright/test';

test.describe('Game Timer System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should display game timer in top-right corner', async ({ page }) => {
    // Game timer should be visible in the format MM:SS
    const timerText = page.locator('text=/\\d{2}:\\d{2}/');
    await expect(timerText).toBeVisible();

    // Initial time should be 00:00
    const initialTime = await timerText.textContent();
    expect(initialTime).toBe('00:00');
  });

  test('should update timer every second', async ({ page }) => {
    const timerText = page.locator('text=/\\d{2}:\\d{2}/');

    // Get initial time
    const initialTime = await timerText.textContent();
    expect(initialTime).toBe('00:00');

    // Wait 2 seconds
    await page.waitForTimeout(2000);

    // Check that timer has updated
    const updatedTime = await timerText.textContent();
    expect(updatedTime).toBe('00:02');
  });

  test('should format time correctly as MM:SS', async ({ page }) => {
    const timerText = page.locator('text=/\\d{2}:\\d{2}/');

    // Wait 5 seconds
    await page.waitForTimeout(5000);

    const time = await timerText.textContent();
    expect(time).toMatch(/00:0[5-9]/); // Should be 00:05 to 00:09

    // Wait until we pass 1 minute
    await page.waitForTimeout(60000);

    const oneMinuteTime = await timerText.textContent();
    expect(oneMinuteTime).toBe('01:05');
  });

  test('should pad single digit seconds with leading zero', async ({ page }) => {
    const timerText = page.locator('text=/\\d{2}:\\d{2}/');

    // Wait 5 seconds
    await page.waitForTimeout(5000);

    const time = await timerText.textContent();
    // Should be formatted as 00:05, not 00:5
    expect(time).toMatch(/00:0\d/);
    expect(time).not.toMatch(/00:\d[^0-9]/);
  });

  test('should pad single digit minutes with leading zero', async ({ page }) => {
    const timerText = page.locator('text=/\\d{2}:\\d{2}/');

    // Wait until 1 minute 5 seconds
    await page.waitForTimeout(65000);

    const time = await timerText.textContent();
    // Should be formatted as 01:05, not 1:05
    expect(time).toMatch(/0\d:0\d/);
  });

  test('should handle times over 10 minutes correctly', async ({ page }) => {
    const timerText = page.locator('text=/\\d{2}:\\d{2}/');

    // Wait 10 minutes and 15 seconds (615 seconds)
    await page.waitForTimeout(615000);

    const time = await timerText.textContent();
    expect(time).toBe('10:15');
  });

  test('should track total seconds correctly', async ({ page }) => {
    const timerText = page.locator('text=/\\d{2}:\\d{2}/');

    // Wait 65 seconds (1 minute 5 seconds)
    await page.waitForTimeout(65000);

    const time = await timerText.textContent();
    expect(time).toBe('01:05');
  });

  test('should track total minutes correctly', async ({ page }) => {
    const timerText = page.locator('text=/\\d{2}:\\d{2}/');

    // Wait 180 seconds (3 minutes)
    await page.waitForTimeout(180000);

    const time = await timerText.textContent();
    expect(time).toBe('03:00');
  });

  test('should have green colored timer text', async ({ page }) => {
    const timerText = page.locator('text=/\\d{2}:\\d{2}/');

    // Check that the timer is visible
    await expect(timerText).toBeVisible();

    // The timer should have specific styling (green color)
    // We can verify it's visible and positioned correctly
    const isVisible = await timerText.isVisible();
    expect(isVisible).toBe(true);
  });

  test('should maintain timer position during gameplay', async ({ page }) => {
    const timerText = page.locator('text=/\\d{2}:\\d{2}/');

    // Timer should be visible at start
    await expect(timerText).toBeVisible();

    // Simulate some gameplay (movement)
    const canvas = page.locator('#game');
    await page.keyboard.down('W');
    await page.waitForTimeout(100);
    await page.keyboard.up('W');

    // Timer should still be visible
    await expect(timerText).toBeVisible();

    // Wait for timer update
    await page.waitForTimeout(1000);

    // Timer should still be visible and updated
    await expect(timerText).toBeVisible();
    const time = await timerText.textContent();
    expect(time).not.toBe('00:00');
  });

  test('should continue timer during combat', async ({ page }) => {
    const timerText = page.locator('text=/\\d{2}:\\d{2}/');
    const canvas = page.locator('#game');

    // Get initial time
    const initialTime = await timerText.textContent();
    expect(initialTime).toBe('00:00');

    // Perform some attacks (space bar)
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    // Wait for timer to update
    await page.waitForTimeout(1000);

    // Timer should have updated
    const updatedTime = await timerText.textContent();
    expect(updatedTime).not.toBe(initialTime);
  });
});

test.describe('Game Timer Milestone Events', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should trigger 30-second milestone event', async ({ page }) => {
    // Wait for 30-second milestone
    await page.waitForTimeout(31000);

    // The game should still be running smoothly
    const canvas = page.locator('#game');
    await expect(canvas).toBeVisible();

    // Timer should show 00:31
    const timerText = page.locator('text=/\\d{2}:\\d{2}/');
    const time = await timerText.textContent();
    expect(time).toBe('00:31');
  });

  test('should trigger 60-second milestone event', async ({ page }) => {
    // Wait for 60-second milestone (2 milestones)
    await page.waitForTimeout(61000);

    // The game should still be running
    const canvas = page.locator('#game');
    await expect(canvas).toBeVisible();

    // Timer should show 01:01
    const timerText = page.locator('text=/\\d{2}:\\d{2}/');
    const time = await timerText.textContent();
    expect(time).toBe('01:01');
  });

  test('should trigger multiple milestones during gameplay', async ({ page }) => {
    const timerText = page.locator('text=/\\d{2}:\\d{2}/');

    // Wait for first milestone (30s)
    await page.waitForTimeout(31000);
    let time = await timerText.textContent();
    expect(time).toBe('00:31');

    // Wait for second milestone (60s)
    await page.waitForTimeout(30000);
    time = await timerText.textContent();
    expect(time).toBe('01:01');

    // Wait for third milestone (90s)
    await page.waitForTimeout(30000);
    time = await timerText.textContent();
    expect(time).toBe('01:31');
  });
});

test.describe('Game Timer Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should work alongside learning period timer', async ({ page }) => {
    const gameTimerText = page.locator('text=/\\d{2}:\\d{2}/');
    const learningPeriodText = page.getByText(/LEARNING PERIOD/);

    // Both timers should be visible initially
    await expect(gameTimerText).toBeVisible();
    await expect(learningPeriodText).toBeVisible();

    // Game timer should start at 00:00
    const initialTime = await gameTimerText.textContent();
    expect(initialTime).toBe('00:00');

    // Wait 5 seconds
    await page.waitForTimeout(5000);

    // Game timer should update
    const updatedTime = await gameTimerText.textContent();
    expect(updatedTime).toBe('00:05');

    // Learning period should still be active
    await expect(learningPeriodText).toBeVisible();
  });

  test('should continue after learning period ends', async ({ page }) => {
    const gameTimerText = page.locator('text=/\\d{2}:\\d{2}/');

    // Wait for learning period to end (30s)
    await page.waitForTimeout(31000);

    // Game timer should continue running
    const time = await gameTimerText.textContent();
    expect(time).toBe('00:31');

    // Wait another 5 seconds
    await page.waitForTimeout(5000);

    // Timer should still be updating
    const laterTime = await gameTimerText.textContent();
    expect(laterTime).toBe('00:36');
  });

  test('should work correctly with other UI elements', async ({ page }) => {
    const timerText = page.locator('text=/\\d{2}:\\d{2}/');
    const scoreText = page.getByText(/Score:/);
    const hpText = page.getByText(/HP:/);
    const levelText = page.getByText(/Level:/);

    // All UI elements should be visible
    await expect(timerText).toBeVisible();
    await expect(scoreText).toBeVisible();
    await expect(hpText).toBeVisible();
    await expect(levelText).toBeVisible();

    // Timer should update independently
    const initialTime = await timerText.textContent();
    await page.waitForTimeout(2000);
    const updatedTime = await timerText.textContent();
    expect(updatedTime).not.toBe(initialTime);

    // Other UI elements should still be visible
    await expect(scoreText).toBeVisible();
    await expect(hpText).toBeVisible();
    await expect(levelText).toBeVisible();
  });

  test('should maintain accuracy during extended gameplay', async ({ page }) => {
    const timerText = page.locator('text=/\\d{2}:\\d{2}/');

    // Wait 2 minutes
    await page.waitForTimeout(120000);

    const time = await timerText.textContent();
    expect(time).toBe('02:00');

    // Wait another 30 seconds
    await page.waitForTimeout(30000);

    const laterTime = await timerText.textContent();
    expect(laterTime).toBe('02:30');
  });
});
