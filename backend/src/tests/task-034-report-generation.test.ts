import { describe, it, expect, beforeEach } from 'vitest';
import { generateTask034Report } from '../services/task034ControlledLimitedRolloutReportService';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034ReportGeneration', () => {
  beforeEach(() => {
    task034Repository.clearTask034StoresForTests();
  });

  async function seedAllPassing(sessionId: string) {
    await task034Repository.saveTask033DependencyProof({ ok: true, reportFound: true, opsReportFound: true, verdict: 'ACCEPTED_READY_YES', safeToStartTask034: true, safeToStartTask035: false, safeToStartTask040: false, task033FocusedTestsPassed: true, task033RouteContractsPassed: true, task033RoleSecurityTestsPassed: true, task033ContinuityTestsPassed: true, task033NoStarSafetyTestsPassed: true, task033VerificationScriptPassed: true, task020To032RegressionPassed: true, phase3RegressionPassed: true, fullBackendSuitePassed: true, backendTypecheckPassed: true, backendBuildPassed: true, prismaValidatePassed: true, prismaGeneratePassed: true, privacyScanPassed: true, noProductionMutationScanPassed: true, noLiveConnectorAiScanPassed: true, noLiveNotificationScanPassed: true, noFrontendUiScanPassed: true, noTask034ToTask040ScanPassed: true, noFalsePassScanPassed: true, noTask034ImplementationInTask033: true, noFrontendUiInTask033: true, noLiveAiConnectorNotificationInTask033: true, remainingBlockers: [], blockingIssues: [] } as any);
    await task034Repository.saveEnvironmentGate({ ok: true } as any);
    await task034Repository.saveLimitedRolloutConfig({ ok: true } as any);
    await task034Repository.saveRolloutCapGate({ ok: true } as any);
    await task034Repository.saveExpandedCohortEligibility({ ok: true } as any);
    await task034Repository.saveStaffReadiness({ ok: true } as any);
    await task034Repository.saveLearnerNoticeReadiness({ ok: true } as any);
    await task034Repository.saveRolloutSession({ sessionId, status: 'limited_rollout_active_internal', rolloutStage: 'limited_rollout_active_internal', activationId: 'act_1', schoolId: 'school_1', tenantId: 'tenant_1', cohortId: 'cohort_1', actorRole: 'internal_operator', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), blockingIssues: [] } as any);
    await task034Repository.saveRolloutEvent({ sessionId, eventId: 'evt_1', eventType: 'gate_check', safeSummary: 'passed', gateName: 'runtime_guard', gatePassed: true, activationId: 'act_1', schoolId: 'school_1', actorRole: 'internal_operator', safeActorHash: 'hash', safeStudentHash: 'hash', cohortId: 'cohort_1', classId: 'class_1', subjectId: 'subj_1', safeReasonCodes: [], latencyMs: 10, errorCategory: 'none', createdAt: new Date().toISOString() } as any);
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
    await task034Repository.appendEvidenceEvent({ sessionId, eventId: 'evt_2', evidenceType: 'gate_pass', safeDescription: 'all gates passed', safeReasonCodes: ['runtime_guard_passed'], timestamp: new Date().toISOString(), actorRole: 'internal_operator' });
  }

  it('returns report with task034 metadata', async () => {
    await seedAllPassing('session-rpt');
    const report = await generateTask034Report('session-rpt');
    expect(report.taskId).toBe('034');
    expect(report.scope).toBe('controlled_limited_rollout');
    expect(report.generatedAt).toBeDefined();
    expect(typeof report.generatedAt).toBe('string');
  });

  it('sets task033DependencyVerified when proof is present', async () => {
    await seedAllPassing('session-dep');
    const report = await generateTask034Report('session-dep');
    expect(report.task033DependencyVerified).toBe(true);
    expect(report.task033DependencyCommit).toBe('276445d');
  });

  it('sets task034Started when session has started', async () => {
    await seedAllPassing('session-started');
    const report = await generateTask034Report('session-started');
    expect(report.task034Started).toBe(true);
    expect(report.controlledLimitedRolloutCreated).toBe(true);
  });

  it('sets safeToStartTask035 based on all gates', async () => {
    await seedAllPassing('session-safe');
    const report = await generateTask034Report('session-safe');
    expect(report.safeToStartTask035).toBe(true);
    expect(report.verdict).toBe('TASK_034_PASS_LIMITED_ROLLOUT_READY');
  });

  it('safeToStartTask040 is always false', async () => {
    await seedAllPassing('session-040');
    const report = await generateTask034Report('session-040');
    expect(report.safeToStartTask040).toBe(false);
  });

  it('includes commandsRun array', async () => {
    await seedAllPassing('session-cmd');
    const report = await generateTask034Report('session-cmd');
    expect(report.commandsRun).toBeInstanceOf(Array);
    expect(report.commandsRun.length).toBeGreaterThan(0);
    expect(report.commandsRun).toContain('evaluateTask034ExpandedRuntimeGuard');
    expect(report.commandsRun).toContain('generateTask034Report');
  });

  it('includes filesCreated array', async () => {
    await seedAllPassing('session-files');
    const report = await generateTask034Report('session-files');
    expect(report.filesCreated).toBeInstanceOf(Array);
    expect(report.filesCreated.length).toBeGreaterThan(0);
    expect(report.filesCreated).toContain('backend/src/services/task034DiagnosticsService.ts');
  });

  it('sets all pass-through gate booleans from diagnostics', async () => {
    await seedAllPassing('session-gates');
    const report = await generateTask034Report('session-gates');
    expect(report.rolloutEnvironmentGatePassed).toBe(true);
    expect(report.limitedRolloutConfigPassed).toBe(true);
    expect(report.rolloutCapGatePassed).toBe(true);
    expect(report.expandedCohortEligibilityPassed).toBe(true);
    expect(report.staffReadinessPassed).toBe(true);
    expect(report.learnerNoticeReadinessPassed).toBe(true);
  });

  it('sets review gate booleans from services', async () => {
    await seedAllPassing('session-reviews');
    const report = await generateTask034Report('session-reviews');
    expect(report.expandedRuntimeGuardPassed).toBe(true);
    expect(report.healthBudgetEscalationPassed).toBe(true);
    expect(report.incidentEscalationBridgePassed).toBe(true);
    expect(report.rollbackProtectionPassed).toBe(true);
    expect(report.privacyReviewPassed).toBe(true);
    expect(report.contentGovernanceReviewPassed).toBe(true);
  });

  it('sets remainingBlockers when gates fail', async () => {
    await seedAllPassing('session-blocked');
    await task034Repository.savePrivacyReview({ ok: false } as any);
    await task034Repository.saveSocraticIntegrityReview({ ok: false } as any);
    const report = await generateTask034Report('session-blocked');
    expect(report.safeToStartTask035).toBe(false);
    expect(report.verdict).toBe('TASK_034_BLOCKED');
    expect(report.remainingBlockers).toContain('privacy_review_not_passed');
    expect(report.remainingBlockers).toContain('socratic_integrity_review_not_passed');
  });
});
