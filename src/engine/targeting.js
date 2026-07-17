// Targeting logic - pure functions, no Canvas/DOM dependencies
// Towers select the furthest-along-path enemy within range

import { samplePath } from './path.js';

/**
 * Calculate distance between two points.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number} Euclidean distance
 */
function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Select the target enemy for a tower.
 * Selects the enemy with highest pathProgress within tower's range.
 * Tiebreak: lowest ID wins.
 * Returns null if no enemy in range.
 *
 * @param {Tower} tower - The tower seeking a target
 * @param {Enemy[]} enemies - Array of enemies to select from
 * @param {PathModel} path - The path for progress calculation
 * @returns {Enemy | null} The selected enemy or null
 */
export function selectTarget(tower, enemies, path) {
  if (!tower.alive) {
    return null;
  }

  let bestTarget = null;
  let bestProgress = -1;

  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    // Get enemy position along path
    const pos = samplePath(path, enemy.distance);
    const dist = distance(tower.x, tower.y, pos.x, pos.y);

    // Check if enemy is within tower's range
    if (dist > tower.range) {
      continue;
    }

    // Calculate path progress (0 to 1)
    const progress = pos.progress;

    // Select enemy with highest progress
    // Tiebreak: lowest ID wins (determined by string comparison with numeric suffix)
    if (progress > bestProgress) {
      bestProgress = progress;
      bestTarget = enemy;
    } else if (progress === bestProgress && bestTarget !== null) {
      // Tiebreak: lower ID wins
      // Extract numeric part of IDs for comparison
      const currentIdNum = parseInt(enemy.id.replace(/\D/g, ''), 10);
      const bestIdNum = parseInt(bestTarget.id.replace(/\D/g, ''), 10);
      if (currentIdNum < bestIdNum) {
        bestTarget = enemy;
      }
    }
  }

  return bestTarget;
}
