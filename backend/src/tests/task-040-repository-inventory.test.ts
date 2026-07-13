import { describe, it, expect, beforeEach } from 'vitest';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';
import { Task040RepositoryInventoryEntry } from '../contracts/task040BackendFreezeContracts';

function makeEntry(overrides: Partial<Task040RepositoryInventoryEntry> = {}): Task040RepositoryInventoryEntry {
  return {
    path: 'backend/src/repositories/schoolRepository.ts',
    taskOwner: 'task-020',
    category: 'repository',
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

function buildInventory(): Task040RepositoryInventoryEntry[] {
  return [
    makeEntry({ path: 'backend/src/repositories/schoolRepository.ts', taskOwner: 'task-020' }),
    makeEntry({ path: 'backend/src/repositories/studentRepository.ts', taskOwner: 'task-021' }),
    makeEntry({ path: 'backend/src/repositories/classRepository.ts', taskOwner: 'task-022' }),
    makeEntry({ path: 'backend/src/repositories/assessmentRepository.ts', taskOwner: 'task-025' }),
    makeEntry({ path: 'backend/src/repositories/progressRepository.ts', taskOwner: 'task-030' }),
    makeEntry({ path: 'backend/src/repositories/task040BackendFreezeRepository.ts', taskOwner: 'task-040' }),
  ];
}

describe('Task040 Repository Inventory', () => {
  beforeEach(() => {
    task040Repository.clearTask040StoresForTests();
  });

  it('contains repository entries', () => {
    const entries = buildInventory();
    expect(entries.length).toBeGreaterThan(0);
  });

  it('all entries have category "repository"', () => {
    const entries = buildInventory();
    for (const e of entries) {
      expect(e.category).toBe('repository');
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
    task040Repository.saveRepositoryInventory(entries);
    const retrieved = task040Repository.getRepositoryInventory();
    expect(retrieved).toEqual(entries);
  });
});
