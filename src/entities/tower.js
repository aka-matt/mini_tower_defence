// Tower entity - pure functions, no Canvas/DOM dependencies
// Towers attack enemies and can be sold for a refund

/**
 * Create a tower from a spec and slot ID.
 * @param {TowerSpec} spec - Tower specification from TOWER_STATS
 * @param {string} slotId - The slot index (0-6)
 * @param {string} id - Stable unique ID (e.g., 'tower-slot-3')
 * @returns {Tower} Frozen tower object
 */
export function createTower(spec, slotId, id) {
  return Object.freeze({
    id,
    slotId,
    type: spec.type,
    cost: spec.cost,
    damage: spec.damage,
    range: spec.range,
    attackInterval: spec.interval,
    projectileSpeed: spec.projectileSpeed,
    alive: true,
  });
}

/**
 * Advance a tower's cooldown timer.
 * @param {Tower} tower - The tower to advance
 * @param {number} deltaSeconds - Time elapsed in seconds
 * @returns {{tower: Tower, cooldownRemaining: number}} New tower state and remaining cooldown
 */
export function advanceTower(tower, deltaSeconds) {
  if (!tower.alive) {
    return {
      tower,
      cooldownRemaining: 0,
    };
  }

  // Tower cooldown tracking would be handled at game level
  // This function is provided for interface completeness
  return {
    tower,
    cooldownRemaining: 0,
  };
}
