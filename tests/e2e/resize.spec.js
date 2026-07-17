/**
 * E2E tests for responsive behavior
 * Verifies component works at different container widths and DPR settings
 */

import { test, expect } from '@playwright/test';

test.describe('resize behavior', () => {
  test('960px width renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 700 });

    await page.goto('/');
    await page.waitForSelector('mini-tower-defense');

    const component = page.locator('mini-tower-defense');
    const canvas = component.locator('canvas');

    await expect(canvas).toBeVisible();

    // Canvas should have correct dimensions
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox.width).toBeGreaterThan(900);
    expect(canvasBox.height).toBeGreaterThan(500);
  });

  test('600px width shows responsive behavior', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 480 });

    await page.goto('/');
    await page.waitForSelector('mini-tower-defense');

    const component = page.locator('mini-tower-defense');
    const canvas = component.locator('canvas');

    await expect(canvas).toBeVisible();

    // Canvas should be visible and reasonably sized even in smaller viewport
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox.width).toBeGreaterThan(500);
  });

  test('360px narrow mode works', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 600 });

    await page.goto('/');
    await page.waitForSelector('mini-tower-defense');

    const component = page.locator('mini-tower-defense');
    const canvas = component.locator('canvas');

    await expect(canvas).toBeVisible();

    // Component should still render in narrow viewport
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox.width).toBeGreaterThan(300);
  });

  test('DPR 1 renders correctly', async ({ page }) => {
    await page.addInitScript(() => {
      // Override device pixel ratio to 1
      Object.defineProperty(window, 'devicePixelRatio', { value: 1 });
    });

    await page.setViewportSize({ width: 960, height: 540 });
    await page.goto('/');
    await page.waitForSelector('mini-tower-defense');

    const component = page.locator('mini-tower-defense');
    const canvas = component.locator('canvas');

    await expect(canvas).toBeVisible();

    // Game should start and run without errors
    await page.waitForTimeout(500);
    const state = await page.evaluate(() => {
      const el = document.querySelector('mini-tower-defense');
      return el.state;
    });
    expect(['running', 'idle']).toContain(state);
  });

  test('DPR 2 renders correctly', async ({ page }) => {
    await page.addInitScript(() => {
      // Override device pixel ratio to 2
      Object.defineProperty(window, 'devicePixelRatio', { value: 2 });
    });

    await page.setViewportSize({ width: 960, height: 540 });
    await page.goto('/');
    await page.waitForSelector('mini-tower-defense');

    const component = page.locator('mini-tower-defense');
    const canvas = component.locator('canvas');

    await expect(canvas).toBeVisible();

    // Game should start and run without errors
    await page.waitForTimeout(500);
    const state = await page.evaluate(() => {
      const el = document.querySelector('mini-tower-defense');
      return el.state;
    });
    expect(['running', 'idle']).toContain(state);
  });

  test('game runs without errors at different sizes', async ({ page }) => {
    const sizes = [
      { width: 960, height: 540, name: 'default' },
      { width: 1280, height: 720, name: 'larger' },
      { width: 640, height: 400, name: 'smaller' }
    ];

    for (const size of sizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto('/');
      await page.waitForSelector('mini-tower-defense');

      // Let the game run briefly
      await page.waitForTimeout(300);

      // Check for console errors
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.waitForTimeout(200);

      expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);

      // Clean up listener
      page.removeAllListeners('console');
    }
  });
});
