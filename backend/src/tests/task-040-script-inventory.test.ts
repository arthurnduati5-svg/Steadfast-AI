import { describe, it, expect, beforeEach } from 'vitest';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';
import { Task040ScriptInventoryEntry } from '../contracts/task040BackendFreezeContracts';

function makeEntry(overrides: Partial<Task040ScriptInventoryEntry> = {}): Task040ScriptInventoryEntry {
  return {
    path: 'scripts/verify-task040.ps1',
    taskOwner: 'task-040',
    category: 'script',
    isAcceptedBackendFreezeSurface: true,
    isGeneratedOutput: false,
    isLogOutput: false,
    isFrontend: false,
    isAI: false,
    isFutureTask: false,
    classification: 'accepted_backend_artifact',
    notes: '',
    ...overrides,
  };
}

function buildInventory(): Task040ScriptInventoryEntry[] {
  return [
    makeEntry({ path: 'scripts/verify-task040.ps1', taskOwner: 'task-040' }),
    makeEntry({ path: 'scripts/gen-task040-report.cjs', taskOwner: 'task-040' }),
    makeEntry({ path: 'scripts/task040-json-validate.cjs', taskOwner: 'task-040' }),
    makeEntry({ path: 'scripts/task040-privacy-scan.cjs', taskOwner: 'task-040' }),
    makeEntry({ path: 'scripts/run-task040-backend-freeze.cjs', taskOwner: 'task-040' }),
  ];
}

describe('Task040 Script Inventory', () => {
  beforeEach(() => {
    task040Repository.clearTask040StoresForTests();
  });

  it('contains script entries', () => {
    const entries = buildInventory();
    expect(entries.length).toBeGreaterThan(0);
  });

  it('all entries have category "script"', () => {
    const entries = buildInventory();
    for (const e of entries) {
      expect(e.category).toBe('script');
    }
  });

  it('all entries are accepted backend freeze surface', () => {
    const entries = buildInventory();
    for (const e of entries) {
      expect(e.isAcceptedBackendFreezeSurface).toBe(true);
    }
  });

  it('no entry is frontend, AI, future task, generated output, or log output', () => {
    const entries = buildInventory();
    for (const e of entries) {
      expect(e.isFrontend).toBe(false);
      expect(e.isAI).toBe(false);
      expect(e.isFutureTask).toBe(false);
      expect(e.isGeneratedOutput).toBe(false);
      expect(e.isLogOutput).toBe(false);
    }
  });

  it('classification is accepted_backend_artifact for all entries', () => {
    const entries = buildInventory();
    for (const e of entries) {
      expect(e.classification).toBe('accepted_backend_artifact');
    }
  });

  it('round-trips through the repository', () => {
    const entries = buildInventory();
    task040Repository.saveScriptInventory(entries);
    const retrieved = task040Repository.getScriptInventory();
    expect(retrieved).toEqual(entries);
  });
});
