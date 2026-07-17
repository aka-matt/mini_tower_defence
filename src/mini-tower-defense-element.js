/**
 * Mini Tower Defense Web Component
 * A single-level tower defense game as a native Web Component with Shadow DOM.
 */

import { getTemplate } from './template.js';
import { getStyles } from './styles.js';
import { HUDController } from './ui/hud-controller.js';
import { BuildMenuController } from './ui/build-menu-controller.js';
import { ModalController } from './ui/modal-controller.js';
import { AudioManager } from './audio/audio-manager.js';
import { getI18n } from './config/i18n.js';
import { PLAYER_CONFIG, TOWER_STATS, TowerType } from './config/game-config.js';
import { hitTestTowerSlot } from './render/coordinates.js';
import { TOWER_SLOTS } from './config/map-config.js';

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
    this._buildMenu = null;
    this._modal = null;
    this._muted = false;
    this._locale = DEFAULT_LOCALE;
    this._audio = new AudioManager();

    // Pointer controller reference
    this._pointerController = null;

    // Initialize game snapshot with idle state values
    this._gameSnapshot = {
      state: 'idle',
      lives: PLAYER_CONFIG.initialLives,
      gold: PLAYER_CONFIG.initialGold,
      wave: 0,
      totalWaves: 5,
      towers: []
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

    // Initialize Build Menu controller
    this._buildMenu = new BuildMenuController(this.shadowRoot, i18n, () => this.getSnapshot());

    // Initialize Modal controller
    this._modal = new ModalController(this.shadowRoot, i18n);

    // Connect HUD buttons to component methods
    this._hud.onSoundClick(() => {
      this._audio.unlock();
      this.muted = !this.muted;
    });

    this._hud.onPauseClick(() => {
      if (this._state === 'running') {
        this.pause();
      } else if (this._state === 'paused') {
        this.resume();
      }
    });

    // Connect Build Menu callbacks
    this._buildMenu.onBuildArcher((slotId) => {
      const slotIndex = parseInt(slotId.split('-').pop(), 10);
      this._handleBuildTower(slotIndex, TowerType.ARCHER);
    });

    this._buildMenu.onBuildMage((slotId) => {
      const slotIndex = parseInt(slotId.split('-').pop(), 10);
      this._handleBuildTower(slotIndex, TowerType.MAGE);
    });

    this._buildMenu.onSell((slotId) => {
      const slotIndex = parseInt(slotId.split('-').pop(), 10);
      this._handleSellTower(slotIndex);
    });

    // Connect Modal callbacks
    this._modal.onResume(() => {
      this.resume();
    });

    this._modal.onRestart(() => {
      this.restart();
    });

    // Listen for escape key to close menus
    this.shadowRoot.addEventListener('escape-pressed', () => {
      this._buildMenu.hide();
    });

    // Click on stage background closes menu
    this.shadowRoot.querySelector('.stage')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('stage') || e.target.tagName === 'CANVAS') {
        // Don't close if clicking on canvas - let pointer controller handle
        // But if build menu is open and clicking elsewhere, close it
        if (this._buildMenu.isShowing() && !e.target.classList.contains('build-menu')) {
          // Check if click is outside build menu
          const menu = this.shadowRoot.querySelector('.build-menu');
          if (menu && !menu.contains(e.target)) {
            this._buildMenu.hide();
          }
        }
      }
    });
  }

  /**
   * Handle building a tower
   * @param {number} slotIndex
   * @param {string} towerType
   */
  _handleBuildTower(slotIndex, towerType) {
    const spec = TOWER_STATS[towerType];
    if (this._gameSnapshot.gold >= spec.cost) {
      this._gameSnapshot.gold -= spec.cost;
      const slot = TOWER_SLOTS[slotIndex];
      const newTower = {
        id: `tower-slot-${slotIndex}`,
        type: towerType,
        slotId: slotIndex,
        x: slot.x,
        y: slot.y,
        cost: spec.cost,
        damage: spec.damage,
        range: spec.range,
        attackInterval: spec.interval,
        projectileSpeed: spec.projectileSpeed,
        alive: true
      };
      this._gameSnapshot.towers = [...this._gameSnapshot.towers, newTower];
      this._buildMenu.hide();
      this._updateHUD(this._gameSnapshot);
      this._audio.play('build');
      this._dispatchEvent('tower-built', { towerId: newTower.id, towerType });
    }
  }

  /**
   * Handle selling a tower
   * @param {number} slotIndex
   */
  _handleSellTower(slotIndex) {
    const towerId = `tower-slot-${slotIndex}`;
    const tower = this._gameSnapshot.towers.find(t => t.id === towerId);
    if (tower) {
      const refund = Math.floor(tower.cost * PLAYER_CONFIG.sellRefundRate);
      this._gameSnapshot.gold += refund;
      this._gameSnapshot.towers = this._gameSnapshot.towers.filter(t => t.id !== towerId);
      this._buildMenu.hide();
      this._updateHUD(this._gameSnapshot);
      this._audio.play('sell');
      this._dispatchEvent('tower-sold', { towerId, refund });
    }
  }

  /**
   * Dispatch a custom event
   * @param {string} type
   * @param {Object} detail
   */
  _dispatchEvent(type, detail) {
    this.dispatchEvent(new CustomEvent(type, {
      bubbles: true,
      composed: true,
      detail
    }));
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
    if (this._audio) {
      this._audio.setMuted(this._muted);
    }
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
    this._audio.play('wave-start');
    this._dispatchEvent('game-start', {});
  }

  pause() {
    this._state = 'paused';
    this._gameSnapshot.state = 'paused';
    if (this._hud) {
      this._hud.setPaused(true);
    }
    if (this._modal) {
      this._modal.showPaused();
    }
  }

  resume() {
    this._state = 'running';
    this._gameSnapshot.state = 'running';
    if (this._hud) {
      this._hud.setPaused(false);
    }
    if (this._modal) {
      this._modal.hide();
    }
  }

  restart() {
    this._state = 'idle';
    this._gameSnapshot.state = 'idle';
    this._gameSnapshot.lives = PLAYER_CONFIG.initialLives;
    this._gameSnapshot.gold = PLAYER_CONFIG.initialGold;
    this._gameSnapshot.wave = 0;
    this._gameSnapshot.towers = [];
    if (this._modal) {
      this._modal.hide();
    }
    if (this._buildMenu) {
      this._buildMenu.hide();
    }
  }

  destroy() {
    this._state = 'destroyed';
    this._gameSnapshot.state = 'destroyed';
    if (this._audio) {
      this._audio.destroy();
      this._audio = null;
    }
    if (this._hud) {
      this._hud.destroy();
      this._hud = null;
    }
    if (this._buildMenu) {
      this._buildMenu.destroy();
      this._buildMenu = null;
    }
    if (this._modal) {
      this._modal.destroy();
      this._modal = null;
    }
    if (this._pointerController) {
      this._pointerController.destroy();
      this._pointerController = null;
    }
  }

  /**
   * Updates the internal game snapshot. Called by the game loop.
   * @param {Object} snapshot
   */
  updateSnapshot(snapshot) {
    const prevState = this._gameSnapshot.state;
    const prevWave = this._gameSnapshot.wave;

    this._gameSnapshot = {
      state: snapshot.state || this._state,
      lives: snapshot.lives,
      gold: snapshot.gold,
      wave: snapshot.wave,
      totalWaves: snapshot.totalWaves,
      towers: snapshot.towers || this._gameSnapshot.towers,
      elapsedMs: snapshot.elapsedMs
    };

    // Handle state transitions - show modals
    if (this._gameSnapshot.state === 'won' && prevState !== 'won') {
      if (this._modal) {
        this._modal.showVictory(this._gameSnapshot);
      }
      this._audio.play('victory');
      this._dispatchEvent('game-win', {});
    } else if (this._gameSnapshot.state === 'lost' && prevState !== 'lost') {
      if (this._modal) {
        this._modal.showDefeat(this._gameSnapshot);
      }
      this._audio.play('defeat');
      this._dispatchEvent('game-lose', {});
    }

    // Handle wave transitions - show announcements
    if (snapshot.wave && snapshot.wave !== prevWave) {
      if (snapshot.wave > prevWave) {
        this._audio.play('wave-start');
        this._dispatchEvent('wave-start', { wave: snapshot.wave });
      }
    }
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
    // Update build menu if showing (for gold-based button states)
    if (this._buildMenu && this._buildMenu.isShowing()) {
      this._buildMenu.update();
    }
  }

  /**
   * Show an announcement (wave start, etc.)
   * @param {string} text
   */
  showAnnouncement(text) {
    const announcement = this.shadowRoot.querySelector('.announcement');
    if (announcement) {
      announcement.textContent = text;
      announcement.classList.add('visible');
      setTimeout(() => {
        announcement.classList.remove('visible');
      }, 2000);
    }
  }

  /**
   * Set the pointer controller for handling tower slot clicks
   * @param {PointerController} controller
   */
  setPointerController(controller) {
    this._pointerController = controller;
  }

  /**
   * Handle tower slot click from pointer controller
   * @param {{x: number, y: number}} worldPos
   */
  _handleTowerSlotClick(worldPos) {
    const slots = TOWER_SLOTS.map((pos, index) => ({
      id: `tower-slot-${index}`,
      x: pos.x,
      y: pos.y
    }));

    const hitSlot = hitTestTowerSlot(worldPos, slots, 35);

    if (hitSlot) {
      if (this._buildMenu.isShowing() && this._buildMenu._currentSlotId === hitSlot.id) {
        // Clicking same slot - close menu
        this._buildMenu.hide();
      } else {
        // Show build menu for this slot
        this._buildMenu.show(hitSlot.id, { x: hitSlot.x, y: hitSlot.y });
      }
    } else {
      // Clicked elsewhere - close menu
      this._buildMenu.hide();
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
