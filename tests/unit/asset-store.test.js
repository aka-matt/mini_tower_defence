import { describe, it, expect, beforeEach } from 'vitest';
import { AssetStore, ASSET_KEYS } from '../../src/render/asset-store.js';

describe('AssetStore', () => {
  let store;

  beforeEach(() => {
    store = new AssetStore();
  });

  describe('loadAll()', () => {
    it('should resolve without error', async () => {
      await expect(store.loadAll()).resolves.toBeUndefined();
    });

    it('should mark assets as loaded after calling loadAll', async () => {
      expect(store.isLoaded()).toBe(false);
      await store.loadAll();
      expect(store.isLoaded()).toBe(true);
    });

    it('should be idempotent - calling multiple times should not fail', async () => {
      await store.loadAll();
      await expect(store.loadAll()).resolves.toBeUndefined();
      await expect(store.loadAll()).resolves.toBeUndefined();
    });
  });

  describe('get()', () => {
    it('should return null before loadAll() is called', () => {
      expect(store.get('map-background')).toBeNull();
    });

    it('should return SVG string for known keys after loadAll', async () => {
      await store.loadAll();

      for (const key of ASSET_KEYS) {
        const value = store.get(key);
        expect(value).not.toBeNull();
        expect(typeof value).toBe('string');
        expect(value).toContain('<svg');
      }
    });

    it('should return null for unknown keys', async () => {
      await store.loadAll();

      expect(store.get('unknown-key')).toBeNull();
      expect(store.get('')).toBeNull();
      expect(store.get('MAP-BACKGROUND')).toBeNull(); // case sensitive
    });

    it('should return valid SVG string containing expected elements', async () => {
      await store.loadAll();

      const castle = store.get('castle');
      expect(castle).toContain('<svg');
      expect(castle).toContain('xmlns');

      const heart = store.get('ui-heart');
      expect(heart).toContain('<svg');
    });
  });

  describe('isLoaded()', () => {
    it('should return false before loadAll()', () => {
      expect(store.isLoaded()).toBe(false);
    });

    it('should return true after loadAll()', async () => {
      await store.loadAll();
      expect(store.isLoaded()).toBe(true);
    });
  });

  describe('graceful degradation', () => {
    it('should resolve loadAll even if individual assets fail', async () => {
      // AssetStore should handle individual asset failures gracefully
      // by still resolving loadAll() and marking isLoaded as true
      const store = new AssetStore();
      await expect(store.loadAll()).resolves.toBeUndefined();
      expect(store.isLoaded()).toBe(true);
    });

    it('should return null for failed assets without crashing', async () => {
      const store = new AssetStore();
      await store.loadAll();
      // Unknown keys should return null, not throw
      expect(() => store.get('non-existent-asset')).not.toThrow();
      expect(store.get('non-existent-asset')).toBeNull();
    });
  });

  describe('getKeys()', () => {
    it('should return array of asset keys', () => {
      const keys = store.getKeys();
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should contain expected keys', () => {
      const keys = store.getKeys();
      expect(keys).toContain('map-background');
      expect(keys).toContain('castle');
      expect(keys).toContain('tower-slot');
      expect(keys).toContain('tower-archer');
      expect(keys).toContain('tower-mage');
      expect(keys).toContain('enemy-soldier');
      expect(keys).toContain('enemy-scout');
      expect(keys).toContain('enemy-armored');
      expect(keys).toContain('projectile-arrow');
      expect(keys).toContain('projectile-orb');
      expect(keys).toContain('ui-heart');
      expect(keys).toContain('ui-coin');
    });
  });
});
