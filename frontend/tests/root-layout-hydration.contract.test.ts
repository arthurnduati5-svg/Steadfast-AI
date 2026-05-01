import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

describe('root layout hydration contract', () => {
  it('allows browser extensions to add body attributes before hydration', () => {
    const layout = readFileSync(path.join(repoRoot, 'frontend/app/layout.tsx'), 'utf8');

    expect(layout).toContain('<body className="font-body antialiased" suppressHydrationWarning>');
  });
});
