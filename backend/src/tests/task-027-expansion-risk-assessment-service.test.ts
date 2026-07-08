import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';
import { assessExpansionRisk } from '../services/task027ExpansionRiskAssessmentService';

async function seedProposalAndEvidence(evidenceOverrides?: Record<string, unknown>): Promise<{ proposalId: string }> {
  const proposal = await govRepo.createExpansionProposal({
    schoolId: 'school-1',
    pilotRunId: 'pilot-1',
    proposedCohortSize: 25,
    proposedScopeLabels: ['additional_class'],
    proposedClassOrGradeIds: ['class-2'],
    teacherOwnerSafeRefs: ['teacher-1'],
    supportOwnerSafeRefs: ['support-1'],
    curriculumSourceScopeIds: ['scope-1'],
    startReadinessWindow: '2026-09-01',
    rollbackReadinessPath: '/rollback/path',
  });

  const defaultEvidence = {
    pilotRunId: 'pilot-1',
    schoolId: 'school-1',
    cohortSafeCount: 30,
    sessionsStartedCount: 100,
    sessionsBlockedCount: 3,
    supportNeededCount: 5,
    incidentCount: 1,
    safeguardingSignalCount: 0,
    pauseCount: 0,
    rollbackCount: 0,
    safeLearningQualitySignals: { comprehensionRate: 0.85 },
    safeSocraticIntegritySignals: { finalAnswerLeakCount: 0, hintLadderBreachCount: 0, agencyReductionCount: 0 },
    safeContentGovernanceSignals: { answerKeyLeakCount: 0, deenGateBlockCount: 0, privacyBreachCount: 0, privacyFlagCount: 0 },
    safeOperationsSignals: { uptime: 0.999 },
    ...evidenceOverrides,
  };

  await govRepo.recordEvidenceSummary('school-1', 'pilot-1', defaultEvidence as any);

  return { proposalId: proposal.id };
}

describe('task027ExpansionRiskAssessmentService', () => {
  beforeEach(() => {
    govRepo.clearTask027StoresForTests();
  });

  it('returns low overall risk for clean proposal and evidence', async () => {
    const { proposalId } = await seedProposalAndEvidence();

    const result = await assessExpansionRisk({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.ok).toBe(true);
    expect(result.overallRiskLevel).toBe('low');
  });

  it('sets all risk dimensions to low for clean evidence', async () => {
    const { proposalId } = await seedProposalAndEvidence();

    const result = await assessExpansionRisk({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.learningQualityRisk).toBe('low');
    expect(result.socraticIntegrityRisk).toBe('low');
    expect(result.academicIntegrityRisk).toBe('low');
    expect(result.privacyRisk).toBe('low');
    expect(result.safeguardingRisk).toBe('low');
    expect(result.deenContentRisk).toBe('low');
  });

  it('returns critical risk when sessions blocked > 50', async () => {
    const { proposalId } = await seedProposalAndEvidence({ sessionsBlockedCount: 60 });

    const result = await assessExpansionRisk({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.overallRiskLevel).toBe('critical');
    expect(result.ok).toBe(false);
    expect(result.learningQualityRisk).toBe('critical');
  });

  it('blocks expansion on critical risk', async () => {
    const { proposalId } = await seedProposalAndEvidence({ sessionsBlockedCount: 60 });

    const result = await assessExpansionRisk({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Overall risk is critical. Expansion not approved.');
  });

  it('returns high risk and requires human review when final answer leak > 0', async () => {
    const { proposalId } = await seedProposalAndEvidence({
      safeSocraticIntegritySignals: { finalAnswerLeakCount: 1, hintLadderBreachCount: 0, agencyReductionCount: 0 },
    });

    const result = await assessExpansionRisk({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.socraticIntegrityRisk).toBe('critical');
    expect(result.requiresHumanReview).toBe(true);
    expect(result.humanReviewReasonCodes).toContain('socratic_integrity_critical');
  });

  it('requires human review for high risk overall', async () => {
    const { proposalId } = await seedProposalAndEvidence({ supportNeededCount: 60 });

    const result = await assessExpansionRisk({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.requiresHumanReview).toBe(true);
  });

  it('returns error for non-existent proposal', async () => {
    const result = await assessExpansionRisk({
      schoolId: 'school-1',
      proposalId: 'nonexistent',
      pilotRunId: 'pilot-1',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Expansion proposal not found.');
  });

  it('assesses privacy risk critical when breach detected', async () => {
    const { proposalId } = await seedProposalAndEvidence({
      safeContentGovernanceSignals: { privacyBreachCount: 1, answerKeyLeakCount: 0, deenGateBlockCount: 0, privacyFlagCount: 0 },
    });

    const result = await assessExpansionRisk({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.privacyRisk).toBe('critical');
  });

  it('assesses safeguarding risk critical when signals present', async () => {
    const { proposalId } = await seedProposalAndEvidence({ safeguardingSignalCount: 1 });

    const result = await assessExpansionRisk({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.safeguardingRisk).toBe('critical');
  });

  it('assesses deen content risk critical when gate blocks > 5', async () => {
    const { proposalId } = await seedProposalAndEvidence({
      safeContentGovernanceSignals: { deenGateBlockCount: 6, answerKeyLeakCount: 0, privacyBreachCount: 0, privacyFlagCount: 0 },
    });

    const result = await assessExpansionRisk({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.deenContentRisk).toBe('critical');
  });

  it('assesses teacher workload risk high when supportNeeded > 50', async () => {
    const { proposalId } = await seedProposalAndEvidence({ supportNeededCount: 55 });

    const result = await assessExpansionRisk({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.teacherWorkloadRisk).toBe('high');
  });

  it('returns mitigations for low risk', async () => {
    const { proposalId } = await seedProposalAndEvidence();

    const result = await assessExpansionRisk({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.mitigations.length).toBeGreaterThan(0);
    expect(result.mitigations[0]).toContain('monitoring');
  });

  it('includes all 10 risk dimensions in result', async () => {
    const { proposalId } = await seedProposalAndEvidence();

    const result = await assessExpansionRisk({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    const riskDimensions = [
      result.learningQualityRisk,
      result.socraticIntegrityRisk,
      result.academicIntegrityRisk,
      result.privacyRisk,
      result.safeguardingRisk,
      result.deenContentRisk,
      result.teacherWorkloadRisk,
      result.operationsCapacityRisk,
      result.rollbackReadinessRisk,
      result.studentSupportRisk,
    ];
    expect(riskDimensions.length).toBe(10);
    riskDimensions.forEach((level) => {
      expect(['low', 'medium', 'high', 'critical']).toContain(level);
    });
  });

  it('safeMessage includes overall risk level', async () => {
    const { proposalId } = await seedProposalAndEvidence();

    const result = await assessExpansionRisk({
      schoolId: 'school-1',
      proposalId,
      pilotRunId: 'pilot-1',
    });
    expect(result.safeMessage).toContain('low');
  });
});
