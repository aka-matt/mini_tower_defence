/**
 * BuildMenuController - manages build menu UI for tower slots
 * Shows tower options when clicking empty slots, sell option when clicking occupied slots
 */

import { TOWER_STATS, TowerType, PLAYER_CONFIG } from '../config/game-config.js';

/**
 * @typedef {Object} I18nMap
 * @property {string} buildArcher
 * @property {string} buildMage
 * @property {string} sell
 * @property {string} insufficientGold
 */

/**
 * @typedef {Object} GameSnapshot
 * @property {string} state
 * @property {number} [gold]
 * @property {number} [wave]
 * @property {number} [totalWaves]
 */

export class BuildMenuController {
  /**
   * @param {ShadowRoot} shadowRoot
   * @param {I18nMap} i18n
   * @param {function(): GameSnapshot} getSnapshot
   */
  constructor(shadowRoot, i18n, getSnapshot) {
    this._shadowRoot = shadowRoot;
    this._i18n = i18n;
    this._getSnapshot = getSnapshot;

    /** @type {string | null} */
    this._currentSlotId = null;

    /** @type {{x: number, y: number} | null} */
    this._currentSlotPos = null;

    /** @type {boolean} */
    this._isShowing = false;

    // Callbacks
    this._onBuildArcher = null;
    this._onBuildMage = null;
    this._onSell = null;

    // Get DOM elements
    this._menu = shadowRoot.querySelector('.build-menu');
    this._archerCard = shadowRoot.querySelector('.tower-card-archer');
    this._mageCard = shadowRoot.querySelector('.tower-card-mage');
    this._sellCard = shadowRoot.querySelector('.tower-card-sell');
    this._archerCost = shadowRoot.querySelector('.archer-cost');
    this._mageCost = shadowRoot.querySelector('.mage-cost');
    this._sellRefund = shadowRoot.querySelector('.sell-refund');
    this._archerButton = shadowRoot.querySelector('.build-archer-button');
    this._mageButton = shadowRoot.querySelector('.build-mage-button');
    this._sellButton = shadowRoot.querySelector('.sell-button');

    this._bindEvents();
  }

  _bindEvents() {
    if (this._archerButton) {
      this._archerButton.addEventListener('click', () => {
        if (this._onBuildArcher && !this._archerButton.disabled) {
          this._onBuildArcher(this._currentSlotId);
        }
      });
    }

    if (this._mageButton) {
      this._mageButton.addEventListener('click', () => {
        if (this._onBuildMage && !this._mageButton.disabled) {
          this._onBuildMage(this._currentSlotId);
        }
      });
    }

    if (this._sellButton) {
      this._sellButton.addEventListener('click', () => {
        if (this._onSell) {
          this._onSell(this._currentSlotId);
        }
      });
    }
  }

  /**
   * Show the build menu for a tower slot
   * @param {string} slotId - Slot identifier (e.g., "tower-slot-0")
   * @param {{x: number, y: number}} slotWorldPos - World position of the slot
   */
  show(slotId, slotWorldPos) {
    if (!this._menu) return;

    this._currentSlotId = slotId;
    this._currentSlotPos = slotWorldPos;

    const snapshot = this._getSnapshot();
    const gold = snapshot.gold || 0;

    // Determine if slot is occupied (slotId format: "tower-slot-N")
    const slotIndex = parseInt(slotId.split('-').pop(), 10);
    const occupiedSlot = snapshot.towers?.some(t => t.slotId === slotIndex);

    if (occupiedSlot) {
      // Show sell menu
      this._showSellMenu(snapshot, slotIndex);
    } else {
      // Show build menu with tower cards
      this._showBuildMenu(gold);
    }

    // Position the menu relative to the slot
    this._positionMenu(slotWorldPos);

    // Show the menu
    this._menu.hidden = false;
    this._isShowing = true;
  }

  _showBuildMenu(gold) {
    // Hide sell card, show tower cards
    if (this._sellCard) this._sellCard.hidden = true;
    if (this._archerCard) this._archerCard.hidden = false;
    if (this._mageCard) this._mageCard.hidden = false;

    // Update costs
    const archerCost = TOWER_STATS[TowerType.ARCHER].cost;
    const mageCost = TOWER_STATS[TowerType.MAGE].cost;

    if (this._archerCost) {
      this._archerCost.textContent = archerCost;
    }
    if (this._mageCost) {
      this._mageCost.textContent = mageCost;
    }

    // Update button states based on gold
    if (this._archerButton) {
      this._archerButton.disabled = gold < archerCost;
    }
    if (this._mageButton) {
      this._mageButton.disabled = gold < mageCost;
    }
  }

  _showSellMenu(snapshot, slotIndex) {
    // Hide tower cards, show sell card
    if (this._archerCard) this._archerCard.hidden = true;
    if (this._mageCard) this._mageCard.hidden = true;
    if (this._sellCard) this._sellCard.hidden = false;

    // Find the tower and calculate refund
    const tower = snapshot.towers?.find(t => t.slotId === slotIndex);
    if (tower) {
      const refund = Math.floor(tower.cost * PLAYER_CONFIG.sellRefundRate);
      if (this._sellRefund) {
        this._sellRefund.textContent = refund;
      }
    }
  }

  /**
   * Position menu near the slot, preferring above, fallback below
   * @param {{x: number, y: number}} slotWorldPos
   */
  _positionMenu(slotWorldPos) {
    if (!this._menu) return;

    const stage = this._shadowRoot.querySelector('.stage');
    if (!stage) return;

    const stageRect = stage.getBoundingClientRect();

    // Slot position in CSS pixels (assuming world is 960x540)
    const worldSize = { width: 960, height: 540 };
    const slotX = (slotWorldPos.x / worldSize.width) * stageRect.width;
    const slotY = (slotWorldPos.y / worldSize.height) * stageRect.height;

    // Get menu dimensions (approximate)
    const menuWidth = 200;
    const menuHeight = 120;

    // Prefer above the slot
    let top = slotY - menuHeight - 10;
    let left = slotX - menuWidth / 2;

    // Fallback below if too high
    if (top < 10) {
      top = slotY + 30;
    }

    // Keep within stage bounds
    left = Math.max(10, Math.min(left, stageRect.width - menuWidth - 10));
    top = Math.max(10, Math.min(top, stageRect.height - menuHeight - 10));

    this._menu.style.left = `${left}px`;
    this._menu.style.top = `${top}px`;
    this._menu.style.bottom = 'auto';
    this._menu.style.transform = 'none';
  }

  /**
   * Hide the build menu
   */
  hide() {
    if (this._menu) {
      this._menu.hidden = true;
    }
    this._isShowing = false;
    this._currentSlotId = null;
    this._currentSlotPos = null;
  }

  /**
   * Check if menu is currently showing
   * @returns {boolean}
   */
  isShowing() {
    return this._isShowing;
  }

  /**
   * Update menu state (e.g., after gold changes)
   */
  update() {
    if (!this._isShowing || !this._currentSlotId) return;

    const snapshot = this._getSnapshot();
    const gold = snapshot.gold || 0;

    const slotIndex = parseInt(this._currentSlotId.split('-').pop(), 10);
    const occupiedSlot = snapshot.towers?.some(t => t.slotId === slotIndex);

    if (!occupiedSlot) {
      this._showBuildMenu(gold);
    }
  }

  /**
   * Set callback for build archer action
   * @param {function(string): void} callback - Called with slotId
   */
  onBuildArcher(callback) {
    this._onBuildArcher = callback;
  }

  /**
   * Set callback for build mage action
   * @param {function(string): void} callback - Called with slotId
   */
  onBuildMage(callback) {
    this._onBuildMage = callback;
  }

  /**
   * Set callback for sell action
   * @param {function(string): void} callback - Called with slotId
   */
  onSell(callback) {
    this._onSell = callback;
  }

  /**
   * Cleanup
   */
  destroy() {
    this._onBuildArcher = null;
    this._onBuildMage = null;
    this._onSell = null;
  }
}
