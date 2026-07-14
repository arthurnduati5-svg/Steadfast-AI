import type {
  ResultReleaseSafeEnvelope,
  ResultReleaseCommandContext,
} from '../contracts';

const FORBIDDEN_IN_STUDENT_PARENT: string[] = [
  'answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary', 'rubricInternal', 'rubricText',
  'rawRubric', 'markingNotesTeacherOnly', 'teacherOnlyNotes', 'hiddenReasoning', 'chainOfThought',
  'rawQuestionMetadata', 'selectionReasonInternal', 'markingAlgorithmInternals', 'moderationDecisionInternal',
  'teacherOverrideInternal', 'auditInternals', 'rawStudentAnswer', 'unreleasedScore', 'unreleasedGrade',
  'scoreBeforeFinalization', 'finalGradeBeforeRelease', 'parentDeliveryPayload', 'studentDeliveryPayload',
  'pdfPayload', 'portalPayload', 'notificationPayload', 'rawMasteryDelta', 'beforeStateJson',
  'afterStateJson', 'deltaJson',
];

function envelope(ctx: ResultReleaseCommandContext, overrides: Partial<ResultReleaseSafeEnvelope>): ResultReleaseSafeEnvelope {
  return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
}

export class ResultReleaseProjectionSafetyService {
  async toTeacherProjection(ctx: ResultReleaseCommandContext, data: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    return envelope(ctx, { safeMessage: 'Teacher projection generated', data });
  }

  async toAdminProjection(ctx: ResultReleaseCommandContext, data: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    return envelope(ctx, { safeMessage: 'Admin projection generated', data });
  }

  async toStudentSafeProjection(
    ctx: ResultReleaseCommandContext,
    data: Record<string, unknown>,
  ): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const redacted = this.redactForbiddenFields(data);
    const safeProjection = {
      studentRef: redacted.studentRef ?? '',
      safeAchievementSummary: redacted.safeAchievementSummary ?? '',
      safeLearningProgressSummary: redacted.safeLearningProgressSummary ?? '',
      safeNextPracticeSummary: redacted.safeNextPracticeSummary ?? '',
      safeRevisionGuidance: redacted.safeRevisionGuidance ?? '',
      safeSupportGuidance: redacted.safeSupportGuidance ?? '',
      safeStatusSummary: redacted.safeStatusSummary ?? '',
      allowedFieldNames: ['studentRef', 'safeAchievementSummary', 'safeLearningProgressSummary', 'safeNextPracticeSummary', 'safeRevisionGuidance', 'safeSupportGuidance', 'safeStatusSummary', 'allowedFieldNames', 'blockedFieldNames', 'availableNextActions'],
      blockedFieldNames: FORBIDDEN_IN_STUDENT_PARENT,
      availableNextActions: ['viewReportSnapshot'],
    };
    return envelope(ctx, { safeMessage: 'Student-safe projection generated', data: safeProjection });
  }

  async toParentBoundaryProjection(
    ctx: ResultReleaseCommandContext,
    data: Record<string, unknown>,
  ): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const redacted = this.redactForbiddenFields(data);
    const parentProjection = {
      studentRef: redacted.studentRef ?? '',
      safeProgressSummary: redacted.safeProgressSummary ?? '',
      safeSupportSummary: redacted.safeSupportSummary ?? '',
      safeStrengths: redacted.safeStrengths ?? [],
      safeGrowthAreas: redacted.safeGrowthAreas ?? [],
      safeRecommendedSupport: redacted.safeRecommendedSupport ?? '',
      notYetReleasedReason: redacted.notYetReleasedReason ?? '',
      allowedFieldNames: ['studentRef', 'safeProgressSummary', 'safeSupportSummary', 'safeStrengths', 'safeGrowthAreas', 'safeRecommendedSupport', 'notYetReleasedReason', 'allowedFieldNames', 'blockedFieldNames', 'availableNextActions'],
      blockedFieldNames: FORBIDDEN_IN_STUDENT_PARENT,
      availableNextActions: ['viewParentSummary'],
    };
    return envelope(ctx, { safeMessage: 'Parent-boundary projection generated', data: parentProjection });
  }

  async toReleasePacketPreview(ctx: ResultReleaseCommandContext, data: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    return envelope(ctx, { safeMessage: 'Release packet preview generated', data });
  }

  async toReportSnapshotPreview(ctx: ResultReleaseCommandContext, data: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    return envelope(ctx, { safeMessage: 'Report snapshot preview generated', data });
  }

  async toDeliveryIntentPreview(ctx: ResultReleaseCommandContext, data: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    return envelope(ctx, { safeMessage: 'Delivery intent preview generated', data });
  }

  async assertNoAnswerKeyLeakage(ctx: ResultReleaseCommandContext, payload: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['answerKeySafeRef'] || payload['answerKeyText'] || payload['correctAnswerSummary']) return envelope(ctx, { ok: false, safeMessage: 'Answer key leakage detected', reasonCode: 'ANSWER_KEY_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No answer key leakage' });
  }

  async assertNoRubricLeakage(ctx: ResultReleaseCommandContext, payload: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['rubricInternal'] || payload['rubricText'] || payload['rawRubric']) return envelope(ctx, { ok: false, safeMessage: 'Rubric leakage detected', reasonCode: 'RUBRIC_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No rubric leakage' });
  }

  async assertNoRawStudentAnswerLeakage(ctx: ResultReleaseCommandContext, payload: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['rawStudentAnswer']) return envelope(ctx, { ok: false, safeMessage: 'Raw student answer leakage detected', reasonCode: 'RAW_STUDENT_ANSWER_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No raw student answer leakage' });
  }

  async assertNoTeacherOnlyLeakage(ctx: ResultReleaseCommandContext, payload: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['markingNotesTeacherOnly'] || payload['teacherOnlyNotes']) return envelope(ctx, { ok: false, safeMessage: 'Teacher-only leakage detected', reasonCode: 'TEACHER_ONLY_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No teacher-only leakage' });
  }

  async assertNoHiddenReasoningLeakage(ctx: ResultReleaseCommandContext, payload: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['hiddenReasoning'] || payload['chainOfThought'] || payload['selectionReasonInternal']) return envelope(ctx, { ok: false, safeMessage: 'Hidden reasoning leakage detected', reasonCode: 'HIDDEN_REASONING_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No hidden reasoning leakage' });
  }

  async assertNoUnreleasedGradeLeakage(ctx: ResultReleaseCommandContext, payload: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['unreleasedScore'] || payload['unreleasedGrade'] || payload['scoreBeforeFinalization'] || payload['finalGradeBeforeRelease']) return envelope(ctx, { ok: false, safeMessage: 'Unreleased grade leakage detected', reasonCode: 'UNRELEASED_GRADE_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No unreleased grade leakage' });
  }

  async assertNoParentDeliveryPayloadLeakage(ctx: ResultReleaseCommandContext, payload: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['parentDeliveryPayload']) return envelope(ctx, { ok: false, safeMessage: 'Parent delivery payload leakage detected', reasonCode: 'PARENT_DELIVERY_PAYLOAD_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No parent delivery payload leakage' });
  }

  async assertNoStudentDeliveryPayloadLeakage(ctx: ResultReleaseCommandContext, payload: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['studentDeliveryPayload']) return envelope(ctx, { ok: false, safeMessage: 'Student delivery payload leakage detected', reasonCode: 'STUDENT_DELIVERY_PAYLOAD_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No student delivery payload leakage' });
  }

  async assertNoPortalPayloadLeakage(ctx: ResultReleaseCommandContext, payload: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['portalPayload']) return envelope(ctx, { ok: false, safeMessage: 'Portal payload leakage detected', reasonCode: 'PORTAL_PAYLOAD_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No portal payload leakage' });
  }

  async assertNoNotificationPayloadLeakage(ctx: ResultReleaseCommandContext, payload: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['notificationPayload']) return envelope(ctx, { ok: false, safeMessage: 'Notification payload leakage detected', reasonCode: 'NOTIFICATION_PAYLOAD_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No notification payload leakage' });
  }

  async assertNoPdfPayloadLeakage(ctx: ResultReleaseCommandContext, payload: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['pdfPayload']) return envelope(ctx, { ok: false, safeMessage: 'PDF payload leakage detected', reasonCode: 'PDF_PAYLOAD_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No PDF payload leakage' });
  }

  async assertNoRawMasteryDeltaLeakage(ctx: ResultReleaseCommandContext, payload: Record<string, unknown>): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (payload['rawMasteryDelta']) return envelope(ctx, { ok: false, safeMessage: 'Raw mastery delta leakage detected', reasonCode: 'RAW_MASTERY_DELTA_LEAKAGE', status: 'blocked' });
    return envelope(ctx, { safeMessage: 'No raw mastery delta leakage' });
  }

  private redactForbiddenFields(data: Record<string, unknown>): Record<string, unknown> {
    const cleaned = { ...data };
    for (const field of FORBIDDEN_IN_STUDENT_PARENT) delete cleaned[field];
    return cleaned;
  }
}
