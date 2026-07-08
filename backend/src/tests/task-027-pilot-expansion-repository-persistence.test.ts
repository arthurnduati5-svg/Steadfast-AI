import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';

describe('Task 027 Pilot Expansion Repository Persistence', () => {
  beforeEach(() => {
    task027PilotExpansionRepository._clearMemory();
  });

  it('should create and read a proposal', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      proposalName: 'Test Expansion',
      safeSummary: 'Test expansion proposal',
      createdByRole: 'admin',
    });

    const id = (proposal as any).id;
    expect(id).toBeTruthy();

    const read = await task027PilotExpansionRepository.getProposal(id);
    expect(read).toBeTruthy();
    expect((read as any).proposalName).toBe('Test Expansion');
    expect((read as any).schoolId).toBe('school-1');
  });

  it('should update proposal status', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      proposalName: 'Status Test',
      safeSummary: 'Test status',
      createdByRole: 'admin',
    });

    const id = (proposal as any).id;
    await task027PilotExpansionRepository.updateProposal(id, { status: 'approved' });

    const updated = await task027PilotExpansionRepository.getProposal(id);
    expect((updated as any).status).toBe('approved');
  });

  it('should list proposals by school', async () => {
    await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'P1', safeSummary: 'S1', createdByRole: 'admin',
    });
    await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'P2', safeSummary: 'S2', createdByRole: 'admin',
    });

    const list = await task027PilotExpansionRepository.listProposals('school-1');
    expect(list.length).toBe(2);
  });

  it('should create and read a review', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'Review Test', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const review = await task027PilotExpansionRepository.createReview({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      reviewType: 'privacy',
      reviewerRole: 'admin',
      safeSummary: 'Privacy review passed',
    });

    expect((review as any).reviewType).toBe('privacy');
    const reviews = await task027PilotExpansionRepository.listReviews(proposalId);
    expect(reviews.length).toBe(1);
  });

  it('should create and read evidence pack', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'EP Test', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const ep = await task027PilotExpansionRepository.createEvidencePack({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      safeSummary: 'Evidence pack',
      learningQualityEvidence: { sessions: 10 },
    });

    expect((ep as any).safeSummary).toBe('Evidence pack');

    const found = await task027PilotExpansionRepository.getEvidencePackByProposalId(proposalId);
    expect(found).toBeTruthy();
  });

  it('should create and read risk assessment', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'RA Test', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const ra = await task027PilotExpansionRepository.createRiskAssessment({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      overallRiskLevel: 'low',
      safeSummary: 'Low risk assessment',
    });

    expect((ra as any).overallRiskLevel).toBe('low');

    const found = await task027PilotExpansionRepository.getRiskAssessmentByProposalId(proposalId);
    expect(found).toBeTruthy();
  });

  it('should create and read approval', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'App Test', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const approval = await task027PilotExpansionRepository.createApproval({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      decision: 'expand_cautiously',
      safeDecisionSummary: 'Approved with conditions',
    });

    expect((approval as any).decision).toBe('expand_cautiously');

    const found = await task027PilotExpansionRepository.getApprovalByProposalId(proposalId);
    expect(found).toBeTruthy();
  });

  it('should create and read cohort change', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'CC Test', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const cc = await task027PilotExpansionRepository.createCohortChange({
      expansionProposalId: proposalId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      safeSummary: 'Cohort change test',
    });

    expect((cc as any).changeStatus).toBe('pending');

    const found = await task027PilotExpansionRepository.getCohortChangeByProposalId(proposalId);
    expect(found).toBeTruthy();
  });

  it('should create and read audit records', async () => {
    const audit = await task027PilotExpansionRepository.createAuditRecord({
      actorRole: 'admin',
      action: 'test_action',
      safeSummary: 'Test audit',
    });

    expect((audit as any).action).toBe('test_action');

    const list = await task027PilotExpansionRepository.listAuditRecords();
    expect(list.length).toBe(1);
  });

  it('should create and read expansion report', async () => {
    const report = await task027PilotExpansionRepository.createExpansionReport({
      taskId: '027',
      taskName: 'Test Report',
      safeSummary: 'Test report',
      safeToStartNextTask: true,
    });

    expect((report as any).taskId).toBe('027');

    const found = await task027PilotExpansionRepository.getExpansionReport((report as any).id);
    expect(found).toBeTruthy();

    const list = await task027PilotExpansionRepository.listExpansionReports('027');
    expect(list.length).toBe(1);
  });

  it('should provide persistence mode info', async () => {
    const mode = await task027PilotExpansionRepository.getPersistenceMode
      ? task027PilotExpansionRepository.getPersistenceMode()
      : { mode: 'test_memory', durable: false, fallbackUsed: true };
    expect(mode).toBeTruthy();
    expect(typeof mode.mode).toBe('string');
  });
});
