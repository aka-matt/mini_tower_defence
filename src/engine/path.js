// Path math utilities - pure functions, no Canvas/DOM dependencies
// Pre-computes path segments for efficient sampling at any distance

/**
 * Create a PathModel from waypoints.
 * @param {{x: number, y: number}[]} points - Array of waypoints
 * @returns {PathModel} Frozen object with totalLength and segments
 */
export function createPath(points) {
  if (!points || points.length < 2) {
    throw new Error('Path requires at least 2 points');
  }

  const segments = [];

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx); // 0 = right, positive = clockwise

    segments.push(Object.freeze({
      start: Object.freeze({ x: start.x, y: start.y }),
      end: Object.freeze({ x: end.x, y: end.y }),
      length,
      angle,
    }));
  }

  const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0);

  return Object.freeze({
    totalLength,
    segments: Object.freeze(segments),
  });
}

/**
 * Sample position and angle at given distance along path.
 * @param {PathModel} path - The path to sample
 * @param {number} distance - Distance along path in pixels
 * @returns {{x: number, y: number, angle: number, progress: number}}
 */
export function samplePath(path, distance) {
  const { totalLength, segments } = path;

  // Clamp distance to valid range
  if (distance <= 0) {
    return {
      x: segments[0].start.x,
      y: segments[0].start.y,
      angle: segments[0].angle,
      progress: 0,
    };
  }

  if (distance >= totalLength) {
    const lastSeg = segments[segments.length - 1];
    return {
      x: lastSeg.end.x,
      y: lastSeg.end.y,
      angle: lastSeg.angle,
      progress: 1,
    };
  }

  // Find the segment containing this distance
  let accumulatedLength = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (distance < accumulatedLength + seg.length) {
      // Found the segment
      const localDistance = distance - accumulatedLength;
      const t = seg.length > 0 ? localDistance / seg.length : 0;

      const x = seg.start.x + (seg.end.x - seg.start.x) * t;
      const y = seg.start.y + (seg.end.y - seg.start.y) * t;

      return {
        x,
        y,
        angle: seg.angle,
        progress: distance / totalLength,
      };
    }

    accumulatedLength += seg.length;
  }

  // Fallback (shouldn't reach here due to clamping above)
  const lastSeg = segments[segments.length - 1];
  return {
    x: lastSeg.end.x,
    y: lastSeg.end.y,
    angle: lastSeg.angle,
    progress: 1,
  };
}
