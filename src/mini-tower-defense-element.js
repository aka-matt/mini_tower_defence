/**
 * Mini Tower Defense Web Component
 * A single-level tower defense game as a native Web Component with Shadow DOM.
 */

const ATTRIBUTES = {
  WIDTH: 'width',
  HEIGHT: 'height',
  LOCALE: 'locale',
  AUTO_START: 'auto-start',
  MUTED: 'muted'
};

const DEFAULT_WIDTH = 960;
const DEFAULT_HEIGHT = 540;
const DEFAULT_LOCALE = 'zh-CN';

/**
 * Minimal tower defense custom element
 */
class MiniTowerDefense extends HTMLElement {
  static get observedAttributes() {
    return [
      ATTRIBUTES.WIDTH,
      ATTRIBUTES.HEIGHT,
      ATTRIBUTES.LOCALE,
      ATTRIBUTES.AUTO_START,
      ATTRIBUTES.MUTED
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._state = 'idle';
  }

  // Attributes
  get width() {
    return parseInt(this.getAttribute(ATTRIBUTES.WIDTH) || DEFAULT_WIDTH, 10);
  }

  set width(value) {
    this.setAttribute(ATTRIBUTES.WIDTH, value);
  }

  get height() {
    return parseInt(this.getAttribute(ATTRIBUTES.HEIGHT) || DEFAULT_HEIGHT, 10);
  }

  set height(value) {
    this.setAttribute(ATTRIBUTES.HEIGHT, value);
  }

  get locale() {
    return this.getAttribute(ATTRIBUTES.LOCALE) || DEFAULT_LOCALE;
  }

  set locale(value) {
    this.setAttribute(ATTRIBUTES.LOCALE, value);
  }

  get autoStart() {
    return this.hasAttribute(ATTRIBUTES.AUTO_START);
  }

  set autoStart(value) {
    if (value) {
      this.setAttribute(ATTRIBUTES.AUTO_START, '');
    } else {
      this.removeAttribute(ATTRIBUTES.AUTO_START);
    }
  }

  get muted() {
    return this.hasAttribute(ATTRIBUTES.MUTED);
  }

  set muted(value) {
    if (value) {
      this.setAttribute(ATTRIBUTES.MUTED, '');
    } else {
      this.removeAttribute(ATTRIBUTES.MUTED);
    }
  }

  // State (readonly)
  get state() {
    return this._state;
  }

  // Methods
  start() {
    this._state = 'running';
  }

  pause() {
    this._state = 'paused';
  }

  resume() {
    this._state = 'running';
  }

  restart() {
    this._state = 'idle';
  }

  destroy() {
    this._state = 'destroyed';
  }

  getSnapshot() {
    return Object.freeze({ state: this._state });
  }

  // Lifecycle
  connectedCallback() {
    // Initialize component when added to DOM
  }

  disconnectedCallback() {
    // Cleanup when removed from DOM
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // Handle attribute changes
  }
}

// Register only if not already registered
if (!customElements.get('mini-tower-defense')) {
  customElements.define('mini-tower-defense', MiniTowerDefense);
}

export default MiniTowerDefense;
