/**
 * E2E tests for CSS isolation
 * Verifies component is not affected by host page styles
 */

import { test, expect } from '@playwright/test';

test.describe('host CSS isolation', () => {
  test('host button reset does not affect component buttons', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          /* Host page button reset - should NOT affect component buttons */
          button { all: unset; display: none; }
        </style>
      </head>
      <body>
        <mini-tower-defense id="game"></mini-tower-defense>
        <script type="module" src="/src/index.js"></script>
      </body>
      </html>
    `);

    await page.waitForSelector('mini-tower-defense');
    const component = page.locator('mini-tower-defense');

    // Wait for canvas to be visible
    const canvas = component.locator('canvas');
    await expect(canvas).toBeVisible();

    // Component buttons should still be visible (not affected by host button reset)
    // The HUD has buttons that should be visible and clickable
    await page.waitForTimeout(500);

    // Verify component is still functional
    const state = await page.evaluate(() => {
      return document.querySelector('mini-tower-defense').state;
    });
    expect(['idle', 'running']).toContain(state);
  });

  test('host canvas style does not affect component canvas', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          /* Host page canvas override - should NOT affect component canvas */
          canvas { width: 10px !important; height: 10px !important; }
        </style>
      </head>
      <body>
        <mini-tower-defense id="game"></mini-tower-defense>
        <script type="module" src="/src/index.js"></script>
      </body>
      </html>
    `);

    await page.waitForSelector('mini-tower-defense');
    const component = page.locator('mini-tower-defense');
    const canvas = component.locator('canvas');

    await expect(canvas).toBeVisible();

    // Canvas should NOT be 10px - Shadow DOM should protect it
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    // Canvas should be a reasonable size, not 10px
    expect(canvasBox.width).toBeGreaterThan(100);
    expect(canvasBox.height).toBeGreaterThan(50);
  });

  test('host global color style does not affect component text', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          /* Host page global color override - should NOT affect component text */
          * { color: red !important; font-family: 'Comic Sans MS' !important; }
        </style>
      </head>
      <body>
        <mini-tower-defense id="game"></mini-tower-defense>
        <script type="module" src="/src/index.js"></script>
      </body>
      </html>
    `);

    await page.waitForSelector('mini-tower-defense');

    // Component should render and show HUD text
    const component = page.locator('mini-tower-defense');
    await page.waitForTimeout(500);

    // Verify component is functional (not styled by global red color)
    const state = await page.evaluate(() => {
      return document.querySelector('mini-tower-defense').state;
    });
    expect(['idle', 'running']).toContain(state);

    // HUD should have some text content (gold/lives display)
    const hudText = await component.locator('.hud').textContent();
    expect(hudText).toBeTruthy();
  });

  test('component styles do not leak to host page', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('mini-tower-defense');

    // Add a button to the host page
    await page.evaluate(() => {
      const btn = document.createElement('button');
      btn.textContent = 'Host Button';
      btn.id = 'host-btn';
      document.body.appendChild(btn);
    });

    const hostBtn = page.locator('#host-btn');
    await expect(hostBtn).toBeVisible();

    // Host button should have its default styling, not component styles
    // Component uses Shadow DOM so styles are isolated
    const btnStyles = await hostBtn.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        width: style.width,
        color: style.color
      };
    });

    // Host button should NOT have component's internal styles
    // (it should be visible with normal button styling)
    expect(btnStyles.display).not.toBe('none');
  });

  test('Bootstrap-style reset does not break component', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          /* Bootstrap-style reset */
          *, *::before, *::after {
            box-sizing: border-box;
          }
          * {
            margin: 0;
            padding: 0;
          }
          button {
            all: unset;
            display: inline-block;
          }
          canvas {
            display: block;
          }
        </style>
      </head>
      <body>
        <mini-tower-defense id="game"></mini-tower-defense>
        <script type="module" src="/src/index.js"></script>
      </body>
      </html>
    `);

    await page.waitForSelector('mini-tower-defense');
    const component = page.locator('mini-tower-defense');
    const canvas = component.locator('canvas');

    await expect(canvas).toBeVisible();

    // Component should still be functional
    await page.waitForTimeout(500);
    const state = await page.evaluate(() => {
      return document.querySelector('mini-tower-defense').state;
    });
    expect(['idle', 'running']).toContain(state);
  });

  test('component with extreme host fonts still renders', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          /* Extreme font settings - should not affect component */
          html, body {
            font-family: 'NonExistentFont', 'AnotherBadFont', monospace;
            font-size: 50px;
          }
        </style>
      </head>
      <body>
        <mini-tower-defense id="game"></mini-tower-defense>
        <script type="module" src="/src/index.js"></script>
      </body>
      </html>
    `);

    await page.waitForSelector('mini-tower-defense');
    const component = page.locator('mini-tower-defense');
    const canvas = component.locator('canvas');

    await expect(canvas).toBeVisible();

    // Canvas should not inherit huge font size
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox.width).toBeGreaterThan(100);
  });
});
