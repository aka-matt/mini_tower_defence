/**
 * Pointer Controller - handles mouse and touch input via Pointer Events API
 * Provides unified input handling for both mouse and touch devices
 */

import { clientToWorld } from '../render/coordinates.js';

/**
 * @typedef {Object} WorldSize
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} PointerPosition
 * @property {number} x
 * @property {number} y
 */

export class PointerController {
  /**
   * @param {HTMLCanvasElement} canvas - Game canvas element
   * @param {WorldSize} worldSize - World dimensions (e.g., {width: 960, height: 540})
   * @param {function(string): void} onTowerSlotClick - Callback with slot ID when tower slot is clicked
   */
  constructor(canvas, worldSize, onTowerSlotClick) {
    /** @type {HTMLCanvasElement} */
    this._canvas = canvas;
    /** @type {WorldSize} */
    this._worldSize = worldSize;
    /** @type {function(string): void} */
    this._onTowerSlotClick = onTowerSlotClick;

    /** @type {PointerPosition | null} */
    this._pointerDownPos = null;
    /** @type {number | null} */
    this._pointerDownTarget = null;
    /** @type {number} */
    this._moveThreshold = 5; // pixels movement threshold to区分 click vs drag

    /** @type {Set<string>} */
    this._supportedEvents = new Set(['pointerdown', 'pointerup', 'pointercancel', 'keydown']);

    this._bindEvents();
  }

  _bindEvents() {
    // Pointer events on canvas
    this._canvas.addEventListener('pointerdown', this._handlePointerDown.bind(this));
    this._canvas.addEventListener('pointerup', this._handlePointerUp.bind(this));
    this._canvas.addEventListener('pointercancel', this._handlePointerCancel.bind(this));

    // Keyboard events for Escape key
    this._canvas.addEventListener('keydown', this._handleKeyDown.bind(this));
    // Make canvas focusable to receive key events
    this._canvas.tabIndex = 0;
  }

  /**
   * @param {PointerEvent} event
   */
  _handlePointerDown(event) {
    // Only track primary button (left click) or touch/pen
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }

    this._pointerDownPos = { x: event.clientX, y: event.clientY };
    this._pointerDownTarget = event.pointerId;

    // Prevent default only during active game interaction
    // Don't prevent if menu is open - let events propagate
    event.preventDefault();
  }

  /**
   * @param {PointerEvent} event
   */
  _handlePointerUp(event) {
    // Check if this is the same pointer that was pressed
    if (this._pointerDownTarget !== event.pointerId) {
      return;
    }

    // Check if pointer moved beyond threshold (distinguish click from drag)
    if (this._pointerDownPos) {
      const dx = event.clientX - this._pointerDownPos.x;
      const dy = event.clientY - this._pointerDownPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > this._moveThreshold) {
        // This was a drag, not a click
        this._resetPointerState();
        return;
      }
    }

    // Get canvas rect for coordinate transformation
    const canvasRect = this._canvas.getBoundingClientRect();

    // Convert to world coordinates
    const worldPos = clientToWorld(event.clientX, event.clientY, canvasRect, this._worldSize);

    // Fire click action via callback with world position
    // The callback will handle hit testing against tower slots
    if (this._onTowerSlotClick) {
      this._onTowerSlotClick(worldPos);
    }

    this._resetPointerState();
  }

  /**
   * @param {PointerEvent} event
   */
  _handlePointerCancel(event) {
    // Pointer cancel should not trigger any action
    this._resetPointerState();
  }

  /**
   * @param {KeyboardEvent} event
   */
  _handleKeyDown(event) {
    if (event.key === 'Escape') {
      // Dispatch custom event for Escape key
      // Components can listen to this to close menus/modals
      const closeEvent = new CustomEvent('escape-pressed', {
        bubbles: true,
        composed: true,
        detail: { source: 'pointer-controller' }
      });
      this._canvas.dispatchEvent(closeEvent);
    }
  }

  _resetPointerState() {
    this._pointerDownPos = null;
    this._pointerDownTarget = null;
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    this._canvas.removeEventListener('pointerdown', this._handlePointerDown);
    this._canvas.removeEventListener('pointerup', this._handlePointerUp);
    this._canvas.removeEventListener('pointercancel', this._handlePointerCancel);
    this._canvas.removeEventListener('keydown', this._handleKeyDown);
    this._onTowerSlotClick = null;
  }
}
