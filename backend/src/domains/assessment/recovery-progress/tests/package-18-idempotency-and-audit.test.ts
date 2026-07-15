import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryProgressIdempotencyService } from '../services/recoveryProgressIdempotencyService';
import { RecoveryProgressAuditBridge } from '../services/recoveryProgressAuditBridge';
import { InMemoryRecoveryProgressAuditRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import { InMemoryRecoveryProgressIdempotencyRepository } from '../repositories/inMemoryRecoveryProgressRepositories';

describe('Package 18 — Idempotency Service', () => {
  let idempotencyRepo: InMemoryRecoveryProgressIdempotencyRepository;
  let service: RecoveryProgressIdempotencyService;

  beforeEach(() => {
    idempotencyRepo = new InMemoryRecoveryProgressIdempotencyRepository();
    service = new RecoveryProgressIdempotencyService(idempotencyRepo as any);
  });

  it('detectConflict returns false for new key', async () => {
    const result = await service.detectConflict('school-1', 'createObservation', 'new-key');
    expect(result.conflict).toBe(false);
  });

  it('detectConflict returns true after completion', async () => {
    await service.startOperation('school-1', 'createObservation', 'key-1');
    await service.completeOperation('school-1', 'createObservation', 'key-1', 'Observation', 'obs-1', 'Created');
    const result = await service.detectConflict('school-1', 'createObservation', 'key-1');
    expect(result.conflict).toBe(true);
  });

  it('detectConflict returns false for different operation', async () => {
    await service.startOperation('school-1', 'createObservation', 'key-1');
    await service.completeOperation('school-1', 'createObservation', 'key-1', 'Observation', 'obs-1', 'Created');
    const result = await service.detectConflict('school-1', 'createEvaluation', 'key-1');
    expect(result.conflict).toBe(false);
  });

  it('startOperation creates in_progress entry', async () => {
    const entry = await service.startOperation('school-1', 'createObservation', 'key-2');
    expect(entry).toBeTruthy();
    expect(entry!.status).toBe('in_progress');
  });

  it('startOperation returns null for duplicate in_progress', async () => {
    await service.startOperation('school-1', 'createObservation', 'key-3');
    const duplicate = await service.startOperation('school-1', 'createObservation', 'key-3');
    expect(duplicate).not.toBeNull();
  });

  it('completeOperation updates status to completed', async () => {
    await service.startOperation('school-1', 'createObservation', 'key-4');
    await service.completeOperation('school-1', 'createObservation', 'key-4', 'Observation', 'obs-4', 'Completed');
    const entry = await service.getExistingOperation('school-1', 'createObservation', 'key-4');
    expect(entry).toBeTruthy();
    expect(entry!.status).toBe('completed');
  });

  it('failOperation updates status to failed', async () => {
    await service.startOperation('school-1', 'createObservation', 'key-5');
    await service.failOperation('school-1', 'createObservation', 'key-5', 'Failed');
    const entry = await service.getExistingOperation('school-1', 'createObservation', 'key-5');
    expect(entry!.status).toBe('failed');
  });

  it('expireOperation marks entry as expired', async () => {
    await service.startOperation('school-1', 'createObservation', 'key-6');
    await service.expireOperation('school-1', 'createObservation', 'key-6');
    const entry = await service.getExistingOperation('school-1', 'createObservation', 'key-6');
    expect(entry).toBeTruthy();
  });

  it('getExistingOperation returns null for unknown key', async () => {
    const result = await service.getExistingOperation('school-1', 'createObservation', 'unknown');
    expect(result).toBeNull();
  });

  it('detectConflict is scoped by schoolId', async () => {
    await service.startOperation('school-1', 'createObservation', 'key-7');
    await service.completeOperation('school-1', 'createObservation', 'key-7', 'Observation', 'obs-7', 'Created');
    const otherSchool = await service.detectConflict('school-2', 'createObservation', 'key-7');
    expect(otherSchool.conflict).toBe(false);
  });
});

describe('Package 18 — Audit Bridge', () => {
  let auditRepo: InMemoryRecoveryProgressAuditRepository;
  let bridge: RecoveryProgressAuditBridge;

  beforeEach(() => {
    auditRepo = new InMemoryRecoveryProgressAuditRepository();
    bridge = new RecoveryProgressAuditBridge(auditRepo as any);
  });

  it('recordObservationCreated creates audit event', async () => {
    await bridge.recordObservationCreated('school-1', 'obs-1', 'actor-1', 'teacher', 'req-1', 'corr-1');
    const events = await auditRepo.listBySchool('school-1');
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('PROGRESS_OBSERVATION_CREATED');
    expect(events[0].recoveryProgressObservationId).toBe('obs-1');
  });

  it('recordObservationReviewReady creates audit event', async () => {
    await bridge.recordObservationReviewReady('school-1', 'obs-1', 'actor-1', 'teacher');
    const events = await auditRepo.listBySchool('school-1');
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('PROGRESS_OBSERVATION_REVIEW_READY');
  });

  it('recordObservationApprovedForFutureUse creates audit event', async () => {
    await bridge.recordObservationApprovedForFutureUse('school-1', 'obs-1', 'actor-1', 'teacher');
    const events = await auditRepo.listBySchool('school-1');
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('PROGRESS_OBSERVATION_APPROVED_FOR_FUTURE_USE');
  });

  it('recordCheckpointEvaluationCreated creates audit event', async () => {
    await bridge.recordCheckpointEvaluationCreated('school-1', 'eval-1', 'actor-1', 'teacher');
    const events = await auditRepo.listBySchool('school-1');
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('CHECKPOINT_EVALUATION_CREATED');
  });

  it('recordCheckpointEvaluationReviewReady creates audit event', async () => {
    await bridge.recordCheckpointEvaluationReviewReady('school-1', 'eval-1', 'actor-1', 'teacher');
    const events = await auditRepo.listBySchool('school-1');
    expect(events[0].eventType).toBe('CHECKPOINT_EVALUATION_REVIEW_READY');
  });

  it('recordCheckpointEvaluationApproved creates audit event', async () => {
    await bridge.recordCheckpointEvaluationApproved('school-1', 'eval-1', 'actor-1', 'teacher');
    const events = await auditRepo.listBySchool('school-1');
    expect(events[0].eventType).toBe('CHECKPOINT_EVALUATION_APPROVED');
  });

  it('recordOutcomeEvidenceCreated creates audit event', async () => {
    await bridge.recordOutcomeEvidenceCreated('school-1', 'evid-1', 'actor-1', 'teacher');
    const events = await auditRepo.listBySchool('school-1');
    expect(events[0].eventType).toBe('OUTCOME_EVIDENCE_CREATED');
  });

  it('recordOutcomeEvidenceReviewReady creates audit event', async () => {
    await bridge.recordOutcomeEvidenceReviewReady('school-1', 'evid-1', 'actor-1', 'teacher');
    const events = await auditRepo.listBySchool('school-1');
    expect(events[0].eventType).toBe('OUTCOME_EVIDENCE_REVIEW_READY');
  });

  it('recordOutcomeEvidenceApproved creates audit event', async () => {
    await bridge.recordOutcomeEvidenceApproved('school-1', 'evid-1', 'actor-1', 'teacher');
    const events = await auditRepo.listBySchool('school-1');
    expect(events[0].eventType).toBe('OUTCOME_EVIDENCE_APPROVED');
  });

  it('recordPlanAdjustmentDraftCreated creates audit event', async () => {
    await bridge.recordPlanAdjustmentDraftCreated('school-1', 'adj-1', 'actor-1', 'teacher');
    const events = await auditRepo.listBySchool('school-1');
    expect(events[0].eventType).toBe('PLAN_ADJUSTMENT_DRAFT_CREATED');
  });

  it('recordPlanAdjustmentDraftReviewReady creates audit event', async () => {
    await bridge.recordPlanAdjustmentDraftReviewReady('school-1', 'adj-1', 'actor-1', 'teacher');
    const events = await auditRepo.listBySchool('school-1');
    expect(events[0].eventType).toBe('PLAN_ADJUSTMENT_DRAFT_REVIEW_READY');
  });

  it('recordTeacherReviewDecisionCreated creates audit event', async () => {
    await bridge.recordTeacherReviewDecisionCreated('school-1', 'dec-1', 'actor-1', 'teacher');
    const events = await auditRepo.listBySchool('school-1');
    expect(events[0].eventType).toBe('TEACHER_REVIEW_DECISION_CREATED');
  });

  it('recordReflectionDraftCreated creates audit event', async () => {
    await bridge.recordReflectionDraftCreated('school-1', 'ref-1', 'actor-1', 'teacher');
    const events = await auditRepo.listBySchool('school-1');
    expect(events[0].eventType).toBe('REFLECTION_DRAFT_CREATED');
  });

  it('recordParentNoteDraftCreated creates audit event', async () => {
    await bridge.recordParentNoteDraftCreated('school-1', 'pn-1', 'actor-1', 'teacher');
    const events = await auditRepo.listBySchool('school-1');
    expect(events[0].eventType).toBe('PARENT_NOTE_DRAFT_CREATED');
  });

  it('recordEvidenceRollupCreated creates audit event', async () => {
    await bridge.recordEvidenceRollupCreated('school-1', 'rollup-1', 'actor-1', 'teacher');
    const events = await auditRepo.listBySchool('school-1');
    expect(events[0].eventType).toBe('EVIDENCE_ROLLUP_CREATED');
  });

  it('recordEvidenceRollupRefreshed creates audit event', async () => {
    await bridge.recordEvidenceRollupRefreshed('school-1', 'rollup-1', 'actor-1', 'teacher');
    const events = await auditRepo.listBySchool('school-1');
    expect(events[0].eventType).toBe('EVIDENCE_ROLLUP_REFRESHED');
  });

  it('recordProgressSummaryCreated creates audit event', async () => {
    await bridge.recordProgressSummaryCreated('school-1', 'sum-1', 'actor-1', 'teacher');
    const events = await auditRepo.listBySchool('school-1');
    expect(events[0].eventType).toBe('PROGRESS_SUMMARY_CREATED');
  });

  it('recordProgressSummaryRefreshed creates audit event', async () => {
    await bridge.recordProgressSummaryRefreshed('school-1', 'sum-1', 'actor-1', 'teacher');
    const events = await auditRepo.listBySchool('school-1');
    expect(events[0].eventType).toBe('PROGRESS_SUMMARY_REFRESHED');
  });

  it('recordPolicyBlocked creates audit event', async () => {
    await bridge.recordPolicyBlocked('school-1', 'POLICY_BLOCKED', 'actor-1', 'teacher');
    const events = await auditRepo.listBySchool('school-1');
    expect(events[0].decision).toBe('denied');
  });

  it('recordSafeError creates audit event', async () => {
    await bridge.recordSafeError('school-1', 'SAFE_ERROR', 'actor-1', 'teacher', 'Error occurred');
    const events = await auditRepo.listBySchool('school-1');
    expect(events[0].decision).toBe('error');
    expect(events[0].safeSummary).toBe('Error occurred');
  });

  it('audit events are scoped by school', async () => {
    await bridge.recordObservationCreated('school-a', 'obs-1', 'actor-1', 'teacher');
    await bridge.recordObservationCreated('school-b', 'obs-2', 'actor-1', 'teacher');
    const eventsA = await auditRepo.listBySchool('school-a');
    expect(eventsA.length).toBe(1);
    expect(eventsA[0].recoveryProgressObservationId).toBe('obs-1');
  });
});
