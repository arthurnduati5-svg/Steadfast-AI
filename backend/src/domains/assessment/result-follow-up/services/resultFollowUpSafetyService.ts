import { FORBIDDEN_FOLLOW_UP_FIELDS } from '../contracts/resultFollowUpContracts';

export class ResultFollowUpSafetyService {
  private checkField(payload: Record<string, unknown>, field: string, reasonCode: string, safeMessage: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    if (payload[field] !== undefined) return { allowed: false, reasonCode, safeMessage };
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No leakage detected' };
  }

  private checkFields(payload: Record<string, unknown>, fields: string[], reasonCode: string, safeMessage: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    for (const f of fields) {
      if (payload[f] !== undefined) return { allowed: false, reasonCode, safeMessage };
    }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No leakage detected' };
  }

  assertNoAnswerKeyLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary'], 'ANSWER_KEY_LEAKAGE', 'Answer key data detected');
  }

  assertNoRubricLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['rubricInternal', 'rubricText', 'rawRubric'], 'RUBRIC_LEAKAGE', 'Rubric data detected');
  }

  assertNoRawStudentAnswerLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkField(payload, 'rawStudentAnswer', 'RAW_STUDENT_ANSWER_LEAKAGE', 'Raw student answer detected');
  }

  assertNoTeacherOnlyLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['markingNotesTeacherOnly', 'teacherOnlyNotes'], 'TEACHER_ONLY_LEAKAGE', 'Teacher-only data detected');
  }

  assertNoHiddenReasoningLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['hiddenReasoning', 'chainOfThought'], 'HIDDEN_REASONING_LEAKAGE', 'Hidden reasoning data detected');
  }

  assertNoUnreleasedGradeLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['unreleasedScore', 'unreleasedGrade', 'scoreBeforeFinalization', 'finalGradeBeforeRelease'], 'UNRELEASED_GRADE_LEAKAGE', 'Unreleased grade data detected');
  }

  assertNoUnsafeDiagnosis(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['diagnosis', 'medicalAssessment', 'psychologicalAssessment', 'legalAssessment'], 'UNSAFE_DIAGNOSIS', 'Unsafe diagnosis detected');
  }

  assertNoUnsafeSafeguardingDisclosure(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['riskLabelUnsafe', 'safeguardingDetailsUnsafe'], 'UNSAFE_SAFEGUARDING_DISCLOSURE', 'Unsafe safeguarding disclosure detected');
  }

  assertNoNotificationPayload(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['parentNotificationPayload', 'studentNotificationPayload', 'teacherNotificationPayload', 'emailPayload', 'smsPayload', 'pushPayload', 'whatsAppPayload'], 'NOTIFICATION_PAYLOAD', 'Notification payload detected');
  }

  assertNoLiveTaskPayload(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['liveTaskPayload', 'calendarEventPayload'], 'LIVE_TASK_PAYLOAD', 'Live task payload detected');
  }

  assertNoExternalSyncPayload(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkField(payload, 'externalSyncPayload', 'EXTERNAL_SYNC_PAYLOAD', 'External sync payload detected');
  }

  assertNoProviderSecret(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['liveProviderPayload', 'apiKey', 'providerSecret'], 'PROVIDER_SECRET', 'Provider secret detected');
  }

  assertNoAiNarrative(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['aiNarrative', 'generatedNarrative', 'modelOutput'], 'AI_NARRATIVE', 'AI narrative detected');
  }

  assertNoOcrText(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkField(payload, 'ocrText', 'OCR_TEXT', 'OCR text detected');
  }

  assertNoPdfBinary(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['pdfBinary', 'pdfBuffer', 'pdfBase64'], 'PDF_BINARY', 'PDF binary detected');
  }

  assertNoHtmlExport(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['htmlExport', 'htmlFile'], 'HTML_EXPORT', 'HTML export detected');
  }

  assertNoScoreMutation(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['score', 'mark', 'grade', 'resultVersion'], 'SCORE_MUTATION', 'Score mutation detected');
  }

  assertParentGuidanceSafe(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const checks = [
      this.assertNoAnswerKeyLeakage(payload),
      this.assertNoRubricLeakage(payload),
      this.assertNoRawStudentAnswerLeakage(payload),
      this.assertNoTeacherOnlyLeakage(payload),
      this.assertNoHiddenReasoningLeakage(payload),
      this.assertNoUnsafeDiagnosis(payload),
      this.assertNoUnreleasedGradeLeakage(payload),
      this.assertNoNotificationPayload(payload),
    ];
    for (const c of checks) {
      if (!c.allowed) return c;
    }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'Parent guidance draft is safe' };
  }

  assertStudentReflectionSafe(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const forbidden = ['correctAnswer', 'finalAnswer', 'answerKey', 'modelAnswer'];
    for (const f of forbidden) {
      if (payload[f] !== undefined) return { allowed: false, reasonCode: 'ANSWER_LEAKAGE', safeMessage: `Forbidden field ${f} in reflection draft` };
    }
    const checks = [
      this.assertNoHiddenReasoningLeakage(payload),
      this.assertNoNotificationPayload(payload),
    ];
    for (const c of checks) {
      if (!c.allowed) return c;
    }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'Student reflection draft is safe' };
  }

  assertTeacherQueueItemSafe(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const checks = [
      this.assertNoNotificationPayload(payload),
      this.assertNoLiveTaskPayload(payload),
    ];
    for (const c of checks) {
      if (!c.allowed) return c;
    }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'Teacher queue item is safe' };
  }

  assertEscalationPlanSafe(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const checks = [
      this.assertNoUnsafeSafeguardingDisclosure(payload),
      this.assertNoNotificationPayload(payload),
    ];
    for (const c of checks) {
      if (!c.allowed) return c;
    }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'Escalation plan is safe' };
  }

  assertMockOnlyFollowUpOperation(mode: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const allowedModes = ['mock_action_only', 'future_action_only', 'teacher_review_only', 'metadata_only', 'mock_plan_only', 'mock_queue_only', 'mock_draft_only'];
    if (allowedModes.includes(mode)) return { allowed: true, reasonCode: 'SAFE', safeMessage: `Mock follow-up operation allowed for mode ${mode}` };
    return { allowed: false, reasonCode: 'LIVE_ACTION_BLOCKED', safeMessage: `Live follow-up mode ${mode} is blocked. Only mock-action/future-action modes are allowed.` };
  }
}
