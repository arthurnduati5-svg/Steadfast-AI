import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import crypto from 'node:crypto';
import { getRepositoryRoot } from './repository-root.mjs';
import { ManifestValidationError } from './errors.mjs';

export function loadManifest(taskId) {
  const root = getRepositoryRoot();
  const manifestPath = resolve(root, '.task-governor/tasks', `${taskId}.json`);

  if (!existsSync(manifestPath)) {
    throw new ManifestValidationError(`Manifest not found: .task-governor/tasks/${taskId}.json`);
  }

  let raw;
  try {
    raw = readFileSync(manifestPath, 'utf-8');
  } catch {
    throw new ManifestValidationError(`Cannot read manifest: .task-governor/tasks/${taskId}.json`);
  }

  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch {
    throw new ManifestValidationError(`Invalid JSON in manifest: .task-governor/tasks/${taskId}.json`);
  }

  return manifest;
}

export function computeManifestHash(manifest) {
  return crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
}
