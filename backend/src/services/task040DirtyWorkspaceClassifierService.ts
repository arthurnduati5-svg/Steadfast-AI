import { execSync } from 'child_process';
import {
  Task040DirtyWorkspaceEntry,
  Task040DirtyWorkspaceClassification,
} from '../contracts/task040BackendFreezeContracts';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';

function classifyPath(filePath: string): Task040DirtyWorkspaceClassification {
  if (filePath.startsWith('backend/src/contracts/task040') ||
    filePath.startsWith('backend/src/lib/task040') ||
    filePath.startsWith('backend/src/repositories/task040') ||
    filePath.startsWith('backend/src/services/task040') ||
    filePath.startsWith('backend/src/routes/task040') ||
    filePath.startsWith('backend/src/tests/task040') ||
    filePath.startsWith('backend/src/tests/task-040') ||
    filePath.startsWith('backend/src/tests/fixtures/task040') ||
    filePath.startsWith('docs/architecture/TASK_040') ||
    filePath.startsWith('docs/ops/task-040') ||
    filePath.startsWith('reports/task-040') ||
    filePath.startsWith('scripts/task040') ||
    filePath.startsWith('scripts/verify-task040') ||
    filePath.startsWith('scripts/gen-task040') ||
    filePath.startsWith('scripts/run-task040')) {
    return 'task040_freeze_artifact';
  }

  if (filePath.startsWith('backend/src/')) return 'accepted_backend_artifact';
  if (filePath.startsWith('frontend/') || filePath.startsWith('docs/frontend/') || filePath.startsWith('docs/ui-polish/')) return 'frontend_out_of_scope';
  if (filePath.startsWith('AI/')) return 'ai_out_of_scope';
  if (filePath.includes('task041') || filePath.includes('task-041') || filePath.includes('TASK_041') ||
    filePath.includes('task042') || filePath.includes('task-042') || filePath.includes('TASK_042')) {
    return 'future_task_contamination';
  }
  if (filePath.startsWith('backend/dist/')) return 'generated_output';
  if (filePath.startsWith('logs/')) return 'log_output';
  if (filePath.startsWith('.next/') || filePath.startsWith('frontend/.next/') || filePath.includes('.tmp') || filePath.includes('.cache')) return 'cache_temp_output';
  if (filePath.startsWith('mocks/') || filePath.startsWith('contracts/') || filePath.startsWith('docs/deployment/') ||
    filePath.startsWith('docs/integration/') || filePath.startsWith('docs/operations/') || filePath.startsWith('docs/architecture/') ||
    filePath.startsWith('scripts/')) return 'unrelated_untracked';

  return 'unknown';
}

export function classifyDirtyWorkspace(): Task040DirtyWorkspaceEntry[] {
  const entries: Task040DirtyWorkspaceEntry[] = [];

  try {
    const status = execSync('git status --short', { encoding: 'utf-8', cwd: process.cwd() });
    const lines = status.split('\n').filter(l => l.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const isStaged = trimmed.startsWith('M ') || trimmed.startsWith('A ') || trimmed.startsWith('D ');
      const isModified = trimmed.startsWith(' M') || trimmed.startsWith('M ');
      const isUntracked = trimmed.startsWith('??');
      const filePath = trimmed.substring(3).trim();
      const classification = classifyPath(filePath);

      entries.push({
        path: filePath,
        classification,
        isStaged: isStaged && (trimmed.startsWith('M ') || trimmed.startsWith('A ')),
        isTrackedModified: isModified && !isStaged,
        isUntracked: isUntracked,
      });
    }
  } catch { }

  return entries;
}

export function getDirtyWorkspaceClassification(): Task040DirtyWorkspaceEntry[] {
  const existing = task040Repository.getDirtyWorkspaceClassification();
  if (existing.length > 0) return existing;
  const classification = classifyDirtyWorkspace();
  task040Repository.saveDirtyWorkspaceClassification(classification);
  return classification;
}
