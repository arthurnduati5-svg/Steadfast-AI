import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { makeGovernanceDecision, getGovernanceDecision } from '../services/task027GovernanceDecisionService';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

const SCHOOL_ID = 'test-school-decision';
const PILOT_RUN_ID = 'test-pilot-decision';

describe('task027GovernanceDecisionService', () => {
  beforeEach(() => {
    govRepo.clearTask027StoresForTests();
  });

  afterEach(() => {
    govRepo.clearTask027StoresForTests();
  });

  async function setupProposal() {
    return govRepo.createExpansionProposal({
      schoolId: SCHOOL_ID,
      pilotRunId: PILOT_RUN_ID,
      proposedCohortSize: 30,
      proposedScopeLabels: ['class_1'],
      proposedClassOrGradeIds: ['grade-5'],
      teacherOwnerSafeRefs: ['teacher-1'],
      supportOwnerSafeRefs: ['support-1'],
      curriculumSourceScopeIds: ['curr-1'],
      startReadinessWindow: '2026-09-01',
      rollbackReadinessPath: '/rollback/path',
    });
  }

  async function setupAllReviewsPassed(proposalId: string) {
    const types = [
      'learning_quality', 'cohort_eligibility', 'teacher_review',
      'admin_approval', 'parent_learner_feedback', 'safeguarding',
      'deen_content', 'privacy', 'socratic_integrity',
      'academic_integrity', 'operations_health_budget', 'pause_rollback_readiness',
    ];
    for (const rt of types) {
      await govRepo.recordReviewResult(SCHOOL_ID, proposalId, rt, {
        reviewStatus: 'passed',
        blockingIssues: [],
      });
    }
  }

  it('decision is approved_for_task028 when all gates pass', async () => {
    const proposal = await setupProposal();

    await govRepo.recordEvidencePack(SCHOOL_ID, proposal.id, {} as any);

    await govRepo.recordRiskAssessment(SCHOOL_ID, proposal.id, {
      overallRiskLevel: 'low',
      privacyRisk: 'low',
      safeguardingRisk: 'low',
      deenContentRisk: 'low',
      operationsCapacityRisk: 'low',
      blockingIssues: [],
    });

    await setupAllReviewsPassed(proposal.id);

    const decision = await makeGovernanceDecision({
      schoolId: SCHOOL_ID,
      proposalId: proposal.id,
      pilotRunId: PILOT_RUN_ID,
    });

    expect(decision.decision).toBe('approved_for_task028');
    expect(decision.safeToStartTask028).toBe(true);
    expect(decision.blockingIssues).toEqual([]);
    expect(decision.conditions.length).toBeGreaterThan(0);
    expect(decision.conditions).toContain('All governance gates verified passed.');
    expect(decision.conditions).toContain('Evidence pack confirmed complete.');
    expect(decision.conditions).toContain('Risk assessment within acceptable threshold.');
    expect(decision.decisionSummary).toContain('approved_for_task028');
  });

  it('safeToStartTask028 is true only when decision is approved_for_task028', async () => {
    const proposal = await setupProposal();

    const decision = await makeGovernanceDecision({
      schoolId: SCHOOL_ID,
      proposalId: proposal.id,
      pilotRunId: PILOT_RUN_ID,
    });

    expect(decision.decision).not.toBe('approved_for_task028');
    expect(decision.safeToStartTask028).toBe(false);

    await govRepo.recordEvidencePack(SCHOOL_ID, proposal.id, {} as any);

    await govRepo.recordRiskAssessment(SCHOOL_ID, proposal.id, {
      overallRiskLevel: 'low',
      privacyRisk: 'low',
      safeguardingRisk: 'low',
      deenContentRisk: 'low',
      operationsCapacityRisk: 'low',
      blockingIssues: [],
    });

    await setupAllReviewsPassed(proposal.id);

    const decision2 = await makeGovernanceDecision({
      schoolId: SCHOOL_ID,
      proposalId: proposal.id,
      pilotRunId: PILOT_RUN_ID,
    });

    expect(decision2.decision).toBe('approved_for_task028');
    expect(decision2.safeToStartTask028).toBe(true);
  });

  it('safeToStartTask029 is always false', async () => {
    const proposal = await setupProposal();

    await govRepo.recordEvidencePack(SCHOOL_ID, proposal.id, {} as any);

    await govRepo.recordRiskAssessment(SCHOOL_ID, proposal.id, {
      overallRiskLevel: 'low',
      privacyRisk: 'low',
      safeguardingRisk: 'low',
      deenContentRisk: 'low',
      operationsCapacityRisk: 'low',
      blockingIssues: [],
    });

    await setupAllReviewsPassed(proposal.id);

    const decision = await makeGovernanceDecision({
      schoolId: SCHOOL_ID,
      proposalId: proposal.id,
      pilotRunId: PILOT_RUN_ID,
    });

    expect(decision.safeToStartTask029).toBe(false);

    const blocked = await makeGovernanceDecision({
      schoolId: SCHOOL_ID,
      proposalId: 'nonexistent',
      pilotRunId: PILOT_RUN_ID,
    });

    expect(blocked.safeToStartTask029).toBe(false);
  });

  it('safeToStartTask040 is always false', async () => {
    const proposal = await setupProposal();

    await govRepo.recordEvidencePack(SCHOOL_ID, proposal.id, {} as any);

    await govRepo.recordRiskAssessment(SCHOOL_ID, proposal.id, {
      overallRiskLevel: 'low',
      privacyRisk: 'low',
      safeguardingRisk: 'low',
      deenContentRisk: 'low',
      operationsCapacityRisk: 'low',
      blockingIssues: [],
    });

    await setupAllReviewsPassed(proposal.id);

    const decision = await makeGovernanceDecision({
      schoolId: SCHOOL_ID,
      proposalId: proposal.id,
      pilotRunId: PILOT_RUN_ID,
    });

    expect(decision.safeToStartTask040).toBe(false);

    const blocked = await makeGovernanceDecision({
      schoolId: SCHOOL_ID,
      proposalId: 'nonexistent',
      pilotRunId: PILOT_RUN_ID,
    });

    expect(blocked.safeToStartTask040).toBe(false);
  });

  it('blocked when missing evidence', async () => {
    const proposal = await setupProposal();

    const decision = await makeGovernanceDecision({
      schoolId: SCHOOL_ID,
      proposalId: proposal.id,
      pilotRunId: PILOT_RUN_ID,
    });

    expect(['blocked_missing_evidence', 'blocked_privacy_safeguarding', 'blocked_needs_review']).toContain(decision.decision);
    expect(decision.safeToStartTask028).toBe(false);
    expect(decision.blockingIssues.length).toBeGreaterThan(0);
    expect(decision.blockingIssues.some(b => b.toLowerCase().includes('evidence pack'))).toBe(true);
  });

  it('blocked when high risk', async () => {
    const proposal = await setupProposal();

    await govRepo.recordEvidencePack(SCHOOL_ID, proposal.id, {} as any);

    await govRepo.recordRiskAssessment(SCHOOL_ID, proposal.id, {
      overallRiskLevel: 'high',
      privacyRisk: 'low',
      safeguardingRisk: 'low',
      deenContentRisk: 'low',
      operationsCapacityRisk: 'low',
      blockingIssues: [],
    });

    await setupAllReviewsPassed(proposal.id);

    const decision = await makeGovernanceDecision({
      schoolId: SCHOOL_ID,
      proposalId: proposal.id,
      pilotRunId: PILOT_RUN_ID,
    });

    expect(decision.decision).toBe('blocked_high_risk');
    expect(decision.safeToStartTask028).toBe(false);
    expect(decision.blockingIssues.length).toBeGreaterThan(0);
    expect(decision.blockingIssues.some(b => b.toLowerCase().includes('high overall risk'))).toBe(true);
    expect(decision.decisionSummary).toContain('blocked_high_risk');
  });

  it('getGovernanceDecision retrieves the stored decision', async () => {
    const proposal = await setupProposal();

    await govRepo.recordEvidencePack(SCHOOL_ID, proposal.id, {} as any);

    await govRepo.recordRiskAssessment(SCHOOL_ID, proposal.id, {
      overallRiskLevel: 'low',
      privacyRisk: 'low',
      safeguardingRisk: 'low',
      deenContentRisk: 'low',
      operationsCapacityRisk: 'low',
      blockingIssues: [],
    });

    await setupAllReviewsPassed(proposal.id);

    const made = await makeGovernanceDecision({
      schoolId: SCHOOL_ID,
      proposalId: proposal.id,
      pilotRunId: PILOT_RUN_ID,
    });

    const retrieved = await getGovernanceDecision(proposal.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved.proposalId).toBe(proposal.id);
    expect(retrieved.decision.decision).toBe('approved_for_task028');
    expect(retrieved.decision.safeToStartTask028).toBe(true);
  });
});
