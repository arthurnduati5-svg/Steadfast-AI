import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { resolve, extname, join, dirname } from 'node:path';
import { getRepositoryRoot } from './repository-root.mjs';

const VALID_EXTENSIONS = new Set(['.test.ts', '.spec.ts', '.test.tsx', '.spec.tsx']);
const IGNORE_DIRS = new Set(['node_modules', 'dist', '.next', 'coverage']);

function isTestFile(name) {
  for (const ext of VALID_EXTENSIONS) {
    if (name.endsWith(ext)) return true;
  }
  return false;
}

function collectTestFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        results.push(...collectTestFiles(fullPath));
      }
    } else if (entry.isFile() && isTestFile(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

const RULES = [
  {
    id: 'fake-pass-expect-true',
    name: 'expect(true).toBe(true)',
    regex: /expect\s*\(\s*true\s*\)\.\s*toBe\s*\(\s*true\s*\)/,
    reason: 'Executable fake pass',
  },
  {
    id: 'fake-pass-expect-one',
    name: 'expect(1).toBe(1)',
    regex: /expect\s*\(\s*1\s*\)\.\s*toBe\s*\(\s*1\s*\)/,
    reason: 'Executable fake pass',
  },
  {
    id: 'fake-pass-assert-true',
    name: 'assert(true)',
    regex: /assert\s*\(\s*true\s*\)/,
    reason: 'Executable fake pass',
  },
  {
    id: 'describe-skip',
    name: 'describe.skip',
    regex: /describe\.skip\s*\(/,
    reason: 'Skipped test suite',
  },
  {
    id: 'it-skip',
    name: 'it.skip',
    regex: /it\.skip\s*\(/,
    reason: 'Skipped test',
  },
  {
    id: 'test-skip',
    name: 'test.skip',
    regex: /test\.skip\s*\(/,
    reason: 'Skipped test',
  },
  {
    id: 'describe-only',
    name: 'describe.only',
    regex: /describe\.only\s*\(/,
    reason: 'Focused test suite',
  },
  {
    id: 'it-only',
    name: 'it.only',
    regex: /it\.only\s*\(/,
    reason: 'Focused test',
  },
  {
    id: 'test-only',
    name: 'test.only',
    regex: /test\.only\s*\(/,
    reason: 'Focused test',
  },
  {
    id: 'test-todo',
    name: '.todo',
    regex: /\.todo\s*\(/,
    reason: 'Todo/pending test',
  },
  {
    id: 'xit',
    name: 'xit',
    regex: /\bxit\s*\(/,
    reason: 'Skipped test (xit)',
  },
  {
    id: 'xtest',
    name: 'xtest',
    regex: /\bxtest\s*\(/,
    reason: 'Skipped test (xtest)',
  },
  {
    id: 'xdescribe',
    name: 'xdescribe',
    regex: /\bxdescribe\s*\(/,
    reason: 'Skipped suite (xdescribe)',
  },
  {
    id: 'fit',
    name: 'fit',
    regex: /\bfit\s*\(/,
    reason: 'Focused test (fit)',
  },
  {
    id: 'fdescribe',
    name: 'fdescribe',
    regex: /\bfdescribe\s*\(/,
    reason: 'Focused suite (fdescribe)',
  },
];

const DETECTOR_STRINGS = [
  'expect(true).toBe(true)',
  'expect(1).toBe(1)',
  'assert(true)',
  'describe.skip',
  'it.skip',
  'test.skip',
  'describe.only',
  'it.only',
  'test.only',
  '.todo(',
  'xit(',
  'xtest(',
  'xdescribe(',
  'fit(',
  'fdescribe(',
];

function isDetectorString(line) {
  const trimmed = line.trim();
  return DETECTOR_STRINGS.some(s => trimmed.includes(s));
}

function containsExecutableMatch(line, regex) {
  const match = line.match(regex);
  if (!match) return false;
  if (isDetectorString(line)) {
    const idx = line.search(regex);
    const beforeMatch = line.slice(0, idx);
    if (beforeMatch.includes('//') || beforeMatch.includes('*')) return false;
    const quoteCount = (beforeMatch.match(/["'`]/g) || []).length;
    if (quoteCount % 2 === 1) return false;
  }
  return true;
}

export function analyzeTestFiles(allowedPaths) {
  const root = getRepositoryRoot();
  const results = [];

  for (const allowedPath of allowedPaths) {
    const fullPath = resolve(root, allowedPath);
    if (!existsSync(fullPath)) continue;
    if (!statSync(fullPath).isDirectory()) {
      if (isTestFile(fullPath)) {
        analyzeFile(fullPath, results);
      }
      continue;
    }
    const files = collectTestFiles(fullPath);
    for (const file of files) {
      analyzeFile(file, results);
    }
  }

  return results;
}

function analyzeFile(filePath, results) {
  const root = getRepositoryRoot();
  let content;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return;
  }
  const lines = content.split('\n');
  const relativePath = filePath.replace(/\\/g, '/').replace(root.replace(/\\/g, '/') + '/', '');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const rule of RULES) {
      if (containsExecutableMatch(line, rule.regex)) {
        results.push({
          file: relativePath,
          line: i + 1,
          column: line.search(rule.regex) + 1,
          ruleId: rule.id,
          excerpt: line.trim().substring(0, 120),
          reason: rule.reason,
        });
      }
    }

    if (line.includes('return') && line.trim().startsWith('return') && !line.includes('expect') && !line.includes('assert')) {
      const nextNonEmptyLine = lines.slice(i + 1).find(l => l.trim());
      if (nextNonEmptyLine && (nextNonEmptyLine.includes('expect') || nextNonEmptyLine.includes('assert'))) {
        results.push({
          file: relativePath,
          line: i + 1,
          column: line.search(/\breturn\b/) + 1,
          ruleId: 'early-return-bypass',
          excerpt: line.trim().substring(0, 120),
          reason: 'Early return may bypass later assertions',
        });
      }
    }

    if ((line.includes('if') || line.includes('?') || line.includes('&&') || line.includes('||')) &&
        (line.includes('it(') || line.includes('test(') || line.includes('describe('))) {
      results.push({
        file: relativePath,
        line: i + 1,
        column: 1,
        ruleId: 'conditional-test-registration',
        excerpt: line.trim().substring(0, 120),
        reason: 'Test conditionally registered',
      });
    }
  }
}
