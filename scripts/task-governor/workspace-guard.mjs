import { execSync } from 'node:child_process';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import crypto from 'node:crypto';
import { getRepositoryRoot } from './repository-root.mjs';
import { WorkspaceScopeError } from './errors.mjs';

function runGit(args) {
  try {
    return execSync(`git ${args}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 10000,
    }).trim();
  } catch {
    return '';
  }
}

export function getCurrentHead() {
  return runGit('rev-parse HEAD');
}

export function getStatus() {
  const short = runGit('status --short');
  const lines = short.split('\n').filter(l => l.trim());
  const result = { staged: [], unstaged: [], untracked: [], deleted: [], renamed: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    const status = trimmed.slice(0, 2);
    const file = trimmed.slice(3);

    if (status === '??') {
      result.untracked.push(file);
    } else if (status.startsWith('R')) {
      result.renamed.push(file);
    } else if (status.startsWith('D')) {
      result.deleted.push(file);
    } else {
      if (status[0] !== ' ') result.staged.push(file);
      if (status[1] !== ' ') result.unstaged.push(file);
    }
  }

  return result;
}

export function computeFileHash(filePath) {
  const root = getRepositoryRoot();
  const fullPath = resolve(root, filePath);
  if (!existsSync(fullPath)) return null;
  const stat = statSync(fullPath);
  if (stat.isDirectory()) return null;
  const content = readFileSync(fullPath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function captureBaseline(scope) {
  const head = getCurrentHead();
  const status = getStatus();
  const hashes = {};

  for (const file of [...status.unstaged, ...status.untracked]) {
    const hash = computeFileHash(file);
    if (hash) hashes[file] = hash;
  }

  return {
    head,
    status,
    hashes,
    timestamp: new Date().toISOString(),
  };
}

export function classifyPath(filePath, manifest) {
  const normalized = filePath.replace(/\\/g, '/');
  const scope = manifest.scope || {};
  const allowedPaths = scope.allowedPaths || [];
  const protectedPaths = scope.protectedPaths || [];
  const generatedPaths = scope.generatedPaths || [];

  if (generatedPaths.some(g => normalized.startsWith(g.replace(/\\/g, '/')))) {
    return 'GENERATED_RUNTIME';
  }

  if (protectedPaths.some(p => normalized.startsWith(p.replace(/\\/g, '/')))) {
    return 'PROTECTED_UNRELATED';
  }

  if (allowedPaths.some(a => normalized.startsWith(a.replace(/\\/g, '/')))) {
    return 'TASK_ALLOWED';
  }

  return 'NEW_UNAUTHORIZED_CHANGE';
}

export function checkWorkspace(manifest, baseline) {
  const currentStatus = getStatus();
  const scope = manifest.scope || {};
  const allowedPaths = scope.allowedPaths || [];
  const errors = [];

  for (const file of currentStatus.staged) {
    const classification = classifyPath(file, manifest);
    if (classification !== 'TASK_ALLOWED') {
      errors.push(`Staged unauthorized file: ${file} (${classification})`);
    }
  }

  for (const file of currentStatus.unstaged) {
    if (allowedPaths.some(a => file.startsWith(a.replace(/\\/g, '/')))) {
      const baselineHash = baseline.hashes[file];
      if (baselineHash) {
        const currentHash = computeFileHash(file);
        if (currentHash && currentHash !== baselineHash) {
          errors.push(`Task-allowed file modified: ${file}`);
        }
      }
    }
  }

  for (const file of currentStatus.untracked) {
    const classification = classifyPath(file, manifest);
    if (classification === 'NEW_UNAUTHORIZED_CHANGE') {
      errors.push(`New untracked file outside scope: ${file}`);
    }
    if (classification === 'GENERATED_RUNTIME') {
      errors.push(`Generated runtime file in working tree: ${file}`);
    }
  }

  return errors;
}

export function checkFinalWorkspace(manifest) {
  const currentStatus = getStatus();
  const scope = manifest.scope || {};
  const allowedPaths = scope.allowedPaths || [];
  const errors = [];

  if (currentStatus.staged.length > 0) {
    errors.push(`Staged files remain: ${currentStatus.staged.join(', ')}`);
  }

  for (const file of [...currentStatus.unstaged, ...currentStatus.untracked, ...currentStatus.deleted]) {
    if (allowedPaths.some(a => file.startsWith(a.replace(/\\/g, '/')))) {
      errors.push(`Task-allowed path not clean: ${file}`);
    }
  }

  return errors;
}

export function isBaselineSame(baseline) {
  const currentHead = getCurrentHead();
  return currentHead === baseline.head;
}
