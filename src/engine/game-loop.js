// Fixed timestep game loop with accumulator pattern
// No DOM/Canvas dependencies - uses injected functions for time and frame management

const FIXED_TIMESTEP = 1 / 60; // 60 FPS
const MAX_ACCUMULATED_TIME = 0.25; // Max 250ms to prevent spiral of death

/**
 * Create a game loop with the given dependencies.
 *
 * @param {Object} deps - Dependencies
 * @param {Function} deps.update - Called with fixed 1/60s steps: update(deltaSeconds)
 * @param {Function} deps.render - Called each RAF with interpolation factor: render(interpolation)
 * @param {Function} deps.now - Returns current time in ms: now() => number
 * @param {Function} deps.requestFrame - Wraps requestAnimationFrame: requestFrame(callback) => id
 * @param {Function} deps.cancelFrame - Cancels the RAF: cancelFrame(id)
 * @returns {GameLoop}
 */
export function createGameLoop({ update, render, now, requestFrame, cancelFrame }) {
  let rafId = null;
  let accumulatedTime = 0;
  let startTime = 0;
  let pausedTime = 0;
  let elapsedMs = 0;
  let running = false;
  let paused = false;

  /**
   * Main loop function - called each RAF
   */
  function loop() {
    if (!running) {
      return;
    }

    const currentTime = now();
    const deltaMs = currentTime - startTime;
    startTime = currentTime;

    if (!paused) {
      elapsedMs += deltaMs;

      // Convert to seconds and add to accumulator
      let deltaSeconds = deltaMs / 1000;

      // Cap single frame delta to prevent spiral of death
      if (deltaSeconds > MAX_ACCUMULATED_TIME) {
        deltaSeconds = MAX_ACCUMULATED_TIME;
      }

      accumulatedTime += deltaSeconds;

      // Process fixed timestep updates
      while (accumulatedTime >= FIXED_TIMESTEP) {
        update(FIXED_TIMESTEP);
        accumulatedTime -= FIXED_TIMESTEP;
      }

      // Calculate interpolation factor (0-1) for smooth rendering
      const interpolation = accumulatedTime / FIXED_TIMESTEP;
      render(interpolation);
    }

    // Schedule next frame
    rafId = requestFrame(loop);
  }

  const gameLoop = {
    /**
     * Start the game loop
     */
    start() {
      if (running) {
        return;
      }

      running = true;
      paused = false;
      startTime = now();
      elapsedMs = 0;
      accumulatedTime = 0;

      rafId = requestFrame(loop);
    },

    /**
     * Pause the game loop - stops update calls but render may still be called by RAF
     */
    pause() {
      if (!running) {
        return;
      }

      paused = true;
      pausedTime = elapsedMs;
    },

    /**
     * Resume the game loop from paused state
     */
    resume() {
      if (!running) {
        return;
      }

      if (!paused) {
        return;
      }

      paused = false;
      startTime = now();
    },

    /**
     * Stop the game loop and cancel the RAF
     */
    stop() {
      if (!running) {
        return;
      }

      running = false;
      paused = false;

      if (rafId !== null) {
        cancelFrame(rafId);
        rafId = null;
      }
    },

    /**
     * Check if the loop is currently running
     * @returns {boolean}
     */
    isRunning() {
      return running;
    },

    /**
     * Get elapsed time in milliseconds
     * @returns {number}
     */
    getElapsedMs() {
      if (!running) {
        return 0;
      }
      if (paused) {
        return pausedTime;
      }
      return elapsedMs;
    },

    /**
     * Get the fixed timestep value
     * @returns {number}
     */
    getFixedTimestep() {
      return FIXED_TIMESTEP;
    },
  };

  return Object.freeze(gameLoop);
}

/**
 * @typedef {Object} GameLoop
 * @property {Function} start - Start the loop
 * @property {Function} pause - Pause the loop
 * @property {Function} resume - Resume the loop
 * @property {Function} stop - Stop the loop
 * @property {Function} isRunning - Check if running
 * @property {Function} getElapsedMs - Get elapsed time in ms
 * @property {Function} getFixedTimestep - Get fixed timestep value
 */
