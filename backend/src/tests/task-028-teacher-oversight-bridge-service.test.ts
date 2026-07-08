import { describe, it, expect, beforeEach } from 'vitest';
import { generateTeacherOversightSnapshot } from '../services/task028TeacherOversightBridgeService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

describe('Task 028 Teacher Oversight Bridge Service', () => {
  let runId: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop-1', pilotProgramId: 'pp-1',
      schoolId: 'school-1', status: 'stage_1_active', safeSummary: 'Active',
    });
    runId = (run as any).id;
  });

  it('should generate oversight snapshot with healthy status', async () => {
    const result = await generateTeacherOversightSnapshot({
      runId, schoolId: 'school-1', teacherId: 'teacher-1',
    });
    expect(result.runId).toBe(runId);
    expect(result.schoolId).toBe('school-1');
    expect(result.oversightStatus).toBe('healthy');
    expect(result.pauseRecommended).toBe(false);
    expect(result.rollbackRecommended).toBe(false);
  });

  it('should detect critical status when safeguarding signals exist', async () => {
    await task028ExpansionExecutionRepository.createOversightItem({
      executionRunId: runId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      itemType: 'critical_safety_signal', severity: 'critical', status: 'open',
      source: 'guard', safeSummary: 'Critical signal',
      requiresTeacherReview: true, requiresAdminReview: true,
      requiresPrivacyReview: false, requiresDeenReview: false,
      requiresSocraticReview: false, requiresCurriculumReview: false,
      requiresPause: false, requiresRollback: false,
    });
    const result = await generateTeacherOversightSnapshot({
      runId, schoolId: 'school-1', teacherId: 'teacher-1',
    });
    expect(result.oversightStatus).toBe('critical');
    expect(result.safeguardingSignalCount).toBe(1);
    expect(result.pauseRecommended).toBe(true);
  });

  it('should set needs_review when intervention items exist', async () => {
    await task028ExpansionExecutionRepository.createOversightItem({
      executionRunId: runId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      itemType: 'technical_issue', severity: 'high', status: 'open',
      source: 'test', safeSummary: 'Needs intervention',
      requiresTeacherReview: true, requiresAdminReview: false,
      requiresPrivacyReview: false, requiresDeenReview: false,
      requiresSocraticReview: false, requiresCurriculumReview: false,
      requiresPause: true, requiresRollback: false,
    });
    const result = await generateTeacherOversightSnapshot({
      runId, schoolId: 'school-1', teacherId: 'teacher-1',
    });
    expect(result.oversightStatus).toBe('needs_review');
    expect(result.interventionNeededCount).toBeGreaterThan(0);
  });

  it('should set watch status when blocked events exceed 5', async () => {
    for (let i = 0; i < 6; i++) {
      await task028ExpansionExecutionRepository.createOversightItem({
        executionRunId: runId, pilotProgramId: 'pp-1', schoolId: 'school-1',
        itemType: 'blocked_student_access', severity: 'medium', status: 'open',
        source: 'gate', safeSummary: `Block ${i}`,
        requiresTeacherReview: false, requiresAdminReview: false,
        requiresPrivacyReview: false, requiresDeenReview: false,
        requiresSocraticReview: false, requiresCurriculumReview: false,
        requiresPause: false, requiresRollback: false,
      });
    }
    const result = await generateTeacherOversightSnapshot({
      runId, schoolId: 'school-1', teacherId: 'teacher-1',
    });
    expect(result.oversightStatus).toBe('watch');
    expect(result.blockedEventCount).toBe(6);
  });

  it('should throw for invalid input', async () => {
    await expect(generateTeacherOversightSnapshot({
      runId: '', schoolId: '', teacherId: '',
    })).rejects.toThrow();
  });

  it('should throw for non-existent run', async () => {
    await expect(generateTeacherOversightSnapshot({
      runId: 'nonexistent', schoolId: 'school-1', teacherId: 'teacher-1',
    })).rejects.toThrow();
  });

  it('should include safeNextActions for healthy status', async () => {
    const result = await generateTeacherOversightSnapshot({
      runId, schoolId: 'school-1', teacherId: 'teacher-1',
    });
    expect(result.safeNextActions.length).toBeGreaterThan(0);
    expect(result.safeNextActions[0]).toContain('monitoring');
  });

  it('should include expansionRunStatus in snapshot', async () => {
    const result = await generateTeacherOversightSnapshot({
      runId, schoolId: 'school-1', teacherId: 'teacher-1',
    });
    expect(result.expansionRunStatus).toBe('stage_1_active');
    expect(result.generatedAt).toBeTruthy();
  });
});
