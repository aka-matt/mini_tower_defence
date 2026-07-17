// Effect entity - pure functions for visual effects
// Effects are transient visual elements like death puffs and hit sparks

import { nextEffectId, resetIdCounters } from '../engine/ids.js';

/**
 * Effect types available
 */
export const EffectType = Object.freeze({
  DEATH_PUFF: 'death-puff',
  HIT_SPARK: 'hit-spark',
});

/**
 * Create an effect at a position
 * @param {string} type - Effect type from EffectType
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} [id] - Optional stable unique ID
 * @returns {Effect} Frozen effect object
 */
export function createEffect(type, x, y, id) {
  return Object.freeze({
    id: id || nextEffectId(),
    type,
    x,
    y,
    alive: true,
    age: 0, // seconds since creation
    lifetime: type === EffectType.DEATH_PUFF ? 0.5 : 0.3, // seconds
  });
}

/**
 * Reset effect ID counter (for deterministic testing).
 * @param {number} value - New counter value
 */
export function resetEffectIdCounter(value = 0) {
  resetIdCounters({ effect: value });
}

/**
 * Advance an effect's animation
 * @param {Effect} effect - The effect to advance
 * @param {number} deltaSeconds - Time elapsed in seconds
 * @returns {{effect: Effect, alive: boolean}} Updated effect and alive status
 */
export function advanceEffect(effect, deltaSeconds) {
  if (!effect.alive) {
    return { effect, alive: false };
  }

  const newAge = effect.age + deltaSeconds;
  const alive = newAge < effect.lifetime;

  const updatedEffect = Object.freeze({
    ...effect,
    age: newAge,
    alive,
  });

  return { effect: updatedEffect, alive };
}

/**
 * Get the current progress (0-1) of an effect's lifetime
 * @param {Effect} effect - The effect
 * @returns {number} Progress from 0 (just created) to 1 (about to die)
 */
export function getEffectProgress(effect) {
  if (effect.lifetime === 0) {
    return 1;
  }
  return Math.min(1, effect.age / effect.lifetime);
}

/**
 * Get the visual scale of an effect at its current age
 * Death puffs expand then fade; hit sparks are quick flashes
 * @param {Effect} effect - The effect
 * @returns {number} Scale multiplier
 */
export function getEffectScale(effect) {
  const progress = getEffectProgress(effect);

  switch (effect.type) {
    case EffectType.DEATH_PUFF:
      // Expand to 1.5x then stay, with fade
      return 1 + progress * 0.5;

    case EffectType.HIT_SPARK:
      // Quick flash that shrinks
      return 1 - progress * 0.5;

    default:
      return 1;
  }
}

/**
 * Get the alpha (opacity) of an effect at its current age
 * @param {Effect} effect - The effect
 * @returns {number} Alpha from 0 (invisible) to 1 (fully visible)
 */
export function getEffectAlpha(effect) {
  const progress = getEffectProgress(effect);

  // Fade out in the last 50% of lifetime
  if (progress > 0.5) {
    return 1 - ((progress - 0.5) * 2);
  }

  return 1;
}
