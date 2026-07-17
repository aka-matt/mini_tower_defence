// Game engine - orchestrates game state, tower management, and commands
// Wraps state machine with tower slot management

import { TOWER_STATS, TowerType, PLAYER_CONFIG } from '../config/game-config.js';
import { TOWER_SLOTS } from '../config/map-config.js';
import { createInitialState, transitionGameState, GameEvent, GameStateType } from './state-machine.js';

/**
 * @typedef {Object} CommandResult
 * @property {boolean} ok - Whether the command succeeded
 * @property {Object} [snapshot] - Game snapshot on success
 * @property {string} [code] - Error code on failure
 */

/**
 * GameEngine - manages game state and tower operations
 */
export class GameEngine {
  constructor() {
    this._state = createInitialState();
    this._towerSlots = Object.freeze(TOWER_SLOTS.map((pos, index) => Object.freeze({
      index,
      x: pos.x,
      y: pos.y,
      towerId: null,
    })));
  }

  /**
   * Get current game state (readonly)
   * @returns {Readonly<GameState>}
   */
  get state() {
    return this._state;
  }

  /**
   * Get tower slots (readonly)
   * @returns {Readonly<Array>}
   */
  get towerSlots() {
    return this._towerSlots;
  }

  /**
   * Get a snapshot of current game state
   * @returns {Readonly<GameState>}
   */
  getSnapshot() {
    return this._state;
  }

  /**
   * Build a tower on a slot
   * @param {number} slotIndex - Slot index (0-6)
   * @param {string} towerType - Tower type from TowerType
   * @returns {CommandResult}
   */
  buildTower(slotIndex, towerType) {
    // Validate slot index
    if (slotIndex < 0 || slotIndex >= this._towerSlots.length) {
      return { ok: false, code: 'INVALID_TOWER' };
    }

    // Validate tower type
    if (!TOWER_STATS[towerType]) {
      return { ok: false, code: 'INVALID_TOWER' };
    }

    const slot = this._towerSlots[slotIndex];

    // Check if slot is already occupied
    if (slot.towerId !== null) {
      return { ok: false, code: 'SLOT_OCCUPIED' };
    }

    const spec = TOWER_STATS[towerType];

    // Check if player has enough gold
    if (this._state.gold < spec.cost) {
      return { ok: false, code: 'INSUFFICIENT_GOLD' };
    }

    // Create tower data for the state machine (include full spec for sell refund)
    const towerData = {
      type: towerType,
      slotId: slotIndex,
      x: slot.x,
      y: slot.y,
      cost: spec.cost,
      damage: spec.damage,
      range: spec.range,
      attackInterval: spec.interval,
      projectileSpeed: spec.projectileSpeed,
    };

    // Transition state - deduct gold and add tower
    const newState = transitionGameState(this._state, GameEvent.BUILD, {
      towerCost: spec.cost,
      towerData,
    });

    // Update tower slot
    const newSlots = this._towerSlots.map((s, i) => {
      if (i === slotIndex) {
        return Object.freeze({ ...s, towerId: `tower-slot-${slotIndex}` });
      }
      return s;
    });

    this._state = Object.freeze(newState);
    this._towerSlots = Object.freeze(newSlots);

    return { ok: true, snapshot: this._state };
  }

  /**
   * Sell a tower from a slot
   * @param {number} slotIndex - Slot index (0-6)
   * @returns {CommandResult}
   */
  sellTower(slotIndex) {
    // Validate slot index
    if (slotIndex < 0 || slotIndex >= this._towerSlots.length) {
      return { ok: false, code: 'INVALID_TOWER' };
    }

    const slot = this._towerSlots[slotIndex];

    // Check if slot is empty
    if (slot.towerId === null) {
      return { ok: false, code: 'SLOT_EMPTY' };
    }

    // Find the tower in state
    const tower = this._state.towers.find(t => t.id === slot.towerId);
    if (!tower) {
      return { ok: false, code: 'SLOT_EMPTY' };
    }

    // Calculate refund (60% of cost, floored)
    const refundAmount = Math.floor(tower.cost * PLAYER_CONFIG.sellRefundRate);

    // Transition state - add refund and remove tower
    const newState = transitionGameState(this._state, GameEvent.SELL, {
      towerId: slot.towerId,
      refundAmount,
    });

    // Update tower slot
    const newSlots = this._towerSlots.map((s, i) => {
      if (i === slotIndex) {
        return Object.freeze({ ...s, towerId: null });
      }
      return s;
    });

    this._state = Object.freeze(newState);
    this._towerSlots = Object.freeze(newSlots);

    return { ok: true, snapshot: this._state, refund: refundAmount };
  }
}
