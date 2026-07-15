import { FORBIDDEN_ACCESS_PREVIEW_FIELDS } from '../contracts/resultReportCardAccessContracts';

export class ResultReportCardAccessSafetyService {
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
    return this.checkFields(payload, ['answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary'], 'ANSWER_KEY_LEAKAGE', 'Answer key data detected in access payload');
  }

  assertNoRubricLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['rubricInternal', 'rubricText', 'rawRubric'], 'RUBRIC_LEAKAGE', 'Rubric data detected in access payload');
  }

  assertNoRawStudentAnswerLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkField(payload, 'rawStudentAnswer', 'RAW_STUDENT_ANSWER_LEAKAGE', 'Raw student answer detected in access payload');
  }

  assertNoTeacherOnlyLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['markingNotesTeacherOnly', 'teacherOnlyNotes'], 'TEACHER_ONLY_LEAKAGE', 'Teacher-only data detected in access payload');
  }

  assertNoHiddenReasoningLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['hiddenReasoning', 'chainOfThought', 'rawQuestionMetadata', 'selectionReasonInternal', 'markingAlgorithmInternals', 'moderationDecisionInternal', 'teacherOverrideInternal', 'auditInternals'], 'HIDDEN_REASONING_LEAKAGE', 'Hidden reasoning data detected in access payload');
  }

  assertNoUnreleasedGradeLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['unreleasedScore', 'unreleasedGrade', 'scoreBeforeFinalization', 'finalGradeBeforeRelease'], 'UNRELEASED_GRADE_LEAKAGE', 'Unreleased grade data detected in access payload');
  }

  assertNoLivePortalUrlLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['livePortalUrl', 'portalUrl'], 'LIVE_PORTAL_URL_LEAKAGE', 'Live portal URL detected in access payload');
  }

  assertNoSignedUrlLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkField(payload, 'signedUrl', 'SIGNED_URL_LEAKAGE', 'Signed URL detected in access payload');
  }

  assertNoAccessTokenLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['accessToken', 'refreshToken'], 'ACCESS_TOKEN_LEAKAGE', 'Access token detected in access payload');
  }

  assertNoLoginBypassLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['loginToken', 'jwt', 'sessionCookie', 'password'], 'LOGIN_BYPASS_LEAKAGE', 'Login bypass data detected in access payload');
  }

  assertNoRawContactLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['rawEmail', 'emailAddress', 'rawPhone', 'phoneNumber'], 'RAW_CONTACT_LEAKAGE', 'Raw contact data detected in access payload');
  }

  assertNoNotificationPayloadLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['notificationPayload', 'emailPayload', 'smsPayload', 'pushPayload', 'whatsAppPayload'], 'NOTIFICATION_PAYLOAD_LEAKAGE', 'Notification payload detected in access payload');
  }

  assertNoPdfBinaryLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['pdfBinary', 'pdfBuffer', 'pdfBase64'], 'PDF_BINARY_LEAKAGE', 'PDF binary detected in access payload');
  }

  assertNoHtmlExportLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['htmlExport', 'htmlFile'], 'HTML_EXPORT_LEAKAGE', 'HTML export detected in access payload');
  }

  assertNoExternalSyncPayloadLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkField(payload, 'externalSyncPayload', 'EXTERNAL_SYNC_PAYLOAD_LEAKAGE', 'External sync payload detected in access payload');
  }

  assertNoAiNarrativeLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkFields(payload, ['aiNarrative', 'generatedNarrative', 'modelOutput'], 'AI_NARRATIVE_LEAKAGE', 'AI narrative detected in access payload');
  }

  assertNoOcrTextLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    return this.checkField(payload, 'ocrText', 'OCR_TEXT_LEAKAGE', 'OCR text detected in access payload');
  }

  assertPreviewSafeForAudience(payload: Record<string, unknown>, audienceType: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    if (audienceType === 'student' || audienceType === 'parent') {
      const teacherCheck = this.assertNoTeacherOnlyLeakage(payload);
      if (!teacherCheck.allowed) return teacherCheck;
    }
    const checks = [
      this.assertNoUnreleasedGradeLeakage(payload),
      this.assertNoAiNarrativeLeakage(payload),
      this.assertNoAnswerKeyLeakage(payload),
      this.assertNoRawStudentAnswerLeakage(payload),
      this.assertNoRubricLeakage(payload),
    ];
    for (const c of checks) {
      if (!c.allowed) return c;
    }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'Preview safe for audience' };
  }

  assertRecipientDescriptorSafe(descriptor: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const forbidden = ['rawEmail', 'emailAddress', 'rawPhone', 'phoneNumber', 'password', 'jwt', 'accessToken', 'apiKey'];
    for (const f of forbidden) {
      if (descriptor[f] !== undefined) return { allowed: false, reasonCode: 'RECIPIENT_DESCRIPTOR_UNSAFE', safeMessage: `Forbidden field ${f} in recipient descriptor` };
    }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'Recipient descriptor is safe' };
  }

  assertTokenIntentHasNoSecret(intent: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const forbidden = ['tokenSecret', 'tokenHash', 'rawToken', 'signingKey'];
    for (const f of forbidden) {
      if (intent[f] !== undefined) return { allowed: false, reasonCode: 'TOKEN_INTENT_CONTAINS_SECRET', safeMessage: `Secret field ${f} found in token intent` };
    }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'Token intent has no secret' };
  }

  assertAcknowledgementSafe(ack: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    if (ack['liveNotificationPayload'] !== undefined) return { allowed: false, reasonCode: 'ACKNOWLEDGEMENT_UNSAFE', safeMessage: 'Live notification payload in acknowledgement' };
    const forbidden = ['pdfBinary', 'pdfBuffer', 'pdfBase64', 'livePortalUrl', 'signedUrl', 'accessToken'];
    for (const f of forbidden) {
      if (ack[f] !== undefined) return { allowed: false, reasonCode: 'ACKNOWLEDGEMENT_UNSAFE', safeMessage: `Forbidden field ${f} in acknowledgement` };
    }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'Acknowledgement is safe' };
  }

  assertAccessSummarySafe(summary: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const forbidden = ['livePortalUrl', 'signedUrl', 'accessToken', 'pdfBinary', 'rawEmail', 'rawPhone'];
    for (const f of forbidden) {
      if (summary[f] !== undefined) return { allowed: false, reasonCode: 'ACCESS_SUMMARY_UNSAFE', safeMessage: `Forbidden field ${f} in access summary` };
    }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'Access summary is safe' };
  }

  assertMockOnlyAccessOperation(mode: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const allowedModes = ['mock_portal_preview_only', 'future_access_only', 'metadata_only', 'admin_review_only', 'print_counter_preview_only'];
    if (allowedModes.includes(mode)) return { allowed: true, reasonCode: 'SAFE', safeMessage: `Mock access operation allowed for mode ${mode}` };
    return { allowed: false, reasonCode: 'LIVE_ACCESS_BLOCKED', safeMessage: `Live access mode ${mode} is blocked. Only mock-access modes are allowed.` };
  }
}
