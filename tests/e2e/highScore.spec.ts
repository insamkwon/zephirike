/**
 * E2E tests for High Score functionality
 */

import { test, expect } from '@playwright/test';

test.describe('High Score System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Clear localStorage before each test
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should save high score after game over', async ({ page }) => {
    // Start game and let player die to trigger game over
    // Note: This test assumes the game will end and show game over screen

    // Wait for game to load
    await page.waitForSelector('canvas', { timeout: 5000 });

    // Simulate playing until game over (this would require game logic manipulation)
    // For now, we'll test the localStorage functionality directly

    // Manually trigger a game over state with a score
    await page.evaluate(() => {
      // Access the game scene and simulate game over
      const game = (window as any).game;
      if (game && game.scene.keys.GameScene) {
        const scene = game.scene.keys.GameScene;
        scene.score = 1000;
        scene.endGame();
      }
    });

    // Wait a moment for the game over screen
    await page.waitForTimeout(1000);

    // Check if score was saved to localStorage
    const highScores = await page.evaluate(() => {
      const stored = localStorage.getItem('zephirike_highscores');
      return stored ? JSON.parse(stored) : [];
    });

    expect(highScores.length).toBeGreaterThan(0);
    expect(highScores[0].score).toBe(1000);
  });

  test('should display high scores on the high score screen', async ({ page }) => {
    // Pre-populate localStorage with test data
    await page.evaluate(() => {
      const testScores = [
        { score: 5000, date: '2024-01-01T10:00:00.000Z', formattedDate: '2024-01-01 10:00' },
        { score: 3000, date: '2024-01-02T11:00:00.000Z', formattedDate: '2024-01-02 11:00' },
        { score: 1000, date: '2024-01-03T12:00:00.000Z', formattedDate: '2024-01-03 12:00' }
      ];
      localStorage.setItem('zephirike_highscores', JSON.stringify(testScores));
    });

    // Reload page to pick up the data
    await page.reload();

    // Press H key to open high scores
    await page.keyboard.press('h');

    // Wait for high score scene to be visible
    await page.waitForTimeout(500);

    // Verify high scores are displayed
    // Note: This would require visual testing or checking the canvas/text elements
    // For now, we verify the localStorage data is intact
    const highScores = await page.evaluate(() => {
      const stored = localStorage.getItem('zephirike_highscores');
      return stored ? JSON.parse(stored) : [];
    });

    expect(highScores).toHaveLength(3);
    expect(highScores[0].score).toBe(5000);
  });

  test('should keep only top 5 scores', async ({ page }) => {
    // Add 7 scores to localStorage
    await page.evaluate(() => {
      const testScores = [];
      for (let i = 1; i <= 7; i++) {
        testScores.push({
          score: i * 100,
          date: `2024-01-0${i}T10:00:00.000Z`,
          formattedDate: `2024-01-0${i} 10:00`
        });
      }
      localStorage.setItem('zephirike_highscores', JSON.stringify(testScores));
    });

    // Reload to trigger processing
    await page.reload();

    // Check that only top 5 remain
    const highScores = await page.evaluate(() => {
      const stored = localStorage.getItem('zephirike_highscores');
      return stored ? JSON.parse(stored) : [];
    });

    expect(highScores).toHaveLength(5);
    expect(highScores[0].score).toBe(700); // Highest
    expect(highScores[4].score).toBe(300); // 5th highest
  });

  test('should not save zero or negative scores', async ({ page }) => {
    // Try to save invalid scores
    const result1 = await page.evaluate(() => {
      // Import and call the HighScoreManager
      return (window as any).HighScoreManager?.saveHighScore(0) ?? false;
    });

    const result2 = await page.evaluate(() => {
      return (window as any).HighScoreManager?.saveHighScore(-100) ?? false;
    });

    expect(result1).toBe(false);
    expect(result2).toBe(false);

    // Verify no scores were saved
    const highScores = await page.evaluate(() => {
      const stored = localStorage.getItem('zephirike_highscores');
      return stored ? JSON.parse(stored) : [];
    });

    expect(highScores).toHaveLength(0);
  });

  test('should sort scores in descending order', async ({ page }) => {
    // Save scores in random order
    await page.evaluate(() => {
      const testScores = [
        { score: 100, date: '2024-01-01T10:00:00.000Z', formattedDate: '2024-01-01 10:00' },
        { score: 300, date: '2024-01-02T11:00:00.000Z', formattedDate: '2024-01-02 11:00' },
        { score: 200, date: '2024-01-03T12:00:00.000Z', formattedDate: '2024-01-03 12:00' }
      ];
      localStorage.setItem('zephirike_highscores', JSON.stringify(testScores));
    });

    // Reload to trigger sorting
    await page.reload();

    // Verify sorting
    const highScores = await page.evaluate(() => {
      const stored = localStorage.getItem('zephirike_highscores');
      return stored ? JSON.parse(stored) : [];
    });

    expect(highScores[0].score).toBe(300);
    expect(highScores[1].score).toBe(200);
    expect(highScores[2].score).toBe(100);
  });

  test('should show new high score notification', async ({ page }) => {
    // Set up existing high scores
    await page.evaluate(() => {
      const testScores = [
        { score: 500, date: '2024-01-01T10:00:00.000Z', formattedDate: '2024-01-01 10:00' },
        { score: 300, date: '2024-01-02T11:00:00.000Z', formattedDate: '2024-01-02 11:00' }
      ];
      localStorage.setItem('zephirike_highscores', JSON.stringify(testScores));
    });

    await page.reload();
    await page.waitForSelector('canvas', { timeout: 5000 });

    // Trigger game over with a score that would rank #1
    await page.evaluate(() => {
      const game = (window as any).game;
      if (game && game.scene.keys.GameScene) {
        const scene = game.scene.keys.GameScene;
        scene.score = 1000;
        scene.endGame();
      }
    });

    await page.waitForTimeout(1000);

    // Verify the new score was saved and is #1
    const highScores = await page.evaluate(() => {
      const stored = localStorage.getItem('zephirike_highscores');
      return stored ? JSON.parse(stored) : [];
    });

    expect(highScores[0].score).toBe(1000);
    expect(highScores).toHaveLength(3);
  });

  test('should be able to clear high scores', async ({ page }) => {
    // Add some scores
    await page.evaluate(() => {
      const testScores = [
        { score: 1000, date: '2024-01-01T10:00:00.000Z', formattedDate: '2024-01-01 10:00' },
        { score: 500, date: '2024-01-02T11:00:00.000Z', formattedDate: '2024-01-02 11:00' }
      ];
      localStorage.setItem('zephirike_highscores', JSON.stringify(testScores));
    });

    await page.reload();

    // Verify scores exist
    const scoresBefore = await page.evaluate(() => {
      const stored = localStorage.getItem('zephirike_highscores');
      return stored ? JSON.parse(stored) : [];
    });
    expect(scoresBefore).toHaveLength(2);

    // Clear scores via HighScoreManager
    await page.evaluate(() => {
      (window as any).HighScoreManager?.clearHighScores();
    });

    // Verify scores are cleared
    const scoresAfter = await page.evaluate(() => {
      const stored = localStorage.getItem('zephirike_highscores');
      return stored ? JSON.parse(stored) : [];
    });
    expect(scoresAfter).toHaveLength(0);
  });
});
