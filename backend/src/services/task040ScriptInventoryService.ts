import * as fs from 'fs';
import * as path from 'path';
import {
  Task040ScriptInventoryEntry,
} from '../contracts/task040BackendFreezeContracts';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';

export function buildScriptInventory(): Task040ScriptInventoryEntry[] {
  const dir = path.resolve(process.cwd(), 'scripts');
  const entries: Task040ScriptInventoryEntry[] = [];
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const isTask040 = file.includes('task040') || file.includes('task-040');
      const isScript = file.endsWith('.cjs') || file.endsWith('.mjs') || file.endsWith('.ps1') || file.endsWith('.js');
      if (!isScript) continue;

      entries.push({
        path: `scripts/${file}`,
        taskOwner: isTask040 ? '040' : 'various',
        category: 'script',
        isAcceptedBackendFreezeSurface: isTask040,
        isGeneratedOutput: false,
        isLogOutput: false,
        isFrontend: false,
        isAI: false,
        isFutureTask: false,
        classification: isTask040 ? 'task040_freeze_artifact' : 'accepted_backend_artifact',
        notes: isTask040 ? 'Task 040 freeze script' : 'Script from various tasks',
      });
    }
  } catch { }
  return entries;
}

export function getScriptInventory(): Task040ScriptInventoryEntry[] {
  const existing = task040Repository.getScriptInventory();
  if (existing.length > 0) return existing;
  const inv = buildScriptInventory();
  task040Repository.saveScriptInventory(inv);
  return inv;
}
