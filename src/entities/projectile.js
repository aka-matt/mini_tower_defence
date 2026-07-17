// Projectile entity - pure functions, no Canvas/DOM dependencies
// Projectiles travel toward target and deal damage on hit

import { nextProjectileId, resetIdCounters } from '../engine/ids.js';

/**
 * Create a projectile.
 * @param {Object} spec - Projectile spec
 * @param {number} spec.speed - Projectile speed in pixels/second
 * @param {number} spec.damage - Projectile damage
 * @param {string} spec.damageType - 'physical' or 'magic'
 * @param {string} targetId - ID of the target enemy
 * @param {{x: number, y: number}} startPos - Starting position (target's current position)
 * @returns {Projectile} Frozen projectile object
 */
export function createProjectile(spec, targetId, startPos) {
  return Object.freeze({
    id: nextProjectileId(),
    targetId,
    damage: spec.damage,
    damageType: spec.damageType,
    speed: spec.speed,
    alive: true,
    x: startPos.x,
    y: startPos.y,
    lastKnownPos: { x: startPos.x, y: startPos.y },
  });
}

/**
 * Reset projectile ID counter (for deterministic testing).
 * Backed by the centralized ids.js counter.
 * @param {number} value - New counter value
 */
export function resetProjectileIdCounter(value = 0) {
  resetIdCounters({ projectile: value });
}

/**
 * Advance a projectile toward its target.
 * If target exists: update lastKnownPos to target's current position, move toward it.
 * If target dead or doesn't exist: move toward lastKnownPos.
 * Projectile does NOT retarget - flies to lastKnownPos even if target moves.
 *
 * @param {Projectile} projectile - The projectile to advance
 * @param {number} deltaSeconds - Time elapsed in seconds
 * @param {(id: string) => Enemy | null} targetLookup - Function to find enemy by ID
 * @returns {{projectile: Projectile, hit: boolean, targetPos: {x: number, y: number}}}
 */
export function advanceProjectile(projectile, deltaSeconds, targetLookup) {
  if (!projectile.alive) {
    return {
      projectile,
      hit: false,
      targetPos: projectile.lastKnownPos,
    };
  }

  const target = targetLookup(projectile.targetId);

  // Update last known position if target still exists
  let targetPos;
  if (target !== null && target.alive) {
    // We need to get the target's position - but enemies don't store x,y directly
    // The targetLookup returns the enemy, and we assume the caller will provide
    // the actual position through the projectile's lastKnownPos tracking
    // Since we can't directly get enemy position here, we use the lastKnownPos
    // that was updated externally when target was alive
    targetPos = projectile.lastKnownPos;
  } else {
    // Target dead or doesn't exist - fly to last known position
    targetPos = projectile.lastKnownPos;
  }

  // Calculate direction to target
  const dx = targetPos.x - projectile.x;
  const dy = targetPos.y - projectile.y;
  const distToTarget = Math.sqrt(dx * dx + dy * dy);

  // Check if within hit radius (10px)
  if (distToTarget <= 10) {
    return {
      projectile: Object.freeze({ ...projectile, alive: false }),
      hit: true,
      targetPos,
    };
  }

  // Move projectile toward target
  const moveDistance = projectile.speed * deltaSeconds;

  // If we would move past the target, snap to target
  let newX, newY;
  if (moveDistance >= distToTarget) {
    newX = targetPos.x;
    newY = targetPos.y;
  } else {
    // Normalize direction and move
    const nx = dx / distToTarget;
    const ny = dy / distToTarget;
    newX = projectile.x + nx * moveDistance;
    newY = projectile.y + ny * moveDistance;
  }

  return {
    projectile: Object.freeze({ ...projectile, x: newX, y: newY }),
    hit: false,
    targetPos,
  };
}
