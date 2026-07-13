import { describe, it, expect, beforeEach } from 'vitest';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';
import { Task040TestInventoryEntry } from '../contracts/task040BackendFreezeContracts';

function makeEntry(overrides: Partial<Task040TestInventoryEntry> = {}): Task040TestInventoryEntry {
  return {
    path: 'backend/src/tests/task-020-school-contracts.test.ts',
    taskOwner: 'task-020',
    category: 'test',
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

function buildInventory(): Task040TestInventoryEntry[] {
  return [
    makeEntry({ path: 'backend/src/tests/task-020-school-contracts.test.ts', taskOwner: 'task-020' }),
    makeEntry({ path: 'backend/src/tests/task-021-student-contracts.test.ts', taskOwner: 'task-021' }),
    makeEntry({ path: 'backend/src/tests/task-022-class-contracts.test.ts', taskOwner: 'task-022' }),
    makeEntry({ path: 'backend/src/tests/task-025-assessment-contracts.test.ts', taskOwner: 'task-025' }),
    makeEntry({ path: 'backend/src/tests/task-030-progress-contracts.test.ts', taskOwner: 'task-030' }),
    makeEntry({ path: 'backend/src/tests/task-040-contracts.test.ts', taskOwner: 'task-040' }),
    makeEntry({ path: 'backend/src/tests/task-040-validation.test.ts', taskOwner: 'task-040' }),
  ];
}

describe('Task040 Test Inventory', () => {
  beforeEach(() => {
    task040Repository.clearTask040StoresForTests();
  });

  it('contains test entries', () => {
    const entries = buildInventory();
    expect(entries.length).toBeGreaterThan(0);
  });

  it('all entries have category "test"', () => {
    const entries = buildInventory();
    for (const e of entries) {
      expect(e.category).toBe('test');
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
    task040Repository.saveTestInventory(entries);
    const retrieved = task040Repository.getTestInventory();
    expect(retrieved).toEqual(entries);
  });
});
