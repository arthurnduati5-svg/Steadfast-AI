import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateEvidencePack } from '../services/task027ExpansionEvidencePackService';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

const SCHOOL_ID = 'test-school-evidence';
const PILOT_RUN_ID = 'test-pilot-evidence';

describe('task027ExpansionEvidencePackService', () => {
  beforeEach(() => {
    govRepo.clearTask027StoresForTests();
  });

  afterEach(() => {
    govRepo.clearTask027StoresForTests();
  });

  it('generates evidence pack with all required sections', async () => {
    const proposal = await govRepo.createExpansionProposal({
      schoolId: SCHOOL_ID,
      pilotRunId: PILOT_RUN_ID,
      proposedCohortSize: 30,
      proposedScopeLabels: ['class_a'],
      proposedClassOrGradeIds: ['grade-5'],
      teacherOwnerSafeRefs: ['teacher-1'],
      supportOwnerSafeRefs: ['support-1'],
      curriculumSourceScopeIds: ['curr-1'],
      startReadinessWindow: '2026-09-01',
      rollbackReadinessPath: '/rollback/path',
    });

    await govRepo.recordRiskAssessment(SCHOOL_ID, proposal.id, {
      overallRiskLevel: 'low',
      blockingIssues: [],
      privacyRisk: 'low',
      safeguardingRisk: 'low',
      deenContentRisk: 'low',
      operationsCapacityRisk: 'low',
    });

    await govRepo.recordEvidenceSummary(SCHOOL_ID, PILOT_RUN_ID, {
      sessionsStartedCount: 100,
      sessionsBlockedCount: 2,
      supportNeededCount: 5,
      incidentCount: 0,
      safeguardingSignalCount: 0,
      pauseCount: 0,
      rollbackCount: 0,
    });

    const reviewTypes = [
      'learning_quality', 'cohort_eligibility', 'teacher_review',
      'admin_approval', 'parent_learner_feedback', 'safeguarding',
      'deen_content', 'privacy', 'socratic_integrity',
      'academic_integrity', 'operations_health_budget', 'pause_rollback_readiness',
    ];
    for (const rt of reviewTypes) {
      await govRepo.recordReviewResult(SCHOOL_ID, proposal.id, rt, {
        reviewStatus: 'passed',
        blockingIssues: [],
      });
    }

    const result = await generateEvidencePack({
      schoolId: SCHOOL_ID,
      proposalId: proposal.id,
      pilotRunId: PILOT_RUN_ID,
    });

    expect(result.ok).toBe(true);
    expect(result.evidencePack).not.toBeNull();
    expect(result.blockingIssues).toEqual([]);
    expect(result.safeMessage).toContain('successfully');

    const ep = result.evidencePack!;
    expect(ep.schoolId).toBe(SCHOOL_ID);
    expect(ep.proposalId).toBe(proposal.id);
    expect(ep.pilotRunId).toBe(PILOT_RUN_ID);
    expect(ep.learningQualityReview).toBeDefined();
    expect(ep.cohortEligibilityResult).toBeDefined();
    expect(ep.riskAssessmentResult).toBeDefined();
    expect(ep.teacherReviewResult).toBeDefined();
    expect(ep.adminApprovalResult).toBeDefined();
    expect(ep.parentLearnerFeedbackResult).toBeDefined();
    expect(ep.safeguardingReviewResult).toBeDefined();
    expect(ep.deenContentReviewResult).toBeDefined();
    expect(ep.privacyReviewResult).toBeDefined();
    expect(ep.socraticIntegrityReviewResult).toBeDefined();
    expect(ep.academicIntegrityReviewResult).toBeDefined();
    expect(ep.operationsHealthBudgetReview).toBeDefined();
    expect(ep.pauseRollbackReadinessReview).toBeDefined();
    expect(ep.safePilotExecutionSummary).toBeDefined();
    expect(ep.createdAt).toBeInstanceOf(Date);
  });

  it('evidence pack contains safe metadata only', async () => {
    const proposal = await govRepo.createExpansionProposal({
      schoolId: SCHOOL_ID,
      pilotRunId: PILOT_RUN_ID,
      proposedCohortSize: 25,
      proposedScopeLabels: ['class_b'],
      proposedClassOrGradeIds: ['grade-4'],
      teacherOwnerSafeRefs: ['teacher-2'],
      supportOwnerSafeRefs: ['support-2'],
      curriculumSourceScopeIds: ['curr-2'],
      startReadinessWindow: '2026-10-01',
      rollbackReadinessPath: '/rollback/path2',
    });

    await govRepo.recordRiskAssessment(SCHOOL_ID, proposal.id, {
      overallRiskLevel: 'low',
      blockingIssues: [],
    });

    await govRepo.recordEvidenceSummary(SCHOOL_ID, PILOT_RUN_ID, {
      sessionsStartedCount: 50,
      sessionsBlockedCount: 0,
      supportNeededCount: 1,
      incidentCount: 0,
      safeguardingSignalCount: 0,
      pauseCount: 0,
      rollbackCount: 0,
    });

    const reviewTypes = [
      'learning_quality', 'cohort_eligibility', 'teacher_review',
      'admin_approval', 'parent_learner_feedback', 'safeguarding',
      'deen_content', 'privacy', 'socratic_integrity',
      'academic_integrity', 'operations_health_budget', 'pause_rollback_readiness',
    ];
    for (const rt of reviewTypes) {
      await govRepo.recordReviewResult(SCHOOL_ID, proposal.id, rt, {
        reviewStatus: 'passed',
        blockingIssues: [],
      });
    }

    const result = await generateEvidencePack({
      schoolId: SCHOOL_ID,
      proposalId: proposal.id,
      pilotRunId: PILOT_RUN_ID,
    });

    const summary = result.evidencePack!.safePilotExecutionSummary;
    expect(summary.rawDataExcluded).toBe(true);
    expect(summary.pilotRunId).toBe(PILOT_RUN_ID);
    expect(summary.schoolId).toBe(SCHOOL_ID);
    expect(summary).not.toHaveProperty('rawStudentData');
    expect(summary).not.toHaveProperty('rawPII');
    expect(summary).not.toHaveProperty('rawSessionTranscript');
  });

  it('evidence pack has safeBlockers and safeNextActions', async () => {
    const proposal = await govRepo.createExpansionProposal({
      schoolId: SCHOOL_ID,
      pilotRunId: PILOT_RUN_ID,
      proposedCohortSize: 20,
      proposedScopeLabels: ['class_c'],
      proposedClassOrGradeIds: ['grade-6'],
      teacherOwnerSafeRefs: ['teacher-3'],
      supportOwnerSafeRefs: ['support-3'],
      curriculumSourceScopeIds: ['curr-3'],
      startReadinessWindow: '2026-11-01',
      rollbackReadinessPath: '/rollback/path3',
    });

    await govRepo.recordRiskAssessment(SCHOOL_ID, proposal.id, {
      overallRiskLevel: 'medium',
      blockingIssues: ['Insufficient support capacity'],
    });

    await govRepo.recordEvidenceSummary(SCHOOL_ID, PILOT_RUN_ID, {
      sessionsStartedCount: 10,
      sessionsBlockedCount: 0,
      supportNeededCount: 0,
      incidentCount: 0,
      safeguardingSignalCount: 0,
      pauseCount: 0,
      rollbackCount: 0,
    });

    await govRepo.recordReviewResult(SCHOOL_ID, proposal.id, 'learning_quality', {
      reviewStatus: 'passed',
      blockingIssues: [],
    });

    const result = await generateEvidencePack({
      schoolId: SCHOOL_ID,
      proposalId: proposal.id,
      pilotRunId: PILOT_RUN_ID,
    });

    expect(Array.isArray(result.evidencePack!.safeBlockers)).toBe(true);
    expect(result.evidencePack!.safeBlockers.length).toBeGreaterThan(0);
    expect(Array.isArray(result.evidencePack!.safeNextActions)).toBe(true);
    expect(result.evidencePack!.safeNextActions.length).toBeGreaterThan(0);
    expect(result.evidencePack!.safeNextActions).toContain('Resolve all blocking issues before governance review.');
  });

  it('missing required data results in blocking issues', async () => {
    const proposal = await govRepo.createExpansionProposal({
      schoolId: SCHOOL_ID,
      pilotRunId: PILOT_RUN_ID,
      proposedCohortSize: 15,
      proposedScopeLabels: ['class_d'],
      proposedClassOrGradeIds: ['grade-3'],
      teacherOwnerSafeRefs: ['teacher-4'],
      supportOwnerSafeRefs: ['support-4'],
      curriculumSourceScopeIds: ['curr-4'],
      startReadinessWindow: '2026-12-01',
      rollbackReadinessPath: '/rollback/path4',
    });

    const result = await generateEvidencePack({
      schoolId: SCHOOL_ID,
      proposalId: proposal.id,
      pilotRunId: PILOT_RUN_ID,
    });

    expect(result.ok).toBe(false);
    expect(result.evidencePack).not.toBeNull();
    expect(result.blockingIssues.length).toBeGreaterThan(0);
    expect(result.blockingIssues).toContain('Risk assessment missing. Complete risk assessment before generating evidence pack.');
    expect(result.blockingIssues).toContain('Learning quality review not completed.');
    expect(result.blockingIssues).toContain('Teacher review not completed.');
    expect(result.blockingIssues).toContain('Admin approval not completed.');
    expect(result.blockingIssues).toContain('Safeguarding review not completed.');
    expect(result.blockingIssues).toContain('Privacy review not completed.');
    expect(result.safeMessage).toContain('blocking');
  });

  it('no raw data in evidence pack', async () => {
    const proposal = await govRepo.createExpansionProposal({
      schoolId: SCHOOL_ID,
      pilotRunId: PILOT_RUN_ID,
      proposedCohortSize: 35,
      proposedScopeLabels: ['class_e'],
      proposedClassOrGradeIds: ['grade-7'],
      teacherOwnerSafeRefs: ['teacher-5'],
      supportOwnerSafeRefs: ['support-5'],
      curriculumSourceScopeIds: ['curr-5'],
      startReadinessWindow: '2027-01-01',
      rollbackReadinessPath: '/rollback/path5',
    });

    await govRepo.recordRiskAssessment(SCHOOL_ID, proposal.id, {
      overallRiskLevel: 'low',
      blockingIssues: [],
    });

    await govRepo.recordEvidenceSummary(SCHOOL_ID, PILOT_RUN_ID, {
      sessionsStartedCount: 200,
      sessionsBlockedCount: 1,
      supportNeededCount: 3,
      incidentCount: 0,
      safeguardingSignalCount: 0,
      pauseCount: 0,
      rollbackCount: 0,
    });

    const reviewTypes = [
      'learning_quality', 'cohort_eligibility', 'teacher_review',
      'admin_approval', 'parent_learner_feedback', 'safeguarding',
      'deen_content', 'privacy', 'socratic_integrity',
      'academic_integrity', 'operations_health_budget', 'pause_rollback_readiness',
    ];
    for (const rt of reviewTypes) {
      await govRepo.recordReviewResult(SCHOOL_ID, proposal.id, rt, {
        reviewStatus: 'passed',
        blockingIssues: [],
      });
    }

    const result = await generateEvidencePack({
      schoolId: SCHOOL_ID,
      proposalId: proposal.id,
      pilotRunId: PILOT_RUN_ID,
    });

    const serialized = JSON.stringify(result.evidencePack!);
    expect(serialized).not.toContain('rawStudentData');
    expect(serialized).not.toContain('rawPII');
    expect(serialized).not.toContain('rawSessionTranscript');
    expect(serialized).not.toContain('rawSafeguardingNotes');
  });
});
