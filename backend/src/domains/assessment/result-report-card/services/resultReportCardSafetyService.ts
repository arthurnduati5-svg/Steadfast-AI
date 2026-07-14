import { FORBIDDEN_REPORT_CARD_FIELDS } from '../contracts/resultReportCardContracts';

type SafetyResult = { safe: boolean; reasonCode?: string; safeMessage?: string };

export class ResultReportCardSafetyService {
  async assertNoAnswerKeyLeakage(content: Record<string, unknown>): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    const answerKeyFields = ['answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary'];
    const result = this.checkForbiddenKeys(content, answerKeyFields);
    if (!result.safe) return { safe: false, reasonCode: 'ANSWER_KEY_LEAKAGE', safeMessage: 'Answer key leakage detected' };
    return { safe: true };
  }

  async assertNoRubricLeakage(content: Record<string, unknown>): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    const rubricFields = ['rubricInternal', 'rubricText', 'rawRubric'];
    const result = this.checkForbiddenKeys(content, rubricFields);
    if (!result.safe) return { safe: false, reasonCode: 'RUBRIC_LEAKAGE', safeMessage: 'Rubric leakage detected' };
    return { safe: true };
  }

  async assertNoRawStudentAnswerLeakage(content: Record<string, unknown>): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    const result = this.checkForbiddenKeys(content, ['rawStudentAnswer']);
    if (!result.safe) return { safe: false, reasonCode: 'RAW_STUDENT_ANSWER_LEAKAGE', safeMessage: 'Raw student answer leakage detected' };
    return { safe: true };
  }

  async assertNoTeacherOnlyLeakage(content: Record<string, unknown>, audienceType: string): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    if (audienceType === 'teacher' || audienceType === 'admin') return { safe: true };
    const teacherOnlyFields = ['markingNotesTeacherOnly', 'teacherOnlyNotes'];
    const result = this.checkForbiddenKeys(content, teacherOnlyFields);
    if (!result.safe) return { safe: false, reasonCode: 'TEACHER_ONLY_LEAKAGE', safeMessage: 'Teacher-only leakage detected' };
    return { safe: true };
  }

  async assertNoHiddenReasoningLeakage(content: Record<string, unknown>): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    const hiddenFields = ['hiddenReasoning', 'chainOfThought', 'selectionReasonInternal'];
    const result = this.checkForbiddenKeys(content, hiddenFields);
    if (!result.safe) return { safe: false, reasonCode: 'HIDDEN_REASONING_LEAKAGE', safeMessage: 'Hidden reasoning leakage detected' };
    return { safe: true };
  }

  async assertNoUnreleasedGradeLeakage(content: Record<string, unknown>): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    const unreleasedFields = ['unreleasedScore', 'unreleasedGrade', 'scoreBeforeFinalization', 'finalGradeBeforeRelease'];
    const result = this.checkForbiddenKeys(content, unreleasedFields);
    if (!result.safe) return { safe: false, reasonCode: 'UNRELEASED_GRADE_LEAKAGE', safeMessage: 'Unreleased grade leakage detected' };
    return { safe: true };
  }

  async assertNoLiveProviderPayloadLeakage(content: Record<string, unknown>): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    const providerFields = ['liveProviderPayload', 'providerSecret', 'apiKey'];
    const result = this.checkForbiddenKeys(content, providerFields);
    if (!result.safe) return { safe: false, reasonCode: 'LIVE_PROVIDER_PAYLOAD_LEAKAGE', safeMessage: 'Live provider payload leakage detected' };
    return { safe: true };
  }

  async assertNoProviderSecretLeakage(content: Record<string, unknown>): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    const secretFields = ['providerSecret', 'apiKey'];
    const result = this.checkForbiddenKeys(content, secretFields);
    if (!result.safe) return { safe: false, reasonCode: 'PROVIDER_SECRET_LEAKAGE', safeMessage: 'Provider secret leakage detected' };
    return { safe: true };
  }

  async assertNoPortalPayloadLeakage(content: Record<string, unknown>): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    const result = this.checkForbiddenKeys(content, ['portalPayload']);
    if (!result.safe) return { safe: false, reasonCode: 'PORTAL_PAYLOAD_LEAKAGE', safeMessage: 'Portal payload leakage detected' };
    return { safe: true };
  }

  async assertNoNotificationPayloadLeakage(content: Record<string, unknown>): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    const result = this.checkForbiddenKeys(content, ['notificationPayload']);
    if (!result.safe) return { safe: false, reasonCode: 'NOTIFICATION_PAYLOAD_LEAKAGE', safeMessage: 'Notification payload leakage detected' };
    return { safe: true };
  }

  async assertNoPdfBinaryLeakage(content: Record<string, unknown>): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    const pdfFields = ['pdfBinary', 'pdfBuffer', 'pdfBase64'];
    const result = this.checkForbiddenKeys(content, pdfFields);
    if (!result.safe) return { safe: false, reasonCode: 'PDF_BINARY_LEAKAGE', safeMessage: 'PDF binary leakage detected' };
    return { safe: true };
  }

  async assertNoExternalSyncPayloadLeakage(content: Record<string, unknown>): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    const result = this.checkForbiddenKeys(content, ['externalSyncPayload']);
    if (!result.safe) return { safe: false, reasonCode: 'EXTERNAL_SYNC_PAYLOAD_LEAKAGE', safeMessage: 'External sync payload leakage detected' };
    return { safe: true };
  }

  async assertNoAiNarrativeLeakage(content: Record<string, unknown>): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    const aiFields = ['aiNarrative', 'generatedNarrative', 'modelOutput'];
    const result = this.checkForbiddenKeys(content, aiFields);
    if (!result.safe) return { safe: false, reasonCode: 'AI_NARRATIVE_LEAKAGE', safeMessage: 'AI narrative leakage detected' };
    return { safe: true };
  }

  async assertNoOcrTextLeakage(content: Record<string, unknown>): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    const result = this.checkForbiddenKeys(content, ['ocrText']);
    if (!result.safe) return { safe: false, reasonCode: 'OCR_TEXT_LEAKAGE', safeMessage: 'OCR text leakage detected' };
    return { safe: true };
  }

  async assertNoRawMasteryDeltaLeakage(content: Record<string, unknown>): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    const result = this.checkForbiddenKeys(content, ['rawMasteryDelta']);
    if (!result.safe) return { safe: false, reasonCode: 'RAW_MASTERY_DELTA_LEAKAGE', safeMessage: 'Raw mastery delta leakage detected' };
    return { safe: true };
  }

  async assertStudentProjectionSafe(projection: Record<string, unknown>): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    const studentForbidden = ['teacherOnlyNotes', 'markingNotesTeacherOnly', 'auditInternals', 'moderationDecisionInternal', 'teacherOverrideInternal', 'liveProviderPayload', 'providerSecret', 'apiKey', 'pdfBinary', 'pdfBuffer', 'pdfBase64', 'rawMasteryDelta', 'aiNarrative', 'generatedNarrative', 'modelOutput'];
    const result = this.checkForbiddenKeys(projection, studentForbidden);
    if (!result.safe) return { safe: false, reasonCode: 'STUDENT_PROJECTION_UNSAFE', safeMessage: 'Student projection contains forbidden fields' };
    return { safe: true };
  }

  async assertParentProjectionSafe(projection: Record<string, unknown>): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    const parentForbidden = ['teacherOnlyNotes', 'markingNotesTeacherOnly', 'auditInternals', 'moderationDecisionInternal', 'teacherOverrideInternal', 'liveProviderPayload', 'providerSecret', 'apiKey', 'pdfBinary', 'pdfBuffer', 'pdfBase64', 'rawMasteryDelta', 'aiNarrative', 'generatedNarrative', 'modelOutput'];
    const result = this.checkForbiddenKeys(projection, parentForbidden);
    if (!result.safe) return { safe: false, reasonCode: 'PARENT_PROJECTION_UNSAFE', safeMessage: 'Parent projection contains forbidden fields' };
    return { safe: true };
  }

  async assertTeacherProjectionSafe(projection: Record<string, unknown>): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    const teacherForbidden = ['liveProviderPayload', 'providerSecret', 'apiKey', 'pdfBinary', 'pdfBuffer', 'pdfBase64'];
    const result = this.checkForbiddenKeys(projection, teacherForbidden);
    if (!result.safe) return { safe: false, reasonCode: 'TEACHER_PROJECTION_UNSAFE', safeMessage: 'Teacher projection contains forbidden fields' };
    return { safe: true };
  }

  async assertAdminProjectionSafe(projection: Record<string, unknown>): Promise<{ safe: boolean; reasonCode?: string; safeMessage?: string }> {
    const adminForbidden = ['liveProviderPayload', 'providerSecret', 'apiKey', 'pdfBinary', 'pdfBuffer', 'pdfBase64'];
    const result = this.checkForbiddenKeys(projection, adminForbidden);
    if (!result.safe) return { safe: false, reasonCode: 'ADMIN_PROJECTION_UNSAFE', safeMessage: 'Admin projection contains forbidden fields' };
    return { safe: true };
  }

  private checkForbiddenKeys(content: Record<string, unknown>, forbiddenKeys: string[]): { safe: boolean } {
    for (const key of Object.keys(content)) {
      if (forbiddenKeys.includes(key)) {
        return { safe: false };
      }
    }
    return { safe: true };
  }
}
