import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/mini-tower-defense-element.js';

describe('CSS isolation', () => {
  let element;

  afterEach(() => {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  describe('host page CSS does not penetrate shadow DOM', () => {
    it('global button { all: unset } does not affect internal buttons', () => {
      // Apply global style that would unset all buttons
      const globalStyle = document.createElement('style');
      globalStyle.textContent = `button { all: unset; }`;
      document.head.appendChild(globalStyle);

      element = document.createElement('mini-tower-defense');
      document.body.appendChild(element);

      const internalButton = element.shadowRoot.querySelector('.sound-button');
      const style = getComputedStyle(internalButton);

      // The internal button should still have its styled appearance
      // not inherit the global 'all: unset'
      expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(style.cursor).toBe('pointer');

      document.head.removeChild(globalStyle);
    });

    it('global * { color: red } does not affect internal text', () => {
      const globalStyle = document.createElement('style');
      globalStyle.textContent = `* { color: red !important; }`;
      document.head.appendChild(globalStyle);

      element = document.createElement('mini-tower-defense');
      document.body.appendChild(element);

      const hudItem = element.shadowRoot.querySelector('.hud-item');
      const style = getComputedStyle(hudItem);

      // The internal HUD text should not be red
      // It should use the CSS variable or default dark text
      expect(style.color).not.toBe('rgb(255, 0, 0)');

      document.head.removeChild(globalStyle);
    });

    it('host element own styles do not penetrate shadow', () => {
      element = document.createElement('mini-tower-defense');
      element.style.background = 'red';
      document.body.appendChild(element);

      const shell = element.shadowRoot.querySelector('.game-shell');
      const shellStyle = getComputedStyle(shell);

      // The internal game-shell should not have red background
      // It should have the gradient from our styles
      expect(shellStyle.background).not.toContain('rgb(255, 0, 0)');

      // Clean up element style
      element.style.background = '';
    });

    it('internal canvas exists and is isolated', () => {
      element = document.createElement('mini-tower-defense');
      document.body.appendChild(element);

      const canvas = element.shadowRoot.querySelector('canvas');
      expect(canvas).toBeTruthy();

      // Canvas should exist in shadow DOM, not in document
      const docCanvas = document.querySelector('canvas');
      expect(docCanvas).toBeNull();
    });
  });

  describe('component CSS does not affect host elements', () => {
    it('component CSS does not style external elements with same class', () => {
      element = document.createElement('mini-tower-defense');
      document.body.appendChild(element);

      // Create an external button with same class name
      const externalButton = document.createElement('button');
      externalButton.textContent = 'External';
      externalButton.className = 'sound-button';
      document.body.appendChild(externalButton);

      const externalStyle = getComputedStyle(externalButton);
      const internalStyle = getComputedStyle(
        element.shadowRoot.querySelector('.sound-button')
      );

      // External button should NOT have the same cursor as internal
      // Internal has pointer cursor from component styles
      // External should have default cursor
      expect(externalStyle.cursor).not.toBe('pointer');

      document.body.removeChild(externalButton);
    });

    it('external canvas does not inherit component background', () => {
      element = document.createElement('mini-tower-defense');
      document.body.appendChild(element);

      // Create external canvas
      const externalCanvas = document.createElement('canvas');
      externalCanvas.className = 'canvas';
      document.body.appendChild(externalCanvas);

      const externalStyle = getComputedStyle(externalCanvas);

      // External canvas should have default/empty background
      const bg = externalStyle.backgroundColor;
      expect(bg === '' || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent').toBe(true);

      document.body.removeChild(externalCanvas);
    });

    it('host element uses shadow DOM containment', () => {
      element = document.createElement('mini-tower-defense');
      document.body.appendChild(element);

      // The component should use Shadow DOM which provides encapsulation
      expect(element.shadowRoot).toBeTruthy();
      expect(element.shadowRoot.mode).toBe('open');
    });
  });

  describe('Shadow DOM encapsulation', () => {
    it('shadow root is open but content is encapsulated', () => {
      element = document.createElement('mini-tower-defense');
      document.body.appendChild(element);

      // Shadow root is open
      expect(element.shadowRoot.mode).toBe('open');

      // But internal elements are not directly accessible via document.querySelector
      const externalQuery = document.querySelector('.hud-item');
      expect(externalQuery).toBeNull();

      // They are accessible via shadowRoot
      const internalQuery = element.shadowRoot.querySelector('.hud-item');
      expect(internalQuery).toBeTruthy();
    });

    it('internal styles use shadow DOM scoping', () => {
      element = document.createElement('mini-tower-defense');
      document.body.appendChild(element);

      // Check that internal elements have proper shadow DOM styling
      const hud = element.shadowRoot.querySelector('.hud');
      const style = getComputedStyle(hud);

      // The HUD should have a background color (our panel-bg)
      // not transparent or default
      expect(style.backgroundColor).toBeTruthy();
      expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });
  });
});
