import { describe, it, expect, beforeEach } from 'vitest';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { checkExpandedSessionGate } from '../services/task028ExpandedRuntimeGuardService';

describe('Task 028 No Curriculum Gate Bypass', () => {
  const SCHOOL_ID = 'curriculum_gate_school';
  const ACTOR_HASH = 'actor_hash_curriculum_test';
  const ALLOWED_SCOPE = 'scope_approved_curriculum';
  const BLOCKED_SCOPE = 'scope_unauthorized_curriculum';

  let RUN_ID: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    task025PilotRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_curriculum_gate',
      pilotProgramId: 'pilot_curriculum_gate',
      schoolId: SCHOOL_ID,
      status: 'stage_1_active',
      safeSummary: 'Curriculum gate test run',
      stagePlan: { stages: [{ stageNumber: 1 }] },
      approvedScopeSnapshot: { classIds: ['class_a'], subjectIds: ['math'], curriculumScopes: [ALLOWED_SCOPE] },
    });
    RUN_ID = (run as any).id;

    const stage = await task028ExpansionExecutionRepository.createExecutionStage({
      executionRunId: RUN_ID,
      expansionProposalId: 'prop_curriculum_gate',
      schoolId: SCHOOL_ID,
      stageNumber: 1,
      status: 'active',
      plannedStudentCount: 5,
      plannedTeacherCount: 1,
      allowedClassIds: ['class_a'],
      allowedSubjectIds: ['math'],
      allowedCurriculumScopes: [ALLOWED_SCOPE],
      safeSummary: 'Curriculum gate test stage',
    });

    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId: RUN_ID,
      stageId: (stage as any).id,
      pilotProgramId: 'pilot_curriculum_gate',
      schoolId: SCHOOL_ID,
      actorIdHash: ACTOR_HASH,
      role: 'student',
      classId: 'class_a',
      subjectIds: ['math'],
      curriculumScopes: [ALLOWED_SCOPE],
      activationStatus: 'active',
    });
  });

  it('should block when curriculum scope does not match allowed scopes', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: RUN_ID,
      actorIdHash: ACTOR_HASH,
      role: 'student',
      classId: 'class_a',
      subjectId: 'math',
      curriculumScope: BLOCKED_SCOPE,
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('curriculum_scope_not_in_expanded_scope');
  });

  it('should pass when curriculum scope matches allowed scopes', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: RUN_ID,
      actorIdHash: ACTOR_HASH,
      role: 'student',
      classId: 'class_a',
      subjectId: 'math',
      curriculumScope: ALLOWED_SCOPE,
    });
    expect(result.allowed).toBe(true);
  });

  it('should include curriculum_scope_not_in_expanded_scope reason code in gate snapshot', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: RUN_ID,
      actorIdHash: ACTOR_HASH,
      role: 'student',
      classId: 'class_a',
      subjectId: 'math',
      curriculumScope: BLOCKED_SCOPE,
    });
    expect(result.reasonCodes).toContain('curriculum_scope_not_in_expanded_scope');
    expect(result.gateSnapshot).toHaveProperty('stageActive');
  });
});
