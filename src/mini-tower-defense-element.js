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
import { TOWER_SLOTS, PATH_POINTS } from './config/map-config.js';
import { createPath } from './engine/path.js';
import { GameEngine } from './engine/game-engine.js';
import { createGameLoop } from './engine/game-loop.js';
import { CanvasRenderer } from './render/canvas-renderer.js';
import { PointerController } from './input/pointer-controller.js';

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

    // Game engine and loop
    this._engine = null;
    this._gameLoop = null;
    this._renderer = null;
    this._pointerController = null;

    // Path model
    this._path = null;

    // Canvas reference
    this._canvas = null;

    // Initialize game snapshot with idle state values
    this._gameSnapshot = {
      state: 'idle',
      lives: PLAYER_CONFIG.initialLives,
      gold: PLAYER_CONFIG.initialGold,
      wave: 0,
      totalWaves: 5,
      towers: [],
      enemies: [],
      projectiles: [],
      effects: [],
      towerSlots: []
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

    // Get canvas reference
    this._canvas = this.shadowRoot.querySelector('canvas');

    // Initialize path model
    this._path = createPath(PATH_POINTS);

    // Initialize renderer lazily (only when actually rendering, to support test environments)
    // The renderer will be created on first render call

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
    if (!this._engine) {
      return;
    }

    const result = this._engine.buildTower(slotIndex, towerType);
    if (result.ok) {
      // Update internal snapshot from engine state
      this._gameSnapshot = {
        ...this._gameSnapshot,
        gold: result.snapshot.gold,
        towers: result.snapshot.towers,
      };
      this._updateHUD(this._gameSnapshot);
      this._buildMenu.hide();
      this._audio.play('build');
      const tower = result.snapshot.towers.find(t => t.slotId === slotIndex);
      if (tower) {
        this._dispatchEvent('tower-built', { towerId: tower.id, towerType });
      }
    }
  }

  /**
   * Handle selling a tower
   * @param {number} slotIndex
   */
  _handleSellTower(slotIndex) {
    if (!this._engine) {
      return;
    }

    const result = this._engine.sellTower(slotIndex);
    if (result.ok) {
      // Update internal snapshot from engine state
      this._gameSnapshot = {
        ...this._gameSnapshot,
        gold: result.snapshot.gold,
        towers: result.snapshot.towers,
      };
      this._updateHUD(this._gameSnapshot);
      this._buildMenu.hide();
      this._audio.play('sell');
      this._dispatchEvent('tower-sold', { towerId: `tower-slot-${slotIndex}`, refund: result.refund });
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

  /**
   * Initialize the game engine and start the game loop
   */
  _initGameEngine() {
    if (this._engine) {
      return;
    }

    this._engine = new GameEngine();
  }

  /**
   * Create and start the game loop
   */
  _startGameLoop() {
    if (this._gameLoop) {
      return;
    }

    const now = () => performance.now();
    const requestFrame = (cb) => requestAnimationFrame(cb);
    const cancelFrame = (id) => cancelAnimationFrame(id);

    this._gameLoop = createGameLoop({
      update: (deltaSeconds) => this._update(deltaSeconds),
      render: (interpolation) => this._render(interpolation),
      now,
      requestFrame,
      cancelFrame,
    });

    this._gameLoop.start();
  }

  /**
   * Update game state for fixed timestep
   * @param {number} deltaSeconds
   */
  _update(deltaSeconds) {
    if (!this._engine || !this._path) {
      return;
    }

    const snapshot = this._engine.getSnapshot();
    const enemies = [...snapshot.enemies];

    // Tick engine
    const result = this._engine.tick(deltaSeconds, enemies, this._path);

    // Process engine events
    for (const event of result.events) {
      switch (event.type) {
        case 'wave-start':
          this._audio.play('wave-start');
          this._dispatchEvent('wave-start', { wave: event.wave });
          break;
        case 'wave-complete':
          this._dispatchEvent('wave-complete', { wave: event.wave });
          break;
        case 'tower-attack':
          // Could play attack sound here
          break;
        case 'projectile-hit':
          // Could play hit sound here
          break;
        case 'enemy-killed':
          this._audio.play('enemy-killed');
          this._dispatchEvent('enemy-killed', { enemyId: event.enemyId, reward: event.reward });
          break;
        case 'enemy-leak':
          this._audio.play('enemy-leak');
          this._dispatchEvent('enemy-leaked', { enemyId: event.enemyId, livesRemaining: event.livesRemaining });
          break;
        case 'game-win':
          this._audio.play('victory');
          this._dispatchEvent('game-win', {});
          break;
        case 'game-lose':
          this._audio.play('defeat');
          this._dispatchEvent('game-lose', {});
          break;
      }
    }

    // Update enemies (remove dead ones)
    const updatedEnemies = result.enemies.filter(e => e.alive);

    // Update snapshot
    const engineSnapshot = this._engine.getSnapshot();
    this.updateSnapshot({
      ...engineSnapshot,
      enemies: updatedEnemies,
      path: this._path,
      towerSlots: this._engine.towerSlots,
    });
  }

  /**
   * Render the game
   * @param {number} interpolation
   */
  _render(interpolation) {
    if (!this._gameSnapshot) {
      return;
    }

    // Lazily initialize renderer (canvas.getContext not available in test envs)
    if (!this._renderer && this._canvas) {
      try {
        // Check if canvas supports getContext
        const ctx = this._canvas.getContext('2d');
        if (ctx) {
          this._renderer = new CanvasRenderer(this._canvas);
          this._renderer.resize(this.width, this.height, window.devicePixelRatio || 1);
        }
      } catch (e) {
        // Canvas not supported (e.g., in test environments)
        return;
      }
    }

    if (!this._renderer) {
      return;
    }

    try {
      // Prepare snapshot for renderer
      const renderSnapshot = {
        ...this._gameSnapshot,
        path: this._path,
        towerSlots: this._engine ? this._engine.towerSlots : [],
      };
      this._renderer.render(renderSnapshot, interpolation);
    } catch (error) {
      console.error('Render error:', error);
      this._dispatchEvent('game-error', { error: error.message });
      this.pause();
    }
  }

  start() {
    if (this._state === 'destroyed') {
      return;
    }

    this._initGameEngine();
    this._startGameLoop();

    // Start the game engine
    const result = this._engine.start();
    for (const event of result.events) {
      if (event.type === 'game-start') {
        this._dispatchEvent('game-start', {});
      }
    }

    // Initialize pointer controller on first start
    if (!this._pointerController && this._canvas) {
      this._pointerController = new PointerController(
        this._canvas,
        { width: 960, height: 540 },
        (worldPos) => this._handleTowerSlotClick(worldPos)
      );
    }

    // Update state
    this._state = 'running';
    this._gameSnapshot.state = 'running';
    this._audio.play('wave-start');
  }

  pause() {
    if (this._state !== 'running') {
      return;
    }

    this._state = 'paused';
    this._gameSnapshot.state = 'paused';

    if (this._gameLoop) {
      this._gameLoop.pause();
    }

    if (this._hud) {
      this._hud.setPaused(true);
    }
    if (this._modal) {
      this._modal.showPaused();
    }

    this._dispatchEvent('game-pause', {});
  }

  resume() {
    if (this._state !== 'paused') {
      return;
    }

    this._state = 'running';
    this._gameSnapshot.state = 'running';

    if (this._gameLoop) {
      this._gameLoop.resume();
    }

    if (this._hud) {
      this._hud.setPaused(false);
    }
    if (this._modal) {
      this._modal.hide();
    }

    this._dispatchEvent('game-resume', {});
  }

  restart() {
    // Stop and cleanup game loop
    if (this._gameLoop) {
      this._gameLoop.stop();
      this._gameLoop = null;
    }

    // Reset engine
    if (this._engine) {
      this._engine.reset();
    }

    // Reset state
    this._state = 'idle';
    this._gameSnapshot = {
      state: 'idle',
      lives: PLAYER_CONFIG.initialLives,
      gold: PLAYER_CONFIG.initialGold,
      wave: 0,
      totalWaves: 5,
      towers: [],
      enemies: [],
      projectiles: [],
      effects: [],
      towerSlots: this._engine ? this._engine.towerSlots : [],
    };

    // Reset UI
    if (this._modal) {
      this._modal.hide();
    }
    if (this._buildMenu) {
      this._buildMenu.hide();
    }
    if (this._hud) {
      this._hud.update(this._gameSnapshot);
    }

    // Dispatch restart event
    this._dispatchEvent('game-restart', {});
  }

  destroy() {
    this._state = 'destroyed';
    this._gameSnapshot.state = 'destroyed';

    // Stop game loop
    if (this._gameLoop) {
      this._gameLoop.stop();
      this._gameLoop = null;
    }

    // Release audio
    if (this._audio) {
      this._audio.destroy();
      this._audio = null;
    }

    // Cleanup UI controllers
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

    // Cleanup pointer controller
    if (this._pointerController) {
      this._pointerController.destroy();
      this._pointerController = null;
    }

    // Cleanup renderer
    if (this._renderer) {
      this._renderer = null;
    }

    // Cleanup engine
    this._engine = null;
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
      enemies: snapshot.enemies || this._gameSnapshot.enemies,
      projectiles: snapshot.projectiles || this._gameSnapshot.projectiles,
      effects: snapshot.effects || this._gameSnapshot.effects,
      towerSlots: snapshot.towerSlots || this._gameSnapshot.towerSlots,
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

    // Update HUD
    this._updateHUD(this._gameSnapshot);
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
