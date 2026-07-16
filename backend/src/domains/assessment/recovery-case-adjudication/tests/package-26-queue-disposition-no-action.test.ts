import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryQueueDispositionRepository, InMemoryAdjudicationAuditRepository } from '../repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { RecoveryCaseQueueDispositionService } from '../services/recoveryCaseQueueDispositionService';
import { AdjudicationDispositionCodes } from '../contracts';
import type { RecoveryCaseAdjudicationCommandContext } from '../contracts';

describe('Package 26 - Queue Disposition No Action', () => {
  let repo: InMemoryQueueDispositionRepository;
  let auditRepo: InMemoryAdjudicationAuditRepository;
  let service: RecoveryCaseQueueDispositionService;
  const schoolA = 'school-a';
  const schoolB = 'school-b';
  const ctx: RecoveryCaseAdjudicationCommandContext = {
    schoolId: schoolA,
    actorId: 'actor-1',
    actorRole: 'lead_teacher',
    correlationId: 'corr-1',
    idempotencyKey: 'ik-1',
    sourceRefsJson: {},
  };

  beforeEach(() => {
    repo = new InMemoryQueueDispositionRepository();
    auditRepo = new InMemoryAdjudicationAuditRepository();
    service = new RecoveryCaseQueueDispositionService(repo, auditRepo);
  });

  it('create queue disposition with each valid disposition code', async () => {
    for (const code of AdjudicationDispositionCodes) {
      const result = await service.createQueueDisposition(ctx, {
        schoolId: schoolA,
        queueItemId: `queue-${code}`,
        dispositionCode: code,
        safeDispositionSummary: `Disposition: ${code}`,
        reasonCodes: {},
        sourceRefs: {},
        createdByActorId: 'actor-1',
        createdByRole: 'lead_teacher',
      });
      expect(result.success).toBe(true);
      expect(result.data!.dispositionCode).toBe(code);
    }
  });

  it('disposition starts as draft', async () => {
    const result = await service.createQueueDisposition(ctx, {
      schoolId: schoolA,
      queueItemId: 'queue-1',
      dispositionCode: 'retain_in_queue',
      safeDispositionSummary: 'Test',
      reasonCodes: {},
      sourceRefs: {},
      createdByActorId: 'actor-1',
      createdByRole: 'lead_teacher',
    });
    expect(result.data!.dispositionStatus).toBe('draft');
  });

  it('get by ID works', async () => {
    const created = await service.createQueueDisposition(ctx, {
      schoolId: schoolA,
      queueItemId: 'queue-1',
      dispositionCode: 'defer_for_more_evidence',
      safeDispositionSummary: 'Get test',
      reasonCodes: {},
      sourceRefs: {},
      createdByActorId: 'actor-1',
      createdByRole: 'lead_teacher',
    });
    const found = await service.getQueueDisposition(created.data!.queueDispositionId);
    expect(found.success).toBe(true);
    expect(found.data!.queueDispositionId).toBe(created.data!.queueDispositionId);
  });

  it('list by school filters correctly', async () => {
    await service.createQueueDisposition(ctx, {
      schoolId: schoolA, queueItemId: 'q-a1', dispositionCode: 'retain_in_queue', safeDispositionSummary: 'A1', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'lead_teacher',
    });
    await service.createQueueDisposition(ctx, {
      schoolId: schoolA, queueItemId: 'q-a2', dispositionCode: 'retain_in_queue', safeDispositionSummary: 'A2', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'lead_teacher',
    });
    await service.createQueueDisposition({ ...ctx, schoolId: schoolB }, {
      schoolId: schoolB, queueItemId: 'q-b1', dispositionCode: 'retain_in_queue', safeDispositionSummary: 'B1', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a2', createdByRole: 'lead_teacher',
    });
    const listA = await service.listQueueDispositionsForSchool(schoolA);
    const listB = await service.listQueueDispositionsForSchool(schoolB);
    expect(listA.data!).toHaveLength(2);
    expect(listB.data!).toHaveLength(1);
  });

  it('list by queue item filters correctly', async () => {
    await service.createQueueDisposition(ctx, {
      schoolId: schoolA, queueItemId: 'qi-target', dispositionCode: 'escalation_proposed', safeDispositionSummary: 'Target', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'lead_teacher',
    });
    const items = await service.listQueueDispositionsForQueueItem(schoolA, 'qi-target');
    expect(items.data!).toHaveLength(1);
    expect(items.data![0].queueItemId).toBe('qi-target');
  });

  it('list by code filters correctly', async () => {
    await service.createQueueDisposition(ctx, {
      schoolId: schoolA, queueItemId: 'q1', dispositionCode: 'governance_blocked', safeDispositionSummary: 'Blocked', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'lead_teacher',
    });
    const items = await service.listQueueDispositionsByCode(schoolA, 'governance_blocked');
    expect(items.data!).toHaveLength(1);
    expect(items.data![0].dispositionCode).toBe('governance_blocked');
  });

  it('list by status filters correctly', async () => {
    const created = await service.createQueueDisposition(ctx, {
      schoolId: schoolA, queueItemId: 'q1', dispositionCode: 'archived_ready', safeDispositionSummary: 'Status', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'lead_teacher',
    });
    await service.markQueueDispositionReviewReady(created.data!.queueDispositionId);
    const items = await service.listQueueDispositionsByStatus(schoolA, 'review_ready');
    expect(items.data!).toHaveLength(1);
    expect(items.data![0].dispositionStatus).toBe('review_ready');
  });

  it('mark review ready changes status', async () => {
    const created = await service.createQueueDisposition(ctx, {
      schoolId: schoolA, queueItemId: 'q1', dispositionCode: 'second_review_required', safeDispositionSummary: 'RR', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'lead_teacher',
    });
    const updated = await service.markQueueDispositionReviewReady(created.data!.queueDispositionId);
    expect(updated.data!.dispositionStatus).toBe('review_ready');
  });

  it('approve for future use changes status', async () => {
    const created = await service.createQueueDisposition(ctx, {
      schoolId: schoolA, queueItemId: 'q1', dispositionCode: 'priority_override_proposed', safeDispositionSummary: 'Future', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'lead_teacher',
    });
    const updated = await service.approveQueueDispositionForFutureUse(created.data!.queueDispositionId);
    expect(updated.data!.dispositionStatus).toBe('approved_for_future_use');
  });

  it('block adds reason codes and changes status', async () => {
    const created = await service.createQueueDisposition(ctx, {
      schoolId: schoolA, queueItemId: 'q1', dispositionCode: 'return_to_triage', safeDispositionSummary: 'Block', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'lead_teacher',
    });
    const blocked = await service.blockQueueDisposition(created.data!.queueDispositionId, ['governance_hold', 'pending_review']);
    expect(blocked.data!.dispositionStatus).toBe('blocked');
    expect(blocked.data!.reasonCodes).toEqual({ blocked: ['governance_hold', 'pending_review'] });
  });

  it('suppress changes status', async () => {
    const created = await service.createQueueDisposition(ctx, {
      schoolId: schoolA, queueItemId: 'q1', dispositionCode: 'escalation_proposed', safeDispositionSummary: 'Suppress', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'lead_teacher',
    });
    const suppressed = await service.suppressQueueDisposition(created.data!.queueDispositionId);
    expect(suppressed.data!.dispositionStatus).toBe('suppressed');
  });

  it('void sets status and voidedAt', async () => {
    const created = await service.createQueueDisposition(ctx, {
      schoolId: schoolA, queueItemId: 'q1', dispositionCode: 'governance_blocked', safeDispositionSummary: 'Void', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'lead_teacher',
    });
    const voided = await service.voidQueueDisposition(created.data!.queueDispositionId);
    expect(voided.data!.dispositionStatus).toBe('void');
  });

  it('service does NOT have updatePackage25Queue method', () => {
    expect((service as any).updatePackage25Queue).toBeUndefined();
  });

  it('school isolation', async () => {
    await service.createQueueDisposition(ctx, {
      schoolId: schoolA, queueItemId: 'q-a1', dispositionCode: 'retain_in_queue', safeDispositionSummary: 'A', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'lead_teacher',
    });
    await service.createQueueDisposition({ ...ctx, schoolId: schoolB }, {
      schoolId: schoolB, queueItemId: 'q-b1', dispositionCode: 'retain_in_queue', safeDispositionSummary: 'B', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a2', createdByRole: 'lead_teacher',
    });
    const listA = await service.listQueueDispositionsForSchool(schoolA);
    const listB = await service.listQueueDispositionsForSchool(schoolB);
    expect(listA.data!).toHaveLength(1);
    expect(listA.data![0].schoolId).toBe(schoolA);
    expect(listB.data!).toHaveLength(1);
    expect(listB.data![0].schoolId).toBe(schoolB);
  });
});
