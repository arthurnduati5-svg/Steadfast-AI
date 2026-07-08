import { describe, it, expect, beforeEach } from 'vitest';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { checkExpandedSessionGate } from '../services/task028ExpandedRuntimeGuardService';
import { pauseExpansion, enableKillSwitch, requestIntervention } from '../services/task028ExpansionInterventionService';
import { isStudentOversightAccess } from '../services/task028ExpansionOversightQueueService';

describe('Task 028 Learner Denied Expansion Control Routes', () => {
  const SCHOOL_ID = 'learner_denied_school';
  const STUDENT_HASH = 'student_hash_learner_denied';
  const IN_SCOPE_CLASS = 'class_learner_a';
  const IN_SCOPE_SUBJECT = 'subject_learner_math';
  const IN_SCOPE_CURRICULUM = 'scope_learner_approved';

  let RUN_ID: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    task025PilotRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_learner_denied',
      pilotProgramId: 'pilot_learner_denied',
      schoolId: SCHOOL_ID,
      status: 'stage_1_active',
      safeSummary: 'Learner denied test run',
      stagePlan: { stages: [{ stageNumber: 1 }] },
      approvedScopeSnapshot: { classIds: [IN_SCOPE_CLASS], subjectIds: [IN_SCOPE_SUBJECT] },
    });
    RUN_ID = (run as any).id;

    const stage = await task028ExpansionExecutionRepository.createExecutionStage({
      executionRunId: RUN_ID,
      expansionProposalId: 'prop_learner_denied',
      schoolId: SCHOOL_ID,
      stageNumber: 1,
      status: 'active',
      plannedStudentCount: 5,
      plannedTeacherCount: 1,
      allowedClassIds: [IN_SCOPE_CLASS],
      allowedSubjectIds: [IN_SCOPE_SUBJECT],
      allowedCurriculumScopes: [IN_SCOPE_CURRICULUM],
      safeSummary: 'Learner denied test stage',
    });

    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId: RUN_ID,
      stageId: (stage as any).id,
      pilotProgramId: 'pilot_learner_denied',
      schoolId: SCHOOL_ID,
      actorIdHash: STUDENT_HASH,
      role: 'student',
      classId: IN_SCOPE_CLASS,
      subjectIds: [IN_SCOPE_SUBJECT],
      curriculumScopes: [IN_SCOPE_CURRICULUM],
      activationStatus: 'active',
    });
  });

  it('should block student from pausing expansion', async () => {
    const result = await pauseExpansion(RUN_ID, 'student', STUDENT_HASH);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('admin_or_operator_only');
  });

  it('should block student from enabling kill switch', async () => {
    const result = await enableKillSwitch(RUN_ID, 'student', STUDENT_HASH);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('admin_or_operator_only');
  });

  it('should allow student to request intervention (requestIntervention does not check role)', async () => {
    const result = await requestIntervention(
      RUN_ID, 'pause_execution', 'student', STUDENT_HASH,
    );
    expect(result.ok).toBe(true);
    expect(result.interventionId).toBeTruthy();
  });

  it('should identify student role as student oversight access', () => {
    expect(isStudentOversightAccess('student')).toBe(true);
    expect(isStudentOversightAccess('teacher')).toBe(false);
    expect(isStudentOversightAccess('admin')).toBe(false);
  });

  it('should allow student through expanded session gate when scoped correctly', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: RUN_ID,
      actorIdHash: STUDENT_HASH,
      role: 'student',
      classId: IN_SCOPE_CLASS,
      subjectId: IN_SCOPE_SUBJECT,
      curriculumScope: IN_SCOPE_CURRICULUM,
    });
    expect(result.allowed).toBe(true);
  });

  it('should deny student through expanded session gate when out of scope', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: RUN_ID,
      actorIdHash: STUDENT_HASH,
      role: 'student',
      classId: 'class_out_of_scope',
      subjectId: IN_SCOPE_SUBJECT,
      curriculumScope: IN_SCOPE_CURRICULUM,
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('class_not_in_expanded_scope');
  });
});
