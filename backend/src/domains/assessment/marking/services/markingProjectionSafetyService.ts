import { MarkingResultVersion, ReviewReasonCode } from '../contracts/markingContracts';
import { MarkingBreakdownItem } from '../contracts/markingResultContracts';
import { TeacherMarkingProjection, StudentMarkingProjection, ParentMarkingProjection } from '../contracts/projectionContracts';

const FORBIDDEN_STUDENT_FIELDS = ['answerKeySafeRef', 'correctAnswerSummary', 'markingNotesTeacherOnly', 'rubricInternal', 'teacherOnlyNotes', 'internalConfidenceReason', 'providerPrompt', 'providerResponse', 'hiddenReasoning', 'chainOfThought', 'rawStudentWork', 'rawStudentAnswer', 'moderationInternalNotes', 'overrideInternalNotes'];
const FORBIDDEN_PARENT_FIELDS = [...FORBIDDEN_STUDENT_FIELDS, 'answerKeyVersionId', 'rubricVersionId', 'confidence', 'requiresTeacherReview', 'reviewReasonCode', 'safeTeacherSummary', 'createdByActorId', 'createdByRole', 'markingMethod'];

export class MarkingProjectionSafetyService {
  toTeacherMarkingProjection(result: MarkingResultVersion, breakdowns?: MarkingBreakdownItem[]): TeacherMarkingProjection {
    return {
      markingResultVersionId: result.markingResultVersionId,
      markingRunId: result.markingRunId,
      questionId: result.questionId,
      questionVersionId: result.questionVersionId,
      status: result.status,
      questionType: result.questionType,
      markingMethod: result.markingMethod,
      marksAwarded: result.marksAwarded,
      marksAvailable: result.marksAvailable,
      confidence: result.confidence,
      requiresTeacherReview: result.requiresTeacherReview,
      reviewReasonCode: result.reviewReasonCode,
      safeStudentFeedback: result.safeStudentFeedback,
      safeTeacherSummary: result.safeTeacherSummary,
      rubricVersionId: result.rubricVersionId,
      answerKeyVersionId: result.answerKeyVersionId,
      createdByActorId: result.createdByActorId,
      createdAt: result.createdAt,
    };
  }

  toAdminMarkingProjection(full: MarkingResultVersion): TeacherMarkingProjection {
    return this.toTeacherMarkingProjection(full);
  }

  toStudentMarkingProjection(result: MarkingResultVersion): StudentMarkingProjection {
    return {
      markingResultVersionId: result.markingResultVersionId,
      status: result.status,
      marksAwarded: result.marksAwarded,
      marksAvailable: result.marksAvailable,
      safeStudentFeedback: result.safeStudentFeedback,
      requiresTeacherReview: result.requiresTeacherReview,
      createdAt: result.createdAt,
    };
  }

  toParentMarkingProjection(result: MarkingResultVersion): ParentMarkingProjection {
    return {
      markingResultVersionId: result.markingResultVersionId,
      status: result.status,
      marksAwarded: result.marksAwarded,
      marksAvailable: result.marksAvailable,
      safeStudentFeedback: result.safeStudentFeedback,
      createdAt: result.createdAt,
    };
  }

  assertNoAnswerKeyLeakage(projection: any): boolean {
    return !projection.answerKeySafeRef && !projection.correctAnswerSummary;
  }

  assertNoTeacherOnlyLeakage(projection: any): boolean {
    return !projection.markingNotesTeacherOnly && !projection.teacherOnlyNotes && !projection.rubricInternal;
  }

  assertNoHiddenReasoningLeakage(projection: any): boolean {
    return !projection.hiddenReasoning && !projection.chainOfThought && !projection.providerPrompt && !projection.providerResponse;
  }
}
