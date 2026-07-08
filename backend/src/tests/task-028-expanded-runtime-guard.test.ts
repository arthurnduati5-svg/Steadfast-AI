import { describe, it, expect, beforeEach } from 'vitest';
import { checkExpandedSessionGate } from '../services/task028ExpandedRuntimeGuardService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

describe('Task 028 Expanded Runtime Guard', () => {
  let executionRunId: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'proposal-1',
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      status: 'stage_1_active',
      safeSummary: 'Active expansion',
    });
    executionRunId = (run as any).id;

    await task028ExpansionExecutionRepository.createExecutionStage({
      executionRunId,
      expansionProposalId: 'proposal-1',
      schoolId: 'school-1',
      stageNumber: 1,
      status: 'active',
      plannedStudentCount: 50,
      plannedTeacherCount: 5,
      allowedClassIds: ['class-1'],
      allowedSubjectIds: ['Math'],
      allowedCurriculumScopes: ['National'],
      safeSummary: 'Stage 1 active',
    });

    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      actorIdHash: 'student-hash-1',
      role: 'student',
      activationStatus: 'active',
      classId: 'class-1',
      subjectIds: ['Math'],
      curriculumScopes: ['National'],
    });
  });

  it('should allow in-scope participant', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: 'school-1',
      executionRunId,
      actorIdHash: 'student-hash-1',
      role: 'student',
      classId: 'class-1',
      subjectId: 'Math',
      curriculumScope: 'National',
    });
    expect(result.allowed).toBe(true);
    expect(result.reasonCodes).toHaveLength(0);
    expect(result.safeMessage).toContain('Access granted');
  });

  it('should block out-of-scope participant', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: 'school-1',
      executionRunId,
      actorIdHash: 'unknown-hash',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('participant_not_in_expanded_cohort');
  });

  it('should block without school identity', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: '',
      executionRunId,
      actorIdHash: 'student-hash-1',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('no_verified_school_identity');
  });

  it('should block when run is paused', async () => {
    await task028ExpansionExecutionRepository.updateExecutionRun(executionRunId, { status: 'paused' });
    const result = await checkExpandedSessionGate({
      schoolId: 'school-1',
      executionRunId,
      actorIdHash: 'student-hash-1',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('expansion_paused');
  });

  it('should block when run is rolled back', async () => {
    await task028ExpansionExecutionRepository.updateExecutionRun(executionRunId, { status: 'rolled_back' });
    const result = await checkExpandedSessionGate({
      schoolId: 'school-1',
      executionRunId,
      actorIdHash: 'student-hash-1',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('expansion_rolled_back');
  });

  it('should block when kill switch is enabled', async () => {
    await task028ExpansionExecutionRepository.createAuditRecord({
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      actorRole: 'admin',
      action: 'kill_switch_engaged',
      safeSummary: 'Kill switch engaged',
    });
    const result = await checkExpandedSessionGate({
      schoolId: 'school-1',
      executionRunId,
      actorIdHash: 'student-hash-1',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('kill_switch_enabled');
  });
});
