// Unit tests for state machine
// Tests state transitions and game logic

import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  transitionGameState,
  GameStateType,
  GameEvent,
} from '../../src/engine/state-machine.js';
import { PLAYER_CONFIG } from '../../src/config/game-config.js';

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
