// Wave definitions - enemy composition and timing
// Object.freeze() applied to all values

import { EnemyType } from './game-config.js';

export const totalWaves = 5;

export const WAVES = Object.freeze([
  // Wave 1: 8 soldiers
  Object.freeze({
    wave: 1,
    enemies: Object.freeze([
      EnemyType.SOLDIER, EnemyType.SOLDIER, EnemyType.SOLDIER, EnemyType.SOLDIER,
      EnemyType.SOLDIER, EnemyType.SOLDIER, EnemyType.SOLDIER, EnemyType.SOLDIER,
    ]),
    interval: 0.85, // seconds between spawns
    prepTime: 4,    // seconds before wave starts
  }),

  // Wave 2: 5 soldiers + 5 scouts
  Object.freeze({
    wave: 2,
    enemies: Object.freeze([
      EnemyType.SOLDIER, EnemyType.SOLDIER, EnemyType.SOLDIER, EnemyType.SOLDIER, EnemyType.SOLDIER,
      EnemyType.SCOUT, EnemyType.SCOUT, EnemyType.SCOUT, EnemyType.SCOUT, EnemyType.SCOUT,
    ]),
    interval: 0.75,
    prepTime: 4,
  }),

  // Wave 3: 8 soldiers + 3 armored
  Object.freeze({
    wave: 3,
    enemies: Object.freeze([
      EnemyType.SOLDIER, EnemyType.SOLDIER, EnemyType.SOLDIER, EnemyType.SOLDIER,
      EnemyType.SOLDIER, EnemyType.SOLDIER, EnemyType.SOLDIER, EnemyType.SOLDIER,
      EnemyType.ARMORED, EnemyType.ARMORED, EnemyType.ARMORED,
    ]),
    interval: 0.90,
    prepTime: 5,
  }),

  // Wave 4: 8 scouts + 4 armored
  Object.freeze({
    wave: 4,
    enemies: Object.freeze([
      EnemyType.SCOUT, EnemyType.SCOUT, EnemyType.SCOUT, EnemyType.SCOUT,
      EnemyType.SCOUT, EnemyType.SCOUT, EnemyType.SCOUT, EnemyType.SCOUT,
      EnemyType.ARMORED, EnemyType.ARMORED, EnemyType.ARMORED, EnemyType.ARMORED,
    ]),
    interval: 0.70,
    prepTime: 5,
  }),

  // Wave 5: 8 soldiers + 8 scouts + 5 armored
  Object.freeze({
    wave: 5,
    enemies: Object.freeze([
      EnemyType.SOLDIER, EnemyType.SOLDIER, EnemyType.SOLDIER, EnemyType.SOLDIER,
      EnemyType.SOLDIER, EnemyType.SOLDIER, EnemyType.SOLDIER, EnemyType.SOLDIER,
      EnemyType.SCOUT, EnemyType.SCOUT, EnemyType.SCOUT, EnemyType.SCOUT,
      EnemyType.SCOUT, EnemyType.SCOUT, EnemyType.SCOUT, EnemyType.SCOUT,
      EnemyType.ARMORED, EnemyType.ARMORED, EnemyType.ARMORED, EnemyType.ARMORED,
      EnemyType.ARMORED,
    ]),
    interval: 0.62,
    prepTime: 5,
  }),
]);

export const WAVE_CONFIG = Object.freeze({
  WAVES,
  totalWaves,
});
