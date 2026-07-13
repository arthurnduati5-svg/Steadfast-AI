import { describe, it, expect, beforeEach } from 'vitest';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';
import { Task040ReportInventoryEntry } from '../contracts/task040BackendFreezeContracts';

function makeEntry(overrides: Partial<Task040ReportInventoryEntry> = {}): Task040ReportInventoryEntry {
  return {
    path: 'reports/task-040-final-backend-logic-freeze-v1.json',
    taskOwner: 'task-040',
    category: 'report',
    isAcceptedBackendFreezeSurface: true,
    isGeneratedOutput: false,
    isLogOutput: false,
    isFrontend: false,
    isAI: false,
    isFutureTask: false,
    classification: 'task040_freeze_artifact',
    notes: '',
    ...overrides,
  };
}

function buildInventory(): Task040ReportInventoryEntry[] {
  return [
    makeEntry({ path: 'reports/task-040-final-backend-logic-freeze-v1.json', category: 'report' }),
    makeEntry({ path: 'reports/task-040-final-backend-logic-freeze-v1.md', category: 'report' }),
    makeEntry({ path: 'docs/ops/task-040/task-040-final-backend-logic-freeze-report.json', category: 'doc' }),
    makeEntry({ path: 'docs/ops/task-040/TASK_040_FINAL_BACKEND_LOGIC_FREEZE_REPORT.md', category: 'doc' }),
    makeEntry({ path: 'docs/ops/task-040/TASK_040_HANDOFF.md', category: 'doc' }),
    makeEntry({ path: 'docs/architecture/TASK_040_FINAL_BACKEND_LOGIC_FREEZE.md', category: 'doc' }),
  ];
}

describe('Task040 Report Inventory', () => {
  beforeEach(() => {
    task040Repository.clearTask040StoresForTests();
  });

  it('contains report/doc entries', () => {
    const entries = buildInventory();
    expect(entries.length).toBeGreaterThan(0);
  });

  it('all entries have category "report" or "doc"', () => {
    const entries = buildInventory();
    for (const e of entries) {
      expect(['report', 'doc']).toContain(e.category);
    }
  });

  it('report entries have category "report"', () => {
    const entries = buildInventory();
    const reports = entries.filter(e => e.path.startsWith('reports/'));
    for (const r of reports) {
      expect(r.category).toBe('report');
    }
  });

  it('doc entries have category "doc"', () => {
    const entries = buildInventory();
    const docs = entries.filter(e => e.path.startsWith('docs/'));
    for (const d of docs) {
      expect(d.category).toBe('doc');
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

  it('classification is task040_freeze_artifact for all entries', () => {
    const entries = buildInventory();
    for (const e of entries) {
      expect(e.classification).toBe('task040_freeze_artifact');
    }
  });

  it('round-trips through the repository', () => {
    const entries = buildInventory();
    task040Repository.saveReportInventory(entries);
    const retrieved = task040Repository.getReportInventory();
    expect(retrieved).toEqual(entries);
  });
});
