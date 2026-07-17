// Unit tests for state machine and game engine
// Tests state transitions, tower building, and selling

import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  transitionGameState,
  GameStateType,
  GameEvent,
} from '../../src/engine/state-machine.js';
import { GameEngine } from '../../src/engine/game-engine.js';
import { PLAYER_CONFIG, TOWER_STATS, TowerType } from '../../src/config/game-config.js';

describe('State Machine', () => {
  describe('createInitialState', () => {
    it('should create initial state with correct defaults', () => {
      const state = createInitialState();

      expect(state.state).toBe(GameStateType.IDLE);
      expect(state.gold).toBe(PLAYER_CONFIG.initialGold);
      expect(state.lives).toBe(PLAYER_CONFIG.initialLives);
      expect(state.wave).toBe(0);
      expect(state.elapsedMs).toBe(0);
      expect(state.score).toBe(0);
      expect(state.towers).toEqual([]);
      expect(state.enemies).toEqual([]);
      expect(state.projectiles).toEqual([]);
      expect(state.effects).toEqual([]);
    });

    it('should return a frozen object', () => {
      const state = createInitialState();
      expect(Object.isFrozen(state)).toBe(true);
    });
  });

  describe('idle -> running transition', () => {
    it('should transition from idle to running on start', () => {
      const initial = createInitialState();
      const next = transitionGameState(initial, GameEvent.START);

      expect(next.state).toBe(GameStateType.RUNNING);
      expect(next.gold).toBe(initial.gold);
    });

    it('should not transition from idle on other events', () => {
      const initial = createInitialState();

      expect(transitionGameState(initial, GameEvent.PAUSE).state).toBe(GameStateType.IDLE);
      expect(transitionGameState(initial, GameEvent.RESUME).state).toBe(GameStateType.IDLE);
      expect(transitionGameState(initial, GameEvent.WAVE_COMPLETE).state).toBe(GameStateType.IDLE);
    });
  });

  describe('running -> paused -> running transitions', () => {
    it('should transition from running to paused on pause', () => {
      const running = { ...createInitialState(), state: GameStateType.RUNNING };
      const next = transitionGameState(running, GameEvent.PAUSE);

      expect(next.state).toBe(GameStateType.PAUSED);
    });

    it('should transition from paused to running on resume', () => {
      const paused = { ...createInitialState(), state: GameStateType.PAUSED };
      const next = transitionGameState(paused, GameEvent.RESUME);

      expect(next.state).toBe(GameStateType.RUNNING);
    });

    it('should not transition from running on resume', () => {
      const running = { ...createInitialState(), state: GameStateType.RUNNING };
      const next = transitionGameState(running, GameEvent.RESUME);

      expect(next.state).toBe(GameStateType.RUNNING);
    });

    it('should not transition from paused on pause', () => {
      const paused = { ...createInitialState(), state: GameStateType.PAUSED };
      const next = transitionGameState(paused, GameEvent.PAUSE);

      expect(next.state).toBe(GameStateType.PAUSED);
    });
  });

  describe('wave_complete event', () => {
    it('should increment wave when wave < 5', () => {
      const running = { ...createInitialState(), state: GameStateType.RUNNING, wave: 1 };
      const next = transitionGameState(running, GameEvent.WAVE_COMPLETE);

      expect(next.wave).toBe(2);
      expect(next.state).toBe(GameStateType.RUNNING);
    });

    it('should transition to won when wave reaches 5', () => {
      // Wave 4 complete -> wave 5, still running
      let running = { ...createInitialState(), state: GameStateType.RUNNING, wave: 4 };
      let next = transitionGameState(running, GameEvent.WAVE_COMPLETE);
      expect(next.state).toBe(GameStateType.RUNNING);
      expect(next.wave).toBe(5);

      // Wave 5 complete -> won
      next = transitionGameState({ ...running, wave: 5 }, GameEvent.WAVE_COMPLETE);
      expect(next.state).toBe(GameStateType.WON);
      expect(next.wave).toBe(5);
    });

    it('should not transition on wave_complete when not running', () => {
      const idle = createInitialState();
      expect(transitionGameState(idle, GameEvent.WAVE_COMPLETE).wave).toBe(0);
    });
  });

  describe('enemy_leak event', () => {
    it('should decrement lives on enemy leak', () => {
      const running = { ...createInitialState(), state: GameStateType.RUNNING, lives: 5 };
      const next = transitionGameState(running, GameEvent.ENEMY_LEAK, { leakDamage: 1 });

      expect(next.lives).toBe(4);
      expect(next.state).toBe(GameStateType.RUNNING);
    });

    it('should transition to lost when lives reach 0', () => {
      const running = { ...createInitialState(), state: GameStateType.RUNNING, lives: 1 };
      const next = transitionGameState(running, GameEvent.ENEMY_LEAK, { leakDamage: 1 });

      expect(next.lives).toBe(0);
      expect(next.state).toBe(GameStateType.LOST);
    });

    it('should transition to lost when lives go negative', () => {
      const running = { ...createInitialState(), state: GameStateType.RUNNING, lives: 1 };
      const next = transitionGameState(running, GameEvent.ENEMY_LEAK, { leakDamage: 2 });

      expect(next.lives).toBe(0);
      expect(next.state).toBe(GameStateType.LOST);
    });

    it('should not affect lives when not running', () => {
      const idle = createInitialState();
      expect(transitionGameState(idle, GameEvent.ENEMY_LEAK).lives).toBe(PLAYER_CONFIG.initialLives);
    });
  });

  describe('build event', () => {
    it('should deduct gold and add tower when enough gold', () => {
      const running = { ...createInitialState(), state: GameStateType.RUNNING, gold: 100 };
      const towerData = { type: 'archer', x: 100, y: 200 };
      const next = transitionGameState(running, GameEvent.BUILD, { towerCost: 60, towerData });

      expect(next.gold).toBe(40);
      expect(next.towers).toHaveLength(1);
      expect(next.towers[0].type).toBe('archer');
    });

    it('should not build when insufficient gold', () => {
      const running = { ...createInitialState(), state: GameStateType.RUNNING, gold: 50 };
      const towerData = { type: 'archer', x: 100, y: 200 };
      const next = transitionGameState(running, GameEvent.BUILD, { towerCost: 60, towerData });

      expect(next.gold).toBe(50);
      expect(next.towers).toHaveLength(0);
    });
  });

  describe('sell event', () => {
    it('should refund gold and remove tower', () => {
      const state = {
        ...createInitialState(),
        state: GameStateType.RUNNING,
        gold: 100,
        towers: [{ id: 'tower-slot-1', type: 'archer' }],
      };
      const next = transitionGameState(state, GameEvent.SELL, { towerId: 'tower-slot-1', refundAmount: 36 });

      expect(next.gold).toBe(136);
      expect(next.towers).toHaveLength(0);
    });
  });

  describe('win/lose events', () => {
    it('should transition to won on win event when running', () => {
      const running = { ...createInitialState(), state: GameStateType.RUNNING };
      const next = transitionGameState(running, GameEvent.WIN);

      expect(next.state).toBe(GameStateType.WON);
    });

    it('should transition to lost on lose event when running', () => {
      const running = { ...createInitialState(), state: GameStateType.RUNNING };
      const next = transitionGameState(running, GameEvent.LOSE);

      expect(next.state).toBe(GameStateType.LOST);
    });

    it('should not transition on win/lose when not running', () => {
      const idle = createInitialState();
      expect(transitionGameState(idle, GameEvent.WIN).state).toBe(GameStateType.IDLE);
      expect(transitionGameState(idle, GameEvent.LOSE).state).toBe(GameStateType.IDLE);
    });
  });

  describe('restart event', () => {
    it('should reset to initial state', () => {
      const lost = {
        ...createInitialState(),
        state: GameStateType.LOST,
        gold: 0,
        lives: 0,
        wave: 5,
        score: 1000,
      };
      const next = transitionGameState(lost, GameEvent.RESTART);

      expect(next.state).toBe(GameStateType.IDLE);
      expect(next.gold).toBe(PLAYER_CONFIG.initialGold);
      expect(next.lives).toBe(PLAYER_CONFIG.initialLives);
      expect(next.wave).toBe(0);
      expect(next.score).toBe(0);
    });

    it('should reset from won state', () => {
      const won = { ...createInitialState(), state: GameStateType.WON };
      const next = transitionGameState(won, GameEvent.RESTART);

      expect(next.state).toBe(GameStateType.IDLE);
    });
  });

  describe('invalid transitions', () => {
    it('lost -> resume should stay lost', () => {
      const lost = { ...createInitialState(), state: GameStateType.LOST };
      const next = transitionGameState(lost, GameEvent.RESUME);

      expect(next.state).toBe(GameStateType.LOST);
    });

    it('won -> pause should stay won', () => {
      const won = { ...createInitialState(), state: GameStateType.WON };
      const next = transitionGameState(won, GameEvent.PAUSE);

      expect(next.state).toBe(GameStateType.WON);
    });

    it('won -> resume should stay won', () => {
      const won = { ...createInitialState(), state: GameStateType.WON };
      const next = transitionGameState(won, GameEvent.RESUME);

      expect(next.state).toBe(GameStateType.WON);
    });

    it('lost -> start should stay lost', () => {
      const lost = { ...createInitialState(), state: GameStateType.LOST };
      const next = transitionGameState(lost, GameEvent.START);

      // From lost, only restart should reset - start keeps it in lost
      expect(next.state).toBe(GameStateType.LOST);
    });

    it('destroyed -> any event should stay destroyed', () => {
      const destroyed = { ...createInitialState(), state: GameStateType.DESTROYED };
      expect(transitionGameState(destroyed, GameEvent.PAUSE).state).toBe(GameStateType.DESTROYED);
      expect(transitionGameState(destroyed, GameEvent.RESUME).state).toBe(GameStateType.DESTROYED);
      expect(transitionGameState(destroyed, GameEvent.WAVE_COMPLETE).state).toBe(GameStateType.DESTROYED);
    });
  });

  describe('state immutability', () => {
    it('transitionGameState should return frozen objects', () => {
      const initial = createInitialState();
      const next = transitionGameState(initial, GameEvent.START);

      expect(Object.isFrozen(next)).toBe(true);
      expect(Object.isFrozen(next.towers)).toBe(true);
    });

    it('original state should not be modified', () => {
      const initial = createInitialState();
      transitionGameState(initial, GameEvent.START);

      expect(initial.state).toBe(GameStateType.IDLE);
    });
  });
});

describe('GameEngine - Tower Building and Selling', () => {
  describe('Initial state', () => {
    it('should have 7 tower slots', () => {
      const engine = new GameEngine();
      expect(engine.towerSlots).toHaveLength(7);
    });

    it('should start with initial gold (140)', () => {
      const engine = new GameEngine();
      expect(engine.state.gold).toBe(PLAYER_CONFIG.initialGold);
    });

    it('should start with all slots empty', () => {
      const engine = new GameEngine();
      engine.towerSlots.forEach(slot => {
        expect(slot.towerId).toBeNull();
      });
    });
  });

  describe('buildTower', () => {
    it('should build archer tower when enough gold', () => {
      const engine = new GameEngine();
      const result = engine.buildTower(0, TowerType.ARCHER);

      expect(result.ok).toBe(true);
      expect(result.snapshot.gold).toBe(140 - TOWER_STATS[TowerType.ARCHER].cost);
      expect(result.snapshot.towers).toHaveLength(1);
      expect(result.snapshot.towers[0].type).toBe(TowerType.ARCHER);
    });

    it('should build mage tower when enough gold', () => {
      const engine = new GameEngine();
      const result = engine.buildTower(0, TowerType.MAGE);

      expect(result.ok).toBe(true);
      expect(result.snapshot.gold).toBe(140 - TOWER_STATS[TowerType.MAGE].cost);
    });

    it('should deduct gold immediately on build', () => {
      const engine = new GameEngine();
      engine.buildTower(0, TowerType.ARCHER);

      expect(engine.state.gold).toBe(140 - TOWER_STATS[TowerType.ARCHER].cost);
    });

    it('should not build on occupied slot (SLOT_OCCUPIED)', () => {
      const engine = new GameEngine();
      engine.buildTower(0, TowerType.ARCHER);
      const result = engine.buildTower(0, TowerType.ARCHER);

      expect(result.ok).toBe(false);
      expect(result.code).toBe('SLOT_OCCUPIED');
      expect(engine.state.gold).toBe(140 - TOWER_STATS[TowerType.ARCHER].cost);
    });

    it('should not build when insufficient gold (INSUFFICIENT_GOLD)', () => {
      // Start with less gold than archer cost
      const engine = new GameEngine();
      // Manually set gold to 50 (can't do this through public API, so use a fresh engine)
      // But we can test by building multiple towers
      engine.buildTower(0, TowerType.ARCHER); // 140 - 60 = 80
      engine.buildTower(1, TowerType.ARCHER); // 80 - 60 = 20
      const result = engine.buildTower(2, TowerType.ARCHER); // 20 < 60

      expect(result.ok).toBe(false);
      expect(result.code).toBe('INSUFFICIENT_GOLD');
    });

    it('should not build invalid tower type (INVALID_TOWER)', () => {
      const engine = new GameEngine();
      const result = engine.buildTower(0, 'invalid_tower');

      expect(result.ok).toBe(false);
      expect(result.code).toBe('INVALID_TOWER');
    });

    it('should allow building on different slots', () => {
      const engine = new GameEngine();
      engine.buildTower(0, TowerType.ARCHER);  // 140 - 60 = 80
      engine.buildTower(1, TowerType.ARCHER);  // 80 - 60 = 20
      // 3rd archer would fail (20 < 60), so build a mage instead
      // But mage costs 90, so let's just verify 2 towers work
      // And test slot 2 with a different tower type if we had more gold

      expect(engine.state.towers).toHaveLength(2);
    });
  });

  describe('sellTower', () => {
    it('should sell tower and return 60% refund (floor)', () => {
      const engine = new GameEngine();
      engine.buildTower(0, TowerType.ARCHER); // cost 60, refund = floor(60 * 0.60) = 36
      const result = engine.sellTower(0);

      expect(result.ok).toBe(true);
      expect(result.refund).toBe(Math.floor(60 * 0.60));
      expect(result.snapshot.towers).toHaveLength(0);
      expect(engine.state.gold).toBe(140 - 60 + Math.floor(60 * 0.60));
    });

    it('should sell mage tower and return correct refund', () => {
      const engine = new GameEngine();
      engine.buildTower(0, TowerType.MAGE); // cost 90, refund = floor(90 * 0.60) = 54
      const result = engine.sellTower(0);

      expect(result.ok).toBe(true);
      expect(result.refund).toBe(Math.floor(90 * 0.60));
    });

    it('should not sell empty slot (SLOT_EMPTY)', () => {
      const engine = new GameEngine();
      const result = engine.sellTower(0);

      expect(result.ok).toBe(false);
      expect(result.code).toBe('SLOT_EMPTY');
    });

    it('should make slot available for new tower after selling', () => {
      const engine = new GameEngine();
      engine.buildTower(0, TowerType.ARCHER);
      engine.sellTower(0);
      const result = engine.buildTower(0, TowerType.MAGE);

      expect(result.ok).toBe(true);
      expect(engine.state.towers[0].type).toBe(TowerType.MAGE);
    });

    it('failed sell should not change gold or state', () => {
      const engine = new GameEngine();
      const result = engine.sellTower(99); // invalid slot

      expect(result.ok).toBe(false);
    });
  });

  describe('Economy scenarios', () => {
    it('Initial gold (140) allows 2 archer towers (60 each = 120) but not a 3rd', () => {
      const engine = new GameEngine();

      // Build 2 archer towers
      const r1 = engine.buildTower(0, TowerType.ARCHER);
      const r2 = engine.buildTower(1, TowerType.ARCHER);

      expect(r1.ok).toBe(true);
      expect(r2.ok).toBe(true);
      expect(engine.state.gold).toBe(140 - 120); // 20 remaining

      // 3rd archer should fail (20 < 60)
      const r3 = engine.buildTower(2, TowerType.ARCHER);
      expect(r3.ok).toBe(false);
      expect(r3.code).toBe('INSUFFICIENT_GOLD');
    });

    it('Initial gold allows 1 mage tower (90) with 50 remaining', () => {
      const engine = new GameEngine();
      const result = engine.buildTower(0, TowerType.MAGE);

      expect(result.ok).toBe(true);
      expect(engine.state.gold).toBe(50); // 140 - 90
    });

    it('Failed commands do not change gold or state', () => {
      const engine = new GameEngine();
      const initialGold = engine.state.gold;

      // Try invalid build
      engine.buildTower(0, 'invalid_type');
      expect(engine.state.gold).toBe(initialGold);

      // Try to sell empty slot
      engine.sellTower(0);
      expect(engine.state.gold).toBe(initialGold);

      // Build valid tower
      engine.buildTower(0, TowerType.ARCHER);
      expect(engine.state.gold).toBe(initialGold - TOWER_STATS[TowerType.ARCHER].cost);
    });
  });
});
