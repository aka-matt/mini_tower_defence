/**
 * AudioManager - Web Audio API based sound effects manager.
 *
 * Sounds are synthesised via oscillators (no external audio files needed).
 * The manager is per-instance, so two `<mini-tower-defense>` elements do not
 * share an AudioContext - they each have their own and can be muted
 * independently.
 *
 * On any audio failure the manager invokes the onError callback with detail
 * `{ code, message }` where code follows spec §7.3's AUDIO_DECODE_FAILED.
 * By default it dispatches a `game-error` CustomEvent on the host window.
 */

const SOUND_CONFIGS = {
  build: { frequency: 440, duration: 0.15, type: 'sine', gain: 0.3 },
  sell: { frequency: 330, duration: 0.12, type: 'triangle', gain: 0.25 },
  'arrow-shot': { frequency: 880, duration: 0.08, type: 'square', gain: 0.15 },
  'magic-shot': { frequency: 1200, duration: 0.1, type: 'sine', gain: 0.2 },
  hit: { frequency: 220, duration: 0.1, type: 'sawtooth', gain: 0.2 },
  'enemy-leak': { frequency: 150, duration: 0.3, type: 'sawtooth', gain: 0.3 },
  'wave-start': { frequency: 660, duration: 0.2, type: 'triangle', gain: 0.25 },
  victory: { frequency: 880, duration: 0.4, type: 'sine', gain: 0.3 },
  defeat: { frequency: 200, duration: 0.5, type: 'sawtooth', gain: 0.25 },
  'ui-click': { frequency: 560, duration: 0.05, type: 'square', gain: 0.1 },
};

/**
 * @typedef {(detail: { code: string, message: string }) => void} ErrorReporter
 */

function defaultOnError(detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('game-error', {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }
}

export class AudioManager {
  /**
   * @param {ErrorReporter} [onError] - Callback used to surface failures.
   *   Defaults to dispatching a `game-error` event on `window`.
   */
  constructor(onError) {
    this._audioContext = null;
    this._muted = false;
    this._unlocked = false;
    this._onError = typeof onError === 'function' ? onError : defaultOnError;
  }

  /**
   * Initialize AudioContext on first user gesture.
   * Safe to call repeatedly. Idempotent once unlocked.
   * @returns {Promise<void>}
   */
  async unlock() {
    if (this._unlocked) return;

    try {
      const Ctor =
        typeof window !== 'undefined' &&
        (window.AudioContext || window.webkitAudioContext);
      if (!Ctor) {
        this._onError({
          code: 'AUDIO_DECODE_FAILED',
          message: 'AudioContext is not supported in this environment',
        });
        return;
      }
      this._audioContext = new Ctor();

      // Create a silent buffer and play it to unlock
      const buffer = this._audioContext.createBuffer(1, 1, 22050);
      const source = this._audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this._audioContext.destination);
      source.start(0);

      if (this._audioContext.state === 'suspended') {
        await this._audioContext.resume();
      }

      this._unlocked = true;
    } catch (e) {
      this._onError({
        code: 'AUDIO_DECODE_FAILED',
        message: `Failed to unlock AudioContext: ${e && e.message ? e.message : String(e)}`,
      });
      this._audioContext = null;
    }
  }

  /**
   * Play a sound by name. No-op when muted, not unlocked, or audio failed.
   * @param {string} name
   */
  play(name) {
    if (this._muted || !this._unlocked || !this._audioContext) return;

    const config = SOUND_CONFIGS[name];
    if (!config) return;

    try {
      const oscillator = this._audioContext.createOscillator();
      const gainNode = this._audioContext.createGain();

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, this._audioContext.currentTime);

      gainNode.gain.setValueAtTime(config.gain, this._audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        this._audioContext.currentTime + config.duration
      );

      oscillator.connect(gainNode);
      gainNode.connect(this._audioContext.destination);

      oscillator.start(this._audioContext.currentTime);
      oscillator.stop(this._audioContext.currentTime + config.duration);
    } catch (e) {
      this._onError({
        code: 'AUDIO_DECODE_FAILED',
        message: `Failed to play sound "${name}": ${e && e.message ? e.message : String(e)}`,
      });
    }
  }

  /**
   * Set muted state.
   * @param {boolean} value
   */
  setMuted(value) {
    this._muted = Boolean(value);
  }

  /** @returns {boolean} */
  get muted() {
    return this._muted;
  }

  /**
   * Release AudioContext. After this, calls to play() are silent. Re-unlock by
   * calling unlock() again.
   */
  destroy() {
    if (this._audioContext) {
      try {
        this._audioContext.close();
      } catch (e) {
        // close() may throw if already closed; ignore
      }
      this._audioContext = null;
      this._unlocked = false;
    }
  }
}

export default AudioManager;
