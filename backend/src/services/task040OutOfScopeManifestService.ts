import { execSync } from 'child_process';
import {
  Task040OutOfScopeManifest,
  Task040FutureTaskContaminationEntry,
} from '../contracts/task040BackendFreezeContracts';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';

export function buildOutOfScopeManifest(): Task040OutOfScopeManifest {
  const frontendFiles: string[] = [];
  const aiFiles: string[] = [];
  const generatedOutputFiles: string[] = [];
  const logFiles: string[] = [];
  const cacheTempFiles: string[] = [];

  try {
    const status = execSync('git status --short', { encoding: 'utf-8', cwd: process.cwd() });
    const lines = status.split('\n').filter(l => l.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      const filePath = trimmed.substring(3).trim();
      if (filePath.startsWith('frontend/') || filePath.startsWith('docs/frontend/')) frontendFiles.push(filePath);
      if (filePath.startsWith('AI/')) aiFiles.push(filePath);
      if (filePath.startsWith('backend/dist/')) generatedOutputFiles.push(filePath);
      if (filePath.startsWith('logs/')) logFiles.push(filePath);
      if (filePath.includes('.next') || filePath.includes('.tmp') || filePath.includes('.cache')) cacheTempFiles.push(filePath);
    }
  } catch { }

  const futureTaskFiles: Task040FutureTaskContaminationEntry[] = [];

  return {
    frontendFiles,
    aiFiles,
    futureTaskFiles,
    generatedOutputFiles,
    logFiles,
    cacheTempFiles,
    notes: 'Out-of-scope files detected in workspace. These are not part of Task 040 freeze.',
  };
}

export function getOutOfScopeManifest(): Task040OutOfScopeManifest {
  const existing = task040Repository.getOutOfScopeManifest();
  if (existing) return existing;
  const manifest = buildOutOfScopeManifest();
  task040Repository.saveOutOfScopeManifest(manifest);
  return manifest;
}
