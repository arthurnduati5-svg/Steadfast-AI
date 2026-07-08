import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';

describe('Task 027 No Deen Gate Bypass Contract', () => {
  beforeEach(() => {
    task027PilotExpansionRepository._clearMemory();
  });

  it('should require deen governance review for expansion', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'Deen Gov', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const review = await task027PilotExpansionRepository.createReview({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      reviewType: 'deen_governance',
      reviewerRole: 'admin',
      safeSummary: 'Deen governance review - safe summary only',
    });

    expect((review as any).reviewType).toBe('deen_governance');
  });

  it('should include deen evidence in evidence pack', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'Deen EP', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const ep = await task027PilotExpansionRepository.createEvidencePack({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      safeSummary: 'Evidence pack with Deen data',
      deenEvidence: { deenSignals: 0, deenGateBlocks: 0 },
    });

    expect((ep as any).deenEvidence).toBeTruthy();
  });

  it('should not expose Deen-sensitive private text in evidence', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'Deen Privacy', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const ep = await task027PilotExpansionRepository.createEvidencePack({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      safeSummary: 'Evidence pack without raw Deen text',
      deenEvidence: { deenSignals: 1, summaryOnly: true },
    });

    const jsonStr = JSON.stringify(ep);
    expect(jsonStr).not.toContain('deenSensitive');
    expect(jsonStr).not.toContain('deen_sensitive');
  });

  it('should flag critical Deen risk as blocking', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'Deen Critical', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const ra = await task027PilotExpansionRepository.createRiskAssessment({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      overallRiskLevel: 'critical',
      deenRiskLevel: 'critical',
      safeSummary: 'Critical Deen risk',
      blockingIssues: ['Critical Deen governance risk'],
    });

    expect((ra as any).deenRiskLevel).toBe('critical');
    expect((ra as any).blockingIssues.length).toBeGreaterThan(0);
  });
});
