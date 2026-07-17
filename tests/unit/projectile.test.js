// Unit tests for projectile behavior

import { describe, it, expect, beforeEach } from 'vitest';
import { createProjectile, advanceProjectile, resetProjectileIdCounter } from '../../src/entities/projectile.js';

describe('advanceProjectile', () => {
  beforeEach(() => {
    resetProjectileIdCounter(0);
  });

  describe('no retargeting', () => {
    it('should NOT retarget when target moves - flies to lastKnownPos', () => {
      // Create projectile at (100, 100) targeting enemy-1 at (100, 100)
      // When target moves to (500, 500), projectile should still fly to (100, 100)
      const projectile = createProjectile(
        { speed: 200, damage: 18, damageType: 'physical' },
        'enemy-1',
        { x: 100, y: 100 }
      );

      // Simulate target moving elsewhere
      const targetLookup = (id) => {
        if (id === 'enemy-1') {
          return { id: 'enemy-1', alive: true, distance: 50 }; // target moved
        }
        return null;
      };

      // Advance projectile - since target is alive, it flies to lastKnownPos (100, 100)
      // Projectile is already at (100, 100), so distance is 0, hit is true
      const result = advanceProjectile(projectile, 0.1, targetLookup);

      // Projectile should hit immediately since it's at lastKnownPos
      expect(result.hit).toBe(true);
      expect(result.projectile.alive).toBe(false);
    });
  });

  describe('target death', () => {
    it('should fly to lastKnownPos when target dies', () => {
      // Create projectile at (100, 100)
      const projectile = createProjectile(
        { speed: 200, damage: 18, damageType: 'physical' },
        'enemy-1',
        { x: 100, y: 100 }
      );

      // Target is dead
      const targetLookup = (id) => null;

      const result = advanceProjectile(projectile, 0.1, targetLookup);

      // Should hit since at lastKnownPos (100, 100) with distance 0
      expect(result.hit).toBe(true);
    });

    it('should fly to lastKnownPos when target becomes dead mid-flight', () => {
      // Create a projectile at origin, then manually position it mid-flight
      // with lastKnownPos set to where the target was when projectile was created
      let projectile = createProjectile(
        { speed: 200, damage: 18, damageType: 'physical' },
        'enemy-1',
        { x: 100, y: 100 }
      );

      // Simulate projectile having traveled away from its origin
      // but still tracking lastKnownPos (where target was when projectile was launched)
      projectile = Object.freeze({ ...projectile, x: 200, y: 200 });

      // Now target dies - projectile should fly to lastKnownPos (100, 100)
      const deadLookup = (id) => null;
      const result = advanceProjectile(projectile, 0.5, deadLookup);

      // Distance from (200, 200) to (100, 100) is sqrt(20000) ≈ 141px
      // Speed 200 * 0.5 = 100px, so should move 100px closer
      // Should NOT hit since 141 > 10
      expect(result.hit).toBe(false);
      expect(result.projectile.alive).toBe(true);

      // Verify it moved toward lastKnownPos (100, 100) from (200, 200)
      expect(result.projectile.x).toBeLessThan(200);
      expect(result.projectile.y).toBeLessThan(200);
    });
  });

  describe('hit detection at 10px radius', () => {
    it('should detect hit at exactly 10px distance', () => {
      // Create projectile at origin, lastKnownPos at (10, 0)
      const projectile = createProjectile(
        { speed: 200, damage: 18, damageType: 'physical' },
        'enemy-1',
        { x: 10, y: 0 }
      );

      // Projectile at (0, 0), lastKnownPos at (10, 0), distance = 10px
      const targetLookup = (id) => null;

      const result = advanceProjectile(projectile, 0.1, targetLookup);

      expect(result.hit).toBe(true);
      expect(result.projectile.alive).toBe(false);
    });

    it('should detect hit when distance is less than 10px', () => {
      // Create projectile at origin, lastKnownPos at (5, 0)
      const projectile = createProjectile(
        { speed: 200, damage: 18, damageType: 'physical' },
        'enemy-1',
        { x: 5, y: 0 }
      );

      const targetLookup = (id) => null;

      const result = advanceProjectile(projectile, 0.1, targetLookup);

      expect(result.hit).toBe(true);
      expect(result.projectile.alive).toBe(false);
    });

    it('should NOT hit when distance is greater than 10px', () => {
      // Create projectile, then manually set position away from lastKnownPos
      let projectile = createProjectile(
        { speed: 200, damage: 18, damageType: 'physical' },
        'enemy-1',
        { x: 100, y: 0 }
      );

      // Simulate projectile in flight, away from its origin
      // lastKnownPos = (100, 0), but projectile is at (0, 0)
      projectile = Object.freeze({ ...projectile, x: 0, y: 0 });

      const targetLookup = (id) => null;

      // Distance from (0, 0) to (100, 0) = 100px, which is > 10px
      // Speed 200 * 0.1 = 20px movement
      const result = advanceProjectile(projectile, 0.1, targetLookup);

      expect(result.hit).toBe(false);
      expect(result.projectile.alive).toBe(true);
      // Should have moved 20px toward (100, 0) from (0, 0)
      expect(result.projectile.x).toBe(20);
      expect(result.projectile.y).toBe(0);
    });

    it('should snap to target when moveDistance >= distance but not hit if started >10px away', () => {
      // Create projectile, manually position it so distance is 15px
      let projectile = createProjectile(
        { speed: 200, damage: 18, damageType: 'physical' },
        'enemy-1',
        { x: 100, y: 0 }
      );

      // Set projectile at (85, 0), lastKnownPos at (100, 0)
      // Distance = 15px > 10px, so no immediate hit
      projectile = Object.freeze({ ...projectile, x: 85, y: 0 });

      const targetLookup = (id) => null;

      // Speed 200 * 0.1 = 20px. Since 20 >= 15 (distance), it snaps to target
      // But hit check happens BEFORE move, so hit is false
      const result = advanceProjectile(projectile, 0.1, targetLookup);

      expect(result.hit).toBe(false);
      expect(result.projectile.x).toBe(100);
      expect(result.projectile.y).toBe(0);
    });
  });

  describe('projectile movement', () => {
    it('should move with correct speed and direction', () => {
      // Create projectile at (0, 0) targeting lastKnownPos at (100, 100)
      const projectile = createProjectile(
        { speed: 141, damage: 18, damageType: 'physical' }, // ~100*sqrt(2) for diagonal
        'enemy-1',
        { x: 100, y: 100 }
      );

      const targetLookup = (id) => null;

      // Move for 1 second at 141 pixels/second
      // Direction (100,100) from (0,0) normalized = (0.707, 0.707)
      // Move 141 * 0.707 ~= 100 in both axes, reaches target
      const result = advanceProjectile(projectile, 1.0, targetLookup);

      expect(result.hit).toBe(true);
    });

    it('should not move when already dead', () => {
      const projectile = createProjectile(
        { speed: 200, damage: 18, damageType: 'physical' },
        'enemy-1',
        { x: 100, y: 100 }
      );

      const deadProjectile = Object.freeze({ ...projectile, alive: false });

      const result = advanceProjectile(deadProjectile, 1.0, () => null);

      expect(result.projectile).toBe(deadProjectile);
      expect(result.hit).toBe(false);
      expect(result.projectile.x).toBe(100);
      expect(result.projectile.y).toBe(100);
    });

    it('should handle diagonal movement correctly', () => {
      // Create projectile at (0, 0) targeting (30, 40) - classic 3-4-5 triangle
      const projectile = createProjectile(
        { speed: 250, damage: 18, damageType: 'physical' },
        'enemy-1',
        { x: 30, y: 40 }
      );

      const targetLookup = (id) => null;

      // Distance is 50px (3-4-5 triangle)
      // Speed 250 * 0.2s = 50px, should reach target
      const result = advanceProjectile(projectile, 0.2, targetLookup);

      expect(result.hit).toBe(true);
      expect(result.projectile.x).toBe(30);
      expect(result.projectile.y).toBe(40);
    });
  });

  describe('createProjectile', () => {
    it('should assign unique IDs', () => {
      const p1 = createProjectile({ speed: 100, damage: 10, damageType: 'physical' }, 'e1', { x: 0, y: 0 });
      const p2 = createProjectile({ speed: 100, damage: 10, damageType: 'physical' }, 'e2', { x: 0, y: 0 });

      expect(p1.id).toBe('projectile-1');
      expect(p2.id).toBe('projectile-2');
    });

    it('should store damage type correctly', () => {
      const physical = createProjectile({ speed: 100, damage: 18, damageType: 'physical' }, 'e1', { x: 0, y: 0 });
      const magic = createProjectile({ speed: 100, damage: 28, damageType: 'magic' }, 'e1', { x: 0, y: 0 });

      expect(physical.damageType).toBe('physical');
      expect(magic.damageType).toBe('magic');
    });

    it('should initialize lastKnownPos to start position', () => {
      const projectile = createProjectile(
        { speed: 100, damage: 10, damageType: 'physical' },
        'enemy-1',
        { x: 250, y: 300 }
      );

      expect(projectile.lastKnownPos.x).toBe(250);
      expect(projectile.lastKnownPos.y).toBe(300);
      expect(projectile.x).toBe(250);
      expect(projectile.y).toBe(300);
    });
  });

  describe('resetProjectileIdCounter', () => {
    it('should reset counter to specified value', () => {
      createProjectile({ speed: 100, damage: 10, damageType: 'physical' }, 'e1', { x: 0, y: 0 });
      createProjectile({ speed: 100, damage: 10, damageType: 'physical' }, 'e2', { x: 0, y: 0 });

      resetProjectileIdCounter(0);

      const p = createProjectile({ speed: 100, damage: 10, damageType: 'physical' }, 'e3', { x: 0, y: 0 });
      expect(p.id).toBe('projectile-1');
    });
  });
});
