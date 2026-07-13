import * as fs from 'fs';
import * as path from 'path';
import {
  Task040ReportInventoryEntry,
} from '../contracts/task040BackendFreezeContracts';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';

export function buildReportInventory(): Task040ReportInventoryEntry[] {
  const entries: Task040ReportInventoryEntry[] = [];

  const reportDirs = [
    { base: 'reports', category: 'report' as const },
    { base: 'docs/ops', category: 'doc' as const },
    { base: 'docs/architecture', category: 'doc' as const },
  ];

  for (const { base, category } of reportDirs) {
    const dir = path.resolve(process.cwd(), base);
    try {
      walkDir(dir, (filePath) => {
        const relative = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
        const isTask040 = relative.includes('task040') || relative.includes('task-040');
        entries.push({
          path: relative,
          taskOwner: isTask040 ? '040' : 'various',
          category,
          isAcceptedBackendFreezeSurface: isTask040 && category === 'report',
          isGeneratedOutput: category === 'report',
          isLogOutput: false,
          isFrontend: false,
          isAI: false,
          isFutureTask: false,
          classification: isTask040 ? 'task040_freeze_artifact' : 'accepted_backend_artifact',
          notes: isTask040 ? 'Task 040 freeze report/doc' : `${category} from various tasks`,
        });
      });
    } catch { }
  }

  return entries;
}

function walkDir(dir: string, callback: (filePath: string) => void): void {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath, callback);
      } else if (entry.isFile()) {
        callback(fullPath);
      }
    }
  } catch { }
}

export function getReportInventory(): Task040ReportInventoryEntry[] {
  const existing = task040Repository.getReportInventory();
  if (existing.length > 0) return existing;
  const inv = buildReportInventory();
  task040Repository.saveReportInventory(inv);
  return inv;
}
