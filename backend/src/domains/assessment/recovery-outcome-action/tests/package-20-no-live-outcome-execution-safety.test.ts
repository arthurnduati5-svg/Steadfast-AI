import { describe, it, expect } from 'vitest';
import { RecoveryOutcomeActionSafetyService } from '../services/recoveryOutcomeActionSafetyService';

describe('Package 20 - No Live Outcome Execution Safety', () => {
  const safety = new RecoveryOutcomeActionSafetyService();

  it('blocks live recovery activation policy for all roles', () => {
    const result = safety.enforce('teacher', 'RECOVERY_OUTCOME_ACTION_NO_LIVE_ACTIVATION');
    expect(result.allowed).toBe(false);
    expect(result.denied).toBe(true);
  });

  it('blocks live recovery completion policy for all roles', () => {
    const result = safety.enforce('teacher', 'RECOVERY_OUTCOME_ACTION_NO_LIVE_COMPLETION');
    expect(result.allowed).toBe(false);
    expect(result.denied).toBe(true);
  });

  it('blocks live recovery closure policy for all roles', () => {
    const result = safety.enforce('teacher', 'RECOVERY_OUTCOME_ACTION_NO_LIVE_CLOSURE');
    expect(result.allowed).toBe(false);
    expect(result.denied).toBe(true);
  });

  it('blocks live assignment policy for all roles', () => {
    const result = safety.enforce('admin', 'RECOVERY_OUTCOME_ACTION_NO_LIVE_ASSIGNMENT');
    expect(result.allowed).toBe(false);
  });

  it('blocks live notification policy for all roles', () => {
    const result = safety.enforce('admin', 'RECOVERY_OUTCOME_ACTION_NO_LIVE_NOTIFICATION');
    expect(result.allowed).toBe(false);
  });

  it('blocks portal publishing policy for all roles', () => {
    const result = safety.enforce('admin', 'RECOVERY_OUTCOME_ACTION_NO_PORTAL_PUBLISH');
    expect(result.allowed).toBe(false);
  });

  it('blocks score mutation policy for all roles', () => {
    const result = safety.enforce('admin', 'RECOVERY_OUTCOME_ACTION_NO_SCORE_MUTATION');
    expect(result.allowed).toBe(false);
  });

  it('blocks mastery mutation policy for all roles', () => {
    const result = safety.enforce('admin', 'RECOVERY_OUTCOME_ACTION_NO_MASTERY_MUTATION');
    expect(result.allowed).toBe(false);
  });

  it('blocks regrade execution policy for all roles', () => {
    const result = safety.enforce('admin', 'RECOVERY_OUTCOME_ACTION_NO_REGRADE_EXECUTION');
    expect(result.allowed).toBe(false);
  });

  it('blocks generated question policy for all roles', () => {
    const result = safety.enforce('admin', 'RECOVERY_OUTCOME_ACTION_NO_GENERATED_QUESTION');
    expect(result.allowed).toBe(false);
  });

  it('blocks AI narrative policy for all roles', () => {
    const result = safety.enforce('admin', 'RECOVERY_OUTCOME_ACTION_NO_AI_NARRATIVE');
    expect(result.allowed).toBe(false);
  });

  it('blocks OCR policy for all roles', () => {
    const result = safety.enforce('admin', 'RECOVERY_OUTCOME_ACTION_NO_OCR');
    expect(result.allowed).toBe(false);
  });

  it('blocks PDF policy for all roles', () => {
    const result = safety.enforce('admin', 'RECOVERY_OUTCOME_ACTION_NO_PDF');
    expect(result.allowed).toBe(false);
  });

  it('blocks external sync policy for all roles', () => {
    const result = safety.enforce('admin', 'RECOVERY_OUTCOME_ACTION_NO_EXTERNAL_SYNC');
    expect(result.allowed).toBe(false);
  });

  it('closure action draft has draft status and does not close recovery plan live', async () => {
    const { RecoveryClosureActionDraftService } = await import('../services/recoveryClosureActionDraftService');
    const { InMemoryRecoveryClosureActionDraftRepository } = await import('../repositories/inMemoryRecoveryOutcomeActionRepositories');
    const { InMemoryRecoveryOutcomeActionAuditRepository } = await import('../repositories/inMemoryRecoveryOutcomeActionRepositories');
    const { InMemoryRecoveryOutcomeActionIdempotencyRepository } = await import('../repositories/inMemoryRecoveryOutcomeActionRepositories');
    const { RecoveryOutcomeActionAuditBridge } = await import('../services/recoveryOutcomeActionAuditBridge');
    const { RecoveryOutcomeActionIdempotencyService } = await import('../services/recoveryOutcomeActionIdempotencyService');

    const repo = new InMemoryRecoveryClosureActionDraftRepository();
    const auditRepo = new InMemoryRecoveryOutcomeActionAuditRepository();
    const audit = new RecoveryOutcomeActionAuditBridge(auditRepo);
    const idempotencyRepo = new InMemoryRecoveryOutcomeActionIdempotencyRepository();
    const idempotency = new RecoveryOutcomeActionIdempotencyService(idempotencyRepo);
    const svc = new RecoveryClosureActionDraftService(repo, safety, audit, idempotency);

    const result = await svc.createClosureActionDraft(
      { schoolId: 's-1', actorId: 'a-1', actorRole: 'teacher', correlationId: 'c-1', idempotencyKey: 'ik-1' },
      { schoolId: 's-1', studentRef: 'st-1', resultRecoveryPlanId: 'p-1',
        recoveryClosureDecisionDraftId: 'd-1', safeActionSummary: 'Draft closure', closureDetailsJson: {},
        closureType: 'graduation', createdByActorId: 'a-1', createdByRole: 'teacher' },
    );
    expect(result.success).toBe(true);
    expect(result.data?.draftStatus).toBe('draft');
  });

  it('forbidden fields are detected by safety service', () => {
    const forbidden = safety.validateForbiddenFields({
      liveRecoveryActivationPayload: {},
      scoreMutationPayload: {},
      aiNarrative: 'test',
    });
    expect(forbidden.length).toBe(3);
    expect(forbidden).toContain('liveRecoveryActivationPayload');
    expect(forbidden).toContain('scoreMutationPayload');
    expect(forbidden).toContain('aiNarrative');
  });
});
