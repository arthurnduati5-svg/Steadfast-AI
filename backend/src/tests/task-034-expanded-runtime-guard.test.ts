import { describe, it, expect } from 'vitest';
import { evaluateTask034ExpandedRuntimeGuard } from '../services/task034ExpandedRuntimeGuardService';

describe('Task034 Expanded Runtime Guard', () => {
  it('All gates pass with default input', () => {
    const result = evaluateTask034ExpandedRuntimeGuard();
    expect(result.ok).toBe(true);
    expect(result.verifiedSchoolContextRequired).toBe(true);
    expect(result.task033AcceptedProofRequired).toBe(true);
    expect(result.approvedSchoolConfigRequired).toBe(true);
    expect(result.approvedContentContextRequired).toBe(true);
    expect(result.liveAiBlocked).toBe(true);
    expect(result.liveConnectorBlocked).toBe(true);
    expect(result.liveNotificationsBlocked).toBe(true);
  });

  it('verifiedSchoolContextRequired false blocks', () => {
    const result = evaluateTask034ExpandedRuntimeGuard({ verifiedSchoolContextRequired: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('verified_school_context_not_required');
  });

  it('task033AcceptedProofRequired false blocks', () => {
    const result = evaluateTask034ExpandedRuntimeGuard({ task033AcceptedProofRequired: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('task033_accepted_proof_not_required');
  });

  it('approvedSchoolConfigRequired false blocks', () => {
    const result = evaluateTask034ExpandedRuntimeGuard({ approvedSchoolConfigRequired: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('approved_school_config_not_required');
  });

  it('approvedContentContextRequired false blocks', () => {
    const result = evaluateTask034ExpandedRuntimeGuard({ approvedContentContextRequired: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('approved_content_context_not_required');
  });

  it('learnerMemoryBlockedBeforeSchoolContext false blocks', () => {
    const result = evaluateTask034ExpandedRuntimeGuard({ learnerMemoryBlockedBeforeSchoolContext: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('learner_memory_not_blocked_before_school_context');
  });

  it('aiBlockedBeforeAllGates false blocks', () => {
    const result = evaluateTask034ExpandedRuntimeGuard({ aiBlockedBeforeAllGates: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('ai_not_blocked_before_all_gates');
  });

  it('liveAiBlocked false blocks', () => {
    const result = evaluateTask034ExpandedRuntimeGuard({ liveAiBlocked: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('live_ai_not_blocked');
  });

  it('liveConnectorBlocked false blocks', () => {
    const result = evaluateTask034ExpandedRuntimeGuard({ liveConnectorBlocked: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('live_connector_not_blocked');
  });

  it('crossSchoolAccessBlocked false blocks', () => {
    const result = evaluateTask034ExpandedRuntimeGuard({ crossSchoolAccessBlocked: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('cross_school_access_not_blocked');
  });

  it('crossLearnerVisibilityBlocked false blocks', () => {
    const result = evaluateTask034ExpandedRuntimeGuard({ crossLearnerVisibilityBlocked: false });
    expect(result.ok).toBe(false);
  });

  it('parentRawDetailBlocked false blocks', () => {
    const result = evaluateTask034ExpandedRuntimeGuard({ parentRawDetailBlocked: false });
    expect(result.ok).toBe(false);
  });

  it('teacherOnlyLeakageBlocked false blocks', () => {
    const result = evaluateTask034ExpandedRuntimeGuard({ teacherOnlyLeakageBlocked: false });
    expect(result.ok).toBe(false);
  });

  it('unsafeDeenAuthorityBlocked false blocks', () => {
    const result = evaluateTask034ExpandedRuntimeGuard({ unsafeDeenAuthorityBlocked: false });
    expect(result.ok).toBe(false);
  });

  it('answerBotBehaviorBlocked false blocks', () => {
    const result = evaluateTask034ExpandedRuntimeGuard({ answerBotBehaviorBlocked: false });
    expect(result.ok).toBe(false);
  });

  it('Partial override keeps remaining defaults as true', () => {
    const result = evaluateTask034ExpandedRuntimeGuard({ liveAiBlocked: false });
    expect(result.verifiedSchoolContextRequired).toBe(true);
    expect(result.task033AcceptedProofRequired).toBe(true);
    expect(result.liveConnectorBlocked).toBe(true);
    expect(result.ok).toBe(false);
  });
});
