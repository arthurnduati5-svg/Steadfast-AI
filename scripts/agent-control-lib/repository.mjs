import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import crypto from 'node:crypto';

let _repoRoot = null;

export function getRepositoryRoot() {
  if (_repoRoot) return _repoRoot;
  _repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8', timeout: 5000 }).trim().replace(/\\/g, '/');
  return _repoRoot;
}

export function getGitCommonDir() {
  return execSync('git rev-parse --git-common-dir', { encoding: 'utf-8', timeout: 5000 }).trim().replace(/\\/g, '/');
}

export function getCurrentHead() {
  return execSync('git rev-parse HEAD', { encoding: 'utf-8', timeout: 5000 }).trim();
}

export function getCurrentBranch() {
  return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8', timeout: 5000 }).trim();
}

export function getRuntimeDir(taskId) {
  const commonDir = getGitCommonDir();
  return resolve(commonDir, 'steadfast-agent-control', 'tasks', taskId).replace(/\\/g, '/');
}

export function ensureDir(p) {
  if (existsSync(p)) return;
  mkdirSync(p, { recursive: true });
}

export function getGitStatus() {
  return execSync('git status --porcelain=v1', { encoding: 'utf-8', timeout: 5000 }).trim();
}

export function getStagedFiles() {
  return execSync('git diff --cached --name-status', { encoding: 'utf-8', timeout: 5000 }).trim();
}

export function computeHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function computeFileHash(filePath) {
  if (!existsSync(filePath)) return null;
  return computeHash(readFileSync(filePath));
}

export function writeJSON(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

export function readJSON(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function appendLine(path, line) {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, line + '\n', 'utf-8');
}

export function readLines(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf-8').split('\n').filter(l => l.trim());
}
