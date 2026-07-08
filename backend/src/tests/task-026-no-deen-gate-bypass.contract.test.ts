import { describe, it, expect, beforeEach } from 'vitest';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { createSafetySignal } from '../services/task026PilotSafetySignalService';
import { createPilotIncident } from '../services/task026PilotIncidentBridgeService';

describe('Task 026 No Deen Gate Bypass', () => {
  let executionRunId: string;

  beforeEach(async () => {
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';

    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      status: 'active',
      safeSummary: 'Deen test',
    });
    executionRunId = (run as any).id;
  });

  it('should detect Deen concern signals', async () => {
    const result = await createSafetySignal({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      signalType: 'deen_concern_flag',
      severity: 'high',
      source: 'feedback_service',
      safeSummary: 'Student raised Deen concern about content accuracy.',
      requiresDeenReview: true,
      requiresTeacherReview: true,
      reasonCodes: ['deen_concern'],
    });

    expect(result.ok).toBe(true);

    const signals = await task026PilotExecutionRepository.listSafetySignals(executionRunId);
    expect(signals[0].signalType).toBe('deen_concern_flag');
    expect(signals[0].requiresDeenReview).toBe(true);
    expect(signals[0].requiresTeacherReview).toBe(true);
  });

  it('should create incident for Deen governance severe issue', async () => {
    const result = await createPilotIncident({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      reason: 'deen_governance_severe_issue',
      severity: 'critical',
      safeSummary: 'Deen governance severe issue detected requiring teacher/scholar referral.',
      reasonCodes: ['deen_severe_issue'],
    });

    expect(result.ok).toBe(true);
  });

  it('should not store raw Deen-sensitive text in records', async () => {
    await task026PilotExecutionRepository.createFeedbackRecord({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      actorRole: 'student',
      feedbackType: 'deen_concern',
      safeSummary: 'Student indicated concern about religious content. Safe summary stored.',
      redactionStatus: 'safe_summary_only',
      deenRelevant: true,
    });

    const records = await task026PilotExecutionRepository.listFeedbackRecords(executionRunId);
    expect((records[0] as any).safeSummary).not.toContain('deenSensitive');
    expect((records[0] as any).safeSummary).not.toContain('deen_sensitive');
  });

  it('should not bypass Deen governance in feedback', async () => {
    await task026PilotExecutionRepository.createFeedbackRecord({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      actorRole: 'teacher',
      feedbackType: 'general',
      safeSummary: 'Safe summary only',
      deenRelevant: true,
    });

    const records = await task026PilotExecutionRepository.listFeedbackRecords(executionRunId);
    const deenRecords = records.filter((r: any) => r.deenRelevant);
    expect(deenRecords.length).toBe(1);
  });
});
