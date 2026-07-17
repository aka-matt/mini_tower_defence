/**
 * E2E tests for core gameplay
 * Verifies game mechanics, multiple instances, and visibility handling
 */

import { test, expect } from '@playwright/test';
import { PLAYER_CONFIG } from '../../src/config/game-config.js';

test.describe('gameplay', () => {
  test('game starts and runs without errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('mini-tower-defense');

    const component = page.locator('mini-tower-defense');
    const canvas = component.locator('canvas');
    await expect(canvas).toBeVisible();

    // Wait for game to start and run
    await page.waitForTimeout(1000);

    const state = await page.evaluate(() => {
      return document.querySelector('mini-tower-defense').state;
    });
    expect(['running', 'idle']).toContain(state);
  });

  test('two instances run simultaneously without interference', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { display: flex; gap: 20px; background: #1a1a2e; }
          mini-tower-defense { border: 2px solid #333; }
        </style>
      </head>
      <body>
        <mini-tower-defense id="game1" locale="en"></mini-tower-defense>
        <mini-tower-defense id="game2" locale="zh-CN"></mini-tower-defense>
        <script type="module" src="/src/index.js"></script>
      </body>
      </html>
    `);

    await page.waitForSelector('mini-tower-defense');

    const game1 = page.locator('#game1');
    const game2 = page.locator('#game2');

    // Both canvases should be visible
    await expect(game1.locator('canvas')).toBeVisible();
    await expect(game2.locator('canvas')).toBeVisible();

    // Wait for both games to initialize
    await page.waitForTimeout(500);

    // Both should be in running or idle state
    const [state1, state2] = await page.evaluate(() => {
      const g1 = document.querySelector('#game1');
      const g2 = document.querySelector('#game2');
      return [g1.state, g2.state];
    });

    expect(['running', 'idle']).toContain(state1);
    expect(['running', 'idle']).toContain(state2);

    // Both should have independent snapshots
    const [snapshot1, snapshot2] = await page.evaluate(() => {
      const g1 = document.querySelector('#game1');
      const g2 = document.querySelector('#game2');
      return [g1.getSnapshot(), g2.getSnapshot()];
    });

    // Gold and lives should be independent
    expect(snapshot1.gold).toBe(PLAYER_CONFIG.initialGold);
    expect(snapshot2.gold).toBe(PLAYER_CONFIG.initialGold);
    expect(snapshot1.lives).toBe(PLAYER_CONFIG.initialLives);
    expect(snapshot2.lives).toBe(PLAYER_CONFIG.initialLives);

    // Start one game and verify the other is not affected
    await page.evaluate(() => {
      document.querySelector('#game1').start();
    });

    await page.waitForTimeout(500);

    // Game1 should be running, Game2 should still be idle
    const [newState1, newState2] = await page.evaluate(() => {
      const g1 = document.querySelector('#game1');
      const g2 = document.querySelector('#game2');
      return [g1.state, g2.state];
    });

    expect(newState1).toBe('running');
    expect(newState2).toBe('idle');
  });

  test('page visibility change does not cause time jumps', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('mini-tower-defense');

    const component = page.locator('mini-tower-defense');

    // Start the game
    await page.evaluate(() => {
      document.querySelector('mini-tower-defense').start();
    });

    await page.waitForTimeout(500);

    // Get initial time
    const initialSnapshot = await page.evaluate(() => {
      return document.querySelector('mini-tower-defense').getSnapshot();
    });

    // Hide the page
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Wait while hidden
    await page.waitForTimeout(1000);

    // Show the page again
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: false, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await page.waitForTimeout(500);

    // Get snapshot after visibility change
    const afterSnapshot = await page.evaluate(() => {
      return document.querySelector('mini-tower-defense').getSnapshot();
    });

    // Game state should still be valid (not crashed)
    expect(['running', 'paused', 'idle']).toContain(afterSnapshot.state);

    // Wave should not have jumped dramatically
    // (small variance is OK due to RAF timing)
    expect(afterSnapshot.wave).toBeGreaterThanOrEqual(initialSnapshot.wave);
  });

  test('pause and resume work correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('mini-tower-defense');

    const component = page.locator('mini-tower-defense');

    // Start game
    await page.evaluate(() => {
      document.querySelector('mini-tower-defense').start();
    });

    await page.waitForTimeout(500);

    let state = await page.evaluate(() => {
      return document.querySelector('mini-tower-defense').state;
    });
    expect(state).toBe('running');

    // Pause
    await page.evaluate(() => {
      document.querySelector('mini-tower-defense').pause();
    });

    state = await page.evaluate(() => {
      return document.querySelector('mini-tower-defense').state;
    });
    expect(state).toBe('paused');

    // Resume
    await page.evaluate(() => {
      document.querySelector('mini-tower-defense').resume();
    });

    state = await page.evaluate(() => {
      return document.querySelector('mini-tower-defense').state;
    });
    expect(state).toBe('running');
  });

  test('game can be restarted', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('mini-tower-defense');

    const component = page.locator('mini-tower-defense');

    // Start game
    await page.evaluate(() => {
      document.querySelector('mini-tower-defense').start();
    });

    await page.waitForTimeout(500);

    // Get initial gold (may have changed due to enemy kills)
    const goldBefore = await page.evaluate(() => {
      return document.querySelector('mini-tower-defense').getSnapshot().gold;
    });

    // Restart
    await page.evaluate(() => {
      document.querySelector('mini-tower-defense').restart();
    });

    await page.waitForTimeout(300);

    // Gold should be reset to initial
    const goldAfter = await page.evaluate(() => {
      return document.querySelector('mini-tower-defense').getSnapshot().gold;
    });

    expect(goldAfter).toBe(PLAYER_CONFIG.initialGold);

    // State should be running again
    const state = await page.evaluate(() => {
      return document.querySelector('mini-tower-defense').state;
    });
    expect(state).toBe('running');
  });

  test('component fires custom events', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('mini-tower-defense');

    // Listen for game-start event
    const eventPromise = page.evaluate(() => {
      return new Promise((resolve) => {
        document.addEventListener('game-start', (e) => {
          resolve({ bubbles: e.bubbles, composed: e.composed });
        }, { once: true });
      });
    });

    await page.evaluate(() => {
      document.querySelector('mini-tower-defense').start();
    });

    const event = await eventPromise;
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });
});
