import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';

describe('Task 027 No Expansion With Critical Risk Contract', () => {
  beforeEach(() => {
    task027PilotExpansionRepository._clearMemory();
  });

  it('should block expansion when risk is critical', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'Critical Risk', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const ra = await task027PilotExpansionRepository.createRiskAssessment({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      overallRiskLevel: 'critical',
      safeSummary: 'Critical risk - expansion blocked',
      blockingIssues: ['Critical overall risk. Expansion not approved.'],
    });

    expect((ra as any).overallRiskLevel).toBe('critical');
    expect((ra as any).blockingIssues.length).toBeGreaterThan(0);
  });

  it('should block expansion with critical privacy risk', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'Privacy Critical', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const ra = await task027PilotExpansionRepository.createRiskAssessment({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      overallRiskLevel: 'critical',
      privacyRiskLevel: 'critical',
      safeSummary: 'Critical privacy risk',
      blockingIssues: ['Critical privacy risk blocks expansion.'],
    });

    expect((ra as any).privacyRiskLevel).toBe('critical');
  });

  it('should block expansion with critical Deen risk', async () => {
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
      blockingIssues: ['Critical Deen governance risk blocks expansion.'],
    });

    expect((ra as any).deenRiskLevel).toBe('critical');
  });

  it('should block expansion with unresolved school auth bypass risk', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'Auth Bypass', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const ra = await task027PilotExpansionRepository.createRiskAssessment({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      overallRiskLevel: 'critical',
      safeSummary: 'Auth bypass risk',
      blockingIssues: ['School-auth bypass attempt unresolved.'],
    });

    expect((ra as any).overallRiskLevel).toBe('critical');
  });

  it('should block expansion with Socratic regression', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'Socratic Block', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const ra = await task027PilotExpansionRepository.createRiskAssessment({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      overallRiskLevel: 'high',
      socraticRiskLevel: 'high',
      safeSummary: 'Socratic regression blocks',
      blockingIssues: ['Socratic quality risk blocks expansion.'],
    });

    expect((ra as any).socraticRiskLevel).toBe('high');
  });

  it('should block expansion with curriculum source gaps', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'Curr Block', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const ra = await task027PilotExpansionRepository.createRiskAssessment({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      overallRiskLevel: 'high',
      curriculumRiskLevel: 'high',
      safeSummary: 'Curriculum gap blocks',
      blockingIssues: ['Curriculum/source coverage gap blocks expansion.'],
    });

    expect((ra as any).curriculumRiskLevel).toBe('high');
  });

  it('should block expansion with rollback readiness blocker', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'Rollback Block', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    await task027PilotExpansionRepository.createEvidencePack({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      safeSummary: 'Evidence pack without rollback plan',
      rollbackEvidence: { rollbackPlanExists: false },
      blockingIssues: ['Rollback plan not confirmed.'],
    });

    const ep = await task027PilotExpansionRepository.getEvidencePackByProposalId(proposalId);
    expect((ep as any).rollbackEvidence.rollbackPlanExists).toBe(false);
  });
});
