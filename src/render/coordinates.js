/**
 * Coordinate transformation utilities
 * Converts between browser CSS pixel coordinates and 960x540 world coordinates
 * DPR-aware: uses CSS rect dimensions, not physical pixels
 */

/**
 * Converts browser CSS pixel coordinates to world coordinates (960x540)
 * @param {number} clientX - CSS pixel X coordinate (browser space)
 * @param {number} clientY - CSS pixel Y coordinate (browser space)
 * @param {DOMRect} canvasRect - Canvas bounding rect in CSS pixels
 * @param {{width: number, height: number}} worldSize - World dimensions
 * @returns {{x: number, y: number}} World coordinates
 */
export function clientToWorld(clientX, clientY, canvasRect, worldSize) {
  const x = (clientX - canvasRect.left) * (worldSize.width / canvasRect.width);
  const y = (clientY - canvasRect.top) * (worldSize.height / canvasRect.height);
  return { x, y };
}

/**
 * Converts world coordinates to browser CSS pixel coordinates
 * @param {number} worldX - World X coordinate
 * @param {number} worldY - World Y coordinate
 * @param {DOMRect} canvasRect - Canvas bounding rect in CSS pixels
 * @param {{width: number, height: number}} worldSize - World dimensions
 * @returns {{x: number, y: number}} CSS pixel coordinates
 */
export function worldToClient(worldX, worldY, canvasRect, worldSize) {
  const x = (worldX / worldSize.width) * canvasRect.width + canvasRect.left;
  const y = (worldY / worldSize.height) * canvasRect.height + canvasRect.top;
  return { x, y };
}

/**
 * Tests if a world point hits a tower slot
 * @param {{x: number, y: number}} point - World coordinates
 * @param {Array<{id: string, x: number, y: number}>} slots - Tower slot definitions
 * @param {number} [hitRadius=30] - Hit radius in world units
 * @returns {{id: string, x: number, y: number} | null} The hit slot or null
 */
export function hitTestTowerSlot(point, slots, hitRadius = 30) {
  for (const slot of slots) {
    const dx = point.x - slot.x;
    const dy = point.y - slot.y;
    if (dx * dx + dy * dy <= hitRadius * hitRadius) {
      return slot;
    }
  }
  return null;
}
