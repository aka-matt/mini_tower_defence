/**
 * AudioManager - Web Audio API based sound effects manager
 * Creates placeholder sounds using oscillators (no external audio files needed)
 */

const SOUND_CONFIGS = {
  'build': { frequency: 440, duration: 0.15, type: 'sine', gain: 0.3 },
  'sell': { frequency: 330, duration: 0.12, type: 'triangle', gain: 0.25 },
  'arrow-shot': { frequency: 880, duration: 0.08, type: 'square', gain: 0.15 },
  'magic-shot': { frequency: 1200, duration: 0.1, type: 'sine', gain: 0.2 },
  'hit': { frequency: 220, duration: 0.1, type: 'sawtooth', gain: 0.2 },
  'enemy-leak': { frequency: 150, duration: 0.3, type: 'sawtooth', gain: 0.3 },
  'wave-start': { frequency: 660, duration: 0.2, type: 'triangle', gain: 0.25 },
  'victory': { frequency: 880, duration: 0.4, type: 'sine', gain: 0.3 },
  'defeat': { frequency: 200, duration: 0.5, type: 'sawtooth', gain: 0.25 },
  'ui-click': { frequency: 560, duration: 0.05, type: 'square', gain: 0.1 }
};

export class AudioManager {
  constructor() {
    this._audioContext = null;
    this._muted = false;
    this._unlocked = false;
  }

  /**
   * Initialize AudioContext on first user gesture
   * @returns {Promise<void>}
   */
  async unlock() {
    if (this._unlocked) return;

    try {
      this._audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create a silent buffer and play it to unlock
      const buffer = this._audioContext.createBuffer(1, 1, 22050);
      const source = this._audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this._audioContext.destination);
      source.start(0);

      // Resume context if suspended
      if (this._audioContext.state === 'suspended') {
        await this._audioContext.resume();
      }

      this._unlocked = true;
    } catch (e) {
      console.warn('AudioManager: Failed to unlock AudioContext', e);
      this._audioContext = null;
    }
  }

  /**
   * Play a sound by name
   * @param {string} name - Sound name
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
      gainNode.gain.exponentialRampToValueAtTime(0.001, this._audioContext.currentTime + config.duration);

      oscillator.connect(gainNode);
      gainNode.connect(this._audioContext.destination);

      oscillator.start(this._audioContext.currentTime);
      oscillator.stop(this._audioContext.currentTime + config.duration);
    } catch (e) {
      console.warn(`AudioManager: Failed to play sound "${name}"`, e);
    }
  }

  /**
   * Set muted state
   * @param {boolean} value
   */
  setMuted(value) {
    this._muted = Boolean(value);
  }

  /**
   * Check if audio is muted
   * @returns {boolean}
   */
  get muted() {
    return this._muted;
  }

  /**
   * Release AudioContext
   */
  destroy() {
    if (this._audioContext) {
      this._audioContext.close();
      this._audioContext = null;
      this._unlocked = false;
    }
  }
}

export default AudioManager;
