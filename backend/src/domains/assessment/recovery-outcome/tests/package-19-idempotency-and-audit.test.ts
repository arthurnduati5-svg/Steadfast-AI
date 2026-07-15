import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryOutcomeIdempotencyService } from '../services/recoveryOutcomeIdempotencyService';
import { RecoveryOutcomeAuditBridge } from '../services/recoveryOutcomeAuditBridge';
import { RecoveryOutcomeDecisionReadinessService } from '../services/recoveryOutcomeDecisionReadinessService';
import { RecoveryExitCriteriaEvaluationService } from '../services/recoveryExitCriteriaEvaluationService';
import { RecoveryContinuationDecisionDraftService } from '../services/recoveryContinuationDecisionDraftService';
import { RecoveryOutcomeSafetyService } from '../services/recoveryOutcomeSafetyService';
import {
  InMemoryRecoveryOutcomeIdempotencyRepository,
  InMemoryRecoveryOutcomeAuditRepository,
  InMemoryRecoveryOutcomeDecisionReadinessRepository,
  InMemoryRecoveryExitCriteriaEvaluationRepository,
  InMemoryRecoveryContinuationDecisionDraftRepository,
} from '../repositories/inMemoryRecoveryOutcomeRepositories';

function makeCtx(overrides?: Record<string, string | undefined>) {
  return {
    schoolId: overrides?.schoolId ?? 'school-1',
    actorId: overrides?.actorId ?? 'actor-1',
    actorRole: overrides?.actorRole ?? 'teacher',
    correlationId: overrides?.correlationId ?? 'corr-1',
    idempotencyKey: overrides?.idempotencyKey ?? 'idem-test-1',
    requestId: overrides?.requestId ?? 'req-1',
  };
}

describe('Package 19 — Idempotency and Audit', () => {
  let idempotencyRepo: InMemoryRecoveryOutcomeIdempotencyRepository;
  let auditRepo: InMemoryRecoveryOutcomeAuditRepository;
  let idempotencyService: RecoveryOutcomeIdempotencyService;
  let auditBridge: RecoveryOutcomeAuditBridge;

  beforeEach(() => {
    idempotencyRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    idempotencyService = new RecoveryOutcomeIdempotencyService(idempotencyRepo as any);
    auditBridge = new RecoveryOutcomeAuditBridge(auditRepo as any);
  });

  describe('IdempotencyService', () => {
    it('detectConflict returns no conflict for new keys', async () => {
      const result = await idempotencyService.detectConflict('school-1', 'testOperation', 'new-key');
      expect(result.conflict).toBe(false);
      expect(result.existing).toBeUndefined();
    });

    it('startOperation creates an entry', async () => {
      const entry = await idempotencyService.startOperation('school-1', 'testOperation', 'start-key');
      expect(entry).toBeDefined();
      expect(entry.status).toBe('in_progress');
      expect(entry.operation).toBe('testOperation');
      expect(entry.idempotencyKey).toBe('start-key');
    });

    it('duplicate detectConflict with same key after startOperation returns no conflict (in_progress)', async () => {
      await idempotencyService.startOperation('school-1', 'testOperation', 'dup-key');
      const result = await idempotencyService.detectConflict('school-1', 'testOperation', 'dup-key');
      expect(result.conflict).toBe(false);
    });

    it('completeOperation marks entry completed and detectConflict returns conflict', async () => {
      await idempotencyService.startOperation('school-1', 'testOperation', 'complete-key');
      await idempotencyService.completeOperation('school-1', 'testOperation', 'complete-key', 'TestResource', 'res-1', 'Completed successfully');
      const conflict = await idempotencyService.detectConflict('school-1', 'testOperation', 'complete-key');
      expect(conflict.conflict).toBe(true);
      expect(conflict.existing?.status).toBe('completed');
      expect(conflict.existing?.safeResultSummary).toBe('Completed successfully');
    });

    it('checkIdempotency returns entry when completed', async () => {
      await idempotencyService.startOperation('school-1', 'testOp', 'check-key');
      await idempotencyService.completeOperation('school-1', 'testOp', 'check-key', 'Res', 'rid', 'done');
      const result = await idempotencyService.checkIdempotency('school-1', 'testOp', 'check-key');
      expect(result).not.toBeNull();
      expect(result!.status).toBe('completed');
    });

    it('checkIdempotency returns null for in_progress entries', async () => {
      await idempotencyService.startOperation('school-1', 'testOp', 'prog-key');
      const result = await idempotencyService.checkIdempotency('school-1', 'testOp', 'prog-key');
      expect(result).toBeNull();
    });

    it('markFailed marks entry as failed', async () => {
      const entry = await idempotencyService.startOperation('school-1', 'testOp', 'fail-key');
      await idempotencyService.markFailed(entry.recoveryOutcomeIdempotencyId, 'Something went wrong');
      const conflict = await idempotencyService.detectConflict('school-1', 'testOp', 'fail-key');
      expect(conflict.conflict).toBe(false);
    });

    it('failOperation via service method works', async () => {
      await idempotencyService.startOperation('school-1', 'testOp', 'failop-key');
      await idempotencyService.failOperation('school-1', 'testOp', 'failop-key', 'Operation failed');
      const result = await idempotencyService.checkIdempotency('school-1', 'testOp', 'failop-key');
      expect(result).toBeNull();
    });
  });

  describe('AuditBridge', () => {
    it('recordDecisionReadinessCreated creates audit event', async () => {
      await auditBridge.recordDecisionReadinessCreated('school-1', 'readiness-1', 'actor-1', 'teacher', 'req-1', 'corr-1');
      const events = await auditRepo.listBySchool('school-1');
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe('OUTCOME_DECISION_READINESS_CREATED');
    });

    it('recordExitCriteriaCreated creates audit event', async () => {
      await auditBridge.recordExitCriteriaCreated('school-2', 'ec-1', 'actor-2', 'admin');
      const events = await auditRepo.listBySchool('school-2');
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe('EXIT_CRITERIA_CREATED');
    });

    it('recordContinuationDraftCreated creates audit event', async () => {
      await auditBridge.recordContinuationDecisionDraftCreated('school-1', 'cd-1', 'actor-1', 'teacher');
      const events = await auditRepo.listBySchool('school-1');
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe('CONTINUATION_DECISION_DRAFT_CREATED');
    });

    it('audit events contain actorId, actorRole, eventType', async () => {
      await auditBridge.recordDecisionReadinessCreated('school-1', 'r1', 'actor-99', 'department_head', 'req-99', 'corr-99');
      const events = await auditRepo.listBySchool('school-1');
      const event = events[0];
      expect(event.actorId).toBe('actor-99');
      expect(event.actorRole).toBe('department_head');
      expect(event.eventType).toBe('OUTCOME_DECISION_READINESS_CREATED');
      expect(event.decision).toBe('allowed');
    });

    it('audit events contain requestId and correlationId when provided', async () => {
      await auditBridge.recordDecisionReadinessCreated('school-1', 'r2', 'a1', 'teacher', 'my-req-id', 'my-corr-id');
      const events = await auditRepo.listBySchool('school-1');
      const event = events[0];
      expect(event.requestId).toBe('my-req-id');
      expect(event.correlationId).toBe('my-corr-id');
    });

    it('audit events do not contain forbidden live mutation fields', async () => {
      await auditBridge.recordDecisionReadinessCreated('school-1', 'r3', 'a1', 'teacher');
      const events = await auditRepo.listBySchool('school-1');
      const event = events[0] as unknown as Record<string, unknown>;
      const forbiddenFields = ['liveRecoveryCompletionPayload', 'liveRecoveryClosurePayload', 'liveAssignmentPayload', 'scoreMutationPayload', 'masteryMutationPayload'];
      for (const field of forbiddenFields) {
        expect(event[field]).toBeUndefined();
      }
    });

    it('recordExitCriteriaEvaluationCreated creates audit event', async () => {
      await auditBridge.recordExitCriteriaEvaluationCreated('school-1', 'eval-1', 'actor-1', 'teacher');
      const events = await auditRepo.listBySchool('school-1');
      expect(events.some(e => e.eventType === 'EXIT_CRITERIA_EVALUATION_CREATED')).toBe(true);
    });

    it('recordPolicyBlocked creates denied audit event', async () => {
      await auditBridge.recordPolicyBlocked('school-1', 'POLICY_BLOCKED', 'actor-1', 'student', { reason: 'role blocked' });
      const events = await auditRepo.listBySchool('school-1');
      const blocked = events.find(e => e.decision === 'denied');
      expect(blocked).toBeDefined();
      expect(blocked!.eventType).toBe('POLICY_BLOCKED');
    });
  });

  describe('End-to-end idempotency via service calls', () => {
    it('duplicate request with same idempotencyKey returns conflict for readiness creation', async () => {
      const safety = new RecoveryOutcomeSafetyService();
      const idemSvc = new RecoveryOutcomeIdempotencyService(idempotencyRepo as any);
      const svc = new RecoveryOutcomeDecisionReadinessService(
        new InMemoryRecoveryOutcomeDecisionReadinessRepository(),
        safety, auditBridge, idemSvc,
      );

      const first = await svc.createDecisionReadiness(
        { schoolId: 'school-1', actorId: 'a1', actorRole: 'teacher', correlationId: 'c1', idempotencyKey: 'dup-readiness' },
        { schoolId: 'school-1', studentRef: 's1', resultRecoveryPlanId: 'p1', safeReadinessSummary: 'ok', readinessChecksJson: {}, sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' } },
      );
      expect(first.ok).toBe(true);

      const second = await svc.createDecisionReadiness(
        { schoolId: 'school-1', actorId: 'a1', actorRole: 'teacher', correlationId: 'c2', idempotencyKey: 'dup-readiness' },
        { schoolId: 'school-1', studentRef: 's1', resultRecoveryPlanId: 'p1', safeReadinessSummary: 'ok', readinessChecksJson: {}, sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' } },
      );
      expect(second.ok).toBe(false);
      expect(second.reasonCode).toBe('IDEMPOTENCY_CONFLICT');
    });

    it('duplicate idempotencyKey returns conflict for evaluation creation', async () => {
      const safety = new RecoveryOutcomeSafetyService();
      const idemSvc = new RecoveryOutcomeIdempotencyService(idempotencyRepo as any);
      const svc = new RecoveryExitCriteriaEvaluationService(
        new InMemoryRecoveryExitCriteriaEvaluationRepository() as any,
        safety, auditBridge, idemSvc,
      );

      const first = await svc.createExitCriteriaEvaluation(
        makeCtx({ idempotencyKey: 'dup-eval' }),
        { schoolId: 'school-1', studentRef: 's1', resultRecoveryPlanId: 'p1', recoveryExitCriteriaId: 'c1', evaluationResult: 'met', safeEvaluationSummary: 'ok', evaluationDetailsJson: {}, sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' } },
      );
      expect(first.ok).toBe(true);

      const second = await svc.createExitCriteriaEvaluation(
        makeCtx({ idempotencyKey: 'dup-eval' }),
        { schoolId: 'school-1', studentRef: 's1', resultRecoveryPlanId: 'p1', recoveryExitCriteriaId: 'c1', evaluationResult: 'met', safeEvaluationSummary: 'ok', evaluationDetailsJson: {}, sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' } },
      );
      expect(second.ok).toBe(false);
      expect(second.reasonCode).toBe('IDEMPOTENCY_CONFLICT');
    });

    it('duplicate idempotencyKey returns conflict for continuation draft', async () => {
      const safety = new RecoveryOutcomeSafetyService();
      const idemSvc = new RecoveryOutcomeIdempotencyService(idempotencyRepo as any);
      const svc = new RecoveryContinuationDecisionDraftService(
        new InMemoryRecoveryContinuationDecisionDraftRepository(),
        safety, auditBridge, idemSvc,
      );

      const input = { schoolId: 'school-1', studentRef: 's1', resultRecoveryPlanId: 'p1', safeDecisionSummary: 'ok', rationaleJson: {}, sourceRefsJson: { progressSummaryId: 'ps-1', evidenceRollupId: 'er-1' } } as any;

      const first = await svc.createContinuationDecisionDraft(makeCtx({ idempotencyKey: 'dup-cont' }), input);
      expect(first.ok).toBe(true);

      const second = await svc.createContinuationDecisionDraft(makeCtx({ idempotencyKey: 'dup-cont' }), input);
      expect(second.ok).toBe(false);
      expect(second.reasonCode).toBe('IDEMPOTENCY_CONFLICT');
    });
  });
});
