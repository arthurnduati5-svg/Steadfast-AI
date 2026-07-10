import { describe, it, expect, beforeEach } from 'vitest';
import { runTask034Diagnostics } from '../services/task034DiagnosticsService';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034Diagnostics', () => {
  beforeEach(() => {
    task034Repository.clearTask034StoresForTests();
  });

  async function seedAllPassing(sessionId: string) {
    await task034Repository.saveTask033DependencyProof({ ok: true } as any);
    await task034Repository.saveEnvironmentGate({ ok: true } as any);
    await task034Repository.saveLimitedRolloutConfig({ ok: true } as any);
    await task034Repository.saveRolloutCapGate({ ok: true } as any);
    await task034Repository.saveExpandedCohortEligibility({ ok: true } as any);
    await task034Repository.saveStaffReadiness({ ok: true } as any);
    await task034Repository.saveLearnerNoticeReadiness({ ok: true } as any);
    await task034Repository.saveRolloutSession({ sessionId, status: 'created', rolloutStage: 'created' } as any);
    await task034Repository.saveRolloutEvent({ sessionId, eventId: 'evt_1', eventType: 'test', safeSummary: 'test', gateName: 'test', gatePassed: true } as any);
    await task034Repository.saveExpandedRuntimeGuard({ ok: true } as any);
    await task034Repository.saveHealthBudgetEscalation({ ok: true } as any);
    await task034Repository.saveIncidentEscalationBridge({ ok: true } as any);
    await task034Repository.saveRollbackProtection({ ok: true } as any);
    await task034Repository.savePrivacyReview({ ok: true } as any);
    await task034Repository.saveContentGovernanceReview({ ok: true } as any);
    await task034Repository.saveSocraticIntegrityReview({ ok: true } as any);
    await task034Repository.saveDeenBoundaryReview({ ok: true } as any);
    await task034Repository.saveSchoolIdentityReview({ ok: true } as any);
    await task034Repository.saveCrossSchoolDenialReview({ ok: true } as any);
    await task034Repository.saveSafeRolloutReadModel({ rolloutSessionId: sessionId, status: 'ok' } as any);
    await task034Repository.appendEvidenceEvent({ sessionId, eventId: 'evt_2', evidenceType: 'test', safeDescription: 'test', safeReasonCodes: [], timestamp: new Date().toISOString(), actorRole: 'internal_operator' });
    await task034Repository.saveReport({ verdict: 'TASK_034_PASS_LIMITED_ROLLOUT_READY' } as any);
  }

  it('returns ok:true when all gates pass', async () => {
    await seedAllPassing('session-pass');
    const result = await runTask034Diagnostics('session-pass');
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.sessionId).toBe('session-pass');
    expect(result.dependencyProofLoaded).toBe(true);
    expect(result.environmentGatePassed).toBe(true);
    expect(result.configPassed).toBe(true);
    expect(result.capGatePassed).toBe(true);
    expect(result.cohortEligibilityPassed).toBe(true);
    expect(result.staffReadinessPassed).toBe(true);
    expect(result.learnerNoticeReadinessPassed).toBe(true);
    expect(result.stateMachineConsistent).toBe(true);
  });

  it('reports blocking issues when dependency proof fails', async () => {
    await seedAllPassing('session-dep-fail');
    await task034Repository.saveTask033DependencyProof({ ok: false } as any);
    const result = await runTask034Diagnostics('session-dep-fail');
    expect(result.ok).toBe(false);
    expect(result.dependencyProofLoaded).toBe(false);
    expect(result.blockingIssues).toContain('dependency_proof_not_loaded');
  });

  it('reports blocking issues when environment gate fails', async () => {
    await seedAllPassing('session-env-fail');
    await task034Repository.saveEnvironmentGate({ ok: false } as any);
    const result = await runTask034Diagnostics('session-env-fail');
    expect(result.ok).toBe(false);
    expect(result.environmentGatePassed).toBe(false);
    expect(result.blockingIssues).toContain('environment_gate_failed');
  });

  it('reports blocking issues when config fails', async () => {
    await seedAllPassing('session-cfg-fail');
    await task034Repository.saveLimitedRolloutConfig({ ok: false } as any);
    const result = await runTask034Diagnostics('session-cfg-fail');
    expect(result.ok).toBe(false);
    expect(result.configPassed).toBe(false);
    expect(result.blockingIssues).toContain('config_failed');
  });

  it('reports blocking issues when cap gate fails', async () => {
    await seedAllPassing('session-cap-fail');
    await task034Repository.saveRolloutCapGate({ ok: false } as any);
    const result = await runTask034Diagnostics('session-cap-fail');
    expect(result.ok).toBe(false);
    expect(result.capGatePassed).toBe(false);
    expect(result.blockingIssues).toContain('cap_gate_failed');
  });

  it('reports blocking issues when cohort eligibility fails', async () => {
    await seedAllPassing('session-coh-fail');
    await task034Repository.saveExpandedCohortEligibility({ ok: false } as any);
    const result = await runTask034Diagnostics('session-coh-fail');
    expect(result.ok).toBe(false);
    expect(result.cohortEligibilityPassed).toBe(false);
    expect(result.blockingIssues).toContain('cohort_eligibility_failed');
  });

  it('reports blocking issues when staff readiness fails', async () => {
    await seedAllPassing('session-sr-fail');
    await task034Repository.saveStaffReadiness({ ok: false } as any);
    const result = await runTask034Diagnostics('session-sr-fail');
    expect(result.ok).toBe(false);
    expect(result.staffReadinessPassed).toBe(false);
    expect(result.blockingIssues).toContain('staff_readiness_failed');
  });

  it('reports blocking issues when learner notice readiness fails', async () => {
    await seedAllPassing('session-lnr-fail');
    await task034Repository.saveLearnerNoticeReadiness({ ok: false } as any);
    const result = await runTask034Diagnostics('session-lnr-fail');
    expect(result.ok).toBe(false);
    expect(result.learnerNoticeReadinessPassed).toBe(false);
    expect(result.blockingIssues).toContain('learner_notice_readiness_failed');
  });

  it('reports blocking issues when session is blocked', async () => {
    await seedAllPassing('session-blocked');
    await task034Repository.saveRolloutSession({ sessionId: 'session-blocked', status: 'blocked', rolloutStage: 'blocked' } as any);
    const result = await runTask034Diagnostics('session-blocked');
    expect(result.ok).toBe(false);
    expect(result.stateMachineConsistent).toBe(false);
    expect(result.blockingIssues).toContain('state_machine_inconsistent');
  });

  it('includes runtime and health fields in result', async () => {
    await seedAllPassing('session-meta');
    const result = await runTask034Diagnostics('session-meta');
    expect(result.runtimeGuardWorking).toBe(true);
    expect(result.healthBudgetWorking).toBe(true);
    expect(result.incidentEscalationWorking).toBe(true);
    expect(result.rollbackProtectionWorking).toBe(true);
  });

  it('includes review fields in result', async () => {
    await seedAllPassing('session-review');
    const result = await runTask034Diagnostics('session-review');
    expect(result.privacyReviewWorking).toBe(true);
    expect(result.contentGovernanceReviewWorking).toBe(true);
    expect(result.socraticReviewWorking).toBe(true);
    expect(result.deenReviewWorking).toBe(true);
  });

  it('includes identity and evidence fields in result', async () => {
    await seedAllPassing('session-id');
    const result = await runTask034Diagnostics('session-id');
    expect(result.schoolIdentityReviewWorking).toBe(true);
    expect(result.crossSchoolDenialReviewWorking).toBe(true);
    expect(result.safeReadModelWorking).toBe(true);
    expect(result.evidenceLedgerWorking).toBe(true);
    expect(result.reportGenerationWorking).toBe(true);
  });

  it('returns diagnosticDetails with all gate statuses', async () => {
    await seedAllPassing('session-details');
    const result = await runTask034Diagnostics('session-details');
    expect(result.diagnosticDetails).toBeDefined();
    expect(result.diagnosticDetails.dependencyProof).toEqual({ ok: true });
    expect(result.diagnosticDetails.environmentGate).toEqual({ ok: true });
    expect(result.diagnosticDetails.runtimeGuard).toEqual({ ok: true });
    expect(result.diagnosticDetails.events).toHaveProperty('count');
  });
});
