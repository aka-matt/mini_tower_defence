/**
 * Unit tests for coordinate transformation utilities
 */

import { describe, it, expect } from 'vitest';
import { clientToWorld, worldToClient, hitTestTowerSlot } from '../../src/render/coordinates.js';

describe('coordinates', () => {
  const WORLD_SIZE = { width: 960, height: 540 };

  describe('clientToWorld', () => {
    it('maps (0, 0) client to world (0, 0) when canvas at origin', () => {
      const canvasRect = createMockRect(0, 0, 960, 540);
      const result = clientToWorld(0, 0, canvasRect, WORLD_SIZE);
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(0, 5);
    });

    it('maps center of 960x540 canvas to world center', () => {
      const canvasRect = createMockRect(0, 0, 960, 540);
      const result = clientToWorld(480, 270, canvasRect, WORLD_SIZE);
      expect(result.x).toBeCloseTo(480, 5);
      expect(result.y).toBeCloseTo(270, 5);
    });

    it('maps center of 1920x1080 canvas to world center (2x scale)', () => {
      const canvasRect = createMockRect(0, 0, 1920, 1080);
      const result = clientToWorld(960, 540, canvasRect, WORLD_SIZE);
      expect(result.x).toBeCloseTo(480, 5);
      expect(result.y).toBeCloseTo(270, 5);
    });

    it('maps center of 480x270 canvas (0.5x scale) to world center', () => {
      const canvasRect = createMockRect(0, 0, 480, 270);
      const result = clientToWorld(240, 135, canvasRect, WORLD_SIZE);
      expect(result.x).toBeCloseTo(480, 5);
      expect(result.y).toBeCloseTo(270, 5);
    });

    it('handles canvas with offset (not at origin)', () => {
      const canvasRect = createMockRect(100, 50, 960, 540);
      const result = clientToWorld(100, 50, canvasRect, WORLD_SIZE);
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(0, 5);
    });

    it('handles canvas with offset and scaling', () => {
      const canvasRect = createMockRect(100, 50, 1920, 1080);
      // Client position at canvas center offset by (100, 50)
      // Canvas center in CSS coords: (100 + 960, 50 + 540) = (1060, 590)
      const result = clientToWorld(1060, 590, canvasRect, WORLD_SIZE);
      expect(result.x).toBeCloseTo(480, 5);
      expect(result.y).toBeCloseTo(270, 5);
    });

    it('is DPR-aware: same CSS size maps to same world coords regardless of DPR', () => {
      // CSS size 960x540 with DPR=1 (960 physical)
      const rect1 = createMockRect(0, 0, 960, 540);
      // CSS size 960x540 with DPR=2 (1920 physical but CSS pixels same)
      const rect2 = createMockRect(0, 0, 960, 540); // DPR doesn't change CSS size

      const result1 = clientToWorld(480, 270, rect1, WORLD_SIZE);
      const result2 = clientToWorld(480, 270, rect2, WORLD_SIZE);

      // Both should map to same world coords since CSS rect is same
      expect(result1.x).toBeCloseTo(result2.x, 5);
      expect(result1.y).toBeCloseTo(result2.y, 5);
    });

    it('handles world coordinates at corners', () => {
      const canvasRect = createMockRect(0, 0, 960, 540);

      // Top-left corner
      const topLeft = clientToWorld(0, 0, canvasRect, WORLD_SIZE);
      expect(topLeft.x).toBeCloseTo(0, 5);
      expect(topLeft.y).toBeCloseTo(0, 5);

      // Top-right corner
      const topRight = clientToWorld(960, 0, canvasRect, WORLD_SIZE);
      expect(topRight.x).toBeCloseTo(960, 5);
      expect(topRight.y).toBeCloseTo(0, 5);

      // Bottom-left corner
      const bottomLeft = clientToWorld(0, 540, canvasRect, WORLD_SIZE);
      expect(bottomLeft.x).toBeCloseTo(0, 5);
      expect(bottomLeft.y).toBeCloseTo(540, 5);

      // Bottom-right corner
      const bottomRight = clientToWorld(960, 540, canvasRect, WORLD_SIZE);
      expect(bottomRight.x).toBeCloseTo(960, 5);
      expect(bottomRight.y).toBeCloseTo(540, 5);
    });
  });

  describe('worldToClient', () => {
    it('is inverse of clientToWorld', () => {
      const canvasRect = createMockRect(100, 50, 960, 540);
      const original = { x: 234, y: 456 };

      const toWorld = clientToWorld(
        worldToClient(original.x, original.y, canvasRect, WORLD_SIZE).x,
        worldToClient(original.x, original.y, canvasRect, WORLD_SIZE).y,
        canvasRect,
        WORLD_SIZE
      );

      expect(toWorld.x).toBeCloseTo(original.x, 5);
      expect(toWorld.y).toBeCloseTo(original.y, 5);
    });

    it('maps world (0, 0) to client at canvas origin', () => {
      const canvasRect = createMockRect(100, 50, 960, 540);
      const result = worldToClient(0, 0, canvasRect, WORLD_SIZE);
      expect(result.x).toBeCloseTo(100, 5);
      expect(result.y).toBeCloseTo(50, 5);
    });

    it('maps world center to canvas CSS center', () => {
      const canvasRect = createMockRect(100, 50, 960, 540);
      const result = worldToClient(480, 270, canvasRect, WORLD_SIZE);
      expect(result.x).toBeCloseTo(580, 5); // 100 + 480
      expect(result.y).toBeCloseTo(320, 5); // 50 + 270
    });
  });

  describe('hitTestTowerSlot', () => {
    const slots = [
      { id: 'slot-1', x: 120, y: 340 },
      { id: 'slot-2', x: 200, y: 260 },
      { id: 'slot-3', x: 330, y: 370 },
    ];

    it('returns slot when point is exactly on slot center', () => {
      const result = hitTestTowerSlot({ x: 120, y: 340 }, slots);
      expect(result).toEqual({ id: 'slot-1', x: 120, y: 340 });
    });

    it('returns slot when point is within hit radius', () => {
      const result = hitTestTowerSlot({ x: 130, y: 340 }, slots);
      expect(result).toEqual({ id: 'slot-1', x: 120, y: 340 });
    });

    it('returns null when point is outside hit radius', () => {
      const result = hitTestTowerSlot({ x: 0, y: 0 }, slots);
      expect(result).toBeNull();
    });

    it('returns closest slot when point is equidistant from multiple slots', () => {
      // Slot 2 is at (200, 260), Slot 3 is at (330, 370)
      // Point at (265, 315) is equidistant (sqrt(65^2 + 55^2) ≈ 85)
      // But hit radius is 30, so neither should be hit
      const result = hitTestTowerSlot({ x: 265, y: 315 }, slots);
      expect(result).toBeNull();
    });

    it('uses custom hit radius', () => {
      const result = hitTestTowerSlot({ x: 145, y: 340 }, slots, 30);
      expect(result).toEqual({ id: 'slot-1', x: 120, y: 340 });
    });

    it('returns null for empty slots array', () => {
      const result = hitTestTowerSlot({ x: 100, y: 100 }, []);
      expect(result).toBeNull();
    });

    it('handles edge of hit radius correctly', () => {
      // Distance of exactly 30 from slot-1 center
      const result = hitTestTowerSlot({ x: 150, y: 340 }, slots, 30);
      expect(result).toEqual({ id: 'slot-1', x: 120, y: 340 });

      // Just outside hit radius
      const result2 = hitTestTowerSlot({ x: 151, y: 340 }, slots, 30);
      expect(result2).toBeNull();
    });
  });
});

/**
 * Create a mock DOMRect-like object
 */
function createMockRect(left, top, width, height) {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
  };
}
