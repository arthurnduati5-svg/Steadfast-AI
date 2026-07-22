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
};

export function runAllScans(allowedPaths) {
  const allResults = {};
  for (const [name, patterns] of Object.entries(SCAN_PATTERNS)) {
    allResults[name] = scanForPatterns(allowedPaths, patterns);
  }
  return allResults;
}
