// Centralized entity ID generation - one place for stable, predictable IDs.
// Spec §6.3 requires stable ID formats (e.g. enemy-1, tower-slot-3, projectile-18, effect-7).
// Counters are module-scoped so a fresh game session can reset() them for determinism.

let _enemyCounter = 0;
let _towerCounter = 0;
let _projectileCounter = 0;
let _effectCounter = 0;

/**
 * Allocate a stable enemy ID like "enemy-1". Pass an existing ID to keep it
 * (the caller's counter won't bump in that case).
 * @param {string} [existingId]
 * @returns {string}
 */
export function nextEnemyId(existingId) {
  if (existingId) return existingId;
  _enemyCounter += 1;
  return `enemy-${_enemyCounter}`;
}

/**
 * Allocate a stable tower ID like "tower-slot-3". Use the slot index to keep
 * IDs deterministic across sessions (so re-loading a saved layout would work
 * later).
 * @param {number} slotIndex
 * @returns {string}
 */
export function towerIdForSlot(slotIndex) {
  if (slotIndex === undefined || slotIndex === null || Number.isNaN(slotIndex)) {
    throw new Error('towerIdForSlot requires a numeric slotIndex');
  }
  return `tower-slot-${slotIndex}`;
}

/**
 * Allocate a fresh tower ID like "tower-7" (for instances not bound to slots).
 * @returns {string}
 */
export function nextTowerId() {
  _towerCounter += 1;
  return `tower-${_towerCounter}`;
}

/**
 * Allocate a stable projectile ID like "projectile-18".
 * @param {string} [existingId]
 * @returns {string}
 */
export function nextProjectileId(existingId) {
  if (existingId) return existingId;
  _projectileCounter += 1;
  return `projectile-${_projectileCounter}`;
}

/**
 * Allocate a stable effect ID like "effect-7".
 * @param {string} [existingId]
 * @returns {string}
 */
export function nextEffectId(existingId) {
  if (existingId) return existingId;
  _effectCounter += 1;
  return `effect-${_effectCounter}`;
}

/**
 * Reset all counters - use at game start/restart for deterministic testing.
 * @param {{enemy?: number, tower?: number, projectile?: number, effect?: number}} [counts]
 */
export function resetIdCounters(counts = {}) {
  _enemyCounter = counts.enemy || 0;
  _towerCounter = counts.tower || 0;
  _projectileCounter = counts.projectile || 0;
  _effectCounter = counts.effect || 0;
}
