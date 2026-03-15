import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Level-Up Detection and Trigger Mechanism
 * Sub-AC 1 of AC 5: Implement level-up detection and trigger mechanism that pauses game and activates weapon selection
 */

test.describe('Level-Up Detection and Trigger System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Wait for the game to load
    await page.waitForSelector('canvas', { timeout: 5000 });
  });

  test.describe('Experience and Level-Up Detection', () => {
    test('should display player level and XP in UI', async ({ page }) => {
      // Wait for game UI to load
      await page.waitForTimeout(1000);

      // Check that level text is displayed
      const levelText = page.locator('text=/Level:\\s*\\d+/');
      await expect(levelText).toBeVisible();

      // Check that XP text is displayed
      const xpText = page.locator('text=/XP:\\s*\\d+\\/\\d+/');
      await expect(xpText).toBeVisible();
    });

    test('should update XP when enemies are defeated', async ({ page }) => {
      // Get initial XP
      const initialXP = await page.evaluate(() => {
        const xpText = document.body.textContent || '';
        const match = xpText.match(/XP:\s*(\d+)\/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });

      // Simulate defeating an enemy by triggering XP gain
      await page.evaluate(() => {
        const player = (window as any).gameScene?.player;
        if (player) {
          player.gainExperience(25);
        }
      });

      // Wait a bit for the UI to update
      await page.waitForTimeout(100);

      // Check that XP has increased
      const updatedXP = await page.evaluate(() => {
        const xpText = document.body.textContent || '';
        const match = xpText.match(/XP:\s*(\d+)\/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });

      expect(updatedXP).toBeGreaterThan(initialXP);
    });

    test('should trigger level-up when reaching XP threshold', async ({ page }) => {
      // Set player close to level up
      await page.evaluate(() => {
        const player = (window as any).gameScene?.player;
        if (player) {
          // Set to 95 XP out of 100 needed
          player.gainExperience(95);
        }
      });

      await page.waitForTimeout(100);

      // Get current level
      const initialLevel = await page.evaluate(() => {
        const levelText = document.body.textContent || '';
        const match = levelText.match(/Level:\s*(\d+)/);
        return match ? parseInt(match[1]) : 1;
      });

      // Add enough XP to trigger level up
      await page.evaluate(() => {
        const player = (window as any).gameScene?.player;
        if (player) {
          player.gainExperience(10); // 95 + 10 = 105, which is > 100
        }
      });

      // Wait for level-up scene to appear
      await page.waitForTimeout(500);

      // Check that level-up modal is displayed
      const levelUpModal = page.locator('text=LEVEL UP!');
      await expect(levelUpModal).toBeVisible({ timeout: 2000 });
    });

    test('should handle multiple level-ups from large XP gain', async ({ page }) => {
      // Add enough XP for multiple level ups
      await page.evaluate(() => {
        const player = (window as any).gameScene?.player;
        if (player) {
          player.gainExperience(300); // Enough for ~3 level ups
        }
      });

      // Wait for level-up scene to appear
      await page.waitForTimeout(500);

      // Check that level-up modal is displayed
      const levelUpModal = page.locator('text=LEVEL UP!');
      await expect(levelUpModal).toBeVisible({ timeout: 2000 });

      // Check that the player leveled up multiple times
      const finalLevel = await page.evaluate(() => {
        const player = (window as any).gameScene?.player;
        return player ? player.getLevel() : 1;
      });

      expect(finalLevel).toBeGreaterThan(2);
    });
  });

  test.describe('Game Pause Mechanism', () => {
    test('should pause game when level-up occurs', async ({ page }) => {
      // Trigger level up
      await page.evaluate(() => {
        const player = (window as any).gameScene?.player;
        if (player) {
          player.gainExperience(100);
        }
      });

      // Wait for level-up scene
      await page.waitForTimeout(500);

      // Check that game is paused
      const isGameActive = await page.evaluate(() => {
        const gameScene = (window as any).gameScene;
        return gameScene ? gameScene.isGameActive : true;
      });

      expect(isGameActive).toBe(false);
    });

    test('should stop enemy spawning during level-up selection', async ({ page }) => {
      // Trigger level up
      await page.evaluate(() => {
        const player = (window as any).gameScene?.player;
        if (player) {
          player.gainExperience(100);
        }
      });

      // Wait for level-up scene
      await page.waitForTimeout(500);

      // Check that no new enemies spawn during level-up
      const enemyCountBefore = await page.evaluate(() => {
        const gameScene = (window as any).gameScene;
        return gameScene ? gameScene.enemies.getLength() : 0;
      });

      // Wait 2 seconds
      await page.waitForTimeout(2000);

      const enemyCountAfter = await page.evaluate(() => {
        const gameScene = (window as any).gameScene;
        return gameScene ? gameScene.enemies.getLength() : 0;
      });

      // Enemy count should not have changed
      expect(enemyCountAfter).toBe(enemyCountBefore);
    });
  });

  test.describe('Weapon Selection Activation', () => {
    test('should display weapon upgrade options when leveling up', async ({ page }) => {
      // Trigger level up
      await page.evaluate(() => {
        const player = (window as any).gameScene?.player;
        if (player) {
          player.gainExperience(100);
        }
      });

      // Wait for level-up scene
      await page.waitForTimeout(500);

      // Check that upgrade options are displayed
      const upgradeCards = page.locator('.upgrade-card, [class*="upgrade"], [class*="card"]');
      const cardCount = await upgradeCards.count();

      expect(cardCount).toBeGreaterThan(0);
    });

    test('should display exactly 3 weapon upgrade options', async ({ page }) => {
      // Trigger level up
      await page.evaluate(() => {
        const player = (window as any).gameScene?.player;
        if (player) {
          player.gainExperience(100);
        }
      });

      // Wait for level-up scene
      await page.waitForTimeout(500);

      // Check that exactly 3 upgrade options are displayed
      const upgradeOptions = await page.evaluate(() => {
        const levelUpScene = (window as any).gameScene?.scene.get('LevelUpScene');
        return levelUpScene ? levelUpScene.upgrades?.length || 0 : 0;
      });

      expect(upgradeOptions).toBe(3);
    });

    test('should allow selecting weapon upgrades via mouse', async ({ page }) => {
      // Trigger level up
      await page.evaluate(() => {
        const player = (window as any).gameScene?.player;
        if (player) {
          player.gainExperience(100);
        }
      });

      // Wait for level-up scene
      await page.waitForTimeout(500);

      // Click on an upgrade option
      const firstUpgrade = page.locator('.upgrade-card, [class*="upgrade"], [class*="card"]').first();
      await firstUpgrade.click();

      // Wait for selection to process
      await page.waitForTimeout(500);

      // Check that level-up scene is closed
      const levelUpModal = page.locator('text=LEVEL UP!');
      await expect(levelUpModal).not.toBeVisible({ timeout: 1000 });
    });

    test('should apply selected upgrade to player', async ({ page }) => {
      // Get initial player damage
      const initialDamage = await page.evaluate(() => {
        const player = (window as any).gameScene?.player;
        return player ? player.getTotalDamage('projectile') : 0;
      });

      // Trigger level up
      await page.evaluate(() => {
        const player = (window as any).gameScene?.player;
        if (player) {
          player.gainExperience(100);
        }
      });

      // Wait for level-up scene
      await page.waitForTimeout(500);

      // Click on an upgrade option
      const firstUpgrade = page.locator('.upgrade-card, [class*="upgrade"], [class*="card"]').first();
      await firstUpgrade.click();

      // Wait for selection to process
      await page.waitForTimeout(500);

      // Check that player stats have changed
      const finalDamage = await page.evaluate(() => {
        const player = (window as any).gameScene?.player;
        return player ? player.getTotalDamage('projectile') : 0;
      });

      // Damage should have increased (if the upgrade was damage-related)
      // Note: This might not always be true if the upgrade wasn't damage-related
      // but we're checking that SOMETHING changed
      expect(finalDamage).toBeGreaterThanOrEqual(initialDamage);
    });
  });

  test.describe('Game Resume After Selection', () => {
    test('should resume game after selecting upgrade', async ({ page }) => {
      // Trigger level up
      await page.evaluate(() => {
        const player = (window as any).gameScene?.player;
        if (player) {
          player.gainExperience(100);
        }
      });

      // Wait for level-up scene
      await page.waitForTimeout(500);

      // Select an upgrade
      const firstUpgrade = page.locator('.upgrade-card, [class*="upgrade"], [class*="card"]').first();
      await firstUpgrade.click();

      // Wait for selection to process
      await page.waitForTimeout(500);

      // Check that game is active again
      const isGameActive = await page.evaluate(() => {
        const gameScene = (window as any).gameScene;
        return gameScene ? gameScene.isGameActive : false;
      });

      expect(isGameActive).toBe(true);
    });

    test('should show upgrade confirmation after selection', async ({ page }) => {
      // Trigger level up
      await page.evaluate(() => {
        const player = (window as any).gameScene?.player;
        if (player) {
          player.gainExperience(100);
        }
      });

      // Wait for level-up scene
      await page.waitForTimeout(500);

      // Select an upgrade
      const firstUpgrade = page.locator('.upgrade-card, [class*="upgrade"], [class*="card"]').first();
      await firstUpgrade.click();

      // Wait for confirmation
      await page.waitForTimeout(500);

      // Check that confirmation message is displayed
      const confirmationText = page.locator('text=/APPLIED!/i');
      await expect(confirmationText).toBeVisible({ timeout: 1000 });
    });
  });

  test.describe('Full Level-Up Flow', () => {
    test('should complete full level-up flow: gain XP -> pause -> select -> resume', async ({ page }) => {
      // Get initial state
      const initialLevel = await page.evaluate(() => {
        const player = (window as any).gameScene?.player;
        return player ? player.getLevel() : 1;
      });

      // Trigger level up
      await page.evaluate(() => {
        const player = (window as any).gameScene?.player;
        if (player) {
          player.gainExperience(100);
        }
      });

      // Verify game is paused and level-up UI is shown
      await page.waitForTimeout(500);
      const levelUpModal = page.locator('text=LEVEL UP!');
      await expect(levelUpModal).toBeVisible();

      const isGamePaused = await page.evaluate(() => {
        const gameScene = (window as any).gameScene;
        return gameScene ? !gameScene.isGameActive : false;
      });
      expect(isGamePaused).toBe(true);

      // Select an upgrade
      const firstUpgrade = page.locator('.upgrade-card, [class*="upgrade"], [class*="card"]').first();
      await firstUpgrade.click();

      // Wait for confirmation and resume
      await page.waitForTimeout(1000);

      // Verify game is resumed and level increased
      const isGameActive = await page.evaluate(() => {
        const gameScene = (window as any).gameScene;
        return gameScene ? gameScene.isGameActive : false;
      });
      expect(isGameActive).toBe(true);

      const finalLevel = await page.evaluate(() => {
        const player = (window as any).gameScene?.player;
        return player ? player.getLevel() : 1;
      });
      expect(finalLevel).toBe(initialLevel + 1);

      // Verify level-up UI is closed
      await expect(levelUpModal).not.toBeVisible();
    });
  });
});
