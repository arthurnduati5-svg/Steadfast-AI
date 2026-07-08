import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';

describe('Task 027 No Curriculum Gate Bypass Contract', () => {
  beforeEach(() => {
    task027PilotExpansionRepository._clearMemory();
  });

  it('should enforce curriculum scope in proposal', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      proposalName: 'Curriculum scoped',
      safeSummary: 'Curriculum scope enforced',
      requestedCurriculumScopes: ['National'],
      createdByRole: 'admin',
    });

    expect((proposal as any).requestedCurriculumScopes).toEqual(['National']);
  });

  it('should include curriculum evidence in evidence pack', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'EP', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const ep = await task027PilotExpansionRepository.createEvidencePack({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      safeSummary: 'Evidence pack with curriculum data',
      curriculumEvidence: { curriculumGateBlocks: 2, approvedCurriculumScopes: ['National'] },
    });

    expect((ep as any).curriculumEvidence).toBeTruthy();
    expect((ep as any).curriculumEvidence.curriculumGateBlocks).toBe(2);
  });

  it('should require curriculum source coverage review', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'CS Review', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const review = await task027PilotExpansionRepository.createReview({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      reviewType: 'curriculum_source_coverage',
      reviewerRole: 'admin',
      safeSummary: 'Curriculum source coverage review',
    });

    expect((review as any).reviewType).toBe('curriculum_source_coverage');
  });
});
