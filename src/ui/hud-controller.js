/**
 * HUD Controller - manages heads-up display updates
 * Pure DOM manipulation, no game logic dependencies
 */

/**
 * @typedef {Object} GameSnapshot
 * @property {string} state - 'idle' | 'running' | 'paused' | 'won' | 'lost' | 'destroyed'
 * @property {number} [lives] - current player lives
 * @property {number} [gold] - current gold
 * @property {number} [wave] - current wave number
 * @property {number} [totalWaves] - total number of waves
 */

/**
 * @typedef {Object} I18nMap
 * @property {string} lives
 * @property {string} gold
 * @property {string} wave
 */

export class HUDController {
  /**
   * @param {ShadowRoot} shadowRoot
   * @param {I18nMap} i18n
   */
  constructor(shadowRoot, i18n) {
    this._shadowRoot = shadowRoot;
    this._i18n = i18n;
    this._soundClickHandler = null;
    this._pauseClickHandler = null;

    this._livesValue = shadowRoot.querySelector('.lives-value');
    this._goldValue = shadowRoot.querySelector('.gold-value');
    this._waveValue = shadowRoot.querySelector('.wave-value');
    this._soundButton = shadowRoot.querySelector('.sound-button');
    this._pauseButton = shadowRoot.querySelector('.pause-button');
    this._pauseIcon = shadowRoot.querySelector('.pause-icon');

    this._bindEvents();
  }

  _bindEvents() {
    if (this._soundButton) {
      this._soundButton.addEventListener('click', () => {
        if (this._soundClickHandler) {
          this._soundClickHandler();
        }
      });
    }

    if (this._pauseButton) {
      this._pauseButton.addEventListener('click', () => {
        if (this._pauseClickHandler) {
          this._pauseClickHandler();
        }
      });
    }
  }

  /**
   * Update HUD display from game snapshot
   * @param {GameSnapshot} snapshot
   */
  update(snapshot) {
    if (!snapshot) return;

    if (this._livesValue && snapshot.lives !== undefined) {
      this._livesValue.textContent = snapshot.lives;
    }

    if (this._goldValue && snapshot.gold !== undefined) {
      this._goldValue.textContent = snapshot.gold;
    }

    if (this._waveValue && snapshot.wave !== undefined && snapshot.totalWaves !== undefined) {
      this._waveValue.textContent = `${snapshot.wave}/${snapshot.totalWaves}`;
    }
  }

  /**
   * Update locale and refresh HUD labels
   * @param {'zh-CN' | 'en'} locale
   */
  setLocale(locale) {
    // Labels are data-i18n keys - update if needed for dynamic label changes
    // For now labels are static in template
  }

  /**
   * Set sound button click handler
   * @param {Function} handler
   */
  onSoundClick(handler) {
    this._soundClickHandler = handler;
  }

  /**
   * Set pause button click handler
   * @param {Function} handler
   */
  onPauseClick(handler) {
    this._pauseClickHandler = handler;
  }

  /**
   * Update pause button icon based on paused state
   * @param {boolean} isPaused
   */
  setPaused(isPaused) {
    if (this._pauseIcon) {
      this._pauseIcon.textContent = isPaused ? '▶' : '⏸';
    }
  }

  /**
   * Update sound button muted state
   * @param {boolean} isMuted
   */
  setMuted(isMuted) {
    if (this._soundButton) {
      if (isMuted) {
        this._soundButton.classList.add('muted');
      } else {
        this._soundButton.classList.remove('muted');
      }
    }
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    this._soundClickHandler = null;
    this._pauseClickHandler = null;
  }
}
