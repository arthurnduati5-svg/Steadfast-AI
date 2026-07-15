import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryProgressSafetyService } from '../services/recoveryProgressSafetyService';
import { RecoveryProgressIdempotencyService } from '../services/recoveryProgressIdempotencyService';
import { RecoveryProgressAuditBridge } from '../services/recoveryProgressAuditBridge';
import { RecoveryProgressObservationService } from '../services/recoveryProgressObservationService';
import { InMemoryRecoveryProgressObservationRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import { InMemoryRecoveryProgressAuditRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import { InMemoryRecoveryProgressIdempotencyRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import type { RecoveryProgressCommandContext } from '../contracts/recoveryProgressContracts';

function makeCtx(overrides?: Partial<RecoveryProgressCommandContext>): RecoveryProgressCommandContext {
  return {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-1',
    idempotencyKey: 'idem-1',
    ...overrides,
  };
}

function makeObservationInput() {
  return {
    studentRef: 'student-1',
    resultRecoveryPlanId: 'plan-1',
    resultRecoveryObjectiveId: 'obj-1',
    resultRecoveryStepId: 'step-1',
    resultRecoveryCheckpointId: 'checkpoint-1',
    resultFollowUpCaseId: 'case-1',
    observationMode: 'mock_observation_only',
    observationType: 'checkpoint_response',
    observationConfidence: 'medium',
    safeObservationSummary: 'Student showed improvement on checkpoint',
    sourceRefsJson: { planRef: 'plan-1' },
    observedSignalsJson: { signal: 'improvement' },
    allowedUseJson: { futureReview: true },
    blockedUseJson: {},
    blockedReasonCodesJson: [],
  } as const;
}

describe('Package 18 — Observation Lifecycle', () => {
  let observationRepo: InMemoryRecoveryProgressObservationRepository;
  let safetyService: RecoveryProgressSafetyService;
  let auditRepo: InMemoryRecoveryProgressAuditRepository;
  let auditBridge: RecoveryProgressAuditBridge;
  let idempotencyRepo: InMemoryRecoveryProgressIdempotencyRepository;
  let idempotencyService: RecoveryProgressIdempotencyService;
  let service: RecoveryProgressObservationService;

  beforeEach(() => {
    observationRepo = new InMemoryRecoveryProgressObservationRepository();
    safetyService = new RecoveryProgressSafetyService();
    auditRepo = new InMemoryRecoveryProgressAuditRepository();
    auditBridge = new RecoveryProgressAuditBridge(auditRepo as any);
    idempotencyRepo = new InMemoryRecoveryProgressIdempotencyRepository();
    idempotencyService = new RecoveryProgressIdempotencyService(idempotencyRepo as any);
    service = new RecoveryProgressObservationService(observationRepo, safetyService, auditBridge, idempotencyService);
  });

  it('creates observation with draft status', async () => {
    const result = await service.createObservation(makeCtx(), makeObservationInput() as any);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
    expect(result.reasonCode).toBe('OBSERVATION_CREATED');
  });

  it('getObservation returns created observation', async () => {
    const created = await service.createObservation(makeCtx(), makeObservationInput() as any);
    const fetched = await service.getObservation(makeCtx(), created.resourceId!);
    expect(fetched.ok).toBe(true);
    expect(fetched.resourceId).toBe(created.resourceId);
    expect(fetched.status).toBe('draft');
  });

  it('getObservation returns not_found for missing id', async () => {
    const result = await service.getObservation(makeCtx(), 'missing-id');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('NOT_FOUND');
  });

  it('listObservationsForSchool returns observations for school', async () => {
    await service.createObservation(makeCtx(), makeObservationInput() as any);
    const result = await service.listObservationsForSchool(makeCtx());
    expect(result.ok).toBe(true);
    expect(result.data).toBeInstanceOf(Array);
  });

  it('listObservationsForStudent returns filtered by student', async () => {
    await service.createObservation(makeCtx(), makeObservationInput() as any);
    const result = await service.listObservationsForStudent(makeCtx(), 'student-1');
    expect(result.ok).toBe(true);
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0].studentRef).toBe('student-1');
  });

  it('listObservationsForPlan returns filtered by plan', async () => {
    await service.createObservation(makeCtx(), makeObservationInput() as any);
    const result = await service.listObservationsForPlan(makeCtx(), 'plan-1');
    expect(result.ok).toBe(true);
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listObservationsForCheckpoint returns filtered by checkpoint', async () => {
    await service.createObservation(makeCtx(), makeObservationInput() as any);
    const result = await service.listObservationsForCheckpoint(makeCtx(), 'checkpoint-1');
    expect(result.ok).toBe(true);
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listObservationsByStatus returns filtered by status', async () => {
    await service.createObservation(makeCtx(), makeObservationInput() as any);
    const result = await service.listObservationsByStatus(makeCtx(), 'draft');
    expect(result.ok).toBe(true);
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listObservationsByType returns filtered by type', async () => {
    await service.createObservation(makeCtx(), makeObservationInput() as any);
    const result = await service.listObservationsByType(makeCtx(), 'checkpoint_response');
    expect(result.ok).toBe(true);
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('lifecycle: draft -> review_ready -> approved_for_future_use', async () => {
    const created = await service.createObservation(makeCtx(), makeObservationInput() as any);
    expect(created.status).toBe('draft');

    const reviewed = await service.markObservationReviewReady(makeCtx(), created.resourceId!, 'OBSERVATION_REVIEW_READY', 'Ready for review');
    expect(reviewed.status).toBe('review_ready');

    const approved = await service.markObservationApprovedForFutureUse(makeCtx(), created.resourceId!, 'OBSERVATION_APPROVED', 'Approved');
    expect(approved.status).toBe('approved_for_future_use');
  });

  it('observation can be suppressed', async () => {
    const created = await service.createObservation(makeCtx(), makeObservationInput() as any);
    const suppressed = await service.suppressObservation(makeCtx(), created.resourceId!, 'OBSERVATION_SUPPRESSED', 'Suppressed');
    expect(suppressed.status).toBe('suppressed');
  });

  it('observation can be blocked', async () => {
    const created = await service.createObservation(makeCtx(), makeObservationInput() as any);
    const blocked = await service.blockObservation(makeCtx(), created.resourceId!, 'OBSERVATION_BLOCKED', 'Blocked');
    expect(blocked.status).toBe('blocked');
  });

  it('observation can be voided', async () => {
    const created = await service.createObservation(makeCtx(), makeObservationInput() as any);
    const voided = await service.voidObservation(makeCtx(), created.resourceId!, 'OBSERVATION_VOIDED', 'Voided');
    expect(voided.status).toBe('void');
  });

  it('voided observation cannot be suppressed', async () => {
    const created = await service.createObservation(makeCtx(), makeObservationInput() as any);
    await service.voidObservation(makeCtx(), created.resourceId!, 'OBSERVATION_VOIDED', 'Voided');
    const result = await service.suppressObservation(makeCtx(), created.resourceId!, '', '');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_STATUS');
  });

  it('blocks student role from creating observation', async () => {
    const ctx = makeCtx({ actorRole: 'student' });
    const result = await service.createObservation(ctx, makeObservationInput() as any);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
  });

  it('blocks request with missing school context', async () => {
    const ctx = makeCtx({ schoolId: '' });
    const result = await service.createObservation(ctx, makeObservationInput() as any);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('safety check blocks observation with forbidden answer key field', async () => {
    const input = { ...makeObservationInput() as any, answerKeySafeRef: 'leaked' };
    const result = await service.createObservation(makeCtx(), input);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
  });

  it('does not contain sendNotification method', () => {
    const methods = Object.getOwnPropertyNames(RecoveryProgressObservationService.prototype);
    expect(methods).not.toContain('sendNotification');
    expect(methods).not.toContain('sendEmail');
  });

  it('does not contain score mutation fields on created record', async () => {
    const result = await service.createObservation(makeCtx(), makeObservationInput() as any);
    const data = result.data as any;
    expect(data).not.toHaveProperty('score');
    expect(data).not.toHaveProperty('grade');
    expect(data).not.toHaveProperty('masteryScore');
  });
});
