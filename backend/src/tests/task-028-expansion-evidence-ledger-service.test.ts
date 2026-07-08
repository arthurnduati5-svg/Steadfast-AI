import { describe, it, expect, beforeEach } from 'vitest';
import { recordEvidenceEvent } from '../services/task028ExpansionEvidenceLedgerService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

describe('Task 028 Expansion Evidence Ledger Service', () => {
  let runId: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop-1', pilotProgramId: 'pp-1',
      schoolId: 'school-1', status: 'stage_1_active', safeSummary: 'Active run',
    });
    runId = (run as any).id;
  });

  it('should record an allowed access evidence event', async () => {
    const result = await recordEvidenceEvent({
      runId, schoolId: 'school-1', eventType: 'expanded_access_allowed',
      safeMetadata: { classId: 'class-1', reason: 'in_cohort' },
      actorRole: 'student', actorId: 'learner-1',
    });
    expect(result.eventId).toBeTruthy();
    expect(result.eventType).toBe('expanded_access_allowed');
    expect(result.runId).toBe(runId);
    expect(result.schoolId).toBe('school-1');
  });

  it('should record a denied access evidence event', async () => {
    const result = await recordEvidenceEvent({
      runId, schoolId: 'school-1', eventType: 'expanded_access_denied',
      safeMetadata: { reason: 'not_in_cohort' },
      actorRole: 'student', actorId: 'unknown-learner',
    });
    expect(result.eventId).toBeTruthy();
    expect(result.eventType).toBe('expanded_access_denied');
  });

  it('should record a rollback evidence event', async () => {
    const result = await recordEvidenceEvent({
      runId, schoolId: 'school-1', eventType: 'rollback_completed',
      safeMetadata: { reason: 'safety_issue' },
      actorRole: 'operator', actorId: 'op-1',
    });
    expect(result.eventId).toBeTruthy();
    expect(result.eventType).toBe('rollback_completed');
  });

  it('should record a daily summary evidence event', async () => {
    const result = await recordEvidenceEvent({
      runId, schoolId: 'school-1', eventType: 'daily_summary_generated',
      safeMetadata: { cohortCount: 50 },
      actorRole: 'system', actorId: 'system-1',
    });
    expect(result.eventType).toBe('daily_summary_generated');
    expect(result.safeMetadata.cohortCount).toBe(50);
  });

  it('should sanitize actorRole in metadata', async () => {
    const result = await recordEvidenceEvent({
      runId, schoolId: 'school-1', eventType: 'teacher_oversight_viewed',
      safeMetadata: { teacherId: 't-1' },
      actorRole: 'teacher', actorId: 'teacher-1',
    });
    expect(result.safeMetadata.teacherId).toBe('t-1');
  });

  it('should throw for invalid input', async () => {
    await expect(recordEvidenceEvent({
      runId: '', schoolId: '', eventType: 'expanded_access_allowed',
      safeMetadata: {}, actorRole: '', actorId: '',
    })).rejects.toThrow();
  });

  it('should throw for non-existent run', async () => {
    await expect(recordEvidenceEvent({
      runId: 'nonexistent', schoolId: 'school-1', eventType: 'expanded_access_allowed',
      safeMetadata: {}, actorRole: 'student', actorId: 'learner-1',
    })).rejects.toThrow();
  });

  it('should throw when forbidden fields in metadata', async () => {
    await expect(recordEvidenceEvent({
      runId, schoolId: 'school-1', eventType: 'expanded_access_allowed',
      safeMetadata: { rawStudentData: 'sensitive' },
      actorRole: 'student', actorId: 'learner-1',
    })).rejects.toThrow();
  });
});
