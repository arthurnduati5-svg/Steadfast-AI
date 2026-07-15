import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryProgressSafetyService } from '../services/recoveryProgressSafetyService';
import { RecoveryProgressIdempotencyService } from '../services/recoveryProgressIdempotencyService';
import { RecoveryProgressAuditBridge } from '../services/recoveryProgressAuditBridge';
import { RecoveryOutcomeEvidenceService } from '../services/recoveryOutcomeEvidenceService';
import { InMemoryRecoveryOutcomeEvidenceRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import { InMemoryRecoveryProgressAuditRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import { InMemoryRecoveryProgressIdempotencyRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import type { RecoveryProgressCommandContext } from '../contracts/recoveryProgressContracts';

function makeCtx(overrides?: Partial<RecoveryProgressCommandContext>): RecoveryProgressCommandContext {
  return { schoolId: 'school-1', actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'idem-1', ...overrides };
}

function makeEvidenceInput() {
  return {
    studentRef: 'student-1',
    resultRecoveryPlanId: 'plan-1',
    resultRecoveryObjectiveId: 'obj-1',
    recoveryProgressObservationId: 'obs-1',
    recoveryCheckpointEvaluationId: 'eval-1',
    evidenceType: 'learning_evidence_ref',
    safeEvidenceSummary: 'Student completed learning objective',
    sourceEvidenceRefsJson: { obsRef: 'obs-1' },
    learningObjectiveRefsJson: { lo: 'lo-1' },
    questionRefsJson: { q: 'q-1' },
    resourceRefsJson: { r: 'r-1' },
    allowedAudienceJson: { teacher: true },
    blockedReasonCodesJson: [],
  } as const;
}

describe('Package 18 — Outcome Evidence Lifecycle', () => {
  let evidenceRepo: InMemoryRecoveryOutcomeEvidenceRepository;
  let safetyService: RecoveryProgressSafetyService;
  let auditRepo: InMemoryRecoveryProgressAuditRepository;
  let auditBridge: RecoveryProgressAuditBridge;
  let idempotencyRepo: InMemoryRecoveryProgressIdempotencyRepository;
  let idempotencyService: RecoveryProgressIdempotencyService;
  let service: RecoveryOutcomeEvidenceService;

  beforeEach(() => {
    evidenceRepo = new InMemoryRecoveryOutcomeEvidenceRepository();
    safetyService = new RecoveryProgressSafetyService();
    auditRepo = new InMemoryRecoveryProgressAuditRepository();
    auditBridge = new RecoveryProgressAuditBridge(auditRepo as any);
    idempotencyRepo = new InMemoryRecoveryProgressIdempotencyRepository();
    idempotencyService = new RecoveryProgressIdempotencyService(idempotencyRepo as any);
    service = new RecoveryOutcomeEvidenceService(evidenceRepo, safetyService, auditBridge, idempotencyService);
  });

  it('creates evidence with draft status', async () => {
    const result = await service.createEvidence(makeCtx(), makeEvidenceInput() as any);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
    expect(result.reasonCode).toBe('EVIDENCE_CREATED');
  });

  it('getEvidence returns created evidence', async () => {
    const created = await service.createEvidence(makeCtx(), makeEvidenceInput() as any);
    const fetched = await service.getEvidence(makeCtx(), created.resourceId!);
    expect(fetched.ok).toBe(true);
    expect(fetched.resourceId).toBe(created.resourceId);
  });

  it('getEvidence returns not_found for missing id', async () => {
    const result = await service.getEvidence(makeCtx(), 'missing');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('NOT_FOUND');
  });

  it('listEvidenceForPlan returns filtered', async () => {
    await service.createEvidence(makeCtx(), makeEvidenceInput() as any);
    const result = await service.listEvidenceForPlan(makeCtx(), 'plan-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listEvidenceForObjective returns filtered', async () => {
    await service.createEvidence(makeCtx(), makeEvidenceInput() as any);
    const result = await service.listEvidenceForObjective(makeCtx(), 'obj-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listEvidenceForObservation returns filtered', async () => {
    await service.createEvidence(makeCtx(), makeEvidenceInput() as any);
    const result = await service.listEvidenceForObservation(makeCtx(), 'obs-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listEvidenceForEvaluation returns filtered', async () => {
    await service.createEvidence(makeCtx(), makeEvidenceInput() as any);
    const result = await service.listEvidenceForEvaluation(makeCtx(), 'eval-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listEvidenceForStudent returns filtered', async () => {
    await service.createEvidence(makeCtx(), makeEvidenceInput() as any);
    const result = await service.listEvidenceForStudent(makeCtx(), 'student-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('lifecycle: draft -> review_ready -> approved_for_future_use', async () => {
    const created = await service.createEvidence(makeCtx(), makeEvidenceInput() as any);
    expect(created.status).toBe('draft');

    const reviewed = await service.markEvidenceReviewReady(makeCtx(), created.resourceId!, 'EVIDENCE_REVIEW_READY', 'Ready');
    expect(reviewed.status).toBe('review_ready');

    const approved = await service.markEvidenceApprovedForFutureUse(makeCtx(), created.resourceId!, 'EVIDENCE_APPROVED', 'Approved');
    expect(approved.status).toBe('approved_for_future_use');
  });

  it('evidence can be suppressed', async () => {
    const created = await service.createEvidence(makeCtx(), makeEvidenceInput() as any);
    const result = await service.suppressEvidence(makeCtx(), created.resourceId!, 'EVIDENCE_SUPPRESSED', 'Suppressed');
    expect(result.status).toBe('suppressed');
  });

  it('evidence can be voided', async () => {
    const created = await service.createEvidence(makeCtx(), makeEvidenceInput() as any);
    const result = await service.voidEvidence(makeCtx(), created.resourceId!, 'EVIDENCE_VOIDED', 'Voided');
    expect(result.status).toBe('void');
  });

  it('voided evidence cannot be suppressed', async () => {
    const created = await service.createEvidence(makeCtx(), makeEvidenceInput() as any);
    await service.voidEvidence(makeCtx(), created.resourceId!, '', '');
    const result = await service.suppressEvidence(makeCtx(), created.resourceId!, '', '');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_STATUS');
  });

  it('blocks student role from creating evidence', async () => {
    const ctx = makeCtx({ actorRole: 'student' });
    const result = await service.createEvidence(ctx, makeEvidenceInput() as any);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
  });

  it('blocks request with missing school context', async () => {
    const ctx = makeCtx({ schoolId: '' });
    const result = await service.createEvidence(ctx, makeEvidenceInput() as any);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('safety check blocks evidence with unreleased grade', async () => {
    const input = { ...makeEvidenceInput() as any, unreleasedScore: 85 };
    const result = await service.createEvidence(makeCtx(), input);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
  });

  it('does not contain score mutation fields', async () => {
    const result = await service.createEvidence(makeCtx(), makeEvidenceInput() as any);
    const data = result.data as any;
    expect(data).not.toHaveProperty('score');
    expect(data).not.toHaveProperty('masteryLevel');
  });
});
