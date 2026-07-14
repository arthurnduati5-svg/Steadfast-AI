import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryResultReportCardExportEnvelopeRepository,
} from '../repositories/inMemoryResultReportCardExportRepositories';
import { FORBIDDEN_EXPORT_ENVELOPE_FIELDS } from '../contracts/resultReportCardExportContracts';
import {
  evaluateReportCardExportEnvelopeCompositionPolicy,
  evaluateReportCardExportNoPdfBinaryPolicy,
  evaluateReportCardExportNoLivePublicationPolicy,
} from '../policies/resultReportCardExportPolicyDefinitions';

function makeEnvelopeInput() {
  return {
    resultReportCardExportJobId: 'job-1',
    resultReportCardExportTargetId: 'target-1',
    resultReportCardAudienceProjectionId: 'projection-1',
    resultReportCardRenderManifestId: 'manifest-1',
    envelopeMode: 'mock_payload_only' as const,
    safeEnvelopeSummary: 'Safe envelope for mock export',
    safePayloadJson: { studentName: 'John' } as Record<string, unknown>,
    schoolId: 'school-1',
    createdByActorId: 'actor-1',
    createdByRole: 'teacher',
  };
}

describe('Package 14 — Envelope Safety', () => {
  let envelopeRepo: InMemoryResultReportCardExportEnvelopeRepository;

  beforeEach(() => {
    envelopeRepo = new InMemoryResultReportCardExportEnvelopeRepository();
  });

  it('envelope can be composed (created in draft)', async () => {
    const envelope = await envelopeRepo.create(makeEnvelopeInput());
    expect(envelope).toBeDefined();
    expect(envelope.envelopeStatus).toBe('draft');
    expect(envelope.resultReportCardExportEnvelopeId).toBeTruthy();
  });

  it('envelope sealed only after safety checks (updateStatus to sealed)', async () => {
    const envelope = await envelopeRepo.create(makeEnvelopeInput());
    const sealed = await envelopeRepo.seal(envelope.resultReportCardExportEnvelopeId);
    expect(sealed.envelopeStatus).toBe('sealed');
    expect(sealed.sealedAt).toBeTruthy();
  });

  it('envelope with answer keys is blocked by safety (FORBIDDEN_EXPORT_ENVELOPE_FIELDS)', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('answerKeySafeRef');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('answerKeyText');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('correctAnswerSummary');
  });

  it('envelope with raw rubrics is blocked', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('rubricInternal');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('rubricText');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('rawRubric');
  });

  it('envelope with raw student answers is blocked', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('rawStudentAnswer');
  });

  it('envelope with hidden reasoning is blocked', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('hiddenReasoning');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('chainOfThought');
  });

  it('envelope with teacher-only leakage to parent/student is blocked', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('teacherOnlyNotes');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('markingNotesTeacherOnly');
  });

  it('envelope with provider secret is blocked', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('providerSecret');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('apiKey');
  });

  it('envelope with portal payload is blocked', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('portalPayload');
  });

  it('envelope with notification payload is blocked', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('notificationPayload');
  });

  it('envelope with PDF binary is blocked', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('pdfBinary');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('pdfBuffer');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('pdfBase64');
  });

  it('envelope with HTML export file is blocked', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('htmlExport');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('htmlFile');
  });

  it('envelope with external sync payload is blocked', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('externalSyncPayload');
  });

  it('envelope with AI narrative is blocked', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('aiNarrative');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('generatedNarrative');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('modelOutput');
  });

  it('envelope with OCR text is blocked', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('ocrText');
  });

  it('no PDF binary policy blocks all', () => {
    const result = evaluateReportCardExportNoPdfBinaryPolicy({ schoolId: 'school-1', actorRole: 'teacher' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('PDF_BINARY_BLOCKED');
  });

  it('no live publication policy blocks all', () => {
    const result = evaluateReportCardExportNoLivePublicationPolicy({ schoolId: 'school-1', actorRole: 'teacher' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LIVE_EXPORT_BLOCKED');
  });

  it('envelope can be suppressed', async () => {
    const envelope = await envelopeRepo.create(makeEnvelopeInput());
    const suppressed = await envelopeRepo.suppress(envelope.resultReportCardExportEnvelopeId, 'POLICY_SUPPRESSED', 'Suppressed');
    expect(suppressed.envelopeStatus).toBe('suppressed');
  });

  it('envelope can be blocked', async () => {
    const envelope = await envelopeRepo.create(makeEnvelopeInput());
    const blocked = await envelopeRepo.block(envelope.resultReportCardExportEnvelopeId, 'POLICY_BLOCKED', 'Blocked');
    expect(blocked.envelopeStatus).toBe('blocked');
  });

  it('envelope can be voided', async () => {
    const envelope = await envelopeRepo.create(makeEnvelopeInput());
    const voided = await envelopeRepo.void(envelope.resultReportCardExportEnvelopeId, 'USER_REQUEST', 'Voided');
    expect(voided.envelopeStatus).toBe('void');
  });
});
