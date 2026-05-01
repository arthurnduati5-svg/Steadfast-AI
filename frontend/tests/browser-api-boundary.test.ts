import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function collectSourceFiles(rootDir: string): string[] {
  const files: string[] = [];
  const stack = [rootDir];

  while (stack.length) {
    const current = stack.pop()!;
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'api') continue;
        if (entry.name === 'tests') continue;
        stack.push(fullPath);
        continue;
      }

      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      files.push(fullPath);
    }
  }

  return files;
}

describe('browser api transport boundary', () => {
  it('keeps browser UI away from direct copilot fetch URLs and legacy transport helpers', () => {
    const scanRoots = [
      path.join(workspaceRoot, 'components'),
      path.join(workspaceRoot, 'contexts'),
      path.join(workspaceRoot, 'app'),
    ];

    const sourceFiles = scanRoots.flatMap((scanRoot) => collectSourceFiles(scanRoot));
    const violations: Array<{ file: string; pattern: string }> = [];

    for (const filePath of sourceFiles) {
      const relative = path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
      if (relative.startsWith('app/api/')) continue;

      const text = fs.readFileSync(filePath, 'utf8');

      if (/requestCopilot|resolveDirectCopilotUrl/.test(text)) {
        violations.push({ file: relative, pattern: 'legacy transport helper' });
      }

      if (/fetch\s*\(\s*['"`]\/api\/copilot\//.test(text)) {
        violations.push({ file: relative, pattern: 'direct /api/copilot fetch' });
      }
    }

    expect(violations).toEqual([]);
  });
});
