/**
 * Asset validation script
 * Validates SVG assets for security risks:
 * - No <script> tags
 * - No external URLs (http://, https://)
 * - No on* event attributes
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '../src/assets/images');

// Security patterns
const SCRIPT_PATTERN = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
// Match external URLs but exclude SVG xmlns namespace declarations
const URL_PATTERN = /(?<!xmlns=")https?:\/\/[^\s"'<>]+/gi;
const EVENT_ATTR_PATTERN = /\bon\w+\s*=/gi;

const ISSUES = [];

function validateSvg(filePath, content) {
  const issues = [];
  const fileName = filePath.split('/').pop();

  // Check for script tags
  const scriptMatches = content.match(SCRIPT_PATTERN);
  if (scriptMatches) {
    issues.push(`  [SCRIPT] Found ${scriptMatches.length} <script> tag(s)`);
  }

  // Check for external URLs
  const urlMatches = content.match(URL_PATTERN);
  if (urlMatches) {
    issues.push(`  [URL] Found external URL(s): ${urlMatches.join(', ')}`);
  }

  // Check for event attributes
  const eventMatches = content.match(EVENT_ATTR_PATTERN);
  if (eventMatches) {
    issues.push(`  [EVENT] Found event attribute(s): ${eventMatches.join(', ')}`);
  }

  return issues;
}

function validateDirectory(dirPath) {
  const files = readdirSync(dirPath);
  let totalSize = 0;
  const SIZE_LIMIT = 100 * 1024; // 100KB budget

  for (const file of files) {
    if (!file.endsWith('.svg')) continue;

    const filePath = join(dirPath, file);
    const content = readFileSync(filePath, 'utf-8');
    const size = Buffer.byteLength(content, 'utf-8');
    totalSize += size;

    const issues = validateSvg(filePath, content);
    if (issues.length > 0) {
      ISSUES.push(`\n${file}:`);
      ISSUES.push(...issues);
    }
  }

  console.log(`\nTotal asset size: ${(totalSize / 1024).toFixed(2)} KB (limit: ${SIZE_LIMIT / 1024} KB)`);

  if (totalSize > SIZE_LIMIT) {
    ISSUES.push(`\n[SIZE] Total asset size exceeds budget!`);
  }
}

console.log('Validating SVG assets in:', ASSETS_DIR);
console.log('=====================================');

try {
  validateDirectory(ASSETS_DIR);
} catch (e) {
  console.error('Validation error:', e.message);
  process.exit(1);
}

if (ISSUES.length > 0) {
  console.error('\nValidation FAILED:');
  console.error(ISSUES.join('\n'));
  process.exit(1);
} else {
  console.log('\nValidation PASSED - No security issues found');
  process.exit(0);
}
