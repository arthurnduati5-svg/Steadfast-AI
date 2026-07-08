import { describe, it, expect, beforeEach } from 'vitest';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { checkExpandedSessionGate } from '../services/task028ExpandedRuntimeGuardService';
import { pauseExpansion, enableKillSwitch, requestIntervention } from '../services/task028ExpansionInterventionService';

describe('Task 028 Admin Route Protection', () => {
  const SCHOOL_ID = 'admin_route_school';
  const ADMIN_HASH = 'admin_hash_route_test';
  const TEACHER_HASH = 'teacher_hash_route_test';

  let RUN_ID: string;
  let STAGE_ID: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    task025PilotRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_admin_route',
      pilotProgramId: 'pilot_admin_route',
      schoolId: SCHOOL_ID,
      status: 'stage_1_active',
      safeSummary: 'Admin route test run',
      stagePlan: { stages: [{ stageNumber: 1 }] },
      approvedScopeSnapshot: { classIds: ['class_a'], subjectIds: ['math'] },
    });
    RUN_ID = (run as any).id;

    const stage = await task028ExpansionExecutionRepository.createExecutionStage({
      executionRunId: RUN_ID,
      expansionProposalId: 'prop_admin_route',
      schoolId: SCHOOL_ID,
      stageNumber: 1,
      status: 'active',
      plannedStudentCount: 5,
      plannedTeacherCount: 1,
      allowedClassIds: ['class_a'],
      allowedSubjectIds: ['math'],
      allowedCurriculumScopes: ['scope_a'],
      safeSummary: 'Admin route test stage',
    });
    STAGE_ID = (stage as any).id;

    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId: RUN_ID,
      stageId: STAGE_ID,
      pilotProgramId: 'pilot_admin_route',
      schoolId: SCHOOL_ID,
      actorIdHash: ADMIN_HASH,
      role: 'admin',
      classId: 'class_a',
      subjectIds: ['math'],
      curriculumScopes: ['scope_a'],
      activationStatus: 'active',
    });

    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId: RUN_ID,
      stageId: STAGE_ID,
      pilotProgramId: 'pilot_admin_route',
      schoolId: SCHOOL_ID,
      actorIdHash: TEACHER_HASH,
      role: 'teacher',
      classId: 'class_a',
      subjectIds: ['math'],
      curriculumScopes: ['scope_a'],
      activationStatus: 'active',
    });
  });

  it('should allow admin to pass expanded session gate', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: RUN_ID,
      actorIdHash: ADMIN_HASH,
      role: 'admin',
      classId: 'class_a',
      subjectId: 'math',
      curriculumScope: 'scope_a',
    });
    expect(result.allowed).toBe(true);
    expect(result.reasonCodes).toHaveLength(0);
  });

  it('should allow admin to pause expansion', async () => {
    const result = await pauseExpansion(RUN_ID, 'admin', ADMIN_HASH);
    expect(result.ok).toBe(true);
    expect(result.studentAccessBlocked).toBe(true);
    expect(result.reasonCodes).toHaveLength(0);
  });

  it('should allow admin to enable kill switch', async () => {
    const result = await enableKillSwitch(RUN_ID, 'admin', ADMIN_HASH);
    expect(result.ok).toBe(true);
    expect(result.studentAccessBlocked).toBe(true);
  });

  it('should allow admin to request intervention', async () => {
    const result = await requestIntervention(
      RUN_ID, 'pause_execution', 'admin', ADMIN_HASH,
    );
    expect(result.ok).toBe(true);
    expect(result.interventionId).toBeTruthy();
  });

  it('should reject teacher if role is not admin or operator', async () => {
    const result = await pauseExpansion(RUN_ID, 'teacher', TEACHER_HASH);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('admin_or_operator_only');
  });
});
