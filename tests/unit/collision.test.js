// Unit tests for collision and damage calculation

import { describe, it, expect } from 'vitest';
import { calculateDamage } from '../../src/engine/collision.js';
import { ENEMY_STATS, EnemyType } from '../../src/config/game-config.js';

describe('calculateDamage', () => {
  describe('physical damage', () => {
    it('should reduce damage by armor', () => {
      const enemy = { armor: 5, magicRes: 0 };
      const damage = calculateDamage(20, 'physical', enemy);

      expect(damage).toBe(15); // 20 - 5
    });

    it('should have minimum damage of 1', () => {
      const enemy = { armor: 100, magicRes: 0 };
      const damage = calculateDamage(20, 'physical', enemy);

      expect(damage).toBe(1); // max(1, 20 - 100)
    });

    it('should deal full damage when armor is 0', () => {
      const enemy = { armor: 0, magicRes: 0 };
      const damage = calculateDamage(18, 'physical', enemy);

      expect(damage).toBe(18);
    });

    it('should deal at least 1 damage even with high armor', () => {
      const enemy = { armor: 50, magicRes: 0 };
      const damage = calculateDamage(30, 'physical', enemy);

      expect(damage).toBe(1);
    });
  });

  describe('magic damage', () => {
    it('should reduce damage by magic resistance', () => {
      const enemy = { armor: 0, magicRes: 5 };
      const damage = calculateDamage(28, 'magic', enemy);

      expect(damage).toBe(23); // 28 - 5
    });

    it('should have minimum damage of 1', () => {
      const enemy = { armor: 0, magicRes: 100 };
      const damage = calculateDamage(20, 'magic', enemy);

      expect(damage).toBe(1); // max(1, 20 - 100)
    });

    it('should deal full damage when magicRes is 0', () => {
      const enemy = { armor: 0, magicRes: 0 };
      const damage = calculateDamage(28, 'magic', enemy);

      expect(damage).toBe(28);
    });

    it('should deal at least 1 damage even with high magicRes', () => {
      const enemy = { armor: 0, magicRes: 50 };
      const damage = calculateDamage(30, 'magic', enemy);

      expect(damage).toBe(1);
    });
  });

  describe('soldier enemy (armor=2, magicRes=0)', () => {
    it('should take correct physical damage', () => {
      const spec = ENEMY_STATS[EnemyType.SOLDIER];
      const enemy = { armor: spec.armor, magicRes: spec.magicRes };

      const physicalDamage = calculateDamage(18, 'physical', enemy);
      expect(physicalDamage).toBe(16); // 18 - 2

      const magicDamage = calculateDamage(18, 'magic', enemy);
      expect(magicDamage).toBe(18); // 18 - 0
    });
  });

  describe('scout enemy (armor=0, magicRes=0)', () => {
    it('should take full damage from both types', () => {
      const spec = ENEMY_STATS[EnemyType.SCOUT];
      const enemy = { armor: spec.armor, magicRes: spec.magicRes };

      const physicalDamage = calculateDamage(18, 'physical', enemy);
      expect(physicalDamage).toBe(18); // 18 - 0

      const magicDamage = calculateDamage(28, 'magic', enemy);
      expect(magicDamage).toBe(28); // 28 - 0
    });
  });

  describe('armored enemy (armor=9, magicRes=2)', () => {
    it('should take reduced damage from both types', () => {
      const spec = ENEMY_STATS[EnemyType.ARMORED];
      const enemy = { armor: spec.armor, magicRes: spec.magicRes };

      const physicalDamage = calculateDamage(18, 'physical', enemy);
      expect(physicalDamage).toBe(9); // max(1, 18 - 9)

      const magicDamage = calculateDamage(28, 'magic', enemy);
      expect(magicDamage).toBe(26); // max(1, 28 - 2)
    });

    it('should have minimum 1 damage even with high armor', () => {
      const enemy = { armor: 100, magicRes: 0 };
      const damage = calculateDamage(50, 'physical', enemy);

      expect(damage).toBe(1);
    });

    it('should have minimum 1 damage even with high magicRes', () => {
      const enemy = { armor: 0, magicRes: 100 };
      const damage = calculateDamage(50, 'magic', enemy);

      expect(damage).toBe(1);
    });
  });

  describe('unknown damage type', () => {
    it('should return base damage with minimum 1', () => {
      const enemy = { armor: 0, magicRes: 0 };
      const damage = calculateDamage(20, 'unknown', enemy);

      expect(damage).toBe(20);
    });
  });
});
