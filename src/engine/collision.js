// Collision and damage calculation - pure functions, no Canvas/DOM dependencies

/**
 * Calculate damage after armor/magic resistance.
 * Physical: max(1, baseDamage - enemy.armor)
 * Magic: max(1, baseDamage - enemy.magicRes)
 * Returns at least 1.
 *
 * @param {number} baseDamage - Base damage value
 * @param {'physical' | 'magic'} damageType - Type of damage
 * @param {Enemy} enemy - The enemy being damaged
 * @returns {number} Final damage (minimum 1)
 */
export function calculateDamage(baseDamage, damageType, enemy) {
  if (damageType === 'physical') {
    return Math.max(1, baseDamage - enemy.armor);
  } else if (damageType === 'magic') {
    return Math.max(1, baseDamage - enemy.magicRes);
  }
  // Fallback for unknown damage type - no reduction
  return Math.max(1, baseDamage);
}
