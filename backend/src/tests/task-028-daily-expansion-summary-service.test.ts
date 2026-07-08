import { describe, it, expect, beforeEach } from 'vitest';
import { generateDailySummary } from '../services/task028DailyExpansionSummaryService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

describe('Task 028 Daily Expansion Summary Service', () => {
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

    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId: runId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorIdHash: 'student-1', role: 'student', activationStatus: 'active',
    });
  });

  it('should generate daily summary with low risk', async () => {
    const result = await generateDailySummary({ runId, schoolId: 'school-1' });
    expect(result.runId).toBe(runId);
    expect(result.schoolId).toBe('school-1');
    expect(result.expandedCohortSafeCount).toBe(1);
    expect(result.riskLevel).toBe('low');
    expect(result.safeNextActions).toContain('Continue normal monitoring');
  });

  it('should set critical risk when safeguarding signals exist', async () => {
    await task028ExpansionExecutionRepository.createOversightItem({
      executionRunId: runId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      itemType: 'critical_safety_signal', severity: 'critical', status: 'open',
      source: 'guard', safeSummary: 'Critical',
      requiresTeacherReview: true, requiresAdminReview: true,
      requiresPrivacyReview: false, requiresDeenReview: false,
      requiresSocraticReview: false, requiresCurriculumReview: false,
      requiresPause: false, requiresRollback: false,
    });
    const result = await generateDailySummary({ runId, schoolId: 'school-1' });
    expect(result.riskLevel).toBe('critical');
    expect(result.safeguardingSignalCount).toBe(1);
  });

  it('should set high risk when interventions exceed 2', async () => {
    for (let i = 0; i < 3; i++) {
      await task028ExpansionExecutionRepository.createOversightItem({
        executionRunId: runId, pilotProgramId: 'pp-1', schoolId: 'school-1',
        itemType: 'technical_issue', severity: 'high', status: 'open',
        source: 'test', safeSummary: `Issue ${i}`,
        requiresTeacherReview: false, requiresAdminReview: false,
        requiresPrivacyReview: false, requiresDeenReview: false,
        requiresSocraticReview: false, requiresCurriculumReview: false,
        requiresPause: true, requiresRollback: false,
      });
    }
    const result = await generateDailySummary({ runId, schoolId: 'school-1' });
    expect(result.riskLevel).toBe('high');
    expect(result.interventionCount).toBe(3);
  });

  it('should set medium risk when support needed > 3', async () => {
    for (let i = 0; i < 4; i++) {
      await task028ExpansionExecutionRepository.createOversightItem({
        executionRunId: runId, pilotProgramId: 'pp-1', schoolId: 'school-1',
        itemType: 'blocked_student_access', severity: 'medium', status: 'open',
        source: 'gate', safeSummary: `Block ${i}`,
        requiresTeacherReview: true, requiresAdminReview: false,
        requiresPrivacyReview: false, requiresDeenReview: false,
        requiresSocraticReview: false, requiresCurriculumReview: false,
        requiresPause: false, requiresRollback: false,
      });
    }
    const result = await generateDailySummary({ runId, schoolId: 'school-1' });
    expect(result.riskLevel).toBe('medium');
    expect(result.supportNeededCount).toBeGreaterThan(3);
  });

  it('should include pauseRollbackState in summary', async () => {
    const result = await generateDailySummary({ runId, schoolId: 'school-1' });
    expect(result.pauseRollbackState).toBe('stage_1_active');
  });

  it('should throw for invalid input', async () => {
    await expect(generateDailySummary({ runId: '', schoolId: '' })).rejects.toThrow();
  });

  it('should throw for non-existent run', async () => {
    await expect(generateDailySummary({ runId: 'nonexistent', schoolId: 'school-1' })).rejects.toThrow();
  });

  it('should generate generatedAt timestamp', async () => {
    const result = await generateDailySummary({ runId, schoolId: 'school-1' });
    expect(result.generatedAt).toBeTruthy();
    expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
