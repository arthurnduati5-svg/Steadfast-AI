import * as fs from 'fs';
import * as path from 'path';
import {
  Task040TestInventoryEntry,
} from '../contracts/task040BackendFreezeContracts';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';

export function buildTestInventory(): Task040TestInventoryEntry[] {
  const dir = path.resolve(process.cwd(), 'backend/src/tests');
  const entries: Task040TestInventoryEntry[] = [];
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.test.ts'));
    for (const file of files) {
      const isTask040 = file.includes('task040') || file.includes('task-040');
      let taskOwner = 'various';
      if (file.includes('task020')) taskOwner = '020';
      else if (file.includes('task021')) taskOwner = '021';
      else if (file.includes('task022')) taskOwner = '022';
      else if (file.includes('task023')) taskOwner = '023';
      else if (file.includes('task024')) taskOwner = '024';
      else if (file.includes('task025')) taskOwner = '025';
      else if (file.includes('task026')) taskOwner = '026';
      else if (file.includes('task027')) taskOwner = '027';
      else if (file.includes('task028')) taskOwner = '028';
      else if (file.includes('task029')) taskOwner = '029';
      else if (file.includes('task030')) taskOwner = '030';
      else if (file.includes('task031')) taskOwner = '031';
      else if (file.includes('task032')) taskOwner = '032';
      else if (file.includes('task033')) taskOwner = '033';
      else if (file.includes('task034')) taskOwner = '034';
      else if (file.includes('task035')) taskOwner = '035';
      else if (file.includes('task036')) taskOwner = '036';
      else if (isTask040) taskOwner = '040';

      entries.push({
        path: `backend/src/tests/${file}`,
        taskOwner,
        category: 'test',
        isAcceptedBackendFreezeSurface: isTask040,
        isGeneratedOutput: false,
        isLogOutput: false,
        isFrontend: false,
        isAI: false,
        isFutureTask: false,
        classification: isTask040 ? 'task040_freeze_artifact' : 'accepted_backend_artifact',
        notes: isTask040 ? 'Task 040 freeze test' : `Backend test from task ${taskOwner}`,
      });
    }
  } catch { }
  return entries;
}

export function getTestInventory(): Task040TestInventoryEntry[] {
  const existing = task040Repository.getTestInventory();
  if (existing.length > 0) return existing;
  const inv = buildTestInventory();
  task040Repository.saveTestInventory(inv);
  return inv;
}
