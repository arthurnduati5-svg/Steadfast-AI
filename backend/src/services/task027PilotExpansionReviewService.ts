import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { REQUIRED_EXPANSION_REVIEW_TYPES } from '../contracts/task027PilotExpansionContracts';
import type { PilotExpansionReviewType, PilotExpansionReviewStatus } from '../contracts/task027PilotExpansionContracts';

export async function submitExpansionReview(data: {
  expansionProposalId: string;
  schoolId: string;
  reviewType: PilotExpansionReviewType;
  reviewerRole: string;
  reviewerActorIdHash?: string;
  safeSummary: string;
  blockingIssues?: string[];
  warnings?: string[];
  evidenceRefs?: string[];
  metadataSafeJson?: Record<string, unknown>;
}): Promise<{
  ok: boolean;
  reviewId?: string;
  reviewStatus: PilotExpansionReviewStatus;
  blockingIssues: string[];
  safeMessage: string;
}> {
  const proposal = await task027PilotExpansionRepository.getProposal(data.expansionProposalId);
  if (!proposal) {
    return { ok: false, reviewStatus: 'draft', blockingIssues: ['proposal_not_found'], safeMessage: 'Proposal not found.' };
  }

  if ((proposal as any).schoolId !== data.schoolId) {
    return { ok: false, reviewStatus: 'draft', blockingIssues: ['school_mismatch'], safeMessage: 'School mismatch.' };
  }

  const reviewBlocking = data.blockingIssues ?? [];
  let reviewStatus: PilotExpansionReviewStatus = 'submitted';

  if (reviewBlocking.length > 0) {
    reviewStatus = 'blocked';
  } else {
    reviewStatus = 'approved';
  }

  const review = await task027PilotExpansionRepository.createReview({
    expansionProposalId: data.expansionProposalId,
    schoolId: data.schoolId,
    reviewType: data.reviewType,
    reviewStatus,
    reviewerRole: data.reviewerRole,
    reviewerActorIdHash: data.reviewerActorIdHash,
    safeSummary: data.safeSummary,
    blockingIssues: reviewBlocking,
    warnings: data.warnings ?? [],
    evidenceRefs: data.evidenceRefs ?? [],
    metadataSafeJson: data.metadataSafeJson,
  });

  await task027PilotExpansionRepository.createAuditRecord({
    expansionProposalId: data.expansionProposalId,
    schoolId: data.schoolId,
    actorRole: data.reviewerRole,
    actorIdHash: data.reviewerActorIdHash,
    action: `review_submitted_${data.reviewType}`,
    safeSummary: `${data.reviewType} review submitted with status ${reviewStatus}.`,
  });

  return {
    ok: true,
    reviewId: (review as any).id,
    reviewStatus,
    blockingIssues: reviewBlocking,
    safeMessage: `${data.reviewType} review submitted with status ${reviewStatus}.`,
  };
}

export async function checkRequiredReviews(expansionProposalId: string): Promise<{
  allRequiredPresent: boolean;
  missingReviews: PilotExpansionReviewType[];
  rejectedReviews: string[];
  blockedReviews: string[];
  safeMessage: string;
}> {
  const proposal = await task027PilotExpansionRepository.getProposal(expansionProposalId);
  if (!proposal) {
    return { allRequiredPresent: false, missingReviews: REQUIRED_EXPANSION_REVIEW_TYPES, rejectedReviews: [], blockedReviews: [], safeMessage: 'Proposal not found.' };
  }

  const reviews = await task027PilotExpansionRepository.listReviews(expansionProposalId);
  const presentTypes = new Set(reviews.map((r: any) => r.reviewType));
  const rejectedTypes = reviews.filter((r: any) => r.reviewStatus === 'rejected').map((r: any) => r.reviewType);
  const blockedTypes = reviews.filter((r: any) => r.reviewStatus === 'blocked').map((r: any) => r.reviewType);

  const missingReviews = REQUIRED_EXPANSION_REVIEW_TYPES.filter((rt) => !presentTypes.has(rt));

  const allRequiredPresent = missingReviews.length === 0 && rejectedTypes.length === 0;

  return {
    allRequiredPresent,
    missingReviews,
    rejectedReviews: rejectedTypes,
    blockedReviews: blockedTypes,
    safeMessage: allRequiredPresent
      ? 'All required reviews present.'
      : `Missing: ${missingReviews.join(', ')}. Rejected: ${rejectedTypes.join(', ')}. Blocked: ${blockedTypes.join(', ')}.`,
  };
}
