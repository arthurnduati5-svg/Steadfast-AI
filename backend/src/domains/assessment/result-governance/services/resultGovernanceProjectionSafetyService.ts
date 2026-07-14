import type {
  ResultGovernanceTeacherProjection,
  ResultGovernanceAdminProjection,
  ResultGovernanceStudentSafeProjection,
  ResultGovernanceParentBoundaryProjection,
  ResultFinalizationPreview,
  ResultReleaseReadinessPreview,
  ResultRegradeRequestPreview,
  ResultFinalizationReview,
  ResultFinalizationDecision,
  ResultReleaseReadiness,
  ResultReleaseBoundary,
  ResultRegradeRequest,
} from '../contracts/index';

import { FORBIDDEN_FIELDS_STUDENT, FORBIDDEN_FIELDS_PARENT } from '../contracts/releaseReadinessContracts';

export class ResultGovernanceProjectionSafetyService {
  toTeacherProjection(
    review: ResultFinalizationReview,
    decision?: ResultFinalizationDecision,
    readiness?: ResultReleaseReadiness,
  ): ResultGovernanceTeacherProjection {
    const actions: string[] = [];
    if (review.reviewStatus === 'draft' || review.reviewStatus === 'checks_pending') actions.push('run_checks', 'mark_ready_for_decision');
    if (review.reviewStatus === 'ready_for_decision') actions.push('create_decision');
    if (decision?.decisionStatus === 'approved_for_finalization') actions.push('create_release_readiness');
    if (readiness?.releaseReadinessStatus === 'ready_for_internal_release') actions.push('view_internal_projection');

    return {
      resultFinalizationReviewId: review.resultFinalizationReviewId,
      reviewStatus: review.reviewStatus,
      reviewMode: review.reviewMode,
      safeReviewSummary: review.safeReviewSummary,
      finalizationDecisionStatus: decision?.decisionStatus,
      safeDecisionSummary: decision?.safeDecisionSummary,
      releaseReadinessStatus: readiness?.releaseReadinessStatus,
      releaseAudienceType: readiness?.releaseAudienceType,
      createdByActorId: review.createdByActorId,
      createdAt: review.createdAt,
      nextAllowedActions: actions,
    };
  }

  toAdminProjection(
    reviews: ResultFinalizationReview[],
    decisions: ResultFinalizationDecision[],
    readiness?: ResultReleaseReadiness,
  ): ResultGovernanceAdminProjection {
    const total = reviews.length;
    const blocked = reviews.filter(r => r.reviewStatus === 'blocked').length;
    const completed = reviews.filter(r => r.reviewStatus === 'completed').length;

    return {
      resultFinalizationReviewId: reviews[0]?.resultFinalizationReviewId || '',
      schoolId: reviews[0]?.schoolId || '',
      reviewStatus: reviews[0]?.reviewStatus || '',
      reviewMode: reviews[0]?.reviewMode || '',
      safeReviewSummary: reviews[0]?.safeReviewSummary || '',
      createdByActorId: reviews[0]?.createdByActorId || '',
      createdByRole: reviews[0]?.createdByRole || '',
      finalizationDecisionStatus: decisions[0]?.decisionStatus,
      decisionType: decisions[0]?.decisionType,
      safeDecisionSummary: decisions[0]?.safeDecisionSummary,
      releaseReadinessStatus: readiness?.releaseReadinessStatus,
      releaseAudienceType: readiness?.releaseAudienceType,
      totalReviewCount: total,
      blockedCount: blocked,
      completedCount: completed,
      createdAt: reviews[0]?.createdAt || '',
    };
  }

  toStudentSafeProjection(
    studentRef: string,
    review?: ResultFinalizationReview,
    decision?: ResultFinalizationDecision,
    readiness?: ResultReleaseReadiness,
  ): ResultGovernanceStudentSafeProjection {
    const actions: string[] = [];
    if (readiness?.releaseReadinessStatus === 'ready_for_student_release') actions.push('view_result');
    if (readiness?.releaseReadinessStatus !== 'ready_for_student_release') actions.push('check_availability_later');

    return {
      studentRef,
      markingRunId: review?.markingRunId,
      markingResultVersionId: undefined,
      finalizationReviewStatus: review?.reviewStatus,
      finalizationDecisionStatus: decision?.decisionStatus,
      releaseReadinessStatus: readiness?.releaseReadinessStatus,
      safeStatusSummary: this.buildSafeStatusSummary(review, decision, readiness),
      availableNextActions: actions,
    };
  }

  toParentBoundaryProjection(
    studentRef: string,
    boundary?: ResultReleaseBoundary,
    readiness?: ResultReleaseReadiness,
  ): ResultGovernanceParentBoundaryProjection {
    return {
      studentRef,
      releaseBoundaryId: boundary?.resultReleaseBoundaryId,
      releaseReadinessStatus: readiness?.releaseReadinessStatus || (boundary?.boundaryStatus === 'active' ? 'ready_for_parent_release_boundary_only' : 'not_ready'),
      safeBoundarySummary: boundary?.safeBoundarySummary || 'Parent release is boundary-only. No scores or answer keys are released.',
      allowedFieldNames: (boundary?.allowedFieldsJson as any)?.fields || ['studentRef', 'safeBoundarySummary'],
      blockedFieldNames: (boundary?.blockedFieldsJson as any)?.fields || [...FORBIDDEN_FIELDS_PARENT] as string[],
      notYetReleasedReason: readiness?.releaseReadinessStatus !== 'ready_for_parent_release_boundary_only' ? 'Results are not yet ready for parent boundary release' : undefined,
    };
  }

  toFinalizationPreview(review: ResultFinalizationReview, decision?: ResultFinalizationDecision): ResultFinalizationPreview {
    return {
      resultFinalizationReviewId: review.resultFinalizationReviewId,
      reviewStatus: review.reviewStatus,
      safeReviewSummary: review.safeReviewSummary,
      finalizationDecisionStatus: decision?.decisionStatus,
      createdAt: review.createdAt,
    };
  }

  toReleaseReadinessPreview(readiness: ResultReleaseReadiness): ResultReleaseReadinessPreview {
    return {
      resultReleaseReadinessId: readiness.resultReleaseReadinessId,
      releaseReadinessStatus: readiness.releaseReadinessStatus,
      releaseAudienceType: readiness.releaseAudienceType,
      safeReadinessSummary: readiness.safeReadinessSummary,
      expiresAt: readiness.expiresAt,
    };
  }

  toRegradeRequestPreview(request: ResultRegradeRequest): ResultRegradeRequestPreview {
    return {
      resultRegradeRequestId: request.resultRegradeRequestId,
      requestStatus: request.requestStatus,
      requestType: request.requestType,
      safeRequestSummary: request.safeRequestSummary,
      createdAt: request.createdAt,
    };
  }

  assertNoAnswerKeyLeakage(projection: Record<string, unknown>): void {
    if (projection['answerKeySafeRef'] || projection['answerKeyText'] || projection['correctAnswerSummary']) {
      throw new Error('FORBIDDEN_FIELD: projection contains answer key data');
    }
  }

  assertNoRubricLeakage(projection: Record<string, unknown>): void {
    if (projection['rubricInternal'] || projection['rubricText']) {
      throw new Error('FORBIDDEN_FIELD: projection contains rubric data');
    }
  }

  assertNoTeacherOnlyLeakage(projection: Record<string, unknown>): void {
    if (projection['markingNotesTeacherOnly'] || projection['teacherOnlyNotes']) {
      throw new Error('FORBIDDEN_FIELD: projection contains teacher-only data');
    }
  }

  assertNoHiddenReasoningLeakage(projection: Record<string, unknown>): void {
    if (projection['hiddenReasoning'] || projection['chainOfThought']) {
      throw new Error('FORBIDDEN_FIELD: projection contains hidden reasoning');
    }
  }

  assertNoUnreleasedGradeLeakage(projection: Record<string, unknown>): void {
    if (projection['scoreBeforeFinalization'] || projection['unreleasedScore'] || projection['finalGradeBeforeRelease']) {
      throw new Error('FORBIDDEN_FIELD: projection contains unreleased grade data');
    }
  }

  assertNoParentDeliveryPayloadLeakage(projection: Record<string, unknown>): void {
    if (projection['parentDeliveryPayload']) {
      throw new Error('FORBIDDEN_FIELD: projection contains parent delivery payload');
    }
  }

  assertNoMasteryMutationLeakage(projection: Record<string, unknown>): void {
    if (projection['masteryMutation']) {
      throw new Error('FORBIDDEN_FIELD: projection contains mastery mutation data');
    }
  }

  private buildSafeStatusSummary(
    review?: ResultFinalizationReview,
    decision?: ResultFinalizationDecision,
    readiness?: ResultReleaseReadiness,
  ): string {
    if (!review) return 'No finalization review available';
    if (review.reviewStatus === 'blocked' || review.reviewStatus === 'cancelled') return 'Review is blocked or cancelled';
    if (review.reviewStatus !== 'completed') return 'Finalization review is in progress';
    if (!decision) return 'Finalization review completed. Decision pending.';
    if (decision.decisionStatus === 'approved_for_finalization' && readiness?.releaseReadinessStatus === 'ready_for_student_release') return 'Results are ready for student viewing';
    if (decision.decisionStatus === 'approved_for_finalization') return 'Results are finalized but not yet released';
    if (decision.decisionStatus === 'returned_for_review') return 'Results returned for additional review';
    return 'Result status not available';
  }
}
