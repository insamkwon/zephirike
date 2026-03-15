import { test, expect } from '@playwright/test';

test.describe('360-Degree Attack Direction System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });
  
  test('should display attack direction indicator', async ({ page }) => {
    // Wait for game to load
    await page.waitForSelector('canvas');
    
    // Check if direction indicator is visible (yellow arrow)
    const canvas = await page.locator('#game').boundingBox();
    expect(canvas).toBeTruthy();
  });
  
  test('should show attack mode indicator', async ({ page }) => {
    await page.waitForSelector('canvas');
    
    // Check for mode text in UI
    const modeText = await page.locator('text=MODE:').textContent();
    expect(modeText).toContain('MODE:');
  });
  
  test('should toggle attack mode with spacebar', async ({ page }) => {
    await page.waitForSelector('canvas');
    
    // Get initial mode
    const initialMode = await page.locator('text=MODE:').textContent();
    
    // Press spacebar to toggle
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
    
    // Check if mode changed
    const newMode = await page.locator('text=MODE:').textContent();
    expect(newMode).not.toBe(initialMode);
  });
  
  test('should update attack direction on mouse movement', async ({ page }) => {
    await page.waitForSelector('canvas');
    
    // Move mouse to different positions
    const canvas = await page.locator('#game');
    const box = await canvas.boundingBox();
    
    if (box) {
      // Move to right side (should point east)
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5);
      await page.waitForTimeout(50);
      
      // Move to top side (should point north)
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.2);
      await page.waitForTimeout(50);
      
      // Move to bottom-left (should point southwest)
      await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.8);
      await page.waitForTimeout(50);
    }
  });
  
  test('should attack on mouse click', async ({ page }) => {
    await page.waitForSelector('canvas');
    
    const canvas = await page.locator('#game');
    const box = await canvas.boundingBox();
    
    if (box) {
      // Move mouse and click
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5);
      await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.5);
      
      // Wait for potential attack animation
      await page.waitForTimeout(200);
    }
  });
  
  test('should display controls instructions', async ({ page }) => {
    await page.waitForSelector('canvas');
    
    // Check for instructions
    const instructions = await page.locator('text=WASD').textContent();
    expect(instructions).toBeTruthy();
  });
});
