import {
  Task027TeacherReviewInput,
  Task027TeacherReviewResult,
  TASK027_TEACHER_REVIEW_STATUSES,
  TASK027_FORBIDDEN_FIELDS,
} from '../contracts/task027PilotExpansionGovernanceContracts';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

function containsForbiddenData(obj: Record<string, unknown>): string[] {
  const violations: string[] = [];
  for (const field of TASK027_FORBIDDEN_FIELDS) {
    if (field in obj) {
      violations.push(field);
    }
  }
  return violations;
}

export async function submitTeacherReview(input: Task027TeacherReviewInput): Promise<Task027TeacherReviewResult> {
  const { schoolId, proposalId, teacherSafeId, safeSummary, supportConcerns, learningQualityConcerns, workloadConcerns, recommendedDecision, safeReasonCodes } = input;

  const proposal = await govRepo.getExpansionProposal(proposalId);
  if (!proposal) {
    return {
      ok: false,
      reviewStatus: 'not_started',
      blockingIssues: ['Proposal not found'],
      safeMessage: 'Cannot submit teacher review: proposal not found.',
    };
  }

  const forbiddenViolations = containsForbiddenData(input as unknown as Record<string, unknown>);
  if (forbiddenViolations.length > 0) {
    return {
      ok: false,
      reviewStatus: 'rejected',
      blockingIssues: [`Teacher review contains forbidden fields: ${forbiddenViolations.join(', ')}`],
      safeMessage: 'Teacher review rejected: raw notes or raw learner data detected.',
    };
  }

  const blockingIssues: string[] = [];
  if (!teacherSafeId) {
    blockingIssues.push('Teacher reviewer safe identifier is required.');
  }
  if (!safeSummary) {
    blockingIssues.push('Safe summary is required.');
  }
  if (!recommendedDecision) {
    blockingIssues.push('Recommended decision is required.');
  }

  if (blockingIssues.length > 0) {
    return {
      ok: false,
      reviewStatus: 'in_progress',
      blockingIssues,
      safeMessage: 'Teacher review incomplete.',
    };
  }

  const reviewStatus = recommendedDecision === 'approved_for_task028' ? 'approved' as const : 'rejected' as const;

  const result = {
    teacherSafeId: teacherSafeId.replace(/[^a-zA-Z0-9_\-]/g, ''),
    schoolId,
    pilotRunId: proposal.pilotRunId,
    reviewStatus,
    safeSummary,
    supportConcerns: supportConcerns.map((c) => c.replace(/<[^>]*>/g, '')),
    learningQualityConcerns: learningQualityConcerns.map((c) => c.replace(/<[^>]*>/g, '')),
    workloadConcerns: workloadConcerns.map((c) => c.replace(/<[^>]*>/g, '')),
    recommendedDecision,
    safeReasonCodes,
  };

  await govRepo.recordReviewResult(schoolId, proposalId, 'teacher_review', result);

  return {
    ok: true,
    reviewStatus,
    blockingIssues: [],
    safeMessage: `Teacher review submitted. Status: ${reviewStatus}.`,
  };
}

export async function getTeacherReview(proposalId: string): Promise<any> {
  const reviews = await govRepo.listReviewResults(proposalId);
  const teacherReviews = reviews.filter((r) => r.reviewType === 'teacher_review');
  if (teacherReviews.length === 0) return null;
  return teacherReviews[0].result;
}
