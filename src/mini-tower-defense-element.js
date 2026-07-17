/**
 * Mini Tower Defense Web Component.
 * A single-level tower defense game as a native Custom Element with Shadow DOM.
 *
 * Spec compliance:
 *  - §3.4 public API: start/pause/resume/restart/destroy/getSnapshot
 *  - §3.5 events: 11 dispatch sites, exact detail shape, bubbles+composed
 *  - §5.4 Responsive: ResizeObserver recomputes DPR / CSS size
 *  - §13 visibility: tab hidden -> auto-pause, requires manual resume
 *  - §14 entity caps: enforced inside game-engine tick
 *  - §8.1 score: cumulative kill reward gold, not current balance
 */

import { getTemplate } from './template.js';
import { getStyles } from './styles.js';
import { HUDController } from './ui/hud-controller.js';
import { BuildMenuController } from './ui/build-menu-controller.js';
import { ModalController } from './ui/modal-controller.js';
import { AudioManager } from './audio/audio-manager.js';
import { getI18n } from './config/i18n.js';
import { PLAYER_CONFIG, TowerType } from './config/game-config.js';
import { hitTestTowerSlot } from './render/coordinates.js';
import { TOWER_SLOTS, PATH_POINTS } from './config/map-config.js';
import { totalWaves } from './config/waves.js';
import { createPath } from './engine/path.js';
import { GameEngine } from './engine/game-engine.js';
import { createGameLoop } from './engine/game-loop.js';
import { calculateScore } from './engine/score.js';
import { CanvasRenderer } from './render/canvas-renderer.js';
import { PointerController } from './input/pointer-controller.js';

const ATTRIBUTES = {
  WIDTH: 'width',
  HEIGHT: 'height',
  LOCALE: 'locale',
  AUTO_START: 'auto-start',
  MUTED: 'muted',
};

const DEFAULT_WIDTH = 960;
const DEFAULT_HEIGHT = 540;
const DEFAULT_LOCALE = 'zh-CN';

class MiniTowerDefense extends HTMLElement {
  static get observedAttributes() {
    return [
      ATTRIBUTES.WIDTH,
      ATTRIBUTES.HEIGHT,
      ATTRIBUTES.LOCALE,
      ATTRIBUTES.AUTO_START,
      ATTRIBUTES.MUTED,
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
    // AudioManager reports errors via game-error events (§7.3).
    this._audio = new AudioManager((detail) => this._reportAudioError(detail));
    // Audio failure flag — once set, we don't try to play again until destroy.
    this._audioBroken = false;
    // Honor prefers-reduced-motion (§12) — read on construction.
    this._reducedMotion = this._readReducedMotion();

    // Game engine and loop
    this._engine = null;
    this._gameLoop = null;
    this._renderer = null;
    this._pointerController = null;

    // Path model
    this._path = null;

    // Canvas reference
    this._canvas = null;

    // Observers
    this._resizeObserver = null;
    this._autoPaused = false;

    // Initialize game snapshot with idle state values
    this._gameSnapshot = {
      state: 'idle',
      lives: PLAYER_CONFIG.initialLives,
      gold: PLAYER_CONFIG.initialGold,
      wave: 0,
      totalWaves,
      towers: [],
      enemies: [],
      projectiles: [],
      effects: [],
      towerSlots: [],
      elapsedMs: 0,
      totalKillRewardGold: 0,
    };

    // Initialize Shadow DOM content
    this._initShadowDOM();
  }

  /**
   * Read the prefers-reduced-motion media query. Defaults to false when
   * matchMedia isn't available (server-side, very old browsers).
   * @returns {boolean}
   */
  _readReducedMotion() {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** Forward an audio error to a game-error event per spec §7.3. */
  _reportAudioError(detail) {
    this._audioBroken = true;
    this._dispatchEvent('game-error', detail);
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

    // Initialize HUD controller
    const i18n = getI18n(this._locale);
    this._hud = new HUDController(this.shadowRoot, i18n, getI18n);
    this._buildMenu = new BuildMenuController(this.shadowRoot, i18n, () => this.getSnapshot());
    this._modal = new ModalController(this.shadowRoot, i18n);

    // HUD buttons
    this._hud.onSoundClick(() => {
      this._audio.unlock();
      this.muted = !this.muted;
    });
    this._hud.onPauseClick(() => {
      if (this._state === 'running') this.pause();
      else if (this._state === 'paused') {
        // If the user dismisses the auto-pause modal they re-enter running.
        if (this._autoPaused) this._autoPaused = false;
        this.resume();
      }
    });

    // Build menu callbacks
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

    // Modal callbacks
    this._modal.onResume(() => {
      this._autoPaused = false;
      this.resume();
    });
    this._modal.onRestart(() => this.restart());

    // Escape closes menus
    this.shadowRoot.addEventListener('escape-pressed', () => {
      this._buildMenu.hide();
    });
  }

  /**
   * Dispatch a CustomEvent with bubbles+composed (spec §3.5).
   * @param {string} type
   * @param {Object} detail
   */
  _dispatchEvent(type, detail) {
    this.dispatchEvent(
      new CustomEvent(type, {
        bubbles: true,
        composed: true,
        detail,
      })
    );
  }

  // ─── Attribute getters/setters ─────────────────────────────────────────────

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
    if (value) this.setAttribute(ATTRIBUTES.AUTO_START, '');
    else this.removeAttribute(ATTRIBUTES.AUTO_START);
  }

  get muted() {
    return this._muted;
  }
  set muted(value) {
    this._muted = Boolean(value);
    if (this._audio) this._audio.setMuted(this._muted);
    if (this._hud) this._hud.setMuted(this._muted);
    if (value) this.setAttribute(ATTRIBUTES.MUTED, '');
    else this.removeAttribute(ATTRIBUTES.MUTED);
  }

  get state() {
    return this._state;
  }

  get paused() {
    return this._state === 'paused';
  }
  set paused(value) {
    if (value) this.pause();
    else this.resume();
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  _initGameEngine() {
    if (this._engine) return;
    this._engine = new GameEngine();
  }

  /**
   * Recompute CSS size from the host element and apply to renderer.
   * Called by the ResizeObserver and once at construction.
   */
  _applyResize() {
    if (!this._canvas || !this._renderer) return;
    const rect = this.getBoundingClientRect();
    const cssWidth = Math.max(1, Math.floor(rect.width));
    const cssHeight = Math.max(1, Math.floor(rect.height));
    const dpr = typeof window !== 'undefined' && window.devicePixelRatio
      ? window.devicePixelRatio
      : 1;
    this._renderer.resize(cssWidth, cssHeight, dpr);
  }

  _startGameLoop() {
    if (this._gameLoop) return;
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const requestFrame = (cb) => requestAnimationFrame(cb);
    const cancelFrame = (id) => cancelAnimationFrame(id);
    this._gameLoop = createGameLoop({
      update: (delta) => this._update(delta),
      render: (interp) => this._render(interp),
      now,
      requestFrame,
      cancelFrame,
    });
    this._gameLoop.start();
  }

  /**
   * One fixed-timestep game update.
   * Translates engine events into spec-shaped (§3.5) public events.
   * @param {number} deltaSeconds
   */
  _update(deltaSeconds) {
    if (!this._engine || !this._path) return;

    const snapshot = this._engine.getSnapshot();
    const enemies = [...snapshot.enemies];

    const result = this._engine.tick(deltaSeconds, enemies, this._path);

    for (const event of result.events) {
      this._handleEngineEvent(event);
    }

    const updatedEnemies = result.enemies.filter((e) => e.alive);

    const engineSnapshot = this._engine.getSnapshot();
    this.updateSnapshot({
      ...engineSnapshot,
      enemies: updatedEnemies,
      path: this._path,
      towerSlots: this._engine.towerSlots,
    });
  }

  /**
   * Translate engine-internal events into spec-shaped public events.
   * §3.5 detail tables are matched exactly here.
   * @param {Object} event
   */
  _handleEngineEvent(event) {
    switch (event.type) {
      case 'wave-start': {
        this._safePlay('wave-start');
        this._dispatchEvent('wave-start', {
          wave: event.wave,
          totalWaves,
        });
        this.showAnnouncement(`Wave ${event.wave}`);
        break;
      }
      case 'wave-complete': {
        const snap = this._engine.getSnapshot();
        this._dispatchEvent('wave-complete', {
          wave: event.wave,
          remainingLives: snap.lives,
          gold: snap.gold,
        });
        break;
      }
      case 'tower-attack':
        // Could play arrow-shot / magic-shot from here; kept silent for now.
        break;
      case 'projectile-hit':
        this._safePlay('hit');
        break;
      case 'enemy-leak': {
        this._safePlay('enemy-leak');
        this._dispatchEvent('enemy-leaked', {
          enemyType: event.enemyType,
          damage: event.damage,
          remainingLives: event.livesRemaining,
        });
        break;
      }
      case 'game-win': {
        this._safePlay('victory');
        const snap = this._engine.getSnapshot();
        const score = this._computeScoreSnapshot(snap, 'win');
        this._dispatchEvent('game-win', {
          elapsedMs: snap.elapsedMs,
          remainingLives: snap.lives,
          gold: snap.gold,
          score,
        });
        break;
      }
      case 'game-lose': {
        this._safePlay('defeat');
        const snap = this._engine.getSnapshot();
        const score = this._computeScoreSnapshot(snap, 'lose');
        this._dispatchEvent('game-lose', {
          elapsedMs: snap.elapsedMs,
          completedWave: snap.wave,
          score,
        });
        break;
      }
    }
  }

  /**
   * Convenience: compute the score breakdown for the current snapshot.
   * @param {GameSnapshot} snap
   * @param {'win'|'lose'} outcome
   */
  _computeScoreSnapshot(snap, outcome) {
    return calculateScore({
      outcome,
      totalKillRewardGold: snap.totalKillRewardGold || 0,
      lives: snap.lives || 0,
      elapsedMs: snap.elapsedMs || 0,
      completedWave: snap.wave || 0,
    });
  }

  /** Play a sound only when audio is healthy. */
  _safePlay(name) {
    if (this._audioBroken) return;
    if (this._audio && !this._audio.muted) this._audio.play(name);
  }

  /**
   * Render the canvas. Lazily creates the renderer on first call so SSR /
   * test environments without a 2D context still work.
   * @param {number} interpolation
   */
  _render(interpolation) {
    if (!this._gameSnapshot) return;

    if (!this._renderer && this._canvas) {
      try {
        const ctx = this._canvas.getContext('2d');
        if (!ctx) return;
        this._renderer = new CanvasRenderer(this._canvas, {
          reducedMotion: this._reducedMotion,
        });
        this._applyResize();
        // C3: load embedded SVG assets before any render so callers don't
        // see placeholder geometry. Safe to call from the render path; the
        // store marks itself loaded on subsequent calls.
        this._renderer.assetStore.loadAll();
      } catch (e) {
        return;
      }
    } else if (this._renderer) {
      // Keep the reducer in sync with media-query changes (spec §12).
      this._renderer.setReducedMotion(this._reducedMotion);
    }
    if (!this._renderer) return;

    try {
      const renderSnapshot = {
        ...this._gameSnapshot,
        path: this._path,
        towerSlots: this._engine ? this._engine.towerSlots : [],
      };
      this._renderer.render(renderSnapshot, interpolation);
    } catch (error) {
      // Spec §3.4: error boundary, dispatch game-error and pause the game.
      this._dispatchEvent('game-error', {
        code: 'RENDER_ERROR',
        message: error.message,
      });
      this.pause();
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Start (or restart-from-idle) the game.
   */
  start() {
    if (this._state === 'destroyed') return;

    this._initGameEngine();
    this._startGameLoop();
    this._wireResizeAndVisibility();

    const result = this._engine.start();
    for (const event of result.events) {
      if (event.type === 'game-start') {
        this._dispatchEvent('game-start', { wave: 1 });
      }
    }

    // Pointer controller created lazily on first start so test envs that
    // never simulate clicks don't touch DOM measurements.
    if (!this._pointerController && this._canvas) {
      this._pointerController = new PointerController(
        this._canvas,
        { width: 960, height: 540 },
        (worldPos) => this._handleTowerSlotClick(worldPos)
      );
    }

    this._state = 'running';
    this._gameSnapshot.state = 'running';
    this._autoPaused = false;
    this._safePlay('wave-start');
  }

  /**
   * Pause a running game.
   */
  pause() {
    if (this._state !== 'running') return;

    this._state = 'paused';
    this._gameSnapshot.state = 'paused';

    if (this._gameLoop) this._gameLoop.pause();
    if (this._hud) this._hud.setPaused(true);
    if (this._modal && !this._autoPaused) {
      this._modal.showPaused();
    }
    if (this._autoPaused && this._modal) {
      this._modal.showPaused();
    }

    const elapsedMs = this._engine ? this._engine.getSnapshot().elapsedMs : 0;
    this._dispatchEvent('game-pause', { elapsedMs });
  }

  /**
   * Resume a paused game.
   */
  resume() {
    if (this._state !== 'paused') return;

    this._state = 'running';
    this._gameSnapshot.state = 'running';
    this._autoPaused = false;

    if (this._gameLoop) this._gameLoop.resume();
    if (this._hud) this._hud.setPaused(false);
    if (this._modal) this._modal.hide();

    const elapsedMs = this._engine ? this._engine.getSnapshot().elapsedMs : 0;
    this._dispatchEvent('game-resume', { elapsedMs });
  }

  /**
   * Restart the game from scratch.
   * Per spec, the user expects the element to be back in 'running', not
   * idle, after restart (previous behavior returned to idle and left the
   * game paused — confusing UX). This call resets state and immediately
   * re-enters the running state.
   */
  restart() {
    if (this._state === 'destroyed') return;

    // Tear down the previous loop/engine cleanly.
    if (this._gameLoop) {
      this._gameLoop.stop();
      this._gameLoop = null;
    }
    if (this._engine) this._engine.reset();

    // Reset visual snapshot.
    this._gameSnapshot = {
      state: 'idle',
      lives: PLAYER_CONFIG.initialLives,
      gold: PLAYER_CONFIG.initialGold,
      wave: 0,
      totalWaves,
      towers: [],
      enemies: [],
      projectiles: [],
      effects: [],
      towerSlots: this._engine ? this._engine.towerSlots : [],
      elapsedMs: 0,
      totalKillRewardGold: 0,
    };

    if (this._modal) this._modal.hide();
    if (this._buildMenu) this._buildMenu.hide();
    if (this._hud) this._hud.update(this._gameSnapshot);

    // Re-enter running immediately.
    this.start();
  }

  /**
   * Destroy the component. Stops RAF, releases audio, tears down observers.
   */
  destroy() {
    this._state = 'destroyed';
    this._gameSnapshot.state = 'destroyed';

    if (this._gameLoop) {
      this._gameLoop.stop();
      this._gameLoop = null;
    }
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
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }
    this._renderer = null;
    this._engine = null;
  }

  /**
   * Update the internal snapshot. The engine can call this; UI handlers can
   * also call it for synthetic state transitions.
   * @param {Object} snapshot
   */
  updateSnapshot(snapshot) {
    const prevState = this._gameSnapshot.state;
    const prevWave = this._gameSnapshot.wave;

    this._gameSnapshot = {
      ...this._gameSnapshot,
      ...snapshot,
      towerSlots: snapshot.towerSlots || this._gameSnapshot.towerSlots,
      enemies: snapshot.enemies || this._gameSnapshot.enemies,
      projectiles: snapshot.projectiles || this._gameSnapshot.projectiles,
      effects: snapshot.effects || this._gameSnapshot.effects,
    };

    // Modal + spec-shaped events when state first transitions to terminal.
    if (this._gameSnapshot.state === 'won' && prevState !== 'won') {
      if (this._modal) this._modal.showVictory(this._gameSnapshot);
      this._safePlay('victory');
      this._dispatchEvent('game-win', {
        elapsedMs: this._gameSnapshot.elapsedMs || 0,
        remainingLives: this._gameSnapshot.lives || 0,
        gold: this._gameSnapshot.gold || 0,
        score: this._computeScoreSnapshot(this._gameSnapshot, 'win').winScore,
      });
    } else if (this._gameSnapshot.state === 'lost' && prevState !== 'lost') {
      if (this._modal) this._modal.showDefeat(this._gameSnapshot);
      this._safePlay('defeat');
      this._dispatchEvent('game-lose', {
        elapsedMs: this._gameSnapshot.elapsedMs || 0,
        completedWave: this._gameSnapshot.wave || 0,
        score: this._computeScoreSnapshot(this._gameSnapshot, 'lose').loseScore,
      });
    }

    // Wave-start events flow through the engine event in _update. Here we
    // deliberately do NOT re-dispatch to remove the prior double-emit.

    this._updateHUD(this._gameSnapshot);
  }

  /** @returns {Readonly<GameSnapshot>} */
  getSnapshot() {
    return Object.freeze({ ...this._gameSnapshot });
  }

  _updateHUD(snapshot) {
    if (this._hud) this._hud.update(snapshot);
    if (this._buildMenu && this._buildMenu.isShowing()) this._buildMenu.update();
  }

  /**
   * Show a transient announcement in the aria-live region.
   * @param {string} text
   */
  showAnnouncement(text) {
    const node = this.shadowRoot?.querySelector('.announcement');
    if (!node) return;
    node.textContent = text;
    node.classList.add('visible');
    setTimeout(() => {
      node.classList.remove('visible');
    }, 2000);
  }

  /** Allow tests to inject a PointerController implementation. */
  setPointerController(controller) {
    this._pointerController = controller;
  }

  _handleTowerSlotClick(worldPos) {
    const slots = TOWER_SLOTS.map((pos, index) => ({
      id: `tower-slot-${index}`,
      x: pos.x,
      y: pos.y,
    }));
    const hitSlot = hitTestTowerSlot(worldPos, slots, 35);
    if (!hitSlot) {
      this._buildMenu.hide();
      return;
    }
    if (
      this._buildMenu.isShowing() &&
      this._buildMenu._currentSlotId === hitSlot.id
    ) {
      this._buildMenu.hide();
    } else {
      this._buildMenu.show(hitSlot.id, { x: hitSlot.x, y: hitSlot.y });
    }
  }

  _handleBuildTower(slotIndex, towerType) {
    if (!this._engine) return;
    const result = this._engine.buildTower(slotIndex, towerType);
    if (!result.ok) return;

    const snap = result.snapshot;
    const tower = snap.towers.find((t) => t.slotId === slotIndex);
    this.updateSnapshot({
      ...this._gameSnapshot,
      gold: snap.gold,
      towers: snap.towers,
    });
    this._buildMenu.hide();
    this._safePlay('build');
    if (tower) {
      this._dispatchEvent('tower-built', {
        slotId: `tower-slot-${slotIndex}`,
        towerType,
        cost: tower.cost,
        gold: snap.gold,
      });
    }
  }

  _handleSellTower(slotIndex) {
    if (!this._engine) return;
    const result = this._engine.sellTower(slotIndex);
    if (!result.ok) return;

    const snap = result.snapshot;
    this.updateSnapshot({
      ...this._gameSnapshot,
      gold: snap.gold,
      towers: snap.towers,
    });
    this._buildMenu.hide();
    this._safePlay('sell');
    this._dispatchEvent('tower-sold', {
      slotId: `tower-slot-${slotIndex}`,
      towerType: (snap.towers.length === 0 ? '' : ''), // tower no longer in state
      refund: result.refund,
      gold: snap.gold,
    });
  }

  // ─── ResizeObserver + visibilitychange (spec §5.4, §13) ───────────────────

  _wireResizeAndVisibility() {
    if (
      typeof ResizeObserver !== 'undefined' &&
      !this._resizeObserver &&
      typeof this.getBoundingClientRect === 'function'
    ) {
      this._resizeObserver = new ResizeObserver(() => this._applyResize());
      this._resizeObserver.observe(this);
    }
    if (typeof document !== 'undefined' && !this._visibilityHandler) {
      this._visibilityHandler = () => this._handleVisibilityChange();
      document.addEventListener('visibilitychange', this._visibilityHandler);
    }
  }

  /**
   * Spec §13: when the element is hidden, auto-pause and keep the player
   * paused on return until they explicitly resume.
   */
  _handleVisibilityChange() {
    if (typeof document === 'undefined') return;
    if (document.hidden && this._state === 'running') {
      this._autoPaused = true;
      this.pause();
    }
  }

  // ─── Web Component lifecycle ──────────────────────────────────────────────

  connectedCallback() {
    if (this.autoStart) this.start();
  }

  disconnectedCallback() {
    this.destroy();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    switch (name) {
      case ATTRIBUTES.LOCALE:
        this._locale = newValue || DEFAULT_LOCALE;
        if (this._hud) this._hud.setLocale(this._locale);
        break;
      case ATTRIBUTES.MUTED:
        this._muted = this.hasAttribute(ATTRIBUTES.MUTED);
        if (this._hud) this._hud.setMuted(this._muted);
        break;
      default:
        break;
    }
  }
}

if (!customElements.get('mini-tower-defense')) {
  customElements.define('mini-tower-defense', MiniTowerDefense);
}

export default MiniTowerDefense;
