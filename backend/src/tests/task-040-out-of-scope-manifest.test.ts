import { describe, it, expect, beforeEach } from 'vitest';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';
import {
  Task040OutOfScopeManifest,
  Task040FutureTaskContaminationEntry,
} from '../contracts/task040BackendFreezeContracts';

function buildManifest(): Task040OutOfScopeManifest {
  return {
    frontendFiles: ['frontend/src/App.tsx', 'frontend/src/components/Header.tsx'],
    aiFiles: ['AI/prompts/tutor.txt', 'AI/agents/feedback.ts'],
    futureTaskFiles: [
      { path: 'backend/src/task-041/index.ts', pattern: 'task-041', classification: 'future_task_contamination' },
    ],
    generatedOutputFiles: ['backend/dist/bundle.js'],
    logFiles: ['logs/server.log', 'logs/error.log'],
    cacheTempFiles: ['.cache/esbuild/', 'tmp/scratch.json'],
    notes: 'Out of scope manifest for Task 040 backend freeze.',
  };
}

describe('Task040 Out of Scope Manifest', () => {
  beforeEach(() => {
    task040Repository.clearTask040StoresForTests();
  });

  it('builds a manifest with all out-of-scope categories', () => {
    const manifest = buildManifest();
    expect(manifest.frontendFiles.length).toBe(2);
    expect(manifest.aiFiles.length).toBe(2);
    expect(manifest.futureTaskFiles.length).toBe(1);
    expect(manifest.generatedOutputFiles.length).toBe(1);
    expect(manifest.logFiles.length).toBe(2);
    expect(manifest.cacheTempFiles.length).toBe(2);
  });

  it('frontendFiles contains frontend paths', () => {
    const manifest = buildManifest();
    expect(manifest.frontendFiles[0]).toContain('frontend/');
  });

  it('aiFiles contains AI paths', () => {
    const manifest = buildManifest();
    expect(manifest.aiFiles[0]).toContain('AI/');
  });

  it('futureTaskFiles has correct structure', () => {
    const manifest = buildManifest();
    const entry = manifest.futureTaskFiles[0];
    expect(entry.path).toContain('task-041');
    expect(entry.pattern).toBe('task-041');
    expect(entry.classification).toBe('future_task_contamination');
  });

  it('generatedOutputFiles contains dist paths', () => {
    const manifest = buildManifest();
    expect(manifest.generatedOutputFiles[0]).toContain('dist/');
  });

  it('logFiles contains log paths', () => {
    const manifest = buildManifest();
    expect(manifest.logFiles[0]).toContain('logs/');
  });

  it('cacheTempFiles contains cache and tmp paths', () => {
    const manifest = buildManifest();
    expect(manifest.cacheTempFiles[0]).toContain('.cache');
    expect(manifest.cacheTempFiles[1]).toContain('tmp/');
  });

  it('notes field is populated', () => {
    const manifest = buildManifest();
    expect(manifest.notes.length).toBeGreaterThan(0);
    expect(manifest.notes).toContain('Task 040 backend freeze');
  });

  it('round-trips through the repository', () => {
    const manifest = buildManifest();
    task040Repository.saveOutOfScopeManifest(manifest);
    const retrieved = task040Repository.getOutOfScopeManifest();
    expect(retrieved).toEqual(manifest);
  });

  it('clear resets out of scope manifest', () => {
    task040Repository.saveOutOfScopeManifest(buildManifest());
    expect(task040Repository.getOutOfScopeManifest()).not.toBeNull();
    task040Repository.clearTask040StoresForTests();
    expect(task040Repository.getOutOfScopeManifest()).toBeNull();
  });
});
