import { describe, it, expect } from 'vitest';
import {
  InMemoryResultRecoveryPracticeDraftRepository,
  InMemoryResultRecoveryAuditRepository,
  InMemoryResultRecoveryIdempotencyRepository,
} from '../repositories/inMemoryResultRecoveryRepositories';
import { ResultRecoveryPracticeDraftService } from '../services/resultRecoveryPracticeDraftService';
import { ResultRecoverySafetyService } from '../services/resultRecoverySafetyService';
import { ResultRecoveryAuditBridge } from '../services/resultRecoveryAuditBridge';
import { ResultRecoveryIdempotencyService } from '../services/resultRecoveryIdempotencyService';

function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    schoolId: 'school-001',
    actorId: 'teacher-001',
    actorRole: 'teacher',
    correlationId: 'corr-pd',
    ...overrides,
  } as any;
}

describe('Package 17 — Practice Draft Safety', () => {
  it('Practice draft can be created', async () => {
    const draftRepo = new InMemoryResultRecoveryPracticeDraftRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryPracticeDraftService(draftRepo as any, safety, auditBridge, idempotency);

    const result = await service.createPracticeDraft(makeCtx(), {
      resultRecoveryPlanId: 'plan-001',
      studentRef: 's1',
      safePracticeDraftSummary: 'Practice on quadratics',
      approvedContentRefsJson: { refs: ['q-001', 'q-002'] },
    });

    expect(result.ok).toBe(true);
    expect(result.resourceId).toBeDefined();
    expect(result.status).toBe('draft');
    expect(result.reasonCode).toBe('PRACTICE_DRAFT_CREATED');
  });

  it('Practice draft references existing question/objective IDs only', async () => {
    const safety = new ResultRecoverySafetyService();
    const safeInput = { questionRefsJson: { refs: ['q-001'] }, objectiveRefsJson: { refs: ['obj-001'] } };
    const check = safety.assertPracticeDraftUsesReferencesOnly(safeInput);
    expect(check.allowed).toBe(true);
    expect(check.reasonCode).toBe('SAFE');
  });

  it('Practice draft cannot contain generatedQuestionText', async () => {
    const safety = new ResultRecoverySafetyService();
    const check = safety.assertNoGeneratedQuestion({ generatedQuestionText: 'What is 2+2?' });
    expect(check.allowed).toBe(false);
    expect(check.reasonCode).toBe('GENERATED_QUESTION');
  });

  it('Practice draft cannot contain generatedAnswerKey', async () => {
    const safety = new ResultRecoverySafetyService();
    const check = safety.assertNoGeneratedAnswerKey({ generatedAnswerKey: 'Answer: 4' });
    expect(check.allowed).toBe(false);
    expect(check.reasonCode).toBe('GENERATED_ANSWER_KEY');
  });

  it('Practice draft can be marked review_ready', async () => {
    const draftRepo = new InMemoryResultRecoveryPracticeDraftRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryPracticeDraftService(draftRepo as any, safety, auditBridge, idempotency);

    const created = await service.createPracticeDraft(makeCtx(), { resultRecoveryPlanId: 'plan-rr', studentRef: 's1', safePracticeDraftSummary: 'Review' });
    const draftId = created.resourceId!;

    const rr = await service.markPracticeDraftReviewReady(makeCtx({ idempotencyKey: 'ik-pdrr' }), draftId, 'READY', 'Ready for review');
    expect(rr.ok).toBe(true);
    expect(rr.status).toBe('review_ready');
  });

  it('Practice draft can be approved_for_future_use', async () => {
    const draftRepo = new InMemoryResultRecoveryPracticeDraftRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryPracticeDraftService(draftRepo as any, safety, auditBridge, idempotency);

    const created = await service.createPracticeDraft(makeCtx(), { resultRecoveryPlanId: 'plan-app', studentRef: 's1', safePracticeDraftSummary: 'Approve' });
    const draftId = created.resourceId!;

    const app = await service.approvePracticeDraftForFutureUse(makeCtx({ idempotencyKey: 'ik-pdap' }), draftId, 'APPROVED', 'Approved');
    expect(app.ok).toBe(true);
    expect(app.status).toBe('approved_for_future_use');
  });

  it('Practice draft can be suppressed', async () => {
    const draftRepo = new InMemoryResultRecoveryPracticeDraftRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryPracticeDraftService(draftRepo as any, safety, auditBridge, idempotency);

    const created = await service.createPracticeDraft(makeCtx(), { resultRecoveryPlanId: 'plan-sup', studentRef: 's1', safePracticeDraftSummary: 'Suppress' });
    const draftId = created.resourceId!;

    const sup = await service.suppressPracticeDraft(makeCtx(), draftId, 'SUPPRESSED', 'Not needed');
    expect(sup.ok).toBe(true);
    expect(sup.status).toBe('suppressed');
  });

  it('Practice draft can be blocked', async () => {
    const draftRepo = new InMemoryResultRecoveryPracticeDraftRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryPracticeDraftService(draftRepo as any, safety, auditBridge, idempotency);

    const created = await service.createPracticeDraft(makeCtx(), { resultRecoveryPlanId: 'plan-blk', studentRef: 's1', safePracticeDraftSummary: 'Block' });
    const draftId = created.resourceId!;

    const blk = await service.blockPracticeDraft(makeCtx(), draftId, 'BLOCKED', 'Policy violation');
    expect(blk.ok).toBe(true);
    expect(blk.status).toBe('blocked');
  });

  it('Practice draft can be voided', async () => {
    const draftRepo = new InMemoryResultRecoveryPracticeDraftRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryPracticeDraftService(draftRepo as any, safety, auditBridge, idempotency);

    const created = await service.createPracticeDraft(makeCtx(), { resultRecoveryPlanId: 'plan-vd', studentRef: 's1', safePracticeDraftSummary: 'Void' });
    const draftId = created.resourceId!;

    const vd = await service.voidPracticeDraft(makeCtx(), draftId, 'VOIDED', 'Mistake');
    expect(vd.ok).toBe(true);
    expect(vd.status).toBe('void');
  });

  it('Practice draft does not assign practice live', async () => {
    const safety = new ResultRecoverySafetyService();
    const check = safety.assertNoPracticeAssignmentPayload({ practiceAssignmentPayload: 'live data' });
    expect(check.allowed).toBe(false);
    expect(check.reasonCode).toBe('PRACTICE_ASSIGNMENT_PAYLOAD');
  });

  it('Practice draft does not create new questions', async () => {
    const safety = new ResultRecoverySafetyService();
    const genQ = safety.assertNoGeneratedQuestion({ generatedQuestionText: 'new question' });
    expect(genQ.allowed).toBe(false);
    const genA = safety.assertNoGeneratedAnswerKey({ generatedAnswerKey: 'new answer' });
    expect(genA.allowed).toBe(false);
  });

  it('Practice draft does not call AI', async () => {
    const safety = new ResultRecoverySafetyService();
    const aiCheck = safety.assertNoAiNarrative({ aiNarrative: 'AI generated text' });
    expect(aiCheck.allowed).toBe(false);
    expect(aiCheck.reasonCode).toBe('AI_NARRATIVE');
  });
});
