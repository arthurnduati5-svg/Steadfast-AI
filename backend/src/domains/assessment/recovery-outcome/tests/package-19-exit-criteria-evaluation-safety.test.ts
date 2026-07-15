import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryExitCriteriaEvaluationService } from '../services/recoveryExitCriteriaEvaluationService';
import { RecoveryOutcomeSafetyService } from '../services/recoveryOutcomeSafetyService';
import { RecoveryOutcomeAuditBridge } from '../services/recoveryOutcomeAuditBridge';
import { RecoveryOutcomeIdempotencyService } from '../services/recoveryOutcomeIdempotencyService';
import { InMemoryRecoveryExitCriteriaEvaluationRepository, InMemoryRecoveryOutcomeAuditRepository, InMemoryRecoveryOutcomeIdempotencyRepository } from '../repositories/inMemoryRecoveryOutcomeRepositories';
import type { RecoveryOutcomeCommandContext } from '../contracts/recoveryOutcomeContracts';

function makeCtx(overrides?: Partial<RecoveryOutcomeCommandContext>): RecoveryOutcomeCommandContext {
  return {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-1',
    idempotencyKey: 'idem-1',
    ...overrides,
  };
}

function makeInput() {
  return {
    schoolId: 'school-1',
    studentRef: 'student-1',
    resultRecoveryPlanId: 'plan-1',
    recoveryExitCriteriaId: 'criteria-1',
    evaluationResult: 'met' as const,
    safeEvaluationSummary: 'Student met the exit criteria',
    evaluationDetailsJson: { evidence: 'sufficient' },
    sourceRefsJson: { progressSummaryId: 'psum-1', evidenceRollupId: 'eroll-1' },
  };
}

describe('Package 19 — Exit Criteria Evaluation Lifecycle and Safety', () => {
  let evalRepo: InMemoryRecoveryExitCriteriaEvaluationRepository;
  let safetyService: RecoveryOutcomeSafetyService;
  let auditRepo: InMemoryRecoveryOutcomeAuditRepository;
  let auditBridge: RecoveryOutcomeAuditBridge;
  let idempotencyRepo: InMemoryRecoveryOutcomeIdempotencyRepository;
  let idempotencyService: RecoveryOutcomeIdempotencyService;
  let service: RecoveryExitCriteriaEvaluationService;

  beforeEach(() => {
    evalRepo = new InMemoryRecoveryExitCriteriaEvaluationRepository();
    safetyService = new RecoveryOutcomeSafetyService();
    auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    auditBridge = new RecoveryOutcomeAuditBridge(auditRepo as any);
    idempotencyRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    idempotencyService = new RecoveryOutcomeIdempotencyService(idempotencyRepo as any);
    service = new RecoveryExitCriteriaEvaluationService(evalRepo as any, safetyService, auditBridge, idempotencyService);
  });

  it('creates exit criteria evaluation via service', async () => {
    const result = await service.createExitCriteriaEvaluation(makeCtx(), makeInput());
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
    expect(result.reasonCode).toBe('EVALUATION_CREATED');
  });

  it('get exit criteria evaluation by ID', async () => {
    const created = await service.createExitCriteriaEvaluation(makeCtx(), makeInput());
    const fetched = await service.getExitCriteriaEvaluation(makeCtx(), created.resourceId!);
    expect(fetched.ok).toBe(true);
    expect(fetched.resourceId).toBe(created.resourceId);
    expect((fetched.data as any).recoveryExitCriteriaEvaluationId).toBe(created.resourceId);
  });

  it('get returns not_found for missing evaluation', async () => {
    const result = await service.getExitCriteriaEvaluation(makeCtx(), 'missing-id');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('NOT_FOUND');
  });

  it('list by planId', async () => {
    await service.createExitCriteriaEvaluation(makeCtx(), makeInput());
    const list = await service.listEvaluationsForPlan(makeCtx(), 'plan-1');
    expect(list.ok).toBe(true);
    expect((list.data as any[]).length).toBe(1);
  });

  it('list by studentRef', async () => {
    await service.createExitCriteriaEvaluation(makeCtx(), makeInput());
    const list = await service.listEvaluationsForStudent(makeCtx(), 'student-1');
    expect(list.ok).toBe(true);
    expect((list.data as any[]).length).toBe(1);
  });

  it('list by result', async () => {
    await service.createExitCriteriaEvaluation(makeCtx(), makeInput());
    const list = await service.listEvaluationsByResult(makeCtx(), 'met');
    expect(list.ok).toBe(true);
    expect((list.data as any[]).length).toBe(1);
  });

  it('list by result returns empty for non-matching', async () => {
    await service.createExitCriteriaEvaluation(makeCtx(), makeInput());
    const list = await service.listEvaluationsByResult(makeCtx(), 'not_met');
    expect(list.ok).toBe(true);
    expect((list.data as any[]).length).toBe(0);
  });

  it('status transitions: draft -> review_ready -> approved_for_future_use -> suppressed -> blocked -> void', async () => {
    const created = await service.createExitCriteriaEvaluation(makeCtx(), makeInput());
    const id = created.resourceId!;

    const reviewReady = await service.markEvaluationReviewReady(makeCtx(), id);
    expect(reviewReady.status).toBe('review_ready');

    const approved = await service.approveEvaluationForFutureUse(makeCtx(), id);
    expect(approved.status).toBe('approved_for_future_use');

    const suppressed = await service.suppressEvaluation(makeCtx(), id);
    expect(suppressed.status).toBe('suppressed');

    const blocked = await service.blockEvaluation(makeCtx(), id);
    expect(blocked.status).toBe('blocked');

    const voided = await service.voidEvaluation(makeCtx(), id);
    expect(voided.status).toBe('void');
  });

  it('cannot review voided evaluation', async () => {
    const created = await service.createExitCriteriaEvaluation(makeCtx(), makeInput());
    await service.voidEvaluation(makeCtx(), created.resourceId!);
    const result = await service.markEvaluationReviewReady(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_STATUS');
  });

  it('cannot void already voided evaluation', async () => {
    const created = await service.createExitCriteriaEvaluation(makeCtx(), makeInput());
    await service.voidEvaluation(makeCtx(), created.resourceId!);
    const result = await service.voidEvaluation(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_STATUS');
  });

  it('safety service blocks live action keywords in evaluation summaries', async () => {
    const input = makeInput();
    input.safeEvaluationSummary = 'live completion of recovery plan';
    const result = await service.createExitCriteriaEvaluation(makeCtx(), input);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
    expect(result.reasonCode).toBe('LIVE_COMPLETION');
  });

  it('safety service blocks score mutation keywords', async () => {
    const input = makeInput();
    input.safeEvaluationSummary = 'the final score is 85';
    const result = await service.createExitCriteriaEvaluation(makeCtx(), input);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
    expect(result.reasonCode).toBe('SCORE_MUTATION');
  });

  it('student role is blocked from creating evaluations', async () => {
    const result = await service.createExitCriteriaEvaluation(makeCtx({ actorRole: 'student' }), makeInput());
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('ROLE_BLOCKED');
  });

  it('missing schoolId blocks evaluation creation', async () => {
    const result = await service.createExitCriteriaEvaluation(makeCtx({ schoolId: '' } as any), makeInput());
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('evaluation contains sourceRefsJson reference', async () => {
    const result = await service.createExitCriteriaEvaluation(makeCtx({ idempotencyKey: 'idem-refs' }), makeInput());
    expect(result.ok).toBe(true);
    const data = result.data as any;
    expect(data.sourceRefsJson).toBeDefined();
    expect(data.sourceRefsJson.progressSummaryId).toBe('psum-1');
  });

  it('evaluation contains evaluationResult field', async () => {
    const result = await service.createExitCriteriaEvaluation(makeCtx({ idempotencyKey: 'idem-result' }), makeInput());
    const data = result.data as any;
    expect(data.evaluationResult).toBe('met');
  });

  it('missing sourceRefs blocks evaluation creation', async () => {
    const input = makeInput();
    const result = await service.createExitCriteriaEvaluation(makeCtx(), { ...input, sourceRefsJson: {} as any });
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SOURCE_REFS_MISSING');
  });
});
