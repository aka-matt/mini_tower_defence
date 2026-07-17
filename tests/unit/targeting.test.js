// Unit tests for targeting logic

import { describe, it, expect, beforeEach } from 'vitest';
import { selectTarget } from '../../src/engine/targeting.js';
import { createPath } from '../../src/engine/path.js';
import { PATH_POINTS } from '../../src/config/map-config.js';

describe('selectTarget', () => {
  let path;

  beforeEach(() => {
    path = createPath(PATH_POINTS);
  });

  it('should return enemy with highest pathProgress in range', () => {
    // Tower at (120, 340) with range 200
    // Enemies at distances along path that are within range
    // At distance 100: position (~70, 400), dist from tower ~78
    // At distance 300: position (~217, 356), dist from tower ~102
    // Both are within range 200
    const tower = { id: 'tower-0', x: 120, y: 340, range: 200, alive: true };
    const enemies = [
      { id: 'enemy-1', alive: true, distance: 100 },   // early in path
      { id: 'enemy-2', alive: true, distance: 300 },   // further in path (higher progress)
      { id: 'enemy-3', alive: true, distance: 500 },   // furthest but likely out of range
    ];

    const target = selectTarget(tower, enemies, path);

    // enemy-2 at distance 300 has higher progress than enemy-1 at 100
    expect(target.id).toBe('enemy-2');
  });

  it('should return null when no enemies in range', () => {
    const tower = { id: 'tower-0', x: 120, y: 340, range: 50, alive: true };
    const enemies = [
      { id: 'enemy-1', alive: true, distance: 500 },
      { id: 'enemy-2', alive: true, distance: 600 },
    ];

    const target = selectTarget(tower, enemies, path);

    expect(target).toBeNull();
  });

  it('should return null when all enemies are dead', () => {
    const tower = { id: 'tower-0', x: 120, y: 340, range: 200, alive: true };
    const enemies = [
      { id: 'enemy-1', alive: false, distance: 300 },
      { id: 'enemy-2', alive: false, distance: 400 },
    ];

    const target = selectTarget(tower, enemies, path);

    expect(target).toBeNull();
  });

  it('should return null when tower is not alive', () => {
    const tower = { id: 'tower-0', x: 120, y: 340, range: 200, alive: false };
    const enemies = [
      { id: 'enemy-1', alive: true, distance: 300 },
    ];

    const target = selectTarget(tower, enemies, path);

    expect(target).toBeNull();
  });

  it('should tiebreak by lower ID when pathProgress is equal', () => {
    const tower = { id: 'tower-0', x: 120, y: 340, range: 200, alive: true };
    // Both enemies at same distance (same progress)
    const enemies = [
      { id: 'enemy-2', alive: true, distance: 300 },
      { id: 'enemy-1', alive: true, distance: 300 },
      { id: 'enemy-3', alive: true, distance: 300 },
    ];

    const target = selectTarget(tower, enemies, path);

    // enemy-1 should win due to lowest ID
    expect(target.id).toBe('enemy-1');
  });

  it('should include enemy at exactly range distance', () => {
    // Tower at (120, 340), enemy at distance 300
    // With PATH_POINTS starting at (-30, 400), first segment goes to (145, 400)
    // At distance 100, position should be around (70, 400)
    // Distance from (120, 340) to (70, 400) is sqrt(50^2 + 60^2) ≈ 78
    // So range 78 should include an enemy at distance 100
    const tower = { id: 'tower-0', x: 120, y: 340, range: 80, alive: true };
    const enemies = [
      { id: 'enemy-1', alive: true, distance: 100 },
    ];

    const target = selectTarget(tower, enemies, path);

    expect(target.id).toBe('enemy-1');
  });

  it('should exclude enemy just beyond range distance', () => {
    const tower = { id: 'tower-0', x: 120, y: 340, range: 70, alive: true };
    const enemies = [
      { id: 'enemy-1', alive: true, distance: 100 },
    ];

    const target = selectTarget(tower, enemies, path);

    expect(target).toBeNull();
  });

  it('should only consider alive enemies', () => {
    const tower = { id: 'tower-0', x: 120, y: 340, range: 200, alive: true };
    const enemies = [
      { id: 'enemy-1', alive: true, distance: 100 },
      { id: 'enemy-2', alive: false, distance: 300 },  // dead
      { id: 'enemy-3', alive: true, distance: 300 },   // alive with same progress as dead enemy-2
    ];

    const target = selectTarget(tower, enemies, path);

    // enemy-3 should be selected because enemy-2 is dead
    expect(target.id).toBe('enemy-3');
  });

  it('should handle empty enemy array', () => {
    const tower = { id: 'tower-0', x: 120, y: 340, range: 200, alive: true };
    const enemies = [];

    const target = selectTarget(tower, enemies, path);

    expect(target).toBeNull();
  });

  it('should select furthest enemy even when others are closer spatially', () => {
    // Tower positioned where an enemy further along path is actually
    // closer in Euclidean distance than one earlier in path
    // This can happen due to path curves
    const tower = { id: 'tower-0', x: 600, y: 300, range: 300, alive: true };
    const enemies = [
      { id: 'enemy-1', alive: true, distance: 200 },   // early but closer spatially
      { id: 'enemy-2', alive: true, distance: 600 },   // further along path
    ];

    const target = selectTarget(tower, enemies, path);

    // Should select enemy-2 because it has higher pathProgress
    expect(target.id).toBe('enemy-2');
  });
});
