import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryResultReportCardExportTargetRepository,
} from '../repositories/inMemoryResultReportCardExportRepositories';
import { FORBIDDEN_EXPORT_ENVELOPE_FIELDS } from '../contracts/resultReportCardExportContracts';
import {
  evaluateReportCardExportTargetResolutionPolicy,
} from '../policies/resultReportCardExportPolicyDefinitions';

const targetTypes = [
  'pdf_export_future',
  'parent_portal_future',
  'student_portal_future',
  'teacher_dashboard_future',
  'admin_archive_future',
  'external_school_system_future',
  'print_package_future',
] as const;

function makeTargetInput(overrides?: Record<string, unknown>) {
  return {
    resultReportCardExportJobId: 'job-1',
    targetType: 'pdf_export_future',
    targetMode: 'future_intent',
    audienceType: 'teacher' as const,
    safeTargetSummary: 'PDF export target for future use',
    schoolId: 'school-1',
    createdByActorId: 'actor-1',
    createdByRole: 'teacher',
    ...overrides,
  };
}

describe('Package 14 — Target Resolution', () => {
  let targetRepo: InMemoryResultReportCardExportTargetRepository;

  beforeEach(() => {
    targetRepo = new InMemoryResultReportCardExportTargetRepository();
  });

  for (const targetType of targetTypes) {
    it(`future ${targetType} target descriptor can be created`, async () => {
      const target = await targetRepo.create(makeTargetInput({ targetType }));
      expect(target).toBeDefined();
      expect(target.targetType).toBe(targetType);
      expect(target.targetStatus).toBe('draft');
    });
  }

  it('target can be validated', async () => {
    const target = await targetRepo.create(makeTargetInput());
    const validated = await targetRepo.updateStatus(target.resultReportCardExportTargetId, 'validated');
    expect(validated.targetStatus).toBe('validated');
    expect(validated.validatedAt).toBeTruthy();
  });

  it('target can be suppressed', async () => {
    const target = await targetRepo.create(makeTargetInput());
    const suppressed = await targetRepo.suppress(target.resultReportCardExportTargetId, 'POLICY_SUPPRESSED', 'Suppressed');
    expect(suppressed.targetStatus).toBe('suppressed');
  });

  it('target can be blocked', async () => {
    const target = await targetRepo.create(makeTargetInput());
    const blocked = await targetRepo.block(target.resultReportCardExportTargetId, 'POLICY_BLOCKED', 'Blocked');
    expect(blocked.targetStatus).toBe('blocked');
  });

  it('target can be voided', async () => {
    const target = await targetRepo.create(makeTargetInput());
    const voided = await targetRepo.void(target.resultReportCardExportTargetId, 'USER_REQUEST', 'Voided');
    expect(voided.targetStatus).toBe('void');
  });

  it('raw email is blocked via FORBIDDEN_EXPORT_ENVELOPE_FIELDS', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('emailPayload');
  });

  it('raw phone is blocked via FORBIDDEN_EXPORT_ENVELOPE_FIELDS', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('smsPayload');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('pushPayload');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('whatsAppPayload');
  });

  it('provider destination is blocked via FORBIDDEN_EXPORT_ENVELOPE_FIELDS', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('liveProviderPayload');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('providerSecret');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('apiKey');
  });

  it('portal payload is blocked via FORBIDDEN_EXPORT_ENVELOPE_FIELDS', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('portalPayload');
  });

  it('PDF binary is blocked via FORBIDDEN_EXPORT_ENVELOPE_FIELDS', () => {
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('pdfBinary');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('pdfBuffer');
    expect(FORBIDDEN_EXPORT_ENVELOPE_FIELDS).toContain('pdfBase64');
  });

  it('target resolution policy blocks student and parent', () => {
    const studentResult = evaluateReportCardExportTargetResolutionPolicy({ schoolId: 'school-1', actorRole: 'student' });
    expect(studentResult.allowed).toBe(false);

    const parentResult = evaluateReportCardExportTargetResolutionPolicy({ schoolId: 'school-1', actorRole: 'parent' });
    expect(parentResult.allowed).toBe(false);
  });

  it('target resolution policy allows teacher and admin', () => {
    const teacherResult = evaluateReportCardExportTargetResolutionPolicy({ schoolId: 'school-1', actorRole: 'teacher' });
    expect(teacherResult.allowed).toBe(true);

    const adminResult = evaluateReportCardExportTargetResolutionPolicy({ schoolId: 'school-1', actorRole: 'admin' });
    expect(adminResult.allowed).toBe(true);
  });
});
