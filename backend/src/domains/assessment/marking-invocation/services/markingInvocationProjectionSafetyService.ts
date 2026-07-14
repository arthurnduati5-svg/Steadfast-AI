import {
  MarkingInvocationTeacherProjection,
  MarkingInvocationAdminProjection,
  MarkingInvocationStudentSafeProjection,
} from '../contracts/markingInvocationProjectionContracts';
import { MarkingInvocationRequest } from '../contracts/markingInvocationContracts';
import { SubmittedSnapshotIntake } from '../contracts/submittedSnapshotIntakeContracts';
import { MarkingBatch, MarkingBatchItem } from '../contracts/markingBatchContracts';
import { MarkingResultLink } from '../contracts/markingResultBridgeContracts';

const FORBIDDEN_STUDENT_FIELDS = [
  'answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary', 'rubricInternal', 'rubricText',
  'markingNotesTeacherOnly', 'teacherOnlyNotes', 'hiddenReasoning', 'chainOfThought',
  'rawQuestionMetadata', 'selectionReasonInternal', 'markingAlgorithmInternals',
  'score', 'finalGrade', 'parentReleaseStatus', 'masteryMutation',
  'moderationDecisionInternal', 'teacherOverrideInternal',
];

export class MarkingInvocationProjectionSafetyService {
  toTeacherProjection(
    request: MarkingInvocationRequest,
    intakes: SubmittedSnapshotIntake[],
    batches: MarkingBatch[],
  ): MarkingInvocationTeacherProjection {
    const deterministicMarked = batches.reduce((sum, b) => sum + b.deterministicItemCount, 0);
    const teacherReviewCount = batches.reduce((sum, b) => sum + b.teacherReviewItemCount, 0);
    const blockedCount = batches.reduce((sum, b) => sum + b.blockedItemCount, 0);
    const completedBatches = batches.filter(b => b.batchStatus === 'completed').length;
    return {
      markingInvocationRequestId: request.markingInvocationRequestId,
      schoolId: request.schoolId,
      deliverySessionId: request.deliverySessionId,
      paperId: request.paperId,
      paperVersionId: request.paperVersionId,
      invocationStatus: request.invocationStatus,
      invocationMode: request.invocationMode,
      sourceType: request.sourceType,
      safeRequestSummary: request.safeRequestSummary,
      intakeCount: intakes.length,
      batchCount: batches.length,
      batchStatusSummary: `${completedBatches}/${batches.length} batches completed`,
      deterministicMarkedCount: deterministicMarked,
      teacherReviewDispatchCount: teacherReviewCount,
      resultLinkCount: 0,
      blockedItemCount: blockedCount,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }

  toAdminProjection(
    request: MarkingInvocationRequest,
    intakes: SubmittedSnapshotIntake[],
    batches: MarkingBatch[],
    batchItems: MarkingBatchItem[],
    resultLinks: MarkingResultLink[],
    auditCount: number,
  ): MarkingInvocationAdminProjection {
    return {
      markingInvocationRequestId: request.markingInvocationRequestId,
      schoolId: request.schoolId,
      deliverySessionId: request.deliverySessionId,
      paperId: request.paperId,
      paperVersionId: request.paperVersionId,
      requestedByActorId: request.requestedByActorId,
      requestedByRole: request.requestedByRole,
      invocationStatus: request.invocationStatus,
      invocationMode: request.invocationMode,
      sourceType: request.sourceType,
      submittedSnapshotRefsJson: request.submittedSnapshotRefsJson,
      safeRequestSummary: request.safeRequestSummary,
      intakeRecords: intakes.length,
      readinessChecks: 0,
      batches: batches.length,
      batchItems: batchItems.length,
      resultLinks: resultLinks.length,
      auditEvents: auditCount,
      deterministicItemCount: batches.reduce((s, b) => s + b.deterministicItemCount, 0),
      teacherReviewItemCount: batches.reduce((s, b) => s + b.teacherReviewItemCount, 0),
      blockedItemCount: batches.reduce((s, b) => s + b.blockedItemCount, 0),
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      cancelledAt: request.cancelledAt,
    };
  }

  toStudentSafeProjection(intake: SubmittedSnapshotIntake): MarkingInvocationStudentSafeProjection {
    return {
      attemptId: intake.attemptId,
      submissionSnapshotId: intake.submissionSnapshotId,
      markingInvocationRequestId: intake.markingInvocationRequestId,
      intakeStatus: intake.intakeStatus,
      batchStatus: 'pending',
      safeStatusSummary: intake.safeIntakeSummary,
      submittedAt: intake.createdAt,
      processingStatus: intake.intakeStatus === 'ready_for_marking' ? 'processing' : 'pending',
    };
  }

  assertNoAnswerKeyLeakage(projection: any): boolean {
    return !projection.answerKeySafeRef && !projection.correctAnswerSummary && !projection.answerKeyText;
  }

  assertNoRubricLeakage(projection: any): boolean {
    return !projection.rubricInternal && !projection.rubricText;
  }

  assertNoTeacherOnlyLeakage(projection: any): boolean {
    return !projection.markingNotesTeacherOnly && !projection.teacherOnlyNotes;
  }

  assertNoHiddenReasoningLeakage(projection: any): boolean {
    return !projection.hiddenReasoning && !projection.chainOfThought;
  }

  assertNoFinalGradeLeakage(projection: any): boolean {
    return !projection.finalGrade && !projection.score;
  }

  assertNoParentReleaseLeakage(projection: any): boolean {
    return !projection.parentReleaseStatus;
  }

  assertNoMasteryMutationLeakage(projection: any): boolean {
    return !projection.masteryMutation;
  }
}
