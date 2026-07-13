import { describe, it, expect, beforeEach } from 'vitest';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';
import {
  Task040DirtyWorkspaceEntry,
  Task040DirtyWorkspaceClassification,
} from '../contracts/task040BackendFreezeContracts';

const ALL_CLASSIFICATIONS: Task040DirtyWorkspaceClassification[] = [
  'task040_freeze_artifact',
  'accepted_backend_artifact',
  'frontend_out_of_scope',
  'ai_out_of_scope',
  'future_task_contamination',
  'generated_output',
  'log_output',
  'cache_temp_output',
  'unrelated_untracked',
  'unknown',
];

function makeEntry(
  path: string,
  classification: Task040DirtyWorkspaceClassification,
  overrides: Partial<Task040DirtyWorkspaceEntry> = {},
): Task040DirtyWorkspaceEntry {
  return {
    path,
    classification,
    isStaged: false,
    isTrackedModified: false,
    isUntracked: true,
    ...overrides,
  };
}

describe('Task040 Dirty Workspace Classifier', () => {
  beforeEach(() => {
    task040Repository.clearTask040StoresForTests();
  });

  it('allows all valid classification types', () => {
    const entries: Task040DirtyWorkspaceEntry[] = ALL_CLASSIFICATIONS.map(c =>
      makeEntry(`path/${c}.ts`, c),
    );
    expect(entries.length).toBe(10);
    for (const e of entries) {
      expect(ALL_CLASSIFICATIONS).toContain(e.classification);
    }
  });

  it('classifies task040 freeze artifacts correctly', () => {
    const entry = makeEntry('reports/task-040-report.json', 'task040_freeze_artifact', { isStaged: true });
    expect(entry.classification).toBe('task040_freeze_artifact');
    expect(entry.isStaged).toBe(true);
  });

  it('classifies accepted backend artifacts correctly', () => {
    const entry = makeEntry('backend/src/contracts/schoolContracts.ts', 'accepted_backend_artifact', { isTrackedModified: true });
    expect(entry.classification).toBe('accepted_backend_artifact');
    expect(entry.isTrackedModified).toBe(true);
  });

  it('classifies frontend out of scope correctly', () => {
    const entry = makeEntry('frontend/src/App.tsx', 'frontend_out_of_scope');
    expect(entry.classification).toBe('frontend_out_of_scope');
  });

  it('classifies AI out of scope correctly', () => {
    const entry = makeEntry('AI/agent.py', 'ai_out_of_scope');
    expect(entry.classification).toBe('ai_out_of_scope');
  });

  it('classifies future task contamination correctly', () => {
    const entry = makeEntry('src/task041.ts', 'future_task_contamination');
    expect(entry.classification).toBe('future_task_contamination');
  });

  it('classifies generated output correctly', () => {
    const entry = makeEntry('backend/dist/output.js', 'generated_output');
    expect(entry.classification).toBe('generated_output');
  });

  it('classifies log output correctly', () => {
    const entry = makeEntry('logs/app.log', 'log_output');
    expect(entry.classification).toBe('log_output');
  });

  it('classifies cache temp output correctly', () => {
    const entry = makeEntry('.cache/temp.json', 'cache_temp_output');
    expect(entry.classification).toBe('cache_temp_output');
  });

  it('classifies untracked unrelated correctly', () => {
    const entry = makeEntry('notes.txt', 'unrelated_untracked');
    expect(entry.classification).toBe('unrelated_untracked');
  });

  it('classifies unknown correctly', () => {
    const entry = makeEntry('mystery/file.bin', 'unknown');
    expect(entry.classification).toBe('unknown');
  });

  it('round-trips through the repository', () => {
    const entries = [
      makeEntry('backend/src/contracts/test.ts', 'accepted_backend_artifact', { isStaged: true }),
      makeEntry('frontend/test.tsx', 'frontend_out_of_scope'),
    ];
    task040Repository.saveDirtyWorkspaceClassification(entries);
    const retrieved = task040Repository.getDirtyWorkspaceClassification();
    expect(retrieved).toEqual(entries);
  });

  it('clear resets dirty workspace classification', () => {
    const entries = [makeEntry('test.ts', 'accepted_backend_artifact')];
    task040Repository.saveDirtyWorkspaceClassification(entries);
    expect(task040Repository.getDirtyWorkspaceClassification().length).toBe(1);
    task040Repository.clearTask040StoresForTests();
    expect(task040Repository.getDirtyWorkspaceClassification().length).toBe(0);
  });
});
