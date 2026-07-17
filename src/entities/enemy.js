// Enemy entity - pure functions, no Canvas/DOM dependencies
// Enemies move along the path and can leak if they reach the end

/**
 * Create an enemy from a spec and ID.
 * @param {EnemySpec} spec - Enemy specification from ENEMY_STATS
 * @param {string} id - Stable unique ID (e.g., 'enemy-1')
 * @returns {Enemy} Frozen enemy object
 */
export function createEnemy(spec, id) {
  return Object.freeze({
    id,
    type: spec.type || 'unknown',
    hp: spec.hp,
    maxHp: spec.hp,
    speed: spec.speed,
    armor: spec.armor,
    magicRes: spec.magicRes,
    reward: spec.reward,
    leakDamage: spec.leakDamage,
    alive: true,
    distance: 0,
  });
}

/**
 * Advance an enemy along the path.
 * @param {Enemy} enemy - The enemy to move
 * @param {number} deltaSeconds - Time elapsed in seconds
 * @param {PathModel} path - The path to follow
 * @returns {{enemy: Enemy, leaked: boolean, distanceDelta: number}}
 */
export function advanceEnemy(enemy, deltaSeconds, path) {
  // If already dead or leaked, return as-is with no movement
  if (!enemy.alive) {
    return {
      enemy,
      leaked: false,
      distanceDelta: 0,
    };
  }

  const distanceDelta = enemy.speed * deltaSeconds;
  const newDistance = enemy.distance + distanceDelta;
  const pathEnd = path.totalLength;

  // Check if enemy reaches or exceeds path end
  if (newDistance >= pathEnd) {
    const updatedEnemy = Object.freeze({
      ...enemy,
      alive: false,
      distance: pathEnd,
    });

    return {
      enemy: updatedEnemy,
      leaked: true,
      distanceDelta: pathEnd - enemy.distance,
    };
  }

  // Normal movement - return new enemy with updated distance
  const updatedEnemy = Object.freeze({
    ...enemy,
    distance: newDistance,
  });

  return {
    enemy: updatedEnemy,
    leaked: false,
    distanceDelta,
  };
}

/**
 * Apply damage to an enemy.
 * @param {Enemy} enemy - The enemy to damage
 * @param {number} damage - Damage amount
 * @param {boolean} isPhysical - True for physical damage, false for magic
 * @returns {Enemy} Updated enemy (may be dead)
 */
export function damageEnemy(enemy, damage, isPhysical) {
  if (!enemy.alive) {
    return enemy;
  }

  const effectiveDamage = isPhysical
    ? Math.max(1, damage - enemy.armor)
    : Math.max(1, damage - enemy.magicRes);

  const newHp = enemy.hp - effectiveDamage;

  if (newHp <= 0) {
    return Object.freeze({
      ...enemy,
      hp: 0,
      alive: false,
    });
  }

  return Object.freeze({
    ...enemy,
    hp: newHp,
  });
}
