#!/usr/bin/env node

/**
 * check-theme-foundation.mjs
 * Health check for the CSS architecture foundation.
 * Verifies that all required files, tokens, and imports exist.
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const REQUIRED_FILES = [
  'frontend/styles/foundations/app-tokens.css',
  'frontend/styles/foundations/base.css',
  'frontend/styles/themes/theme-contract.css',
  'frontend/styles/themes/themes.index.css',
  'frontend/styles/themes/steadfast-default.css',
  'frontend/styles/themes/midnight-scholar.css',
  'frontend/styles/themes/soft-paper.css',
  'frontend/styles/themes/rose-studio.css',
  'frontend/styles/themes/ember-focus.css',
  'frontend/styles/themes/violet-library.css',
  'frontend/styles/themes/ocean-glass.css',
  'frontend/styles/themes/calm-forest.css',
  'frontend/styles/copilot/copilot-theme.destinations.css',
  'frontend/styles/copilot/copilot-theme.study-modes.css',
  'frontend/styles/copilot/copilot-animations.css',
  'frontend/styles/copilot/copilot-voice.css',
  'frontend/styles/copilot/copilot-markdown.css',
  'frontend/styles/copilot/copilot-chat.css',
  'frontend/styles/copilot/copilot-sidebar.css',
  'frontend/styles/copilot/copilot-revision.css',
  'frontend/lib/theme-registry.ts',
];

const REQUIRED_TOKENS = [
  '--copilot-surface-1',
  '--copilot-text-primary',
  '--copilot-text-secondary',
  '--copilot-accent-primary',
  '--copilot-accent-focus-ring',
  '--copilot-user-bubble-bg',
  '--copilot-assistant-bubble-bg',
  '--copilot-soft-line',
];

const REQUIRED_SELECTORS = [
  '.copilot-theme-scope',
  '.copilot-user-bubble',
  '.copilot-assistant-bubble',
  '.copilot-md-link',
];

let errors = 0;
let warnings = 0;

function error(msg) {
  console.error(`  ERROR: ${msg}`);
  errors++;
}

function warn(msg) {
  console.warn(`  WARN: ${msg}`);
  warnings++;
}

console.log('\n🔍 Steadfast AI — Theme Foundation Health Check\n');

// 1. File existence
console.log('📁 File existence check...');
for (const file of REQUIRED_FILES) {
  const fullPath = path.join(repoRoot, file);
  if (!existsSync(fullPath)) {
    error(`Missing: ${file}`);
  } else {
    console.log(`  OK   ${file}`);
  }
}

// 2. Token coverage in steadfast-default
console.log('\n🎨 Token coverage (steadfast-default.css)...');
const steadfastCss = readFileSync(
  path.join(repoRoot, 'frontend/styles/themes/steadfast-default.css'),
  'utf8'
);

for (const token of REQUIRED_TOKENS) {
  if (!steadfastCss.includes(token)) {
    error(`Missing token in steadfast-default.css: ${token}`);
  } else {
    console.log(`  OK   ${token}`);
  }
}

// 3. Check theme files have .copilot-theme-scope
const themeFiles = REQUIRED_FILES.filter((f) =>
  f.startsWith('frontend/styles/themes/') && f.endsWith('.css') && f !== 'frontend/styles/themes/theme-contract.css' && f !== 'frontend/styles/themes/themes.index.css'
);

console.log('\n📐 Theme scope check...');
for (const file of themeFiles) {
  const css = readFileSync(path.join(repoRoot, file), 'utf8');
  if (!css.includes('.copilot-theme-scope')) {
    warn(`${file} missing .copilot-theme-scope`);
  } else {
    console.log(`  OK   ${file} has .copilot-theme-scope`);
  }
}

// 4. Layout.tsx imports
console.log('\n🔗 Layout import check...');
const layoutTsx = readFileSync(
  path.join(repoRoot, 'frontend/app/layout.tsx'),
  'utf8'
);

const requiredImports = [
  '@/styles/foundations/app-tokens.css',
  '@/styles/foundations/base.css',
  '@/styles/themes/theme-contract.css',
  '@/styles/themes/themes.index.css',
  '@/styles/copilot/copilot-animations.css',
  '@/styles/copilot/copilot-voice.css',
  '@/styles/copilot/copilot-markdown.css',
  '@/styles/copilot/copilot-chat.css',
  '@/styles/copilot/copilot-sidebar.css',
  '@/styles/copilot/copilot-revision.css',
];

for (const imp of requiredImports) {
  if (!layoutTsx.includes(imp)) {
    error(`Missing import in layout.tsx: ${imp}`);
  } else {
    console.log(`  OK   ${imp}`);
  }
}

// 5. globals.css sanity
console.log('\n📄 globals.css check...');
const globalsCss = readFileSync(
  path.join(repoRoot, 'frontend/app/globals.css'),
  'utf8'
);

if (globalsCss.includes('@tailwind base')) {
  console.log('  OK   contains @tailwind directives');
} else {
  error('globals.css missing tailwind directives');
}

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log(`Errors:   ${errors}`);
console.log(`Warnings: ${warnings}`);
console.log(`${'='.repeat(50)}`);

process.exit(errors > 0 ? 1 : 0);
