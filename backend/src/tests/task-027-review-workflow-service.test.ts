import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { submitExpansionReview, checkRequiredReviews } from '../services/task027PilotExpansionReviewService';
import { setupExpansionTestEnvironment } from './task-027-test-helper';

describe('Task 027 Review Workflow Service', () => {
  beforeEach(async () => {
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
  });

  it('should submit and approve a review', async () => {
    const { proposalId } = await setupExpansionTestEnvironment();

    const result = await submitExpansionReview({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      reviewType: 'privacy',
      reviewerRole: 'admin',
      safeSummary: 'Privacy review passed - no concerns',
    });

    expect(result.ok).toBe(true);
    expect(result.reviewId).toBeTruthy();
    expect(result.reviewStatus).toBe('approved');
  });

  it('should block review with blocking issues', async () => {
    const { proposalId } = await setupExpansionTestEnvironment();

    const result = await submitExpansionReview({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      reviewType: 'privacy',
      reviewerRole: 'admin',
      safeSummary: 'Privacy review has concerns',
      blockingIssues: ['Unresolved privacy signal'],
    });

    expect(result.ok).toBe(true);
    expect(result.reviewStatus).toBe('blocked');
  });

  it('should check required reviews - missing reviews', async () => {
    const { proposalId } = await setupExpansionTestEnvironment();
    const check = await checkRequiredReviews(proposalId);

    expect(check.allRequiredPresent).toBe(false);
    expect(check.missingReviews.length).toBeGreaterThan(0);
  });

  it('should detect all required reviews present', async () => {
    const { proposalId } = await setupExpansionTestEnvironment();

    const requiredTypes = [
      'teacher_learning_quality', 'admin_operations', 'privacy',
      'deen_governance', 'socratic_quality', 'curriculum_source_coverage',
      'rollback_readiness',
    ];

    for (const rt of requiredTypes) {
      await submitExpansionReview({
        expansionProposalId: proposalId,
        schoolId: 'school-1',
        reviewType: rt as any,
        reviewerRole: 'admin',
        safeSummary: `${rt} review passed`,
      });
    }

    const check = await checkRequiredReviews(proposalId);
    expect(check.allRequiredPresent).toBe(true);
    expect(check.missingReviews.length).toBe(0);
  });

  it('should fail for non-existent proposal', async () => {
    const result = await submitExpansionReview({
      expansionProposalId: 'nonexistent',
      schoolId: 'school-1',
      reviewType: 'privacy',
      reviewerRole: 'admin',
      safeSummary: 'Review',
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('proposal_not_found');
  });

  it('should fail on school mismatch', async () => {
    const { proposalId } = await setupExpansionTestEnvironment();

    const result = await submitExpansionReview({
      expansionProposalId: proposalId,
      schoolId: 'school-999',
      reviewType: 'privacy',
      reviewerRole: 'admin',
      safeSummary: 'Review',
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('school_mismatch');
  });

  it('should not leak private data in reviews', async () => {
    const { proposalId } = await setupExpansionTestEnvironment();

    const result = await submitExpansionReview({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      reviewType: 'deen_governance',
      reviewerRole: 'admin',
      safeSummary: 'Deen governance review - safe summary only',
    });

    expect(result.ok).toBe(true);

    const reviews = await task027PilotExpansionRepository.listReviews(proposalId);
    for (const review of reviews) {
      const jsonStr = JSON.stringify(review);
      expect(jsonStr).not.toContain('Bearer ');
      expect(jsonStr).not.toContain('sk-');
    }
  });
});
