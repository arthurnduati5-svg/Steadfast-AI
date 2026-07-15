import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryExitCriteriaService } from '../services/recoveryExitCriteriaService';
import { RecoveryOutcomeSafetyService } from '../services/recoveryOutcomeSafetyService';
import { RecoveryOutcomeAuditBridge } from '../services/recoveryOutcomeAuditBridge';
import { RecoveryOutcomeIdempotencyService } from '../services/recoveryOutcomeIdempotencyService';
import { InMemoryRecoveryExitCriteriaRepository } from '../repositories/inMemoryRecoveryOutcomeRepositories';
import { InMemoryRecoveryOutcomeAuditRepository } from '../repositories/inMemoryRecoveryOutcomeRepositories';
import { InMemoryRecoveryOutcomeIdempotencyRepository } from '../repositories/inMemoryRecoveryOutcomeRepositories';
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

function makeExitCriteriaInput() {
  return {
    schoolId: 'school-1',
    resultRecoveryPlanId: 'plan-1',
    criteriaType: 'mastery_threshold' as const,
    safeCriteriaSummary: 'Student must reach 80% proficiency',
    criteriaDetailsJson: { threshold: 80 },
  };
}

describe('Package 19 — Exit Criteria Lifecycle', () => {
  let criteriaRepo: InMemoryRecoveryExitCriteriaRepository;
  let safetyService: RecoveryOutcomeSafetyService;
  let auditRepo: InMemoryRecoveryOutcomeAuditRepository;
  let auditBridge: RecoveryOutcomeAuditBridge;
  let idempotencyRepo: InMemoryRecoveryOutcomeIdempotencyRepository;
  let idempotencyService: RecoveryOutcomeIdempotencyService;
  let service: RecoveryExitCriteriaService;

  beforeEach(() => {
    criteriaRepo = new InMemoryRecoveryExitCriteriaRepository();
    safetyService = new RecoveryOutcomeSafetyService();
    auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    auditBridge = new RecoveryOutcomeAuditBridge(auditRepo as any);
    idempotencyRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    idempotencyService = new RecoveryOutcomeIdempotencyService(idempotencyRepo as any);
    service = new RecoveryExitCriteriaService(criteriaRepo, safetyService, auditBridge, idempotencyService);
  });

  it('creates exit criteria with draft status', async () => {
    const result = await service.createExitCriteria(makeCtx(), makeExitCriteriaInput());
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
    expect(result.reasonCode).toBe('EXIT_CRITERIA_CREATED');
  });

  it('getExitCriteria returns created record', async () => {
    const created = await service.createExitCriteria(makeCtx(), makeExitCriteriaInput());
    const fetched = await service.getExitCriteria(makeCtx(), created.resourceId!);
    expect(fetched.ok).toBe(true);
    expect(fetched.resourceId).toBe(created.resourceId);
  });

  it('getExitCriteria returns not_found for missing id', async () => {
    const result = await service.getExitCriteria(makeCtx(), 'missing-id');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('NOT_FOUND');
  });

  it('listExitCriteriaForSchool returns records for school', async () => {
    await service.createExitCriteria(makeCtx(), makeExitCriteriaInput());
    const list = await service.listExitCriteriaForSchool(makeCtx());
    expect(list.ok).toBe(true);
    expect((list.data as any[]).length).toBe(1);
  });

  it('listExitCriteriaForPlan returns matching records', async () => {
    await service.createExitCriteria(makeCtx(), makeExitCriteriaInput());
    const list = await service.listExitCriteriaForPlan(makeCtx(), 'plan-1');
    expect(list.ok).toBe(true);
    expect((list.data as any[]).length).toBe(1);
  });

  it('listExitCriteriaByStatus returns matching records', async () => {
    await service.createExitCriteria(makeCtx(), makeExitCriteriaInput());
    const list = await service.listExitCriteriaByStatus(makeCtx(), 'draft');
    expect(list.ok).toBe(true);
    expect((list.data as any[]).length).toBe(1);
  });

  it('markExitCriteriaReviewReady transitions to review_ready', async () => {
    const created = await service.createExitCriteria(makeCtx(), makeExitCriteriaInput());
    const result = await service.markExitCriteriaReviewReady(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('review_ready');
  });

  it('approveExitCriteriaForFutureUse transitions to approved_for_future_use', async () => {
    const created = await service.createExitCriteria(makeCtx(), makeExitCriteriaInput());
    const result = await service.approveExitCriteriaForFutureUse(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('approved_for_future_use');
  });

  it('suppressExitCriteria transitions to suppressed', async () => {
    const created = await service.createExitCriteria(makeCtx(), makeExitCriteriaInput());
    const result = await service.suppressExitCriteria(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('suppressed');
  });

  it('blockExitCriteria transitions to blocked', async () => {
    const created = await service.createExitCriteria(makeCtx(), makeExitCriteriaInput());
    const result = await service.blockExitCriteria(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('blocked');
  });

  it('voidExitCriteria transitions to void', async () => {
    const created = await service.createExitCriteria(makeCtx(), makeExitCriteriaInput());
    const result = await service.voidExitCriteria(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('void');
  });

  it('voidExitCriteria on already voided returns error', async () => {
    const created = await service.createExitCriteria(makeCtx(), makeExitCriteriaInput());
    await service.voidExitCriteria(makeCtx(), created.resourceId!);
    const result = await service.voidExitCriteria(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_STATUS');
  });

  it('student role is blocked from creating exit criteria', async () => {
    const result = await service.createExitCriteria(makeCtx({ actorRole: 'student' }), makeExitCriteriaInput());
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('ROLE_BLOCKED');
  });

  it('parent role is blocked from creating exit criteria', async () => {
    const result = await service.createExitCriteria(makeCtx({ actorRole: 'parent' }), makeExitCriteriaInput());
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('ROLE_BLOCKED');
  });

  it('missing schoolId blocks creation', async () => {
    const result = await service.createExitCriteria(makeCtx({ schoolId: '' } as any), makeExitCriteriaInput());
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('admin role can create exit criteria', async () => {
    const result = await service.createExitCriteria(makeCtx({ actorRole: 'admin' }), makeExitCriteriaInput());
    expect(result.ok).toBe(true);
  });
});
