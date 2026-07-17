/**
 * ModalController - manages modal dialogs for victory, defeat, and pause states.
 * Uses role="dialog" and aria-modal="true" for accessibility.
 *
 * Spec §13 requires textContent for all user-facing strings; this module
 * builds modal bodies with createElement rather than innerHTML strings.
 */

import { calculateScore } from '../engine/score.js';

/**
 * @typedef {Object} I18nMap
 * @property {string} victory
 * @property {string} defeat
 * @property {string} resume
 * @property {string} restart
 * @property {string} pause
 * @property {string} [killsLabel]
 * @property {string} [livesBonusLabel]
 * @property {string} [timeBonusLabel]
 * @property {string} [totalLabel]
 * @property {string} [wavesCompletedLabel]
 * @property {string} [scoreLabel]
 */

/**
 * @typedef {Object} GameSnapshot
 * @property {string} state
 * @property {number} [lives]
 * @property {number} [gold]
 * @property {number} [wave]
 * @property {number} [totalWaves]
 * @property {number} [elapsedMs]
 * @property {number} [totalKillRewardGold]
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
        if (this._onResume) this._onResume();
      };
      this._resumeButton.addEventListener('click', handler);
      this._boundHandlers.push({ button: this._resumeButton, handler });
    }

    if (this._restartButton) {
      const handler = () => {
        if (this._onRestart) this._onRestart();
      };
      this._restartButton.addEventListener('click', handler);
      this._boundHandlers.push({ button: this._restartButton, handler });
    }
  }

  /**
   * Append a labeled score row with safe textContent.
   * @returns {HTMLDivElement}
   */
  _appendRow(parent, label, value, { emphasis } = {}) {
    const row = document.createElement('div');
    row.className = emphasis ? 'score-row total' : 'score-row';
    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    const valueEl = document.createElement('span');
    valueEl.textContent = String(value);
    row.appendChild(labelEl);
    row.appendChild(valueEl);
    parent.appendChild(row);
    return row;
  }

  /**
   * Clear all children of a node using removeChild (safe in any DOM).
   * @param {Element} node
   */
  _clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  /**
   * Show victory modal.
   * @param {GameSnapshot} snapshot
   */
  showVictory(snapshot) {
    if (!this._modal || !this._modalContent) return;

    const score = calculateScore({
      outcome: 'win',
      totalKillRewardGold: snapshot.totalKillRewardGold || 0,
      lives: snapshot.lives || 0,
      elapsedMs: snapshot.elapsedMs || 0,
      completedWave: snapshot.wave || 0,
    });

    this._modalTitle.textContent = this._i18n.victory || 'Victory!';
    this._modalTitle.classList.remove('defeat');

    this._clearNode(this._modalBody);
    const breakdown = document.createElement('div');
    breakdown.className = 'score-breakdown';

    this._appendRow(breakdown, this._i18n.killsLabel || 'Kills:', score.baseKillScore);
    this._appendRow(breakdown, this._i18n.livesBonusLabel || 'Lives Bonus:', score.livesBonus);
    this._appendRow(breakdown, this._i18n.timeBonusLabel || 'Time Bonus:', score.timeBonus);
    this._appendRow(breakdown, this._i18n.totalLabel || 'Total:', score.winScore, {
      emphasis: true,
    });

    this._modalBody.appendChild(breakdown);

    if (this._resumeButton) this._resumeButton.hidden = true;
    if (this._restartButton) this._restartButton.hidden = false;

    this._modal.setAttribute('role', 'dialog');
    this._modal.setAttribute('aria-modal', 'true');
    this._modal.setAttribute('aria-labelledby', 'modal-title');

    this._modal.hidden = false;
    this._restartButton?.focus();
  }

  /**
   * Show defeat modal.
   * @param {GameSnapshot} snapshot
   */
  showDefeat(snapshot) {
    if (!this._modal || !this._modalContent) return;

    const score = calculateScore({
      outcome: 'lose',
      totalKillRewardGold: snapshot.totalKillRewardGold || 0,
      lives: snapshot.lives || 0,
      elapsedMs: snapshot.elapsedMs || 0,
      completedWave: snapshot.wave || 0,
    });

    this._modalTitle.textContent = this._i18n.defeat || 'Defeat';
    this._modalTitle.classList.add('defeat');

    this._clearNode(this._modalBody);
    const breakdown = document.createElement('div');
    breakdown.className = 'score-breakdown';

    this._appendRow(
      breakdown,
      this._i18n.wavesCompletedLabel || 'Waves Completed:',
      snapshot.wave || 0
    );
    this._appendRow(breakdown, this._i18n.killsLabel || 'Kills:', score.baseKillScore);
    this._appendRow(breakdown, this._i18n.scoreLabel || 'Score:', score.loseScore, {
      emphasis: true,
    });

    this._modalBody.appendChild(breakdown);

    if (this._resumeButton) this._resumeButton.hidden = true;
    if (this._restartButton) this._restartButton.hidden = false;

    this._modal.setAttribute('role', 'dialog');
    this._modal.setAttribute('aria-modal', 'true');
    this._modal.setAttribute('aria-labelledby', 'modal-title');

    this._modal.hidden = false;
    this._restartButton?.focus();
  }

  /**
   * Show paused modal.
   */
  showPaused() {
    if (!this._modal || !this._modalContent) return;

    this._modalTitle.textContent = this._i18n.pause || 'Paused';
    this._modalTitle.classList.remove('defeat');
    this._clearNode(this._modalBody);

    if (this._resumeButton) this._resumeButton.hidden = false;
    if (this._restartButton) this._restartButton.hidden = false;

    this._modal.setAttribute('role', 'dialog');
    this._modal.setAttribute('aria-modal', 'true');
    this._modal.setAttribute('aria-labelledby', 'modal-title');

    this._modal.hidden = false;
    this._resumeButton?.focus();
  }

  /**
   * Hide the modal.
   */
  hide() {
    if (this._modal) this._modal.hidden = true;
  }

  /**
   * Set callback for resume action.
   * @param {function(): void} callback
   */
  onResume(callback) {
    this._onResume = callback;
  }

  /**
   * Set callback for restart action.
   * @param {function(): void} callback
   */
  onRestart(callback) {
    this._onRestart = callback;
  }

  /**
   * Cleanup
   */
  destroy() {
    for (const { button, handler } of this._boundHandlers) {
      button.removeEventListener('click', handler);
    }
    this._boundHandlers = [];
    this._onResume = null;
    this._onRestart = null;
  }
}
