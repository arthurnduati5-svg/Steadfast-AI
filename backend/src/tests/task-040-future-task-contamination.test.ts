import { describe, it, expect, beforeEach } from 'vitest';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';
import {
  Task040FutureTaskContaminationEntry,
  TASK040_FORBIDDEN_FUTURE_TASK_PATTERNS,
} from '../contracts/task040BackendFreezeContracts';

function makeEntry(
  path: string,
  pattern: string,
  classification: string = 'future_task_contamination',
): Task040FutureTaskContaminationEntry {
  return { path, pattern, classification };
}

describe('Task040 Future Task Contamination', () => {
  beforeEach(() => {
    task040Repository.clearTask040StoresForTests();
  });

  it('detects task-041 patterns', () => {
    const entry = makeEntry('backend/src/task-041/index.ts', 'task-041');
    expect(entry.pattern).toBe('task-041');
    expect(entry.classification).toBe('future_task_contamination');
  });

  it('detects task042 patterns', () => {
    const entry = makeEntry('backend/src/task042.ts', 'task042');
    expect(entry.pattern).toBe('task042');
  });

  it('detects TASK_041 patterns', () => {
    const entry = makeEntry('contracts/TASK_041.md', 'TASK_041');
    expect(entry.pattern).toBe('TASK_041');
  });

  it('detects TASK_042 patterns', () => {
    const entry = makeEntry('contracts/TASK_042.md', 'TASK_042');
    expect(entry.pattern).toBe('TASK_042');
  });

  it('detects "future task implementation" pattern', () => {
    const entry = makeEntry('docs/future-task-implementation.md', 'future task implementation');
    expect(entry.pattern).toBe('future task implementation');
  });

  it('detects "next phase implementation" pattern', () => {
    const entry = makeEntry('docs/next-phase.md', 'next phase implementation');
    expect(entry.pattern).toBe('next phase implementation');
  });

  it('TASK040_FORBIDDEN_FUTURE_TASK_PATTERNS contains all expected patterns', () => {
    expect(TASK040_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task041');
    expect(TASK040_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task-041');
    expect(TASK040_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('TASK_041');
    expect(TASK040_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task042');
    expect(TASK040_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task-042');
    expect(TASK040_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('TASK_042');
    expect(TASK040_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('future task implementation');
    expect(TASK040_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('next phase implementation');
    expect(TASK040_FORBIDDEN_FUTURE_TASK_PATTERNS.length).toBe(8);
  });

  it('classifies contamination entries with future_task_contamination', () => {
    const entry = makeEntry('src/task041.ts', 'task041', 'future_task_contamination');
    expect(entry.classification).toBe('future_task_contamination');
  });

  it('round-trips through the repository', () => {
    const entries = [
      makeEntry('src/task041.ts', 'task041'),
      makeEntry('src/task042.ts', 'task042'),
    ];
    task040Repository.saveFutureTaskContaminationManifest(entries);
    const retrieved = task040Repository.getFutureTaskContaminationManifest();
    expect(retrieved).toEqual(entries);
    expect(retrieved.length).toBe(2);
  });

  it('clear resets contamination manifest', () => {
    task040Repository.saveFutureTaskContaminationManifest([makeEntry('x.ts', 'task041')]);
    expect(task040Repository.getFutureTaskContaminationManifest().length).toBe(1);
    task040Repository.clearTask040StoresForTests();
    expect(task040Repository.getFutureTaskContaminationManifest().length).toBe(0);
  });
});
