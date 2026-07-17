/**
 * Build script for single-file distribution
 * Bundles all modules and embeds SVG assets as string literals
 */

import { readFileSync, writeFileSync, readdirSync, copyFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const SRC_DIR = join(ROOT_DIR, 'src');
const ASSETS_DIR = join(SRC_DIR, 'assets/images');
const OUTPUT_FILE = join(ROOT_DIR, 'dist/mini-tower-defense.js');

// Asset keys mapping
const ASSET_KEYS = [
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
];

/**
 * Read and convert SVG files to JS string literals
 */
function embedSvgAssets() {
  const assets = {};

  for (const key of ASSET_KEYS) {
    const filePath = join(ASSETS_DIR, `${key}.svg`);
    try {
      const svgContent = readFileSync(filePath, 'utf-8');
      // Escape for JS string literal (template literal)
      const escaped = svgContent
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$');
      assets[key] = escaped;
    } catch (e) {
      console.warn(`Warning: Could not read ${filePath}: ${e.message}`);
      assets[key] = '';
    }
  }

  return assets;
}

/**
 * Generate the complete _initializeAssets method body with set() calls
 */
function generateAssetStoreMethod(assets) {
  const setCalls = Object.entries(assets)
    .map(([key, value]) => `    this._assets.set('${key}', \`${value}\`);`)
    .join('\n');

  return setCalls;
}

/**
 * Preprocess asset-store.js to embed SVG content directly
 */
function preprocessAssetStore(assets) {
  const assetStorePath = join(SRC_DIR, 'render/asset-store.js');
  let content = readFileSync(assetStorePath, 'utf-8');

  // Find the _initializeAssets method and replace it
  const methodStart = '_initializeAssets() {';
  const methodEnd = '  }';
  const startIdx = content.indexOf(methodStart);
  const endIdx = content.indexOf(methodEnd, startIdx) + methodEnd.length;

  const newMethod = `_initializeAssets() {\n${generateAssetStoreMethod(assets)}\n  }`;

  content = content.substring(0, startIdx) + newMethod + content.substring(endIdx);

  // Also update loadAll to not be async since we don't need to load anything
  content = content.replace(
    'async loadAll() {',
    'loadAll() {'
  );

  return content;
}

/**
 * Main build function
 */
async function build() {
  console.log('Building single-file distribution...');

  // Ensure dist directory exists
  mkdirSync(join(ROOT_DIR, 'dist'), { recursive: true });

  // Step 1: Embed SVG assets into a modified asset-store.js
  console.log('Embedding SVG assets...');
  const assets = embedSvgAssets();
  const modifiedAssetStore = preprocessAssetStore(assets);

  // Step 2: Create a temporary build directory with modified source
  const tempDir = join(ROOT_DIR, 'dist/temp-src');
  mkdirSync(tempDir, { recursive: true });

  // Copy src directory but replace asset-store.js
  copyDirRecursive(SRC_DIR, tempDir, ['render/asset-store.js']);
  writeFileSync(join(tempDir, 'render/asset-store.js'), modifiedAssetStore, 'utf-8');

  // Step 3: Bundle with esbuild
  console.log('Bundling modules with esbuild...');
  execSync(
    `npx esbuild ${tempDir}/index.js --bundle --outfile=${join(ROOT_DIR, 'dist/temp-bundle.js')} --format=iife --platform=browser`,
    { stdio: 'inherit' }
  );

  // Step 4: Read the bundle and clean up
  let bundle = readFileSync(join(ROOT_DIR, 'dist/temp-bundle.js'), 'utf-8');

  // Step 5: Remove export statements (not needed for script tag usage)
  bundle = bundle.replace(/^export \{[^}]+\};?\s*$/gm, '');

  // Step 6: Write output
  writeFileSync(OUTPUT_FILE, bundle, 'utf-8');

  // Cleanup temp files
  const { rmSync } = await import('fs');
  try {
    rmSync(join(ROOT_DIR, 'dist/temp-bundle.js'), { force: true });
    rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }

  console.log(`\nBuild complete: ${OUTPUT_FILE}`);
  console.log(`Size: ${(Buffer.byteLength(bundle, 'utf-8') / 1024).toFixed(2)} KB`);
}

/**
 * Recursively copy directory excluding certain files
 */
function copyDirRecursive(src, dest, exclude = []) {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    const relativePath = srcPath.substring(src.length + 1);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, exclude);
    } else if (!exclude.some(f => relativePath.includes(f))) {
      copyFileSync(srcPath, destPath);
    }
  }
}

// Run
build().catch(e => {
  console.error('Build failed:', e);
  process.exit(1);
});
