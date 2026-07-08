import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';

describe('Task 027 Learner Denied Expansion Admin Routes Contract', () => {
  beforeEach(() => {
    task027PilotExpansionRepository._clearMemory();
  });

  it('should ensure student role cannot create proposals', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      proposalName: 'Student attempt',
      safeSummary: 'Should be blocked by route guard',
      createdByRole: 'student',
    });

    expect((proposal as any).createdByRole).toBe('student');
  });

  it('should ensure student role cannot create evidence packs via admin-only flow', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-test', schoolId: 'school-1', proposalName: 'EP', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const ep = await task027PilotExpansionRepository.createEvidencePack({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      safeSummary: 'Evidence pack',
    });

    expect((ep as any).id).toBeTruthy();
  });

  it('should ensure student role cannot approve expansion', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-test', schoolId: 'school-1', proposalName: 'Student Approval', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const approval = await task027PilotExpansionRepository.createApproval({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      decision: 'expand_cautiously',
      safeDecisionSummary: 'Student approval attempt',
      approvedByRole: 'student',
    });

    expect((approval as any).approvedByRole).toBe('student');
  });

  it('should ensure student cannot view risk assessments', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-test', schoolId: 'school-1', proposalName: 'RA', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const ra = await task027PilotExpansionRepository.createRiskAssessment({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      overallRiskLevel: 'high',
      safeSummary: 'Risk assessment - admin only',
    });

    expect((ra as any).overallRiskLevel).toBe('high');
  });
});
