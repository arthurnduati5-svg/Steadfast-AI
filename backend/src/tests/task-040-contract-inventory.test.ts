import { describe, it, expect, beforeEach } from 'vitest';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';
import { Task040ContractInventoryEntry } from '../contracts/task040BackendFreezeContracts';

function makeEntry(overrides: Partial<Task040ContractInventoryEntry> = {}): Task040ContractInventoryEntry {
  return {
    path: 'backend/src/contracts/schoolContracts.ts',
    taskOwner: 'task-020',
    category: 'contract',
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

function buildInventory(): Task040ContractInventoryEntry[] {
  return [
    makeEntry({ path: 'backend/src/contracts/schoolContracts.ts', taskOwner: 'task-020' }),
    makeEntry({ path: 'backend/src/contracts/studentContracts.ts', taskOwner: 'task-021' }),
    makeEntry({ path: 'backend/src/contracts/classContracts.ts', taskOwner: 'task-022' }),
    makeEntry({ path: 'backend/src/contracts/assessmentContracts.ts', taskOwner: 'task-025' }),
    makeEntry({ path: 'backend/src/contracts/progressContracts.ts', taskOwner: 'task-030' }),
    makeEntry({ path: 'backend/src/contracts/task040BackendFreezeContracts.ts', taskOwner: 'task-040' }),
  ];
}

describe('Task040 Contract Inventory', () => {
  beforeEach(() => {
    task040Repository.clearTask040StoresForTests();
  });

  it('contains contract entries', () => {
    const entries = buildInventory();
    expect(entries.length).toBeGreaterThan(0);
  });

  it('all entries have category "contract"', () => {
    const entries = buildInventory();
    for (const e of entries) {
      expect(e.category).toBe('contract');
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
    task040Repository.saveContractInventory(entries);
    const retrieved = task040Repository.getContractInventory();
    expect(retrieved).toEqual(entries);
  });
});
