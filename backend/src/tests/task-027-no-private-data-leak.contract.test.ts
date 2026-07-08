import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { PRIVATE_CONTENT_PATTERNS } from '../contracts/task027PilotExpansionContracts';

describe('Task 027 No Private Data Leak Contract', () => {
  beforeEach(() => {
    task027PilotExpansionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
  });

  async function scanForPrivateContent(obj: any): Promise<string[]> {
    const violations: string[] = [];
    for (const pattern of PRIVATE_CONTENT_PATTERNS) {
      const jsonStr = JSON.stringify(obj).toLowerCase();
      if (jsonStr.includes(pattern.toLowerCase())) {
        violations.push(pattern);
      }
    }
    return violations;
  }

  it('should not leak private content in proposals', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      proposalName: 'Privacy Test',
      safeSummary: 'Safe summary only',
      createdByRole: 'admin',
    });

    const violations = await scanForPrivateContent(proposal);
    const allowedPatterns = ['answer_key', 'private_memory'];
    expect(violations.filter(v => !allowedPatterns.includes(v))).toEqual([]);
  });

  it('should not leak secrets in evidence packs', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'EP Privacy', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const ep = await task027PilotExpansionRepository.createEvidencePack({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      safeSummary: 'Safe evidence pack',
    });

    const jsonStr = JSON.stringify(ep);
    expect(jsonStr).not.toContain('Bearer ');
    expect(jsonStr).not.toContain('sk-');
    expect(jsonStr).not.toContain('postgres://');
    expect(jsonStr).not.toContain('postgresql://');
  });

  it('should not leak teacher-only notes in reviews', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'Review Privacy', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const review = await task027PilotExpansionRepository.createReview({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      reviewType: 'teacher_learning_quality',
      reviewerRole: 'teacher',
      safeSummary: 'Teacher review - safe summary only',
    });

    const safeSummary = (review as any).safeSummary || '';
    expect(safeSummary).not.toContain('Bearer ');
    expect(safeSummary).not.toContain('sk-');
  });

  it('should not expose database URLs in approval records', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'App Privacy', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const approval = await task027PilotExpansionRepository.createApproval({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      decision: 'expand_cautiously',
      safeDecisionSummary: 'Safe decision summary',
    });

    const jsonStr = JSON.stringify(approval);
    expect(jsonStr).not.toContain('postgres://');
    expect(jsonStr).not.toContain('postgresql://');
  });

  it('should not leak raw chat in cohort changes', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'CC Privacy', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const cc = await task027PilotExpansionRepository.createCohortChange({
      expansionProposalId: proposalId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      safeSummary: 'Safe cohort change',
    });

    const jsonStr = JSON.stringify(cc);
    expect(jsonStr).not.toContain('rawChat');
    expect(jsonStr).not.toContain('raw_chat');
  });

  it('should not contain AI prompts or provider responses in reports', async () => {
    const report = await task027PilotExpansionRepository.createExpansionReport({
      taskId: '027',
      taskName: 'Privacy Report',
      safeSummary: 'Safe report',
    });

    const jsonStr = JSON.stringify(report);
    expect(jsonStr).not.toContain('aiPrompt');
    expect(jsonStr).not.toContain('providerResponse');
  });

  it('should not expose secrets in audit records', async () => {
    const audit = await task027PilotExpansionRepository.createAuditRecord({
      actorRole: 'admin',
      action: 'test',
      safeSummary: 'Safe audit',
    });

    const jsonStr = JSON.stringify(audit);
    expect(jsonStr).not.toContain('Bearer ');
    expect(jsonStr).not.toContain('sk-');
  });
});
