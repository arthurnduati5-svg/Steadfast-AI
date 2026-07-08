import { describe, it, expect, beforeEach } from 'vitest';
import { activateExpandedCohort } from '../services/task028StagedCohortActivationService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';

describe('Task 028 Expanded Cohort Activation Service', () => {
  let executionRunId: string;
  let proposalId: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    task027PilotExpansionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;
    delete process.env.TASK027_REQUIRE_REAL_PRISMA;

    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', status: 'draft',
      proposalName: 'Test expansion', safeSummary: 'Expansion proposal',
      requestedStudentIncrease: 50, requestedTeacherIncrease: 5,
      requestedClassIds: ['class-1'], requestedSubjectIds: ['Math'],
      requestedCurriculumScopes: ['National'], requestedYearGroups: ['Year 10'],
      createdByRole: 'admin', createdByActorIdHash: 'admin-1',
    });
    proposalId = (proposal as any).id;

    const approval = await task027PilotExpansionRepository.createApproval({
      expansionProposalId: proposalId, schoolId: 'school-1',
      decision: 'expand', approvalStatus: 'approved',
      safeDecisionSummary: 'Approved', conditions: [],
      metadataSafeJson: { safeToExpand: true },
    });
    await task027PilotExpansionRepository.updateApproval((approval as any).id, { safeToExpand: true });

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: proposalId, pilotProgramId: 'pp-1',
      schoolId: 'school-1', status: 'ready', safeSummary: 'Ready for stage 1',
    });
    executionRunId = (run as any).id;
  });

  it('should activate stage 1 cohort', async () => {
    const result = await activateExpandedCohort({
      executionRunId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      stageNumber: 1, plannedStudentCount: 50, plannedTeacherCount: 5,
      allowedClassIds: ['class-1'], allowedSubjectIds: ['Math'],
      allowedCurriculumScopes: ['National'],
      expansionProposalId: proposalId, actorRole: 'admin', actorIdHash: 'admin-hash',
    });
    expect(result.ok).toBe(true);
    expect(result.stageId).toBeTruthy();
    expect(result.reasonCodes).toEqual([]);
    expect(result.safeMessage).toContain('activated');
  });

  it('should transition state to stage_1_active on activation', async () => {
    await activateExpandedCohort({
      executionRunId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      stageNumber: 1, plannedStudentCount: 50, plannedTeacherCount: 5,
      allowedClassIds: ['class-1'], allowedSubjectIds: ['Math'],
      allowedCurriculumScopes: ['National'],
      expansionProposalId: proposalId, actorRole: 'admin',
    });
    const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
    expect((run as any).status).toBe('stage_1_active');
  });

  it('should enforce student count limit', async () => {
    const result = await activateExpandedCohort({
      executionRunId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      stageNumber: 1, plannedStudentCount: 501, plannedTeacherCount: 5,
      allowedClassIds: ['class-1'], allowedSubjectIds: ['Math'],
      allowedCurriculumScopes: ['National'],
      expansionProposalId: proposalId, actorRole: 'admin',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('student_count_exceeds_limit');
  });

  it('should enforce teacher count limit', async () => {
    const result = await activateExpandedCohort({
      executionRunId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      stageNumber: 1, plannedStudentCount: 50, plannedTeacherCount: 51,
      allowedClassIds: ['class-1'], allowedSubjectIds: ['Math'],
      allowedCurriculumScopes: ['National'],
      expansionProposalId: proposalId, actorRole: 'admin',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('teacher_count_exceeds_limit');
  });

  it('should enforce class scope limit', async () => {
    const result = await activateExpandedCohort({
      executionRunId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      stageNumber: 1, plannedStudentCount: 50, plannedTeacherCount: 5,
      allowedClassIds: Array.from({ length: 21 }, (_, i) => `c-${i}`),
      allowedSubjectIds: ['Math'], allowedCurriculumScopes: ['National'],
      expansionProposalId: proposalId, actorRole: 'admin',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('class_scope_exceeds_limit');
  });

  it('should enforce subject scope limit', async () => {
    const result = await activateExpandedCohort({
      executionRunId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      stageNumber: 1, plannedStudentCount: 50, plannedTeacherCount: 5,
      allowedClassIds: ['class-1'],
      allowedSubjectIds: Array.from({ length: 31 }, (_, i) => `s-${i}`),
      allowedCurriculumScopes: ['National'],
      expansionProposalId: proposalId, actorRole: 'admin',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('subject_scope_exceeds_limit');
  });

  it('should enforce curriculum scope limit', async () => {
    const result = await activateExpandedCohort({
      executionRunId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      stageNumber: 1, plannedStudentCount: 50, plannedTeacherCount: 5,
      allowedClassIds: ['class-1'], allowedSubjectIds: ['Math'],
      allowedCurriculumScopes: Array.from({ length: 11 }, (_, i) => `scope-${i}`),
      expansionProposalId: proposalId, actorRole: 'admin',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('curriculum_scope_exceeds_limit');
  });
});
