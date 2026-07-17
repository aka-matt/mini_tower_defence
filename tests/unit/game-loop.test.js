// Unit tests for game loop

import { describe, it, expect, beforeEach } from 'vitest';
import { createGameLoop } from '../../src/engine/game-loop.js';

describe('createGameLoop', () => {
  const FIXED_TIMESTEP = 1 / 60;

  describe('basic lifecycle', () => {
    it('should create a game loop in stopped state', () => {
      const loop = createGameLoop({
        update: () => {},
        render: () => {},
        now: () => 0,
        requestFrame: () => 1,
        cancelFrame: () => {},
      });

      expect(loop.isRunning()).toBe(false);
    });

    it('should start and set isRunning to true', () => {
      const loop = createGameLoop({
        update: () => {},
        render: () => {},
        now: () => 0,
        requestFrame: () => 1,
        cancelFrame: () => {},
      });

      loop.start();
      expect(loop.isRunning()).toBe(true);
    });

    it('should stop and set isRunning to false', () => {
      const loop = createGameLoop({
        update: () => {},
        render: () => {},
        now: () => 0,
        requestFrame: () => 1,
        cancelFrame: () => {},
      });

      loop.start();
      loop.stop();
      expect(loop.isRunning()).toBe(false);
    });

    it('should call cancelFrame when stopped', () => {
      let cancelled = false;
      const loop = createGameLoop({
        update: () => {},
        render: () => {},
        now: () => 0,
        requestFrame: () => 1,
        cancelFrame: () => { cancelled = true; },
      });

      loop.start();
      loop.stop();
      expect(cancelled).toBe(true);
    });
  });

  describe('pause and resume', () => {
    it('should pause and resume correctly', () => {
      const loop = createGameLoop({
        update: () => {},
        render: () => {},
        now: () => 0,
        requestFrame: () => 1,
        cancelFrame: () => {},
      });

      loop.start();
      loop.pause();
      expect(loop.isRunning()).toBe(true); // Still running, just paused

      loop.resume();
      expect(loop.isRunning()).toBe(true);
    });
  });

  describe('fixed timestep determinism', () => {
    it('should produce same result at 30fps as 60fps after 10 seconds', () => {
      const updates30fps = [];
      const updates60fps = [];

      // 30 FPS simulation - larger delta, fewer steps per frame
      {
        const FIXED = FIXED_TIMESTEP;
        const targetTime = 10; // 10 seconds
        const frameInterval = 1000 / 30; // ~33.33ms per frame

        const update = (dt) => {
          updates30fps.push(dt);
        };

        const render = () => {};

        let currentTime = 0;
        let rafCallback = null;

        const now = () => currentTime;
        const requestFrame = (cb) => {
          rafCallback = cb;
          return 1;
        };
        const cancelFrame = () => {
          rafCallback = null;
        };

        const loop = createGameLoop({ update, render, now, requestFrame, cancelFrame });
        loop.start();

        // Simulate frames at 30fps until 10 seconds
        while (currentTime < targetTime * 1000) {
          currentTime += frameInterval;
          // Invoke the RAF callback to process this frame
          if (rafCallback) rafCallback();
        }

        // After 10 seconds, stop and verify
        loop.stop();
      }

      // 60 FPS simulation
      {
        const FIXED = FIXED_TIMESTEP;
        const targetTime = 10; // 10 seconds
        const frameInterval = 1000 / 60; // ~16.67ms per frame

        const update = (dt) => {
          updates60fps.push(dt);
        };

        const render = () => {};

        let currentTime = 0;
        let rafCallback = null;

        const now = () => currentTime;
        const requestFrame = (cb) => {
          rafCallback = cb;
          return 1;
        };
        const cancelFrame = () => {
          rafCallback = null;
        };

        const loop = createGameLoop({ update, render, now, requestFrame, cancelFrame });
        loop.start();

        // Simulate frames at 60fps until 10 seconds
        while (currentTime < targetTime * 1000) {
          currentTime += frameInterval;
          // Invoke the RAF callback to process this frame
          if (rafCallback) rafCallback();
        }

        // After 10 seconds, stop and verify
        loop.stop();
      }

      // Both should have processed approximately the same number of fixed steps
      // (allowing for small rounding differences due to accumulation pattern)
      expect(Math.abs(updates30fps.length - updates60fps.length)).toBeLessThanOrEqual(1);
    });

    it('should produce same result at 120fps as 60fps after 10 seconds', () => {
      const updates120fps = [];
      const updates60fps = [];

      // 120 FPS simulation
      {
        const FIXED = FIXED_TIMESTEP;
        const targetTime = 10;
        const frameInterval = 1000 / 120;

        const update = (dt) => {
          updates120fps.push(dt);
        };

        const render = () => {};

        let currentTime = 0;
        let rafCallback = null;

        const now = () => currentTime;
        const requestFrame = (cb) => {
          rafCallback = cb;
          return 1;
        };
        const cancelFrame = () => {
          rafCallback = null;
        };

        const loop = createGameLoop({ update, render, now, requestFrame, cancelFrame });
        loop.start();

        while (currentTime < targetTime * 1000) {
          currentTime += frameInterval;
          if (rafCallback) rafCallback();
        }

        loop.stop();
      }

      // 60 FPS simulation
      {
        const FIXED = FIXED_TIMESTEP;
        const targetTime = 10;
        const frameInterval = 1000 / 60;

        const update = (dt) => {
          updates60fps.push(dt);
        };

        const render = () => {};

        let currentTime = 0;
        let rafCallback = null;

        const now = () => currentTime;
        const requestFrame = (cb) => {
          rafCallback = cb;
          return 1;
        };
        const cancelFrame = () => {
          rafCallback = null;
        };

        const loop = createGameLoop({ update, render, now, requestFrame, cancelFrame });
        loop.start();

        while (currentTime < targetTime * 1000) {
          currentTime += frameInterval;
          if (rafCallback) rafCallback();
        }

        loop.stop();
      }

      expect(Math.abs(updates120fps.length - updates60fps.length)).toBeLessThanOrEqual(1);
    });

    it('should always call update with exactly FIXED_TIMESTEP', () => {
      const updateCalls = [];
      const FIXED = FIXED_TIMESTEP;

      const update = (dt) => {
        updateCalls.push(dt);
      };

      const render = () => {};

      let currentTime = 0;
      let rafCallback = null;

      const now = () => currentTime;
      const requestFrame = (cb) => {
        rafCallback = cb;
        return 1;
      };
      const cancelFrame = () => {
        rafCallback = null;
      };

      const loop = createGameLoop({ update, render, now, requestFrame, cancelFrame });
      loop.start();

      // Simulate 1 second at varying frame rates
      const frameInterval = 1000 / 120; // 120fps
      while (currentTime < 1000) {
        currentTime += frameInterval;
        if (rafCallback) rafCallback();
      }

      loop.stop();

      // All update calls should be exactly FIXED_TIMESTEP
      for (const dt of updateCalls) {
        expect(dt).toBe(FIXED);
      }
    });
  });

  describe('max accumulated time cap', () => {
    it('should cap single frame accumulated time at 0.25s', () => {
      const updateCalls = [];
      const FIXED = FIXED_TIMESTEP;
      const MAX_ACCUM = 0.25;

      const update = (dt) => {
        updateCalls.push(dt);
      };

      const render = () => {};

      let currentTime = 0;
      let rafCallback = null;

      const now = () => currentTime;
      const requestFrame = (cb) => {
        rafCallback = cb;
        return 1;
      };
      const cancelFrame = () => {
        rafCallback = null;
      };

      const loop = createGameLoop({ update, render, now, requestFrame, cancelFrame });
      loop.start();

      // Simulate a single frame with 500ms delta
      // This exceeds MAX_ACCUMULATED_TIME (0.25s), so it should be capped
      currentTime = 500;
      if (rafCallback) rafCallback();

      loop.stop();

      // The total accumulated update time should be at most MAX_ACCUM + one extra FIXED
      // (the cap is on delta, not accumulator, but we process in FIXED increments)
      const totalAccumulatedTime = updateCalls.length * FIXED;
      expect(totalAccumulatedTime).toBeLessThanOrEqual(MAX_ACCUM + FIXED);
    });
  });

  describe('pause behavior', () => {
    it('should not accumulate time when paused', () => {
      const updateCalls = [];
      const FIXED = FIXED_TIMESTEP;

      const update = (dt) => {
        updateCalls.push(dt);
      };

      const render = () => {};

      let currentTime = 0;
      let rafCallback = null;

      const now = () => currentTime;
      const requestFrame = (cb) => {
        rafCallback = cb;
        return 1;
      };
      const cancelFrame = () => {
        rafCallback = null;
      };

      const loop = createGameLoop({ update, render, now, requestFrame, cancelFrame });
      loop.start();

      // Process some time while running
      currentTime = 100;
      if (rafCallback) rafCallback();

      const updatesBeforePause = updateCalls.length;

      // Pause
      loop.pause();

      // Continue advancing time but callbacks won't process updates
      currentTime = 200;
      if (rafCallback) rafCallback();

      const updatesAfterPause = updateCalls.length;

      // No new updates should have been added since we're paused
      expect(updatesAfterPause).toBe(updatesBeforePause);
    });
  });

  describe('multiple start/pause/resume cycles', () => {
    it('should work correctly through multiple cycles', () => {
      const updates = [];
      let rafCallback = null;
      let frameCount = 0;

      const update = (dt) => {
        updates.push(dt);
      };

      const render = () => {};

      let currentTime = 0;
      const now = () => currentTime;
      const requestFrame = (cb) => {
        rafCallback = cb;
        return ++frameCount;
      };
      const cancelFrame = () => {
        rafCallback = null;
      };

      const loop = createGameLoop({ update, render, now, requestFrame, cancelFrame });

      // Start
      loop.start();
      currentTime = 100;
      if (rafCallback) rafCallback();

      // Pause
      loop.pause();

      // Resume
      loop.resume();
      currentTime = 200;
      if (rafCallback) rafCallback();

      // Pause again
      loop.pause();

      // Resume again
      loop.resume();
      currentTime = 300;
      if (rafCallback) rafCallback();

      // Stop
      loop.stop();

      // The loop should have gone through these cycles without issues
      expect(loop.isRunning()).toBe(false);
      expect(updates.length).toBeGreaterThan(0);
    });
  });

  describe('getElapsedMs', () => {
    it('should return 0 when not running', () => {
      const loop = createGameLoop({
        update: () => {},
        render: () => {},
        now: () => 0,
        requestFrame: () => 1,
        cancelFrame: () => {},
      });

      expect(loop.getElapsedMs()).toBe(0);
    });

    it('should return correct elapsed time while running', () => {
      let currentTime = 0;
      let rafCallback = null;

      const loop = createGameLoop({
        update: () => {},
        render: () => {},
        now: () => currentTime,
        requestFrame: (cb) => {
          rafCallback = cb;
          return 1;
        },
        cancelFrame: () => {
          rafCallback = null;
        },
      });

      loop.start();
      currentTime = 100;
      if (rafCallback) rafCallback();

      // getElapsedMs should be close to 100ms
      expect(loop.getElapsedMs()).toBe(100);
    });
  });

  describe('getFixedTimestep', () => {
    it('should return the fixed timestep value', () => {
      const loop = createGameLoop({
        update: () => {},
        render: () => {},
        now: () => 0,
        requestFrame: () => 1,
        cancelFrame: () => {},
      });

      expect(loop.getFixedTimestep()).toBe(1 / 60);
    });
  });

  describe('render interpolation', () => {
    it('should pass interpolation factor to render', () => {
      const renderCalls = [];

      const update = () => {};
      const render = (interpolation) => {
        renderCalls.push(interpolation);
      };

      let currentTime = 0;
      let rafCallback = null;

      const now = () => currentTime;
      const requestFrame = (cb) => {
        rafCallback = cb;
        return 1;
      };
      const cancelFrame = () => {
        rafCallback = null;
      };

      const loop = createGameLoop({ update, render, now, requestFrame, cancelFrame });
      loop.start();

      // Process a few frames
      for (let i = 0; i < 5; i++) {
        currentTime += 1000 / 60;
        if (rafCallback) rafCallback();
      }

      loop.stop();

      // Interpolation should be between 0 and 1
      for (const interp of renderCalls) {
        expect(interp).toBeGreaterThanOrEqual(0);
        expect(interp).toBeLessThan(1);
      }
    });
  });
});
