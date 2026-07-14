import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryResultReportCardEvidenceLinkRepository,
  InMemoryResultReportCardAuditRepository,
  InMemoryResultReportCardIdempotencyRepository,
} from '../repositories/inMemoryResultReportCardRepositories';
import { ResultReportCardEvidenceLinkService } from '../services/resultReportCardEvidenceLinkService';
import { ResultReportCardSafetyService } from '../services/resultReportCardSafetyService';
import { ResultReportCardAuditBridge } from '../services/resultReportCardAuditBridge';
import { ResultReportCardIdempotencyService } from '../services/resultReportCardIdempotencyService';
import type { ResultReportCardCommandContext } from '../contracts/resultReportCardContracts';

function makeCtx(overrides?: Partial<ResultReportCardCommandContext>): ResultReportCardCommandContext {
  return {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-1',
    idempotencyKey: `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...overrides,
  };
}

describe('Package 13 — Evidence Linking', () => {
  let evidenceRepo: InMemoryResultReportCardEvidenceLinkRepository;
  let auditRepo: InMemoryResultReportCardAuditRepository;
  let idempotencyRepo: InMemoryResultReportCardIdempotencyRepository;
  let auditBridge: ResultReportCardAuditBridge;
  let idempotencyService: ResultReportCardIdempotencyService;
  let safetyService: ResultReportCardSafetyService;
  let service: ResultReportCardEvidenceLinkService;

  beforeEach(() => {
    evidenceRepo = new InMemoryResultReportCardEvidenceLinkRepository();
    auditRepo = new InMemoryResultReportCardAuditRepository();
    idempotencyRepo = new InMemoryResultReportCardIdempotencyRepository();
    auditBridge = new ResultReportCardAuditBridge(auditRepo);
    idempotencyService = new ResultReportCardIdempotencyService(idempotencyRepo);
    safetyService = new ResultReportCardSafetyService();
    service = new ResultReportCardEvidenceLinkService(evidenceRepo, safetyService, auditBridge, idempotencyService);
  });

  function expectEvidenceLink(result: import('../contracts/resultReportCardContracts').ResultReportCardSafeEnvelope, expectedPackage: string) {
    expect(result.ok).toBe(true);
    expect(result.status).toBe('active');
    expect(result.data).toBeTruthy();
    const link = result.data as import('../contracts/resultReportCardEvidenceContracts').ResultReportCardEvidenceLink;
    expect(link.sourcePackage).toBe(expectedPackage);
  }

  it('evidence link can reference Package 5 marking result version by ID', async () => {
    const ctx = makeCtx();
    const result = await service.createEvidenceLink(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      sourceRecordType: 'marking_result_version',
      sourceRecordId: 'marking-result-version-1',
      sourcePackage: 'package_5_marking',
      evidenceUse: 'reference',
      safeEvidenceSummary: 'Linked to marking result version',
    });
    expectEvidenceLink(result, 'package_5_marking');
  });

  it('evidence link can reference Package 9 finalization/release boundary by ID', async () => {
    const ctx = makeCtx();
    const result = await service.createEvidenceLink(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      sourceRecordType: 'finalization_boundary',
      sourceRecordId: 'finalization-boundary-1',
      sourcePackage: 'package_9_result_governance',
      evidenceUse: 'reference',
      safeEvidenceSummary: 'Linked to finalization boundary',
    });
    expectEvidenceLink(result, 'package_9_result_governance');
  });

  it('evidence link can reference Package 10 learning evidence bridge by ID', async () => {
    const ctx = makeCtx();
    const result = await service.createEvidenceLink(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      sourceRecordType: 'learning_evidence_bridge',
      sourceRecordId: 'evidence-bridge-1',
      sourcePackage: 'package_10_learning_evidence',
      evidenceUse: 'reference',
      safeEvidenceSummary: 'Linked to learning evidence bridge',
    });
    expectEvidenceLink(result, 'package_10_learning_evidence');
  });

  it('evidence link can reference Package 11 release packet/projection/safe summary by ID', async () => {
    const ctx = makeCtx();
    const result = await service.createEvidenceLink(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      sourceRecordType: 'release_packet',
      sourceRecordId: 'release-packet-1',
      sourcePackage: 'package_11_result_release',
      evidenceUse: 'reference',
      safeEvidenceSummary: 'Linked to release packet',
    });
    expectEvidenceLink(result, 'package_11_result_release');
  });

  it('evidence link can reference Package 12 delivery receipt by ID', async () => {
    const ctx = makeCtx();
    const result = await service.createEvidenceLink(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      sourceRecordType: 'delivery_receipt',
      sourceRecordId: 'delivery-receipt-1',
      sourcePackage: 'package_12_result_delivery',
      evidenceUse: 'reference',
      safeEvidenceSummary: 'Linked to delivery receipt',
    });
    expectEvidenceLink(result, 'package_12_result_delivery');
  });

  it('unknown source package is blocked (test assertEvidenceSourceAllowed)', async () => {
    const ctx = makeCtx();
    const result = await service.createEvidenceLink(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      sourceRecordType: 'unknown_source',
      sourceRecordId: 'unknown-1',
      sourcePackage: 'package_99_unknown',
      evidenceUse: 'reference',
      safeEvidenceSummary: 'Should be blocked',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('UNKNOWN_SOURCE_PACKAGE');
  });

  it('raw answer key source is blocked (test safety service)', async () => {
    const result = await safetyService.assertNoAnswerKeyLeakage({ answerKeyText: 'A', answerKeySafeRef: 'ak-1' });
    expect(result.safe).toBe(false);
    expect(result.reasonCode).toBe('ANSWER_KEY_LEAKAGE');
  });

  it('raw student answer source is blocked', async () => {
    const result = await safetyService.assertNoRawStudentAnswerLeakage({ rawStudentAnswer: 'my essay' });
    expect(result.safe).toBe(false);
    expect(result.reasonCode).toBe('RAW_STUDENT_ANSWER_LEAKAGE');
  });

  it('hidden teacher-only source is blocked for student/parent audiences', async () => {
    const studentSafe = await safetyService.assertNoTeacherOnlyLeakage({ markingNotesTeacherOnly: 'confidential' }, 'student');
    expect(studentSafe.safe).toBe(false);
    expect(studentSafe.reasonCode).toBe('TEACHER_ONLY_LEAKAGE');

    const parentSafe = await safetyService.assertNoTeacherOnlyLeakage({ teacherOnlyNotes: 'private' }, 'parent');
    expect(parentSafe.safe).toBe(false);
    expect(parentSafe.reasonCode).toBe('TEACHER_ONLY_LEAKAGE');
  });

  it('evidence links store refs only, not raw hidden data', async () => {
    const ctx = makeCtx();
    const result = await service.createEvidenceLink(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      sourceRecordType: 'marking_result_version',
      sourceRecordId: 'version-ref-1',
      sourcePackage: 'package_5_marking',
      evidenceUse: 'reference',
      safeEvidenceSummary: 'Stores ref only',
    });
    expect(result.ok).toBe(true);
    const link = result.data as import('../contracts/resultReportCardEvidenceContracts').ResultReportCardEvidenceLink;
    expect(link.sourceRecordId).toBe('version-ref-1');
    expect(link.sourceRecordType).toBe('marking_result_version');
    expect(link.safeEvidenceSummary).toBeTruthy();
  });

  it('evidence link can be blocked', async () => {
    const ctx = makeCtx();
    const created = await service.createEvidenceLink(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      sourceRecordType: 'marking_result_version',
      sourceRecordId: 'version-1',
      sourcePackage: 'package_5_marking',
      evidenceUse: 'reference',
      safeEvidenceSummary: 'To block',
    });
    const linkId = created.resourceId!;
    const blocked = await service.blockEvidenceLink(ctx, linkId);
    expect(blocked.ok).toBe(true);
    expect(blocked.status).toBe('blocked');
  });

  it('evidence link can be voided', async () => {
    const ctx = makeCtx();
    const created = await service.createEvidenceLink(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      sourceRecordType: 'marking_result_version',
      sourceRecordId: 'version-1',
      sourcePackage: 'package_5_marking',
      evidenceUse: 'reference',
      safeEvidenceSummary: 'To void',
    });
    const linkId = created.resourceId!;
    const voided = await service.voidEvidenceLink(ctx, linkId);
    expect(voided.ok).toBe(true);
    expect(voided.status).toBe('void');
  });
});
