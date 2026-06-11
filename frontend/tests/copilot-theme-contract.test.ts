import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

/**
 * Contract: steadfast-default.css MUST define at least these
 * required tokens inside its .copilot-theme-scope blocks.
 */
const STEADFAST_REQUIRED_TOKENS = [
  '--copilot-surface-1',
  '--copilot-text-primary',
  '--copilot-text-secondary',
  '--copilot-accent-primary',
  '--copilot-accent-focus-ring',
  '--copilot-user-bubble-bg',
  '--copilot-assistant-bubble-bg',
];

const THEME_FILES = [
  'frontend/styles/themes/steadfast-default.css',
  'frontend/styles/themes/midnight-scholar.css',
  'frontend/styles/themes/soft-paper.css',
  'frontend/styles/themes/rose-studio.css',
  'frontend/styles/themes/ember-focus.css',
  'frontend/styles/themes/violet-library.css',
  'frontend/styles/themes/ocean-glass.css',
  'frontend/styles/themes/calm-forest.css',
];

describe('copilot-theme-contract', () => {
  it.each(THEME_FILES)('%s contains .copilot-theme-scope', (filePath) => {
    const css = readRepoFile(filePath);
    expect(css).toContain('.copilot-theme-scope');
  });

  it('steadfast-default.css defines all required tokens', () => {
    const css = readRepoFile('frontend/styles/themes/steadfast-default.css');

    for (const token of STEADFAST_REQUIRED_TOKENS) {
      expect(css).toContain(token);
    }
  });

  it('steadfast-default defines light and dark variants', () => {
    const css = readRepoFile('frontend/styles/themes/steadfast-default.css');
    expect(css).toContain('.copilot-theme-scope {');
    expect(css).toContain('.copilot-theme-scope.copilot-theme-dark {');
  });

  it('themes.index.css imports all 8 theme files', () => {
    const indexCss = readRepoFile('frontend/styles/themes/themes.index.css');

    for (const file of THEME_FILES) {
      const relativePath = file.replace('frontend/styles/themes/', '');
      expect(indexCss).toContain(`@import './${relativePath}'`);
    }
  });

  it('app-tokens.css defines :root and .dark shadcn tokens', () => {
    const appTokens = readRepoFile('frontend/styles/foundations/app-tokens.css');
    expect(appTokens).toContain(':root {');
    expect(appTokens).toContain('.dark {');
  });
});
