// Map configuration - path points, tower slots, world size
// Object.freeze() applied to all values

// Path that enemies follow through the map
export const PATH_POINTS = Object.freeze([
  { x: -30, y: 400 },
  { x: 145, y: 400 },
  { x: 245, y: 315 },
  { x: 410, y: 315 },
  { x: 505, y: 420 },
  { x: 665, y: 420 },
  { x: 735, y: 245 },
  { x: 900, y: 245 },
  { x: 990, y: 245 },
]);

// Tower slot positions - placed near path bends for strategic value
export const TOWER_SLOTS = Object.freeze([
  { x: 120, y: 340 },   // Near first bend
  { x: 200, y: 260 },   // Near second bend
  { x: 330, y: 370 },   // Near third bend
  { x: 460, y: 370 },   // Near fourth bend
  { x: 580, y: 340 },   // Near fifth bend
  { x: 700, y: 290 },   // Near sixth bend
  { x: 830, y: 190 },   // Near final stretch
]);

// World dimensions
export const WORLD_SIZE = Object.freeze({
  width: 960,
  height: 540,
});

export const MAP_CONFIG = Object.freeze({
  PATH_POINTS,
  TOWER_SLOTS,
  WORLD_SIZE,
});
