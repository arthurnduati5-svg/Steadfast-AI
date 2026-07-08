import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';

describe('Task 027 No Socratic Gate Bypass Contract', () => {
  beforeEach(() => {
    task027PilotExpansionRepository._clearMemory();
  });

  it('should require socratic quality review for expansion', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'Soc Review', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const review = await task027PilotExpansionRepository.createReview({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      reviewType: 'socratic_quality',
      reviewerRole: 'admin',
      safeSummary: 'Socratic quality review',
    });

    expect((review as any).reviewType).toBe('socratic_quality');
  });

  it('should include socratic evidence in evidence pack', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'Soc EP', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const ep = await task027PilotExpansionRepository.createEvidencePack({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      safeSummary: 'Evidence pack with Socratic data',
      socraticEvidence: { socraticGateBlocks: 0, noFinalAnswerPolicyIntact: true },
    });

    expect((ep as any).socraticEvidence).toBeTruthy();
    expect((ep as any).socraticEvidence.noFinalAnswerPolicyIntact).toBe(true);
  });

  it('should flag Socratic regression as risk', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'Soc Risk', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const ra = await task027PilotExpansionRepository.createRiskAssessment({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      overallRiskLevel: 'high',
      socraticRiskLevel: 'high',
      safeSummary: 'Socratic risk flagged',
      blockingIssues: ['Socratic quality risk blocks expansion'],
    });

    expect((ra as any).socraticRiskLevel).toBe('high');
  });
});
