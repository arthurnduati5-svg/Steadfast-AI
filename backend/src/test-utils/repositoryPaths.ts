import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const _backendRoot = path.resolve(__dirname, '../..');
const _backendSrcRoot = path.resolve(_backendRoot, 'src');
const _repoRoot = path.resolve(_backendRoot, '..');

export function getBackendRoot(): string {
  return _backendRoot;
}

export function getRepositoryRoot(): string {
  return _repoRoot;
}

export function getBackendSrcRoot(): string {
  return _backendSrcRoot;
}

export function getBackendIndexPath(): string {
  return path.resolve(_backendSrcRoot, 'index.ts');
}

export function resolveBackendPath(relativePath: string): string {
  return path.resolve(_backendRoot, relativePath);
}

export function resolveBackendSrcPath(relativePath: string): string {
  return path.resolve(_backendSrcRoot, relativePath);
}

export function readBackendFile(relativePath: string): string {
  return fs.readFileSync(resolveBackendPath(relativePath), 'utf-8');
}

export function readBackendSrcFile(relativePath: string): string {
  return fs.readFileSync(resolveBackendSrcPath(relativePath), 'utf-8');
}

export function checkBackendFileExists(relativePath: string): boolean {
  return fs.existsSync(resolveBackendPath(relativePath));
}

export function checkBackendSrcFileExists(relativePath: string): boolean {
  return fs.existsSync(resolveBackendSrcPath(relativePath));
}
