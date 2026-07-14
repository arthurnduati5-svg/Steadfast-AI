import { describe, it, expect, beforeEach } from 'vitest';
import { ResultReportCardAssemblyService } from '../services/resultReportCardAssemblyService';
import { ResultReportCardAuditBridge } from '../services/resultReportCardAuditBridge';
import { ResultReportCardIdempotencyService } from '../services/resultReportCardIdempotencyService';
import {
  InMemoryResultReportCardAssemblyRepository,
  InMemoryResultReportCardSectionRepository,
  InMemoryResultReportCardEvidenceLinkRepository,
  InMemoryResultReportCardTemplateRepository,
  InMemoryResultReportCardAuditRepository,
  InMemoryResultReportCardIdempotencyRepository,
} from '../repositories/inMemoryResultReportCardRepositories';
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

function makeReleasePacketInput() {
  return {
    resultReportCardTemplateId: 'tpl-1',
    resultReportCardTemplateVersionId: 'tplv-1',
    resultReleasePacketId: 'packet-1',
    resultReleaseApprovalId: 'approval-1',
    resultAudienceProjectionId: 'projection-1',
    studentResultReportSnapshotId: 'snapshot-1',
    resultFinalizationDecisionId: 'final-1',
    resultReleaseBoundaryId: 'boundary-1',
    markingResultVersionId: 'marking-v1',
    studentRef: 'student-1',
    paperId: 'paper-1',
    paperVersionId: 'paper-v1',
    deliverySessionId: 'session-1',
    assemblyMode: 'student_safe_report_card' as const,
    audienceType: 'student' as const,
    safeReportTitle: 'Term 1 Report',
    safeReportSummary: 'Student safe report card for term 1',
  };
}

describe('Package 13 — Assembly Lifecycle', () => {
  let assemblyRepo: InMemoryResultReportCardAssemblyRepository;
  let sectionRepo: InMemoryResultReportCardSectionRepository;
  let evidenceRepo: InMemoryResultReportCardEvidenceLinkRepository;
  let templateRepo: InMemoryResultReportCardTemplateRepository;
  let auditRepo: InMemoryResultReportCardAuditRepository;
  let idempotencyRepo: InMemoryResultReportCardIdempotencyRepository;
  let auditBridge: ResultReportCardAuditBridge;
  let idempotencyService: ResultReportCardIdempotencyService;
  let assemblyService: ResultReportCardAssemblyService;

  beforeEach(() => {
    assemblyRepo = new InMemoryResultReportCardAssemblyRepository();
    sectionRepo = new InMemoryResultReportCardSectionRepository();
    evidenceRepo = new InMemoryResultReportCardEvidenceLinkRepository();
    templateRepo = new InMemoryResultReportCardTemplateRepository();
    auditRepo = new InMemoryResultReportCardAuditRepository();
    idempotencyRepo = new InMemoryResultReportCardIdempotencyRepository();
    auditBridge = new ResultReportCardAuditBridge(auditRepo);
    idempotencyService = new ResultReportCardIdempotencyService(idempotencyRepo);
    assemblyService = new ResultReportCardAssemblyService(
      assemblyRepo, sectionRepo, evidenceRepo, templateRepo,
      auditBridge, idempotencyService,
    );
  });

  it('Assembly can be created only from Package 11 release packet', async () => {
    const ctx = makeCtx();
    const result = await assemblyService.createAssemblyFromReleasePacket(ctx, makeReleasePacketInput());
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
    if (result.data) {
      const assembly = result.data as Record<string, unknown>;
      expect(assembly.resultReleasePacketId).toBe('packet-1');
      expect(assembly.resultReleaseApprovalId).toBe('approval-1');
    }
  });

  it('Missing release packet is blocked', async () => {
    const ctx = makeCtx();
    const input = makeReleasePacketInput();
    input.resultReleasePacketId = '';
    const result = await assemblyService.createAssemblyFromReleasePacket(ctx, input);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('VALIDATION_FAILED');
  });

  it('Missing release approval is blocked', async () => {
    const ctx = makeCtx();
    const input = makeReleasePacketInput();
    input.resultReleaseApprovalId = '';
    const result = await assemblyService.createAssemblyFromReleasePacket(ctx, input);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('VALIDATION_FAILED');
  });

  it('Missing audience projection is blocked', async () => {
    const ctx = makeCtx();
    const input = makeReleasePacketInput();
    input.resultAudienceProjectionId = '';
    const result = await assemblyService.createAssemblyFromReleasePacket(ctx, input);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('VALIDATION_FAILED');
  });

  it('Missing safe source (student snapshot) is blocked', async () => {
    const ctx = makeCtx();
    const input = makeReleasePacketInput();
    input.studentResultReportSnapshotId = '';
    const result = await assemblyService.createAssemblyFromReleasePacket(ctx, input);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('VALIDATION_FAILED');
  });

  it('Wrong school scope is blocked', async () => {
    const ctx = makeCtx();
    const result = await assemblyService.createAssemblyFromReleasePacket(ctx, makeReleasePacketInput());
    expect(result.ok).toBe(true);
    const assemblyId = result.resourceId!;

    const wrongCtx = makeCtx({ schoolId: 'school-2' });
    const getResult = await assemblyService.getAssembly(wrongCtx, assemblyId);
    expect(getResult.ok).toBe(false);
    expect(getResult.reasonCode).toBe('SCHOOL_MISMATCH');
  });

  it('Assembly can move through lifecycle: draft -> assembled -> safety_checked -> sealed -> ready_for_review', async () => {
    const ctx = makeCtx();
    const created = await assemblyService.createAssemblyFromReleasePacket(ctx, makeReleasePacketInput());
    const assemblyId = created.resourceId!;
    expect(created.status).toBe('draft');

    const assembled = await assemblyService.runAssemblySourceChecks(ctx, assemblyId);
    expect(assembled.ok).toBe(true);
    expect(assembled.status).toBe('assembled');

    const safetyChecked = await assemblyService.markAssemblySafetyChecked(ctx, assemblyId);
    expect(safetyChecked.ok).toBe(true);
    expect(safetyChecked.status).toBe('safety_checked');

    const sealed = await assemblyService.sealAssembly(ctx, assemblyId);
    expect(sealed.ok).toBe(true);
    expect(sealed.status).toBe('sealed');

    const readyForReview = await assemblyService.markAssemblyReadyForReview(ctx, assemblyId);
    expect(readyForReview.ok).toBe(true);
    expect(readyForReview.status).toBe('ready_for_review');
  });

  it('Assembly can be blocked', async () => {
    const ctx = makeCtx();
    const created = await assemblyService.createAssemblyFromReleasePacket(ctx, makeReleasePacketInput());
    const assemblyId = created.resourceId!;

    const result = await assemblyService.blockAssembly(ctx, assemblyId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('blocked');
  });

  it('Assembly can be cancelled', async () => {
    const ctx = makeCtx();
    const created = await assemblyService.createAssemblyFromReleasePacket(ctx, makeReleasePacketInput());
    const assemblyId = created.resourceId!;

    const result = await assemblyService.cancelAssembly(ctx, assemblyId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('cancelled');
  });

  it('Assembly can be voided', async () => {
    const ctx = makeCtx();
    const created = await assemblyService.createAssemblyFromReleasePacket(ctx, makeReleasePacketInput());
    const assemblyId = created.resourceId!;

    const result = await assemblyService.voidAssembly(ctx, assemblyId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('void');
  });

  it('Assembly does not send or publish anything (no send/POST methods in service)', () => {
    const methodNames = Object.getOwnPropertyNames(ResultReportCardAssemblyService.prototype);
    const sendMethods = methodNames.filter(m => m.toLowerCase().includes('send') || m.toLowerCase().includes('post') || m.toLowerCase().includes('publish') || m.toLowerCase().includes('dispatch'));
    expect(sendMethods).toHaveLength(0);
  });

  it('Assembly does not change scores', () => {
    const methodNames = Object.getOwnPropertyNames(ResultReportCardAssemblyService.prototype);
    const scoreMethods = methodNames.filter(m => {
      const lc = m.toLowerCase();
      return lc.startsWith('score') || lc.startsWith('grade') || lc.startsWith('mark');
    });
    const falsePositives = ['markassemblysafetychecked', 'markassemblyreadyforreview'];
    const actualScoreMethods = scoreMethods.filter(m => !falsePositives.includes(m.toLowerCase()));
    expect(actualScoreMethods).toHaveLength(0);
  });

  it('Assembly does not mutate Package 10, 11, or 12 records', () => {
    const methodNames = Object.getOwnPropertyNames(ResultReportCardAssemblyService.prototype);
    const crossPackageMethods = methodNames.filter(m =>
      m.toLowerCase().includes('learningevidence') ||
      m.toLowerCase().includes('releasepacket') ||
      m.toLowerCase().includes('deliveryreceipt') ||
      m.toLowerCase().includes('finalization') ||
      m.toLowerCase().includes('snapshot') ||
      m.toLowerCase().includes('summaryrecord'),
    );
    const createMethods = crossPackageMethods.filter(m => m.startsWith('create') || m.startsWith('update'));
    const falsePositives = ['createassemblyfromreleasepacket'];
    const actualMutateMethods = createMethods.filter(m => !falsePositives.includes(m.toLowerCase()));
    expect(actualMutateMethods).toHaveLength(0);
  });
});
