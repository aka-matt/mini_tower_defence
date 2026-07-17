// AssetStore class for loading and caching embedded SVG assets
// All assets are embedded as SVG strings - no network requests

/**
 * Asset keys available in the store
 * @type {string[]}
 */
export const ASSET_KEYS = Object.freeze([
  'map-background',
  'castle',
  'tower-slot',
  'tower-archer',
  'tower-mage',
  'enemy-soldier',
  'enemy-scout',
  'enemy-armored',
  'projectile-arrow',
  'projectile-orb',
  'ui-heart',
  'ui-coin',
]);

/**
 * AssetStore - manages embedded SVG assets
 * Assets are loaded synchronously as they are embedded strings
 */
export class AssetStore {
  constructor() {
    this._assets = new Map();
    this._loaded = false;
  }

  /**
   * Initialize assets with embedded SVG placeholder strings
   * Each asset is a simple colored geometric shape
   */
  _initializeAssets() {
    // Map background - simple green meadow
    this._assets.set('map-background', `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
      <rect fill="#4a7c4e" width="960" height="540"/>
      <rect fill="#5a8c5e" x="0" y="400" width="960" height="140"/>
    </svg>`);

    // Castle - simple fortress shape
    this._assets.set('castle', `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <rect fill="#8b7355" x="10" y="30" width="60" height="50"/>
      <rect fill="#7a6245" x="20" y="10" width="15" height="30"/>
      <rect fill="#7a6245" x="45" y="10" width="15" height="30"/>
      <rect fill="#6b5135" x="30" y="50" width="20" height="30"/>
      <polygon fill="#5a4135" points="35,5 45,5 40,15"/>
    </svg>`);

    // Tower slot - circular platform
    this._assets.set('tower-slot', `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
      <ellipse fill="#6b5b4f" cx="25" cy="35" rx="22" ry="10"/>
      <ellipse fill="#7b6b5f" cx="25" cy="32" rx="20" ry="9"/>
      <ellipse fill="#5a4a3f" cx="25" cy="30" rx="18" ry="8"/>
    </svg>`);

    // Tower archer - stone tower with arrow slits
    this._assets.set('tower-archer', `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="60" viewBox="0 0 50 60">
      <rect fill="#7a6b5a" x="10" y="20" width="30" height="40" rx="2"/>
      <rect fill="#6a5b4a" x="5" y="15" width="40" height="10" rx="2"/>
      <rect fill="#5a4b3a" x="8" y="5" width="8" height="15"/>
      <rect fill="#5a4b3a" x="34" y="5" width="8" height="15"/>
      <rect fill="#4a3b2a" x="20" y="30" width="3" height="10"/>
      <rect fill="#4a3b2a" x="27" y="30" width="3" height="10"/>
      <rect fill="#3a2b1a" x="23" y="45" width="4" height="15"/>
    </svg>`);

    // Tower mage - mystical tower with crystal
    this._assets.set('tower-mage', `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="60" viewBox="0 0 50 60">
      <rect fill="#5a4a6a" x="10" y="20" width="30" height="40" rx="2"/>
      <rect fill="#4a3a5a" x="5" y="15" width="40" height="10" rx="2"/>
      <polygon fill="#3a2a4a" points="25,0 35,15 15,15"/>
      <circle fill="#7a5aaa" cx="25" cy="8" r="5"/>
      <circle fill="#9a7aca" cx="25" cy="8" r="3"/>
      <rect fill="#3a2a4a" x="20" y="35" width="10" height="3"/>
      <rect fill="#2a1a3a" x="23" y="45" width="4" height="15"/>
    </svg>`);

    // Enemy soldier - basic infantry
    this._assets.set('enemy-soldier', `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
      <ellipse fill="#c44" cx="15" cy="20" rx="8" ry="10"/>
      <circle fill="#fa0" cx="15" cy="8" r="6"/>
      <rect fill="#333" x="10" y="4" width="10" height="4" rx="1"/>
    </svg>`);

    // Enemy scout - fast runner
    this._assets.set('enemy-scout', `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <ellipse fill="#4a4" cx="12" cy="16" rx="6" ry="8"/>
      <circle fill="#fc0" cx="12" cy="6" r="5"/>
      <polygon fill="#333" points="7,3 17,3 15,6 9,6"/>
    </svg>`);

    // Enemy armored - heavy unit
    this._assets.set('enemy-armored', `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <ellipse fill="#668" cx="18" cy="24" rx="12" ry="12"/>
      <circle fill="#888" cx="18" cy="10" r="8"/>
      <rect fill="#555" x="6" y="6" width="24" height="6" rx="2"/>
      <rect fill="#444" x="14" y="28" width="8" height="8"/>
    </svg>`);

    // Projectile arrow
    this._assets.set('projectile-arrow', `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="6" viewBox="0 0 20 6">
      <polygon fill="#654" points="0,3 15,0 20,3 15,6"/>
      <rect fill="#876" x="2" y="2" width="12" height="2"/>
    </svg>`);

    // Projectile orb - magic orb
    this._assets.set('projectile-orb', `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <defs>
        <radialGradient id="orbg" cx="30%" cy="30%">
          <stop offset="0%" stop-color="#c8a0ff"/>
          <stop offset="100%" stop-color="#6040a0"/>
        </radialGradient>
      </defs>
      <circle fill="url(#orbg)" cx="8" cy="8" r="7"/>
      <circle fill="#e0c0ff" cx="5" cy="5" r="2"/>
    </svg>`);

    // UI heart - life icon
    this._assets.set('ui-heart', `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path fill="#e44" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>`);

    // UI coin - gold currency icon
    this._assets.set('ui-coin', `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle fill="#da0" cx="12" cy="12" r="10"/>
      <circle fill="#fb0" cx="12" cy="12" r="7"/>
      <circle fill="#da0" cx="12" cy="12" r="5"/>
      <text x="12" y="16" font-size="10" fill="#860" text-anchor="middle" font-weight="bold">$</text>
    </svg>`);
  }

  /**
   * Load all assets - initializes embedded SVG assets
   * @returns {Promise<void>}
   */
  async loadAll() {
    if (this._loaded) {
      return;
    }
    this._initializeAssets();
    this._loaded = true;
  }

  /**
   * Check if assets are loaded
   * @returns {boolean}
   */
  isLoaded() {
    return this._loaded;
  }

  /**
   * Get an asset by key
   * @param {string} key - Asset key
   * @returns {string|null} SVG string or null if not found or not loaded
   */
  get(key) {
    if (!this._loaded) {
      return null;
    }
    return this._assets.get(key) || null;
  }

  /**
   * Get all asset keys
   * @returns {string[]}
   */
  getKeys() {
    return [...ASSET_KEYS];
  }
}
