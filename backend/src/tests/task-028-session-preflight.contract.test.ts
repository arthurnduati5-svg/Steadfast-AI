import { describe, it, expect, beforeEach } from 'vitest';
import { checkExpandedSessionGate } from '../services/task028ExpandedRuntimeGuardService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

describe('Task 028 Session Preflight Contract', () => {
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
      safeSummary: 'Active expansion run',
    });
    executionRunId = (run as any).id;

    await task028ExpansionExecutionRepository.createExecutionStage({
      executionRunId,
      expansionProposalId: 'proposal-1',
      schoolId: 'school-1',
      stageNumber: 1,
      status: 'active',
      plannedStudentCount: 30,
      allowedClassIds: ['class-a'],
      allowedSubjectIds: ['Math'],
      allowedCurriculumScopes: ['National'],
      safeSummary: 'Stage 1 active',
    });

    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      actorIdHash: 'student-allowed',
      role: 'student',
      activationStatus: 'active',
      classId: 'class-a',
      subjectIds: ['Math'],
      curriculumScopes: ['National'],
    });
  });

  it('should pass preflight for an allowed participant with correct scope', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: 'school-1',
      executionRunId,
      actorIdHash: 'student-allowed',
      role: 'student',
      classId: 'class-a',
      subjectId: 'Math',
      curriculumScope: 'National',
    });
    expect(result.allowed).toBe(true);
    expect(result.gateSnapshot.schoolVerified).toBe(true);
    expect(result.gateSnapshot.participantFound).toBe(true);
    expect(result.gateSnapshot.stageActive).toBe(true);
    expect(result.gateSnapshot.expansionStatus).toBe('stage_1_active');
  });

  it('should deny preflight for a participant with wrong class scope', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: 'school-1',
      executionRunId,
      actorIdHash: 'student-allowed',
      role: 'student',
      classId: 'class-b',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('class_not_in_expanded_scope');
  });

  it('should deny preflight for a participant with wrong role', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: 'school-1',
      executionRunId,
      actorIdHash: 'student-allowed',
      role: 'anonymous',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('role_not_allowed');
  });

  it('should deny preflight when no school context is provided', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: 'unknown',
      executionRunId,
      actorIdHash: 'student-allowed',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('no_verified_school_identity');
  });

  it('should deny preflight for non-expanded user who is not in the cohort', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: 'school-1',
      executionRunId,
      actorIdHash: 'non-expanded-user',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('participant_not_in_expanded_cohort');
  });
});
