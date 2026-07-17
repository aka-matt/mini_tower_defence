// Helper functions for drawing sprites on Canvas using SVG data URLs
// All assets are embedded SVG strings - no network requests

// Cache for loaded Image elements
const _imageCache = new Map();

/**
 * Load an SVG string as an Image element
 * @param {string} svgString - SVG content
 * @returns {Promise<HTMLImageElement>}
 */
function loadSvgAsImage(svgString) {
  const cacheKey = svgString;

  if (_imageCache.has(cacheKey)) {
    return Promise.resolve(_imageCache.get(cacheKey));
  }

  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);
        _imageCache.set(cacheKey, img);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG as image'));
      };

      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Draw an SVG sprite on a canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {string} svgString - SVG string to draw
 * @param {number} x - X position (center)
 * @param {number} y - Y position (center)
 * @param {number} width - Width to draw
 * @param {number} height - Height to draw
 * @returns {Promise<void>}
 */
export async function drawImage(ctx, svgString, x, y, width, height) {
  try {
    const img = await loadSvgAsImage(svgString);
    ctx.drawImage(img, x - width / 2, y - height / 2, width, height);
  } catch (e) {
    // Draw placeholder on error - dark rectangle
    ctx.fillStyle = '#333';
    ctx.fillRect(x - width / 2, y - height / 2, width, height);
  }
}

/**
 * Draw a rotated SVG sprite on a canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {string} svgString - SVG string to draw
 * @param {number} x - X position (center)
 * @param {number} y - Y position (center)
 * @param {number} width - Width to draw
 * @param {number} height - Height to draw
 * @param {number} angle - Rotation angle in radians
 * @returns {Promise<void>}
 */
export async function drawRotated(ctx, svgString, x, y, width, height, angle) {
  try {
    const img = await loadSvgAsImage(svgString);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    ctx.restore();
  } catch (e) {
    // Draw placeholder on error
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = '#333';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.restore();
  }
}

/**
 * Draw an SVG sprite synchronously using cache (must be pre-loaded)
 * Falls back to placeholder if not cached
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {string} svgString - SVG string to draw
 * @param {number} x - X position (center)
 * @param {number} y - Y position (center)
 * @param {number} width - Width to draw
 * @param {number} height - Height to draw
 */
export function drawImageSync(ctx, svgString, x, y, width, height) {
  const img = _imageCache.get(svgString);

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, x - width / 2, y - height / 2, width, height);
  } else {
    // Draw placeholder - dark rectangle
    ctx.fillStyle = '#333';
    ctx.fillRect(x - width / 2, y - height / 2, width, height);
  }
}

/**
 * Draw a rotated SVG sprite synchronously using cache
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {string} svgString - SVG string to draw
 * @param {number} x - X position (center)
 * @param {number} y - Y position (center)
 * @param {number} width - Width to draw
 * @param {number} height - Height to draw
 * @param {number} angle - Rotation angle in radians
 */
export function drawRotatedSync(ctx, svgString, x, y, width, height, angle) {
  const img = _imageCache.get(svgString);

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    ctx.restore();
  } else {
    // Draw placeholder
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = '#333';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.restore();
  }
}

/**
 * Pre-cache an SVG for synchronous use later
 * @param {string} svgString - SVG string to cache
 * @returns {Promise<void>}
 */
export async function precacheSprite(svgString) {
  await loadSvgAsImage(svgString);
}

/**
 * Clear the sprite cache
 */
export function clearSpriteCache() {
  _imageCache.clear();
}
