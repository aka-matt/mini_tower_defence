// Game engine - orchestrates game state, tower management, and commands.
// Tick order follows spec §6.3: wave → enemy advance → tower → projectile →
// damage → effects → cleanup → win/lose.

import { TOWER_STATS, TowerType, PLAYER_CONFIG, ENEMY_STATS } from '../config/game-config.js';
import { TOWER_SLOTS } from '../config/map-config.js';
import { WAVES } from '../config/waves.js';
import {
  createInitialState,
  transitionGameState,
  GameEvent,
  GameStateType,
} from './state-machine.js';
import { createWaveController, updateWaveController, stopWaveController } from './wave-controller.js';
import { selectTarget } from './targeting.js';
import { calculateDamage } from './collision.js';
import { createProjectile, advanceProjectile } from '../entities/projectile.js';
import { createEnemy, damageEnemy, advanceEnemy } from '../entities/enemy.js';
import { createEffect, advanceEffect, EffectType } from '../entities/effect.js';
import { samplePath } from './path.js';
import { resetIdCounters } from './ids.js';

// Entity caps per spec §14 — refuse to crash, prefer to merge or skip non-critical.
// Critical entities (enemies, damage) are never capped; the spawn step in the
// wave controller relies on this.
export const ENTITY_CAPS = Object.freeze({
  ENEMIES: 40,
  PROJECTILES: 80,
  EFFECTS: 100,
});

/**
 * @typedef {Object} CommandResult
 * @property {boolean} ok - Whether the command succeeded
 * @property {Object} [snapshot] - Game snapshot on success
 * @property {string} [code] - Error code on failure
 * @property {number} [refund] - Gold refunded on successful sell
 */

/**
 * GameEngine - manages game state and tower operations.
 */
export class GameEngine {
  constructor() {
    this._state = createInitialState();
    this._towerSlots = Object.freeze(
      TOWER_SLOTS.map((pos, index) =>
        Object.freeze({
          index,
          x: pos.x,
          y: pos.y,
          towerId: null,
        })
      )
    );
    // Tower cooldown tracking: Map<towerId, cooldownRemaining>
    this._towerCooldowns = new Map();
    // Wave controller
    this._waveController = createWaveController(WAVES);
    // Reset all entity ID counters for a clean session
    resetIdCounters();
  }

  /** @returns {Readonly<GameState>} */
  get state() {
    return this._state;
  }

  /** @returns {Readonly<Array>} */
  get towerSlots() {
    return this._towerSlots;
  }

  /** @returns {Readonly<GameState>} */
  getSnapshot() {
    return this._state;
  }

  /**
   * Build a tower on a slot.
   * @param {number} slotIndex
   * @param {string} towerType
   * @returns {CommandResult}
   */
  buildTower(slotIndex, towerType) {
    if (slotIndex < 0 || slotIndex >= this._towerSlots.length) {
      return { ok: false, code: 'INVALID_TOWER' };
    }

    if (!TOWER_STATS[towerType]) {
      return { ok: false, code: 'INVALID_TOWER' };
    }

    const slot = this._towerSlots[slotIndex];

    if (slot.towerId !== null) {
      return { ok: false, code: 'SLOT_OCCUPIED' };
    }

    const spec = TOWER_STATS[towerType];

    if (this._state.gold < spec.cost) {
      return { ok: false, code: 'INSUFFICIENT_GOLD' };
    }

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

    const newState = transitionGameState(this._state, GameEvent.BUILD, {
      towerCost: spec.cost,
      towerData,
    });

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
   * Sell a tower from a slot. Returns the refund amount on success.
   * @param {number} slotIndex
   * @returns {CommandResult}
   */
  sellTower(slotIndex) {
    if (slotIndex < 0 || slotIndex >= this._towerSlots.length) {
      return { ok: false, code: 'INVALID_TOWER' };
    }

    const slot = this._towerSlots[slotIndex];

    if (slot.towerId === null) {
      return { ok: false, code: 'SLOT_EMPTY' };
    }

    const tower = this._state.towers.find((t) => t.id === slot.towerId);
    if (!tower) {
      return { ok: false, code: 'SLOT_EMPTY' };
    }

    const refundAmount = Math.floor(tower.cost * PLAYER_CONFIG.sellRefundRate);

    const newState = transitionGameState(this._state, GameEvent.SELL, {
      towerId: slot.towerId,
      refundAmount,
    });

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

  /** @returns {{events: Array}} */
  start() {
    if (this._state.state !== GameStateType.IDLE) {
      return { events: [] };
    }

    this._state = transitionGameState(this._state, GameEvent.START);
    return { events: [{ type: 'game-start' }] };
  }

  /** @returns {Readonly<WaveController>} */
  getWaveController() {
    return this._waveController;
  }

  /**
   * Tick the game engine one fixed step.
   * @param {number} deltaSeconds
   * @param {Enemy[]} enemies
   * @param {PathModel} path
   * @returns {{enemies: Enemy[], events: Array}}
   */
  tick(deltaSeconds, enemies, path) {
    if (this._state.state !== GameStateType.RUNNING) {
      return { enemies, events: [] };
    }

    const events = [];
    let updatedEnemies = [...enemies];
    let newProjectiles = [...this._state.projectiles];
    let newEffects = [...this._state.effects];
    const deltaMs = Math.max(0, deltaSeconds) * 1000;

    // Advance elapsedMs even when nothing else updates so the timer reflects
    // real wall-clock time on the running game.
    this._state = transitionGameState(this._state, GameEvent.TICK, { deltaMs });

    const findEnemyById = (id) => updatedEnemies.find((e) => e.id === id) || null;
    const updateEnemy = (u) => {
      updatedEnemies = updatedEnemies.map((e) => (e.id === u.id ? u : e));
    };

    // ── 0. Wave scheduling + new spawns (run before enemy advance so freshly
    //        spawned enemies move on the same tick they appear). ─────────────
    const aliveEnemyCount = updatedEnemies.filter((e) => e.alive).length;
    const waveResult = updateWaveController(this._waveController, deltaSeconds, aliveEnemyCount);
    this._waveController = waveResult.controller;

    for (const spawn of waveResult.spawns) {
      // Spec §14: never refuse to spawn — enemies are critical. Drop instead
      // any non-critical visual effects to make room.
      if (newEffects.length >= ENTITY_CAPS.EFFECTS) {
        newEffects = newEffects.slice(newEffects.length - ENTITY_CAPS.EFFECTS + 1);
      }
      const enemy = createEnemy(spawn.spec, spawn.id);
      updatedEnemies.push(enemy);
    }

    for (const waveEvent of waveResult.events) {
      switch (waveEvent.type) {
        case 'wave_start':
          // wave number, total waves — emitted by the host element so it can
          // include totalWaves and queue an announcement.
          events.push({ type: 'wave-start', wave: waveEvent.wave });
          break;
        case 'wave_complete':
          events.push({ type: 'wave-complete', wave: waveEvent.wave });
          this._state = transitionGameState(this._state, GameEvent.WAVE_COMPLETE);
          break;
        case 'all_waves_complete':
          // Defer game-win dispatch until kill + damage processing settles so
          // the event detail has up-to-date kill rewards / lives.
          this._pendingWinWave = waveEvent.wave;
          break;
      }
    }

    // ── 1. Enemy advance + leak detection. ───────────────────────────────────
    for (const enemy of updatedEnemies) {
      if (!enemy.alive) continue;
      const result = advanceEnemy(enemy, deltaSeconds, path);
      updateEnemy(result.enemy);
      if (result.leaked) {
        const leakEvents = this.processEnemyLeak(enemy.id, enemy.leakDamage);
        events.push(...leakEvents);
      }
    }

    // ── 2. Tower cooldowns + target selection + projectile spawn. ───────────
    const towerEvents = [];
    for (const tower of this._state.towers) {
      if (!tower.alive) continue;
      let cooldown = this._towerCooldowns.get(tower.id) || 0;
      cooldown = Math.max(0, cooldown - deltaSeconds);
      if (cooldown === 0) {
        const target = selectTarget(tower, updatedEnemies, path);
        if (target !== null) {
          const targetPos = samplePath(path, target.distance);
          if (newProjectiles.length < ENTITY_CAPS.PROJECTILES) {
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
            cooldown = tower.attackInterval;
            towerEvents.push({ type: 'tower-attack', towerId: tower.id, targetId: target.id });
          } // else silently drop the attack to stay under the cap
        }
      }
      this._towerCooldowns.set(tower.id, cooldown);
    }
    events.push(...towerEvents);

    // ── 3. Projectile advance + hit detection. ──────────────────────────────
    const advancedProjectiles = [];
    for (const projectile of newProjectiles) {
      if (!projectile.alive) continue;
      const target = findEnemyById(projectile.targetId);
      let withUpdatedTarget = projectile;
      if (target !== null && target.alive) {
        const targetPos = samplePath(path, target.distance);
        withUpdatedTarget = Object.freeze({
          ...projectile,
          lastKnownPos: { x: targetPos.x, y: targetPos.y },
        });
      }
      const result = advanceProjectile(withUpdatedTarget, deltaSeconds, findEnemyById);
      if (result.hit) {
        const hitTarget = findEnemyById(projectile.targetId);
        if (hitTarget !== null && hitTarget.alive) {
          const damage = calculateDamage(projectile.damage, projectile.damageType, hitTarget);
          const damagedEnemy = damageEnemy(hitTarget, damage, projectile.damageType === 'physical');
          updateEnemy(damagedEnemy);

          // Hit spark at the impact point.
          if (newEffects.length < ENTITY_CAPS.EFFECTS) {
            newEffects.push(
              createEffect(EffectType.HIT_SPARK, result.targetPos.x, result.targetPos.y)
            );
          }

          events.push({
            type: 'projectile-hit',
            projectileId: projectile.id,
            targetId: projectile.targetId,
            damage,
          });

          // ── 4. Apply death and gold reward. ────────────────────────────────
          if (!damagedEnemy.alive) {
            const ks = transitionGameState(this._state, GameEvent.ENEMY_KILL, {
              reward: hitTarget.reward,
            });
            this._state = Object.freeze(ks);

            const enemyPos = samplePath(path, hitTarget.distance);
            if (newEffects.length < ENTITY_CAPS.EFFECTS) {
              newEffects.push(createEffect(EffectType.DEATH_PUFF, enemyPos.x, enemyPos.y));
            } else if (newEffects.length > 0) {
              // Drop the oldest effect to make room.
              newEffects = newEffects.slice(1);
              newEffects.push(createEffect(EffectType.DEATH_PUFF, enemyPos.x, enemyPos.y));
            }
          }
        }
      } else {
        advancedProjectiles.push(result.projectile);
      }
    }

    // ── 5. Effects advance. ─────────────────────────────────────────────────
    const advancedEffects = [];
    for (const effect of newEffects) {
      const result = advanceEffect(effect, deltaSeconds);
      if (result.alive) advancedEffects.push(result.effect);
    }

    // ── 6. Cleanup + write state. ────────────────────────────────────────────
    this._state = Object.freeze({
      ...this._state,
      projectiles: Object.freeze(advancedProjectiles),
      effects: Object.freeze(advancedEffects),
    });

    // ── 7. Win/lose pass after kills so the event detail has totals. ────────
    if (this._pendingWinWave !== undefined) {
      // all_waves_complete was emitted earlier; transition to won now.
      this._state = transitionGameState(this._state, GameEvent.WIN);
      events.push({ type: 'game-win' });
      this._pendingWinWave = undefined;
    }

    // Drop dead enemies off the list before returning.
    const aliveEnemies = updatedEnemies.filter((e) => e.alive);
    return { enemies: aliveEnemies, events };
  }

  /**
   * Process an enemy leak (an enemy reached the castle).
   * @param {string} enemyId
   * @param {number} leakDamage
   * @returns {Array}
   */
  processEnemyLeak(enemyId, leakDamage) {
    const events = [];
    const newState = transitionGameState(this._state, GameEvent.ENEMY_LEAK, { leakDamage });
    this._state = Object.freeze(newState);

    events.push({
      type: 'enemy-leak',
      enemyType: undefined, // filled in by host element from lookup if needed
      damage: leakDamage,
      livesRemaining: this._state.lives,
    });

    if (this._state.state === GameStateType.LOST) {
      events.push({ type: 'game-lose' });
      this._waveController = stopWaveController(this._waveController);
    }

    return events;
  }

  /** Reset the engine to initial state. Safe to call repeatedly. */
  reset() {
    this._state = createInitialState();
    this._towerCooldowns.clear();
    this._waveController = createWaveController(WAVES);
    this._pendingWinWave = undefined;
    resetIdCounters();
  }
}
