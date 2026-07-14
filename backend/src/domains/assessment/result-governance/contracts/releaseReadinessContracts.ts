export interface ResultReleaseReadiness {
  resultReleaseReadinessId: string;
  schoolId: string;
  resultFinalizationDecisionId: string;
  resultFinalizationReviewId?: string;
  markingInvocationRequestId?: string;
  releaseReadinessStatus: string;
  releaseAudienceType: string;
  safeReadinessSummary: string;
  blockingReasonCodesJson?: Record<string, unknown>;
  allowedChannelRefsJson?: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface ReleaseBoundaryFieldRule {
  allowedFields: string[];
  blockedFields: string[];
  redactionRules?: Record<string, unknown>;
}

export const FORBIDDEN_FIELDS_STUDENT = [
  'answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary',
  'rubricInternal', 'rubricText', 'markingNotesTeacherOnly', 'teacherOnlyNotes',
  'hiddenReasoning', 'chainOfThought', 'rawQuestionMetadata',
  'selectionReasonInternal', 'markingAlgorithmInternals', 'moderationDecisionInternal',
  'teacherOverrideInternal', 'auditInternals', 'rawStudentAnswer',
  'scoreBeforeFinalization', 'unreleasedScore', 'finalGradeBeforeRelease',
  'parentDeliveryPayload', 'masteryMutation',
] as const;

export const FORBIDDEN_FIELDS_PARENT = [
  'answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary',
  'rubricInternal', 'rubricText', 'markingNotesTeacherOnly', 'teacherOnlyNotes',
  'hiddenReasoning', 'chainOfThought', 'rawQuestionMetadata',
  'selectionReasonInternal', 'markingAlgorithmInternals', 'moderationDecisionInternal',
  'teacherOverrideInternal', 'auditInternals', 'rawStudentAnswer',
  'scoreBeforeFinalization', 'unreleasedScore', 'finalGradeBeforeRelease',
  'parentDeliveryPayload', 'masteryMutation',
] as const;
