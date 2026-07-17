// Game engine - orchestrates game state, tower management, and commands
// Wraps state machine with tower slot management

import { TOWER_STATS, TowerType, PLAYER_CONFIG } from '../config/game-config.js';
import { TOWER_SLOTS } from '../config/map-config.js';
import { createInitialState, transitionGameState, GameEvent, GameStateType } from './state-machine.js';
import { selectTarget } from './targeting.js';
import { calculateDamage } from './collision.js';
import { createProjectile, advanceProjectile, resetProjectileIdCounter } from '../entities/projectile.js';
import { damageEnemy } from '../entities/enemy.js';
import { samplePath } from './path.js';

/**
 * @typedef {Object} CommandResult
 * @property {boolean} ok - Whether the command succeeded
 * @property {Object} [snapshot] - Game snapshot on success
 * @property {string} [code] - Error code on failure
 */

/**
 * GameEngine - manages game state and tower operations
 */
export class GameEngine {
  constructor() {
    this._state = createInitialState();
    this._towerSlots = Object.freeze(TOWER_SLOTS.map((pos, index) => Object.freeze({
      index,
      x: pos.x,
      y: pos.y,
      towerId: null,
    })));
    // Tower cooldown tracking: Map<towerId, cooldownRemaining>
    this._towerCooldowns = new Map();
    // Reset projectile ID counter for deterministic behavior
    resetProjectileIdCounter(0);
  }

  /**
   * Get current game state (readonly)
   * @returns {Readonly<GameState>}
   */
  get state() {
    return this._state;
  }

  /**
   * Get tower slots (readonly)
   * @returns {Readonly<Array>}
   */
  get towerSlots() {
    return this._towerSlots;
  }

  /**
   * Get a snapshot of current game state
   * @returns {Readonly<GameState>}
   */
  getSnapshot() {
    return this._state;
  }

  /**
   * Build a tower on a slot
   * @param {number} slotIndex - Slot index (0-6)
   * @param {string} towerType - Tower type from TowerType
   * @returns {CommandResult}
   */
  buildTower(slotIndex, towerType) {
    // Validate slot index
    if (slotIndex < 0 || slotIndex >= this._towerSlots.length) {
      return { ok: false, code: 'INVALID_TOWER' };
    }

    // Validate tower type
    if (!TOWER_STATS[towerType]) {
      return { ok: false, code: 'INVALID_TOWER' };
    }

    const slot = this._towerSlots[slotIndex];

    // Check if slot is already occupied
    if (slot.towerId !== null) {
      return { ok: false, code: 'SLOT_OCCUPIED' };
    }

    const spec = TOWER_STATS[towerType];

    // Check if player has enough gold
    if (this._state.gold < spec.cost) {
      return { ok: false, code: 'INSUFFICIENT_GOLD' };
    }

    // Create tower data for the state machine (include full spec for sell refund)
    const towerData = {
      type: towerType,
      slotId: slotIndex,
      x: slot.x,
      y: slot.y,
      cost: spec.cost,
      damage: spec.damage,
      range: spec.range,
      attackInterval: spec.interval,
      projectileSpeed: spec.projectileSpeed,
    };

    // Transition state - deduct gold and add tower
    const newState = transitionGameState(this._state, GameEvent.BUILD, {
      towerCost: spec.cost,
      towerData,
    });

    // Update tower slot
    const newSlots = this._towerSlots.map((s, i) => {
      if (i === slotIndex) {
        return Object.freeze({ ...s, towerId: `tower-slot-${slotIndex}` });
      }
      return s;
    });

    this._state = Object.freeze(newState);
    this._towerSlots = Object.freeze(newSlots);

    return { ok: true, snapshot: this._state };
  }

  /**
   * Sell a tower from a slot
   * @param {number} slotIndex - Slot index (0-6)
   * @returns {CommandResult}
   */
  sellTower(slotIndex) {
    // Validate slot index
    if (slotIndex < 0 || slotIndex >= this._towerSlots.length) {
      return { ok: false, code: 'INVALID_TOWER' };
    }

    const slot = this._towerSlots[slotIndex];

    // Check if slot is empty
    if (slot.towerId === null) {
      return { ok: false, code: 'SLOT_EMPTY' };
    }

    // Find the tower in state
    const tower = this._state.towers.find(t => t.id === slot.towerId);
    if (!tower) {
      return { ok: false, code: 'SLOT_EMPTY' };
    }

    // Calculate refund (60% of cost, floored)
    const refundAmount = Math.floor(tower.cost * PLAYER_CONFIG.sellRefundRate);

    // Transition state - add refund and remove tower
    const newState = transitionGameState(this._state, GameEvent.SELL, {
      towerId: slot.towerId,
      refundAmount,
    });

    // Update tower slot
    const newSlots = this._towerSlots.map((s, i) => {
      if (i === slotIndex) {
        return Object.freeze({ ...s, towerId: null });
      }
      return s;
    });

    this._state = Object.freeze(newState);
    this._towerSlots = Object.freeze(newSlots);

    return { ok: true, snapshot: this._state, refund: refundAmount };
  }

  /**
   * Tick the game engine - process tower attacks and projectile movement.
   * @param {number} deltaSeconds - Time elapsed in seconds
   * @param {Enemy[]} enemies - Current enemies in the game
   * @param {PathModel} path - The path enemies follow
   * @returns {{enemies: Enemy[], events: Array}} Updated enemies and events that occurred
   */
  tick(deltaSeconds, enemies, path) {
    if (this._state.state !== GameStateType.RUNNING) {
      return { enemies, events: [] };
    }

    const events = [];
    let updatedEnemies = [...enemies];
    let newProjectiles = [...this._state.projectiles];

    // Helper to find enemy by ID
    const findEnemyById = (id) => {
      return updatedEnemies.find(e => e.id === id) || null;
    };

    // Helper to update enemy in array
    const updateEnemy = (updatedEnemy) => {
      updatedEnemies = updatedEnemies.map(e =>
        e.id === updatedEnemy.id ? updatedEnemy : e
      );
    };

    // 1. Update tower cooldowns and process attacks
    for (const tower of this._state.towers) {
      if (!tower.alive) {
        continue;
      }

      // Get or initialize cooldown
      let cooldown = this._towerCooldowns.get(tower.id) || 0;
      cooldown = Math.max(0, cooldown - deltaSeconds);

      // Check if tower can attack
      if (cooldown === 0) {
        // Select target
        const target = selectTarget(tower, updatedEnemies, path);

        if (target !== null) {
          // Get target position
          const targetPos = samplePath(path, target.distance);

          // Create projectile
          const projectile = createProjectile(
            {
              speed: tower.projectileSpeed,
              damage: tower.damage,
              damageType: tower.type === TowerType.ARCHER ? 'physical' : 'magic',
            },
            target.id,
            { x: targetPos.x, y: targetPos.y }
          );

          newProjectiles = [...newProjectiles, projectile];

          // Reset cooldown
          cooldown = tower.attackInterval;

          events.push({ type: 'tower-attack', towerId: tower.id, targetId: target.id });
        }
      }

      this._towerCooldowns.set(tower.id, cooldown);
    }

    // 2. Advance projectiles
    const advancedProjectiles = [];
    for (const projectile of newProjectiles) {
      if (!projectile.alive) {
        continue;
      }

      // Update lastKnownPos if target exists
      const target = findEnemyById(projectile.targetId);
      let projectileWithUpdatedTarget = projectile;
      if (target !== null && target.alive) {
        const targetPos = samplePath(path, target.distance);
        projectileWithUpdatedTarget = Object.freeze({
          ...projectile,
          lastKnownPos: { x: targetPos.x, y: targetPos.y },
        });
      }

      const result = advanceProjectile(
        projectileWithUpdatedTarget,
        deltaSeconds,
        findEnemyById
      );

      if (result.hit) {
        // Apply damage to target
        const hitTarget = findEnemyById(projectile.targetId);
        if (hitTarget !== null && hitTarget.alive) {
          const damage = calculateDamage(projectile.damage, projectile.damageType, hitTarget);
          const damagedEnemy = damageEnemy(hitTarget, damage, projectile.damageType === 'physical');
          updateEnemy(damagedEnemy);

          events.push({
            type: 'projectile-hit',
            projectileId: projectile.id,
            targetId: projectile.targetId,
            damage,
          });

          // Check if enemy died
          if (!damagedEnemy.alive) {
            // Award gold
            const newState = transitionGameState(this._state, GameEvent.ENEMY_KILL, {
              reward: hitTarget.reward,
            });
            this._state = Object.freeze(newState);

            events.push({
              type: 'enemy-killed',
              enemyId: hitTarget.id,
              reward: hitTarget.reward,
            });
          }
        }
      } else {
        advancedProjectiles.push(result.projectile);
      }
    }

    // Update state with new projectiles
    this._state = Object.freeze({
      ...this._state,
      projectiles: Object.freeze(advancedProjectiles),
    });

    return { enemies: updatedEnemies, events };
  }

  /**
   * Reset the engine to initial state
   */
  reset() {
    this._state = createInitialState();
    this._towerCooldowns.clear();
    resetProjectileIdCounter(0);
  }
}
