// CanvasRenderer - renders the game world on a Canvas element
// Uses embedded SVG assets from AssetStore

import { AssetStore } from './asset-store.js';
import { drawImage, drawRotated, drawImageSync, drawRotatedSync } from './sprite-utils.js';
import { samplePath } from '../engine/path.js';
import { EffectType, getEffectScale, getEffectAlpha } from '../entities/effect.js';

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 540;

// Health bar display constants
const HEALTH_BAR_SHOW_DURATION = 1.5; // seconds to show health bar after damage
const HEALTH_BAR_WIDTH = 30;
const HEALTH_BAR_HEIGHT = 4;

// Tower dimensions
const TOWER_WIDTH = 50;
const TOWER_HEIGHT = 60;
const SLOT_WIDTH = 50;
const SLOT_HEIGHT = 50;

// Enemy dimensions (base)
const ENEMY_WIDTH = 30;
const ENEMY_HEIGHT = 30;

// Projectile dimensions
const ARROW_WIDTH = 20;
const ARROW_HEIGHT = 6;
const ORB_WIDTH = 16;
const ORB_HEIGHT = 16;

/**
 * CanvasRenderer - renders game state to a canvas
 */
export class CanvasRenderer {
  /**
   * @param {HTMLCanvasElement} canvas - The canvas element to render to
   */
  constructor(canvas) {
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._assetStore = new AssetStore();
    this._dpr = 1;
    this._cssWidth = WORLD_WIDTH;
    this._cssHeight = WORLD_HEIGHT;
    this._selectedTowerId = null;
    this._damageTimes = new Map(); // Track when enemies were last damaged
  }

  /**
   * Get the asset store
   * @returns {AssetStore}
   */
  get assetStore() {
    return this._assetStore;
  }

  /**
   * Get/set selected tower ID (for range indicator)
   * @returns {string|null}
   */
  get selectedTowerId() {
    return this._selectedTowerId;
  }

  set selectedTowerId(value) {
    this._selectedTowerId = value;
  }

  /**
   * Resize the canvas for the given CSS dimensions and device pixel ratio
   * @param {number} cssWidth - CSS width in pixels
   * @param {number} cssHeight - CSS height in pixels
   * @param {number} dpr - Device pixel ratio
   */
  resize(cssWidth, cssHeight, dpr) {
    this._dpr = Math.min(dpr, 2);  // Cap at 2 per spec
    this._cssWidth = cssWidth;
    this._cssHeight = cssHeight;

    const pixelWidth = Math.floor(cssWidth * dpr);
    const pixelHeight = Math.floor(cssHeight * dpr);

    // Only resize if actually changed to avoid clearing
    if (this._canvas.width !== pixelWidth || this._canvas.height !== pixelHeight) {
      this._canvas.width = pixelWidth;
      this._canvas.height = pixelHeight;
    }

    // Set up scaling
    this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /**
   * Render a game snapshot
   * @param {GameState} snapshot - The game state snapshot
   * @param {number} interpolation - Interpolation factor (0-1) for smooth rendering
   */
  render(snapshot, interpolation) {
    const ctx = this._ctx;

    // Clear canvas
    ctx.clearRect(0, 0, this._cssWidth, this._cssHeight);

    // 1. Background (map)
    this._renderBackground();

    // 2. Path/road decorations
    this._renderPath(snapshot.path);

    // 3. Tower slots (empty)
    this._renderTowerSlots(snapshot.towerSlots);

    // 4. Towers (with range indicator if selected)
    this._renderTowers(snapshot.towers, snapshot.path);

    // 5. Enemies (with health bars if damaged or selected)
    this._renderEnemies(snapshot.enemies, snapshot.path, snapshot.towers, interpolation);

    // 6. Projectiles
    this._renderProjectiles(snapshot.projectiles);

    // 7. Effects (death particles, etc.)
    this._renderEffects(snapshot.effects);

    // 8. Range indicators (when tower selected)
    if (this._selectedTowerId) {
      this._renderRangeIndicator(snapshot.towers);
    }
  }

  /**
   * Render background
   */
  _renderBackground() {
    const ctx = this._ctx;
    const svg = this._assetStore.get('map-background');

    if (svg) {
      drawImageSync(ctx, svg, WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT);
    } else {
      // Fallback gradient
      ctx.fillStyle = '#4a7c4e';
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    }
  }

  /**
   * Render path/road
   * @param {PathModel} path - The path model
   */
  _renderPath(path) {
    if (!path) return;

    const ctx = this._ctx;

    // Draw road/path
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    const segments = path.segments;
    if (segments.length > 0) {
      ctx.moveTo(segments[0].start.x, segments[0].start.y);
      for (const seg of segments) {
        ctx.lineTo(seg.end.x, seg.end.y);
      }
    }

    ctx.stroke();

    // Draw road edge
    ctx.strokeStyle = '#6b5335';
    ctx.lineWidth = 44;
    ctx.globalCompositeOperation = 'destination-over';
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';

    // Draw castle at end
    const castleSvg = this._assetStore.get('castle');
    const lastSeg = segments[segments.length - 1];
    if (castleSvg) {
      drawImageSync(ctx, castleSvg, lastSeg.end.x, lastSeg.end.y - 20, 80, 80);
    }
  }

  /**
   * Render empty tower slots
   * @param {TowerSlot[]} towerSlots - Tower slots from game state
   */
  _renderTowerSlots(towerSlots) {
    if (!towerSlots) return;

    const ctx = this._ctx;
    const slotSvg = this._assetStore.get('tower-slot');

    for (const slot of towerSlots) {
      if (slot.towerId === null) {
        // Empty slot
        if (slotSvg) {
          drawImageSync(ctx, slotSvg, slot.x, slot.y, SLOT_WIDTH, SLOT_HEIGHT);
        } else {
          // Placeholder circle
          ctx.fillStyle = '#6b5b4f';
          ctx.beginPath();
          ctx.ellipse(slot.x, slot.y + 5, 22, 10, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  /**
   * Render towers
   * @param {Tower[]} towers - Towers from game state
   * @param {PathModel} path - The path model
   */
  _renderTowers(towers, path) {
    if (!towers) return;

    const ctx = this._ctx;

    for (const tower of towers) {
      if (!tower.alive) continue;

      const key = tower.type === 'archer' ? 'tower-archer' : 'tower-mage';
      const svg = this._assetStore.get(key);

      if (svg) {
        drawImageSync(ctx, svg, tower.x, tower.y, TOWER_WIDTH, TOWER_HEIGHT);
      } else {
        // Placeholder
        ctx.fillStyle = tower.type === 'archer' ? '#7a6b5a' : '#5a4a6a';
        ctx.fillRect(tower.x - 15, tower.y - 20, 30, 40);
      }
    }
  }

  /**
   * Render enemies
   * @param {Enemy[]} enemies - Enemies from game state
   * @param {PathModel} path - The path model
   * @param {Tower[]} towers - Towers for targeted check
   * @param {number} interpolation - Interpolation factor
   */
  _renderEnemies(enemies, path, towers, interpolation) {
    if (!enemies || !path) return;

    const ctx = this._ctx;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;

      // Get position from path
      const pos = samplePath(path, enemy.distance);

      // Get enemy SVG
      let svg;
      let width = ENEMY_WIDTH;
      let height = ENEMY_HEIGHT;

      switch (enemy.type) {
        case 'soldier':
          svg = this._assetStore.get('enemy-soldier');
          break;
        case 'scout':
          svg = this._assetStore.get('enemy-scout');
          width = 24;
          height = 24;
          break;
        case 'armored':
          svg = this._assetStore.get('enemy-armored');
          width = 36;
          height = 36;
          break;
        default:
          svg = null;
      }

      // Draw enemy
      if (svg) {
        drawRotatedSync(ctx, svg, pos.x, pos.y, width, height, pos.angle);
      } else {
        // Placeholder
        ctx.fillStyle = '#c44';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      // Check if enemy is targeted by selected tower
      const isTargeted = this._selectedTowerId &&
        towers?.some(t => t.alive && t.id === this._selectedTowerId);

      // Update damage time tracking
      const damageKey = enemy.id;
      if (enemy.hp < enemy.maxHp) {
        this._damageTimes.set(damageKey, Date.now());
      }

      // Show health bar if damaged or targeted
      const lastDamageTime = this._damageTimes.get(damageKey);
      const timeSinceDamage = lastDamageTime ? (Date.now() - lastDamageTime) / 1000 : Infinity;
      const showHealthBar = enemy.hp < enemy.maxHp || (isTargeted && timeSinceDamage < HEALTH_BAR_SHOW_DURATION);

      // Hide health bar if enough time passed and not targeted
      const shouldHideHealthBar = enemy.hp >= enemy.maxHp && timeSinceDamage >= HEALTH_BAR_SHOW_DURATION && !isTargeted;
      if (shouldHideHealthBar) {
        this._damageTimes.delete(damageKey);
      }

      if (showHealthBar) {
        this._renderHealthBar(ctx, pos.x, pos.y - height / 2 - 8, enemy.hp, enemy.maxHp);
      }
    }
  }

  /**
   * Render a health bar above an enemy
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x - Center X
   * @param {number} y - Y position
   * @param {number} hp - Current HP
   * @param {number} maxHp - Max HP
   */
  _renderHealthBar(ctx, x, y, hp, maxHp) {
    const ratio = hp / maxHp;

    // Background
    ctx.fillStyle = '#400';
    ctx.fillRect(x - HEALTH_BAR_WIDTH / 2, y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);

    // Health fill
    ctx.fillStyle = ratio > 0.5 ? '#4a4' : ratio > 0.25 ? '#aa4' : '#a44';
    ctx.fillRect(x - HEALTH_BAR_WIDTH / 2, y, HEALTH_BAR_WIDTH * ratio, HEALTH_BAR_HEIGHT);

    // Border
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - HEALTH_BAR_WIDTH / 2, y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);
  }

  /**
   * Render projectiles
   * @param {Projectile[]} projectiles - Projectiles from game state
   */
  _renderProjectiles(projectiles) {
    if (!projectiles) return;

    const ctx = this._ctx;

    for (const proj of projectiles) {
      if (!proj.alive) continue;

      // Calculate angle from movement direction
      const dx = proj.x - (proj.lastKnownPos?.x || proj.x);
      const dy = proj.y - (proj.lastKnownPos?.y || proj.y);
      const angle = Math.atan2(dy, dx);

      let svg;
      let width, height;

      if (proj.damageType === 'magic') {
        svg = this._assetStore.get('projectile-orb');
        width = ORB_WIDTH;
        height = ORB_HEIGHT;
      } else {
        svg = this._assetStore.get('projectile-arrow');
        width = ARROW_WIDTH;
        height = ARROW_HEIGHT;
      }

      if (svg) {
        drawRotatedSync(ctx, svg, proj.x, proj.y, width, height, angle);
      } else {
        // Placeholder
        ctx.fillStyle = proj.damageType === 'magic' ? '#7a5a' : '#654';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * Render effects (death puffs, hit sparks)
   * @param {Effect[]} effects - Effects from game state
   */
  _renderEffects(effects) {
    if (!effects) return;

    const ctx = this._ctx;

    for (const effect of effects) {
      if (!effect.alive) continue;

      const scale = getEffectScale(effect);
      const alpha = getEffectAlpha(effect);

      let color;
      switch (effect.type) {
        case EffectType.DEATH_PUFF:
          color = `rgba(200, 180, 160, ${alpha})`; // Tan puff
          break;
        case EffectType.HIT_SPARK:
          color = `rgba(255, 220, 100, ${alpha})`; // Yellow spark
          break;
        default:
          color = `rgba(128, 128, 128, ${alpha})`;
      }

      // Draw effect as expanding circle
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();

      const baseSize = 15;
      ctx.arc(effect.x, effect.y, baseSize * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
    }
  }

  /**
   * Render range indicator for selected tower
   * @param {Tower[]} towers - Towers from game state
   */
  _renderRangeIndicator(towers) {
    if (!towers) return;

    const ctx = this._ctx;
    const tower = towers.find(t => t.id === this._selectedTowerId);

    if (!tower || !tower.alive) return;

    // Draw range circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);
  }
}
