import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryRecoveryContinuationActionDraftRepository,
  InMemoryRecoveryIntensificationActionDraftRepository,
  InMemoryRecoveryPauseActionDraftRepository,
  InMemoryRecoveryClosureActionDraftRepository,
  InMemoryRecoveryOutcomeActionAuditRepository,
  InMemoryRecoveryOutcomeActionIdempotencyRepository,
} from '../repositories/inMemoryRecoveryOutcomeActionRepositories';
import { RecoveryContinuationActionDraftService } from '../services/recoveryContinuationActionDraftService';
import { RecoveryIntensificationActionDraftService } from '../services/recoveryIntensificationActionDraftService';
import { RecoveryPauseActionDraftService } from '../services/recoveryPauseActionDraftService';
import { RecoveryClosureActionDraftService } from '../services/recoveryClosureActionDraftService';
import { RecoveryOutcomeActionSafetyService } from '../services/recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from '../services/recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from '../services/recoveryOutcomeActionIdempotencyService';
import { RecoveryOutcomeActionCommandContext } from '../contracts/recoveryOutcomeActionContracts';

describe('Package 20 - Action Drafts Safety', () => {
  let ctx: RecoveryOutcomeActionCommandContext;
  let safety: RecoveryOutcomeActionSafetyService;

  beforeEach(() => {
    ctx = { schoolId: 'school-1', actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
    safety = new RecoveryOutcomeActionSafetyService();
  });

  function createServices(repo: any, serviceClass: any) {
    const auditRepo = new InMemoryRecoveryOutcomeActionAuditRepository();
    const audit = new RecoveryOutcomeActionAuditBridge(auditRepo);
    const idempotencyRepo = new InMemoryRecoveryOutcomeActionIdempotencyRepository();
    const idempotency = new RecoveryOutcomeActionIdempotencyService(idempotencyRepo);
    return new serviceClass(repo, safety, audit, idempotency);
  }

  it('continuation action draft requires Package 19 ref', async () => {
    const service = createServices(new InMemoryRecoveryContinuationActionDraftRepository(), RecoveryContinuationActionDraftService);
    const result = await service.createContinuationActionDraft(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      recoveryContinuationDecisionDraftId: '',
      safeActionSummary: 'Test', actionDetailsJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(result.success).toBe(false);
  });

  it('intensification action draft requires Package 19 ref', async () => {
    const service = createServices(new InMemoryRecoveryIntensificationActionDraftRepository(), RecoveryIntensificationActionDraftService);
    const result = await service.createIntensificationActionDraft(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      recoveryIntensificationDecisionDraftId: '',
      safeActionSummary: 'Test', intensificationDetailsJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(result.success).toBe(false);
  });

  it('pause action draft requires Package 19 ref', async () => {
    const service = createServices(new InMemoryRecoveryPauseActionDraftRepository(), RecoveryPauseActionDraftService);
    const result = await service.createPauseActionDraft(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      recoveryPauseDecisionDraftId: '',
      safeActionSummary: 'Test', pauseDetailsJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(result.success).toBe(false);
  });

  it('closure action draft requires Package 19 ref', async () => {
    const service = createServices(new InMemoryRecoveryClosureActionDraftRepository(), RecoveryClosureActionDraftService);
    const result = await service.createClosureActionDraft(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      recoveryClosureDecisionDraftId: '',
      safeActionSummary: 'Test', closureDetailsJson: {}, closureType: 'graduation',
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(result.success).toBe(false);
  });

  it('all draft types block student/parent roles', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const parentCtx = { ...ctx, actorRole: 'parent' };
    const guestCtx = { ...ctx, actorRole: 'guest' };

    const draftServices = [
      [new InMemoryRecoveryContinuationActionDraftRepository(), RecoveryContinuationActionDraftService, 'createContinuationActionDraft', { recoveryContinuationDecisionDraftId: 'd-1', safeActionSummary: 'T', actionDetailsJson: {} }],
      [new InMemoryRecoveryIntensificationActionDraftRepository(), RecoveryIntensificationActionDraftService, 'createIntensificationActionDraft', { recoveryIntensificationDecisionDraftId: 'd-1', safeActionSummary: 'T', intensificationDetailsJson: {} }],
      [new InMemoryRecoveryPauseActionDraftRepository(), RecoveryPauseActionDraftService, 'createPauseActionDraft', { recoveryPauseDecisionDraftId: 'd-1', safeActionSummary: 'T', pauseDetailsJson: {} }],
      [new InMemoryRecoveryClosureActionDraftRepository(), RecoveryClosureActionDraftService, 'createClosureActionDraft', { recoveryClosureDecisionDraftId: 'd-1', safeActionSummary: 'T', closureDetailsJson: {}, closureType: 'graduation' }],
    ] as const;

    for (const [repo, Cls, method, extra] of draftServices) {
      const auditRepo = new InMemoryRecoveryOutcomeActionAuditRepository();
      const audit = new RecoveryOutcomeActionAuditBridge(auditRepo);
      const idempotencyRepo = new InMemoryRecoveryOutcomeActionIdempotencyRepository();
      const idempotency = new RecoveryOutcomeActionIdempotencyService(idempotencyRepo);
      const svc = new (Cls as any)(repo, safety, audit, idempotency);

      const baseReq = { schoolId: 's-1', studentRef: 'st-1', resultRecoveryPlanId: 'p-1', createdByActorId: 'a-1', createdByRole: 'student', ...extra as any };
      const studentResult = await svc[method as string](studentCtx, baseReq);
      expect(studentResult.success).toBe(false);

      const parentReq = { ...baseReq, createdByRole: 'parent' };
      const parentResult = await svc[method as string](parentCtx, parentReq);
      expect(parentResult.success).toBe(false);
    }
  });

  it('all draft types are created in draft status', async () => {
    const auditRepo = new InMemoryRecoveryOutcomeActionAuditRepository();
    const audit = new RecoveryOutcomeActionAuditBridge(auditRepo);
    const idempotencyRepo = new InMemoryRecoveryOutcomeActionIdempotencyRepository();
    const idempotency = new RecoveryOutcomeActionIdempotencyService(idempotencyRepo);

    const cont = new RecoveryContinuationActionDraftService(
      new InMemoryRecoveryContinuationActionDraftRepository(), safety, audit, idempotency);
    const contResult = await cont.createContinuationActionDraft({ ...ctx, idempotencyKey: 'ik-cont' }, {
      schoolId: 's-1', studentRef: 'st-1', resultRecoveryPlanId: 'p-1',
      recoveryContinuationDecisionDraftId: 'd-1', safeActionSummary: 'Test', actionDetailsJson: {},
      createdByActorId: 'a-1', createdByRole: 'teacher',
    });
    expect(contResult.data?.draftStatus).toBe('draft');

    const intens = new RecoveryIntensificationActionDraftService(
      new InMemoryRecoveryIntensificationActionDraftRepository(), safety, audit, idempotency);
    const intResult = await intens.createIntensificationActionDraft({ ...ctx, idempotencyKey: 'ik-int' }, {
      schoolId: 's-1', studentRef: 'st-1', resultRecoveryPlanId: 'p-1',
      recoveryIntensificationDecisionDraftId: 'd-1', safeActionSummary: 'Test', intensificationDetailsJson: {},
      createdByActorId: 'a-1', createdByRole: 'teacher',
    });
    expect(intResult.data?.draftStatus).toBe('draft');

    const pause = new RecoveryPauseActionDraftService(
      new InMemoryRecoveryPauseActionDraftRepository(), safety, audit, idempotency);
    const pauseResult = await pause.createPauseActionDraft({ ...ctx, idempotencyKey: 'ik-pause' }, {
      schoolId: 's-1', studentRef: 'st-1', resultRecoveryPlanId: 'p-1',
      recoveryPauseDecisionDraftId: 'd-1', safeActionSummary: 'Test', pauseDetailsJson: {},
      createdByActorId: 'a-1', createdByRole: 'teacher',
    });
    expect(pauseResult.data?.draftStatus).toBe('draft');

    const closure = new RecoveryClosureActionDraftService(
      new InMemoryRecoveryClosureActionDraftRepository(), safety, audit, idempotency);
    const closeResult = await closure.createClosureActionDraft({ ...ctx, idempotencyKey: 'ik-closure' }, {
      schoolId: 's-1', studentRef: 'st-1', resultRecoveryPlanId: 'p-1',
      recoveryClosureDecisionDraftId: 'd-1', safeActionSummary: 'Test', closureDetailsJson: {}, closureType: 'graduation',
      createdByActorId: 'a-1', createdByRole: 'teacher',
    });
    expect(closeResult.data?.draftStatus).toBe('draft');
  });
});
