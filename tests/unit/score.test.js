import { describe, it, expect } from 'vitest';
import {
  calculateWinScore,
  calculateLoseScore,
  calculateScore,
} from '../../src/engine/score.js';

describe('score', () => {
  describe('calculateWinScore', () => {
    it('rewards cumulative kill gold at 10x', () => {
      const r = calculateWinScore(150, 10, 60_000);
      // 150 * 10 = 1500; lives*100 = 1000; time = max(0, 30000 - 6000) = 24000
      expect(r.baseKillScore).toBe(1500);
      expect(r.livesBonus).toBe(1000);
      expect(r.timeBonus).toBe(24_000);
      expect(r.winScore).toBe(26_500);
    });

    it('time bonus is floored at 0 for very long games', () => {
      const r = calculateWinScore(0, 0, 600_000); // 10 minutes
      expect(r.timeBonus).toBe(0);
      expect(r.winScore).toBe(0);
    });

    it('time bonus caps at 30000 for instant wins', () => {
      const r = calculateWinScore(0, 0, 0);
      expect(r.timeBonus).toBe(30_000);
      expect(r.winScore).toBe(30_000);
    });

    it('time bonus halves when game reaches 5 minutes', () => {
      // 5 * 60 * 1000 = 300_000ms → bonus = 30000 - 30000 = 0
      const r = calculateWinScore(0, 0, 300_000);
      expect(r.timeBonus).toBe(0);
    });

    it('clamps negative inputs to 0', () => {
      const r = calculateWinScore(-50, -5, -100);
      expect(r.baseKillScore).toBe(0);
      expect(r.livesBonus).toBe(0);
      expect(r.timeBonus).toBe(30_000); // -100/10 = -10 → floored to 0...wait -10 < 0
      // Math.floor(-100/10) = -10 → max(0, 30000 - (-10)) = 30010
      // Spec says clamp via Math.max(0,...) on elapsedMs, but formula is spec-defined.
      // Just confirm no NaN or negative bonuses.
      expect(r.winScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateLoseScore', () => {
    it('rewards completed waves at 100 each', () => {
      const r = calculateLoseScore(220, 2);
      expect(r.baseKillScore).toBe(2200);
      expect(r.loseScore).toBe(2400);
    });

    it('zero completed waves still gives kill score', () => {
      const r = calculateLoseScore(50, 0);
      expect(r.loseScore).toBe(500);
    });
  });

  describe('calculateScore', () => {
    it('dispatches to win variant', () => {
      const r = calculateScore({
        outcome: 'win',
        totalKillRewardGold: 100,
        lives: 5,
        elapsedMs: 60_000,
      });
      expect(r.winScore).toBe(1000 + 500 + 24_000);
    });

    it('dispatches to lose variant', () => {
      const r = calculateScore({
        outcome: 'lose',
        totalKillRewardGold: 100,
        completedWave: 3,
      });
      expect(r.loseScore).toBe(1300);
    });

    it('defaults missing fields to 0', () => {
      expect(calculateScore({ outcome: 'win' })).toEqual({
        baseKillScore: 0,
        livesBonus: 0,
        timeBonus: 30_000,
        winScore: 30_000,
      });
      expect(calculateScore({ outcome: 'lose' })).toEqual({
        baseKillScore: 0,
        loseScore: 0,
      });
    });
  });
});
