import { describe, it, expect, beforeEach } from 'vitest';
import { submitPilotFeedback } from '../services/task026PilotFeedbackService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';

describe('Task 026 Pilot Feedback Service', () => {
  let executionRunId: string;

  beforeEach(async () => {
    task026PilotExecutionRepository._clearMemory();
    task025PilotRepository._clearMemory();
    process.env.NODE_ENV = 'test';

    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      status: 'active',
      safeSummary: 'Feedback test run',
    });
    executionRunId = (run as any).id;
  });

  it('should accept valid feedback', async () => {
    const result = await submitPilotFeedback({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      actorRole: 'student',
      feedbackType: 'learning_quality',
      safeSummary: 'The lesson was helpful and clear.',
    });

    expect(result.ok).toBe(true);
    expect(result.feedbackId).toBeTruthy();
    expect(result.redactionStatus).toBe('safe_summary_only');
  });

  it('should redact private content from feedback', async () => {
    const result = await submitPilotFeedback({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      actorRole: 'student',
      feedbackType: 'general',
      safeSummary: 'This contains answerKey: secret42 and teacherOnlyContent: secret',
    });

    expect(result.ok).toBe(true);
    expect(result.redactionStatus).toBe('redacted');

    const records = await task026PilotExecutionRepository.listFeedbackRecords(executionRunId);
    expect(records.length).toBe(1);
    expect((records[0] as any).safeSummary).not.toContain('answerKey');
    expect((records[0] as any).safeSummary).not.toContain('teacherOnlyContent');
    expect((records[0] as any).safeSummary).toContain('[REDACTED]');
  });

  it('should reject invalid feedback type', async () => {
    const result = await submitPilotFeedback({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      actorRole: 'student',
      feedbackType: 'invalid_type' as any,
      safeSummary: 'Test',
    });

    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('invalid_feedback_type');
  });

  it('should tag risk flags correctly', async () => {
    const result = await submitPilotFeedback({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      actorRole: 'teacher',
      feedbackType: 'socratic_quality',
      safeSummary: 'Student seems confused',
      teacherActionRequested: true,
      safeguardingRelevant: false,
      deenRelevant: true,
      privacyRelevant: false,
      riskFlags: ['confusion'],
    });

    expect(result.ok).toBe(true);

    const records = await task026PilotExecutionRepository.listFeedbackRecords(executionRunId);
    expect(records.length).toBe(1);
    const record = records[0] as any;
    expect(record.teacherActionRequested).toBe(true);
    expect(record.deenRelevant).toBe(true);
    expect(Array.isArray(record.riskFlags)).toBe(true);
  });

  it('should create safety signal for risk feedback', async () => {
    const result = await submitPilotFeedback({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      actorRole: 'teacher',
      feedbackType: 'deen_concern',
      safeSummary: 'Deen concern reported',
      deenRelevant: true,
      riskFlags: ['deen'],
    });

    expect(result.ok).toBe(true);
    expect(result.safetySignalCreated).toBe(true);
  });
});
