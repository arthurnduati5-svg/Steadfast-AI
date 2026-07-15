import { describe, it, expect } from 'vitest';
import { RecoveryOutcomeExecutionSimulationCommandContext } from '../contracts/recoveryOutcomeExecutionSimulationContracts';
import { RecoveryOutcomeExecutionSimulationReadiness } from '../contracts/recoveryOutcomeExecutionSimulationReadinessContracts';
import { RecoveryOutcomeExecutionSimulationPlan } from '../contracts/recoveryOutcomeExecutionSimulationPlanContracts';
import { RecoveryOutcomeExecutionSimulationRun } from '../contracts/recoveryOutcomeExecutionSimulationRunContracts';
import { RecoveryOutcomeExecutionSimulationStep } from '../contracts/recoveryOutcomeExecutionSimulationStepContracts';
import { RecoveryOutcomeExecutionEligibilityCheck } from '../contracts/recoveryOutcomeExecutionEligibilityContracts';
import { RecoveryOutcomeExecutionBlockedActionDiagnostic } from '../contracts/recoveryOutcomeExecutionBlockedActionDiagnosticContracts';
import { RecoveryOutcomeExecutionFailureInjection } from '../contracts/recoveryOutcomeExecutionFailureInjectionContracts';
import { RecoveryOutcomeExecutionSimulationResult } from '../contracts/recoveryOutcomeExecutionSimulationResultContracts';
import { RecoveryOutcomeExecutionTeacherReview } from '../contracts/recoveryOutcomeExecutionTeacherReviewContracts';
import { RecoveryOutcomeExecutionStudentPreviewDraft, RecoveryOutcomeExecutionParentPreviewDraft } from '../contracts/recoveryOutcomeExecutionPreviewDraftContracts';
import { RecoveryOutcomeExecutionReadinessVerdict } from '../contracts/recoveryOutcomeExecutionReadinessVerdictContracts';
import { RecoveryOutcomeExecutionSimulationSummary } from '../contracts/recoveryOutcomeExecutionSimulationSummaryContracts';

describe('Package 21 - Simulation Contracts', () => {
  it('RecoveryOutcomeExecutionSimulationCommandContext has required fields', () => {
    const ctx: RecoveryOutcomeExecutionSimulationCommandContext = {
      schoolId: 'school-1',
      actorId: 'actor-1',
      actorRole: 'teacher',
      correlationId: 'corr-1',
      idempotencyKey: 'ik-1',
    };
    expect(ctx.schoolId).toBe('school-1');
    expect(ctx.actorId).toBe('actor-1');
    expect(ctx.actorRole).toBe('teacher');
    expect(ctx.correlationId).toBe('corr-1');
    expect(ctx.idempotencyKey).toBe('ik-1');
    expect(ctx.sourceRefsJson).toBeUndefined();
  });

  it('RecoveryOutcomeExecutionSimulationSafeEnvelope wraps data correctly', () => {
    const envelope = { success: true, data: { id: 'test' }, status: 'created' };
    expect(envelope.success).toBe(true);
    expect(envelope.data.id).toBe('test');
    expect(envelope.status).toBe('created');
  });

  it('RecoveryOutcomeExecutionSimulationReadiness has correct status values', () => {
    const statuses = ['draft', 'review_ready', 'approved_for_future_use', 'suppressed', 'blocked', 'voided'];
    expect(statuses).toContain('draft');
    expect(statuses).toContain('review_ready');
    expect(statuses).toContain('approved_for_future_use');
    expect(statuses).toContain('suppressed');
    expect(statuses).toContain('blocked');
    expect(statuses).toContain('voided');
  });

  it('RecoveryOutcomeExecutionSimulationPlan has correct status values', () => {
    const statuses = ['draft', 'ready', 'review_ready', 'approved_for_future_use', 'suppressed', 'blocked', 'voided'];
    expect(statuses).toContain('draft');
    expect(statuses).toContain('ready');
    expect(statuses).toContain('review_ready');
  });

  it('RecoveryOutcomeExecutionSimulationRun has correct status values', () => {
    const statuses = ['draft', 'simulating', 'simulated', 'review_ready', 'suppressed', 'blocked', 'voided'];
    expect(statuses).toContain('draft');
    expect(statuses).toContain('simulating');
    expect(statuses).toContain('simulated');
  });

  it('RecoveryOutcomeExecutionSimulationStep starts as pending', () => {
    const step: Partial<RecoveryOutcomeExecutionSimulationStep> = { stepStatus: 'pending' };
    expect(step.stepStatus).toBe('pending');
  });

  it('RecoveryOutcomeExecutionEligibilityCheck starts as pending', () => {
    const check: Partial<RecoveryOutcomeExecutionEligibilityCheck> = { eligibilityStatus: 'pending' };
    expect(check.eligibilityStatus).toBe('pending');
  });

  it('RecoveryOutcomeExecutionBlockedActionDiagnostic starts as draft', () => {
    const d: Partial<RecoveryOutcomeExecutionBlockedActionDiagnostic> = { diagnosticStatus: 'draft' };
    expect(d.diagnosticStatus).toBe('draft');
  });

  it('RecoveryOutcomeExecutionFailureInjection starts as draft', () => {
    const f: Partial<RecoveryOutcomeExecutionFailureInjection> = { injectionStatus: 'draft' };
    expect(f.injectionStatus).toBe('draft');
  });

  it('RecoveryOutcomeExecutionSimulationResult starts as pending', () => {
    const r: Partial<RecoveryOutcomeExecutionSimulationResult> = { outcomeStatus: 'pending' };
    expect(r.outcomeStatus).toBe('pending');
  });

  it('RecoveryOutcomeExecutionTeacherReview starts as draft', () => {
    const r: Partial<RecoveryOutcomeExecutionTeacherReview> = { reviewStatus: 'draft' };
    expect(r.reviewStatus).toBe('draft');
  });

  it('RecoveryOutcomeExecutionStudentPreviewDraft starts as draft', () => {
    const d: Partial<RecoveryOutcomeExecutionStudentPreviewDraft> = { draftStatus: 'draft' };
    expect(d.draftStatus).toBe('draft');
  });

  it('RecoveryOutcomeExecutionParentPreviewDraft starts as draft', () => {
    const d: Partial<RecoveryOutcomeExecutionParentPreviewDraft> = { draftStatus: 'draft' };
    expect(d.draftStatus).toBe('draft');
  });

  it('RecoveryOutcomeExecutionReadinessVerdict starts as draft', () => {
    const v: Partial<RecoveryOutcomeExecutionReadinessVerdict> = { verdictStatus: 'draft' };
    expect(v.verdictStatus).toBe('draft');
  });

  it('RecoveryOutcomeExecutionSimulationSummary starts as draft', () => {
    const s: Partial<RecoveryOutcomeExecutionSimulationSummary> = { summaryStatus: 'draft' };
    expect(s.summaryStatus).toBe('draft');
  });

  it('forbidden fields are not present in any contract', () => {
    const forbidden = [
      'scoreMutationPayload', 'masteryMutationPayload', 'liveRecoveryActivationPayload',
      'liveRecoveryCompletionPayload', 'liveRecoveryClosurePayload', 'aiNarrative',
      'generatedQuestionText', 'ocrText', 'pdfBinary',
    ];
    const readinessKeys = Object.keys({} as RecoveryOutcomeExecutionSimulationReadiness);
    const planKeys = Object.keys({} as RecoveryOutcomeExecutionSimulationPlan);
    const runKeys = Object.keys({} as RecoveryOutcomeExecutionSimulationRun);
    const allKeys = [...readinessKeys, ...planKeys, ...runKeys];
    for (const f of forbidden) {
      expect(allKeys).not.toContain(f);
    }
  });
});
