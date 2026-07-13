import { describe, it, expect, beforeEach } from 'vitest';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';
import { Task040ServiceInventoryEntry } from '../contracts/task040BackendFreezeContracts';

function makeEntry(overrides: Partial<Task040ServiceInventoryEntry> = {}): Task040ServiceInventoryEntry {
  return {
    path: 'backend/src/services/schoolService.ts',
    taskOwner: 'task-020',
    category: 'service',
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

function buildInventory(): Task040ServiceInventoryEntry[] {
  return [
    makeEntry({ path: 'backend/src/services/schoolService.ts', taskOwner: 'task-020' }),
    makeEntry({ path: 'backend/src/services/studentService.ts', taskOwner: 'task-021' }),
    makeEntry({ path: 'backend/src/services/classService.ts', taskOwner: 'task-022' }),
    makeEntry({ path: 'backend/src/services/assessmentService.ts', taskOwner: 'task-025' }),
    makeEntry({ path: 'backend/src/services/progressService.ts', taskOwner: 'task-030' }),
    makeEntry({ path: 'backend/src/services/task040Task036ProofLoaderService.ts', taskOwner: 'task-040' }),
  ];
}

describe('Task040 Service Inventory', () => {
  beforeEach(() => {
    task040Repository.clearTask040StoresForTests();
  });

  it('contains service entries', () => {
    const entries = buildInventory();
    expect(entries.length).toBeGreaterThan(0);
  });

  it('all entries have category "service"', () => {
    const entries = buildInventory();
    for (const e of entries) {
      expect(e.category).toBe('service');
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
    task040Repository.saveServiceInventory(entries);
    const retrieved = task040Repository.getServiceInventory();
    expect(retrieved).toEqual(entries);
  });
});
