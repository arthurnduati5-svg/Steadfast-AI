import { describe, it, expect, beforeEach } from 'vitest';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { checkExpandedSessionGate } from '../services/task028ExpandedRuntimeGuardService';

describe('Task 028 No School Auth Bypass', () => {
  const SCHOOL_ID = 'school_auth_valid';
  const ACTOR_HASH = 'actor_hash_school_test';

  let RUN_ID: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    task025PilotRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_school_auth',
      pilotProgramId: 'pilot_school_auth',
      schoolId: SCHOOL_ID,
      status: 'stage_1_active',
      safeSummary: 'School auth test run',
      stagePlan: { stages: [{ stageNumber: 1 }] },
      approvedScopeSnapshot: { classIds: ['class_a'], subjectIds: ['math'] },
    });
    RUN_ID = (run as any).id;

    const stage = await task028ExpansionExecutionRepository.createExecutionStage({
      executionRunId: RUN_ID,
      expansionProposalId: 'prop_school_auth',
      schoolId: SCHOOL_ID,
      stageNumber: 1,
      status: 'active',
      plannedStudentCount: 5,
      plannedTeacherCount: 1,
      allowedClassIds: ['class_a'],
      allowedSubjectIds: ['math'],
      allowedCurriculumScopes: ['scope_a'],
      safeSummary: 'School auth test stage',
    });

    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId: RUN_ID,
      stageId: (stage as any).id,
      pilotProgramId: 'pilot_school_auth',
      schoolId: SCHOOL_ID,
      actorIdHash: ACTOR_HASH,
      role: 'student',
      classId: 'class_a',
      subjectIds: ['math'],
      curriculumScopes: ['scope_a'],
      activationStatus: 'active',
    });
  });

  it('should block when schoolId is empty string', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: '',
      executionRunId: RUN_ID,
      actorIdHash: ACTOR_HASH,
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('no_verified_school_identity');
  });

  it('should block when schoolId is unknown', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: 'unknown',
      executionRunId: RUN_ID,
      actorIdHash: ACTOR_HASH,
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('no_verified_school_identity');
  });

  it('should block when schoolId is undefined-equivalent (empty)', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: '',
      executionRunId: RUN_ID,
      actorIdHash: ACTOR_HASH,
      role: 'student',
    });
    expect(result.allowed).toBe(false);
  });

  it('should pass when schoolId is valid', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: RUN_ID,
      actorIdHash: ACTOR_HASH,
      role: 'student',
      classId: 'class_a',
      subjectId: 'math',
      curriculumScope: 'scope_a',
    });
    expect(result.allowed).toBe(true);
    expect(result.reasonCodes).toHaveLength(0);
  });

  it('should include schoolVerified false in gate snapshot when schoolId is empty', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: '',
      executionRunId: RUN_ID,
      actorIdHash: ACTOR_HASH,
      role: 'student',
    });
    expect(result.gateSnapshot.schoolVerified).toBe(false);
  });

  it('should include schoolVerified true in gate snapshot when schoolId is valid', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: RUN_ID,
      actorIdHash: ACTOR_HASH,
      role: 'student',
      classId: 'class_a',
      subjectId: 'math',
      curriculumScope: 'scope_a',
    });
    expect(result.gateSnapshot.schoolVerified).toBe(true);
  });
});
