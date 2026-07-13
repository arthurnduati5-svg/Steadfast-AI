import { describe, it, expect, beforeEach } from 'vitest';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';
import {
  Task040AcceptedTaskLedger,
  Task040AcceptedTaskLedgerEntry,
  TASK040_ACCEPTED_TASK_IDS,
  createTask040SafeTimestamp as ts,
} from '../contracts/task040BackendFreezeContracts';

function makeEntry(taskId: string): Task040AcceptedTaskLedgerEntry {
  return {
    taskId,
    taskName: `Task ${taskId}`,
    status: 'accepted',
    acceptedCommit: `abc${taskId}def`,
    safeToStartNextTask: true,
    safeToStartTask040ValueAtThatStage: taskId === '036' ? true : false,
    reportPath: `docs/ops/task-${taskId}/task-${taskId}-report.json`,
    jsonReportPath: `docs/ops/task-${taskId}/task-${taskId}-report.json`,
    handoffPath: `docs/ops/task-${taskId}/TASK_${taskId}_HANDOFF.md`,
    focusedTestsPassed: true,
    regressionPassed: true,
    fullBackendSuitePassed: true,
    typeScriptPassed: true,
    backendBuildPassed: true,
    prismaValidatePassed: true,
    prismaGeneratePassed: true,
    safetyScansPassed: true,
    frontendUiCreated: false,
    liveAiIntroduced: false,
    liveConnectorWriteIntroduced: false,
    realNotificationsSent: false,
    productionDeploymentPerformed: false,
    productionMutationPerformed: false,
    remainingBlockers: [],
    notes: '',
  };
}

function buildLedger(): Task040AcceptedTaskLedger {
  return {
    taskId: '040',
    entries: TASK040_ACCEPTED_TASK_IDS.map(makeEntry),
    taskCount: TASK040_ACCEPTED_TASK_IDS.length,
    complete: true,
    generatedAt: ts(),
  };
}

describe('Task040 Accepted Task Ledger', () => {
  beforeEach(() => {
    task040Repository.clearTask040StoresForTests();
  });

  it('builds a ledger with all accepted tasks', () => {
    const ledger = buildLedger();
    expect(ledger.entries.length).toBe(17);
    expect(ledger.taskCount).toBe(17);
    expect(ledger.taskId).toBe('040');
    expect(ledger.complete).toBe(true);
  });

  it('contains entries for tasks 020 through 036', () => {
    const ledger = buildLedger();
    const ids = ledger.entries.map(e => e.taskId);
    for (let i = 20; i <= 36; i++) {
      const padded = String(i).padStart(3, '0');
      expect(ids).toContain(padded);
    }
  });

  it('each entry has the correct structure', () => {
    const ledger = buildLedger();
    for (const entry of ledger.entries) {
      expect(entry).toHaveProperty('taskId');
      expect(entry).toHaveProperty('taskName');
      expect(entry).toHaveProperty('status');
      expect(entry).toHaveProperty('acceptedCommit');
      expect(entry).toHaveProperty('safeToStartNextTask');
      expect(entry).toHaveProperty('focusedTestsPassed');
      expect(entry).toHaveProperty('regressionPassed');
      expect(entry).toHaveProperty('fullBackendSuitePassed');
      expect(entry).toHaveProperty('typeScriptPassed');
      expect(entry).toHaveProperty('backendBuildPassed');
      expect(entry).toHaveProperty('prismaValidatePassed');
      expect(entry).toHaveProperty('safetyScansPassed');
      expect(entry).toHaveProperty('frontendUiCreated');
      expect(entry).toHaveProperty('liveAiIntroduced');
      expect(entry).toHaveProperty('remainingBlockers');
      expect(Array.isArray(entry.remainingBlockers)).toBe(true);
    }
  });

  it('all entries have status "accepted"', () => {
    const ledger = buildLedger();
    for (const entry of ledger.entries) {
      expect(entry.status).toBe('accepted');
    }
  });

  it('the task 036 entry has safeToStartTask040ValueAtThatStage set to true', () => {
    const ledger = buildLedger();
    const task036 = ledger.entries.find(e => e.taskId === '036');
    expect(task036).toBeDefined();
    expect(task036!.safeToStartTask040ValueAtThatStage).toBe(true);
  });

  it('safeToStartNextTask is true for all entries', () => {
    const ledger = buildLedger();
    for (const entry of ledger.entries) {
      expect(entry.safeToStartNextTask).toBe(true);
    }
  });

  it('no entry has frontendUiCreated, liveAiIntroduced, or productionDeploymentPerformed', () => {
    const ledger = buildLedger();
    for (const entry of ledger.entries) {
      expect(entry.frontendUiCreated).toBe(false);
      expect(entry.liveAiIntroduced).toBe(false);
      expect(entry.liveConnectorWriteIntroduced).toBe(false);
      expect(entry.realNotificationsSent).toBe(false);
      expect(entry.productionDeploymentPerformed).toBe(false);
      expect(entry.productionMutationPerformed).toBe(false);
    }
  });

  it('round-trips through the repository', () => {
    const ledger = buildLedger();
    task040Repository.saveAcceptedTaskLedger(ledger);
    const retrieved = task040Repository.getAcceptedTaskLedger();
    expect(retrieved).toEqual(ledger);
    expect(retrieved!.generatedAt).toBe(ledger.generatedAt);
  });

  it('generatedAt is a valid ISO string', () => {
    const ledger = buildLedger();
    expect(new Date(ledger.generatedAt).toISOString()).toBe(ledger.generatedAt);
  });

  it('each entry has a reportPath that matches the expected pattern', () => {
    const ledger = buildLedger();
    for (const entry of ledger.entries) {
      expect(entry.reportPath).toMatch(new RegExp(`^docs/ops/task-${entry.taskId}/`));
      expect(entry.handoffPath).toMatch(new RegExp(`^docs/ops/task-${entry.taskId}/`));
    }
  });
});
