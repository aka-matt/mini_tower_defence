// Unit tests for enemy entity

import { describe, it, expect } from 'vitest';
import { createEnemy, advanceEnemy } from '../../src/entities/enemy.js';
import { ENEMY_STATS, EnemyType } from '../../src/config/game-config.js';
import { createPath } from '../../src/engine/path.js';
import { PATH_POINTS } from '../../src/config/map-config.js';

describe('Enemy', () => {
  describe('createEnemy', () => {
    it('should create soldier enemy with correct stats', () => {
      const spec = { ...ENEMY_STATS[EnemyType.SOLDIER], type: EnemyType.SOLDIER };
      const enemy = createEnemy(spec, 'enemy-1');

      expect(enemy.id).toBe('enemy-1');
      expect(enemy.type).toBe(EnemyType.SOLDIER);
      expect(enemy.hp).toBe(70);
      expect(enemy.maxHp).toBe(70);
      expect(enemy.speed).toBe(58);
      expect(enemy.armor).toBe(2);
      expect(enemy.magicRes).toBe(0);
      expect(enemy.reward).toBe(14);
      expect(enemy.leakDamage).toBe(1);
      expect(enemy.alive).toBe(true);
      expect(enemy.distance).toBe(0);
    });

    it('should create scout enemy with correct stats', () => {
      const spec = { ...ENEMY_STATS[EnemyType.SCOUT], type: EnemyType.SCOUT };
      const enemy = createEnemy(spec, 'enemy-2');

      expect(enemy.speed).toBe(92);
      expect(enemy.hp).toBe(48);
      expect(enemy.armor).toBe(0);
    });

    it('should create armored enemy with correct stats', () => {
      const spec = { ...ENEMY_STATS[EnemyType.ARMORED], type: EnemyType.ARMORED };
      const enemy = createEnemy(spec, 'enemy-3');

      expect(enemy.speed).toBe(38);
      expect(enemy.hp).toBe(170);
      expect(enemy.armor).toBe(9);
      expect(enemy.magicRes).toBe(2);
    });

    it('should return a frozen object', () => {
      const spec = { ...ENEMY_STATS[EnemyType.SOLDIER], type: EnemyType.SOLDIER };
      const enemy = createEnemy(spec, 'enemy-1');

      expect(Object.isFrozen(enemy)).toBe(true);
    });
  });

  describe('advanceEnemy', () => {
    const path = createPath(PATH_POINTS);

    it('should move soldier at correct speed (58px/s)', () => {
      const spec = { ...ENEMY_STATS[EnemyType.SOLDIER], type: EnemyType.SOLDIER };
      const enemy = createEnemy(spec, 'enemy-1');

      const result = advanceEnemy(enemy, 1, path);

      expect(result.distanceDelta).toBeCloseTo(58, 5);
      expect(result.enemy.distance).toBeCloseTo(58, 5);
      expect(result.leaked).toBe(false);
      expect(result.enemy.alive).toBe(true);
    });

    it('should move scout at correct speed (92px/s)', () => {
      const spec = { ...ENEMY_STATS[EnemyType.SCOUT], type: EnemyType.SCOUT };
      const enemy = createEnemy(spec, 'enemy-2');

      const result = advanceEnemy(enemy, 1, path);

      expect(result.distanceDelta).toBeCloseTo(92, 5);
      expect(result.enemy.distance).toBeCloseTo(92, 5);
      expect(result.leaked).toBe(false);
    });

    it('should move armored at correct speed (38px/s)', () => {
      const spec = { ...ENEMY_STATS[EnemyType.ARMORED], type: EnemyType.ARMORED };
      const enemy = createEnemy(spec, 'enemy-3');

      const result = advanceEnemy(enemy, 1, path);

      expect(result.distanceDelta).toBeCloseTo(38, 5);
      expect(result.enemy.distance).toBeCloseTo(38, 5);
      expect(result.leaked).toBe(false);
    });

    it('should not mutate the original enemy', () => {
      const spec = { ...ENEMY_STATS[EnemyType.SOLDIER], type: EnemyType.SOLDIER };
      const enemy = createEnemy(spec, 'enemy-1');
      const originalDistance = enemy.distance;

      advanceEnemy(enemy, 1, path);

      expect(enemy.distance).toBe(originalDistance);
      expect(enemy.alive).toBe(true);
    });

    it('should clamp at path end and mark alive=false', () => {
      const spec = { ...ENEMY_STATS[EnemyType.SOLDIER], type: EnemyType.SOLDIER };
      // Create enemy near end of path
      const enemy = Object.freeze({ ...createEnemy(spec, 'enemy-1'), distance: path.totalLength - 10 });

      const result = advanceEnemy(enemy, 1, path);

      expect(result.leaked).toBe(true);
      expect(result.enemy.alive).toBe(false);
      expect(result.enemy.distance).toBe(path.totalLength);
      // Distance delta should only be remaining distance, not full speed
      expect(result.distanceDelta).toBeCloseTo(10, 5);
    });

    it('should mark alive=false when reaching end', () => {
      const spec = { ...ENEMY_STATS[EnemyType.SOLDIER], type: EnemyType.SOLDIER };
      const enemy = createEnemy(spec, 'enemy-1');

      // Move enemy to just short of end
      const nearEndEnemy = Object.freeze({
        ...enemy,
        distance: path.totalLength - 5,
      });

      const result = advanceEnemy(nearEndEnemy, 1, path);

      expect(result.enemy.alive).toBe(false);
      expect(result.leaked).toBe(true);
    });

    it('should only fire leak event once per enemy', () => {
      const spec = { ...ENEMY_STATS[EnemyType.SOLDIER], type: EnemyType.SOLDIER };
      const enemy = createEnemy(spec, 'enemy-1');

      // Move enemy to just short of end
      const nearEndEnemy = Object.freeze({
        ...enemy,
        distance: path.totalLength - 5,
      });

      // First advance - should leak
      const result1 = advanceEnemy(nearEndEnemy, 1, path);
      expect(result1.leaked).toBe(true);
      expect(result1.enemy.alive).toBe(false);

      // Second advance - enemy is already dead, should not leak again
      const result2 = advanceEnemy(result1.enemy, 1, path);
      expect(result2.leaked).toBe(false);
      expect(result2.enemy.alive).toBe(false);
    });

    it('should handle fractional delta seconds', () => {
      const spec = { ...ENEMY_STATS[EnemyType.SOLDIER], type: EnemyType.SOLDIER };
      const enemy = createEnemy(spec, 'enemy-1');

      const result = advanceEnemy(enemy, 0.5, path);

      expect(result.distanceDelta).toBeCloseTo(29, 5); // 58 * 0.5
      expect(result.enemy.distance).toBeCloseTo(29, 5);
    });

    it('should not move dead enemy', () => {
      const spec = { ...ENEMY_STATS[EnemyType.SOLDIER], type: EnemyType.SOLDIER };
      const enemy = Object.freeze({
        ...createEnemy(spec, 'enemy-1'),
        alive: false,
        distance: 500,
      });

      const result = advanceEnemy(enemy, 1, path);

      expect(result.distanceDelta).toBe(0);
      expect(result.leaked).toBe(false);
      expect(result.enemy.distance).toBe(500);
    });
  });
});
