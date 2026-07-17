import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioManager } from '../../src/audio/audio-manager.js';

// Mock AudioContext for tests
const mockAudioContext = {
  createBuffer: vi.fn(() => ({
    duration: 1,
    sampleRate: 22050,
    length: 1
  })),
  createBufferSource: vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn()
  })),
  createOscillator: vi.fn(() => ({
    type: 'sine',
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  })),
  createGain: vi.fn(() => ({
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn()
  })),
  destination: {},
  state: 'suspended',
  resume: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined)
};

// Mock window.AudioContext before importing AudioManager
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  configurable: true,
  value: vi.fn(() => mockAudioContext)
});

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  configurable: true,
  value: vi.fn(() => mockAudioContext)
});

describe('AudioManager', () => {
  let audio;

  beforeEach(() => {
    vi.clearAllMocks();
    audio = new AudioManager();
  });

  afterEach(() => {
    audio.destroy();
  });

  describe('constructor', () => {
    it('creates instance with default values', () => {
      expect(audio._muted).toBe(false);
      expect(audio._unlocked).toBe(false);
      expect(audio._audioContext).toBe(null);
    });
  });

  describe('unlock', () => {
    it('creates AudioContext on unlock', async () => {
      await audio.unlock();
      expect(audio._unlocked).toBe(true);
      expect(window.AudioContext).toHaveBeenCalled();
    });

    it('is idempotent - calling twice does not error', async () => {
      await audio.unlock();
      await audio.unlock(); // Should not throw
      expect(audio._unlocked).toBe(true);
      // Should only create AudioContext once
      expect(window.AudioContext).toHaveBeenCalledTimes(1);
    });
  });

  describe('play', () => {
    it('does nothing when muted is true', async () => {
      audio.setMuted(true);
      await audio.unlock();
      // Should not throw, just silently do nothing
      audio.play('build');
      // No oscillator should be created
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });

    it('does nothing when not unlocked', () => {
      audio.setMuted(false);
      // Should not throw, AudioContext is null
      audio.play('build');
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });

    it('does nothing for unknown sound name', async () => {
      await audio.unlock();
      // Should not throw
      audio.play('unknown-sound');
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });

    it('creates oscillator and gain nodes for valid sound', async () => {
      await audio.unlock();
      audio.play('build');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('accepts all valid sound names without error', async () => {
      await audio.unlock();
      const soundNames = [
        'build', 'sell', 'arrow-shot', 'magic-shot',
        'hit', 'enemy-leak', 'wave-start', 'victory', 'defeat', 'ui-click'
      ];
      soundNames.forEach(name => {
        expect(() => audio.play(name)).not.toThrow();
      });
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(10);
    });
  });

  describe('setMuted', () => {
    it('sets muted state to true', () => {
      audio.setMuted(true);
      expect(audio.muted).toBe(true);
    });

    it('sets muted state to false', () => {
      audio.setMuted(true);
      audio.setMuted(false);
      expect(audio.muted).toBe(false);
    });
  });

  describe('destroy', () => {
    it('releases AudioContext', async () => {
      await audio.unlock();
      expect(audio._audioContext).not.toBe(null);
      audio.destroy();
      expect(audio._audioContext).toBe(null);
      expect(audio._unlocked).toBe(false);
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it('can be called when not unlocked', () => {
      audio.destroy();
      expect(audio._audioContext).toBe(null);
    });

    it('can be called multiple times safely', async () => {
      await audio.unlock();
      audio.destroy();
      audio.destroy(); // Should not throw
    });
  });
});
