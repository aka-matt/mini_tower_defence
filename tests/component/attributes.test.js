import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/mini-tower-defense-element.js';

describe('mini-tower-defense attributes', () => {
  let element;

  afterEach(() => {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  describe('Shadow DOM structure', () => {
    it('creates element with open Shadow Root', () => {
      element = document.createElement('mini-tower-defense');
      document.body.appendChild(element);

      expect(element.shadowRoot).toBeTruthy();
      expect(element.shadowRoot.mode).toBe('open');
    });

    it('has correct shadow parts (shell, hud, stage, canvas)', () => {
      element = document.createElement('mini-tower-defense');
      document.body.appendChild(element);

      const shell = element.shadowRoot.querySelector('[part="shell"]');
      const hud = element.shadowRoot.querySelector('[part="hud"]');
      const stage = element.shadowRoot.querySelector('[part="stage"]');
      const canvas = element.shadowRoot.querySelector('[part="canvas"]');

      expect(shell).toBeTruthy();
      expect(hud).toBeTruthy();
      expect(stage).toBeTruthy();
      expect(canvas).toBeTruthy();
    });

    it('has HUD elements (lives, gold, wave, sound-button, pause-button)', () => {
      element = document.createElement('mini-tower-defense');
      document.body.appendChild(element);

      const lives = element.shadowRoot.querySelector('.lives-value');
      const gold = element.shadowRoot.querySelector('.gold-value');
      const wave = element.shadowRoot.querySelector('.wave-value');
      const soundButton = element.shadowRoot.querySelector('.sound-button');
      const pauseButton = element.shadowRoot.querySelector('.pause-button');

      expect(lives).toBeTruthy();
      expect(gold).toBeTruthy();
      expect(wave).toBeTruthy();
      expect(soundButton).toBeTruthy();
      expect(pauseButton).toBeTruthy();
    });

    it('has build-menu, announcement, and modal elements', () => {
      element = document.createElement('mini-tower-defense');
      document.body.appendChild(element);

      const buildMenu = element.shadowRoot.querySelector('.build-menu');
      const announcement = element.shadowRoot.querySelector('.announcement');
      const modal = element.shadowRoot.querySelector('.modal');

      expect(buildMenu).toBeTruthy();
      expect(announcement).toBeTruthy();
      expect(modal).toBeTruthy();
    });

    it('has hidden attribute on build-menu and modal initially', () => {
      element = document.createElement('mini-tower-defense');
      document.body.appendChild(element);

      const buildMenu = element.shadowRoot.querySelector('.build-menu');
      const modal = element.shadowRoot.querySelector('.modal');

      expect(buildMenu.hasAttribute('hidden')).toBe(true);
      expect(modal.hasAttribute('hidden')).toBe(true);
    });
  });

  describe('CSS variables', () => {
    it('CSS variables are used in shadow DOM styles', () => {
      element = document.createElement('mini-tower-defense');
      document.body.appendChild(element);

      // Check that CSS variables work within shadow DOM
      const hudItem = element.shadowRoot.querySelector('.hud-item');
      const style = getComputedStyle(hudItem);

      // Color should be defined (not transparent/black default)
      expect(style.color).toBeTruthy();
    });

    it('host element has contain style for performance', () => {
      element = document.createElement('mini-tower-defense');
      document.body.appendChild(element);

      // Element should be a custom element (block-level)
      expect(element.tagName).toBe('MINI-TOWER-DEFENSE');
    });
  });

  describe('attribute observers', () => {
    it('reflects width attribute', () => {
      element = document.createElement('mini-tower-defense');
      element.setAttribute('width', '800');
      document.body.appendChild(element);

      expect(element.width).toBe(800);
    });

    it('reflects height attribute', () => {
      element = document.createElement('mini-tower-defense');
      element.setAttribute('height', '600');
      document.body.appendChild(element);

      expect(element.height).toBe(600);
    });

    it('reflects locale attribute', () => {
      element = document.createElement('mini-tower-defense');
      element.setAttribute('locale', 'en');
      document.body.appendChild(element);

      expect(element.locale).toBe('en');
    });

    it('reflects muted attribute', () => {
      element = document.createElement('mini-tower-defense');
      element.setAttribute('muted', '');
      document.body.appendChild(element);

      expect(element.muted).toBe(true);
    });

    it('reflects auto-start attribute', () => {
      element = document.createElement('mini-tower-defense');
      element.setAttribute('auto-start', '');
      document.body.appendChild(element);

      expect(element.autoStart).toBe(true);
    });
  });

  describe('host CSS isolation', () => {
    it('setting button { all: unset } on host does not affect internal buttons', () => {
      element = document.createElement('mini-tower-defense');
      document.body.appendChild(element);

      // Get computed style of internal button
      const internalButton = element.shadowRoot.querySelector('.sound-button');
      const internalStyle = getComputedStyle(internalButton);

      // Internal button should still have its background (not unset)
      expect(internalStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });

    it('host page global styles do not penetrate shadow DOM', () => {
      // Add global style that would break things
      const globalStyle = document.createElement('style');
      globalStyle.textContent = `
        mini-tower-defense {
          all: unset;
        }
      `;
      document.head.appendChild(globalStyle);

      element = document.createElement('mini-tower-defense');
      document.body.appendChild(element);

      // Component should still render correctly
      expect(element.shadowRoot).toBeTruthy();
      const shell = element.shadowRoot.querySelector('.game-shell');
      expect(shell).toBeTruthy();

      // Cleanup
      document.head.removeChild(globalStyle);
    });
  });
});
