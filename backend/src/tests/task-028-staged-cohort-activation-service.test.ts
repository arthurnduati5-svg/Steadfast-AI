import { describe, it, expect, beforeEach } from 'vitest';
import { activateExpandedCohort } from '../services/task028StagedCohortActivationService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';

describe('Task 028 Staged Cohort Activation Service', () => {
  let executionRunId: string;
  let proposalId: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    task027PilotExpansionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;
    delete process.env.TASK027_REQUIRE_REAL_PRISMA;

    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      status: 'draft',
      proposalName: 'Test expansion',
      safeSummary: 'Expansion proposal',
      requestedStudentIncrease: 50,
      requestedTeacherIncrease: 5,
      requestedClassIds: ['class-1'],
      requestedSubjectIds: ['Math'],
      requestedCurriculumScopes: ['National'],
      requestedYearGroups: ['Year 10'],
      createdByRole: 'admin',
      createdByActorIdHash: 'admin-1',
    });
    proposalId = (proposal as any).id;

    const approval = await task027PilotExpansionRepository.createApproval({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      decision: 'expand',
      approvalStatus: 'approved',
      safeDecisionSummary: 'Approved',
      conditions: [],
      metadataSafeJson: { safeToExpand: true },
    });
    await task027PilotExpansionRepository.updateApproval((approval as any).id, { safeToExpand: true });

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: proposalId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      status: 'ready',
      safeSummary: 'Ready for stage 1',
    });
    executionRunId = (run as any).id;
  });

  it('should activate stage 1 cohort successfully', async () => {
    const result = await activateExpandedCohort({
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      stageNumber: 1,
      plannedStudentCount: 50,
      plannedTeacherCount: 5,
      allowedClassIds: ['class-1'],
      allowedSubjectIds: ['Math'],
      allowedCurriculumScopes: ['National'],
      expansionProposalId: proposalId,
      actorRole: 'admin',
      actorIdHash: 'admin-hash',
    });
    expect(result.ok).toBe(true);
    expect(result.stageId).toBeTruthy();
    expect(result.reasonCodes).toEqual([]);
    expect(result.safeMessage).toContain('activated');
  });

  it('should fail when Task 027 proof is invalid', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const reportPath = path.resolve(process.cwd(), 'backend/docs/ops/task-027/task-027-pilot-expansion-report.json');
    const backup = reportPath + '.bak';
    if (fs.existsSync(reportPath)) {
      fs.renameSync(reportPath, backup);
    }
    try {
      const result = await activateExpandedCohort({
        executionRunId,
        pilotProgramId: 'pp-1',
        schoolId: 'school-1',
        stageNumber: 1,
        plannedStudentCount: 50,
        plannedTeacherCount: 5,
        allowedClassIds: ['class-1'],
        allowedSubjectIds: ['Math'],
        allowedCurriculumScopes: ['National'],
        expansionProposalId: proposalId,
        actorRole: 'admin',
      });
      expect(result.ok).toBe(false);
      expect(result.reasonCodes).toContain('task027_proof_not_accepted');
    } finally {
      if (fs.existsSync(backup)) {
        fs.renameSync(backup, reportPath);
      }
    }
  });

  it('should enforce student count scope limit', async () => {
    const result = await activateExpandedCohort({
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      stageNumber: 1,
      plannedStudentCount: 501,
      plannedTeacherCount: 5,
      allowedClassIds: ['class-1'],
      allowedSubjectIds: ['Math'],
      allowedCurriculumScopes: ['National'],
      expansionProposalId: proposalId,
      actorRole: 'admin',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('student_count_exceeds_limit');
  });

  it('should enforce teacher count scope limit', async () => {
    const result = await activateExpandedCohort({
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      stageNumber: 1,
      plannedStudentCount: 50,
      plannedTeacherCount: 51,
      allowedClassIds: ['class-1'],
      allowedSubjectIds: ['Math'],
      allowedCurriculumScopes: ['National'],
      expansionProposalId: proposalId,
      actorRole: 'admin',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('teacher_count_exceeds_limit');
  });

  it('should enforce class scope limit', async () => {
    const manyClasses = Array.from({ length: 21 }, (_, i) => `class-${i + 1}`);
    const result = await activateExpandedCohort({
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      stageNumber: 1,
      plannedStudentCount: 50,
      plannedTeacherCount: 5,
      allowedClassIds: manyClasses,
      allowedSubjectIds: ['Math'],
      allowedCurriculumScopes: ['National'],
      expansionProposalId: proposalId,
      actorRole: 'admin',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('class_scope_exceeds_limit');
  });

  it('should enforce subject scope limit', async () => {
    const manySubjects = Array.from({ length: 31 }, (_, i) => `subject-${i + 1}`);
    const result = await activateExpandedCohort({
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      stageNumber: 1,
      plannedStudentCount: 50,
      plannedTeacherCount: 5,
      allowedClassIds: ['class-1'],
      allowedSubjectIds: manySubjects,
      allowedCurriculumScopes: ['National'],
      expansionProposalId: proposalId,
      actorRole: 'admin',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('subject_scope_exceeds_limit');
  });

  it('should enforce curriculum scope limit', async () => {
    const manyScopes = Array.from({ length: 11 }, (_, i) => `scope-${i + 1}`);
    const result = await activateExpandedCohort({
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      stageNumber: 1,
      plannedStudentCount: 50,
      plannedTeacherCount: 5,
      allowedClassIds: ['class-1'],
      allowedSubjectIds: ['Math'],
      allowedCurriculumScopes: manyScopes,
      expansionProposalId: proposalId,
      actorRole: 'admin',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('curriculum_scope_exceeds_limit');
  });
});
