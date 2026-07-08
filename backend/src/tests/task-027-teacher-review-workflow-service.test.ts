import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';
import {
  submitTeacherReview,
  getTeacherReview,
} from '../services/task027TeacherReviewWorkflowService';

const validTeacherReviewInput = {
  schoolId: 'school-1',
  proposalId: '',
  pilotRunId: 'pilot-1',
  teacherSafeId: 'teacher-1',
  safeSummary: 'Pilot completed successfully, students engaged well.',
  supportConcerns: ['Minor technical issues resolved quickly'],
  learningQualityConcerns: ['Some students needed extra scaffolding'],
  workloadConcerns: ['Teacher preparation time acceptable'],
  recommendedDecision: 'approved_for_task028',
  safeReasonCodes: ['learning_quality_acceptable', 'support_adequate'],
};

async function seedProposal(): Promise<string> {
  const proposal = await govRepo.createExpansionProposal({
    schoolId: 'school-1',
    pilotRunId: 'pilot-1',
    proposedCohortSize: 25,
    proposedScopeLabels: [],
    proposedClassOrGradeIds: [],
    teacherOwnerSafeRefs: ['teacher-1'],
    supportOwnerSafeRefs: ['support-1'],
    curriculumSourceScopeIds: ['scope-1'],
    startReadinessWindow: '2026-09-01',
    rollbackReadinessPath: '/rollback/path',
  });
  return proposal.id;
}

describe('task027TeacherReviewWorkflowService', () => {
  beforeEach(() => {
    govRepo.clearTask027StoresForTests();
  });

  it('submits a valid teacher review successfully', async () => {
    const proposalId = await seedProposal();

    const result = await submitTeacherReview({
      ...validTeacherReviewInput,
      proposalId,
    });
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('returns approved reviewStatus for approved_for_task028 decision', async () => {
    const proposalId = await seedProposal();

    const result = await submitTeacherReview({
      ...validTeacherReviewInput,
      proposalId,
    });
    expect(result.reviewStatus).toBe('approved');
  });

  it('returns rejected reviewStatus for non-approved decision', async () => {
    const proposalId = await seedProposal();

    const result = await submitTeacherReview({
      ...validTeacherReviewInput,
      proposalId,
      recommendedDecision: 'rejected_do_not_expand',
    });
    expect(result.reviewStatus).toBe('rejected');
  });

  it('rejects submission when rawTeacherNotes is in input', async () => {
    const proposalId = await seedProposal();

    const result = await submitTeacherReview({
      ...validTeacherReviewInput,
      proposalId,
      rawTeacherNotes: 'These are raw notes that should not be submitted',
    } as any);
    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('rejected');
    expect(result.blockingIssues[0]).toContain('forbidden');
  });

  it('rejects submission when rawLearnerData is in input', async () => {
    const proposalId = await seedProposal();

    const result = await submitTeacherReview({
      ...validTeacherReviewInput,
      proposalId,
      rawLearnerData: 'raw student data leak',
    } as any);
    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('rejected');
  });

  it('rejects submission when rawStudentData is in input', async () => {
    const proposalId = await seedProposal();

    const result = await submitTeacherReview({
      ...validTeacherReviewInput,
      proposalId,
      rawStudentData: 'raw student data',
    } as any);
    expect(result.ok).toBe(false);
  });

  it('rejects submission with missing teacherSafeId', async () => {
    const proposalId = await seedProposal();

    const result = await submitTeacherReview({
      ...validTeacherReviewInput,
      proposalId,
      teacherSafeId: '',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Teacher reviewer safe identifier is required.');
  });

  it('rejects submission with missing safeSummary', async () => {
    const proposalId = await seedProposal();

    const result = await submitTeacherReview({
      ...validTeacherReviewInput,
      proposalId,
      safeSummary: '',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Safe summary is required.');
  });

  it('rejects submission with missing recommendedDecision', async () => {
    const proposalId = await seedProposal();

    const result = await submitTeacherReview({
      ...validTeacherReviewInput,
      proposalId,
      recommendedDecision: '',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Recommended decision is required.');
  });

  it('getTeacherReview returns saved review after submission', async () => {
    const proposalId = await seedProposal();
    await submitTeacherReview({ ...validTeacherReviewInput, proposalId });

    const review = await getTeacherReview(proposalId);
    expect(review).not.toBeNull();
    expect(review.teacherSafeId).toBe('teacher-1');
  });

  it('getTeacherReview returns null when no review exists', async () => {
    const review = await getTeacherReview('nonexistent');
    expect(review).toBeNull();
  });

  it('sanitizes teacherSafeId for safety', async () => {
    const proposalId = await seedProposal();
    await submitTeacherReview({
      ...validTeacherReviewInput,
      proposalId,
      teacherSafeId: 'teacher-1<script>',
    });

    const review = await getTeacherReview(proposalId);
    expect(review).not.toBeNull();
    expect(review.teacherSafeId).not.toContain('<');
  });

  it('returns safeMessage confirming submission', async () => {
    const proposalId = await seedProposal();

    const result = await submitTeacherReview({
      ...validTeacherReviewInput,
      proposalId,
    });
    expect(result.safeMessage).toContain('Teacher review submitted');
  });
});
