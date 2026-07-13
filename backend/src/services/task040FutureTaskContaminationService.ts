import { execSync } from 'child_process';
import {
  Task040FutureTaskContaminationEntry,
  TASK040_FORBIDDEN_FUTURE_TASK_PATTERNS,
} from '../contracts/task040BackendFreezeContracts';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';

export function scanFutureTaskContamination(): Task040FutureTaskContaminationEntry[] {
  const entries: Task040FutureTaskContaminationEntry[] = [];

  try {
    const status = execSync('git status --short', { encoding: 'utf-8', cwd: process.cwd() });
    const patterns = TASK040_FORBIDDEN_FUTURE_TASK_PATTERNS as readonly string[];
    const lines = status.split('\n').filter(l => l.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      const filePath = trimmed.substring(3).trim();
      for (const pattern of patterns) {
        if (filePath.toLowerCase().includes(pattern.toLowerCase())) {
          entries.push({
            path: filePath,
            pattern,
            classification: 'future_task_contamination',
          });
        }
      }
    }
  } catch { }

  return entries;
}

export function getFutureTaskContamination(): Task040FutureTaskContaminationEntry[] {
  const existing = task040Repository.getFutureTaskContaminationManifest();
  if (existing.length > 0) return existing;
  const contamination = scanFutureTaskContamination();
  task040Repository.saveFutureTaskContaminationManifest(contamination);
  return contamination;
}
