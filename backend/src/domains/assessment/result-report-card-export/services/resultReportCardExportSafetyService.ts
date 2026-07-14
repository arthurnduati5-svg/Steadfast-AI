export class ResultReportCardExportSafetyService {
  assertNoAnswerKeyLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const forbidden = ['answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary'];
    for (const f of forbidden) { if (payload[f] !== undefined) return { allowed: false, reasonCode: 'ANSWER_KEY_LEAKAGE', safeMessage: 'Answer key data detected in export envelope' }; }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No answer key leakage detected' };
  }

  assertNoRubricLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const forbidden = ['rubricInternal', 'rubricText', 'rawRubric'];
    for (const f of forbidden) { if (payload[f] !== undefined) return { allowed: false, reasonCode: 'RUBRIC_LEAKAGE', safeMessage: 'Rubric data detected in export envelope' }; }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No rubric leakage detected' };
  }

  assertNoRawStudentAnswerLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    if (payload['rawStudentAnswer'] !== undefined) return { allowed: false, reasonCode: 'RAW_STUDENT_ANSWER_LEAKAGE', safeMessage: 'Raw student answer detected in export envelope' };
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No raw student answer leakage detected' };
  }

  assertNoTeacherOnlyLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const forbidden = ['markingNotesTeacherOnly', 'teacherOnlyNotes'];
    for (const f of forbidden) { if (payload[f] !== undefined) return { allowed: false, reasonCode: 'TEACHER_ONLY_LEAKAGE', safeMessage: 'Teacher-only data detected in export envelope' }; }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No teacher-only leakage detected' };
  }

  assertNoHiddenReasoningLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const forbidden = ['hiddenReasoning', 'chainOfThought', 'rawQuestionMetadata', 'selectionReasonInternal', 'markingAlgorithmInternals', 'moderationDecisionInternal', 'teacherOverrideInternal', 'auditInternals'];
    for (const f of forbidden) { if (payload[f] !== undefined) return { allowed: false, reasonCode: 'HIDDEN_REASONING_LEAKAGE', safeMessage: 'Hidden reasoning data detected in export envelope' }; }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No hidden reasoning leakage detected' };
  }

  assertNoUnreleasedGradeLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const forbidden = ['unreleasedScore', 'unreleasedGrade', 'scoreBeforeFinalization', 'finalGradeBeforeRelease'];
    for (const f of forbidden) { if (payload[f] !== undefined) return { allowed: false, reasonCode: 'UNRELEASED_GRADE_LEAKAGE', safeMessage: 'Unreleased grade data detected in export envelope' }; }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No unreleased grade leakage detected' };
  }

  assertNoLiveProviderPayloadLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    if (payload['liveProviderPayload'] !== undefined) return { allowed: false, reasonCode: 'LIVE_PROVIDER_PAYLOAD_LEAKAGE', safeMessage: 'Live provider payload detected in export envelope' };
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No live provider payload leakage detected' };
  }

  assertNoProviderSecretLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const forbidden = ['providerSecret', 'apiKey'];
    for (const f of forbidden) { if (payload[f] !== undefined) return { allowed: false, reasonCode: 'PROVIDER_SECRET_LEAKAGE', safeMessage: 'Provider secret detected in export envelope' }; }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No provider secret leakage detected' };
  }

  assertNoPortalPayloadLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    if (payload['portalPayload'] !== undefined) return { allowed: false, reasonCode: 'PORTAL_PAYLOAD_LEAKAGE', safeMessage: 'Portal payload detected in export envelope' };
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No portal payload leakage detected' };
  }

  assertNoNotificationPayloadLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const forbidden = ['notificationPayload', 'emailPayload', 'smsPayload', 'pushPayload', 'whatsAppPayload'];
    for (const f of forbidden) { if (payload[f] !== undefined) return { allowed: false, reasonCode: 'NOTIFICATION_PAYLOAD_LEAKAGE', safeMessage: 'Notification payload detected in export envelope' }; }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No notification payload leakage detected' };
  }

  assertNoPdfBinaryLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const forbidden = ['pdfBinary', 'pdfBuffer', 'pdfBase64'];
    for (const f of forbidden) { if (payload[f] !== undefined) return { allowed: false, reasonCode: 'PDF_BINARY_LEAKAGE', safeMessage: 'PDF binary detected in export envelope' }; }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No PDF binary leakage detected' };
  }

  assertNoHtmlExportLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const forbidden = ['htmlExport', 'htmlFile'];
    for (const f of forbidden) { if (payload[f] !== undefined) return { allowed: false, reasonCode: 'HTML_EXPORT_LEAKAGE', safeMessage: 'HTML export detected in export envelope' }; }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No HTML export leakage detected' };
  }

  assertNoExternalSyncPayloadLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    if (payload['externalSyncPayload'] !== undefined) return { allowed: false, reasonCode: 'EXTERNAL_SYNC_PAYLOAD_LEAKAGE', safeMessage: 'External sync payload detected in export envelope' };
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No external sync payload leakage detected' };
  }

  assertNoAiNarrativeLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const forbidden = ['aiNarrative', 'generatedNarrative', 'modelOutput'];
    for (const f of forbidden) { if (payload[f] !== undefined) return { allowed: false, reasonCode: 'AI_NARRATIVE_LEAKAGE', safeMessage: 'AI narrative detected in export envelope' }; }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No AI narrative leakage detected' };
  }

  assertNoOcrTextLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    if (payload['ocrText'] !== undefined) return { allowed: false, reasonCode: 'OCR_TEXT_LEAKAGE', safeMessage: 'OCR text detected in export envelope' };
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No OCR text leakage detected' };
  }

  assertNoRawMasteryDeltaLeakage(payload: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const forbidden = ['rawMasteryDelta', 'beforeStateJson', 'afterStateJson', 'deltaJson'];
    for (const f of forbidden) { if (payload[f] !== undefined) return { allowed: false, reasonCode: 'RAW_MASTERY_DELTA_LEAKAGE', safeMessage: 'Raw mastery delta detected in export envelope' }; }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'No raw mastery delta leakage detected' };
  }

  assertEnvelopeSafeForAudience(payload: Record<string, unknown>, audienceType: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    if (audienceType === 'student' || audienceType === 'parent') {
      const teacherCheck = this.assertNoTeacherOnlyLeakage(payload);
      if (!teacherCheck.allowed) return teacherCheck;
    }
    const unreleasedCheck = this.assertNoUnreleasedGradeLeakage(payload);
    if (!unreleasedCheck.allowed) return unreleasedCheck;
    const aiCheck = this.assertNoAiNarrativeLeakage(payload);
    if (!aiCheck.allowed) return aiCheck;
    const answerKeyCheck = this.assertNoAnswerKeyLeakage(payload);
    if (!answerKeyCheck.allowed) return answerKeyCheck;
    const rawAnswerCheck = this.assertNoRawStudentAnswerLeakage(payload);
    if (!rawAnswerCheck.allowed) return rawAnswerCheck;
    const rubricCheck = this.assertNoRubricLeakage(payload);
    if (!rubricCheck.allowed) return rubricCheck;
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'Envelope safe for audience' };
  }

  assertReceiptSafe(receipt: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const pdfFields = ['pdfBinary', 'pdfBuffer', 'pdfBase64'];
    for (const f of pdfFields) { if (receipt[f] !== undefined) return { allowed: false, reasonCode: 'PDF_BINARY_LEAKAGE', safeMessage: 'PDF binary detected in receipt' }; }
    if (receipt['liveProviderResponse'] !== undefined) return { allowed: false, reasonCode: 'LIVE_PROVIDER_PAYLOAD_LEAKAGE', safeMessage: 'Live provider response detected in receipt' };
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'Receipt is safe' };
  }

  assertArchiveManifestSafe(manifest: Record<string, unknown>): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const forbidden = ['pdfBinary', 'pdfBuffer', 'pdfBase64', 'liveProviderPayload', 'providerSecret', 'apiKey', 'aiNarrative', 'generatedNarrative', 'modelOutput'];
    for (const f of forbidden) { if (manifest[f] !== undefined) return { allowed: false, reasonCode: 'ARCHIVE_MANIFEST_UNSAFE', safeMessage: `Forbidden field ${f} detected in archive manifest` }; }
    return { allowed: true, reasonCode: 'SAFE', safeMessage: 'Archive manifest is safe' };
  }

  assertMockOnlyOperation(mode: string): { allowed: boolean; reasonCode: string; safeMessage: string } {
    const allowedModes = ['mock_export_only', 'dry_run_only', 'preflight_only', 'archive_manifest_only'];
    if (allowedModes.includes(mode)) return { allowed: true, reasonCode: 'SAFE', safeMessage: `Mock operation allowed for mode ${mode}` };
    return { allowed: false, reasonCode: 'LIVE_EXPORT_BLOCKED', safeMessage: `Live export mode ${mode} is blocked. Only mock-export modes are allowed.` };
  }
}
