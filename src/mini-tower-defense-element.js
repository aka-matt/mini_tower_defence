/**
 * Mini Tower Defense Web Component
 * A single-level tower defense game as a native Web Component with Shadow DOM.
 */

import { getTemplate } from './template.js';
import { getStyles } from './styles.js';
import { HUDController } from './ui/hud-controller.js';
import { getI18n } from './config/i18n.js';
import { PLAYER_CONFIG } from './config/game-config.js';

const ATTRIBUTES = {
  WIDTH: 'width',
  HEIGHT: 'height',
  LOCALE: 'locale',
  AUTO_START: 'auto-start',
  MUTED: 'muted'
};

const DEFAULT_WIDTH = 960;
const DEFAULT_HEIGHT = 540;
const DEFAULT_LOCALE = 'zh-CN';

/**
 * Mini Tower Defense custom element with Shadow DOM
 */
class MiniTowerDefense extends HTMLElement {
  static get observedAttributes() {
    return [
      ATTRIBUTES.WIDTH,
      ATTRIBUTES.HEIGHT,
      ATTRIBUTES.LOCALE,
      ATTRIBUTES.AUTO_START,
      ATTRIBUTES.MUTED
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._state = 'idle';
    this._hud = null;
    this._muted = false;
    this._locale = DEFAULT_LOCALE;

    // Initialize game snapshot with idle state values
    this._gameSnapshot = {
      state: 'idle',
      lives: PLAYER_CONFIG.initialLives,
      gold: PLAYER_CONFIG.initialGold,
      wave: 0,
      totalWaves: 5
    };

    // Initialize Shadow DOM content
    this._initShadowDOM();
  }

  _initShadowDOM() {
    // Add styles
    const styleEl = document.createElement('style');
    styleEl.textContent = getStyles();
    this.shadowRoot.appendChild(styleEl);

    // Add template
    const templateDiv = document.createElement('div');
    templateDiv.innerHTML = getTemplate();
    this.shadowRoot.appendChild(templateDiv);

    // Initialize HUD controller
    const i18n = getI18n(this._locale);
    this._hud = new HUDController(this.shadowRoot, i18n, getI18n);

    // Connect HUD buttons to component methods
    this._hud.onSoundClick(() => {
      this.muted = !this.muted;
    });

    this._hud.onPauseClick(() => {
      if (this._state === 'running') {
        this.pause();
      } else if (this._state === 'paused') {
        this.resume();
      }
    });
  }

  // Attributes
  get width() {
    return parseInt(this.getAttribute(ATTRIBUTES.WIDTH) || DEFAULT_WIDTH, 10);
  }

  set width(value) {
    this.setAttribute(ATTRIBUTES.WIDTH, value);
  }

  get height() {
    return parseInt(this.getAttribute(ATTRIBUTES.HEIGHT) || DEFAULT_HEIGHT, 10);
  }

  set height(value) {
    this.setAttribute(ATTRIBUTES.HEIGHT, value);
  }

  get locale() {
    return this.getAttribute(ATTRIBUTES.LOCALE) || DEFAULT_LOCALE;
  }

  set locale(value) {
    this.setAttribute(ATTRIBUTES.LOCALE, value);
  }

  get autoStart() {
    return this.hasAttribute(ATTRIBUTES.AUTO_START);
  }

  set autoStart(value) {
    if (value) {
      this.setAttribute(ATTRIBUTES.AUTO_START, '');
    } else {
      this.removeAttribute(ATTRIBUTES.AUTO_START);
    }
  }

  get muted() {
    return this._muted;
  }

  set muted(value) {
    this._muted = Boolean(value);
    if (this._hud) {
      this._hud.setMuted(this._muted);
    }
    if (value) {
      this.setAttribute(ATTRIBUTES.MUTED, '');
    } else {
      this.removeAttribute(ATTRIBUTES.MUTED);
    }
  }

  // State (readonly)
  get state() {
    return this._state;
  }

  // Pause state helper
  get paused() {
    return this._state === 'paused';
  }

  set paused(value) {
    if (value) {
      this.pause();
    } else {
      this.resume();
    }
  }

  // Methods
  start() {
    this._state = 'running';
    this._gameSnapshot.state = 'running';
  }

  pause() {
    this._state = 'paused';
    this._gameSnapshot.state = 'paused';
    if (this._hud) {
      this._hud.setPaused(true);
    }
  }

  resume() {
    this._state = 'running';
    this._gameSnapshot.state = 'running';
    if (this._hud) {
      this._hud.setPaused(false);
    }
  }

  restart() {
    this._state = 'idle';
    this._gameSnapshot.state = 'idle';
    this._gameSnapshot.lives = PLAYER_CONFIG.initialLives;
    this._gameSnapshot.gold = PLAYER_CONFIG.initialGold;
    this._gameSnapshot.wave = 0;
  }

  destroy() {
    this._state = 'destroyed';
    this._gameSnapshot.state = 'destroyed';
    if (this._hud) {
      this._hud.destroy();
      this._hud = null;
    }
  }

  /**
   * Updates the internal game snapshot. Called by the game loop.
   * @param {Object} snapshot
   */
  updateSnapshot(snapshot) {
    this._gameSnapshot = {
      state: snapshot.state || this._state,
      lives: snapshot.lives,
      gold: snapshot.gold,
      wave: snapshot.wave,
      totalWaves: snapshot.totalWaves
    };
  }

  /**
   * Returns a frozen snapshot of current game state
   * @returns {Object} GameSnapshot
   */
  getSnapshot() {
    return Object.freeze({ ...this._gameSnapshot });
  }

  /**
   * Updates the HUD with the given snapshot
   * @param {Object} snapshot
   */
  _updateHUD(snapshot) {
    if (this._hud) {
      this._hud.update(snapshot);
    }
  }

  // Lifecycle
  connectedCallback() {
    // Initialize component when added to DOM
    if (this.autoStart) {
      this.start();
    }
  }

  disconnectedCallback() {
    // Cleanup when removed from DOM
    this.destroy();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case ATTRIBUTES.LOCALE:
        this._locale = newValue || DEFAULT_LOCALE;
        if (this._hud) {
          this._hud.setLocale(this._locale);
        }
        break;

      case ATTRIBUTES.MUTED:
        this._muted = this.hasAttribute(ATTRIBUTES.MUTED);
        if (this._hud) {
          this._hud.setMuted(this._muted);
        }
        break;
    }
  }
}

// Register only if not already registered
if (!customElements.get('mini-tower-defense')) {
  customElements.define('mini-tower-defense', MiniTowerDefense);
}

export default MiniTowerDefense;
