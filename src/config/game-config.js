// Game configuration - all magic numbers centralized
// Object.freeze() applied to all objects

export const TowerType = Object.freeze({
  ARCHER: 'archer',
  MAGE: 'mage',
});

export const EnemyType = Object.freeze({
  SOLDIER: 'soldier',
  SCOUT: 'scout',
  ARMORED: 'armored',
});

// Tower stats
export const TOWER_STATS = Object.freeze({
  [TowerType.ARCHER]: Object.freeze({
    cost: 60,
    damage: 18,
    interval: 0.70, // seconds
    range: 145,
    projectileSpeed: 420,
  }),
  [TowerType.MAGE]: Object.freeze({
    cost: 90,
    damage: 28,
    interval: 1.10, // seconds
    range: 130,
    projectileSpeed: 300,
  }),
});

// Enemy stats
export const ENEMY_STATS = Object.freeze({
  [EnemyType.SOLDIER]: Object.freeze({
    hp: 70,
    speed: 58,
    armor: 2,
    magicRes: 0,
    reward: 14,
    leakDamage: 1,
  }),
  [EnemyType.SCOUT]: Object.freeze({
    hp: 48,
    speed: 92,
    armor: 0,
    magicRes: 0,
    reward: 12,
    leakDamage: 1,
  }),
  [EnemyType.ARMORED]: Object.freeze({
    hp: 170,
    speed: 38,
    armor: 9,
    magicRes: 2,
    reward: 25,
    leakDamage: 2,
  }),
});

// Player settings
export const PLAYER_CONFIG = Object.freeze({
  initialGold: 140,
  initialLives: 10,
  sellRefundRate: 0.60,
});

// Damage formulas
export function calculatePhysicalDamage(baseDamage, armor) {
  return Math.max(1, baseDamage - armor);
}

export function calculateMagicDamage(baseDamage, magicRes) {
  return Math.max(1, baseDamage - magicRes);
}

// Score calculation
export function calculateScore(params) {
  const { totalKillRewardGold, lives, elapsedMs, completedWave } = params;
  const baseKillScore = totalKillRewardGold * 10;
  const livesBonus = lives * 100;
  const timeBonus = Math.max(0, 30000 - Math.floor(elapsedMs / 10));
  const winScore = baseKillScore + livesBonus + timeBonus;
  const loseScore = baseKillScore + completedWave * 100;
  return { baseKillScore, livesBonus, timeBonus, winScore, loseScore };
}

export const GAME_CONFIG = Object.freeze({
  TowerType,
  EnemyType,
  TOWER_STATS,
  ENEMY_STATS,
  PLAYER_CONFIG,
  calculatePhysicalDamage,
  calculateMagicDamage,
  calculateScore,
});
