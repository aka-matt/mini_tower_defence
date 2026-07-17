// Pure state machine for game state transitions
// No DOM or Canvas dependencies - pure function with no side effects

import { PLAYER_CONFIG } from '../config/game-config.js';
import { totalWaves } from '../config/waves.js';

// Game states
export const GameStateType = Object.freeze({
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  WON: 'won',
  LOST: 'lost',
  DESTROYED: 'destroyed',
});

// Events
export const GameEvent = Object.freeze({
  START: 'start',
  PAUSE: 'pause',
  RESUME: 'resume',
  WAVE_COMPLETE: 'wave_complete',
  ENEMY_LEAK: 'enemy_leak',
  BUILD: 'build',
  SELL: 'sell',
  WIN: 'win',
  LOSE: 'lose',
  RESTART: 'restart',
});

/**
 * Creates the initial game state
 * @returns {GameState} Frozen initial state
 */
export function createInitialState() {
  return Object.freeze({
    state: GameStateType.IDLE,
    gold: PLAYER_CONFIG.initialGold,
    lives: PLAYER_CONFIG.initialLives,
    wave: 0,
    elapsedMs: 0,
    score: 0,
    towers: [],
    enemies: [],
    projectiles: [],
    effects: [],
  });
}

/**
 * Deep freeze an object recursively
 */
function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      deepFreeze(obj[key]);
    }
  });
  return Object.freeze(obj);
}

/**
 * Transitions game state based on event (pure function)
 * @param {GameState} state - Current game state
 * @param {string} event - Event type
 * @param {Object} payload - Optional event payload
 * @returns {GameState} New game state (frozen)
 */
export function transitionGameState(state, event, payload = {}) {
  const { state: currentState, lives, wave, gold, towers } = state;

  switch (event) {
    case GameEvent.START:
      if (currentState === GameStateType.IDLE) {
        return deepFreeze({ ...state, state: GameStateType.RUNNING });
      }
      break;

    case GameEvent.PAUSE:
      if (currentState === GameStateType.RUNNING) {
        return deepFreeze({ ...state, state: GameStateType.PAUSED });
      }
      break;

    case GameEvent.RESUME:
      if (currentState === GameStateType.PAUSED) {
        return deepFreeze({ ...state, state: GameStateType.RUNNING });
      }
      break;

    case GameEvent.WAVE_COMPLETE:
      if (currentState === GameStateType.RUNNING) {
        const nextWave = wave + 1;
        if (nextWave > totalWaves) {
          // All waves completed - win
          return deepFreeze({ ...state, state: GameStateType.WON, wave: totalWaves });
        }
        return deepFreeze({ ...state, wave: nextWave });
      }
      break;

    case GameEvent.ENEMY_LEAK:
      if (currentState === GameStateType.RUNNING) {
        const newLives = lives - (payload.leakDamage || 1);
        if (newLives <= 0) {
          return deepFreeze({ ...state, lives: 0, state: GameStateType.LOST });
        }
        return deepFreeze({ ...state, lives: newLives });
      }
      break;

    case GameEvent.BUILD:
      if (currentState === GameStateType.IDLE || currentState === GameStateType.RUNNING) {
        const { towerCost, towerData } = payload;
        if (gold >= towerCost) {
          const newTowers = [...towers, { ...towerData, id: `tower-slot-${towerData.slotId}` }];
          return deepFreeze({ ...state, gold: gold - towerCost, towers: newTowers });
        }
      }
      break;

    case GameEvent.SELL:
      if (currentState === GameStateType.IDLE || currentState === GameStateType.RUNNING) {
        const { towerId, refundAmount } = payload;
        const newTowers = towers.filter(t => t.id !== towerId);
        return deepFreeze({ ...state, gold: gold + refundAmount, towers: newTowers });
      }
      break;

    case GameEvent.WIN:
      if (currentState === GameStateType.RUNNING) {
        return deepFreeze({ ...state, state: GameStateType.WON });
      }
      break;

    case GameEvent.LOSE:
      if (currentState === GameStateType.RUNNING) {
        return deepFreeze({ ...state, state: GameStateType.LOST });
      }
      break;

    case GameEvent.RESTART:
      return createInitialState();
  }

  // Invalid transitions return current state unchanged
  return state;
}
