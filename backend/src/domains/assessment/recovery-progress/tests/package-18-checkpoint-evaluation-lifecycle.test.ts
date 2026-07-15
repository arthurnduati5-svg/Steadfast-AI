import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryProgressSafetyService } from '../services/recoveryProgressSafetyService';
import { RecoveryProgressIdempotencyService } from '../services/recoveryProgressIdempotencyService';
import { RecoveryProgressAuditBridge } from '../services/recoveryProgressAuditBridge';
import { RecoveryCheckpointEvaluationService } from '../services/recoveryCheckpointEvaluationService';
import { InMemoryRecoveryCheckpointEvaluationRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import { InMemoryRecoveryProgressAuditRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import { InMemoryRecoveryProgressIdempotencyRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import type { RecoveryProgressCommandContext } from '../contracts/recoveryProgressContracts';

function makeCtx(overrides?: Partial<RecoveryProgressCommandContext>): RecoveryProgressCommandContext {
  return { schoolId: 'school-1', actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'idem-1', ...overrides };
}

function makeEvalInput() {
  return {
    studentRef: 'student-1',
    resultRecoveryPlanId: 'plan-1',
    resultRecoveryCheckpointId: 'checkpoint-1',
    recoveryProgressObservationId: 'obs-1',
    evaluationMode: 'mock_evaluation_only',
    evaluationResult: 'on_track_ready',
    safeEvaluationSummary: 'Checkpoint evaluation summary',
    criteriaRefsJson: { criteria: 'completed' },
    criteriaResultsJson: { result: 'pass' },
    evidenceRefsJson: { evidence: 'obs-1' },
    recommendedNextStateJson: { action: 'proceed' },
    blockedReasonCodesJson: [],
  } as const;
}

describe('Package 18 — Checkpoint Evaluation Lifecycle', () => {
  let evaluationRepo: InMemoryRecoveryCheckpointEvaluationRepository;
  let safetyService: RecoveryProgressSafetyService;
  let auditRepo: InMemoryRecoveryProgressAuditRepository;
  let auditBridge: RecoveryProgressAuditBridge;
  let idempotencyRepo: InMemoryRecoveryProgressIdempotencyRepository;
  let idempotencyService: RecoveryProgressIdempotencyService;
  let service: RecoveryCheckpointEvaluationService;

  beforeEach(() => {
    evaluationRepo = new InMemoryRecoveryCheckpointEvaluationRepository();
    safetyService = new RecoveryProgressSafetyService();
    auditRepo = new InMemoryRecoveryProgressAuditRepository();
    auditBridge = new RecoveryProgressAuditBridge(auditRepo as any);
    idempotencyRepo = new InMemoryRecoveryProgressIdempotencyRepository();
    idempotencyService = new RecoveryProgressIdempotencyService(idempotencyRepo as any);
    service = new RecoveryCheckpointEvaluationService(evaluationRepo, safetyService, auditBridge, idempotencyService);
  });

  it('creates evaluation with draft status', async () => {
    const result = await service.createEvaluation(makeCtx(), makeEvalInput() as any);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
    expect(result.reasonCode).toBe('EVALUATION_CREATED');
  });

  it('getEvaluation returns created evaluation', async () => {
    const created = await service.createEvaluation(makeCtx(), makeEvalInput() as any);
    const fetched = await service.getEvaluation(makeCtx(), created.resourceId!);
    expect(fetched.ok).toBe(true);
    expect(fetched.resourceId).toBe(created.resourceId);
  });

  it('getEvaluation returns not_found for missing id', async () => {
    const result = await service.getEvaluation(makeCtx(), 'missing');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('NOT_FOUND');
  });

  it('listEvaluationsForPlan returns filtered', async () => {
    await service.createEvaluation(makeCtx(), makeEvalInput() as any);
    const result = await service.listEvaluationsForPlan(makeCtx(), 'plan-1');
    expect(result.ok).toBe(true);
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listEvaluationsForCheckpoint returns filtered', async () => {
    await service.createEvaluation(makeCtx(), makeEvalInput() as any);
    const result = await service.listEvaluationsForCheckpoint(makeCtx(), 'checkpoint-1');
    expect(result.ok).toBe(true);
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listEvaluationsForObservation returns filtered', async () => {
    await service.createEvaluation(makeCtx(), makeEvalInput() as any);
    const result = await service.listEvaluationsForObservation(makeCtx(), 'obs-1');
    expect(result.ok).toBe(true);
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listEvaluationsForStudent returns filtered', async () => {
    await service.createEvaluation(makeCtx(), makeEvalInput() as any);
    const result = await service.listEvaluationsForStudent(makeCtx(), 'student-1');
    expect(result.ok).toBe(true);
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listEvaluationsByStatus returns filtered', async () => {
    await service.createEvaluation(makeCtx(), makeEvalInput() as any);
    const result = await service.listEvaluationsByStatus(makeCtx(), 'draft');
    expect(result.ok).toBe(true);
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listEvaluationsByResult returns filtered', async () => {
    await service.createEvaluation(makeCtx(), makeEvalInput() as any);
    const result = await service.listEvaluationsByResult(makeCtx(), 'on_track_ready');
    expect(result.ok).toBe(true);
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('lifecycle: draft -> review_ready -> approved_for_future_use', async () => {
    const created = await service.createEvaluation(makeCtx(), makeEvalInput() as any);
    expect(created.status).toBe('draft');

    const reviewed = await service.markEvaluationReviewReady(makeCtx(), created.resourceId!, 'EVALUATION_REVIEW_READY', 'Ready');
    expect(reviewed.status).toBe('review_ready');

    const approved = await service.markEvaluationApprovedForFutureUse(makeCtx(), created.resourceId!, 'EVALUATION_APPROVED', 'Approved');
    expect(approved.status).toBe('approved_for_future_use');
  });

  it('evaluation can be suppressed', async () => {
    const created = await service.createEvaluation(makeCtx(), makeEvalInput() as any);
    const result = await service.suppressEvaluation(makeCtx(), created.resourceId!, 'EVALUATION_SUPPRESSED', 'Suppressed');
    expect(result.status).toBe('suppressed');
  });

  it('evaluation can be blocked', async () => {
    const created = await service.createEvaluation(makeCtx(), makeEvalInput() as any);
    const result = await service.blockEvaluation(makeCtx(), created.resourceId!, 'EVALUATION_BLOCKED', 'Blocked');
    expect(result.status).toBe('blocked');
  });

  it('evaluation can be voided', async () => {
    const created = await service.createEvaluation(makeCtx(), makeEvalInput() as any);
    const result = await service.voidEvaluation(makeCtx(), created.resourceId!, 'EVALUATION_VOIDED', 'Voided');
    expect(result.status).toBe('void');
  });

  it('voided evaluation cannot be blocked', async () => {
    const created = await service.createEvaluation(makeCtx(), makeEvalInput() as any);
    await service.voidEvaluation(makeCtx(), created.resourceId!, '', '');
    const result = await service.blockEvaluation(makeCtx(), created.resourceId!, '', '');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_STATUS');
  });

  it('blocks student role from creating evaluation', async () => {
    const ctx = makeCtx({ actorRole: 'student' });
    const result = await service.createEvaluation(ctx, makeEvalInput() as any);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
  });

  it('blocks request with missing school context', async () => {
    const ctx = makeCtx({ schoolId: '' });
    const result = await service.createEvaluation(ctx, makeEvalInput() as any);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('safety check blocks evaluation with forbidden rubric field', async () => {
    const input = { ...makeEvalInput() as any, rubricText: 'leaked' };
    const result = await service.createEvaluation(makeCtx(), input);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
  });

  it('does not contain score mutation fields', async () => {
    const result = await service.createEvaluation(makeCtx(), makeEvalInput() as any);
    const data = result.data as any;
    expect(data).not.toHaveProperty('score');
    expect(data).not.toHaveProperty('masteryScore');
  });
});
