import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryOutcomeDecisionReadinessService } from '../services/recoveryOutcomeDecisionReadinessService';
import { RecoveryOutcomeSafetyService } from '../services/recoveryOutcomeSafetyService';
import { RecoveryOutcomeAuditBridge } from '../services/recoveryOutcomeAuditBridge';
import { RecoveryOutcomeIdempotencyService } from '../services/recoveryOutcomeIdempotencyService';
import { InMemoryRecoveryOutcomeDecisionReadinessRepository } from '../repositories/inMemoryRecoveryOutcomeRepositories';
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

function makeReadinessInput() {
  return {
    schoolId: 'school-1',
    studentRef: 'student-1',
    resultRecoveryPlanId: 'plan-1',
    recoveryProgressSummaryId: 'psum-1',
    recoveryEvidenceRollupId: 'eroll-1',
    safeReadinessSummary: 'Student is ready for outcome decision',
    readinessChecksJson: { check: 'pass' },
    sourceRefsJson: { progressSummaryId: 'psum-1', evidenceRollupId: 'eroll-1' },
  };
}

describe('Package 19 — Decision Readiness Lifecycle', () => {
  let readinessRepo: InMemoryRecoveryOutcomeDecisionReadinessRepository;
  let safetyService: RecoveryOutcomeSafetyService;
  let auditRepo: InMemoryRecoveryOutcomeAuditRepository;
  let auditBridge: RecoveryOutcomeAuditBridge;
  let idempotencyRepo: InMemoryRecoveryOutcomeIdempotencyRepository;
  let idempotencyService: RecoveryOutcomeIdempotencyService;
  let service: RecoveryOutcomeDecisionReadinessService;

  beforeEach(() => {
    readinessRepo = new InMemoryRecoveryOutcomeDecisionReadinessRepository();
    safetyService = new RecoveryOutcomeSafetyService();
    auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    auditBridge = new RecoveryOutcomeAuditBridge(auditRepo as any);
    idempotencyRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    idempotencyService = new RecoveryOutcomeIdempotencyService(idempotencyRepo as any);
    service = new RecoveryOutcomeDecisionReadinessService(readinessRepo, safetyService, auditBridge, idempotencyService);
  });

  it('creates decision readiness with draft status', async () => {
    const result = await service.createDecisionReadiness(makeCtx(), makeReadinessInput());
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
    expect(result.reasonCode).toBe('READINESS_CREATED');
  });

  it('getDecisionReadiness returns created record', async () => {
    const created = await service.createDecisionReadiness(makeCtx(), makeReadinessInput());
    const fetched = await service.getDecisionReadiness(makeCtx(), created.resourceId!);
    expect(fetched.ok).toBe(true);
    expect(fetched.resourceId).toBe(created.resourceId);
  });

  it('getDecisionReadiness returns not_found for missing id', async () => {
    const result = await service.getDecisionReadiness(makeCtx(), 'missing-id');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('NOT_FOUND');
  });

  it('listDecisionReadinessForSchool returns records for school', async () => {
    await service.createDecisionReadiness(makeCtx(), makeReadinessInput());
    const list = await service.listDecisionReadinessForSchool(makeCtx());
    expect(list.ok).toBe(true);
    expect(list.data).toBeDefined();
    expect(Array.isArray(list.data)).toBe(true);
    expect((list.data as any[]).length).toBe(1);
  });

  it('listDecisionReadinessForStudent returns matching records', async () => {
    await service.createDecisionReadiness(makeCtx(), makeReadinessInput());
    const list = await service.listDecisionReadinessForStudent(makeCtx(), 'student-1');
    expect(list.ok).toBe(true);
    expect((list.data as any[]).length).toBe(1);
  });

  it('listDecisionReadinessForPlan returns matching records', async () => {
    await service.createDecisionReadiness(makeCtx(), makeReadinessInput());
    const list = await service.listDecisionReadinessForPlan(makeCtx(), 'plan-1');
    expect(list.ok).toBe(true);
    expect((list.data as any[]).length).toBe(1);
  });

  it('listDecisionReadinessByStatus returns matching records', async () => {
    await service.createDecisionReadiness(makeCtx(), makeReadinessInput());
    const list = await service.listDecisionReadinessByStatus(makeCtx(), 'draft');
    expect(list.ok).toBe(true);
    expect((list.data as any[]).length).toBe(1);
  });

  it('listDecisionReadinessByStatus returns empty for non-matching status', async () => {
    await service.createDecisionReadiness(makeCtx(), makeReadinessInput());
    const list = await service.listDecisionReadinessByStatus(makeCtx(), 'approved_for_future_use');
    expect(list.ok).toBe(true);
    expect((list.data as any[]).length).toBe(0);
  });

  it('markDecisionReadinessReviewReady transitions to review_ready', async () => {
    const created = await service.createDecisionReadiness(makeCtx(), makeReadinessInput());
    const result = await service.markDecisionReadinessReviewReady(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('review_ready');
  });

  it('approveDecisionReadinessForFutureUse transitions to approved_for_future_use', async () => {
    const created = await service.createDecisionReadiness(makeCtx(), makeReadinessInput());
    const result = await service.approveDecisionReadinessForFutureUse(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('approved_for_future_use');
  });

  it('suppressDecisionReadiness transitions to suppressed', async () => {
    const created = await service.createDecisionReadiness(makeCtx(), makeReadinessInput());
    const result = await service.suppressDecisionReadiness(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('suppressed');
  });

  it('blockDecisionReadiness with reason codes blocks the record', async () => {
    const created = await service.createDecisionReadiness(makeCtx(), makeReadinessInput());
    const result = await service.blockDecisionReadiness(makeCtx(), created.resourceId!, ['INSUFFICIENT_EVIDENCE']);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('blocked');
    expect(result.reasonCode).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('voidDecisionReadiness transitions to void', async () => {
    const created = await service.createDecisionReadiness(makeCtx(), makeReadinessInput());
    const result = await service.voidDecisionReadiness(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('void');
  });

  it('voidDecisionReadiness on already voided returns error', async () => {
    const created = await service.createDecisionReadiness(makeCtx(), makeReadinessInput());
    await service.voidDecisionReadiness(makeCtx(), created.resourceId!);
    const result = await service.voidDecisionReadiness(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_STATUS');
  });

  it('markDecisionReadinessReviewReady on voided record returns error', async () => {
    const created = await service.createDecisionReadiness(makeCtx(), makeReadinessInput());
    await service.voidDecisionReadiness(makeCtx(), created.resourceId!);
    const result = await service.markDecisionReadinessReviewReady(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_STATUS');
  });

  it('student role is blocked from creating decision readiness', async () => {
    const result = await service.createDecisionReadiness(makeCtx({ actorRole: 'student' }), makeReadinessInput());
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('ROLE_BLOCKED');
    expect(result.status).toBe('blocked');
  });

  it('parent role is blocked from creating decision readiness', async () => {
    const result = await service.createDecisionReadiness(makeCtx({ actorRole: 'parent' }), makeReadinessInput());
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('ROLE_BLOCKED');
  });

  it('missing schoolId blocks creation', async () => {
    const result = await service.createDecisionReadiness(makeCtx({ schoolId: '' } as any), makeReadinessInput());
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('missing sourceRefs blocks creation', async () => {
    const input = { ...makeReadinessInput(), sourceRefsJson: {} };
    const result = await service.createDecisionReadiness(makeCtx(), input);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SOURCE_REFS_MISSING');
  });
});
