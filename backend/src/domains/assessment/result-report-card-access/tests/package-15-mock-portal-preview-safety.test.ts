import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryResultReportCardPortalPreviewRepository,
} from '../repositories/inMemoryResultReportCardAccessRepositories';
import { FORBIDDEN_ACCESS_PREVIEW_FIELDS } from '../contracts/resultReportCardAccessContracts';
import {
  evaluateReportCardPortalPreviewCompositionPolicy,
  evaluateReportCardAccessNoLivePortalPolicy,
} from '../policies/resultReportCardAccessPolicyDefinitions';
import { ResultReportCardAccessSafetyService } from '../services/resultReportCardAccessSafetyService';

function makePreviewInput() {
  return {
    resultReportCardAccessGrantId: 'grant-1',
    resultReportCardAccessRecipientId: 'recipient-1',
    previewMode: 'mock_portal_preview_only' as const,
    safePreviewSummary: 'Mock portal preview for parent',
    safePayloadJson: { studentName: 'John', grade: 'A' } as Record<string, unknown>,
    schoolId: 'school-1',
    createdByActorId: 'actor-1',
    createdByRole: 'teacher',
  };
}

describe('Package 15 — Mock Portal Preview Safety', () => {
  let previewRepo: InMemoryResultReportCardPortalPreviewRepository;
  let safetyService: ResultReportCardAccessSafetyService;

  beforeEach(() => {
    previewRepo = new InMemoryResultReportCardPortalPreviewRepository();
    safetyService = new ResultReportCardAccessSafetyService();
  });

  it('mock portal preview can be composed from safe export envelope', async () => {
    const preview = await previewRepo.create(makePreviewInput());
    expect(preview).toBeDefined();
    expect(preview.previewStatus).toBe('draft');
    expect(preview.resultReportCardPortalPreviewId).toBeTruthy();
  });

  it('preview can be sealed only after safety checks (updateStatus to sealed)', async () => {
    const preview = await previewRepo.create(makePreviewInput());
    const composed = await previewRepo.updateStatus(preview.resultReportCardPortalPreviewId, { status: 'composed', reasonCode: 'COMPOSED', safeMessage: 'Composed' });
    expect(composed.previewStatus).toBe('composed');

    const sealed = await previewRepo.seal(composed.resultReportCardPortalPreviewId);
    expect(sealed.previewStatus).toBe('sealed');
    expect(sealed.sealedAt).toBeTruthy();
  });

  it('preview with answer keys is blocked via FORBIDDEN_ACCESS_PREVIEW_FIELDS', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('answerKeySafeRef');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('answerKeyText');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('correctAnswerSummary');

    const result = safetyService.assertNoAnswerKeyLeakage({ answerKeySafeRef: 'ref-1' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('ANSWER_KEY_LEAKAGE');
  });

  it('preview with raw rubrics is blocked', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('rubricInternal');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('rubricText');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('rawRubric');

    const result = safetyService.assertNoRubricLeakage({ rubricInternal: 'internal rubric' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('RUBRIC_LEAKAGE');
  });

  it('preview with raw student answers is blocked', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('rawStudentAnswer');

    const result = safetyService.assertNoRawStudentAnswerLeakage({ rawStudentAnswer: 'student answer' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('RAW_STUDENT_ANSWER_LEAKAGE');
  });

  it('preview with hidden reasoning is blocked', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('hiddenReasoning');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('chainOfThought');

    const result = safetyService.assertNoHiddenReasoningLeakage({ hiddenReasoning: 'teacher reasoning' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('HIDDEN_REASONING_LEAKAGE');
  });

  it('preview with teacher-only leakage to parent/student is blocked', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('teacherOnlyNotes');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('markingNotesTeacherOnly');

    const result = safetyService.assertNoTeacherOnlyLeakage({ teacherOnlyNotes: 'confidential' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('TEACHER_ONLY_LEAKAGE');
  });

  it('preview with live portal URL is blocked', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('livePortalUrl');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('portalUrl');

    const result = safetyService.assertNoLivePortalUrlLeakage({ livePortalUrl: 'https://portal.example.com' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LIVE_PORTAL_URL_LEAKAGE');
  });

  it('preview with signed URL is blocked', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('signedUrl');

    const result = safetyService.assertNoSignedUrlLeakage({ signedUrl: 'https://signed.example.com/abc' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('SIGNED_URL_LEAKAGE');
  });

  it('preview with token is blocked', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('accessToken');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('refreshToken');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('loginToken');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('jwt');

    const result = safetyService.assertNoAccessTokenLeakage({ accessToken: 'tok_xyz' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('ACCESS_TOKEN_LEAKAGE');
  });

  it('preview with PDF binary is blocked', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('pdfBinary');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('pdfBuffer');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('pdfBase64');

    const result = safetyService.assertNoPdfBinaryLeakage({ pdfBinary: 'binary data' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('PDF_BINARY_LEAKAGE');
  });

  it('preview with HTML export is blocked', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('htmlExport');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('htmlFile');

    const result = safetyService.assertNoHtmlExportLeakage({ htmlExport: '<html>...</html>' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('HTML_EXPORT_LEAKAGE');
  });

  it('preview with external sync payload is blocked', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('externalSyncPayload');

    const result = safetyService.assertNoExternalSyncPayloadLeakage({ externalSyncPayload: { data: 'sync' } });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('EXTERNAL_SYNC_PAYLOAD_LEAKAGE');
  });

  it('preview with AI narrative is blocked', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('aiNarrative');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('generatedNarrative');
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('modelOutput');

    const result = safetyService.assertNoAiNarrativeLeakage({ aiNarrative: 'AI generated text' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('AI_NARRATIVE_LEAKAGE');
  });

  it('preview with OCR text is blocked', () => {
    expect(FORBIDDEN_ACCESS_PREVIEW_FIELDS).toContain('ocrText');

    const result = safetyService.assertNoOcrTextLeakage({ ocrText: 'OCR content' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('OCR_TEXT_LEAKAGE');
  });

  it('no live portal policy blocks all', () => {
    const result = evaluateReportCardAccessNoLivePortalPolicy({ schoolId: 'school-1', actorRole: 'teacher' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LIVE_PORTAL_BLOCKED');
  });

  it('preview can be suppressed', async () => {
    const preview = await previewRepo.create(makePreviewInput());
    const suppressed = await previewRepo.suppress(preview.resultReportCardPortalPreviewId, 'POLICY_SUPPRESSED', 'Suppressed');
    expect(suppressed.previewStatus).toBe('suppressed');
  });

  it('preview can be blocked', async () => {
    const preview = await previewRepo.create(makePreviewInput());
    const blocked = await previewRepo.block(preview.resultReportCardPortalPreviewId, 'POLICY_BLOCKED', 'Blocked');
    expect(blocked.previewStatus).toBe('blocked');
  });

  it('preview can be voided', async () => {
    const preview = await previewRepo.create(makePreviewInput());
    const voided = await previewRepo.void(preview.resultReportCardPortalPreviewId, 'USER_REQUEST', 'Voided');
    expect(voided.previewStatus).toBe('void');
  });
});
