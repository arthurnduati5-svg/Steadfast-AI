import { describe, it, expect } from 'vitest';
import { getTask032CanaryView } from '../services/task032CanaryViewService';

function makeViewInput(overrides: Record<string, unknown> = {}) {
  return {
    actorRole: 'admin' as const,
    actorHash: 'admin_hash_task032_safe_001',
    canaryRunId: 'canary_run_task032_safe',
    cohortId: 'canary_cohort_task032_safe',
    canaryState: 'active' as const,
    eligibleStudentCount: 20,
    activatedStudentCount: 10,
    activeSessionCount: 5,
    requestCount: 100,
    successfulRequestCount: 95,
    safeDenialCount: 5,
    errorCount: 0,
    budgetStatus: 'healthy',
    controlAvailable: true,
    safeEventSummaries: ['Normal operation'],
    teacherHash: 'teacher_hash_task032_safe_001',
    teacherAssignmentScopes: ['class_task032_safe_001'],
    studentHash: 'student_hash_task032_safe_001',
    needsAttentionCount: 0,
    safeAggregateLearningSignal: 'normal',
    ...overrides,
  };
}

describe('Task 032 - Safe Views', () => {
  it('should provide admin canary summary', async () => {
    const result = await getTask032CanaryView(makeViewInput());
    expect(result.adminSummary).toBeTruthy();
    expect(result.teacherSummary).toBeNull();
    expect(result.studentStatus).toBeNull();
    expect(result.adminSummary?.canaryRunId).toBe('canary_run_task032_safe');
    expect(result.adminSummary?.aggregateMetrics.eligibleStudentCount).toBe(20);
    expect(result.adminSummary?.controlAvailable).toBe(true);
  });

  it('should provide operator canary summary', async () => {
    const result = await getTask032CanaryView(makeViewInput({ actorRole: 'operator' }));
    expect(result.adminSummary).toBeTruthy();
    expect(result.adminSummary?.controlAvailable).toBe(true);
  });

  it('should provide teacher oversight summary only', async () => {
    const result = await getTask032CanaryView(makeViewInput({ actorRole: 'teacher' }));
    expect(result.adminSummary).toBeNull();
    expect(result.teacherSummary).toBeTruthy();
    expect(result.studentStatus).toBeNull();

    const summary = result.teacherSummary!;
    expect(summary.rawChatExposed).toBe(false);
    expect(summary.privateMemoryExposed).toBe(false);
    expect(summary.safeguardingDetailsExposed).toBe(false);
    expect(summary.deenSensitiveTextExposed).toBe(false);
    expect(summary.adminControlsVisible).toBe(false);
    expect(summary.eligibleStudentCount).toBe(20);
  });

  it('should provide student own status only', async () => {
    const result = await getTask032CanaryView(makeViewInput({ actorRole: 'student' }));
    expect(result.adminSummary).toBeNull();
    expect(result.teacherSummary).toBeNull();
    expect(result.studentStatus).toBeTruthy();

    const status = result.studentStatus!;
    expect(status.available).toBe(true);
    expect(status.statusLabel).toBe('available');
    expect(status.otherStudentsVisible).toBe(false);
    expect(status.monitoringInternalsVisible).toBe(false);
    expect(status.teacherAdminNotesVisible).toBe(false);
    expect(status.reportsVisible).toBe(false);
    expect(status.controlActionsVisible).toBe(false);
  });

  it('should show paused student status', async () => {
    const result = await getTask032CanaryView(makeViewInput({ actorRole: 'student', canaryState: 'paused' }));
    expect(result.studentStatus?.available).toBe(false);
    expect(result.studentStatus?.statusLabel).toBe('paused');
  });

  it('should deny unknown role', async () => {
    const result = await getTask032CanaryView(makeViewInput({ actorRole: 'unknown' }));
    expect(result.adminSummary).toBeNull();
    expect(result.teacherSummary).toBeNull();
    expect(result.studentStatus).toBeNull();
    expect(result.denied).toBe(true);
  });

  it('should not expose raw private data in admin summary', async () => {
    const result = await getTask032CanaryView(makeViewInput());
    const json = JSON.stringify(result.adminSummary);
    expect(json).not.toContain('raw student chat');
    expect(json).not.toContain('private learner memory');
    expect(json).not.toContain('teacher-only notes');
  });
});
