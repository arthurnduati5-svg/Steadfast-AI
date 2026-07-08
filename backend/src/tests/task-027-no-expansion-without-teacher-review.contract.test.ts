import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { checkRequiredReviews } from '../services/task027PilotExpansionReviewService';

describe('Task 027 No Expansion Without Teacher Review Contract', () => {
  beforeEach(() => {
    task027PilotExpansionRepository._clearMemory();
  });

  it('should fail required reviews check when no reviews exist', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'No Reviews', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const check = await checkRequiredReviews(proposalId);
    expect(check.allRequiredPresent).toBe(false);
    expect(check.missingReviews.length).toBeGreaterThan(0);
    expect(check.missingReviews).toContain('teacher_learning_quality');
  });

  it('should pass required reviews only when all required types are present', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'Full Reviews', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const requiredTypes = [
      'teacher_learning_quality', 'admin_operations', 'privacy',
      'deen_governance', 'socratic_quality', 'curriculum_source_coverage',
      'rollback_readiness',
    ];

    for (const rt of requiredTypes) {
      await task027PilotExpansionRepository.createReview({
        expansionProposalId: proposalId,
        schoolId: 'school-1',
        reviewType: rt,
        reviewStatus: 'approved',
        reviewerRole: 'admin',
        safeSummary: `${rt} review passed`,
      });
    }

    const check = await checkRequiredReviews(proposalId);
    expect(check.allRequiredPresent).toBe(true);
    expect(check.missingReviews.length).toBe(0);
  });

  it('should detect rejected reviews', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'Rejected Review', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    await task027PilotExpansionRepository.createReview({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      reviewType: 'teacher_learning_quality',
      reviewStatus: 'rejected',
      reviewerRole: 'teacher',
      safeSummary: 'Rejected - quality concerns',
      blockingIssues: ['Learning quality below threshold'],
    });

    const check = await checkRequiredReviews(proposalId);
    expect(check.rejectedReviews).toContain('teacher_learning_quality');
  });

  it('should block expansion when any required review is rejected', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-1', schoolId: 'school-1', proposalName: 'Blocked by Rejection', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const requiredTypes = [
      'teacher_learning_quality', 'admin_operations', 'privacy',
      'deen_governance', 'socratic_quality', 'curriculum_source_coverage',
      'rollback_readiness',
    ];

    for (const rt of requiredTypes) {
      await task027PilotExpansionRepository.createReview({
        expansionProposalId: proposalId,
        schoolId: 'school-1',
        reviewType: rt,
        reviewStatus: rt === 'teacher_learning_quality' ? 'rejected' : 'approved',
        reviewerRole: 'admin',
        safeSummary: `${rt} review`,
      });
    }

    const check = await checkRequiredReviews(proposalId);
    expect(check.allRequiredPresent).toBe(false);
    expect(check.rejectedReviews).toContain('teacher_learning_quality');
  });
});
