import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { getRepositoryRoot } from './repository-root.mjs';

const VALID_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);
const IGNORE_DIRS = new Set(['node_modules', 'dist', '.next', 'coverage']);

function collectFiles(dir, ignoreDirs = IGNORE_DIRS) {
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
      if (!ignoreDirs.has(entry.name)) {
        results.push(...collectFiles(fullPath, ignoreDirs));
      }
    } else if (entry.isFile() && VALID_EXTENSIONS.has(extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

export function scanForPatterns(allowedPaths, patterns) {
  const root = getRepositoryRoot();
  const results = [];

  for (const allowedPath of allowedPaths) {
    const fullPath = resolve(root, allowedPath);
    if (!existsSync(fullPath)) continue;
    if (!statSync(fullPath).isDirectory()) {
      if (VALID_EXTENSIONS.has(extname(fullPath))) {
        processFile(fullPath, allowedPath, patterns, results);
      }
      continue;
    }
    const files = collectFiles(fullPath);
    for (const filePath of files) {
      processFile(filePath, allowedPath, patterns, results);
    }
  }

  return results;
}

function processFile(filePath, allowedPath, patterns, results) {
  const root = getRepositoryRoot();
  let content;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return;
  }
  const lines = content.split('\n');
  const relativePath = filePath.replace(/\\/g, '/').replace(root.replace(/\\/g, '/') + '/', '');

  for (const pattern of patterns) {
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(pattern.regex);
      if (match) {
        results.push({
          file: relativePath,
          line: i + 1,
          column: match.index + 1,
          pattern: pattern.id,
          excerpt: lines[i].trim().substring(0, 120),
          reason: pattern.reason,
        });
      }
    }
  }
}

export const SCAN_PATTERNS = {
  routeLocalRepository: [
    { id: 'new InMemory', regex: /new\s+InMemory/, reason: 'Route-local in-memory repository' },
    { id: 'new Map persistence', regex: /\bnew\s+Map\s*[<(]/, reason: 'Route-local persistence Map' },
    { id: 'require repositories', regex: /require\s*\(\s*['"][^'"]*repositori/, reason: 'Dynamic repository require' },
    { id: 'repo construction', regex: /new\s+\w*[Rr]epository\w*\s*\(/, reason: 'Repository construction per request' },
  ],
  routeOwnedIdentity: [
    { id: 'randomUUID route', regex: /randomUUID\s*\(/, reason: 'Route-owned domain identity' },
    { id: 'Date.now identity', regex: /Date\.now\s*\(\s*\)\s*[.:=].*(?:id|key|code)/i, reason: 'Date.now() based identity' },
    { id: 'Math.random identity', regex: /Math\.random\s*\(\s*\).*(?:id|key|code)/i, reason: 'Math.random() based identity' },
    { id: 'local counter', regex: /let\s+\w*(?:counter|seq|index)\s*=\s*0/i, reason: 'Local counter identity' },
  ],
  optionalPersistence: [
    { id: 'no await repository', regex: /(?:\.save|\.update|\.delete|\.create|\.persist)\s*\([^)]*\)(?!\s*\n\s*await)/, reason: 'Persistence call without await' },
    { id: 'missing try-catch persist', regex: /await\s+\w+\.\s*(?:save|update|delete|create|persist)\s*\(/, reason: 'Persistence call should have try-catch' },
  ],
  idempotency: [
    { id: 'missing idempotency', regex: /async\s+function\s+\w*[Pp]rocess|async\s+\w*\s*=>\s*{/, reason: 'Async operation may need idempotency key' },
  ],
  shellAndPath: [
    { id: 'execSync shell', regex: /execSync\s*\(/, reason: 'execSync shell command' },
    { id: 'stderr redirect', regex: /2>\s*\/dev\/null/, reason: 'Shell stderr redirect' },
    { id: 'or true', regex: /\|\|\s*true\b/, reason: 'Shell || true pattern' },
    { id: 'or echo', regex: /\|\|\s*echo\b/, reason: 'Shell || echo pattern' },
    { id: 'process.cwd root', regex: /process\.cwd\s*\(\s*\).*[Rr]oo/, reason: 'process.cwd() root assumption' },
    { id: 'double backend', regex: /backend\/backend\//, reason: 'Double backend path' },
  ],
  typeSuppression: [
    { id: 'ts-ignore', regex: /@ts-ignore/, reason: 'TypeScript ignore suppression' },
    { id: 'ts-nocheck', regex: /@ts-nocheck/, reason: 'TypeScript no check suppression' },
    { id: 'eslint-disable', regex: /\beslint-disable\b/, reason: 'ESLint disable directive' },
  ],
  manualSentinel: [
    { id: 'accepted sentinel', regex: /STEADFAST_QBANK_RUNTIME_COMPOSITION_PERSISTENCE_TRUTH_ACCEPTED_READY/, reason: 'Handwritten acceptance sentinel in code' },
    { id: 'governor sentinel printed', regex: /GOVERNOR_FINALIZE_ACCEPTED/, reason: 'Handwritten governor accepted sentinel' },
  ],
};

const SCAN_ALIASES = {
  'route-local-repository-scan': 'routeLocalRepository',
  'route-owned-identity-scan': 'routeOwnedIdentity',
  'optional-persistence-scan': 'optionalPersistence',
  'idempotency-scan': 'idempotency',
  'shell-path-scan': 'shellAndPath',
  'type-suppression-scan': 'typeSuppression',
  'school-scope-behavior': null,
  'manual-sentinel-scan': 'manualSentinel',
};

export function runAllScans(allowedPaths, manifest) {
  const allResults = {};
  if (manifest && manifest.scans) {
    for (const scanDef of manifest.scans) {
      const patternKey = SCAN_ALIASES[scanDef.id] || scanDef.id;
      if (patternKey === null) continue;
      const patterns = SCAN_PATTERNS[patternKey];
      if (patterns) {
        allResults[scanDef.id] = scanForPatterns(allowedPaths, patterns);
      } else {
        allResults[scanDef.id] = [{ error: `No executable scan configuration for: ${scanDef.id}` }];
      }
    }
  } else {
    for (const [name, patterns] of Object.entries(SCAN_PATTERNS)) {
      allResults[name] = scanForPatterns(allowedPaths, patterns);
    }
  }
  return allResults;
}
