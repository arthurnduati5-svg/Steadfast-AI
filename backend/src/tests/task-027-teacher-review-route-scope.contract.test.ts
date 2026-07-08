import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';

describe('Task 027 Teacher Review Route Scope Contract', () => {
  beforeEach(() => {
    task027PilotExpansionRepository._clearMemory();
  });

  it('should allow teacher to submit review', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-test', schoolId: 'school-1', proposalName: 'Teacher Review', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const review = await task027PilotExpansionRepository.createReview({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      reviewType: 'teacher_learning_quality',
      reviewerRole: 'teacher',
      safeSummary: 'Teacher learning quality review',
    });

    expect((review as any).reviewerRole).toBe('teacher');
    expect((review as any).reviewType).toBe('teacher_learning_quality');

    const reviews = await task027PilotExpansionRepository.listReviews(proposalId);
    expect(reviews.length).toBe(1);
  });

  it('should allow admin to submit deen governance review', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-test', schoolId: 'school-1', proposalName: 'Deen Review', safeSummary: 'Test', createdByRole: 'admin',
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

  it('should track review statuses correctly', async () => {
    const proposal = await task027PilotExpansionRepository.createProposal({
      pilotProgramId: 'pp-test', schoolId: 'school-1', proposalName: 'Status Check', safeSummary: 'Test', createdByRole: 'admin',
    });
    const proposalId = (proposal as any).id;

    const review = await task027PilotExpansionRepository.createReview({
      expansionProposalId: proposalId,
      schoolId: 'school-1',
      reviewType: 'socratic_quality',
      reviewStatus: 'blocked',
      reviewerRole: 'admin',
      safeSummary: 'Socratic quality review blocked',
      blockingIssues: ['Socratic regression detected'],
    });

    expect((review as any).reviewStatus).toBe('blocked');
  });
});
