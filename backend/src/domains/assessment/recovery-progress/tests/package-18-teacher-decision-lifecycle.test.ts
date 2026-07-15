import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryProgressSafetyService } from '../services/recoveryProgressSafetyService';
import { RecoveryProgressIdempotencyService } from '../services/recoveryProgressIdempotencyService';
import { RecoveryProgressAuditBridge } from '../services/recoveryProgressAuditBridge';
import { RecoveryTeacherReviewDecisionService } from '../services/recoveryTeacherReviewDecisionService';
import { InMemoryRecoveryTeacherReviewDecisionRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import { InMemoryRecoveryProgressAuditRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import { InMemoryRecoveryProgressIdempotencyRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import type { RecoveryProgressCommandContext } from '../contracts/recoveryProgressContracts';

function makeCtx(overrides?: Partial<RecoveryProgressCommandContext>): RecoveryProgressCommandContext {
  return { schoolId: 'school-1', actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'idem-1', ...overrides };
}

function makeDecisionInput() {
  return {
    studentRef: 'student-1',
    teacherRef: 'teacher-1',
    resultRecoveryPlanId: 'plan-1',
    recoveryPlanAdjustmentDraftId: 'adj-1',
    recoveryCheckpointEvaluationId: 'eval-1',
    recoveryEvidenceRollupId: 'rollup-1',
    decisionType: 'approve_future_adjustment',
    safeDecisionSummary: 'Approved adjustment for future use',
    decisionReasonCodesJson: { reason: 'evidence_supported' },
    approvedFutureUseRefsJson: { adjRef: 'adj-1' },
    blockedReasonCodesJson: [],
  } as const;
}

describe('Package 18 — Teacher Review Decision Lifecycle', () => {
  let decisionRepo: InMemoryRecoveryTeacherReviewDecisionRepository;
  let safetyService: RecoveryProgressSafetyService;
  let auditRepo: InMemoryRecoveryProgressAuditRepository;
  let auditBridge: RecoveryProgressAuditBridge;
  let idempotencyRepo: InMemoryRecoveryProgressIdempotencyRepository;
  let idempotencyService: RecoveryProgressIdempotencyService;
  let service: RecoveryTeacherReviewDecisionService;

  beforeEach(() => {
    decisionRepo = new InMemoryRecoveryTeacherReviewDecisionRepository();
    safetyService = new RecoveryProgressSafetyService();
    auditRepo = new InMemoryRecoveryProgressAuditRepository();
    auditBridge = new RecoveryProgressAuditBridge(auditRepo as any);
    idempotencyRepo = new InMemoryRecoveryProgressIdempotencyRepository();
    idempotencyService = new RecoveryProgressIdempotencyService(idempotencyRepo as any);
    service = new RecoveryTeacherReviewDecisionService(decisionRepo, safetyService, auditBridge, idempotencyService);
  });

  it('creates decision with draft status', async () => {
    const result = await service.createDecision(makeCtx(), makeDecisionInput() as any);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
    expect(result.reasonCode).toBe('DECISION_CREATED');
  });

  it('getDecision returns created decision', async () => {
    const created = await service.createDecision(makeCtx(), makeDecisionInput() as any);
    const fetched = await service.getDecision(makeCtx(), created.resourceId!);
    expect(fetched.ok).toBe(true);
    expect(fetched.resourceId).toBe(created.resourceId);
  });

  it('getDecision returns not_found for missing id', async () => {
    const result = await service.getDecision(makeCtx(), 'missing');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('NOT_FOUND');
  });

  it('listDecisionsForPlan returns filtered', async () => {
    await service.createDecision(makeCtx(), makeDecisionInput() as any);
    const result = await service.listDecisionsForPlan(makeCtx(), 'plan-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listDecisionsForTeacher returns filtered', async () => {
    await service.createDecision(makeCtx(), makeDecisionInput() as any);
    const result = await service.listDecisionsForTeacher(makeCtx(), 'teacher-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listDecisionsForAdjustmentDraft returns filtered', async () => {
    await service.createDecision(makeCtx(), makeDecisionInput() as any);
    const result = await service.listDecisionsForAdjustmentDraft(makeCtx(), 'adj-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listDecisionsForEvaluation returns filtered', async () => {
    await service.createDecision(makeCtx(), makeDecisionInput() as any);
    const result = await service.listDecisionsForEvaluation(makeCtx(), 'eval-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('lifecycle: draft -> reviewed -> approved_for_future_use', async () => {
    const created = await service.createDecision(makeCtx(), makeDecisionInput() as any);
    expect(created.status).toBe('draft');

    const reviewed = await service.markDecisionReviewed(makeCtx(), created.resourceId!, 'DECISION_REVIEWED', 'Reviewed');
    expect(reviewed.status).toBe('reviewed');

    const approved = await service.markDecisionApprovedForFutureUse(makeCtx(), created.resourceId!, 'DECISION_APPROVED', 'Approved');
    expect(approved.status).toBe('approved_for_future_use');
  });

  it('decision can be suppressed', async () => {
    const created = await service.createDecision(makeCtx(), makeDecisionInput() as any);
    const result = await service.suppressDecision(makeCtx(), created.resourceId!, 'DECISION_SUPPRESSED', 'Suppressed');
    expect(result.status).toBe('suppressed');
  });

  it('decision can be blocked', async () => {
    const created = await service.createDecision(makeCtx(), makeDecisionInput() as any);
    const result = await service.blockDecision(makeCtx(), created.resourceId!, 'DECISION_BLOCKED', 'Blocked');
    expect(result.status).toBe('blocked');
  });

  it('decision can be voided', async () => {
    const created = await service.createDecision(makeCtx(), makeDecisionInput() as any);
    const result = await service.voidDecision(makeCtx(), created.resourceId!, 'DECISION_VOIDED', 'Voided');
    expect(result.status).toBe('void');
  });

  it('voided decision cannot be blocked', async () => {
    const created = await service.createDecision(makeCtx(), makeDecisionInput() as any);
    await service.voidDecision(makeCtx(), created.resourceId!, '', '');
    const result = await service.blockDecision(makeCtx(), created.resourceId!, '', '');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_STATUS');
  });

  it('blocks student role from creating decision', async () => {
    const ctx = makeCtx({ actorRole: 'student' });
    const result = await service.createDecision(ctx, makeDecisionInput() as any);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
  });

  it('blocks request with missing school context', async () => {
    const ctx = makeCtx({ schoolId: '' });
    const result = await service.createDecision(ctx, makeDecisionInput() as any);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('does not contain score mutation fields', async () => {
    const result = await service.createDecision(makeCtx(), makeDecisionInput() as any);
    const data = result.data as any;
    expect(data).not.toHaveProperty('score');
    expect(data).not.toHaveProperty('masteryScore');
  });
});
