/**
 * ModalController - manages modal dialogs for victory, defeat, and pause states
 * Uses role="dialog" and aria-modal="true" for accessibility
 */

import { calculateScore } from '../config/game-config.js';

/**
 * @typedef {Object} I18nMap
 * @property {string} victory
 * @property {string} defeat
 * @property {string} resume
 * @property {string} restart
 */

/**
 * @typedef {Object} GameSnapshot
 * @property {string} state
 * @property {number} [lives]
 * @property {number} [gold]
 * @property {number} [wave]
 * @property {number} [totalWaves]
 * @property {number} [elapsedMs]
 * @property {number} [score]
 */

export class ModalController {
  /**
   * @param {ShadowRoot} shadowRoot
   * @param {I18nMap} i18n
   */
  constructor(shadowRoot, i18n) {
    this._shadowRoot = shadowRoot;
    this._i18n = i18n;

    // Callbacks
    this._onResume = null;
    this._onRestart = null;

    // Get DOM elements
    this._modal = shadowRoot.querySelector('.modal');
    this._modalContent = shadowRoot.querySelector('.modal-content');
    this._modalTitle = shadowRoot.querySelector('.modal-title');
    this._modalBody = shadowRoot.querySelector('.modal-body');
    this._resumeButton = shadowRoot.querySelector('.modal-resume-button');
    this._restartButton = shadowRoot.querySelector('.modal-restart-button');

    // Store buttons for cleanup
    this._boundHandlers = [];

    this._bindEvents();
  }

  _bindEvents() {
    if (this._resumeButton) {
      const handler = () => {
        if (this._onResume) {
          this._onResume();
        }
      };
      this._resumeButton.addEventListener('click', handler);
      this._boundHandlers.push({ button: this._resumeButton, handler });
    }

    if (this._restartButton) {
      const handler = () => {
        if (this._onRestart) {
          this._onRestart();
        }
      };
      this._restartButton.addEventListener('click', handler);
      this._boundHandlers.push({ button: this._restartButton, handler });
    }
  }

  /**
   * Show victory modal
   * @param {GameSnapshot} snapshot
   */
  showVictory(snapshot) {
    if (!this._modal || !this._modalContent) return;

    const score = calculateScore({
      totalKillRewardGold: snapshot.gold || 0,
      lives: snapshot.lives || 0,
      elapsedMs: snapshot.elapsedMs || 0,
      completedWave: snapshot.wave || 0,
    });

    // Build modal content
    this._modalTitle.textContent = this._i18n.victory || 'Victory!';
    this._modalTitle.classList.remove('defeat');

    this._modalBody.innerHTML = `
      <div class="score-breakdown">
        <div class="score-row">
          <span>Kills:</span>
          <span>${score.baseKillScore}</span>
        </div>
        <div class="score-row">
          <span>Lives Bonus:</span>
          <span>${score.livesBonus}</span>
        </div>
        <div class="score-row">
          <span>Time Bonus:</span>
          <span>${score.timeBonus}</span>
        </div>
        <div class="score-row total">
          <span>Total:</span>
          <span>${score.winScore}</span>
        </div>
      </div>
    `;

    // Show restart button, hide resume (victory has no resume)
    if (this._resumeButton) {
      this._resumeButton.hidden = true;
    }
    if (this._restartButton) {
      this._restartButton.hidden = false;
    }

    // Set ARIA attributes
    this._modal.setAttribute('role', 'dialog');
    this._modal.setAttribute('aria-modal', 'true');
    this._modal.setAttribute('aria-labelledby', 'modal-title');

    // Show modal
    this._modal.hidden = false;

    // Focus restart button for keyboard accessibility
    this._restartButton?.focus();
  }

  /**
   * Show defeat modal
   * @param {GameSnapshot} snapshot
   */
  showDefeat(snapshot) {
    if (!this._modal || !this._modalContent) return;

    const score = calculateScore({
      totalKillRewardGold: snapshot.gold || 0,
      lives: snapshot.lives || 0,
      elapsedMs: snapshot.elapsedMs || 0,
      completedWave: snapshot.wave || 0,
    });

    // Build modal content
    this._modalTitle.textContent = this._i18n.defeat || 'Defeat';
    this._modalTitle.classList.add('defeat');

    this._modalBody.innerHTML = `
      <div class="score-breakdown">
        <div class="score-row">
          <span>Waves Completed:</span>
          <span>${snapshot.wave || 0}</span>
        </div>
        <div class="score-row">
          <span>Kills:</span>
          <span>${score.baseKillScore}</span>
        </div>
        <div class="score-row total">
          <span>Score:</span>
          <span>${score.loseScore}</span>
        </div>
      </div>
    `;

    // Show restart button, hide resume (defeat has no resume)
    if (this._resumeButton) {
      this._resumeButton.hidden = true;
    }
    if (this._restartButton) {
      this._restartButton.hidden = false;
    }

    // Set ARIA attributes
    this._modal.setAttribute('role', 'dialog');
    this._modal.setAttribute('aria-modal', 'true');
    this._modal.setAttribute('aria-labelledby', 'modal-title');

    // Show modal
    this._modal.hidden = false;

    // Focus restart button
    this._restartButton?.focus();
  }

  /**
   * Show paused modal
   */
  showPaused() {
    if (!this._modal || !this._modalContent) return;

    // Simple paused message
    this._modalTitle.textContent = this._i18n.pause || 'Paused';
    this._modalTitle.classList.remove('defeat');
    this._modalBody.innerHTML = '';

    // Show both resume and restart buttons
    if (this._resumeButton) {
      this._resumeButton.hidden = false;
    }
    if (this._restartButton) {
      this._restartButton.hidden = false;
    }

    // Set ARIA attributes
    this._modal.setAttribute('role', 'dialog');
    this._modal.setAttribute('aria-modal', 'true');
    this._modal.setAttribute('aria-labelledby', 'modal-title');

    // Show modal
    this._modal.hidden = false;

    // Focus resume button
    this._resumeButton?.focus();
  }

  /**
   * Hide the modal
   */
  hide() {
    if (this._modal) {
      this._modal.hidden = true;
    }
  }

  /**
   * Set callback for resume action
   * @param {function(): void} callback
   */
  onResume(callback) {
    this._onResume = callback;
  }

  /**
   * Set callback for restart action
   * @param {function(): void} callback
   */
  onRestart(callback) {
    this._onRestart = callback;
  }

  /**
   * Cleanup
   */
  destroy() {
    // Remove event listeners
    for (const { button, handler } of this._boundHandlers) {
      button.removeEventListener('click', handler);
    }
    this._boundHandlers = [];
    this._onResume = null;
    this._onRestart = null;
  }
}
