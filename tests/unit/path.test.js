// Unit tests for path math utilities

import { describe, it, expect } from 'vitest';
import { createPath, samplePath } from '../../src/engine/path.js';
import { PATH_POINTS } from '../../src/config/map-config.js';

describe('Path', () => {
  describe('createPath', () => {
    it('should create a path with segments', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ];

      const path = createPath(points);

      expect(path.segments).toHaveLength(2);
      expect(path.totalLength).toBeGreaterThan(0);
    });

    it('should throw for less than 2 points', () => {
      expect(() => createPath([])).toThrow();
      expect(() => createPath([{ x: 0, y: 0 }])).toThrow();
    });

    it('should return a frozen object', () => {
      const path = createPath([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ]);

      expect(Object.isFrozen(path)).toBe(true);
      expect(Object.isFrozen(path.segments)).toBe(true);
    });

    it('should calculate correct segment lengths', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 300, y: 0 },  // length = 300
        { x: 300, y: 400 }, // length = 400
      ];

      const path = createPath(points);

      expect(path.segments).toHaveLength(2);
      expect(path.segments[0].length).toBe(300);
      expect(path.segments[1].length).toBe(400);
      expect(path.totalLength).toBe(700);
    });

    it('should calculate correct angles', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },   // angle = 0 (right)
        { x: 100, y: 100 }, // angle = PI/2 (down)
      ];

      const path = createPath(points);

      expect(path.segments[0].angle).toBeCloseTo(0, 5);
      expect(path.segments[1].angle).toBeCloseTo(Math.PI / 2, 5);
    });
  });

  describe('samplePath', () => {
    it('should return start point at distance 0', () => {
      const points = [
        { x: 10, y: 20 },
        { x: 110, y: 20 },
      ];

      const path = createPath(points);
      const sample = samplePath(path, 0);

      expect(sample.x).toBeCloseTo(10, 5);
      expect(sample.y).toBeCloseTo(20, 5);
      expect(sample.progress).toBe(0);
    });

    it('should return end point at totalLength', () => {
      const points = [
        { x: 10, y: 20 },
        { x: 110, y: 20 },
      ];

      const path = createPath(points);
      const sample = samplePath(path, path.totalLength);

      expect(sample.x).toBeCloseTo(110, 5);
      expect(sample.y).toBeCloseTo(20, 5);
      expect(sample.progress).toBe(1);
    });

    it('should clamp negative distance to start', () => {
      const points = [
        { x: 10, y: 20 },
        { x: 110, y: 20 },
      ];

      const path = createPath(points);
      const sample = samplePath(path, -50);

      expect(sample.x).toBeCloseTo(10, 5);
      expect(sample.y).toBeCloseTo(20, 5);
      expect(sample.progress).toBe(0);
    });

    it('should clamp distance beyond totalLength to end', () => {
      const points = [
        { x: 10, y: 20 },
        { x: 110, y: 20 },
      ];

      const path = createPath(points);
      const sample = samplePath(path, path.totalLength + 100);

      expect(sample.x).toBeCloseTo(110, 5);
      expect(sample.y).toBeCloseTo(20, 5);
      expect(sample.progress).toBe(1);
    });

    it('should return correct position at midpoint', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 200, y: 0 },
      ];

      const path = createPath(points);
      const midpoint = path.totalLength / 2;
      const sample = samplePath(path, midpoint);

      expect(sample.x).toBeCloseTo(100, 5);
      expect(sample.y).toBeCloseTo(0, 5);
      expect(sample.progress).toBeCloseTo(0.5, 5);
    });

    it('should return correct angle at waypoints', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },   // horizontal right (angle = 0)
        { x: 100, y: 100 }, // vertical down (angle = PI/2)
      ];

      const path = createPath(points);

      // At start of first segment
      const sample1 = samplePath(path, 0);
      expect(sample1.angle).toBeCloseTo(0, 5);

      // At start of second segment (at x=100, y=0)
      const sample2 = samplePath(path, 100);
      expect(sample2.angle).toBeCloseTo(Math.PI / 2, 5);
    });

    it('should handle multi-segment paths correctly', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 200, y: 100 },
      ];

      const path = createPath(points);

      // First segment is horizontal
      const sample1 = samplePath(path, 50);
      expect(sample1.x).toBeCloseTo(50, 5);
      expect(sample1.y).toBeCloseTo(0, 5);

      // Second segment is vertical
      const sample2 = samplePath(path, 150); // 100 + 50 into second segment
      expect(sample2.x).toBeCloseTo(100, 5);
      expect(sample2.y).toBeCloseTo(50, 5);
    });
  });

  describe('PATH_POINTS from map-config', () => {
    it('should produce path length greater than 1000 pixels', () => {
      const path = createPath(PATH_POINTS);
      expect(path.totalLength).toBeGreaterThan(1000);
    });

    it('should have correct number of segments', () => {
      const path = createPath(PATH_POINTS);
      // PATH_POINTS has 9 points, so 8 segments
      expect(path.segments).toHaveLength(PATH_POINTS.length - 1);
    });

    it('should sample correctly along the path', () => {
      const path = createPath(PATH_POINTS);

      // Start point
      const start = samplePath(path, 0);
      expect(start.x).toBeCloseTo(PATH_POINTS[0].x, 5);
      expect(start.y).toBeCloseTo(PATH_POINTS[0].y, 5);
      expect(start.progress).toBe(0);

      // End point
      const end = samplePath(path, path.totalLength);
      expect(end.x).toBeCloseTo(PATH_POINTS[PATH_POINTS.length - 1].x, 5);
      expect(end.y).toBeCloseTo(PATH_POINTS[PATH_POINTS.length - 1].y, 5);
      expect(end.progress).toBe(1);
    });
  });
});
