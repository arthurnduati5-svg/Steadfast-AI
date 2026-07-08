import { describe, it, expect, beforeEach } from 'vitest';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('Task 026 Pilot Execution Repository Persistence', () => {
  beforeEach(() => {
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK026_REQUIRE_REAL_PRISMA;
  });

  it('should create and read back an execution run', async () => {
    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test-1',
      schoolId: 'school-1',
      safeSummary: 'Test run persistence',
      activeStudentCount: 10,
      activeTeacherCount: 2,
      allowedCohortIds: ['cohort-1'],
    });

    expect((run as any).id).toBeTruthy();
    expect((run as any).schoolId).toBe('school-1');
    expect((run as any).status).toBe('not_started');

    const fresh = await task026PilotExecutionRepository.getExecutionRun((run as any).id);
    expect(fresh).toBeTruthy();
    expect((fresh as any).id).toBe((run as any).id);
  });

  it('should create and read back an execution event', async () => {
    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test-1',
      schoolId: 'school-1',
      safeSummary: 'Test run',
    });

    const event = await task026PilotExecutionRepository.createExecutionEvent({
      executionRunId: (run as any).id,
      pilotProgramId: 'pp-test-1',
      schoolId: 'school-1',
      actorRole: 'admin',
      eventType: 'pilot_started',
      eventStatus: 'completed',
      safeSummary: 'Test event',
    });

    expect((event as any).id).toBeTruthy();
    expect((event as any).eventType).toBe('pilot_started');

    const events = await task026PilotExecutionRepository.listExecutionEvents((run as any).id);
    expect(events.length).toBe(1);
  });

  it('should create and read back a metric snapshot', async () => {
    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test-1',
      schoolId: 'school-1',
      safeSummary: 'Test run',
    });

    const snapshot = await task026PilotExecutionRepository.createMetricSnapshot({
      executionRunId: (run as any).id,
      pilotProgramId: 'pp-test-1',
      schoolId: 'school-1',
      activeSessions: 5,
      allowedSessionStarts: 10,
      blockedSessionStarts: 2,
    });

    expect((snapshot as any).id).toBeTruthy();
    expect((snapshot as any).activeSessions).toBe(5);

    const snapshots = await task026PilotExecutionRepository.listMetricSnapshots((run as any).id);
    expect(snapshots.length).toBeGreaterThanOrEqual(1);
  });

  it('should create and read back a feedback record', async () => {
    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test-1',
      schoolId: 'school-1',
      safeSummary: 'Test run',
    });

    const fb = await task026PilotExecutionRepository.createFeedbackRecord({
      executionRunId: (run as any).id,
      pilotProgramId: 'pp-test-1',
      schoolId: 'school-1',
      actorRole: 'student',
      feedbackType: 'learning_quality',
      safeSummary: 'Good session',
      redactionStatus: 'safe_summary_only',
    });

    expect((fb as any).id).toBeTruthy();
    expect((fb as any).feedbackType).toBe('learning_quality');

    const list = await task026PilotExecutionRepository.listFeedbackRecords((run as any).id);
    expect(list.length).toBe(1);
  });

  it('should create and read back a safety signal', async () => {
    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test-1',
      schoolId: 'school-1',
      safeSummary: 'Test run',
    });

    const signal = await task026PilotExecutionRepository.createSafetySignal({
      executionRunId: (run as any).id,
      pilotProgramId: 'pp-test-1',
      schoolId: 'school-1',
      signalType: 'feedback_risk',
      severity: 'high',
      source: 'test',
      safeSummary: 'Test signal',
      requiresPause: true,
    });

    expect((signal as any).id).toBeTruthy();
    expect((signal as any).severity).toBe('high');
    expect((signal as any).requiresPause).toBe(true);

    const signals = await task026PilotExecutionRepository.listSafetySignals((run as any).id);
    expect(signals.length).toBe(1);
  });

  it('should create and read back a post-pilot review', async () => {
    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test-1',
      schoolId: 'school-1',
      safeSummary: 'Test run',
    });

    const review = await task026PilotExecutionRepository.createPostPilotReview({
      executionRunId: (run as any).id,
      pilotProgramId: 'pp-test-1',
      schoolId: 'school-1',
      safeSummary: 'Test review',
      recommendedDecision: 'continue_limited_pilot',
      safeToStartNextTask: true,
    });

    expect((review as any).id).toBeTruthy();
    expect((review as any).recommendedDecision).toBe('continue_limited_pilot');
    expect((review as any).safeToStartNextTask).toBe(true);

    const got = await task026PilotExecutionRepository.getPostPilotReview((review as any).id);
    expect(got).toBeTruthy();
  });

  it('should create and read back audit records', async () => {
    const audit = await task026PilotExecutionRepository.createAuditRecord({
      actorRole: 'admin',
      action: 'test_action',
      safeSummary: 'Test audit',
      pilotProgramId: 'pp-test-1',
      schoolId: 'school-1',
    });

    expect((audit as any).id).toBeTruthy();
    expect((audit as any).action).toBe('test_action');
  });

  it('should update execution run state', async () => {
    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test-1',
      schoolId: 'school-1',
      safeSummary: 'Test run',
    });

    const updated = await task026PilotExecutionRepository.updateExecutionRun((run as any).id, { status: 'active' });
    expect((updated as any).status).toBe('active');
  });

  it('should list execution runs by program', async () => {
    await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test-1',
      schoolId: 'school-1',
      safeSummary: 'Run 1',
    });
    await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test-1',
      schoolId: 'school-1',
      safeSummary: 'Run 2',
    });

    const runs = await task026PilotExecutionRepository.listExecutionRuns('pp-test-1');
    expect(runs.length).toBe(2);
  });
});
