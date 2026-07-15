import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryProgressSafetyService } from '../services/recoveryProgressSafetyService';
import { RecoveryProgressIdempotencyService } from '../services/recoveryProgressIdempotencyService';
import { RecoveryProgressAuditBridge } from '../services/recoveryProgressAuditBridge';
import { RecoveryPlanAdjustmentDraftService } from '../services/recoveryPlanAdjustmentDraftService';
import { InMemoryRecoveryPlanAdjustmentDraftRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import { InMemoryRecoveryProgressAuditRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import { InMemoryRecoveryProgressIdempotencyRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import type { RecoveryProgressCommandContext } from '../contracts/recoveryProgressContracts';

function makeCtx(overrides?: Partial<RecoveryProgressCommandContext>): RecoveryProgressCommandContext {
  return { schoolId: 'school-1', actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'idem-1', ...overrides };
}

function makeAdjustmentInput() {
  return {
    studentRef: 'student-1',
    resultRecoveryPlanId: 'plan-1',
    recoveryCheckpointEvaluationId: 'eval-1',
    recoveryProgressObservationId: 'obs-1',
    adjustmentType: 'sequence_adjustment',
    safeAdjustmentSummary: 'Reorder steps for better progression',
    proposedChangesJson: { newSequence: ['step-2', 'step-1'] },
    reasonCodesJson: { reason: 'evaluation_feedback' },
    teacherReviewNotesJson: {},
    blockedReasonCodesJson: [],
  } as const;
}

describe('Package 18 — Plan Adjustment Draft Lifecycle', () => {
  let adjustmentRepo: InMemoryRecoveryPlanAdjustmentDraftRepository;
  let safetyService: RecoveryProgressSafetyService;
  let auditRepo: InMemoryRecoveryProgressAuditRepository;
  let auditBridge: RecoveryProgressAuditBridge;
  let idempotencyRepo: InMemoryRecoveryProgressIdempotencyRepository;
  let idempotencyService: RecoveryProgressIdempotencyService;
  let service: RecoveryPlanAdjustmentDraftService;

  beforeEach(() => {
    adjustmentRepo = new InMemoryRecoveryPlanAdjustmentDraftRepository();
    safetyService = new RecoveryProgressSafetyService();
    auditRepo = new InMemoryRecoveryProgressAuditRepository();
    auditBridge = new RecoveryProgressAuditBridge(auditRepo as any);
    idempotencyRepo = new InMemoryRecoveryProgressIdempotencyRepository();
    idempotencyService = new RecoveryProgressIdempotencyService(idempotencyRepo as any);
    service = new RecoveryPlanAdjustmentDraftService(adjustmentRepo, safetyService, auditBridge, idempotencyService);
  });

  it('creates adjustment draft with draft status', async () => {
    const result = await service.createAdjustmentDraft(makeCtx(), makeAdjustmentInput() as any);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
    expect(result.reasonCode).toBe('ADJUSTMENT_DRAFT_CREATED');
  });

  it('getAdjustmentDraft returns created draft', async () => {
    const created = await service.createAdjustmentDraft(makeCtx(), makeAdjustmentInput() as any);
    const fetched = await service.getAdjustmentDraft(makeCtx(), created.resourceId!);
    expect(fetched.ok).toBe(true);
    expect(fetched.resourceId).toBe(created.resourceId);
  });

  it('getAdjustmentDraft returns not_found for missing id', async () => {
    const result = await service.getAdjustmentDraft(makeCtx(), 'missing');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('NOT_FOUND');
  });

  it('listAdjustmentDraftsForPlan returns filtered', async () => {
    await service.createAdjustmentDraft(makeCtx(), makeAdjustmentInput() as any);
    const result = await service.listAdjustmentDraftsForPlan(makeCtx(), 'plan-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listAdjustmentDraftsForObservation returns filtered', async () => {
    await service.createAdjustmentDraft(makeCtx(), makeAdjustmentInput() as any);
    const result = await service.listAdjustmentDraftsForObservation(makeCtx(), 'obs-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listAdjustmentDraftsForEvaluation returns filtered', async () => {
    await service.createAdjustmentDraft(makeCtx(), makeAdjustmentInput() as any);
    const result = await service.listAdjustmentDraftsForEvaluation(makeCtx(), 'eval-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listAdjustmentDraftsForStudent returns filtered', async () => {
    await service.createAdjustmentDraft(makeCtx(), makeAdjustmentInput() as any);
    const result = await service.listAdjustmentDraftsForStudent(makeCtx(), 'student-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('lifecycle: draft -> review_ready', async () => {
    const created = await service.createAdjustmentDraft(makeCtx(), makeAdjustmentInput() as any);
    expect(created.status).toBe('draft');

    const reviewed = await service.markAdjustmentDraftReviewReady(makeCtx(), created.resourceId!, 'ADJUSTMENT_DRAFT_REVIEW_READY', 'Ready');
    expect(reviewed.status).toBe('review_ready');
  });

  it('adjustment draft can be suppressed', async () => {
    const created = await service.createAdjustmentDraft(makeCtx(), makeAdjustmentInput() as any);
    const result = await service.suppressAdjustmentDraft(makeCtx(), created.resourceId!, 'ADJUSTMENT_DRAFT_SUPPRESSED', 'Suppressed');
    expect(result.status).toBe('suppressed');
  });

  it('adjustment draft can be blocked', async () => {
    const created = await service.createAdjustmentDraft(makeCtx(), makeAdjustmentInput() as any);
    const result = await service.blockAdjustmentDraft(makeCtx(), created.resourceId!, 'ADJUSTMENT_DRAFT_BLOCKED', 'Blocked');
    expect(result.status).toBe('blocked');
  });

  it('adjustment draft can be voided', async () => {
    const created = await service.createAdjustmentDraft(makeCtx(), makeAdjustmentInput() as any);
    const result = await service.voidAdjustmentDraft(makeCtx(), created.resourceId!, 'ADJUSTMENT_DRAFT_VOIDED', 'Voided');
    expect(result.status).toBe('void');
  });

  it('voided adjustment draft cannot be suppressed', async () => {
    const created = await service.createAdjustmentDraft(makeCtx(), makeAdjustmentInput() as any);
    await service.voidAdjustmentDraft(makeCtx(), created.resourceId!, '', '');
    const result = await service.suppressAdjustmentDraft(makeCtx(), created.resourceId!, '', '');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_STATUS');
  });

  it('blocks student role from creating adjustment draft', async () => {
    const ctx = makeCtx({ actorRole: 'student' });
    const result = await service.createAdjustmentDraft(ctx, makeAdjustmentInput() as any);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
  });

  it('blocks request with missing school context', async () => {
    const ctx = makeCtx({ schoolId: '' });
    const result = await service.createAdjustmentDraft(ctx, makeAdjustmentInput() as any);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('safety check blocks adjustment draft with answer key leakage', async () => {
    const input = { ...makeAdjustmentInput() as any, answerKeyText: 'leaked' };
    const result = await service.createAdjustmentDraft(makeCtx(), input);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
  });

  it('does not contain score mutation fields', async () => {
    const result = await service.createAdjustmentDraft(makeCtx(), makeAdjustmentInput() as any);
    const data = result.data as any;
    expect(data).not.toHaveProperty('score');
    expect(data).not.toHaveProperty('grade');
  });
});
