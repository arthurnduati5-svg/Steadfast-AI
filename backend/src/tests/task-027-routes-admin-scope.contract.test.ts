import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';

describe('Task 027 Routes Admin Scope Contract', () => {
  beforeEach(() => {
    task027PilotExpansionRepository._clearMemory();
  });

  it('should create proposal with admin role', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      proposalName: 'Admin created proposal',
      safeSummary: 'Admin proposal',
      createdByRole: 'admin',
    });

    expect((proposal as any).id).toBeTruthy();
    expect((proposal as any).createdByRole).toBe('admin');
    expect((proposal as any).schoolId).toBe('school-1');
  });

  it('should create evidence pack with admin context', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-test', schoolId: 'school-1', proposalName: 'EP', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const ep = await task027PilotExpansionRepository.createEvidencePack({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      safeSummary: 'Admin generated evidence',
    });

    expect((ep as any).safeSummary).toBe('Admin generated evidence');
  });

  it('should create approval with admin role', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-test', schoolId: 'school-1', proposalName: 'App', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const approval = await task027PilotExpansionRepository.createApproval({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      decision: 'expand_cautiously',
      safeDecisionSummary: 'Admin approved',
      approvedByRole: 'admin',
    });

    expect((approval as any).approvedByRole).toBe('admin');
  });

  it('should list audit records by proposal', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-test', schoolId: 'school-1', proposalName: 'Audit', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    await task027PilotExpansionRepository.createAuditRecord({
      expansionProposalId: proposalId,
      actorRole: 'admin',
      action: 'proposal_created',
      safeSummary: 'Proposal created',
    });

    await task027PilotExpansionRepository.createAuditRecord({
      expansionProposalId: proposalId,
      actorRole: 'admin',
      action: 'expansion_approved',
      safeSummary: 'Expansion approved',
    });

    const audits = await task027PilotExpansionRepository.listAuditRecords(proposalId);
    expect(audits.length).toBe(2);
  });
});
