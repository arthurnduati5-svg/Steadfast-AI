import { describe, it, expect, beforeEach } from 'vitest';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { checkExpandedSessionGate } from '../services/task028ExpandedRuntimeGuardService';

describe('task028RoutesLearnerOutsideExpandedCohortDenied', () => {
  const SCHOOL_ID = 'cohort_denial_school';

  beforeEach(() => {
    task028ExpansionExecutionRepository._clearMemory();
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    task025PilotRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;
  });

  it('blocks participant not in expanded cohort', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_cohort',
      pilotProgramId: 'pilot_cohort',
      schoolId: SCHOOL_ID,
      status: 'stage_1_active',
      safeSummary: 'Cohort denial test run',
      stagePlan: {},
      approvedScopeSnapshot: {},
    });
    const RUN_ID = (run as any).id;

    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: RUN_ID,
      actorIdHash: 'unregistered_hash',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('participant_not_in_expanded_cohort');
  });

  it('blocks participant with non-active activation status', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_cohort2',
      pilotProgramId: 'pilot_cohort2',
      schoolId: SCHOOL_ID,
      status: 'stage_1_active',
      safeSummary: 'Cohort denial test run 2',
      stagePlan: {},
      approvedScopeSnapshot: {},
    });
    const RUN_ID = (run as any).id;

    const stage = await task028ExpansionExecutionRepository.createExecutionStage({
      executionRunId: RUN_ID,
      expansionProposalId: 'prop_cohort2',
      schoolId: SCHOOL_ID,
      stageNumber: 1,
      status: 'active',
      safeSummary: 'Test stage',
    });

    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId: RUN_ID,
      stageId: (stage as any).id,
      pilotProgramId: 'pilot_cohort2',
      schoolId: SCHOOL_ID,
      actorIdHash: 'blocked_hash',
      role: 'student',
      activationStatus: 'blocked',
    });

    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: RUN_ID,
      actorIdHash: 'blocked_hash',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('participant_activation_status_blocked');
  });

  it('blocks class out of expanded scope', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_cohort3',
      pilotProgramId: 'pilot_cohort3',
      schoolId: SCHOOL_ID,
      status: 'stage_1_active',
      safeSummary: 'Cohort scope test',
      stagePlan: {},
      approvedScopeSnapshot: { classIds: ['class-a'] },
    });
    const RUN_ID = (run as any).id;

    const stage = await task028ExpansionExecutionRepository.createExecutionStage({
      executionRunId: RUN_ID,
      expansionProposalId: 'prop_cohort3',
      schoolId: SCHOOL_ID,
      stageNumber: 1,
      status: 'active',
      allowedClassIds: ['class-a'],
      safeSummary: 'Test scope stage',
    });

    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId: RUN_ID,
      stageId: (stage as any).id,
      pilotProgramId: 'pilot_cohort3',
      schoolId: SCHOOL_ID,
      actorIdHash: 'hash_outside',
      role: 'student',
      classId: 'class-b',
      activationStatus: 'active',
    });

    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: RUN_ID,
      actorIdHash: 'hash_outside',
      role: 'student',
      classId: 'class-b',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('class_not_in_expanded_scope');
  });

  it('blocks subject out of expanded scope', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_cohort4',
      pilotProgramId: 'pilot_cohort4',
      schoolId: SCHOOL_ID,
      status: 'stage_1_active',
      safeSummary: 'Subject scope test',
      stagePlan: {},
      approvedScopeSnapshot: {},
    });
    const RUN_ID = (run as any).id;

    const stage = await task028ExpansionExecutionRepository.createExecutionStage({
      executionRunId: RUN_ID,
      expansionProposalId: 'prop_cohort4',
      schoolId: SCHOOL_ID,
      stageNumber: 1,
      status: 'active',
      allowedSubjectIds: ['math'],
      safeSummary: 'Subject scope stage',
    });

    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId: RUN_ID,
      stageId: (stage as any).id,
      pilotProgramId: 'pilot_cohort4',
      schoolId: SCHOOL_ID,
      actorIdHash: 'hash_subj_outside',
      role: 'student',
      subjectIds: ['science'],
      activationStatus: 'active',
    });

    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: RUN_ID,
      actorIdHash: 'hash_subj_outside',
      role: 'student',
      subjectId: 'science',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('subject_not_in_expanded_scope');
  });

  it('blocks role that is not allowed', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_cohort5',
      pilotProgramId: 'pilot_cohort5',
      schoolId: SCHOOL_ID,
      status: 'stage_1_active',
      safeSummary: 'Role restriction test',
      stagePlan: {},
      approvedScopeSnapshot: {},
    });
    const RUN_ID = (run as any).id;

    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId: RUN_ID,
      pilotProgramId: 'pilot_cohort5',
      schoolId: SCHOOL_ID,
      actorIdHash: 'hash_bad_role',
      role: 'parent',
      activationStatus: 'active',
    });

    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: RUN_ID,
      actorIdHash: 'hash_bad_role',
      role: 'parent',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('role_not_allowed');
  });
});
