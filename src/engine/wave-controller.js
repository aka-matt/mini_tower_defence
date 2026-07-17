// Wave controller - manages wave progression and enemy spawning
// Pure function with no side effects

import { ENEMY_STATS } from '../config/game-config.js';
import { nextEnemyId } from './ids.js';

/**
 * Create a wave controller
 * @param {Wave[]} waves - Array of wave definitions from waves.js
 * @returns {WaveController} Frozen controller object
 */
export function createWaveController(waves) {
  return Object.freeze({
    waves: Object.freeze([...waves]),
    currentWaveIndex: 0,      // 0-indexed, points to current wave
    state: Object.freeze({
      phase: 'idle',          // 'idle' | 'prep' | 'spawning' | 'wave_complete' | 'all_complete'
      prepTimeRemaining: 0,
      spawnTimer: 0,
      spawnedCount: 0,
      spawningStopped: false,
    }),
  });
}

/**
 * Spawn a single enemy
 * @param {Wave} wave - Current wave definition
 * @param {number} spawnedCount - Current spawned count (before this spawn)
 * @returns {Object} Spawn object with id, type, and spec
 */
function spawnEnemy(wave, spawnedCount) {
  const enemyType = wave.enemies[spawnedCount];
  const enemySpec = ENEMY_STATS[enemyType];
  return {
    id: nextEnemyId(),
    type: enemyType,
    spec: { ...enemySpec, type: enemyType },
  };
}

/**
 * Update wave controller - pure function
 * @param {WaveController} controller - Current controller
 * @param {number} deltaSeconds - Time elapsed in seconds
 * @param {number} aliveEnemyCount - Number of alive enemies currently in game
 * @returns {{controller: WaveController, spawns: Enemy[], events: WaveEvent[]}}
 */
export function updateWaveController(controller, deltaSeconds, aliveEnemyCount) {
  // If all waves complete or spawning stopped, return unchanged
  if (controller.state.phase === 'all_complete' || controller.state.spawningStopped) {
    return {
      controller,
      spawns: [],
      events: [],
    };
  }

  const { waves, currentWaveIndex, state } = controller;
  const currentWave = waves[currentWaveIndex];

  // If we don't have a current wave (shouldn't happen unless waves array is empty)
  if (!currentWave) {
    return {
      controller: Object.freeze({
        ...controller,
        state: Object.freeze({ ...state, phase: 'all_complete' }),
      }),
      spawns: [],
      events: [],
    };
  }

  // Track changes to return a new frozen controller
  let newPhase = state.phase;
  let newPrepTimeRemaining = state.prepTimeRemaining;
  let newSpawnTimer = state.spawnTimer;
  let newSpawnedCount = state.spawnedCount;
  let newCurrentWaveIndex = currentWaveIndex;
  const events = [];
  const spawns = [];

  switch (state.phase) {
    case 'idle': {
      // Start prep phase for first wave - deduct delta immediately
      const prepTime = currentWave.prepTime - deltaSeconds;
      newSpawnTimer = 0;
      newSpawnedCount = 0;
      if (prepTime <= 0) {
        // Prep completed in same tick, start spawning
        newPhase = 'spawning';
        newPrepTimeRemaining = 0;
        events.push({ type: 'wave_start', wave: currentWaveIndex + 1 });
        // Spawn first enemy immediately
        if (newSpawnedCount < currentWave.enemies.length) {
          spawns.push(spawnEnemy(currentWave, newSpawnedCount));
          newSpawnedCount++;
          newSpawnTimer = 0; // Reset so spawning case spawns at correct intervals
        }
      } else {
        newPhase = 'prep';
        newPrepTimeRemaining = prepTime;
      }
      break;
    }

    case 'prep': {
      // Countdown prep timer
      newPrepTimeRemaining -= deltaSeconds;
      if (newPrepTimeRemaining <= 0) {
        // Prep complete, start spawning
        newPhase = 'spawning';
        newPrepTimeRemaining = 0;
        newSpawnTimer = 0;
        newSpawnedCount = 0;
        events.push({ type: 'wave_start', wave: currentWaveIndex + 1 });
        // Spawn first enemy immediately
        if (newSpawnedCount < currentWave.enemies.length) {
          spawns.push(spawnEnemy(currentWave, newSpawnedCount));
          newSpawnedCount++;
          newSpawnTimer = 0; // Reset so spawning case spawns at correct intervals
        }
      }
      break;
    }

    case 'spawning': {
      // First, check if wave should complete BEFORE processing new spawns
      // This allows wave_complete to be emitted in the same tick when last enemy died
      if (newSpawnedCount >= currentWave.enemies.length && (aliveEnemyCount ?? 0) === 0) {
        // Wave complete - all enemies spawned and none alive
        newPhase = 'wave_complete';
        events.push({ type: 'wave_complete', wave: currentWaveIndex + 1 });

        // Check if this was the last wave
        if (currentWaveIndex >= waves.length - 1) {
          newPhase = 'all_complete';
          events.push({ type: 'all_waves_complete' });
        }
        break;
      }

      // Accumulate spawn timer and spawn
      newSpawnTimer += deltaSeconds;

      // Check if it's time to spawn
      while (newSpawnTimer >= currentWave.interval && newSpawnedCount < currentWave.enemies.length) {
        newSpawnTimer -= currentWave.interval;
        spawns.push(spawnEnemy(currentWave, newSpawnedCount));
        newSpawnedCount++;
      }
      break;
    }

    case 'wave_complete': {
      // Transition to next wave's prep phase - do NOT deduct delta on this tick
      const nextWaveIndex = currentWaveIndex + 1;
      if (nextWaveIndex < waves.length) {
        const nextWave = waves[nextWaveIndex];
        newCurrentWaveIndex = nextWaveIndex;
        newPhase = 'prep';
        newPrepTimeRemaining = nextWave.prepTime; // Full prep time, no delta deduction
        newSpawnTimer = 0;
        newSpawnedCount = 0;
        // Note: we don't emit wave_start here - it will be emitted when prep ends
      } else {
        newPhase = 'all_complete';
        events.push({ type: 'all_waves_complete' });
      }
      break;
    }
  }

  // Build the new state object
  const newState = Object.freeze({
    phase: newPhase,
    prepTimeRemaining: Math.max(0, newPrepTimeRemaining),
    spawnTimer: newSpawnTimer,
    spawnedCount: newSpawnedCount,
    spawningStopped: state.spawningStopped,
  });

  const newController = Object.freeze({
    ...controller,
    currentWaveIndex: newCurrentWaveIndex,
    state: newState,
  });

  return {
    controller: newController,
    spawns,
    events,
  };
}

/**
 * Stop spawning (called when lives reach 0)
 * @param {WaveController} controller - Current controller
 * @returns {WaveController} New controller with spawning stopped
 */
export function stopWaveController(controller) {
  if (controller.state.spawningStopped || controller.state.phase === 'all_complete') {
    return controller;
  }

  return Object.freeze({
    ...controller,
    state: Object.freeze({
      ...controller.state,
      spawningStopped: true,
    }),
  });
}

/**
 * Get current wave number (1-indexed)
 * @param {WaveController} controller
 * @returns {number}
 */
export function getCurrentWaveNumber(controller) {
  return controller.currentWaveIndex + 1;
}

/**
 * Check if wave controller is in prep phase
 * @param {WaveController} controller
 * @returns {boolean}
 */
export function isInPrepPhase(controller) {
  return controller.state.phase === 'prep';
}

/**
 * Get prep time remaining for current wave
 * @param {WaveController} controller
 * @returns {number}
 */
export function getPrepTimeRemaining(controller) {
  return controller.state.prepTimeRemaining;
}
