// Score calculation - pure functions, no DOM/Canvas dependencies.
// Implements the formula defined in spec §8.1:
//   基础击杀分 = 累计击杀奖励金币 × 10
//   剩余生命奖励 = lives × 100
//   通关时间奖励 = max(0, 30000 - floor(elapsedMs / 10))
//   胜利总分 = 基础击杀分 + 剩余生命奖励 + 通关时间奖励
//   失败总分 = 基础击杀分 + 已完成波次 × 100

/**
 * Compute the win score breakdown.
 * @param {number} totalKillRewardGold - Cumulative gold earned from enemy kills (not current balance).
 * @param {number} lives - Remaining player lives after the final wave.
 * @param {number} elapsedMs - Total game time in milliseconds.
 * @returns {{baseKillScore: number, livesBonus: number, timeBonus: number, winScore: number}}
 */
export function calculateWinScore(totalKillRewardGold, lives, elapsedMs) {
  const baseKillScore = Math.max(0, totalKillRewardGold) * 10;
  const livesBonus = Math.max(0, lives) * 100;
  const safeElapsed = Math.max(0, elapsedMs);
  const timeBonus = Math.max(0, 30000 - Math.floor(safeElapsed / 10));
  const winScore = baseKillScore + livesBonus + timeBonus;
  return { baseKillScore, livesBonus, timeBonus, winScore };
}

/**
 * Compute the lose score breakdown.
 * @param {number} totalKillRewardGold - Cumulative gold earned from enemy kills before defeat.
 * @param {number} completedWave - Index of the last completed wave (0 if none).
 * @returns {{baseKillScore: number, loseScore: number}}
 */
export function calculateLoseScore(totalKillRewardGold, completedWave) {
  const baseKillScore = Math.max(0, totalKillRewardGold) * 10;
  const safeCompleted = Math.max(0, completedWave);
  const loseScore = baseKillScore + safeCompleted * 100;
  return { baseKillScore, loseScore };
}

/**
 * Convenience: compute the right score variant given the game outcome.
 * @param {{outcome: 'win'|'lose', totalKillRewardGold: number, lives: number, elapsedMs: number, completedWave: number}} params
 */
export function calculateScore(params) {
  const { outcome, totalKillRewardGold = 0, lives = 0, elapsedMs = 0, completedWave = 0 } = params;
  if (outcome === 'win') {
    return calculateWinScore(totalKillRewardGold, lives, elapsedMs);
  }
  return calculateLoseScore(totalKillRewardGold, completedWave);
}
